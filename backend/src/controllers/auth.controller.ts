import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { query, queryOne, execute } from '../config/database';
import { RowDataPacket } from 'mysql2';
import {
  sendSuccess, sendCreated, sendBadRequest,
  sendUnauthorized, sendConflict, sendNotFound
} from '../utils/helpers';
import { emailService } from '../services/email.service';

// ── Register ─────────────────────────────────────────────────
export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password, full_name, phone } = req.body;

    // Kiểm tra email đã tồn tại
    const existing = await queryOne<RowDataPacket>(
      'SELECT ma_id FROM nguoi_dung WHERE dia_chi_email = ?', [email]
    );
    if (existing) {
      sendConflict(res, 'Email đã được đăng ký');
      return;
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, config.bcrypt.rounds);

    // Tạo user
    const result = await execute(
      `INSERT INTO nguoi_dung (dia_chi_email, mat_khau_ma_hoa, ho_ten, so_dien_thoai, vai_tro)
       VALUES (?, ?, ?, ?, 'customer')`,
      [email, passwordHash, full_name, phone || null]
    );

    const newUser = await queryOne<RowDataPacket>(
      `SELECT ma_id AS id, dia_chi_email AS email, ho_ten AS full_name,
              so_dien_thoai AS phone, vai_tro AS role, ngay_tao AS created_at
       FROM nguoi_dung WHERE ma_id = ?`,
      [result.insertId]
    );

    sendCreated(res, newUser, 'Đăng ký thành công');
  } catch (error) {
    next(error);
  }
};

// ── Login ─────────────────────────────────────────────────────
export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password } = req.body;
    const ip = (req.ip || (req.socket?.remoteAddress) || null) as string | null;
    const userAgent = (req.headers['user-agent'] || null) as string | null;

    // Tìm user
    const user = await queryOne<RowDataPacket>(
      `SELECT ma_id AS id, dia_chi_email AS email, mat_khau_ma_hoa AS password_hash,
              ho_ten AS full_name, so_dien_thoai AS phone, duong_dan_anh_dai_dien AS avatar_url,
              vai_tro AS role, dang_hoat_dong AS is_active, ma_lam_moi AS refresh_token
       FROM nguoi_dung WHERE dia_chi_email = ?`, [email]
    );

    if (!user) {
      // Log đăng nhập thất bại
      await execute(
        `INSERT INTO lich_su_dang_nhap (ma_nguoi_dung, dia_chi_email, dia_chi_ip, trinh_duyet_thiet_bi, trang_thai_dang_nhap, ly_do_that_bai)
         VALUES (NULL, ?, ?, ?, 'FAILED', ?)`,
        [email, ip, userAgent, 'Email không tồn tại']
      ).catch(() => {});
      sendUnauthorized(res, 'Email hoặc mật khẩu không đúng');
      return;
    }

    if (!user.is_active) {
      await execute(
        `INSERT INTO lich_su_dang_nhap (ma_nguoi_dung, dia_chi_email, dia_chi_ip, trinh_duyet_thiet_bi, trang_thai_dang_nhap, ly_do_that_bai)
         VALUES (?, ?, ?, ?, 'FAILED', ?)`,
        [user.id, email, ip, userAgent, 'Tài khoản bị khóa']
      ).catch(() => {});
      sendUnauthorized(res, 'Tài khoản đã bị khoá, vui lòng liên hệ admin');
      return;
    }

    // Kiểm tra password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      await execute(
        `INSERT INTO lich_su_dang_nhap (ma_nguoi_dung, dia_chi_email, dia_chi_ip, trinh_duyet_thiet_bi, trang_thai_dang_nhap, ly_do_that_bai)
         VALUES (?, ?, ?, ?, 'FAILED', ?)`,
        [user.id, email, ip, userAgent, 'Mật khẩu không đúng']
      ).catch(() => {});
      sendUnauthorized(res, 'Email hoặc mật khẩu không đúng');
      return;
    }

    // Tạo JWT
    const accessToken = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn } as jwt.SignOptions
    );

    const refreshToken = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      config.jwt.refreshSecret,
      { expiresIn: config.jwt.refreshExpires } as jwt.SignOptions
    );

    // Cập nhật refresh token và last_login_at
    await execute(
      'UPDATE nguoi_dung SET ma_lam_moi = ?, dang_nhap_cuoi_luc = NOW() WHERE ma_id = ?',
      [refreshToken, user.id]
    );

    // Log đăng nhập thành công vào lich_su_dang_nhap
    await execute(
      `INSERT INTO lich_su_dang_nhap (ma_nguoi_dung, dia_chi_email, dia_chi_ip, trinh_duyet_thiet_bi, trang_thai_dang_nhap)
       VALUES (?, ?, ?, ?, 'SUCCESS')`,
      [user.id, email, ip, userAgent]
    ).catch(() => {});

    // Ghi nhat_ky_hoat_dong_nguoi_dung
    await execute(
      `INSERT INTO nhat_ky_hoat_dong_nguoi_dung (ma_nguoi_dung, loai_hanh_dong, mo_ta, dia_chi_ip, trinh_duyet_thiet_bi)
       VALUES (?, 'LOGIN', 'Đăng nhập tài khoản', ?, ?)`,
      [user.id, ip, userAgent]
    ).catch(() => {});

    sendSuccess(res, {
      accessToken,
      refreshToken,
      user: {
        id:         user.id,
        email:      user.email,
        full_name:  user.full_name,
        fullName:   user.full_name,
        role:       user.role,
        avatar_url: user.avatar_url,
        avatar:     user.avatar_url,
      },
    }, 'Đăng nhập thành công');
  } catch (error) {
    next(error);
  }
};

