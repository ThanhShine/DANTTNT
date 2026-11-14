import { Request, Response, NextFunction } from 'express';
import { RowDataPacket } from 'mysql2';
import { query, queryOne, execute } from '../config/database';
import {
  sendSuccess, sendCreated, sendNotFound, sendConflict, sendBadRequest,
  getPagination, paginate, toSlug
} from '../utils/helpers';

const sanitizePrice = (val: unknown): number => {
  if (val === null || val === undefined || val === '') return 0;
  if (typeof val === 'number') {
    if (val > 0 && val < 100) return Math.round(val * 1000000);
    return val;
  }
  let str = String(val).trim();
  if ((str.match(/[.,]/g) || []).length > 1) {
    str = str.replace(/[.,]/g, '');
    return parseFloat(str) || 0;
  }
  if (/^[0-9]+[.,][0-9]{3}$/.test(str)) {
    str = str.replace(/[.,]/g, '');
    return parseFloat(str) || 0;
  }
  const parsed = parseFloat(str.replace(/,/g, '.')) || 0;
  if (parsed > 0 && parsed < 100) return Math.round(parsed * 1000000);
  return parsed;
};

// ── GET /api/products ─────────────────────────────────────────
export const getProducts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { page, limit, offset } = getPagination(req.query.page as string, req.query.limit as string);
    const { category_id, brand, min_price, max_price, is_featured, search, sort_by, order } = req.query;

    let sql = `
      SELECT p.ma_id AS id, p.ma_danh_muc AS category_id, p.ten AS name, p.duong_dan AS slug,
             p.ma_sku AS sku, p.thuong_hieu AS brand, p.mo_ta_ngan AS short_description,
             p.mo_ta AS description, p.thong_so AS specifications, p.the AS tags,
             p.gia_goc AS base_price, p.gia_ban AS sale_price, p.so_luong_ton AS stock_quantity,
             p.duong_dan_anh_dai_dien AS thumbnail_url, p.diem_danh_gia_trung_binh AS avg_rating,
             p.tong_danh_gia AS total_reviews, p.tong_da_ban AS total_sold,
             p.dang_hoat_dong AS is_active, p.noi_bat AS is_featured,
             p.ngay_tao AS created_at, p.ngay_cap_nhat AS updated_at,
             p.phan_tram_giam AS discount_percent,
             c.ten AS category_name
      FROM san_pham p
      JOIN danh_muc c ON p.ma_danh_muc = c.ma_id
      WHERE p.dang_hoat_dong = 1`;
    const params: unknown[] = [];

    if (category_id)  { sql += ' AND p.ma_danh_muc = ?'; params.push(category_id); }
    if (brand)        { sql += ' AND p.thuong_hieu = ?'; params.push(brand); }
    if (min_price)    { sql += ' AND COALESCE(p.gia_ban, p.gia_goc) >= ?'; params.push(min_price); }
    if (max_price)    { sql += ' AND COALESCE(p.gia_ban, p.gia_goc) <= ?'; params.push(max_price); }
    if (is_featured)  { sql += ' AND p.noi_bat = ?'; params.push(is_featured); }
    if (search)       { sql += ' AND (p.ten LIKE ? OR p.mo_ta_ngan LIKE ? OR p.thuong_hieu LIKE ?)'; params.push(`%${search}%`, `%${search}%`, `%${search}%`); }

    // Count total
    const countRows = await queryOne<RowDataPacket>(
      `SELECT COUNT(*) AS total FROM san_pham p WHERE p.dang_hoat_dong = 1` +
      (category_id ? ' AND p.ma_danh_muc = ?' : '') +
      (brand ? ' AND p.thuong_hieu = ?' : '') +
      (min_price ? ' AND COALESCE(p.gia_ban, p.gia_goc) >= ?' : '') +
      (max_price ? ' AND COALESCE(p.gia_ban, p.gia_goc) <= ?' : '') +
      (is_featured ? ' AND p.noi_bat = ?' : ''),
      params.slice(0, params.length) // reuse same filter params
    );
    const total = countRows?.total || 0;

    // Sorting
    const sortMap: Record<string, string> = {
      'base_price': 'p.gia_goc', 'avg_rating': 'p.diem_danh_gia_trung_binh',
      'total_sold': 'p.tong_da_ban', 'created_at': 'p.ngay_tao'
    };
    const sortField  = sortMap[sort_by as string] || 'p.ngay_tao';
    const sortOrder  = order === 'asc' ? 'ASC' : 'DESC';
    sql += ` ORDER BY ${sortField} ${sortOrder} LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const products = await query<RowDataPacket>(sql, params);

    sendSuccess(res, products, 'Lấy danh sách sản phẩm thành công', 200, paginate(total, page, limit));
  } catch (error) {
    next(error);
  }
};

// ── GET /api/products/:id ─────────────────────────────────────
export const getProductById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    const product = await queryOne<RowDataPacket>(
      `SELECT p.ma_id AS id, p.ma_danh_muc AS category_id, p.ten AS name, p.duong_dan AS slug,
              p.ma_sku AS sku, p.thuong_hieu AS brand, p.mo_ta_ngan AS short_description,
              p.mo_ta AS description, p.thong_so AS specifications, p.the AS tags,
              p.gia_goc AS base_price, p.gia_ban AS sale_price, p.so_luong_ton AS stock_quantity,
              p.duong_dan_anh_dai_dien AS thumbnail_url, p.diem_danh_gia_trung_binh AS avg_rating,
              p.tong_danh_gia AS total_reviews, p.tong_da_ban AS total_sold,
              p.dang_hoat_dong AS is_active, p.noi_bat AS is_featured,
              p.ngay_tao AS created_at, p.ngay_cap_nhat AS updated_at,
              p.phan_tram_giam AS discount_percent,
              c.ten AS category_name
       FROM san_pham p
       JOIN danh_muc c ON p.ma_danh_muc = c.ma_id
       WHERE p.ma_id = ? AND p.dang_hoat_dong = 1`, [id]
    );
    if (!product) { sendNotFound(res, 'Không tìm thấy sản phẩm'); return; }

    // Lấy ảnh
    const images = await query<RowDataPacket>(
      `SELECT ma_id AS id, ma_san_pham AS product_id, duong_dan_hinh_anh AS image_url,
              van_ban_thay_the AS alt_text, thu_tu AS sort_order, la_anh_chinh AS is_primary,
              ngay_tao AS created_at
       FROM hinh_anh_san_pham WHERE ma_san_pham = ? ORDER BY thu_tu ASC`, [id]
    );

    // Lấy biến thể
    const variants = await query<RowDataPacket>(
      `SELECT ma_id AS id, ma_san_pham AS product_id, ma_sku AS sku, ten_bien_the AS variant_name,
              thuoc_tinh AS attributes, gia AS price, so_luong_ton AS stock_quantity,
              duong_dan_hinh_anh AS image_url, dang_hoat_dong AS is_active,
              ngay_tao AS created_at
       FROM bien_the_san_pham WHERE ma_san_pham = ? AND dang_hoat_dong = 1`, [id]
    );

    // Lấy review gần đây
    const reviews = await query<RowDataPacket>(
      `SELECT r.ma_id AS id, r.ma_nguoi_dung AS user_id, r.ma_san_pham AS product_id,
              r.diem_danh_gia AS rating, r.tieu_de AS title, r.binh_luan AS comment,
              r.hinh_anh AS images, r.da_xac_minh AS is_verified, r.dang_hien_thi AS is_visible,
              r.ngay_tao AS created_at,
              u.ho_ten AS reviewer_name, u.duong_dan_anh_dai_dien AS reviewer_avatar
       FROM danh_gia r
       JOIN nguoi_dung u ON r.ma_nguoi_dung = u.ma_id
       WHERE r.ma_san_pham = ? AND r.dang_hien_thi = 1
       ORDER BY r.ngay_tao DESC LIMIT 5`, [id]
    );

    sendSuccess(res, { ...product, images, variants, reviews });
  } catch (error) {
    next(error);
  }
};

// ── POST /api/products — Admin ────────────────────────────────
export const createProduct = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const {
      category_id, name, sku, brand, short_description, description,
      specifications, tags, base_price, sale_price, stock_quantity,
      thumbnail_url, is_featured
    } = req.body;

    // Kiểm tra SKU trùng
    const existSku = await queryOne<RowDataPacket>('SELECT ma_id FROM san_pham WHERE ma_sku = ?', [sku]);
    if (existSku) { sendConflict(res, 'SKU đã tồn tại'); return; }

    // Tạo slug duy nhất
    let slug = toSlug(name);
    const existSlug = await queryOne<RowDataPacket>('SELECT ma_id FROM san_pham WHERE duong_dan = ?', [slug]);
    if (existSlug) slug = `${slug}-${Date.now()}`;

    const result = await execute(
      `INSERT INTO san_pham
       (ma_danh_muc, ten, duong_dan, ma_sku, thuong_hieu, mo_ta_ngan, mo_ta,
        thong_so, the, gia_goc, gia_ban, so_luong_ton,
        duong_dan_anh_dai_dien, noi_bat)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        category_id, name, slug, sku, brand || null, short_description || null,
        description || null,
        specifications ? JSON.stringify(specifications) : null,
        tags ? JSON.stringify(tags) : null,
        sanitizePrice(base_price), sale_price ? sanitizePrice(sale_price) : null, stock_quantity || 0,
        thumbnail_url || null, is_featured ? 1 : 0
      ]
    );

    const newProduct = await queryOne<RowDataPacket>(
      `SELECT ma_id AS id, ten AS name, duong_dan AS slug, ma_sku AS sku, gia_goc AS base_price,
              gia_ban AS sale_price, so_luong_ton AS stock_quantity, ngay_tao AS created_at
       FROM san_pham WHERE ma_id = ?`, [result.insertId]
    );
    sendCreated(res, newProduct, 'Tạo sản phẩm thành công');
  } catch (error) {
    next(error);
  }
};

