import { Request, Response, NextFunction } from 'express';
import { RowDataPacket } from 'mysql2';
import { query, queryOne, execute } from '../config/database';
import {
  sendSuccess, sendCreated, sendNotFound, sendBadRequest,
  sendForbidden, getPagination, paginate
} from '../utils/helpers';

// ── POST /api/reviews ─────────────────────────────────────────
export const createReview = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { product_id, order_id, rating, title, comment, images } = req.body;
    const userId = req.user!.userId;

    // Kiểm tra sản phẩm tồn tại
    const product = await queryOne<RowDataPacket>(
      'SELECT ma_id FROM san_pham WHERE ma_id = ? AND dang_hoat_dong = 1', [product_id]
    );
    if (!product) { sendNotFound(res, 'Sản phẩm không tồn tại'); return; }

    // Kiểm tra đã đánh giá chưa
    const existing = await queryOne<RowDataPacket>(
      'SELECT ma_id FROM danh_gia WHERE ma_nguoi_dung = ? AND ma_san_pham = ?', [userId, product_id]
    );
    if (existing) { sendBadRequest(res, 'Bạn đã đánh giá sản phẩm này rồi'); return; }

    // Xác minh đã mua sản phẩm chưa
    let isVerified = 0;
    if (order_id) {
      const purchased = await queryOne<RowDataPacket>(
        `SELECT ct.ma_id FROM chi_tiet_don_hang ct
         JOIN don_hang o ON ct.ma_don_hang = o.ma_id
         WHERE ct.ma_san_pham = ? AND o.ma_nguoi_dung = ? AND o.ma_id = ? AND o.trang_thai = 'delivered'`,
        [product_id, userId, order_id]
      );
      isVerified = purchased ? 1 : 0;
    }

    const result = await execute(
      `INSERT INTO danh_gia (ma_nguoi_dung, ma_san_pham, ma_don_hang, diem_danh_gia, tieu_de, binh_luan, hinh_anh, da_xac_minh)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, product_id, order_id || null, rating, title || null,
       comment || null, images ? JSON.stringify(images) : null, isVerified]
    );

    // Cập nhật diem_danh_gia_trung_binh và tong_danh_gia của san_pham
    await execute(
      `UPDATE san_pham
       SET diem_danh_gia_trung_binh = (SELECT ROUND(AVG(diem_danh_gia), 2) FROM danh_gia WHERE ma_san_pham = ? AND dang_hien_thi = 1),
           tong_danh_gia            = (SELECT COUNT(*) FROM danh_gia WHERE ma_san_pham = ? AND dang_hien_thi = 1)
       WHERE ma_id = ?`,
      [product_id, product_id, product_id]
    );

    const newReview = await queryOne<RowDataPacket>(
      `SELECT ma_id AS id, ma_nguoi_dung AS user_id, ma_san_pham AS product_id,
              diem_danh_gia AS rating, tieu_de AS title, binh_luan AS comment,
              hinh_anh AS images, da_xac_minh AS is_verified, dang_hien_thi AS is_visible,
              ngay_tao AS created_at
       FROM danh_gia WHERE ma_id = ?`, [result.insertId]
    );
    sendCreated(res, newReview, 'Đánh giá của bạn đã được ghi nhận');
  } catch (error) {
    next(error);
  }
};

// ── GET /api/reviews/product/:productId ───────────────────────
export const getProductReviews = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { productId } = req.params;
    const { page, limit, offset } = getPagination(req.query.page as string, req.query.limit as string);
    const { rating } = req.query;

    let sql = `
      SELECT r.ma_id AS id, r.ma_nguoi_dung AS user_id, r.ma_san_pham AS product_id,
             r.diem_danh_gia AS rating, r.tieu_de AS title, r.binh_luan AS comment,
             r.hinh_anh AS images, r.da_xac_minh AS is_verified, r.dang_hien_thi AS is_visible,
             r.ngay_tao AS created_at,
             u.ho_ten AS reviewer_name, u.duong_dan_anh_dai_dien AS reviewer_avatar
      FROM danh_gia r JOIN nguoi_dung u ON r.ma_nguoi_dung = u.ma_id
      WHERE r.ma_san_pham = ? AND r.dang_hien_thi = 1`;
    const params: unknown[] = [productId];

    if (rating) { sql += ' AND r.diem_danh_gia = ?'; params.push(rating); }

    const countResult = await queryOne<RowDataPacket>(
      `SELECT COUNT(*) AS total,
              ROUND(AVG(diem_danh_gia), 2) AS avg_rating,
              SUM(diem_danh_gia = 5) AS five_star,
              SUM(diem_danh_gia = 4) AS four_star,
              SUM(diem_danh_gia = 3) AS three_star,
              SUM(diem_danh_gia = 2) AS two_star,
              SUM(diem_danh_gia = 1) AS one_star
       FROM danh_gia WHERE ma_san_pham = ? AND dang_hien_thi = 1`,
      [productId]
    );

    sql += ' ORDER BY r.ngay_tao DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const reviews = await query<RowDataPacket>(sql, params);
    const total = countResult?.total || 0;

    sendSuccess(res, { reviews, stats: countResult }, 'Lấy đánh giá thành công', 200, paginate(total, page, limit));
  } catch (error) {
    next(error);
  }
};

// ── DELETE /api/reviews/:id ───────────────────────────────────
export const deleteReview = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;

    const review = await queryOne<RowDataPacket>(
      'SELECT ma_id, ma_nguoi_dung AS user_id, ma_san_pham AS product_id FROM danh_gia WHERE ma_id = ?', [id]
    );
    if (!review) { sendNotFound(res, 'Không tìm thấy đánh giá'); return; }

    if (req.user!.role === 'customer' && review.user_id !== userId) {
      sendForbidden(res); return;
    }

    const productId = review.product_id;
    await execute('DELETE FROM danh_gia WHERE ma_id = ?', [id]);

    await execute(
      `UPDATE san_pham
       SET diem_danh_gia_trung_binh = COALESCE((SELECT ROUND(AVG(diem_danh_gia), 2) FROM danh_gia WHERE ma_san_pham = ? AND dang_hien_thi = 1), 0),
           tong_danh_gia            = (SELECT COUNT(*) FROM danh_gia WHERE ma_san_pham = ? AND dang_hien_thi = 1)
       WHERE ma_id = ?`,
      [productId, productId, productId]
    );

    sendSuccess(res, null, 'Đã xoá đánh giá');
  } catch (error) {
    next(error);
  }
};

// ── GET /api/reviews/my — Đánh giá của tôi ───────────────────
export const getMyReviews = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { page, limit, offset } = getPagination(req.query.page as string, req.query.limit as string);
    const userId = req.user!.userId;

    const total = (await queryOne<RowDataPacket>(
      'SELECT COUNT(*) AS total FROM danh_gia WHERE ma_nguoi_dung = ?', [userId]
    ))?.total || 0;

    const reviews = await query<RowDataPacket>(
      `SELECT r.ma_id AS id, r.ma_san_pham AS product_id, r.diem_danh_gia AS rating,
              r.tieu_de AS title, r.binh_luan AS comment, r.ngay_tao AS created_at,
              p.ten AS product_name, p.duong_dan_anh_dai_dien AS product_image
       FROM danh_gia r JOIN san_pham p ON r.ma_san_pham = p.ma_id
       WHERE r.ma_nguoi_dung = ? ORDER BY r.ngay_tao DESC LIMIT ? OFFSET ?`,
      [userId, limit, offset]
    );

    sendSuccess(res, reviews, 'Lấy đánh giá của bạn thành công', 200, paginate(total, page, limit));
  } catch (error) {
    next(error);
  }
};
