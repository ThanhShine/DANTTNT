import { Request, Response, NextFunction } from 'express';
import { RowDataPacket } from 'mysql2';
import { queryOne, execute } from '../config/database';
import { sendSuccess, sendBadRequest, sendNotFound, sendForbidden } from '../utils/helpers';
import { buildVNPayUrl, verifyVNPayReturn, generateVietQR } from '../services/payment.service';

/**
 * ── POST /api/payment/vnpay/create-url ──────────────────────────
 * Tạo URL thanh toán VNPay cho đơn hàng
 */
export const createVNPayUrl = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { order_id } = req.body;
    const userId = req.user!.userId;
    const ipAddr = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';

    if (!order_id) {
      sendBadRequest(res, 'Mã đơn hàng không được để trống');
      return;
    }

    const order = await queryOne<RowDataPacket>(
      `SELECT ma_id AS id, ma_don_hang AS order_code, tong_tien AS total_amount,
              trang_thai_thanh_toan AS payment_status, ma_nguoi_dung AS user_id,
              trang_thai AS status
       FROM don_hang WHERE ma_id = ?`,
      [order_id]
    );

    if (!order) {
      sendNotFound(res, 'Không tìm thấy đơn hàng');
      return;
    }

    if (order.user_id !== userId && req.user!.role !== 'admin') {
      sendForbidden(res, 'Bạn không có quyền thanh toán cho đơn hàng này');
      return;
    }

    if (order.payment_status === 'paid') {
      sendBadRequest(res, 'Đơn hàng này đã được thanh toán trước đó');
      return;
    }

    if (order.status === 'cancelled') {
      sendBadRequest(res, 'Đơn hàng này đã bị huỷ, không thể thanh toán');
      return;
    }

    const paymentUrl = buildVNPayUrl({
      orderCode: order.order_code,
      amount: parseFloat(order.total_amount),
      ipAddr,
      orderInfo: `Thanh toan don hang ${order.order_code}`,
    });

    // Ghi nhận bản ghi chờ thanh toán vào giao_dich_thanh_toan
    await execute(
      `INSERT INTO giao_dich_thanh_toan (ma_don_hang, phuong_thuc_thanh_toan, so_tien, trang_thai)
       VALUES (?, 'VNPAY', ?, 'pending')`,
      [order.id, order.total_amount]
    ).catch(() => {});

    sendSuccess(res, { paymentUrl, orderCode: order.order_code }, 'Tạo link thanh toán VNPay thành công');
  } catch (error) {
    next(error);
  }
};

/**
 * ── GET /api/payment/vietqr/:orderId ───────────────────────────
 * Lấy mã VietQR và thông tin chuyển khoản ngân hàng
 */
export const getVietQRInfo = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { orderId } = req.params;
    const userId = req.user!.userId;

    const order = await queryOne<RowDataPacket>(
      `SELECT ma_id AS id, ma_don_hang AS order_code, tong_tien AS total_amount,
              phuong_thuc_thanh_toan AS payment_method, trang_thai_thanh_toan AS payment_status,
              ma_nguoi_dung AS user_id, trang_thai AS status
       FROM don_hang WHERE ma_id = ?`,
      [orderId]
    );

    if (!order) {
      sendNotFound(res, 'Không tìm thấy đơn hàng');
      return;
    }

    if (order.user_id !== userId && req.user!.role !== 'admin') {
      sendForbidden(res, 'Bạn không có quyền truy cập thông tin đơn hàng này');
      return;
    }

    const vietQR = generateVietQR(order.order_code, parseFloat(order.total_amount));

    sendSuccess(
      res,
      {
        ...vietQR,
        orderId: order.id,
        paymentStatus: order.payment_status,
        orderStatus: order.status,
      },
      'Lấy thông tin VietQR thành công'
    );
  } catch (error) {
    next(error);
  }
};

/**
 * ── GET /api/payment/vnpay/return ──────────────────────────────
 * Callback từ cổng VNPay khi người dùng thanh toán xong
 */
