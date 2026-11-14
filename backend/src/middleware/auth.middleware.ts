import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { JwtPayload, UserRole } from '../types';
import { sendUnauthorized, sendForbidden } from '../utils/helpers';
import { queryOne } from '../config/database';
import { RowDataPacket } from 'mysql2';

// Mở rộng Request để gắn user vào
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

// ── Middleware xác thực JWT ───────────────────────────────────
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      sendUnauthorized(res, 'Token không được cung cấp');
      return;
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload;

    // Kiểm tra user vẫn tồn tại và còn active
    const user = await queryOne<RowDataPacket>(
      `SELECT ma_id AS id, dia_chi_email AS email, vai_tro AS role, dang_hoat_dong AS is_active
       FROM nguoi_dung WHERE ma_id = ?`,
      [decoded.userId]
    );

    if (!user) {
      sendUnauthorized(res, 'Tài khoản không tồn tại');
      return;
    }

    if (!user.is_active) {
      sendUnauthorized(res, 'Tài khoản đã bị khoá');
      return;
    }

    req.user = {
      userId: user.id,
      email:  user.email,
      role:   user.role as UserRole,
    };

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      sendUnauthorized(res, 'Token đã hết hạn');
    } else if (error instanceof jwt.JsonWebTokenError) {
      sendUnauthorized(res, 'Token không hợp lệ');
    } else {
      sendUnauthorized(res);
    }
  }
};

// ── Middleware phân quyền theo role ──────────────────────────
export const authorize = (...roles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      sendUnauthorized(res);
      return;
    }

    if (!roles.includes(req.user.role)) {
      sendForbidden(res, `Chỉ có ${roles.join(', ')} mới có quyền thực hiện`);
      return;
    }

    next();
  };
};

// ── Middleware tùy chọn (không bắt buộc đăng nhập) ───────────
export const optionalAuth = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload;
      req.user = decoded;
    }
  } catch {
    // Bỏ qua lỗi — không bắt buộc đăng nhập
  }
  next();
};
