import { Response } from 'express';
import { ApiResponse, PaginationMeta } from '../types';

export const sendSuccess = <T>(
  res: Response,
  data: T,
  message = 'Thành công',
  statusCode = 200,
  meta?: PaginationMeta
): Response => {
  const response: ApiResponse<T> = { success: true, message, data };
  if (meta) response.meta = meta;
  return res.status(statusCode).json(response);
};

export const sendCreated = <T>(res: Response, data: T, message = 'Tạo thành công'): Response =>
  sendSuccess(res, data, message, 201);

export const sendError = (
  res: Response,
  message: string,
  statusCode = 500,
  errors?: unknown
): Response => {
  const response: ApiResponse = { success: false, message };
  if (errors) response.errors = errors;
  return res.status(statusCode).json(response);
};

export const sendBadRequest  = (res: Response, message: string, errors?: unknown) =>
  sendError(res, message, 400, errors);

export const sendUnauthorized = (res: Response, message = 'Chưa đăng nhập hoặc token không hợp lệ') =>
  sendError(res, message, 401);

export const sendForbidden    = (res: Response, message = 'Không có quyền thực hiện') =>
  sendError(res, message, 403);

export const sendNotFound     = (res: Response, message = 'Không tìm thấy') =>
  sendError(res, message, 404);

export const sendConflict     = (res: Response, message: string) =>
  sendError(res, message, 409);

// Tạo pagination meta
export const paginate = (total: number, page: number, limit: number): PaginationMeta => ({
  page,
  limit,
  total,
  totalPages: Math.ceil(total / limit),
});

// Lấy page & limit từ query params
export const getPagination = (pageStr?: string, limitStr?: string) => {
  const page  = Math.max(1, parseInt(pageStr  || '1',  10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(limitStr || '10', 10) || 10));
  const offset = (page - 1) * limit;
  return { page, limit, offset };
};

// Tạo slug từ string tiếng Việt
export const toSlug = (text: string): string => {
  const viMap: Record<string, string> = {
    à:'a',á:'a',ạ:'a',ả:'a',ã:'a',â:'a',ầ:'a',ấ:'a',ậ:'a',ẩ:'a',ẫ:'a',
    ă:'a',ắ:'a',ằ:'a',ặ:'a',ẳ:'a',ẵ:'a',
    è:'e',é:'e',ẹ:'e',ẻ:'e',ẽ:'e',ê:'e',ề:'e',ế:'e',ệ:'e',ể:'e',ễ:'e',
    ì:'i',í:'i',ị:'i',ỉ:'i',ĩ:'i',
    ò:'o',ó:'o',ọ:'o',ỏ:'o',õ:'o',ô:'o',ồ:'o',ố:'o',ộ:'o',ổ:'o',ỗ:'o',
    ơ:'o',ờ:'o',ớ:'o',ợ:'o',ở:'o',ỡ:'o',
    ù:'u',ú:'u',ụ:'u',ủ:'u',ũ:'u',ư:'u',ừ:'u',ứ:'u',ự:'u',ử:'u',ữ:'u',
    ỳ:'y',ý:'y',ỵ:'y',ỷ:'y',ỹ:'y',
    đ:'d',
    À:'a',Á:'a',Ạ:'a',Ả:'a',Ã:'a',Â:'a',Ầ:'a',Ấ:'a',Ậ:'a',Ẩ:'a',Ẫ:'a',
    Ă:'a',Ắ:'a',Ằ:'a',Ặ:'a',Ẳ:'a',Ẵ:'a',
    È:'e',É:'e',Ẹ:'e',Ẻ:'e',Ẽ:'e',Ê:'e',Ề:'e',Ế:'e',Ệ:'e',Ể:'e',Ễ:'e',
    Ì:'i',Í:'i',Ị:'i',Ỉ:'i',Ĩ:'i',
    Ò:'o',Ó:'o',Ọ:'o',Ỏ:'o',Õ:'o',Ô:'o',Ồ:'o',Ố:'o',Ộ:'o',Ổ:'o',Ỗ:'o',
    Ơ:'o',Ờ:'o',Ớ:'o',Ợ:'o',Ở:'o',Ỡ:'o',
    Ù:'u',Ú:'u',Ụ:'u',Ủ:'u',Ũ:'u',Ư:'u',Ừ:'u',Ứ:'u',Ự:'u',Ử:'u',Ữ:'u',
    Ỳ:'y',Ý:'y',Ỵ:'y',Ỷ:'y',Ỹ:'y',
    Đ:'d',
  };
  return text
    .split('')
    .map(c => viMap[c] || c)
    .join('')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
};

// Tạo order code
export const generateOrderCode = (): string => {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.floor(Math.random() * 9000) + 1000;
  return `ORD-${dateStr}-${rand}`;
};