// ── PUT /api/products/:id — Admin ─────────────────────────────
export const updateProduct = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const {
      category_id, name, brand, short_description, description,
      specifications, tags, base_price, sale_price, stock_quantity,
      thumbnail_url, is_featured, is_active
    } = req.body;

    const existing = await queryOne<RowDataPacket>('SELECT ma_id FROM san_pham WHERE ma_id = ?', [id]);
    if (!existing) { sendNotFound(res, 'Không tìm thấy sản phẩm'); return; }

    const slug = toSlug(name);
    await execute(
      `UPDATE san_pham SET
        ma_danh_muc = ?, ten = ?, duong_dan = ?, thuong_hieu = ?, mo_ta_ngan = ?,
        mo_ta = ?, thong_so = ?, the = ?, gia_goc = ?,
        gia_ban = ?, so_luong_ton = ?, duong_dan_anh_dai_dien = ?,
        noi_bat = ?, dang_hoat_dong = ?
       WHERE ma_id = ?`,
      [
        category_id, name, slug, brand || null, short_description || null,
        description || null,
        specifications ? JSON.stringify(specifications) : null,
        tags ? JSON.stringify(tags) : null,
        sanitizePrice(base_price), sale_price ? sanitizePrice(sale_price) : null, stock_quantity ?? 0,
        thumbnail_url || null, is_featured ? 1 : 0, is_active ?? 1, id
      ]
    );

    const updated = await queryOne<RowDataPacket>(
      `SELECT ma_id AS id, ten AS name, duong_dan AS slug, gia_goc AS base_price,
              gia_ban AS sale_price, so_luong_ton AS stock_quantity
       FROM san_pham WHERE ma_id = ?`, [id]
    );
    sendSuccess(res, updated, 'Cập nhật sản phẩm thành công');
  } catch (error) {
    next(error);
  }
};

