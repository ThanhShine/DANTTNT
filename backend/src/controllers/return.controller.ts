import { Request, Response, NextFunction } from 'express';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { query, queryOne, execute } from '../config/database';
import {
  sendSuccess, sendCreated, sendNotFound, sendBadRequest, sendConflict
} from '../utils/helpers';
import { restoreOrderInventory } from './order.controller';

/**
 * ── POST /api/returns/orders/:id ──────────────────────────────
 * Khách hàng tạo yêu cầu đổi / trả hàng & hoàn tiền
 */
export const requestOrderReturn = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;
    const {
      return_type = 'refund',
      reason,
      description,
      images = [],
      bank_info
    } = req.body;

    if (!reason || typeof reason !== 'string') {
      sendBadRequest(res, 'Vui lòng chọn hoặc nhập lý do yêu cầu đổi/trả hàng');
      return;
    }

    // Kiểm tra đơn hàng
    const order = await queryOne<RowDataPacket>(
      `SELECT ma_id AS id, ma_don_hang AS order_code, trang_thai AS status,
              tong_tien AS total_amount, ngay_tao AS created_at
       FROM don_hang WHERE ma_id = ? AND ma_nguoi_dung = ?`,
      [id, userId]
    );

    if (!order) {
      sendNotFound(res, 'Không tìm thấy đơn hàng của bạn');
      return;
    }

    if (order.status !== 'delivered' && order.status !== 'shipped') {
      sendBadRequest(res, 'Chỉ có thể yêu cầu đổi/trả với các đơn hàng đã được giao hoặc đang vận chuyển');
      return;
    }

    // Kiểm tra xem đã có yêu cầu đổi trả đang chờ xử lý cho đơn này chưa
    const existingReturn = await queryOne<RowDataPacket>(
      `SELECT ma_id, trang_thai AS status FROM yeu_cau_doi_tra
       WHERE ma_don_hang = ? AND trang_thai IN ('pending', 'approved')`,
      [id]
    );

    if (existingReturn) {
      sendConflict(res, `Đơn hàng #${order.order_code} đã có yêu cầu đổi/trả đang được xử lý.`);
      return;
    }

    const result = await execute(
      `INSERT INTO yeu_cau_doi_tra
       (ma_don_hang, ma_nguoi_dung, loai_yeu_cau, ly_do, mo_ta_chi_tiet, hinh_anh_chung_minh, thong_tin_ngan_hang, trang_thai)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')`,
      [
        id,
        userId,
        return_type === 'exchange' ? 'exchange' : 'refund',
        reason.trim(),
        description?.trim() || null,
        images && Array.isArray(images) ? JSON.stringify(images) : null,
        bank_info ? JSON.stringify(bank_info) : null,
      ]
    );

    // Ghi lịch sử đơn hàng
    await execute(
      `INSERT INTO lich_su_trang_thai_don_hang (ma_don_hang, trang_thai, thay_doi_boi, ghi_chu)
       VALUES (?, ?, ?, ?)`,
      [id, order.status, userId, `Khách hàng gửi yêu cầu ${return_type === 'exchange' ? 'đổi hàng' : 'trả hàng & hoàn tiền'}: ${reason.trim()}`]
    ).catch(() => {});

    const newReturn = await queryOne<RowDataPacket>(
      `SELECT ma_id AS id, ma_don_hang AS order_id, loai_yeu_cau AS return_type,
              ly_do AS reason, mo_ta_chi_tiet AS description, hinh_anh_chung_minh AS images,
              thong_tin_ngan_hang AS bank_info, trang_thai AS status, ngay_tao AS created_at
       FROM yeu_cau_doi_tra WHERE ma_id = ?`,
      [result.insertId]
    );

    sendCreated(res, newReturn, 'Gửi yêu cầu đổi/trả hàng thành công! Shop sẽ kiểm tra và phản hồi sớm.');
  } catch (error) {
    next(error);
  }
};

/**
 * ── GET /api/returns/orders/:id ───────────────────────────────
 * Khách hàng xem trạng thái yêu cầu đổi/trả của đơn hàng
 */
