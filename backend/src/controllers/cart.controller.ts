import { Request, Response, NextFunction } from 'express';
import { RowDataPacket } from 'mysql2';
import { query, queryOne, execute } from '../config/database';
import { sendSuccess, sendCreated, sendNotFound, sendBadRequest } from '../utils/helpers';

// Helper: Ghi lich_su_gio_hang
async function logCartHistory(
  userId: number,
  cartId: number | null,
  productId: number | null,
  productName: string | null,
  actionType: string,
  quantity: number,
  oldQuantity = 0
) {
  await execute(
    `INSERT INTO lich_su_gio_hang (ma_nguoi_dung, ma_gio_hang, ma_san_pham, ten_san_pham, loai_hanh_dong, so_luong, so_luong_cu)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [userId, cartId, productId, productName, actionType, quantity, oldQuantity]
  ).catch(() => {});
}

// Helper: Ghi nhat_ky_hoat_dong_nguoi_dung
async function logActivity(userId: number, actionType: string, description: string, entityType?: string, entityId?: number) {
  await execute(
    `INSERT INTO nhat_ky_hoat_dong_nguoi_dung (ma_nguoi_dung, loai_hanh_dong, mo_ta, loai_doi_tuong, ma_doi_tuong)
     VALUES (?, ?, ?, ?, ?)`,
    [userId, actionType, description, entityType || null, entityId || null]
  ).catch(() => {});
}

// ── GET /api/cart
export const getCart = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.userId;

    // Tạo giỏ nếu chưa có
    let cartId: number;
    const existingCart = await queryOne<RowDataPacket>(
      'SELECT ma_id FROM gio_hang WHERE ma_nguoi_dung = ?', [userId]
    );
    if (!existingCart) {
      const result = await execute('INSERT INTO gio_hang (ma_nguoi_dung) VALUES (?)', [userId]);
      cartId = result.insertId;
    } else {
      cartId = existingCart.ma_id as number;
    }

    const items = await query<RowDataPacket>(
      `SELECT
         ci.ma_id AS id, ci.ma_gio_hang AS cart_id, ci.ma_san_pham AS product_id,
         ci.ma_bien_the AS variant_id, ci.so_luong AS quantity,
         p.ten AS name, p.duong_dan_anh_dai_dien AS thumbnail_url,
         p.gia_goc AS base_price, p.gia_ban AS sale_price, p.so_luong_ton AS stock_quantity,
         pv.ten_bien_the AS variant_name, pv.gia AS variant_price,
         COALESCE(pv.gia, p.gia_ban, p.gia_goc) AS unit_price,
         COALESCE(pv.gia, p.gia_ban, p.gia_goc) * ci.so_luong AS subtotal
       FROM chi_tiet_gio_hang ci
       JOIN san_pham p ON ci.ma_san_pham = p.ma_id
       LEFT JOIN bien_the_san_pham pv ON ci.ma_bien_the = pv.ma_id
       WHERE ci.ma_gio_hang = ?`,
      [cartId]
    );

    const total = items.reduce((sum: number, item: RowDataPacket) => sum + (item.subtotal as number), 0);
    sendSuccess(res, { cartId, items, total, itemCount: items.length });
  } catch (error) {
    next(error);
  }
};

// ── POST /api/cart/items
export const addToCart = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { product_id, variant_id, quantity = 1 } = req.body as {
      product_id: number;
      variant_id?: number;
      quantity?: number;
    };
    const userId = req.user!.userId;

    const product = await queryOne<RowDataPacket>(
      `SELECT ma_id AS id, ten AS name, so_luong_ton AS stock_quantity, dang_hoat_dong AS is_active
       FROM san_pham WHERE ma_id = ? AND dang_hoat_dong = 1`, [product_id]
    );
    if (!product) { sendNotFound(res, 'Sản phẩm không tồn tại hoặc đã ngừng bán'); return; }

    const stockToCheck: number = variant_id
      ? ((await queryOne<RowDataPacket>(
          'SELECT so_luong_ton AS stock_quantity FROM bien_the_san_pham WHERE ma_id = ?', [variant_id]
        ))?.stock_quantity as number) ?? 0
      : (product.stock_quantity as number);

    if (stockToCheck < quantity) {
      sendBadRequest(res, `Chỉ còn ${stockToCheck} sản phẩm trong kho`);
      return;
    }

    // Get or create cart
    let cartId: number;
    const existingCart = await queryOne<RowDataPacket>(
      'SELECT ma_id FROM gio_hang WHERE ma_nguoi_dung = ?', [userId]
    );
    if (!existingCart) {
      const r = await execute('INSERT INTO gio_hang (ma_nguoi_dung) VALUES (?)', [userId]);
      cartId = r.insertId;
    } else {
      cartId = existingCart.ma_id as number;
    }

    const existingItem = await queryOne<RowDataPacket>(
      `SELECT ma_id, so_luong AS quantity FROM chi_tiet_gio_hang
       WHERE ma_gio_hang = ? AND ma_san_pham = ? AND (ma_bien_the = ? OR (ma_bien_the IS NULL AND ? IS NULL))`,
      [cartId, product_id, variant_id ?? null, variant_id ?? null]
    );

    if (existingItem) {
      const newQty = (existingItem.quantity as number) + quantity;
      await execute('UPDATE chi_tiet_gio_hang SET so_luong = ? WHERE ma_id = ?', [newQty, existingItem.ma_id]);
      await logCartHistory(userId, cartId, product_id, product.name as string, 'ADD_TO_CART', newQty, existingItem.quantity as number);
    } else {
      await execute(
        'INSERT INTO chi_tiet_gio_hang (ma_gio_hang, ma_san_pham, ma_bien_the, so_luong) VALUES (?, ?, ?, ?)',
        [cartId, product_id, variant_id ?? null, quantity]
      );
      await logCartHistory(userId, cartId, product_id, product.name as string, 'ADD_TO_CART', quantity, 0);
    }

    await logActivity(userId, 'ADD_TO_CART', `Thêm "${product.name}" vào giỏ hàng (x${quantity})`, 'product', product_id);
    sendCreated(res, null, 'Đã thêm vào giỏ hàng');
  } catch (error) {
    next(error);
  }
};

// ── PUT /api/cart/items/:itemId
export const updateCartItem = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { itemId } = req.params;
    const { quantity } = req.body as { quantity: number };
    const userId = req.user!.userId;

    const item = await queryOne<RowDataPacket>(
      `SELECT ci.ma_id, ci.ma_san_pham AS product_id, ci.so_luong AS old_quantity,
              ci.ma_bien_the AS variant_id, p.so_luong_ton AS stock_quantity, p.ten AS name
       FROM chi_tiet_gio_hang ci
       JOIN gio_hang c ON ci.ma_gio_hang = c.ma_id
       JOIN san_pham p ON ci.ma_san_pham = p.ma_id
       WHERE ci.ma_id = ? AND c.ma_nguoi_dung = ?`,
      [itemId, userId]
    );
    if (!item) { sendNotFound(res, 'Không tìm thấy sản phẩm trong giỏ'); return; }
    if (quantity < 1) { sendBadRequest(res, 'Số lượng phải lớn hơn 0'); return; }
    if (quantity > (item.stock_quantity as number)) {
      sendBadRequest(res, `Chỉ còn ${item.stock_quantity} sản phẩm trong kho`); return;
    }

    const oldQty = item.old_quantity as number;
    await execute('UPDATE chi_tiet_gio_hang SET so_luong = ? WHERE ma_id = ?', [quantity, itemId]);

    const cart = await queryOne<RowDataPacket>('SELECT ma_id FROM gio_hang WHERE ma_nguoi_dung = ?', [userId]);
    await logCartHistory(userId, cart?.ma_id as number, item.product_id as number, item.name as string, 'UPDATE_QUANTITY', quantity, oldQty);
    await logActivity(userId, 'UPDATE_CART', `Cập nhật số lượng "${item.name}" từ ${oldQty} → ${quantity}`, 'product', item.product_id as number);

    sendSuccess(res, null, 'Cập nhật giỏ hàng thành công');
  } catch (error) {
    next(error);
  }
};

// ── DELETE /api/cart/items/:itemId
export const removeFromCart = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { itemId } = req.params;
    const userId = req.user!.userId;

    const item = await queryOne<RowDataPacket>(
      `SELECT ci.ma_id, ci.ma_san_pham AS product_id, ci.so_luong AS quantity,
              p.ten AS name, c.ma_id AS cart_id
       FROM chi_tiet_gio_hang ci
       JOIN gio_hang c ON ci.ma_gio_hang = c.ma_id
       JOIN san_pham p ON ci.ma_san_pham = p.ma_id
       WHERE ci.ma_id = ? AND c.ma_nguoi_dung = ?`,
      [itemId, userId]
    );
    if (!item) { sendNotFound(res, 'Không tìm thấy sản phẩm trong giỏ'); return; }

    await execute('DELETE FROM chi_tiet_gio_hang WHERE ma_id = ?', [itemId]);
    await logCartHistory(userId, item.cart_id as number, item.product_id as number, item.name as string, 'REMOVE_FROM_CART', 0, item.quantity as number);
    await logActivity(userId, 'REMOVE_FROM_CART', `Xóa "${item.name}" khỏi giỏ hàng`, 'product', item.product_id as number);

    sendSuccess(res, null, 'Đã xóa sản phẩm khỏi giỏ');
  } catch (error) {
    next(error);
  }
};

// ── DELETE /api/cart
export const clearCart = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const cart = await queryOne<RowDataPacket>('SELECT ma_id FROM gio_hang WHERE ma_nguoi_dung = ?', [userId]);
    if (cart) {
      await execute('DELETE FROM chi_tiet_gio_hang WHERE ma_gio_hang = ?', [cart.ma_id as number]);
      await logCartHistory(userId, cart.ma_id as number, null, null, 'CLEAR_CART', 0, 0);
      await logActivity(userId, 'CLEAR_CART', 'Xóa toàn bộ giỏ hàng');
    }
    sendSuccess(res, null, 'Đã xóa toàn bộ giỏ hàng');
  } catch (error) {
    next(error);
  }
};

// ── POST /api/cart/sync — Đồng bộ giỏ hàng khách vãng lai khi đăng nhập
export const syncCart = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { items } = req.body as {
      items: Array<{ product_id: number; variant_id?: number; quantity: number }>;
    };

    if (!Array.isArray(items) || items.length === 0) {
      sendSuccess(res, null, 'Không có sản phẩm để đồng bộ');
      return;
    }

    // Lấy hoặc tạo giỏ hàng cho user
    let cartId: number;
    const existingCart = await queryOne<RowDataPacket>(
      'SELECT ma_id FROM gio_hang WHERE ma_nguoi_dung = ?', [userId]
    );
    if (!existingCart) {
      const r = await execute('INSERT INTO gio_hang (ma_nguoi_dung) VALUES (?)', [userId]);
      cartId = r.insertId;
    } else {
      cartId = existingCart.ma_id as number;
    }

    for (const item of items) {
      if (!item.product_id || item.quantity <= 0) continue;

      const product = await queryOne<RowDataPacket>(
        'SELECT ma_id, ten, so_luong_ton FROM san_pham WHERE ma_id = ? AND dang_hoat_dong = 1',
        [item.product_id]
      );
      if (!product) continue;

      const stock: number = item.variant_id
        ? ((await queryOne<RowDataPacket>(
            'SELECT so_luong_ton FROM bien_the_san_pham WHERE ma_id = ?', [item.variant_id]
          ))?.so_luong_ton as number) ?? 0
        : (product.so_luong_ton as number);

      if (stock <= 0) continue;
      const validQty = Math.min(item.quantity, stock);

      const existingItem = await queryOne<RowDataPacket>(
        `SELECT ma_id, so_luong FROM chi_tiet_gio_hang
         WHERE ma_gio_hang = ? AND ma_san_pham = ? AND (ma_bien_the = ? OR (ma_bien_the IS NULL AND ? IS NULL))`,
        [cartId, item.product_id, item.variant_id ?? null, item.variant_id ?? null]
      );

      if (existingItem) {
        const newQty = Math.min(stock, (existingItem.so_luong as number) + validQty);
        await execute('UPDATE chi_tiet_gio_hang SET so_luong = ? WHERE ma_id = ?', [newQty, existingItem.ma_id]);
      } else {
        await execute(
          'INSERT INTO chi_tiet_gio_hang (ma_gio_hang, ma_san_pham, ma_bien_the, so_luong) VALUES (?, ?, ?, ?)',
          [cartId, item.product_id, item.variant_id ?? null, validQty]
        );
      }
    }

    // Trả về giỏ hàng mới nhất sau khi đồng bộ
    const updatedItems = await query<RowDataPacket>(
      `SELECT
         ci.ma_id AS id, ci.ma_gio_hang AS cart_id, ci.ma_san_pham AS product_id,
         ci.ma_bien_the AS variant_id, ci.so_luong AS quantity,
         p.ten AS name, p.duong_dan_anh_dai_dien AS thumbnail_url,
         p.gia_goc AS base_price, p.gia_ban AS sale_price, p.so_luong_ton AS stock_quantity,
         pv.ten_bien_the AS variant_name, pv.gia AS variant_price,
         COALESCE(pv.gia, p.gia_ban, p.gia_goc) AS unit_price,
         COALESCE(pv.gia, p.gia_ban, p.gia_goc) * ci.so_luong AS subtotal
       FROM chi_tiet_gio_hang ci
       JOIN san_pham p ON ci.ma_san_pham = p.ma_id
       LEFT JOIN bien_the_san_pham pv ON ci.ma_bien_the = pv.ma_id
       WHERE ci.ma_gio_hang = ?`,
      [cartId]
    );

    const total = updatedItems.reduce((sum: number, it: RowDataPacket) => sum + (it.subtotal as number), 0);
    sendSuccess(res, { cartId, items: updatedItems, total, itemCount: updatedItems.length }, 'Đồng bộ giỏ hàng thành công');
  } catch (error) {
    next(error);
  }
};