export const handleVNPayReturn = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = verifyVNPayReturn(req.query);

    if (!result.isValid) {
      sendBadRequest(res, result.message, { verified: false });
      return;
    }

    const order = await queryOne<RowDataPacket>(
      `SELECT ma_id AS id, ma_don_hang AS order_code, tong_tien AS total_amount,
              trang_thai_thanh_toan AS payment_status, trang_thai AS status,
              ma_nguoi_dung AS user_id
       FROM don_hang WHERE ma_don_hang = ?`,
      [result.orderCode]
    );

    if (!order) {
      sendNotFound(res, `Không tìm thấy đơn hàng mã ${result.orderCode}`);
      return;
    }

    // Nếu thanh toán thành công từ VNPay (ResponseCode = '00')
    if (result.vnpResponseCode === '00') {
      if (order.payment_status !== 'paid') {
        // Cập nhật trạng thái đơn hàng
        const nextStatus = order.status === 'pending' ? 'processing' : order.status;
        await execute(
          `UPDATE don_hang
           SET trang_thai_thanh_toan = 'paid', trang_thai = ?, phuong_thuc_thanh_toan = 'VNPAY'
           WHERE ma_id = ?`,
          [nextStatus, order.id]
        );

        // Ghi / Cập nhật bảng giao_dich_thanh_toan
        await execute(
          `INSERT INTO giao_dich_thanh_toan (ma_don_hang, ma_giao_dich, phuong_thuc_thanh_toan, so_tien, trang_thai, phan_hoi_cong_thanh_toan, xu_ly_luc)
           VALUES (?, ?, 'VNPAY', ?, 'success', ?, NOW())`,
          [order.id, result.vnpTransactionNo, order.total_amount, JSON.stringify(req.query)]
        ).catch(() => {});

        // Ghi lịch sử trạng thái
        await execute(
          `INSERT INTO lich_su_trang_thai_don_hang (ma_don_hang, trang_thai, thay_doi_boi, ghi_chu)
           VALUES (?, ?, ?, ?)`,
          [order.id, nextStatus, order.user_id, `Thanh toán thành công qua VNPay (Mã GD: ${result.vnpTransactionNo})`]
        ).catch(() => {});
      }

      sendSuccess(
        res,
        {
          orderId: order.id,
          orderCode: order.order_code,
          amount: result.amount,
          transactionNo: result.vnpTransactionNo,
          paymentStatus: 'paid',
        },
        'Thanh toán qua VNPay thành công'
      );
    } else {
      // Giao dịch không thành công hoặc khách bấm Hủy
      await execute(
        `INSERT INTO giao_dich_thanh_toan (ma_don_hang, ma_giao_dich, phuong_thuc_thanh_toan, so_tien, trang_thai, phan_hoi_cong_thanh_toan, xu_ly_luc)
         VALUES (?, ?, 'VNPAY', ?, 'failed', ?, NOW())`,
        [order.id, result.vnpTransactionNo || null, order.total_amount, JSON.stringify(req.query)]
      ).catch(() => {});

      sendBadRequest(res, result.message, {
        orderId: order.id,
        orderCode: order.order_code,
        responseCode: result.vnpResponseCode,
        paymentStatus: 'failed',
      });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * ── GET /api/payment/vnpay/ipn ─────────────────────────────────
 * Webhook Server-to-Server từ VNPay
 */
export const handleVNPayIPN = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = verifyVNPayReturn(req.query);

    if (!result.isValid) {
      res.status(200).json({ RspCode: '97', Message: 'Invalid Checksum' });
      return;
    }

    const order = await queryOne<RowDataPacket>(
      `SELECT ma_id AS id, ma_don_hang AS order_code, tong_tien AS total_amount,
              trang_thai_thanh_toan AS payment_status, trang_thai AS status,
              ma_nguoi_dung AS user_id
       FROM don_hang WHERE ma_don_hang = ?`,
      [result.orderCode]
    );

    if (!order) {
      res.status(200).json({ RspCode: '01', Message: 'Order not found' });
      return;
    }

    // Kiểm tra số tiền
    if (Math.round(result.amount) !== Math.round(parseFloat(order.total_amount))) {
      res.status(200).json({ RspCode: '04', Message: 'Invalid amount' });
      return;
    }

    // Kiểm tra nếu đơn hàng đã được cập nhật trước đó
    if (order.payment_status === 'paid') {
      res.status(200).json({ RspCode: '02', Message: 'Order already confirmed' });
      return;
    }

    if (result.vnpResponseCode === '00') {
      const nextStatus = order.status === 'pending' ? 'processing' : order.status;
      await execute(
        `UPDATE don_hang
         SET trang_thai_thanh_toan = 'paid', trang_thai = ?, phuong_thuc_thanh_toan = 'VNPAY'
         WHERE ma_id = ?`,
        [nextStatus, order.id]
      );

      await execute(
        `INSERT INTO giao_dich_thanh_toan (ma_don_hang, ma_giao_dich, phuong_thuc_thanh_toan, so_tien, trang_thai, phan_hoi_cong_thanh_toan, xu_ly_luc)
         VALUES (?, ?, 'VNPAY', ?, 'success', ?, NOW())`,
        [order.id, result.vnpTransactionNo, order.total_amount, JSON.stringify(req.query)]
      ).catch(() => {});

      await execute(
        `INSERT INTO lich_su_trang_thai_don_hang (ma_don_hang, trang_thai, thay_doi_boi, ghi_chu)
         VALUES (?, ?, ?, ?)`,
        [order.id, nextStatus, order.user_id, `IPN: Thanh toán VNPay thành công (Mã GD: ${result.vnpTransactionNo})`]
      ).catch(() => {});

      res.status(200).json({ RspCode: '00', Message: 'Confirm Success' });
    } else {
      await execute(
        `INSERT INTO giao_dich_thanh_toan (ma_don_hang, ma_giao_dich, phuong_thuc_thanh_toan, so_tien, trang_thai, phan_hoi_cong_thanh_toan, xu_ly_luc)
         VALUES (?, ?, 'VNPAY', ?, 'failed', ?, NOW())`,
        [order.id, result.vnpTransactionNo || null, order.total_amount, JSON.stringify(req.query)]
      ).catch(() => {});

      res.status(200).json({ RspCode: '00', Message: 'Confirm Success' });
    }
  } catch (error) {
    res.status(200).json({ RspCode: '99', Message: 'Unknown error' });
  }
};

