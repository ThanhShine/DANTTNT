import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { RowDataPacket } from 'mysql2';
import { query, queryOne, execute } from '../config/database';
import { config } from '../config';
import {
  sendSuccess, sendCreated, sendBadRequest,
  sendNotFound, sendConflict, getPagination, paginate
} from '../utils/helpers';

// ── GET /api/users — Admin: Danh sach users
export const getAllUsers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { page, limit, offset } = getPagination(req.query['page'] as string, req.query['limit'] as string);
    const role   = req.query['role']   as string | undefined;
    const search = req.query['search'] as string | undefined;

    let sql = `SELECT ma_id AS id, dia_chi_email AS email, ho_ten AS full_name,
                      so_dien_thoai AS phone, duong_dan_anh_dai_dien AS avatar_url,
                      vai_tro AS role, dang_hoat_dong AS is_active,
                      email_da_xac_minh AS email_verified,
                      dang_nhap_cuoi_luc AS last_login_at, ngay_tao AS created_at
               FROM nguoi_dung WHERE 1=1`;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const params: any[] = [];

    if (role)   { sql += ' AND vai_tro = ?';                                          params.push(role); }
    if (search) { sql += ' AND (ho_ten LIKE ? OR dia_chi_email LIKE ?)';              params.push(`%${search}%`, `%${search}%`); }

    let countSql = `SELECT COUNT(*) AS total FROM nguoi_dung WHERE 1=1`;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const countParams: any[] = [];
    if (role)   { countSql += ' AND vai_tro = ?';                                     countParams.push(role); }
    if (search) { countSql += ' AND (ho_ten LIKE ? OR dia_chi_email LIKE ?)';          countParams.push(`%${search}%`, `%${search}%`); }

    const countResult = await queryOne<RowDataPacket>(countSql, countParams);
    const total = (countResult?.total as number) || 0;

    sql += ' ORDER BY ngay_tao DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const users = await query<RowDataPacket>(sql, params);
    sendSuccess(res, users, 'Lấy danh sách người dùng thành công', 200, paginate(total, page, limit));
  } catch (error) {
    next(error);
  }
};

// ── GET /api/users/:id
export const getUserById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params['id'] as string;

    if (req.user!.role === 'customer' && req.user!.userId !== parseInt(id, 10)) {
      sendNotFound(res);
      return;
    }

    const user = await queryOne<RowDataPacket>(
      `SELECT ma_id AS id, dia_chi_email AS email, ho_ten AS full_name,
              so_dien_thoai AS phone, duong_dan_anh_dai_dien AS avatar_url,
              vai_tro AS role, dang_hoat_dong AS is_active,
              email_da_xac_minh AS email_verified,
              dang_nhap_cuoi_luc AS last_login_at, ngay_tao AS created_at
       FROM nguoi_dung WHERE ma_id = ?`, [id]
    );

    if (!user) { sendNotFound(res, 'Không tìm thấy người dùng'); return; }

    const addresses = await query<RowDataPacket>(
      `SELECT ma_id AS id, ten_nguoi_nhan AS recipient_name,
              so_dien_thoai_nguoi_nhan AS recipient_phone,
              tinh_thanh AS province, quan_huyen AS district,
              phuong_xa AS ward, dia_chi_chi_tiet AS address_detail,
              mac_dinh AS is_default, ngay_tao AS created_at
       FROM dia_chi_nguoi_dung WHERE ma_nguoi_dung = ? ORDER BY mac_dinh DESC`, [id]
    );

    sendSuccess(res, { ...user, addresses });
  } catch (error) {
    next(error);
  }
};

// ── PUT /api/users/:id
export const updateUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params['id'] as string;

    if (req.user!.role === 'customer' && req.user!.userId !== parseInt(id, 10)) {
      sendNotFound(res); return;
    }

    const { full_name, phone, avatar_url } = req.body as { full_name: string; phone?: string; avatar_url?: string };

    const existing = await queryOne<RowDataPacket>('SELECT ma_id FROM nguoi_dung WHERE ma_id = ?', [id]);
    if (!existing) { sendNotFound(res, 'Không tìm thấy người dùng'); return; }

    await execute(
      'UPDATE nguoi_dung SET ho_ten = ?, so_dien_thoai = ?, duong_dan_anh_dai_dien = ? WHERE ma_id = ?',
      [full_name, phone || null, avatar_url || null, id]
    );

    const updated = await queryOne<RowDataPacket>(
      `SELECT ma_id AS id, dia_chi_email AS email, ho_ten AS full_name,
              so_dien_thoai AS phone, duong_dan_anh_dai_dien AS avatar_url, vai_tro AS role
       FROM nguoi_dung WHERE ma_id = ?`, [id]
    );

    sendSuccess(res, updated, 'Cập nhật thông tin thành công');
  } catch (error) {
    next(error);
  }
};