// ── Refresh Token ─────────────────────────────────────────────
export const refreshToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { refreshToken: token } = req.body;
    if (!token) {
      sendBadRequest(res, 'Refresh token không được cung cấp');
      return;
    }

    const decoded = jwt.verify(token, config.jwt.refreshSecret) as { userId: number };
    const user = await queryOne<RowDataPacket>(
      `SELECT ma_id AS id, dia_chi_email AS email, vai_tro AS role
       FROM nguoi_dung WHERE ma_id = ? AND ma_lam_moi = ?`,
      [decoded.userId, token]
    );

    if (!user) {
      sendUnauthorized(res, 'Refresh token không hợp lệ');
      return;
    }

    const newAccessToken = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn } as jwt.SignOptions
    );

    sendSuccess(res, { accessToken: newAccessToken }, 'Token mới đã được tạo');
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      sendUnauthorized(res, 'Refresh token không hợp lệ hoặc đã hết hạn');
      return;
    }
    next(error);
  }
};

// ── Logout ────────────────────────────────────────────────────
export const logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const ip = (req.ip || (req.socket?.remoteAddress) || null) as string | null;
    const userAgent = (req.headers['user-agent'] || null) as string | null;

    await execute('UPDATE nguoi_dung SET ma_lam_moi = NULL WHERE ma_id = ?', [userId]);

    // Cập nhật logout_at cho bản ghi gần nhất
    await execute(
      `UPDATE lich_su_dang_nhap SET dang_xuat_luc = NOW()
       WHERE ma_nguoi_dung = ? AND trang_thai_dang_nhap = 'SUCCESS' AND dang_xuat_luc IS NULL
       ORDER BY dang_nhap_luc DESC LIMIT 1`,
      [userId]
    ).catch(() => {});

    // Ghi activity log
    await execute(
      `INSERT INTO nhat_ky_hoat_dong_nguoi_dung (ma_nguoi_dung, loai_hanh_dong, mo_ta, dia_chi_ip, trinh_duyet_thiet_bi)
       VALUES (?, 'LOGOUT', 'Đăng xuất khỏi hệ thống', ?, ?)`,
      [userId, ip, userAgent]
    ).catch(() => {});

    sendSuccess(res, null, 'Đăng xuất thành công');
  } catch (error) {
    next(error);
  }
};

// ── Get Profile ───────────────────────────────────────────────
export const getProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await queryOne<RowDataPacket>(
      `SELECT ma_id AS id, dia_chi_email AS email, ho_ten AS full_name,
              so_dien_thoai AS phone, duong_dan_anh_dai_dien AS avatar_url,
              vai_tro AS role, dang_hoat_dong AS is_active,
              email_da_xac_minh AS email_verified, dang_nhap_cuoi_luc AS last_login_at,
              ngay_tao AS created_at
       FROM nguoi_dung WHERE ma_id = ?`,
      [req.user!.userId]
    );

    if (!user) {
      sendNotFound(res, 'Không tìm thấy người dùng');
      return;
    }

    // Lấy danh sách địa chỉ
    const addresses = await query<RowDataPacket>(
      `SELECT ma_id AS id, ten_nguoi_nhan AS recipient_name, so_dien_thoai_nguoi_nhan AS recipient_phone,
              tinh_thanh AS province, quan_huyen AS district, phuong_xa AS ward,
              dia_chi_chi_tiet AS address_detail, mac_dinh AS is_default,
              ngay_tao AS created_at
       FROM dia_chi_nguoi_dung WHERE ma_nguoi_dung = ? ORDER BY mac_dinh DESC`,
      [req.user!.userId]
    );

    sendSuccess(res, { ...user, addresses });
  } catch (error) {
    next(error);
  }
};

