import { Request, Response, NextFunction } from 'express';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { query, queryOne, execute } from '../config/database';
import { sendSuccess, sendCreated, sendNotFound, sendBadRequest, sendConflict } from '../utils/helpers';

/**
 * ── POST /api/coupons/validate ────────────────────────────────
 * Kiểm tra tính hợp lệ của mã giảm giá cho giỏ hàng
 */
export const validateCoupon = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { code } = req.body;
    if (!code || typeof code !== 'string') {
      sendBadRequest(res, 'Vui lòng nhập mã giảm giá');
      return;
    }
    const cleanCode = code.trim().toUpperCase();
    const rawSubtotal = req.body.subtotal ?? req.body.order_amount ?? 0;
    const orderSubtotal = parseFloat(rawSubtotal) || 0;

    const coupon = await queryOne<RowDataPacket>(
      `SELECT ma_id AS id, ma AS code, mo_ta AS description,
              loai AS type, gia_tri AS value,
              gia_tri_don_hang_toi_thieu AS min_order_amount,
              muc_giam_toi_da AS max_discount_amount,
              gioi_han_su_dung AS usage_limit,
              so_lan_da_dung AS used_count,
              ngay_bat_dau AS start_date,
              ngay_ket_thuc AS end_date,
              dang_hoat_dong AS is_active
       FROM ma_giam_gia
       WHERE UPPER(ma) = ?`,
      [cleanCode]
    );

    if (!coupon) {
      sendNotFound(res, `Mã giảm giá "${cleanCode}" không tồn tại`);
      return;
    }

    if (!coupon.is_active) {
      sendBadRequest(res, `Mã giảm giá "${cleanCode}" hiện đang tạm ngừng áp dụng`);
      return;
    }

    const now = new Date();
    const startDate = new Date(coupon.start_date);
    const endDate = new Date(coupon.end_date);

    if (now < startDate) {
      sendBadRequest(res, `Mã giảm giá "${cleanCode}" chỉ áp dụng từ ngày ${startDate.toLocaleDateString('vi-VN')}`);
      return;
    }

    if (now > endDate) {
      sendBadRequest(res, `Mã giảm giá "${cleanCode}" đã hết hạn vào ngày ${endDate.toLocaleDateString('vi-VN')}`);
      return;
    }

    if (coupon.usage_limit && coupon.used_count >= coupon.usage_limit) {
      sendBadRequest(res, `Mã giảm giá "${cleanCode}" đã hết lượt sử dụng`);
      return;
    }

    const minAmount = parseFloat(coupon.min_order_amount || '0');
    if (orderSubtotal < minAmount) {
      sendBadRequest(
        res,
        `Đơn hàng cần tối thiểu ${new Intl.NumberFormat('vi-VN').format(minAmount)}đ để áp dụng mã "${cleanCode}"`
      );
      return;
    }

    // Tính toán số tiền giảm giá
    const val = parseFloat(coupon.value);
    const maxDiscount = coupon.max_discount_amount ? parseFloat(coupon.max_discount_amount) : Infinity;

    let discountAmount = 0;
    if (coupon.type === 'percentage') {
      discountAmount = Math.min((orderSubtotal * val) / 100, maxDiscount);
    } else {
      discountAmount = Math.min(orderSubtotal, val);
    }

    discountAmount = Math.round(discountAmount);

    sendSuccess(
      res,
      {
        valid: true,
        id: coupon.id,
        code: coupon.code,
        description: coupon.description,
        type: coupon.type,
        value: val,
        discountAmount,
        minOrderAmount: minAmount,
        maxDiscountAmount: coupon.max_discount_amount ? maxDiscount : null,
      },
      `Áp dụng mã giảm giá "${cleanCode}" thành công!`
    );
  } catch (error) {
    next(error);
  }
};

/**
 * ── GET /api/coupons/available ────────────────────────────────
 * Lấy danh sách các mã giảm giá đang hoạt động để hiển thị cho khách
 */
