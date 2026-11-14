import { Request, Response, NextFunction } from 'express';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { pool, query, queryOne, execute } from '../config/database';

import {
  sendSuccess, sendCreated, sendNotFound, sendBadRequest,
  getPagination, paginate, generateOrderCode
} from '../utils/helpers';
import { buildVNPayUrl, generateVietQR } from '../services/payment.service';
import { emailService } from '../services/email.service';
import { config } from '../config';


// ── POST /api/orders — Tạo đơn hàng ──────────────────────────
export const createOrder = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { address_id, payment_method, coupon_code, customer_note } = req.body;
    const userId = req.user!.userId;

    // Lấy giỏ hàng
    const cart = await queryOne<RowDataPacket>(
      'SELECT ma_id FROM gio_hang WHERE ma_nguoi_dung = ?', [userId]
    );
    if (!cart) { sendBadRequest(res, 'Giỏ hàng trống'); return; }

    const cartItems = await query<RowDataPacket>(
      `SELECT
         ci.ma_id, ci.ma_san_pham AS product_id, ci.ma_bien_the AS variant_id, ci.so_luong AS quantity,
         p.ten AS name, p.duong_dan_anh_dai_dien AS thumbnail_url, p.so_luong_ton AS stock_quantity,
         p.dang_hoat_dong AS is_active,
         COALESCE(pv.gia, p.gia_ban, p.gia_goc) AS unit_price,
         pv.ten_bien_the AS variant_name
       FROM chi_tiet_gio_hang ci
       JOIN san_pham p ON ci.ma_san_pham = p.ma_id
       LEFT JOIN bien_the_san_pham pv ON ci.ma_bien_the = pv.ma_id
       WHERE ci.ma_gio_hang = ?`, [cart.ma_id]
    );

    if (cartItems.length === 0) { sendBadRequest(res, 'Giỏ hàng trống'); return; }

    // Kiểm tra tồn kho
    for (const item of cartItems) {
      if (!item.is_active) {
        sendBadRequest(res, `Sản phẩm "${item.name}" đã ngừng bán`); return;
      }
      if (item.quantity > item.stock_quantity) {
        sendBadRequest(res, `Sản phẩm "${item.name}" không đủ hàng (còn ${item.stock_quantity})`);
        return;
      }
    }

    // Tính subtotal
    const subtotal = cartItems.reduce((sum: number, i: RowDataPacket) => sum + i.unit_price * i.quantity, 0);

    // Kiểm tra coupon (ma_giam_gia)
    let couponId: number | null = null;
    let discountAmount = 0;

    if (coupon_code) {
      const coupon = await queryOne<RowDataPacket>(
        `SELECT ma_id AS id, loai AS type, gia_tri AS value, muc_giam_toi_da AS max_discount_amount,
                gia_tri_don_hang_toi_thieu AS min_order_amount
         FROM ma_giam_gia
         WHERE ma = ? AND dang_hoat_dong = 1
           AND NOW() BETWEEN ngay_bat_dau AND ngay_ket_thuc
           AND gia_tri_don_hang_toi_thieu <= ?
           AND (gioi_han_su_dung IS NULL OR so_lan_da_dung < gioi_han_su_dung)`,
        [coupon_code, subtotal]
      );
      if (!coupon) {
        sendBadRequest(res, 'Mã giảm giá không hợp lệ hoặc đã hết hạn'); return;
      }
      couponId = coupon.id;
      discountAmount = coupon.type === 'percentage'
        ? Math.min(subtotal * coupon.value / 100, coupon.max_discount_amount || Infinity)
        : coupon.value;
    }

    // Lấy địa chỉ giao hàng (dia_chi_nguoi_dung)
    const address = await queryOne<RowDataPacket>(
      `SELECT ma_id AS id, ten_nguoi_nhan AS recipient_name, so_dien_thoai_nguoi_nhan AS recipient_phone,
              tinh_thanh AS province, quan_huyen AS district, phuong_xa AS ward,
              dia_chi_chi_tiet AS address_detail
       FROM dia_chi_nguoi_dung WHERE ma_id = ? AND ma_nguoi_dung = ?`, [address_id, userId]
    );
    if (!address) { sendBadRequest(res, 'Địa chỉ giao hàng không hợp lệ'); return; }

    const isFreeShipCoupon = Boolean(coupon_code && coupon_code.toUpperCase() === 'FREESHIP');
    const isMajorCity = address.province && (
      address.province.includes('Hà Nội') ||
      address.province.includes('Hồ Chí Minh') ||
      address.province.includes('Đà Nẵng')
    );
    const shippingFee = (subtotal >= 500000 || isFreeShipCoupon)
      ? 0
      : (isMajorCity ? 25000 : 35000);
    const totalAmount = Math.max(0, subtotal - discountAmount + shippingFee);
    const orderCode = generateOrderCode();

    const shippingSnapshot = JSON.stringify({
      recipient_name:  address.recipient_name,
      recipient_phone: address.recipient_phone,
      province:        address.province,
      district:        address.district,
      ward:            address.ward,
      address_detail:  address.address_detail,
    });

    // ── DATABASE TRANSACTION: Trừ kho nguyên tử & Tạo đơn an toàn ──
    const conn = await pool.getConnection();
    await conn.beginTransaction();

    let orderId: number;

    try {
      // 1. Kiểm tra và trừ kho từng sản phẩm một cách nguyên tử (Atomic Update)
      for (const item of cartItems) {
        // Trừ tồn kho sản phẩm chính
        const [prodResult] = await conn.execute<ResultSetHeader>(
          `UPDATE san_pham
           SET so_luong_ton = so_luong_ton - ?,
               tong_da_ban = tong_da_ban + ?
           WHERE ma_id = ? AND so_luong_ton >= ?`,
          [item.quantity, item.quantity, item.product_id, item.quantity]
        );

        if (prodResult.affectedRows === 0) {
          await conn.rollback();
          conn.release();
          sendBadRequest(res, `Sản phẩm "${item.name}" đã hết hàng hoặc không đủ tồn kho`);
          return;
        }

        // Trừ tồn kho biến thể nếu có
        if (item.variant_id) {
          const [varResult] = await conn.execute<ResultSetHeader>(
            `UPDATE bien_the_san_pham
             SET so_luong_ton = so_luong_ton - ?
             WHERE ma_id = ? AND so_luong_ton >= ?`,
            [item.quantity, item.variant_id, item.quantity]
          );

          if (varResult.affectedRows === 0) {
            await conn.rollback();
            conn.release();
            sendBadRequest(res, `Phân loại "${item.variant_name || item.name}" đã hết hàng hoặc không đủ tồn kho`);
            return;
          }
        }
      }

      // 2. Tạo đơn hàng (don_hang)
      const [orderResult] = await conn.execute<ResultSetHeader>(
        `INSERT INTO don_hang (ma_don_hang, ma_nguoi_dung, trang_thai, tam_tinh, so_tien_giam,
                phi_van_chuyen, tong_tien, ma_ma_giam_gia, phuong_thuc_thanh_toan,
                trang_thai_thanh_toan, dia_chi_giao_hang, ghi_chu_khach_hang)
         VALUES (?, ?, 'pending', ?, ?, ?, ?, ?, ?, 'pending', ?, ?)`,
        [orderCode, userId, subtotal, discountAmount, shippingFee, totalAmount,
         couponId, payment_method || 'COD', shippingSnapshot, customer_note || null]
      );
      orderId = orderResult.insertId;

      // 3. Tạo chi_tiet_don_hang
      for (const item of cartItems) {
        await conn.execute(
          `INSERT INTO chi_tiet_don_hang (ma_don_hang, ma_san_pham, ma_bien_the, ten_san_pham,
                  hinh_anh_san_pham, ten_bien_the, don_gia, so_luong, tam_tinh)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [orderId, item.product_id, item.variant_id, item.name, item.thumbnail_url,
           item.variant_name, item.unit_price, item.quantity, item.unit_price * item.quantity]
        );
      }

      // 4. Cập nhật coupon so_lan_da_dung
      if (couponId) {
        await conn.execute('UPDATE ma_giam_gia SET so_lan_da_dung = so_lan_da_dung + 1 WHERE ma_id = ?', [couponId]);
      }

      // 5. Xóa giỏ hàng
      await conn.execute('DELETE FROM chi_tiet_gio_hang WHERE ma_gio_hang = ?', [cart.ma_id]);

      // 6. Ghi lich_su_trang_thai_don_hang
      await conn.execute(
        `INSERT INTO lich_su_trang_thai_don_hang (ma_don_hang, trang_thai, thay_doi_boi, ghi_chu)
         VALUES (?, 'pending', ?, ?)`,
        [orderId, userId, 'Đơn hàng được tạo thành công']
      );

      // Commit toàn bộ Transaction thành công!
      await conn.commit();
      conn.release();
    } catch (txErr) {
      await conn.rollback();
      conn.release();
      throw txErr;
    }


    // Ghi activity log
    await execute(
      `INSERT INTO nhat_ky_hoat_dong_nguoi_dung (ma_nguoi_dung, loai_hanh_dong, mo_ta, loai_doi_tuong, ma_doi_tuong)
       VALUES (?, 'CREATE_ORDER', ?, 'order', ?)`,
      [userId, `Đặt đơn hàng #${orderCode}`, orderId]
    ).catch(() => {});

    // Tạo thông tin thanh toán trực tuyến tương ứng
    let paymentUrl: string | null = null;
    let vietQRInfo: any = null;

    if (payment_method === 'VNPAY') {
      const ipAddr = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
      paymentUrl = buildVNPayUrl({
        orderCode,
        amount: totalAmount,
        ipAddr,
        orderInfo: `Thanh toan don hang ${orderCode}`,
      });

      await execute(
        `INSERT INTO giao_dich_thanh_toan (ma_don_hang, phuong_thuc_thanh_toan, so_tien, trang_thai)
         VALUES (?, 'VNPAY', ?, 'pending')`,
        [orderId, totalAmount]
      ).catch(() => {});
    } else if (payment_method === 'BANK_TRANSFER') {
      vietQRInfo = generateVietQR(orderCode, totalAmount);

      await execute(
        `INSERT INTO giao_dich_thanh_toan (ma_don_hang, phuong_thuc_thanh_toan, so_tien, trang_thai)
         VALUES (?, 'BANK_TRANSFER', ?, 'pending')`,
        [orderId, totalAmount]
      ).catch(() => {});
    }

    const newOrder = await queryOne<RowDataPacket>(
      `SELECT ma_id AS id, ma_don_hang AS order_code, trang_thai AS status,
              tam_tinh AS subtotal, so_tien_giam AS discount_amount,
              phi_van_chuyen AS shipping_fee, tong_tien AS total_amount,
              phuong_thuc_thanh_toan AS payment_method, trang_thai_thanh_toan AS payment_status,
              ngay_tao AS created_at
       FROM don_hang WHERE ma_id = ?`, [orderId]
    );

    // Gửi email xác nhận đặt hàng chạy nền (asynchronous, không block response)
    (async () => {
      try {
        const user = await queryOne<RowDataPacket>(
          'SELECT dia_chi_email AS email, ho_ten AS name FROM nguoi_dung WHERE ma_id = ?',
          [userId]
        );
        if (user?.email) {
          await emailService.sendOrderConfirmation({
            toEmail: user.email,
            customerName: address.recipient_name || user.name,
            orderCode,
            createdAt: new Date(),
            items: cartItems.map((item: any) => ({
              name: item.name,
              variantName: item.variant_name,
              quantity: item.quantity,
              unitPrice: item.unit_price,
              subtotal: item.unit_price * item.quantity,
            })),
            subtotal,
            discountAmount,
            couponCode: coupon_code,
            shippingFee,
            totalAmount,
            paymentMethod: payment_method,
            shippingAddress: address as any,
            orderUrl: `${config.cors.origin}/orders/${orderId}`,
          });
        }
      } catch (emailErr) {
        console.error('Lỗi khi gửi email xác nhận đơn hàng:', emailErr);
      }
    })();

    sendCreated(
      res,
      {
        ...newOrder,
        payment_url: paymentUrl,
        vietqr: vietQRInfo,
      },
      'Đặt hàng thành công'
    );
  } catch (error) {
    next(error);
  }
};

