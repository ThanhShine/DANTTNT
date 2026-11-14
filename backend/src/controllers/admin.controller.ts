import { Request, Response, NextFunction } from 'express';
import { RowDataPacket } from 'mysql2';
import { query, queryOne, execute } from '../config/database';
import { sendSuccess, sendNotFound, sendBadRequest, getPagination, paginate } from '../utils/helpers';

// ── GET /api/admin/dashboard ──────────────────────────────────
export const getDashboard = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const [users, products, orders, revenue] = await Promise.all([
      queryOne<RowDataPacket>('SELECT COUNT(*) AS total FROM nguoi_dung WHERE vai_tro = "customer"'),
      queryOne<RowDataPacket>('SELECT COUNT(*) AS total FROM san_pham WHERE dang_hoat_dong = 1'),
      queryOne<RowDataPacket>('SELECT COUNT(*) AS total FROM don_hang'),
      queryOne<RowDataPacket>('SELECT COALESCE(SUM(tong_tien),0) AS total FROM don_hang WHERE trang_thai_thanh_toan = "paid"'),
    ]);

    // Đơn hàng theo trạng thái
    const ordersByStatus = await query<RowDataPacket>(
      'SELECT trang_thai AS status, COUNT(*) AS count FROM don_hang GROUP BY trang_thai'
    );

    // Doanh thu 30 ngày gần nhất
    const revenueByDay = await query<RowDataPacket>(
      `SELECT DATE(ngay_tao) AS date, COUNT(*) AS orders, COALESCE(SUM(tong_tien),0) AS revenue
       FROM don_hang WHERE trang_thai_thanh_toan = 'paid' AND ngay_tao >= DATE_SUB(NOW(), INTERVAL 30 DAY)
       GROUP BY DATE(ngay_tao) ORDER BY date ASC`
    );

    // Top 5 sản phẩm bán chạy
    const topProducts = await query<RowDataPacket>(
      `SELECT ma_id AS id, ten AS name, tong_da_ban AS total_sold,
              diem_danh_gia_trung_binh AS avg_rating, duong_dan_anh_dai_dien AS thumbnail_url,
              so_luong_ton AS stock_quantity
       FROM san_pham WHERE dang_hoat_dong = 1
       ORDER BY tong_da_ban DESC LIMIT 5`
    );

    // Sản phẩm tồn kho thấp
    const lowStock = await query<RowDataPacket>(
      `SELECT ma_id AS id, ten AS name, ma_sku AS sku,
              so_luong_ton AS stock_quantity, duong_dan_anh_dai_dien AS thumbnail_url
       FROM san_pham WHERE dang_hoat_dong = 1 AND so_luong_ton <= 10 ORDER BY so_luong_ton ASC LIMIT 10`
    );

    // Đơn hàng mới nhất
    const recentOrders = await query<RowDataPacket>(
      `SELECT o.ma_id AS id, o.ma_don_hang AS order_code, o.trang_thai AS status,
              o.tong_tien AS total_amount, o.ngay_tao AS created_at,
              o.trang_thai_thanh_toan AS payment_status, u.ho_ten AS customer_name
       FROM don_hang o JOIN nguoi_dung u ON o.ma_nguoi_dung = u.ma_id
       ORDER BY o.ngay_tao DESC LIMIT 10`
    );

    // Người dùng mới 7 ngày
    const newUsers = await queryOne<RowDataPacket>(
      `SELECT COUNT(*) AS total FROM nguoi_dung WHERE ngay_tao >= DATE_SUB(NOW(), INTERVAL 7 DAY)`
    );

    // Đơn hàng mới hôm nay
    const todayOrders = await queryOne<RowDataPacket>(
      `SELECT COUNT(*) AS total FROM don_hang WHERE DATE(ngay_tao) = CURDATE()`
    );

    sendSuccess(res, {
      overview: {
        totalCustomers:    users?.total || 0,
        totalProducts:     products?.total || 0,
        totalOrders:       orders?.total || 0,
        totalRevenue:      revenue?.total || 0,
        newUsersThisWeek:  newUsers?.total || 0,
        todayOrders:       todayOrders?.total || 0,
      },
      ordersByStatus,
      revenueByDay,
      topProducts,
      lowStock,
      recentOrders,
    });
  } catch (error) {
    next(error);
  }
};