// ── DELETE /api/products/:id — Admin ──────────────────────────
export const deleteProduct = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const existing = await queryOne<RowDataPacket>('SELECT ma_id FROM san_pham WHERE ma_id = ?', [id]);
    if (!existing) { sendNotFound(res, 'Không tìm thấy sản phẩm'); return; }

    await execute('UPDATE san_pham SET dang_hoat_dong = 0 WHERE ma_id = ?', [id]);
    sendSuccess(res, null, 'Đã ẩn sản phẩm thành công');
  } catch (error) {
    next(error);
  }
};

// ── GET /api/products/search ──────────────────────────────────
export const searchProducts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { q } = req.query;
    if (!q) { sendSuccess(res, []); return; }

    const products = await query<RowDataPacket>(
      `SELECT p.ma_id AS id, p.ten AS name, p.duong_dan_anh_dai_dien AS thumbnail_url,
              p.gia_goc AS base_price, p.gia_ban AS sale_price,
              p.diem_danh_gia_trung_binh AS avg_rating, p.duong_dan AS slug
       FROM san_pham p
       WHERE p.dang_hoat_dong = 1
         AND (p.ten LIKE ? OR p.mo_ta_ngan LIKE ? OR p.thuong_hieu LIKE ?)
       LIMIT 20`,
      [`%${q}%`, `%${q}%`, `%${q}%`]
    );

    sendSuccess(res, products, `Kết quả tìm kiếm cho "${q}"`);
  } catch (error) {
    next(error);
  }
};