// ── GET /api/orders — Lịch sử đơn hàng của user ──────────────
export const getMyOrders = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { page, limit, offset } = getPagination(req.query.page as string, req.query.limit as string);
    const userId = req.user!.userId;
    const { status } = req.query;

    let sql = `SELECT ma_id AS id, ma_don_hang AS order_code, trang_thai AS status,
                      tam_tinh AS subtotal, so_tien_giam AS discount_amount,
                      phi_van_chuyen AS shipping_fee, tong_tien AS total_amount,
                      phuong_thuc_thanh_toan AS payment_method,
                      trang_thai_thanh_toan AS payment_status,
                      ngay_tao AS created_at, ngay_cap_nhat AS updated_at
               FROM don_hang WHERE ma_nguoi_dung = ?`;
    const params: unknown[] = [userId];

    if (status) { sql += ' AND trang_thai = ?'; params.push(status); }

    const countResult = await queryOne<RowDataPacket>(
      `SELECT COUNT(*) AS total FROM don_hang WHERE ma_nguoi_dung = ?${status ? ' AND trang_thai = ?' : ''}`,
      status ? [userId, status] : [userId]
    );
    const total = countResult?.total || 0;

    sql += ' ORDER BY ngay_tao DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const orders = await query<RowDataPacket>(sql, params);
    sendSuccess(res, orders, 'Lấy danh sách đơn hàng thành công', 200, paginate(total, page, limit));
  } catch (error) {
    next(error);
  }
};