export const getAvailableCoupons = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const coupons = await query<RowDataPacket>(
      `SELECT ma_id AS id, ma AS code, mo_ta AS description,
              loai AS type, gia_tri AS value,
              gia_tri_don_hang_toi_thieu AS min_order_amount,
              muc_giam_toi_da AS max_discount_amount,
              ngay_ket_thuc AS end_date
       FROM ma_giam_gia
       WHERE dang_hoat_dong = 1
         AND NOW() BETWEEN ngay_bat_dau AND ngay_ket_thuc
         AND (gioi_han_su_dung IS NULL OR so_lan_da_dung < gioi_han_su_dung)
       ORDER BY ngay_tao DESC`
    );

    sendSuccess(res, coupons, 'Lấy danh sách mã giảm giá thành công');
  } catch (error) {
    next(error);
  }
};

/**
 * ── GET /api/admin/coupons ─────────────────────────────────────
 * Admin: Lấy danh sách toàn bộ mã giảm giá
 */
export const adminGetCoupons = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { search, is_active } = req.query;

    let sql = `
      SELECT c.ma_id AS id, c.ma AS code, c.mo_ta AS description,
             c.loai AS type, c.gia_tri AS value,
             c.gia_tri_don_hang_toi_thieu AS min_order_amount,
             c.muc_giam_toi_da AS max_discount_amount,
             c.gioi_han_su_dung AS usage_limit,
             c.so_lan_da_dung AS used_count,
             c.ngay_bat_dau AS start_date,
             c.ngay_ket_thuc AS end_date,
             c.dang_hoat_dong AS is_active,
             c.ngay_tao AS created_at,
             u.ho_ten AS creator_name
      FROM ma_giam_gia c
      LEFT JOIN nguoi_dung u ON c.tao_boi = u.ma_id
      WHERE 1=1
    `;
    const params: unknown[] = [];

    if (search) {
      sql += ' AND (c.ma LIKE ? OR c.mo_ta LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    if (is_active !== undefined && is_active !== '') {
      sql += ' AND c.dang_hoat_dong = ?';
      params.push(is_active === '1' || is_active === 'true' ? 1 : 0);
    }

    sql += ' ORDER BY c.ngay_tao DESC';

    const coupons = await query<RowDataPacket>(sql, params);
    sendSuccess(res, coupons, 'Lấy danh sách mã giảm giá thành công');
  } catch (error) {
    next(error);
  }
};

/**
 * ── POST /api/admin/coupons ────────────────────────────────────
 * Admin: Tạo mã giảm giá mới
 */
export const adminCreateCoupon = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const adminId = req.user!.userId;
    const {
      code,
      description,
      type = 'percentage',
      value,
      min_order_amount = 0,
      max_discount_amount,
      usage_limit,
      start_date,
      end_date,
      is_active = 1,
    } = req.body;

    const cleanCode = String(code).trim().toUpperCase();

    // Kiểm tra mã trùng lặp
    const exist = await queryOne<RowDataPacket>('SELECT ma_id FROM ma_giam_gia WHERE UPPER(ma) = ?', [cleanCode]);
    if (exist) {
      sendConflict(res, `Mã giảm giá "${cleanCode}" đã tồn tại`);
      return;
    }

    const startDate = start_date ? new Date(start_date) : new Date();
    const endDate = end_date ? new Date(end_date) : new Date(Date.now() + 30 * 86400000);

    const result = await execute(
      `INSERT INTO ma_giam_gia (
        ma, mo_ta, loai, gia_tri, gia_tri_don_hang_toi_thieu, muc_giam_toi_da,
        gioi_han_su_dung, so_lan_da_dung, ngay_bat_dau, ngay_ket_thuc, dang_hoat_dong, tao_boi
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?)`,
      [
        cleanCode,
        description || null,
        type,
        value,
        min_order_amount || 0,
        type === 'percentage' ? (max_discount_amount || null) : null,
        usage_limit || null,
        startDate,
        endDate,
        is_active ? 1 : 0,
        adminId,
      ]
    );

    sendCreated(res, { id: result.insertId, code: cleanCode }, 'Tạo mã giảm giá thành công');
  } catch (error) {
    next(error);
  }
};

