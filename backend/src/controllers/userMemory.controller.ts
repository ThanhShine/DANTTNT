import { Request, Response, NextFunction } from 'express';
import axios from 'axios';
import { config } from '../config';
import { sendSuccess, sendBadRequest, sendUnauthorized, sendNotFound } from '../utils/helpers';

const AI_SERVICE_URL = config.aiService.url;

// ── GET /api/user/memory — Lấy danh sách ký ức của user hiện tại ──
export const getUserMemories = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      sendUnauthorized(res, 'Vui lòng đăng nhập để xem ký ức AI');
      return;
    }

    const { data } = await axios.get(`${AI_SERVICE_URL}/api/user/memory`, {
      params: { user_id: userId },
      timeout: 10000,
    });

    sendSuccess(res, data.data || [], 'Lấy danh sách ký ức AI thành công');
  } catch (error) {
    next(error);
  }
};

// ── GET /api/user/preferences — Lấy hồ sơ sở thích tổng hợp ──
export const getUserPreferences = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      sendUnauthorized(res, 'Vui lòng đăng nhập để xem hồ sơ sở thích');
      return;
    }

    const { data } = await axios.get(`${AI_SERVICE_URL}/api/user/preferences`, {
      params: { user_id: userId },
      timeout: 10000,
    });

    sendSuccess(res, data.data || null, 'Lấy hồ sơ sở thích thành công');
  } catch (error) {
    next(error);
  }
};

// ── POST /api/user/memory/extract — Trích xuất ký ức từ tin nhắn ──
export const extractUserMemory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { message } = req.body;

    if (!userId) {
      sendUnauthorized(res, 'Vui lòng đăng nhập');
      return;
    }
    if (!message || typeof message !== 'string') {
      sendBadRequest(res, 'Nội dung tin nhắn không hợp lệ');
      return;
    }

    const { data } = await axios.post(`${AI_SERVICE_URL}/api/user/memory/extract`, {
      user_id: userId,
      message: message.trim(),
    }, { timeout: 10000 });

    sendSuccess(res, data, 'Trích xuất ký ức thành công');
  } catch (error) {
    next(error);
  }
};

// ── PUT /api/user/memory/:id — Sửa ký ức cá nhân ──
export const updateUserMemory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;
    const { memory_value, confidence } = req.body;

    if (!userId) {
      sendUnauthorized(res, 'Vui lòng đăng nhập');
      return;
    }

    if (!memory_value || typeof memory_value !== 'string') {
      sendBadRequest(res, 'Giá trị ký ức không được để trống');
      return;
    }

    const { data } = await axios.put(`${AI_SERVICE_URL}/api/user/memory/${id}`, {
      memory_value: memory_value.trim(),
      confidence: confidence !== undefined ? Number(confidence) : undefined,
    }, {
      params: { user_id: userId },
      timeout: 10000,
    });

    sendSuccess(res, data, 'Cập nhật ký ức thành công');
  } catch (error) {
    next(error);
  }
};

// ── DELETE /api/user/memory/:id — Xóa một ký ức cá nhân ──
export const deleteUserMemory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;

    if (!userId) {
      sendUnauthorized(res, 'Vui lòng đăng nhập');
      return;
    }

    const { data } = await axios.delete(`${AI_SERVICE_URL}/api/user/memory/${id}`, {
      params: { user_id: userId },
      timeout: 10000,
    });

    sendSuccess(res, data, 'Xóa ký ức thành công');
  } catch (error) {
    next(error);
  }
};

// ── DELETE /api/user/memory — Xóa toàn bộ ký ức ──
export const deleteAllUserMemories = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      sendUnauthorized(res, 'Vui lòng đăng nhập');
      return;
    }

    const { data } = await axios.delete(`${AI_SERVICE_URL}/api/user/memory`, {
      params: { user_id: userId },
      timeout: 10000,
    });

    sendSuccess(res, data, 'Đã xóa toàn bộ ký ức AI của bạn');
  } catch (error) {
    next(error);
  }
};