// ── GET /api/orders/:id ───────────────────────────────────────
export const getOrderById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;

    const sqlWhere = req.user!.role === 'customer'
      ? 'WHERE o.ma_id = ? AND o.ma_nguoi_dung = ?'
      : 'WHERE o.ma_id = ?';
    const sqlParams = req.user!.role === 'customer' ? [id, userId] : [id];

    const order = await queryOne<RowDataPacket>(
      `SELECT o.ma_id AS id, o.ma_don_hang AS order_code, o.trang_thai AS status,
              o.tam_tinh AS subtotal, o.so_tien_giam AS discount_amount,
              o.phi_van_chuyen AS shipping_fee, o.tong_tien AS total_amount,
              o.phuong_thuc_thanh_toan AS payment_method, o.trang_thai_thanh_toan AS payment_status,
              o.dia_chi_giao_hang AS shipping_address, o.ghi_chu_khach_hang AS customer_note,
              o.ngay_tao AS created_at,
              u.ho_ten AS customer_name, u.dia_chi_email AS customer_email
       FROM don_hang o JOIN nguoi_dung u ON o.ma_nguoi_dung = u.ma_id ${sqlWhere}`, sqlParams
    );

    if (!order) { sendNotFound(res, 'Không tìm thấy đơn hàng'); return; }

    const items = await query<RowDataPacket>(
      `SELECT ma_id AS id, ma_don_hang AS order_id, ma_san_pham AS product_id,
              ma_bien_the AS variant_id, ten_san_pham AS product_name,
              hinh_anh_san_pham AS product_image, ten_bien_the AS variant_name,
              don_gia AS unit_price, so_luong AS quantity, tam_tinh AS subtotal
       FROM chi_tiet_don_hang WHERE ma_don_hang = ?`, [id]
    );

    // Lấy thông tin VietQR nếu đơn là chuyển khoản và chưa thanh toán
    let vietqr = null;
    if (order.payment_method === 'BANK_TRANSFER' && order.payment_status !== 'paid') {
      vietqr = generateVietQR(order.order_code, parseFloat(order.total_amount));
    }

    // Lấy lịch sử giao dịch thanh toán (nếu có)
    const paymentTransactions = await query<RowDataPacket>(
      `SELECT ma_id AS id, ma_giao_dich AS transaction_no, phuong_thuc_thanh_toan AS payment_method,
              so_tien AS amount, trang_thai AS status, ngay_tao AS created_at
       FROM giao_dich_thanh_toan WHERE ma_don_hang = ? ORDER BY ngay_tao DESC`,
      [id]
    ).catch(() => []);

    sendSuccess(res, { ...order, items, vietqr, payment_transactions: paymentTransactions });
  } catch (error) {
    next(error);
  }
};