// ── DELETE /api/users/:id — Admin
export const deleteUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params['id'] as string;

    if (parseInt(id, 10) === req.user!.userId) {
      sendBadRequest(res, 'Không thể xóa tài khoản của chính mình');
      return;
    }

    const existing = await queryOne<RowDataPacket>('SELECT ma_id FROM nguoi_dung WHERE ma_id = ?', [id]);
    if (!existing) { sendNotFound(res, 'Không tìm thấy người dùng'); return; }

    await execute('UPDATE nguoi_dung SET dang_hoat_dong = 0 WHERE ma_id = ?', [id]);
    sendSuccess(res, null, 'Đã khóa tài khoản người dùng');
  } catch (error) {
    next(error);
  }
};

// ── PUT /api/users/:id/status — Admin
export const toggleUserStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params['id'] as string;
    const existing = await queryOne<RowDataPacket>(
      'SELECT ma_id, dang_hoat_dong AS is_active FROM nguoi_dung WHERE ma_id = ?', [id]
    );
    if (!existing) { sendNotFound(res, 'Không tìm thấy người dùng'); return; }

    const newStatus = (existing.is_active as number) ? 0 : 1;
    await execute('UPDATE nguoi_dung SET dang_hoat_dong = ? WHERE ma_id = ?', [newStatus, id]);
    sendSuccess(res, { is_active: newStatus }, newStatus ? 'Đã mở khóa tài khoản' : 'Đã khóa tài khoản');
  } catch (error) {
    next(error);
  }
};

// ── POST /api/users/:id/reset-password — Admin
export const resetPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params['id'] as string;
    const { newPassword } = req.body as { newPassword: string };

    const existing = await queryOne<RowDataPacket>('SELECT ma_id FROM nguoi_dung WHERE ma_id = ?', [id]);
    if (!existing) { sendNotFound(res, 'Không tìm thấy người dùng'); return; }

    const hash = await bcrypt.hash(newPassword, config.bcrypt.rounds);
    await execute('UPDATE nguoi_dung SET mat_khau_ma_hoa = ? WHERE ma_id = ?', [hash, id]);

    sendSuccess(res, null, 'Đặt lại mật khẩu thành công');
  } catch (error) {
    next(error);
  }
};

// ── POST /api/users/addresses
export const addAddress = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const {
      recipient_name, recipient_phone, province, district, ward, address_detail, is_default
    } = req.body as {
      recipient_name: string; recipient_phone: string; province: string;
      district: string; ward: string; address_detail: string; is_default?: boolean;
    };
    const userId = req.user!.userId;

    if (is_default) {
      await execute('UPDATE dia_chi_nguoi_dung SET mac_dinh = 0 WHERE ma_nguoi_dung = ?', [userId]);
    }

    const result = await execute(
      `INSERT INTO dia_chi_nguoi_dung
         (ma_nguoi_dung, ten_nguoi_nhan, so_dien_thoai_nguoi_nhan, tinh_thanh, quan_huyen, phuong_xa, dia_chi_chi_tiet, mac_dinh)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, recipient_name, recipient_phone, province, district, ward, address_detail, is_default ? 1 : 0]
    );

    const newAddr = await queryOne<RowDataPacket>(
      `SELECT ma_id AS id, ten_nguoi_nhan AS recipient_name, so_dien_thoai_nguoi_nhan AS recipient_phone,
              tinh_thanh AS province, quan_huyen AS district, phuong_xa AS ward,
              dia_chi_chi_tiet AS address_detail, mac_dinh AS is_default
       FROM dia_chi_nguoi_dung WHERE ma_id = ?`, [result.insertId]
    );
    sendCreated(res, newAddr, 'Thêm địa chỉ thành công');
  } catch (error) {
    next(error);
  }
};

// ── DELETE /api/users/addresses/:addressId
export const deleteAddress = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const addressId = req.params['addressId'] as string;
    const addr = await queryOne<RowDataPacket>(
      'SELECT ma_id FROM dia_chi_nguoi_dung WHERE ma_id = ? AND ma_nguoi_dung = ?',
      [addressId, req.user!.userId]
    );
    if (!addr) { sendNotFound(res, 'Không tìm thấy địa chỉ'); return; }

    await execute('DELETE FROM dia_chi_nguoi_dung WHERE ma_id = ?', [addressId]);
    sendSuccess(res, null, 'Xóa địa chỉ thành công');
  } catch (error) {
    next(error);
  }
};

// suppress unused import warning
void sendConflict;