// ── Change Password ───────────────────────────────────────────
export const changePassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await queryOne<RowDataPacket>(
      'SELECT mat_khau_ma_hoa AS password_hash FROM nguoi_dung WHERE ma_id = ?', [req.user!.userId]
    );

    const isMatch = await bcrypt.compare(currentPassword, user!.password_hash);
    if (!isMatch) {
      sendBadRequest(res, 'Mật khẩu hiện tại không đúng');
      return;
    }

    const newHash = await bcrypt.hash(newPassword, config.bcrypt.rounds);
    await execute('UPDATE nguoi_dung SET mat_khau_ma_hoa = ? WHERE ma_id = ?', [newHash, req.user!.userId]);

    sendSuccess(res, null, 'Đổi mật khẩu thành công');
  } catch (error) {
    next(error);
  }
};

// ── POST /api/auth/forgot-password ────────────────────────────
export const forgotPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email } = req.body;
    if (!email || typeof email !== 'string') {
      sendBadRequest(res, 'Vui lòng cung cấp địa chỉ email');
      return;
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = await queryOne<RowDataPacket>(
      'SELECT ma_id, ho_ten AS full_name, dang_hoat_dong FROM nguoi_dung WHERE dia_chi_email = ?',
      [cleanEmail]
    );

    if (!user) {
      // Để bảo mật, vẫn trả về thông báo thành công chung hoặc thông báo rõ ràng
      sendSuccess(res, null, 'Nếu email tồn tại trong hệ thống, mã xác thực OTP sẽ được gửi đến hộp thư của bạn.');
      return;
    }

    if (!user.dang_hoat_dong) {
      sendBadRequest(res, 'Tài khoản của bạn hiện đang bị khóa. Vui lòng liên hệ hỗ trợ.');
      return;
    }

    // Sinh OTP 6 chữ số ngẫu nhiên
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expireTime = new Date(Date.now() + 10 * 60 * 1000); // 10 phút

    await execute(
      `INSERT INTO ma_xac_thuc_otp (dia_chi_email, ma_otp, loai_xac_thuc, het_han_luc)
       VALUES (?, ?, 'RESET_PASSWORD', ?)`,
      [cleanEmail, otpCode, expireTime]
    );

    // Gửi email chứa mã OTP
    await emailService.sendPasswordResetOtp(cleanEmail, otpCode, user.full_name);

    sendSuccess(res, null, 'Mã xác thực OTP đã được gửi đến email của bạn. Vui lòng kiểm tra hộp thư.');
  } catch (error) {
    next(error);
  }
};

// ── POST /api/auth/reset-password ─────────────────────────────
export const resetPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, otp, new_password } = req.body;

    if (!email || !otp || !new_password) {
      sendBadRequest(res, 'Vui lòng cung cấp đầy đủ email, mã OTP và mật khẩu mới');
      return;
    }

    if (new_password.length < 6) {
      sendBadRequest(res, 'Mật khẩu mới phải có tối thiểu 6 ký tự');
      return;
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanOtp = otp.trim();

    const otpRecord = await queryOne<RowDataPacket>(
      `SELECT ma_id FROM ma_xac_thuc_otp
       WHERE dia_chi_email = ? AND ma_otp = ? AND da_su_dung = 0 AND het_han_luc > NOW()
       ORDER BY ngay_tao DESC LIMIT 1`,
      [cleanEmail, cleanOtp]
    );

    if (!otpRecord) {
      sendBadRequest(res, 'Mã xác thực OTP không chính xác hoặc đã hết thời gian hiệu lực (10 phút)');
      return;
    }

    // Hash mật khẩu mới
    const newHash = await bcrypt.hash(new_password, config.bcrypt.rounds);

    // Cập nhật mật khẩu cho user
    await execute('UPDATE nguoi_dung SET mat_khau_ma_hoa = ? WHERE dia_chi_email = ?', [newHash, cleanEmail]);

    // Đánh dấu OTP đã sử dụng
    await execute('UPDATE ma_xac_thuc_otp SET da_su_dung = 1 WHERE ma_id = ?', [otpRecord.ma_id]);

    sendSuccess(res, null, 'Đặt lại mật khẩu thành công! Bạn có thể sử dụng mật khẩu mới để đăng nhập.');
  } catch (error) {
    next(error);
  }
};