/**
 * Helper: Hoàn trả tồn kho cho sản phẩm & biến thể khi hủy hoặc hoàn đơn hàng
 */
export async function restoreOrderInventory(orderId: number | string): Promise<void> {
  const items = await query<RowDataPacket>(
    `SELECT ma_san_pham AS product_id, ma_bien_the AS variant_id, so_luong AS quantity
     FROM chi_tiet_don_hang WHERE ma_don_hang = ?`,
    [orderId]
  );

  for (const item of items) {
    // Hoàn kho và giảm số lượng đã bán của sản phẩm chính
    await execute(
      `UPDATE san_pham
       SET so_luong_ton = so_luong_ton + ?,
           tong_da_ban = GREATEST(0, tong_da_ban - ?)
       WHERE ma_id = ?`,
      [item.quantity, item.quantity, item.product_id]
    );

    // Hoàn kho biến thể nếu có
    if (item.variant_id) {
      await execute(
        `UPDATE bien_the_san_pham
         SET so_luong_ton = so_luong_ton + ?
         WHERE ma_id = ?`,
        [item.quantity, item.variant_id]
      );
    }
  }

  // Hoàn lại lượt dùng coupon nếu có
  const order = await queryOne<RowDataPacket>(
    'SELECT ma_ma_giam_gia AS coupon_id FROM don_hang WHERE ma_id = ?',
    [orderId]
  );
  if (order?.coupon_id) {
    await execute(
      'UPDATE ma_giam_gia SET so_lan_da_dung = GREATEST(0, so_lan_da_dung - 1) WHERE ma_id = ?',
      [order.coupon_id]
    ).catch(() => {});
  }
}