/**
 * ── PUT /api/admin/coupons/:id ─────────────────────────────────
 * Admin: Cập nhật mã giảm giá
 */
export const adminUpdateCoupon = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const {
      description,
      type,
      value,
      min_order_amount,
      max_discount_amount,
      usage_limit,
      start_date,
      end_date,
      is_active,
    } = req.body;

    const exist = await queryOne<RowDataPacket>('SELECT ma_id FROM ma_giam_gia WHERE ma_id = ?', [id]);
    if (!exist) {
      sendNotFound(res, 'Không tìm thấy mã giảm giá');
      return;
    }

    const fields: string[] = [];
    const values: unknown[] = [];

    if (description !== undefined) { fields.push('mo_ta = ?'); values.push(description); }
    if (type !== undefined) { fields.push('loai = ?'); values.push(type); }
    if (value !== undefined) { fields.push('gia_tri = ?'); values.push(value); }
    if (min_order_amount !== undefined) { fields.push('gia_tri_don_hang_toi_thieu = ?'); values.push(min_order_amount); }
    if (max_discount_amount !== undefined) { fields.push('muc_giam_toi_da = ?'); values.push(max_discount_amount); }
    if (usage_limit !== undefined) { fields.push('gioi_han_su_dung = ?'); values.push(usage_limit); }
    if (start_date !== undefined) { fields.push('ngay_bat_dau = ?'); values.push(new Date(start_date)); }
    if (end_date !== undefined) { fields.push('ngay_ket_thuc = ?'); values.push(new Date(end_date)); }
    if (is_active !== undefined) { fields.push('dang_hoat_dong = ?'); values.push(is_active ? 1 : 0); }

    if (fields.length > 0) {
      values.push(id);
      await execute(`UPDATE ma_giam_gia SET ${fields.join(', ')} WHERE ma_id = ?`, values);
    }

    sendSuccess(res, null, 'Cập nhật mã giảm giá thành công');
  } catch (error) {
    next(error);
  }
};

/**
 * ── PATCH /api/admin/coupons/:id/toggle ────────────────────────
 * Admin: Bật/tắt trạng thái mã giảm giá
 */
export const adminToggleCoupon = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const coupon = await queryOne<RowDataPacket>('SELECT ma_id, dang_hoat_dong FROM ma_giam_gia WHERE ma_id = ?', [id]);
    if (!coupon) {
      sendNotFound(res, 'Không tìm thấy mã giảm giá');
      return;
    }

    const nextState = coupon.dang_hoat_dong === 1 ? 0 : 1;
    await execute('UPDATE ma_giam_gia SET dang_hoat_dong = ? WHERE ma_id = ?', [nextState, id]);

    sendSuccess(res, { is_active: nextState }, `Đã ${nextState === 1 ? 'kích hoạt' : 'tạm ngừng'} mã giảm giá`);
  } catch (error) {
    next(error);
  }
};

/**
 * ── DELETE /api/admin/coupons/:id ──────────────────────────────
 * Admin: Xóa mã giảm giá
 */
export const adminDeleteCoupon = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const exist = await queryOne<RowDataPacket>('SELECT ma_id FROM ma_giam_gia WHERE ma_id = ?', [id]);
    if (!exist) {
      sendNotFound(res, 'Không tìm thấy mã giảm giá');
      return;
    }

    await execute('DELETE FROM ma_giam_gia WHERE ma_id = ?', [id]);
    sendSuccess(res, null, 'Xóa mã giảm giá thành công');
  } catch (error) {
    next(error);
  }
};