// ── GET /api/admin/reports/revenue ───────────────────────────
export const getRevenueReport = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { period = 'month', year = new Date().getFullYear() } = req.query;

    let sql: string;
    if (period === 'day') {
      sql = `SELECT DATE(ngay_tao) AS period, COUNT(*) AS orders,
                    COALESCE(SUM(tong_tien),0) AS revenue, COALESCE(AVG(tong_tien),0) AS avg_order_value
             FROM don_hang WHERE trang_thai_thanh_toan = 'paid' AND YEAR(ngay_tao) = ?
             GROUP BY DATE(ngay_tao) ORDER BY period ASC`;
    } else if (period === 'week') {
      sql = `SELECT YEARWEEK(ngay_tao) AS period, COUNT(*) AS orders, COALESCE(SUM(tong_tien),0) AS revenue
             FROM don_hang WHERE trang_thai_thanh_toan = 'paid' AND YEAR(ngay_tao) = ?
             GROUP BY YEARWEEK(ngay_tao) ORDER BY period ASC`;
    } else {
      sql = `SELECT MONTH(ngay_tao) AS period, COUNT(*) AS orders,
                    COALESCE(SUM(tong_tien),0) AS revenue, COALESCE(AVG(tong_tien),0) AS avg_order_value
             FROM don_hang WHERE trang_thai_thanh_toan = 'paid' AND YEAR(ngay_tao) = ?
             GROUP BY MONTH(ngay_tao) ORDER BY period ASC`;
    }

    const data = await query<RowDataPacket>(sql, [year]);

    const summary = await queryOne<RowDataPacket>(
      `SELECT COUNT(*) AS total_orders,
              COALESCE(SUM(tong_tien),0) AS total_revenue,
              COALESCE(AVG(tong_tien),0) AS avg_order_value
       FROM don_hang WHERE trang_thai_thanh_toan = 'paid' AND YEAR(ngay_tao) = ?`,
      [year]
    );

    sendSuccess(res, { period, year, data, summary });
  } catch (error) {
    next(error);
  }
};

// ── GET /api/admin/orders ─────────────────────────────────────
export const getAdminOrders = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { page, limit, offset } = getPagination(req.query.page as string, req.query.limit as string);
    const { status, payment_status, search } = req.query;

    let sql = `
      SELECT o.ma_id AS id, o.ma_don_hang AS order_code, o.trang_thai AS status,
             o.trang_thai_thanh_toan AS payment_status, o.tong_tien AS total_amount,
             o.phuong_thuc_thanh_toan AS payment_method, o.ngay_tao AS created_at,
             o.giao_hang_luc AS shipped_at, o.giao_thanh_cong_luc AS delivered_at,
             u.ho_ten AS customer_name, u.dia_chi_email AS customer_email
      FROM don_hang o JOIN nguoi_dung u ON o.ma_nguoi_dung = u.ma_id WHERE 1=1`;
    const params: unknown[] = [];

    let countSql = `SELECT COUNT(*) AS total FROM don_hang o JOIN nguoi_dung u ON o.ma_nguoi_dung = u.ma_id WHERE 1=1`;
    const countParams: unknown[] = [];

    if (status)         { sql += ' AND o.trang_thai = ?';              params.push(status);         countSql += ' AND o.trang_thai = ?';              countParams.push(status); }
    if (payment_status) { sql += ' AND o.trang_thai_thanh_toan = ?';   params.push(payment_status); countSql += ' AND o.trang_thai_thanh_toan = ?';   countParams.push(payment_status); }
    if (search)         { sql += ' AND (o.ma_don_hang LIKE ? OR u.ho_ten LIKE ? OR u.dia_chi_email LIKE ?)'; params.push(`%${search}%`, `%${search}%`, `%${search}%`); }

    const countResult = await queryOne<RowDataPacket>(countSql, countParams);
    const total = countResult?.total || 0;

    sql += ' ORDER BY o.ngay_tao DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const orders = await query<RowDataPacket>(sql, params);
    sendSuccess(res, orders, 'Lấy danh sách đơn hàng thành công', 200, paginate(total, page, limit));
  } catch (error) {
    next(error);
  }
};