// ── PUT /api/orders/:id/status — Admin ───────────────────────
export const updateOrderStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = String(req.params.id || '');
    const { status, admin_note } = req.body;


    const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'returned'];
    if (!validStatuses.includes(status)) {
      sendBadRequest(res, 'Trạng thái đơn hàng không hợp lệ'); return;
    }

    const order = await queryOne<RowDataPacket>(
      'SELECT ma_id AS id, trang_thai AS status FROM don_hang WHERE ma_id = ?', [id]
    );
    if (!order) { sendNotFound(res, 'Không tìm thấy đơn hàng'); return; }

    const oldStatus = order.status;

    const extraFields: string[] = [];
    const extraParams: unknown[] = [];

    if (status === 'shipped')    { extraFields.push('giao_hang_luc = NOW()'); }
    if (status === 'delivered')  { extraFields.push('giao_thanh_cong_luc = NOW()'); }
    if (status === 'cancelled')  { extraFields.push('huy_luc = NOW()'); }
    if (admin_note)              { extraFields.push('ghi_chu_quan_tri = ?'); extraParams.push(admin_note); }

    const setClause = ['trang_thai = ?', ...extraFields].join(', ');
    await execute(
      `UPDATE don_hang SET ${setClause} WHERE ma_id = ?`,
      [status, ...extraParams, id]
    );

    // Nếu đơn hàng chuyển sang cancelled hoặc returned (và trước đó chưa bị cancelled/returned) → Hoàn kho
    if (['cancelled', 'returned'].includes(status) && !['cancelled', 'returned'].includes(oldStatus)) {
      await restoreOrderInventory(id);
    }

    // Ghi lich_su_trang_thai_don_hang
    await execute(
      `INSERT INTO lich_su_trang_thai_don_hang (ma_don_hang, trang_thai, thay_doi_boi, ghi_chu)
       VALUES (?, ?, ?, ?)`,
      [id, status, req.user!.userId, admin_note || null]
    ).catch(() => {});

    sendSuccess(res, null, `Cập nhật trạng thái đơn hàng thành ${status} thành công`);
  } catch (error) {
    next(error);
  }
};