// ── POST /api/products/:id/variants — Admin ───────────────────
export const addProductVariant = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { sku, variant_name, price, stock_quantity = 0, attributes, image_url } = req.body;

    if (!variant_name || !sku) {
      sendBadRequest(res, 'Vui lòng cung cấp tên biến thể và SKU');
      return;
    }

    const product = await queryOne<RowDataPacket>('SELECT ma_id, gia_ban, gia_goc FROM san_pham WHERE ma_id = ?', [id]);
    if (!product) {
      sendNotFound(res, 'Không tìm thấy sản phẩm');
      return;
    }

    const existSku = await queryOne<RowDataPacket>('SELECT ma_id FROM bien_the_san_pham WHERE ma_sku = ?', [sku.trim()]);
    if (existSku) {
      sendConflict(res, `Mã SKU biến thể "${sku}" đã tồn tại`);
      return;
    }

    const finalPrice = price !== undefined && price !== null && price !== ''
      ? sanitizePrice(price)
      : (product.gia_ban || product.gia_goc);

    const result = await execute(
      `INSERT INTO bien_the_san_pham
       (ma_san_pham, ma_sku, ten_bien_the, thuoc_tinh, gia, so_luong_ton, duong_dan_hinh_anh, dang_hoat_dong)
       VALUES (?, ?, ?, ?, ?, ?, ?, 1)`,
      [
        id,
        sku.trim(),
        variant_name.trim(),
        JSON.stringify(attributes || {}),
        finalPrice,
        parseInt(stock_quantity) || 0,
        image_url?.trim() || null,
      ]
    );

    // Cập nhật tổng tồn kho sản phẩm cha
    await execute(
      `UPDATE san_pham SET so_luong_ton = (
         SELECT COALESCE(SUM(so_luong_ton), 0) FROM bien_the_san_pham WHERE ma_san_pham = ? AND dang_hoat_dong = 1
       ) WHERE ma_id = ?`,
      [id, id]
    );

    const newVariant = await queryOne<RowDataPacket>(
      `SELECT ma_id AS id, ma_san_pham AS product_id, ma_sku AS sku, ten_bien_the AS variant_name,
              thuoc_tinh AS attributes, gia AS price, so_luong_ton AS stock_quantity,
              duong_dan_hinh_anh AS image_url, dang_hoat_dong AS is_active
       FROM bien_the_san_pham WHERE ma_id = ?`,
      [result.insertId]
    );

    sendCreated(res, newVariant, 'Thêm biến thể sản phẩm thành công');
  } catch (error) {
    next(error);
  }
};

