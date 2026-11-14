import { Request, Response, NextFunction } from 'express';
import { RowDataPacket } from 'mysql2';
import { query, queryOne, execute } from '../config/database';
import {
  sendSuccess, sendCreated, sendNotFound,
  sendConflict, getPagination, paginate, toSlug
} from '../utils/helpers';

// Helper: format category row sang English keys
function fmtCat(c: RowDataPacket) {
  return {
    id:          c.id,
    parent_id:   c.parent_id,
    name:        c.name,
    slug:        c.slug,
    description: c.description,
    image_url:   c.image_url,
    sort_order:  c.sort_order,
    is_active:   c.is_active,
    created_at:  c.created_at,
    updated_at:  c.updated_at,
    parent_name: c.parent_name,
  };
}

const SELECT_COLS = `
  c.ma_id AS id,
  c.ma_danh_muc_cha AS parent_id,
  c.ten AS name,
  c.duong_dan AS slug,
  c.mo_ta AS description,
  c.duong_dan_hinh_anh AS image_url,
  c.thu_tu AS sort_order,
  c.dang_hoat_dong AS is_active,
  c.ngay_tao AS created_at,
  c.ngay_cap_nhat AS updated_at,
  p.ten AS parent_name
`;

// ── GET /api/categories ───────────────────────────────────────
export const getCategories = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { tree } = req.query;

    const categories = await query<RowDataPacket>(
      `SELECT ${SELECT_COLS}
       FROM danh_muc c
       LEFT JOIN danh_muc p ON c.ma_danh_muc_cha = p.ma_id
       WHERE c.dang_hoat_dong = 1
       ORDER BY c.thu_tu ASC, c.ten ASC`
    );

    if (tree === '1') {
      type CatNode = ReturnType<typeof fmtCat> & { children: CatNode[] };
      const map: Record<number, CatNode> = {};
      const roots: CatNode[] = [];

      categories.forEach(cat => {
        map[cat.id] = { ...fmtCat(cat), children: [] };
      });
      categories.forEach(cat => {
        if (cat.parent_id && map[cat.parent_id]) {
          map[cat.parent_id].children.push(map[cat.id]);
        } else {
          roots.push(map[cat.id]);
        }
      });

      sendSuccess(res, roots, 'Lấy danh mục dạng cây thành công');
      return;
    }

    sendSuccess(res, categories.map(fmtCat), 'Lấy danh sách danh mục thành công');
  } catch (error) {
    next(error);
  }
};

// ── GET /api/categories/:id ───────────────────────────────────
export const getCategoryById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const category = await queryOne<RowDataPacket>(
      `SELECT ${SELECT_COLS}
       FROM danh_muc c
       LEFT JOIN danh_muc p ON c.ma_danh_muc_cha = p.ma_id
       WHERE c.ma_id = ?`, [id]
    );
    if (!category) { sendNotFound(res, 'Không tìm thấy danh mục'); return; }
    sendSuccess(res, fmtCat(category));
  } catch (error) {
    next(error);
  }
};

// ── POST /api/categories — Admin ──────────────────────────────
export const createCategory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { parent_id, name, description, image_url, sort_order } = req.body;

    const slug = toSlug(name);
    const existing = await queryOne<RowDataPacket>('SELECT ma_id FROM danh_muc WHERE duong_dan = ?', [slug]);
    if (existing) { sendConflict(res, 'Tên danh mục đã tồn tại'); return; }

    const result = await execute(
      `INSERT INTO danh_muc (ma_danh_muc_cha, ten, duong_dan, mo_ta, duong_dan_hinh_anh, thu_tu)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [parent_id || null, name, slug, description || null, image_url || null, sort_order || 0]
    );

    const newCat = await queryOne<RowDataPacket>(
      `SELECT ${SELECT_COLS} FROM danh_muc c LEFT JOIN danh_muc p ON c.ma_danh_muc_cha = p.ma_id WHERE c.ma_id = ?`,
      [result.insertId]
    );
    sendCreated(res, newCat ? fmtCat(newCat) : null, 'Tạo danh mục thành công');
  } catch (error) {
    next(error);
  }
};

// ── PUT /api/categories/:id — Admin ───────────────────────────
export const updateCategory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { parent_id, name, description, image_url, sort_order, is_active } = req.body;

    const existing = await queryOne<RowDataPacket>('SELECT ma_id FROM danh_muc WHERE ma_id = ?', [id]);
    if (!existing) { sendNotFound(res, 'Không tìm thấy danh mục'); return; }

    const slug = toSlug(name);
    const dupSlug = await queryOne<RowDataPacket>('SELECT ma_id FROM danh_muc WHERE duong_dan = ? AND ma_id != ?', [slug, id]);
    if (dupSlug) { sendConflict(res, 'Tên danh mục đã tồn tại'); return; }

    await execute(
      `UPDATE danh_muc SET ma_danh_muc_cha = ?, ten = ?, duong_dan = ?, mo_ta = ?,
              duong_dan_hinh_anh = ?, thu_tu = ?, dang_hoat_dong = ? WHERE ma_id = ?`,
      [parent_id || null, name, slug, description || null, image_url || null, sort_order ?? 0, is_active ?? 1, id]
    );

    const updated = await queryOne<RowDataPacket>(
      `SELECT ${SELECT_COLS} FROM danh_muc c LEFT JOIN danh_muc p ON c.ma_danh_muc_cha = p.ma_id WHERE c.ma_id = ?`,
      [id]
    );
    sendSuccess(res, updated ? fmtCat(updated) : null, 'Cập nhật danh mục thành công');
  } catch (error) {
    next(error);
  }
};

// ── DELETE /api/categories/:id — Admin ────────────────────────
export const deleteCategory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const existing = await queryOne<RowDataPacket>('SELECT ma_id FROM danh_muc WHERE ma_id = ?', [id]);
    if (!existing) { sendNotFound(res, 'Không tìm thấy danh mục'); return; }

    await execute('UPDATE danh_muc SET dang_hoat_dong = 0 WHERE ma_id = ?', [id]);
    sendSuccess(res, null, 'Đã ẩn danh mục thành công');
  } catch (error) {
    next(error);
  }
};

// suppress unused import warning
void getPagination; void paginate;
