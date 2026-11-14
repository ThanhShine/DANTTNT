import { Request, Response, NextFunction } from 'express';
import { RowDataPacket } from 'mysql2';
import { query, queryOne } from '../config/database';
import { sendSuccess, sendNotFound, getPagination, paginate } from '../utils/helpers';

// ── GET /api/account/login-history ────────────────────────────
export const getLoginHistory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { page, limit, offset } = getPagination(req.query['page'] as string, req.query['limit'] as string);

    const countResult = await queryOne<RowDataPacket>(
      'SELECT COUNT(*) AS total FROM lich_su_dang_nhap WHERE ma_nguoi_dung = ?',
      [userId]
    );
    const total = (countResult?.total as number) || 0;

    const history = await query<RowDataPacket>(
      `SELECT ma_id AS id,
              dang_nhap_luc AS login_at, dang_xuat_luc AS logout_at,
              dia_chi_ip AS ip_address, trinh_duyet_thiet_bi AS user_agent,
              trang_thai_dang_nhap AS login_status, ly_do_that_bai AS fail_reason
       FROM lich_su_dang_nhap
       WHERE ma_nguoi_dung = ?
       ORDER BY dang_nhap_luc DESC
       LIMIT ? OFFSET ?`,
      [userId, limit, offset]
    );

    sendSuccess(res, history, 'Lấy lịch sử đăng nhập thành công', 200, paginate(total, page, limit));
  } catch (error) {
    next(error);
  }
};

// ── GET /api/cart/history ──────────────────────────────────────
export const getCartHistory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { page, limit, offset } = getPagination(req.query['page'] as string, req.query['limit'] as string);

    const countResult = await queryOne<RowDataPacket>(
      'SELECT COUNT(*) AS total FROM lich_su_gio_hang WHERE ma_nguoi_dung = ?',
      [userId]
    );
    const total = (countResult?.total as number) || 0;

    const history = await query<RowDataPacket>(
      `SELECT ch.ma_id AS id,
              ch.loai_hanh_dong AS action_type, ch.so_luong AS quantity,
              ch.so_luong_cu AS old_quantity, ch.ngay_tao AS created_at,
              ch.ten_san_pham AS product_name,
              p.ma_id AS product_id, p.duong_dan_anh_dai_dien AS thumbnail_url
       FROM lich_su_gio_hang ch
       LEFT JOIN san_pham p ON ch.ma_san_pham = p.ma_id
       WHERE ch.ma_nguoi_dung = ?
       ORDER BY ch.ngay_tao DESC
       LIMIT ? OFFSET ?`,
      [userId, limit, offset]
    );

    sendSuccess(res, history, 'Lấy lịch sử giỏ hàng thành công', 200, paginate(total, page, limit));
  } catch (error) {
    next(error);
  }
};

// ── GET /api/orders/:id/history ───────────────────────────────
export const getOrderHistory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;

    const whereClause = req.user!.role === 'customer'
      ? 'WHERE ma_id = ? AND ma_nguoi_dung = ?'
      : 'WHERE ma_id = ?';
    const whereParams = req.user!.role === 'customer' ? [id, userId] : [id];

    const order = await queryOne<RowDataPacket>(`SELECT ma_id FROM don_hang ${whereClause}`, whereParams);
    if (!order) {
      sendNotFound(res, 'Không tìm thấy đơn hàng');
      return;
    }

    const history = await query<RowDataPacket>(
      `SELECT osh.ma_id AS id, osh.trang_thai AS status, osh.ghi_chu AS note,
              osh.ngay_tao AS created_at,
              u.ho_ten AS changed_by_name
       FROM lich_su_trang_thai_don_hang osh
       LEFT JOIN nguoi_dung u ON osh.thay_doi_boi = u.ma_id
       WHERE osh.ma_don_hang = ?
       ORDER BY osh.ngay_tao ASC`,
      [id]
    );

    sendSuccess(res, history, 'Lấy lịch sử đơn hàng thành công');
  } catch (error) {
    next(error);
  }
};

// ── GET /api/account/activity ─────────────────────────────────
export const getActivityLog = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { page, limit, offset } = getPagination(req.query['page'] as string, req.query['limit'] as string);

    const countResult = await queryOne<RowDataPacket>(
      'SELECT COUNT(*) AS total FROM nhat_ky_hoat_dong_nguoi_dung WHERE ma_nguoi_dung = ?',
      [userId]
    );
    const total = (countResult?.total as number) || 0;

    const logs = await query<RowDataPacket>(
      `SELECT ma_id AS id, loai_hanh_dong AS action_type, mo_ta AS description,
              loai_doi_tuong AS entity_type, ma_doi_tuong AS entity_id,
              ngay_tao AS created_at
       FROM nhat_ky_hoat_dong_nguoi_dung
       WHERE ma_nguoi_dung = ?
       ORDER BY ngay_tao DESC
       LIMIT ? OFFSET ?`,
      [userId, limit, offset]
    );

    sendSuccess(res, logs, 'Lấy lịch sử hoạt động thành công', 200, paginate(total, page, limit));
  } catch (error) {
    next(error);
  }
};

