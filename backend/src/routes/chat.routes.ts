import { Router } from 'express';
import { body, param } from 'express-validator';
import * as chatController from '../controllers/chat.controller';
import { authenticate, optionalAuth, authorize } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';

const router = Router();

// ── GET /api/chat/admin/stats — Thống kê Chatbot cho Admin (Section 11) ──
router.get('/admin/stats', authenticate, authorize('admin', 'staff'), chatController.getAdminChatStats);

// ── POST /api/chat/sessions — Tạo phiên chat mới (Section 2) ──
router.post(
  '/sessions',
  optionalAuth,
  [
    body('title').optional().isString().isLength({ max: 255 }).withMessage('Tiêu đề tối đa 255 ký tự'),
    validate,
  ],
  chatController.createSession
);

// ── GET /api/chat/sessions — Lấy danh sách session của user hiện tại (Section 6, 7) ──
router.get(
  '/sessions',
  authenticate,
  chatController.getSessions
);

// ── GET /api/chat/sessions/:sessionId — Lấy toàn bộ tin nhắn trong session (Section 6) ──
router.get(
  '/sessions/:sessionId',
  optionalAuth,
  [
    param('sessionId').notEmpty().withMessage('sessionId là bắt buộc'),
    validate,
  ],
  chatController.getSessionDetail
);

// ── POST /api/chat/sessions/:sessionId/messages — Gửi tin nhắn mới & nhận AI response (Section 3, 4, 5, 6) ──
router.post(
  '/sessions/:sessionId/messages',
  optionalAuth,
  [
    param('sessionId').notEmpty().withMessage('sessionId là bắt buộc'),
    body('message')
      .notEmpty().withMessage('Tin nhắn không được để trống')
      .isString().withMessage('Tin nhắn phải là chuỗi ký tự')
      .isLength({ max: 2000 }).withMessage('Tin nhắn tối đa 2000 ký tự'),
    validate,
  ],
  chatController.sendMessage
);

// ── POST /api/chat/message — Gửi tin nhắn trực tiếp qua Node -> Python Local AI (Section 8) ──
router.post(
  '/message',
  optionalAuth,
  [
    body('message')
      .notEmpty().withMessage('Tin nhắn không được để trống')
      .isString().withMessage('Tin nhắn phải là chuỗi ký tự')
      .isLength({ max: 2000 }).withMessage('Tin nhắn tối đa 2000 ký tự'),
    body('session_id').optional(),
    validate,
  ],
  chatController.postDirectChatMessage
);

// ── DELETE /api/chat/sessions/:sessionId — Xóa session của user (Section 6, 7) ──
router.delete(
  '/sessions/:sessionId',
  authenticate,
  [
    param('sessionId').notEmpty().withMessage('sessionId là bắt buộc'),
    validate,
  ],
  chatController.deleteSession
);

export default router;