export const getOrderReturnDetail = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;

    const returnReq = await queryOne<RowDataPacket>(
      `SELECT r.ma_id AS id, r.ma_don_hang AS order_id, r.loai_yeu_cau AS return_type,
              r.ly_do AS reason, r.mo_ta_chi_tiet AS description, r.hinh_anh_chung_minh AS images,
              r.thong_tin_ngan_hang AS bank_info, r.trang_thai AS status, r.ghi_chu_admin AS admin_note,
              r.ngay_tao AS created_at, r.ngay_cap_nhat AS updated_at,
              o.ma_don_hang AS order_code, o.tong_tien AS total_amount
       FROM yeu_cau_doi_tra r
       JOIN don_hang o ON r.ma_don_hang = o.ma_id
       WHERE r.ma_don_hang = ? AND r.ma_nguoi_dung = ?
       ORDER BY r.ngay_tao DESC LIMIT 1`,
      [id, userId]
    );

    if (!returnReq) {
      sendSuccess(res, null, 'Chưa có yêu cầu đổi/trả nào cho đơn hàng này');
      return;
    }

    sendSuccess(res, {
      ...returnReq,
      images: typeof returnReq.images === 'string' ? JSON.parse(returnReq.images) : returnReq.images,
      bank_info: typeof returnReq.bank_info === 'string' ? JSON.parse(returnReq.bank_info) : returnReq.bank_info,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * ── GET /api/returns/admin ────────────────────────────────────
 * Admin xem danh sách tất cả yêu cầu đổi / trả hàng
 */
export const adminGetReturns = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { status, page = 1, limit = 15 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let whereClause = '1=1';
    const params: any[] = [];

    if (status) {
      whereClause += ' AND r.trang_thai = ?';
      params.push(status);
    }

    const totalCount = await queryOne<RowDataPacket>(
      `SELECT COUNT(*) AS total FROM yeu_cau_doi_tra r WHERE ${whereClause}`,
      params
    );

    const returns = await query<RowDataPacket>(
      `SELECT r.ma_id AS id, r.ma_don_hang AS order_id, r.loai_yeu_cau AS return_type,
              r.ly_do AS reason, r.mo_ta_chi_tiet AS description, r.hinh_anh_chung_minh AS images,
              r.thong_tin_ngan_hang AS bank_info, r.trang_thai AS status, r.ghi_chu_admin AS admin_note,
              r.ngay_tao AS created_at, r.ngay_cap_nhat AS updated_at,
              o.ma_don_hang AS order_code, o.tong_tien AS total_amount, o.trang_thai AS order_status,
              u.ho_ten AS customer_name, u.dia_chi_email AS customer_email, u.so_dien_thoai AS customer_phone
       FROM yeu_cau_doi_tra r
       JOIN don_hang o ON r.ma_don_hang = o.ma_id
       JOIN nguoi_dung u ON r.ma_nguoi_dung = u.ma_id
       WHERE ${whereClause}
       ORDER BY r.ngay_tao DESC
       LIMIT ? OFFSET ?`,
      [...params, Number(limit), offset]
    );

    const formatted = returns.map(item => ({
      ...item,
      images: typeof item.images === 'string' ? JSON.parse(item.images) : item.images,
      bank_info: typeof item.bank_info === 'string' ? JSON.parse(item.bank_info) : item.bank_info,
    }));

    sendSuccess(res, formatted, 'Danh sách yêu cầu đổi/trả hàng', 200, {
      page: Number(page),
      limit: Number(limit),
      total: totalCount?.total || 0,
      totalPages: Math.ceil((totalCount?.total || 0) / Number(limit)),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * ── PUT /api/returns/admin/:id ────────────────────────────────
 * Admin duyệt hoặc từ chối yêu cầu đổi/trả hàng
 */
export const adminProcessReturn = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, admin_note } = req.body;

    if (!['approved', 'rejected', 'completed'].includes(status)) {
      sendBadRequest(res, 'Trạng thái không hợp lệ (approved | rejected | completed)');
      return;
    }

    const returnReq = await queryOne<RowDataPacket>(
      `SELECT ma_id, ma_don_hang AS order_id, loai_yeu_cau AS return_type, trang_thai AS current_status
       FROM yeu_cau_doi_tra WHERE ma_id = ?`,
      [id]
    );

    if (!returnReq) {
      sendNotFound(res, 'Không tìm thấy yêu cầu đổi/trả hàng');
      return;
    }

    await execute(
      `UPDATE yeu_cau_doi_tra SET
         trang_thai = ?,
         ghi_chu_admin = COALESCE(?, ghi_chu_admin)
       WHERE ma_id = ?`,
      [status, admin_note?.trim() || null, id]
    );

    // Nếu duyệt hoàn tất trả hàng (completed):
    // Cập nhật trạng thái đơn hàng sang 'returned' và khôi phục tồn kho sản phẩm!
    if (status === 'completed' && returnReq.return_type === 'refund') {
      await execute(
        `UPDATE don_hang SET
           trang_thai = 'returned',
           trang_thai_thanh_toan = 'refunded'
         WHERE ma_id = ?`,
        [returnReq.order_id]
      );

      // Khôi phục tồn kho tự động
      await restoreOrderInventory(String(returnReq.order_id));

      await execute(
        `INSERT INTO lich_su_trang_thai_don_hang (ma_don_hang, trang_thai, thay_doi_boi, ghi_chu)
         VALUES (?, 'returned', ?, ?)`,
        [returnReq.order_id, req.user!.userId, `Admin duyệt hoàn tất đổi/trả & hoàn tiền. Tồn kho đã được khôi phục.`]
      ).catch(() => {});
    }

    sendSuccess(res, null, `Đã cập nhật yêu cầu đổi/trả thành "${status}"`);
  } catch (error) {
    next(error);
  }
};
