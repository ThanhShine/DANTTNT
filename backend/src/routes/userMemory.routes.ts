import { Router } from 'express';
import { body, param } from 'express-validator';
import * as userMemoryController from '../controllers/userMemory.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';

const router = Router();

// Yêu cầu xác thực JWT cho toàn bộ thao tác bộ nhớ cá nhân
router.use(authenticate);

// ── GET /api/user/memory — Lấy danh sách ký ức dài hạn ──
router.get('/memory', userMemoryController.getUserMemories);

// ── GET /api/user/preferences — Lấy hồ sơ sở thích tổng hợp ──
router.get('/preferences', userMemoryController.getUserPreferences);

// ── POST /api/user/memory/extract — Trích xuất ký ức từ tin nhắn ──
router.post(
  '/memory/extract',
  [
    body('message').notEmpty().withMessage('Tin nhắn không được để trống'),
    validate,
  ],
  userMemoryController.extractUserMemory
);

// ── PUT /api/user/memory/:id — Cập nhật ký ức ──
router.put(
  '/memory/:id',
  [
    param('id').isNumeric().withMessage('ID ký ức phải là số'),
    body('memory_value').notEmpty().withMessage('Giá trị ký ức không được để trống'),
    validate,
  ],
  userMemoryController.updateUserMemory
);

// ── DELETE /api/user/memory/:id — Xóa một ký ức ──
router.delete(
  '/memory/:id',
  [
    param('id').isNumeric().withMessage('ID ký ức phải là số'),
    validate,
  ],
  userMemoryController.deleteUserMemory
);

// ── DELETE /api/user/memory — Xóa toàn bộ ký ức ──
router.delete('/memory', userMemoryController.deleteAllUserMemories);

export default router;
