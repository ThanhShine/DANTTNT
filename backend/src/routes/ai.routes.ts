import { Router } from 'express';
import { body } from 'express-validator';
import * as aiController from '../controllers/ai.controller';
import { authenticate, optionalAuth } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';

const router = Router();

// POST /api/ai/chat — Gửi tin nhắn
// OptionalAuth: guest cũng chat được (nhưng không lưu userId)
router.post(
  '/chat',
  optionalAuth,
  [
    body('message')
      .notEmpty().withMessage('Tin nhắn không được để trống')
      .isString()
      .isLength({ max: 2000 }).withMessage('Tin nhắn tối đa 2000 ký tự'),
    body('session_id')
      .optional({ nullable: true })
      .isString().isUUID().withMessage('session_id không hợp lệ'),
    validate,
  ],
  aiController.chat
);

// GET /api/ai/chat/history/:sessionId — Lịch sử chat (public by session_id)
router.get('/chat/history/:sessionId', aiController.getChatHistory);

// GET /api/ai/chat/sessions — Danh sách sessions của user (require auth)
router.get('/chat/sessions', authenticate, aiController.getChatSessions);

// DELETE /api/ai/chat/sessions/:sessionId — Đóng session
router.delete('/chat/sessions/:sessionId', optionalAuth, aiController.closeSession);

export default router;