/**
 * ── POST /api/payment/vietqr/confirm/:orderId ──────────────────
 * Khách hàng bấm xác nhận "Tôi đã chuyển khoản"
 */
export const confirmCustomerTransfer = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { orderId } = req.params;
    const userId = req.user!.userId;

    const order = await queryOne<RowDataPacket>(
      'SELECT ma_id, ma_don_hang, trang_thai_thanh_toan FROM don_hang WHERE ma_id = ? AND ma_nguoi_dung = ?',
      [orderId, userId]
    );

    if (!order) {
      sendNotFound(res, 'Không tìm thấy đơn hàng');
      return;
    }

    if (order.trang_thai_thanh_toan === 'paid') {
      sendBadRequest(res, 'Đơn hàng này đã được thanh toán');
      return;
    }

    // Ghi chú vào lịch sử đơn hàng
    await execute(
      `INSERT INTO lich_su_trang_thai_don_hang (ma_don_hang, trang_thai, thay_doi_boi, ghi_chu)
       VALUES (?, 'pending', ?, 'Khách hàng thông báo đã chuyển khoản thành công. Đang chờ nhân viên đối soát.')`,
      [order.ma_id, userId]
    ).catch(() => {});

    sendSuccess(res, null, 'Đã ghi nhận thông báo chuyển khoản của bạn. Shop sẽ kiểm tra và xác nhận đơn sớm nhất!');
  } catch (error) {
    next(error);
  }
};

/**
 * ── PUT /api/payment/admin/verify/:orderId ─────────────────────
 * Admin xác nhận đã nhận được tiền chuyển khoản ngân hàng
 */
export const adminVerifyBankPayment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { orderId } = req.params;
    const adminId = req.user!.userId;
    const { reference_code, note } = req.body;

    const order = await queryOne<RowDataPacket>(
      'SELECT ma_id, ma_don_hang, tong_tien, trang_thai_thanh_toan, trang_thai FROM don_hang WHERE ma_id = ?',
      [orderId]
    );

    if (!order) {
      sendNotFound(res, 'Không tìm thấy đơn hàng');
      return;
    }

    const nextStatus = order.trang_thai === 'pending' ? 'processing' : order.trang_thai;

    await execute(
      `UPDATE don_hang
       SET trang_thai_thanh_toan = 'paid', trang_thai = ?
       WHERE ma_id = ?`,
      [nextStatus, order.ma_id]
    );

    await execute(
      `INSERT INTO giao_dich_thanh_toan (ma_don_hang, ma_giao_dich, phuong_thuc_thanh_toan, so_tien, trang_thai, phan_hoi_cong_thanh_toan, xu_ly_luc)
       VALUES (?, ?, 'BANK_TRANSFER', ?, 'success', ?, NOW())`,
      [order.ma_id, reference_code || null, order.tong_tien, JSON.stringify({ verified_by: adminId, note })]
    ).catch(() => {});

    await execute(
      `INSERT INTO lich_su_trang_thai_don_hang (ma_don_hang, trang_thai, thay_doi_boi, ghi_chu)
       VALUES (?, ?, ?, ?)`,
      [order.ma_id, nextStatus, adminId, `Admin xác nhận đã nhận thanh toán chuyển khoản: ${note || 'Hợp lệ'}`]
    ).catch(() => {});

    sendSuccess(res, null, 'Xác nhận thanh toán đơn hàng thành công');
  } catch (error) {
    next(error);
  }
};