// ── PUT /api/admin/orders/:id/status ─────────────────────────
export const updateAdminOrderStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, payment_status, admin_note } = req.body;

    const order = await queryOne<RowDataPacket>(
      'SELECT ma_id, trang_thai AS status FROM don_hang WHERE ma_id = ?', [id]
    );
    if (!order) { sendNotFound(res, 'Không tìm thấy đơn hàng'); return; }

    const fields: string[] = [];
    const values: unknown[] = [];

    if (status) {
      const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'returned'];
      if (!validStatuses.includes(status)) { sendBadRequest(res, 'Trạng thái không hợp lệ'); return; }
      fields.push('trang_thai = ?'); values.push(status);
      if (status === 'shipped')   { fields.push('giao_hang_luc = NOW()'); }
      if (status === 'delivered') { fields.push('giao_thanh_cong_luc = NOW()'); }
      if (status === 'cancelled') { fields.push('huy_luc = NOW()'); }
    }
    if (payment_status) { fields.push('trang_thai_thanh_toan = ?'); values.push(payment_status); }
    if (admin_note)     { fields.push('ghi_chu_quan_tri = ?');       values.push(admin_note); }

    if (fields.length === 0) { sendBadRequest(res, 'Không có dữ liệu cập nhật'); return; }

    await execute(`UPDATE don_hang SET ${fields.join(', ')} WHERE ma_id = ?`, [...values, id]);
    const updated = await queryOne<RowDataPacket>(
      `SELECT ma_id AS id, ma_don_hang AS order_code, trang_thai AS status,
              trang_thai_thanh_toan AS payment_status, tong_tien AS total_amount
       FROM don_hang WHERE ma_id = ?`, [id]
    );
    sendSuccess(res, updated, 'Cập nhật đơn hàng thành công');
  } catch (error) {
    next(error);
  }
};

// ── GET /api/admin/reviews ────────────────────────────────────
export const getAdminReviews = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { page, limit, offset } = getPagination(req.query.page as string, req.query.limit as string);
    const { is_visible, search, rating } = req.query;

    let sql = `
      SELECT r.ma_id AS id, r.diem_danh_gia AS rating, r.tieu_de AS title,
             r.binh_luan AS comment, r.dang_hien_thi AS is_visible,
             r.da_xac_minh AS is_verified, r.luot_huu_ich AS helpful_count,
             r.ngay_tao AS created_at,
             u.ho_ten AS reviewer_name, u.dia_chi_email AS reviewer_email,
             p.ten AS product_name, p.duong_dan_anh_dai_dien AS product_image
      FROM danh_gia r
      JOIN nguoi_dung u ON r.ma_nguoi_dung = u.ma_id
      JOIN san_pham p ON r.ma_san_pham = p.ma_id
      WHERE 1=1`;
    const params: unknown[] = [];

    let countSql = `SELECT COUNT(*) AS total FROM danh_gia r JOIN nguoi_dung u ON r.ma_nguoi_dung = u.ma_id JOIN san_pham p ON r.ma_san_pham = p.ma_id WHERE 1=1`;
    const countParams: unknown[] = [];

    if (is_visible !== undefined && is_visible !== '') {
      sql += ' AND r.dang_hien_thi = ?'; params.push(is_visible);
      countSql += ' AND r.dang_hien_thi = ?'; countParams.push(is_visible);
    }
    if (rating) { sql += ' AND r.diem_danh_gia = ?'; params.push(rating); countSql += ' AND r.diem_danh_gia = ?'; countParams.push(rating); }
    if (search) { sql += ' AND (u.ho_ten LIKE ? OR p.ten LIKE ? OR r.binh_luan LIKE ?)'; params.push(`%${search}%`, `%${search}%`, `%${search}%`); }

    const countResult = await queryOne<RowDataPacket>(countSql, countParams);
    const total = countResult?.total || 0;

    sql += ' ORDER BY r.ngay_tao DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const reviews = await query<RowDataPacket>(sql, params);
    sendSuccess(res, reviews, 'Lấy danh sách đánh giá thành công', 200, paginate(total, page, limit));
  } catch (error) {
    next(error);
  }
};

