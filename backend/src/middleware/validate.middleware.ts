import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { sendBadRequest } from '../utils/helpers';

// Middleware kiểm tra kết quả validation từ express-validator
export const validate = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    sendBadRequest(res, 'Dữ liệu không hợp lệ', errors.array());
    return;
  }
  next();
};
