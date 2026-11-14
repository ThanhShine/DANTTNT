import { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/helpers';

// Global error handler — luôn đặt CUỐI cùng trong app.use()
export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void => {
  console.error('🔥 Unhandled Error:', err.message);
  console.error(err.stack);

  // MySQL errors
  const mysqlErr = err as NodeJS.ErrnoException & { code?: string; errno?: number };
  if (mysqlErr.code === 'ER_DUP_ENTRY') {
    sendError(res, 'Dữ liệu đã tồn tại (duplicate entry)', 409);
    return;
  }
  if (mysqlErr.code === 'ER_NO_REFERENCED_ROW_2') {
    sendError(res, 'Dữ liệu liên kết không tồn tại', 400);
    return;
  }

  sendError(res, 'Lỗi hệ thống, vui lòng thử lại sau', 500);
};

// 404 handler
export const notFoundHandler = (_req: Request, res: Response): void => {
  sendError(res, 'Route không tồn tại', 404);
};