// ── PUT /api/admin/reviews/:id/visibility ─────────────────────
export const toggleReviewVisibility = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const review = await queryOne<RowDataPacket>(
      'SELECT ma_id, dang_hien_thi AS is_visible, ma_san_pham AS product_id FROM danh_gia WHERE ma_id = ?', [id]
    );
    if (!review) { sendNotFound(res, 'Không tìm thấy đánh giá'); return; }

    const newVisible = review.is_visible ? 0 : 1;
    await execute('UPDATE danh_gia SET dang_hien_thi = ? WHERE ma_id = ?', [newVisible, id]);

    await execute(
      `UPDATE san_pham
       SET diem_danh_gia_trung_binh = COALESCE((SELECT ROUND(AVG(diem_danh_gia),2) FROM danh_gia WHERE ma_san_pham = ? AND dang_hien_thi = 1), 0),
           tong_danh_gia            = (SELECT COUNT(*) FROM danh_gia WHERE ma_san_pham = ? AND dang_hien_thi = 1)
       WHERE ma_id = ?`,
      [review.product_id, review.product_id, review.product_id]
    );

    sendSuccess(res, { is_visible: newVisible }, newVisible ? 'Đã hiện đánh giá' : 'Đã ẩn đánh giá');
  } catch (error) {
    next(error);
  }
};

// ── DELETE /api/admin/reviews/:id ─────────────────────────────
export const deleteAdminReview = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const review = await queryOne<RowDataPacket>(
      'SELECT ma_id, ma_san_pham AS product_id FROM danh_gia WHERE ma_id = ?', [id]
    );
    if (!review) { sendNotFound(res, 'Không tìm thấy đánh giá'); return; }

    await execute('DELETE FROM danh_gia WHERE ma_id = ?', [id]);

    await execute(
      `UPDATE san_pham
       SET diem_danh_gia_trung_binh = COALESCE((SELECT ROUND(AVG(diem_danh_gia),2) FROM danh_gia WHERE ma_san_pham = ? AND dang_hien_thi = 1), 0),
           tong_danh_gia            = (SELECT COUNT(*) FROM danh_gia WHERE ma_san_pham = ? AND dang_hien_thi = 1)
       WHERE ma_id = ?`,
      [review.product_id, review.product_id, review.product_id]
    );

    sendSuccess(res, null, 'Đã xóa đánh giá');
  } catch (error) {
    next(error);
  }
};

// ── GET /api/admin/stats/top-products ─────────────────────────
export const getTopProducts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { limit = '10' } = req.query;
    const products = await query<RowDataPacket>(
      `SELECT p.ma_id AS id, p.ten AS name, p.duong_dan_anh_dai_dien AS thumbnail_url,
              p.tong_da_ban AS total_sold, p.diem_danh_gia_trung_binh AS avg_rating,
              p.gia_goc AS base_price, p.gia_ban AS sale_price,
              p.so_luong_ton AS stock_quantity, c.ten AS category_name
       FROM san_pham p
       JOIN danh_muc c ON p.ma_danh_muc = c.ma_id
       WHERE p.dang_hoat_dong = 1
       ORDER BY p.tong_da_ban DESC
       LIMIT ?`,
      [parseInt(limit as string, 10)]
    );
    sendSuccess(res, products, 'Lấy top sản phẩm thành công');
  } catch (error) {
    next(error);
  }
};