// ── PUT /api/orders/:id/cancel — Customer ────────────────────
export const cancelOrder = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = String(req.params.id || '');
    const { cancel_reason } = req.body;

    const userId = req.user!.userId;

    const order = await queryOne<RowDataPacket>(
      'SELECT ma_id AS id, trang_thai AS status FROM don_hang WHERE ma_id = ? AND ma_nguoi_dung = ?',
      [id, userId]
    );
    if (!order) { sendNotFound(res, 'Không tìm thấy đơn hàng'); return; }

    if (!['pending', 'processing'].includes(order.status)) {
      sendBadRequest(res, 'Chỉ có thể huỷ đơn hàng đang ở trạng thái pending hoặc processing');
      return;
    }

    await execute(
      `UPDATE don_hang SET trang_thai = 'cancelled', ly_do_huy = ?, huy_luc = NOW() WHERE ma_id = ?`,
      [cancel_reason || 'Khách hàng huỷ đơn', id]
    );

    // Hoàn lại tồn kho cho sản phẩm & biến thể
    await restoreOrderInventory(id);

    // Ghi lich_su_trang_thai_don_hang
    await execute(
      `INSERT INTO lich_su_trang_thai_don_hang (ma_don_hang, trang_thai, thay_doi_boi, ghi_chu)
       VALUES (?, 'cancelled', ?, ?)`,
      [id, userId, cancel_reason || 'Khách hàng huỷ đơn']
    ).catch(() => {});


    // Ghi activity log
    await execute(
      `INSERT INTO nhat_ky_hoat_dong_nguoi_dung (ma_nguoi_dung, loai_hanh_dong, mo_ta, loai_doi_tuong, ma_doi_tuong)
       VALUES (?, 'CANCEL_ORDER', ?, 'order', ?)`,
      [userId, `Huỷ đơn hàng #${id}`, id]
    ).catch(() => {});

    sendSuccess(res, null, 'Huỷ đơn hàng thành công');
  } catch (error) {
    next(error);
  }
};

// ── GET /api/admin/orders — Admin: Tất cả đơn hàng ───────────
export const getAllOrders = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { page, limit, offset } = getPagination(req.query.page as string, req.query.limit as string);
    const { status, payment_status, search } = req.query;

    let sql = `
      SELECT o.ma_id AS id, o.ma_don_hang AS order_code, o.trang_thai AS status,
             o.trang_thai_thanh_toan AS payment_status, o.tong_tien AS total_amount,
             o.phuong_thuc_thanh_toan AS payment_method, o.ngay_tao AS created_at,
             u.ho_ten AS customer_name, u.dia_chi_email AS customer_email
      FROM don_hang o JOIN nguoi_dung u ON o.ma_nguoi_dung = u.ma_id WHERE 1=1`;
    const params: unknown[] = [];

    if (status)         { sql += ' AND o.trang_thai = ?';              params.push(status); }
    if (payment_status) { sql += ' AND o.trang_thai_thanh_toan = ?';   params.push(payment_status); }
    if (search)         { sql += ' AND (o.ma_don_hang LIKE ? OR u.ho_ten LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }

    const countResult = await queryOne<RowDataPacket>(
      `SELECT COUNT(*) AS total FROM don_hang o JOIN nguoi_dung u ON o.ma_nguoi_dung = u.ma_id WHERE 1=1` +
      (status ? ' AND o.trang_thai = ?' : '') +
      (payment_status ? ' AND o.trang_thai_thanh_toan = ?' : ''),
      [...(status ? [status] : []), ...(payment_status ? [payment_status] : [])]
    );
    const total = countResult?.total || 0;

    sql += ' ORDER BY o.ngay_tao DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const orders = await query<RowDataPacket>(sql, params);
    sendSuccess(res, orders, 'Lấy danh sách đơn hàng thành công', 200, paginate(total, page, limit));
  } catch (error) {
    next(error);
  }
};
