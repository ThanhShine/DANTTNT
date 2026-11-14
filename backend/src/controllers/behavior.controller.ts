import { Request, Response, NextFunction } from 'express';
import { RowDataPacket } from 'mysql2';
import { query, queryOne, execute } from '../config/database';
import { sendSuccess, sendCreated, sendBadRequest, getPagination, paginate } from '../utils/helpers';
import { v4 as uuidv4 } from 'uuid';

// Các action types hợp lệ — phải khớp với ENUM loai_hanh_dong trong hanh_vi_nguoi_dung
const VALID_ACTIONS = ['view', 'click', 'add_to_cart', 'remove_from_cart', 'purchase', 'yeu_thich', 'like', 'review', 'search'] as const;
type ActionType = typeof VALID_ACTIONS[number];

// Trọng số điểm hành vi — dùng cho Recommendation System sau này
const BEHAVIOR_WEIGHTS: Record<ActionType, number> = {
  view:             1,
  click:            1.5,
  search:           1,
  add_to_cart:      3,
  remove_from_cart: -1,
  yeu_thich:        2,
  like:             2,
  review:           4,
  purchase:         5,
};

// ── POST /api/behaviors — Log hành vi ────────────────────────
export const logBehavior = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const {
      product_id,
      action_type,
      search_keyword,
      duration,
      source,
      metadata,
      session_id,
    } = req.body;

    const userId    = req.user?.userId || null;
    const sessionId = session_id || uuidv4();

    // Validate action_type
    if (!VALID_ACTIONS.includes(action_type)) {
      sendBadRequest(res, `action_type không hợp lệ. Chấp nhận: ${VALID_ACTIONS.join(', ')}`);
      return;
    }

    // Schema: hanh_vi_nguoi_dung.ma_san_pham NOT NULL → mọi hành vi (kể cả search) đều cần product_id
    if (!product_id) {
      sendBadRequest(res, 'product_id bắt buộc (cột ma_san_pham trong hanh_vi_nguoi_dung là NOT NULL)');
      return;
    }

    // Search phải có keyword
    if (action_type === 'search' && !search_keyword?.trim()) {
      sendBadRequest(res, 'search_keyword bắt buộc với action search');
      return;
    }

    const metaObj: Record<string, unknown> = metadata
      ? (typeof metadata === 'string' ? JSON.parse(metadata) : metadata)
      : {};
    if (search_keyword) metaObj.search_keyword = search_keyword;
    if (BEHAVIOR_WEIGHTS[action_type as ActionType] !== undefined) {
      metaObj.weight = BEHAVIOR_WEIGHTS[action_type as ActionType];
    }

    await execute(
      `INSERT INTO hanh_vi_nguoi_dung
         (ma_nguoi_dung, ma_phien, ma_san_pham, loai_hanh_dong, tu_khoa_tim_kiem, thoi_luong, nguon, du_lieu_bo_sung)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        sessionId,
        product_id || null,
        action_type,
        search_keyword?.trim() || null,
        duration || null,
        source || null,
        Object.keys(metaObj).length > 0 ? JSON.stringify(metaObj) : null,
      ]
    );

    sendCreated(res, { session_id: sessionId, weight: BEHAVIOR_WEIGHTS[action_type as ActionType] }, 'Ghi nhận hành vi thành công');
  } catch (error) {
    next(error);
  }
};

// ── POST /api/behaviors/batch — Ghi nhiều hành vi một lúc ────
export const logBehaviorBatch = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { behaviors } = req.body;
    const userId = req.user?.userId || null;

    if (!Array.isArray(behaviors) || behaviors.length === 0) {
      sendBadRequest(res, 'behaviors phải là mảng không rỗng');
      return;
    }

    if (behaviors.length > 50) {
      sendBadRequest(res, 'Tối đa 50 hành vi mỗi batch');
      return;
    }

    const sessionId = req.body.session_id || uuidv4();
    const values: unknown[] = [];
    const placeholders: string[] = [];

    for (const b of behaviors) {
      if (!VALID_ACTIONS.includes(b.action_type)) continue;
      // Schema: ma_san_pham NOT NULL → bỏ qua hành vi không có sản phẩm để không làm hỏng cả batch
      if (!b.product_id) continue;

      const metaObj: Record<string, unknown> = b.metadata || {};
      if (b.search_keyword) metaObj.search_keyword = b.search_keyword;

      placeholders.push('(?, ?, ?, ?, ?, ?, ?, ?)');
      values.push(
        userId,
        sessionId,
        b.product_id || null,
        b.action_type,
        b.search_keyword?.trim() || null,
        b.duration || null,
        b.source || null,
        Object.keys(metaObj).length > 0 ? JSON.stringify(metaObj) : null,
      );
    }

    if (placeholders.length === 0) {
      // Không có gì để lưu (vd: batch chỉ gồm search không có sản phẩm) — không phải lỗi phía client
      sendSuccess(res, { saved: 0, skipped: behaviors.length }, 'Không có hành vi nào cần lưu');
      return;
    }

    await execute(
      `INSERT INTO hanh_vi_nguoi_dung (ma_nguoi_dung, ma_phien, ma_san_pham, loai_hanh_dong, tu_khoa_tim_kiem, thoi_luong, nguon, du_lieu_bo_sung)
       VALUES ${placeholders.join(', ')}`,
      values
    );

    sendCreated(res, { saved: placeholders.length, skipped: behaviors.length - placeholders.length }, `Đã ghi ${placeholders.length} hành vi`);
  } catch (error) {
    next(error);
  }
};

// ── GET /api/behaviors — Admin: Xem log hành vi ───────────────
export const getBehaviors = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { page, limit, offset } = getPagination(req.query.page as string, req.query.limit as string);
    const { user_id, product_id, action_type, session_id, keyword, date_from, date_to } = req.query;

    let sql = `
      SELECT ub.ma_id AS id, ub.ma_nguoi_dung AS user_id, ub.ma_phien AS session_id,
             ub.ma_san_pham AS product_id, ub.loai_hanh_dong AS action_type,
             ub.tu_khoa_tim_kiem AS search_keyword, ub.thoi_luong AS duration,
             ub.nguon AS source, ub.ngay_tao AS created_at,
             p.ten AS product_name,
             u.ho_ten AS user_name, u.dia_chi_email AS user_email
      FROM hanh_vi_nguoi_dung ub
      LEFT JOIN san_pham p ON ub.ma_san_pham = p.ma_id
      LEFT JOIN nguoi_dung u ON ub.ma_nguoi_dung = u.ma_id
      WHERE 1=1`;
    const params: unknown[] = [];

    let countSql = 'SELECT COUNT(*) AS total FROM hanh_vi_nguoi_dung ub WHERE 1=1';
    const countParams: unknown[] = [];

    if (user_id)     { sql += ' AND ub.ma_nguoi_dung = ?';       params.push(user_id);    countSql += ' AND ub.ma_nguoi_dung = ?';    countParams.push(user_id); }
    if (product_id)  { sql += ' AND ub.ma_san_pham = ?';          params.push(product_id); countSql += ' AND ub.ma_san_pham = ?'; countParams.push(product_id); }
    if (action_type) { sql += ' AND ub.loai_hanh_dong = ?';       params.push(action_type); countSql += ' AND ub.loai_hanh_dong = ?'; countParams.push(action_type); }
    if (session_id)  { sql += ' AND ub.ma_phien = ?';             params.push(session_id); }
    if (keyword)     { sql += ' AND ub.tu_khoa_tim_kiem LIKE ?';  params.push(`%${keyword}%`); }
    if (date_from)   { sql += ' AND ub.ngay_tao >= ?';            params.push(date_from);  countSql += ' AND ub.ngay_tao >= ?'; countParams.push(date_from); }
    if (date_to)     { sql += ' AND ub.ngay_tao <= ?';            params.push(`${date_to} 23:59:59`); countSql += ' AND ub.ngay_tao <= ?'; countParams.push(`${date_to} 23:59:59`); }

    const countResult = await queryOne<RowDataPacket>(countSql, countParams);
    const total = countResult?.total || 0;

    sql += ' ORDER BY ub.ngay_tao DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const behaviors = await query<RowDataPacket>(sql, params);
    sendSuccess(res, behaviors, 'Lấy log hành vi thành công', 200, paginate(total, page, limit));
  } catch (error) {
    next(error);
  }
};

// ── GET /api/behaviors/stats — Thống kê hành vi ───────────────
export const getBehaviorStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { days = '30' } = req.query;
    const dayCount = Math.min(365, Math.max(1, parseInt(days as string) || 30));

    const actionStats = await query<RowDataPacket>(
      `SELECT loai_hanh_dong AS action_type,
              COUNT(*) AS total,
              COUNT(DISTINCT ma_nguoi_dung) AS unique_users,
              COUNT(DISTINCT ma_phien) AS unique_sessions
       FROM hanh_vi_nguoi_dung
       WHERE ngay_tao >= DATE_SUB(NOW(), INTERVAL ? DAY)
       GROUP BY loai_hanh_dong ORDER BY total DESC`,
      [dayCount]
    );

    const topViewedProducts = await query<RowDataPacket>(
      `SELECT ub.ma_san_pham AS product_id, p.ten AS name, p.duong_dan_anh_dai_dien AS thumbnail_url,
              COUNT(*) AS view_count,
              COUNT(DISTINCT ub.ma_nguoi_dung) AS unique_viewers
       FROM hanh_vi_nguoi_dung ub
       JOIN san_pham p ON ub.ma_san_pham = p.ma_id
       WHERE ub.loai_hanh_dong = 'view'
         AND ub.ngay_tao >= DATE_SUB(NOW(), INTERVAL ? DAY)
       GROUP BY ub.ma_san_pham, p.ten, p.duong_dan_anh_dai_dien
       ORDER BY view_count DESC LIMIT 10`,
      [dayCount]
    );

    const topKeywords = await query<RowDataPacket>(
      `SELECT tu_khoa_tim_kiem AS keyword, COUNT(*) AS count
       FROM hanh_vi_nguoi_dung
       WHERE loai_hanh_dong = 'search'
         AND tu_khoa_tim_kiem IS NOT NULL
         AND ngay_tao >= DATE_SUB(NOW(), INTERVAL ? DAY)
       GROUP BY tu_khoa_tim_kiem
       ORDER BY count DESC LIMIT 20`,
      [dayCount]
    );

    const hourlyActivity = await query<RowDataPacket>(
      `SELECT HOUR(ngay_tao) AS hour, COUNT(*) AS count
       FROM hanh_vi_nguoi_dung
       WHERE ngay_tao >= DATE_SUB(NOW(), INTERVAL ? DAY)
       GROUP BY HOUR(ngay_tao) ORDER BY hour`,
      [dayCount]
    );

    const conversionFunnel = await queryOne<RowDataPacket>(
      `SELECT
         SUM(loai_hanh_dong = 'view')          AS views,
         SUM(loai_hanh_dong = 'add_to_cart')   AS add_to_carts,
         SUM(loai_hanh_dong = 'purchase')      AS purchases
       FROM hanh_vi_nguoi_dung
       WHERE ngay_tao >= DATE_SUB(NOW(), INTERVAL ? DAY)`,
      [dayCount]
    );

    const dailyActivity = await query<RowDataPacket>(
      `SELECT DATE(ngay_tao) AS date, COUNT(*) AS events,
              COUNT(DISTINCT ma_nguoi_dung) AS active_users
       FROM hanh_vi_nguoi_dung
       WHERE ngay_tao >= DATE_SUB(NOW(), INTERVAL 7 DAY)
       GROUP BY DATE(ngay_tao) ORDER BY date`,
    );

    sendSuccess(res, {
      period: `${dayCount} ngày gần nhất`,
      actionStats,
      topViewedProducts,
      topKeywords,
      hourlyActivity,
      conversionFunnel,
      dailyActivity,
    });
  } catch (error) {
    next(error);
  }
};

// ── GET /api/behaviors/user/:userId — Hành vi của 1 user ──────
export const getUserBehaviors = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { userId } = req.params;
    const { page, limit, offset } = getPagination(req.query.page as string, req.query.limit as string);
    const { action_type } = req.query;

    if (req.user?.role !== 'admin' && req.user?.userId !== Number(userId)) {
      res.status(403).json({ success: false, message: 'Không có quyền truy cập' });
      return;
    }

    let sql = `
      SELECT ub.loai_hanh_dong AS action_type, ub.tu_khoa_tim_kiem AS search_keyword,
             ub.thoi_luong AS duration, ub.nguon AS source, ub.ngay_tao AS created_at,
             p.ma_id AS product_id, p.ten AS product_name, p.duong_dan_anh_dai_dien AS thumbnail_url
      FROM hanh_vi_nguoi_dung ub
      LEFT JOIN san_pham p ON ub.ma_san_pham = p.ma_id
      WHERE ub.ma_nguoi_dung = ?`;
    const params: unknown[] = [userId];

    if (action_type) { sql += ' AND ub.loai_hanh_dong = ?'; params.push(action_type); }

    const total = (await queryOne<RowDataPacket>(
      `SELECT COUNT(*) AS total FROM hanh_vi_nguoi_dung WHERE ma_nguoi_dung = ?` +
      (action_type ? ' AND loai_hanh_dong = ?' : ''),
      action_type ? [userId, action_type] : [userId]
    ))?.total || 0;

    sql += ' ORDER BY ub.ngay_tao DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const behaviors = await query<RowDataPacket>(sql, params);
    sendSuccess(res, behaviors, 'Lấy hành vi người dùng thành công', 200, paginate(total, page, limit));
  } catch (error) {
    next(error);
  }
};

// ── GET /api/behaviors/product/:productId — Hành vi trên SP ──
export const getProductBehaviors = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { productId } = req.params;

    const stats = await queryOne<RowDataPacket>(
      `SELECT
         SUM(loai_hanh_dong = 'view')          AS views,
         SUM(loai_hanh_dong = 'add_to_cart')   AS add_to_carts,
         SUM(loai_hanh_dong = 'purchase')      AS purchases,
         SUM(loai_hanh_dong = 'review')        AS reviews,
         SUM(loai_hanh_dong = 'like')          AS likes,
         COUNT(DISTINCT ma_nguoi_dung)          AS unique_users,
         COUNT(DISTINCT ma_phien)              AS unique_sessions,
         ROUND(AVG(CASE WHEN loai_hanh_dong = 'view' THEN thoi_luong END), 1) AS avg_view_duration
       FROM hanh_vi_nguoi_dung
       WHERE ma_san_pham = ? AND ngay_tao >= DATE_SUB(NOW(), INTERVAL 30 DAY)`,
      [productId]
    );

    sendSuccess(res, stats, 'Lấy thống kê hành vi sản phẩm thành công');
  } catch (error) {
    next(error);
  }
};