// ── PUT /api/products/:id/variants/:variantId — Admin ─────────
export const updateProductVariant = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id, variantId } = req.params;
    const { sku, variant_name, price, stock_quantity, attributes, image_url, is_active } = req.body;

    const variant = await queryOne<RowDataPacket>(
      'SELECT ma_id FROM bien_the_san_pham WHERE ma_id = ? AND ma_san_pham = ?',
      [variantId, id]
    );
    if (!variant) {
      sendNotFound(res, 'Không tìm thấy biến thể sản phẩm');
      return;
    }

    if (sku) {
      const existSku = await queryOne<RowDataPacket>(
        'SELECT ma_id FROM bien_the_san_pham WHERE ma_sku = ? AND ma_id != ?',
        [sku.trim(), variantId]
      );
      if (existSku) {
        sendConflict(res, `Mã SKU "${sku}" đã được sử dụng bởi biến thể khác`);
        return;
      }
    }

    await execute(
      `UPDATE bien_the_san_pham SET
         ma_sku = COALESCE(?, ma_sku),
         ten_bien_the = COALESCE(?, ten_bien_the),
         thuoc_tinh = CASE WHEN ? IS NOT NULL THEN ? ELSE thuoc_tinh END,
         gia = CASE WHEN ? IS NOT NULL THEN ? ELSE gia END,
         so_luong_ton = COALESCE(?, so_luong_ton),
         duong_dan_hinh_anh = CASE WHEN ? IS NOT NULL THEN ? ELSE duong_dan_hinh_anh END,
         dang_hoat_dong = COALESCE(?, dang_hoat_dong)
       WHERE ma_id = ? AND ma_san_pham = ?`,
      [
        sku ? sku.trim() : null,
        variant_name ? variant_name.trim() : null,
        attributes ? 1 : null,
        attributes ? JSON.stringify(attributes) : null,
        price !== undefined ? 1 : null,
        price !== undefined ? sanitizePrice(price) : null,
        stock_quantity !== undefined ? parseInt(stock_quantity) : null,
        image_url !== undefined ? 1 : null,
        image_url !== undefined ? image_url?.trim() || null : null,
        is_active !== undefined ? (is_active ? 1 : 0) : null,
        variantId,
        id,
      ]
    );

    // Cập nhật tổng tồn kho cha
    await execute(
      `UPDATE san_pham SET so_luong_ton = (
         SELECT COALESCE(SUM(so_luong_ton), 0) FROM bien_the_san_pham WHERE ma_san_pham = ? AND dang_hoat_dong = 1
       ) WHERE ma_id = ?`,
      [id, id]
    );

    const updated = await queryOne<RowDataPacket>(
      `SELECT ma_id AS id, ma_san_pham AS product_id, ma_sku AS sku, ten_bien_the AS variant_name,
              thuoc_tinh AS attributes, gia AS price, so_luong_ton AS stock_quantity,
              duong_dan_hinh_anh AS image_url, dang_hoat_dong AS is_active
       FROM bien_the_san_pham WHERE ma_id = ?`,
      [variantId]
    );

    sendSuccess(res, updated, 'Cập nhật biến thể thành công');
  } catch (error) {
    next(error);
  }
};

// ── DELETE /api/products/:id/variants/:variantId — Admin ──────
export const deleteProductVariant = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id, variantId } = req.params;

    const variant = await queryOne<RowDataPacket>(
      'SELECT ma_id FROM bien_the_san_pham WHERE ma_id = ? AND ma_san_pham = ?',
      [variantId, id]
    );
    if (!variant) {
      sendNotFound(res, 'Không tìm thấy biến thể');
      return;
    }

    // Xóa biến thể
    await execute('DELETE FROM bien_the_san_pham WHERE ma_id = ? AND ma_san_pham = ?', [variantId, id]);

    // Đồng bộ tồn kho cha
    await execute(
      `UPDATE san_pham SET so_luong_ton = (
         SELECT COALESCE(SUM(so_luong_ton), 0) FROM bien_the_san_pham WHERE ma_san_pham = ? AND dang_hoat_dong = 1
       ) WHERE ma_id = ?`,
      [id, id]
    );

    sendSuccess(res, null, 'Đã xóa biến thể thành công');
  } catch (error) {
    next(error);
  }
};