// ── GET /api/admin/stats/users ────────────────────────────────
export const getUserStats = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const [total, byRole, byStatus, newByMonth] = await Promise.all([
      queryOne<RowDataPacket>('SELECT COUNT(*) AS total FROM nguoi_dung'),
      query<RowDataPacket>('SELECT vai_tro AS role, COUNT(*) AS count FROM nguoi_dung GROUP BY vai_tro'),
      query<RowDataPacket>('SELECT dang_hoat_dong AS is_active, COUNT(*) AS count FROM nguoi_dung GROUP BY dang_hoat_dong'),
      query<RowDataPacket>(
        `SELECT MONTH(ngay_tao) AS month, YEAR(ngay_tao) AS year, COUNT(*) AS count
         FROM nguoi_dung
         WHERE ngay_tao >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
         GROUP BY YEAR(ngay_tao), MONTH(ngay_tao)
         ORDER BY year ASC, month ASC`
      ),
    ]);

    sendSuccess(res, { total: total?.total || 0, byRole, byStatus, newByMonth });
  } catch (error) {
    next(error);
  }
};

// ── GET /api/admin/inventory ──────────────────────────────────
export const getInventory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { page, limit, offset } = getPagination(req.query.page as string, req.query.limit as string);
    const { search, low_stock } = req.query;

    let sql = `
      SELECT p.ma_id AS id, p.ten AS name, p.ma_sku AS sku,
             p.so_luong_ton AS stock_quantity, p.duong_dan_anh_dai_dien AS thumbnail_url,
             p.gia_goc AS base_price, p.tong_da_ban AS total_sold, c.ten AS category_name
      FROM san_pham p JOIN danh_muc c ON p.ma_danh_muc = c.ma_id
      WHERE p.dang_hoat_dong = 1`;
    const params: unknown[] = [];

    if (low_stock === '1') { sql += ' AND p.so_luong_ton <= 10'; }
    if (search) { sql += ' AND (p.ten LIKE ? OR p.ma_sku LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }

    const countResult = await queryOne<RowDataPacket>(
      `SELECT COUNT(*) AS total FROM san_pham p WHERE p.dang_hoat_dong = 1` +
      (low_stock === '1' ? ' AND p.so_luong_ton <= 10' : '') +
      (search ? ' AND (p.ten LIKE ? OR p.ma_sku LIKE ?)' : ''),
      search ? [`%${search}%`, `%${search}%`] : []
    );
    const total = countResult?.total || 0;

    sql += ' ORDER BY p.so_luong_ton ASC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const inventory = await query<RowDataPacket>(sql, params);
    sendSuccess(res, inventory, 'Lấy tồn kho thành công', 200, paginate(total, page, limit));
  } catch (error) {
    next(error);
  }
};

// ── PUT /api/admin/inventory/:id ──────────────────────────────
export const updateInventory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { stock_quantity } = req.body;

    if (stock_quantity === undefined || stock_quantity < 0) {
      sendBadRequest(res, 'Số lượng tồn kho không hợp lệ'); return;
    }

    const product = await queryOne<RowDataPacket>(
      'SELECT ma_id FROM san_pham WHERE ma_id = ? AND dang_hoat_dong = 1', [id]
    );
    if (!product) { sendNotFound(res, 'Không tìm thấy sản phẩm'); return; }

    await execute('UPDATE san_pham SET so_luong_ton = ? WHERE ma_id = ?', [stock_quantity, id]);
    sendSuccess(res, { id, stock_quantity }, 'Cập nhật tồn kho thành công');
  } catch (error) {
    next(error);
  }
};