// ── Admin: GET /api/admin/users/:id/login-history ────────────
export const getAdminUserLoginHistory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { page, limit, offset } = getPagination(req.query['page'] as string, req.query['limit'] as string);

    const user = await queryOne<RowDataPacket>('SELECT ma_id FROM nguoi_dung WHERE ma_id = ?', [id]);
    if (!user) { sendNotFound(res, 'Không tìm thấy người dùng'); return; }

    const countResult = await queryOne<RowDataPacket>(
      'SELECT COUNT(*) AS total FROM lich_su_dang_nhap WHERE ma_nguoi_dung = ?', [id]
    );
    const total = (countResult?.total as number) || 0;

    const history = await query<RowDataPacket>(
      `SELECT ma_id AS id,
              dang_nhap_luc AS login_at, dang_xuat_luc AS logout_at,
              dia_chi_ip AS ip_address, trinh_duyet_thiet_bi AS user_agent,
              trang_thai_dang_nhap AS login_status, ly_do_that_bai AS fail_reason
       FROM lich_su_dang_nhap WHERE ma_nguoi_dung = ?
       ORDER BY dang_nhap_luc DESC LIMIT ? OFFSET ?`,
      [id, limit, offset]
    );

    sendSuccess(res, history, 'Lấy lịch sử đăng nhập thành công', 200, paginate(total, page, limit));
  } catch (error) {
    next(error);
  }
};

// ── Admin: GET /api/admin/users/:id/activity ─────────────────
export const getAdminUserActivity = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { page, limit, offset } = getPagination(req.query['page'] as string, req.query['limit'] as string);

    const user = await queryOne<RowDataPacket>('SELECT ma_id FROM nguoi_dung WHERE ma_id = ?', [id]);
    if (!user) { sendNotFound(res, 'Không tìm thấy người dùng'); return; }

    const countResult = await queryOne<RowDataPacket>(
      'SELECT COUNT(*) AS total FROM nhat_ky_hoat_dong_nguoi_dung WHERE ma_nguoi_dung = ?', [id]
    );
    const total = (countResult?.total as number) || 0;

    const logs = await query<RowDataPacket>(
      `SELECT ma_id AS id, loai_hanh_dong AS action_type, mo_ta AS description,
              loai_doi_tuong AS entity_type, ma_doi_tuong AS entity_id,
              ngay_tao AS created_at
       FROM nhat_ky_hoat_dong_nguoi_dung WHERE ma_nguoi_dung = ?
       ORDER BY ngay_tao DESC LIMIT ? OFFSET ?`,
      [id, limit, offset]
    );

    sendSuccess(res, logs, 'Lấy lịch sử hoạt động thành công', 200, paginate(total, page, limit));
  } catch (error) {
    next(error);
  }
};

// ── Admin: GET /api/account/admin/users/:id/cart-history ─────
export const getAdminUserCartHistory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { page, limit, offset } = getPagination(req.query['page'] as string, req.query['limit'] as string);

    const user = await queryOne<RowDataPacket>('SELECT ma_id FROM nguoi_dung WHERE ma_id = ?', [id]);
    if (!user) { sendNotFound(res, 'Không tìm thấy người dùng'); return; }

    const countResult = await queryOne<RowDataPacket>(
      'SELECT COUNT(*) AS total FROM lich_su_gio_hang WHERE ma_nguoi_dung = ?',
      [id]
    );
    const total = (countResult?.total as number) || 0;

    const history = await query<RowDataPacket>(
      `SELECT ch.ma_id AS id,
              ch.loai_hanh_dong AS action_type, ch.so_luong AS quantity,
              ch.so_luong_cu AS old_quantity, ch.ngay_tao AS created_at,
              ch.ten_san_pham AS product_name,
              p.ma_id AS product_id, p.duong_dan_anh_dai_dien AS thumbnail_url
       FROM lich_su_gio_hang ch
       LEFT JOIN san_pham p ON ch.ma_san_pham = p.ma_id
       WHERE ch.ma_nguoi_dung = ?
       ORDER BY ch.ngay_tao DESC
       LIMIT ? OFFSET ?`,
      [id, limit, offset]
    );

    sendSuccess(res, history, 'Lấy lịch sử giỏ hàng thành công', 200, paginate(total, page, limit));
  } catch (error) {
    next(error);
  }
};

// ── Admin: GET /api/account/admin/users/:id/chat-history ───────
export const getAdminUserChatHistory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { page, limit, offset } = getPagination(req.query['page'] as string, req.query['limit'] as string);

    const user = await queryOne<RowDataPacket>('SELECT ma_id FROM nguoi_dung WHERE ma_id = ?', [id]);
    if (!user) { sendNotFound(res, 'Không tìm thấy người dùng'); return; }

    const countResult = await queryOne<RowDataPacket>(
      'SELECT COUNT(*) AS total FROM chat_sessions WHERE user_id = ?',
      [id]
    );
    const total = (countResult?.total as number) || 0;

    const history = await query<RowDataPacket>(
      `SELECT s.id, s.session_uuid, s.title, s.status, s.total_messages,
              s.created_at, s.updated_at,
              (
                SELECT message FROM chat_messages m WHERE m.session_id = s.id ORDER BY m.created_at DESC LIMIT 1
              ) AS last_message
       FROM chat_sessions s
       WHERE s.user_id = ?
       ORDER BY s.updated_at DESC
       LIMIT ? OFFSET ?`,
      [id, limit, offset]
    );

    sendSuccess(res, history, 'Lấy lịch sử chatbot của người dùng thành công', 200, paginate(total, page, limit));
  } catch (error) {
    next(error);
  }
};