// ── POST /api/products/:id/images — Admin ─────────────────────
export const addProductImage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { image_url, alt_text, sort_order = 0, is_primary = false } = req.body;

    if (!image_url || typeof image_url !== 'string') {
      sendBadRequest(res, 'Vui lòng cung cấp đường dẫn ảnh (image_url)');
      return;
    }

    const product = await queryOne<RowDataPacket>('SELECT ma_id FROM san_pham WHERE ma_id = ?', [id]);
    if (!product) {
      sendNotFound(res, 'Không tìm thấy sản phẩm');
      return;
    }

    const cleanUrl = image_url.trim();

    if (is_primary) {
      await execute('UPDATE hinh_anh_san_pham SET la_anh_chinh = 0 WHERE ma_san_pham = ?', [id]);
      await execute('UPDATE san_pham SET duong_dan_anh_dai_dien = ? WHERE ma_id = ?', [cleanUrl, id]);
    }

    const result = await execute(
      `INSERT INTO hinh_anh_san_pham
       (ma_san_pham, duong_dan_hinh_anh, van_ban_thay_the, thu_tu, la_anh_chinh)
       VALUES (?, ?, ?, ?, ?)`,
      [id, cleanUrl, alt_text?.trim() || null, parseInt(sort_order) || 0, is_primary ? 1 : 0]
    );

    const newImage = await queryOne<RowDataPacket>(
      `SELECT ma_id AS id, ma_san_pham AS product_id, duong_dan_hinh_anh AS image_url,
              van_ban_thay_the AS alt_text, thu_tu AS sort_order, la_anh_chinh AS is_primary
       FROM hinh_anh_san_pham WHERE ma_id = ?`,
      [result.insertId]
    );

    sendCreated(res, newImage, 'Đã thêm ảnh vào bộ sưu tập sản phẩm');
  } catch (error) {
    next(error);
  }
};

// ── DELETE /api/products/:id/images/:imageId — Admin ──────────
export const deleteProductImage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id, imageId } = req.params;

    const img = await queryOne<RowDataPacket>(
      'SELECT ma_id, la_anh_chinh FROM hinh_anh_san_pham WHERE ma_id = ? AND ma_san_pham = ?',
      [imageId, id]
    );
    if (!img) {
      sendNotFound(res, 'Không tìm thấy hình ảnh');
      return;
    }

    await execute('DELETE FROM hinh_anh_san_pham WHERE ma_id = ? AND ma_san_pham = ?', [imageId, id]);

    // Nếu ảnh vừa xóa là ảnh chính, lấy ảnh tiếp theo làm ảnh chính
    if (img.la_anh_chinh === 1) {
      const nextImg = await queryOne<RowDataPacket>(
        'SELECT ma_id, duong_dan_hinh_anh FROM hinh_anh_san_pham WHERE ma_san_pham = ? ORDER BY thu_tu ASC LIMIT 1',
        [id]
      );
      if (nextImg) {
        await execute('UPDATE hinh_anh_san_pham SET la_anh_chinh = 1 WHERE ma_id = ?', [nextImg.ma_id]);
        await execute('UPDATE san_pham SET duong_dan_anh_dai_dien = ? WHERE ma_id = ?', [nextImg.duong_dan_hinh_anh, id]);
      }
    }

    sendSuccess(res, null, 'Đã xóa ảnh thành công');
  } catch (error) {
    next(error);
  }
};

// ── PATCH /api/products/:id/images/:imageId/primary — Admin ───
export const setPrimaryProductImage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id, imageId } = req.params;

    const img = await queryOne<RowDataPacket>(
      'SELECT ma_id, duong_dan_hinh_anh FROM hinh_anh_san_pham WHERE ma_id = ? AND ma_san_pham = ?',
      [imageId, id]
    );
    if (!img) {
      sendNotFound(res, 'Không tìm thấy hình ảnh');
      return;
    }

    await execute('UPDATE hinh_anh_san_pham SET la_anh_chinh = CASE WHEN ma_id = ? THEN 1 ELSE 0 END WHERE ma_san_pham = ?', [imageId, id]);
    await execute('UPDATE san_pham SET duong_dan_anh_dai_dien = ? WHERE ma_id = ?', [img.duong_dan_hinh_anh, id]);

    sendSuccess(res, null, 'Đã đặt làm ảnh đại diện chính');
  } catch (error) {
    next(error);
  }
};
