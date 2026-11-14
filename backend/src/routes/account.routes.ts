import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware';
import * as accountController from '../controllers/account.controller';

const router = Router();

// Tất cả routes cần đăng nhập
router.use(authenticate);

// GET /api/account/login-history   — Lịch sử đăng nhập của tôi
router.get('/login-history', accountController.getLoginHistory);

// GET /api/account/activity        — Lịch sử hoạt động của tôi
router.get('/activity', accountController.getActivityLog);

// ── Admin only ────────────────────────────────────────────────
// GET /api/account/admin/users/:id/login-history
router.get('/admin/users/:id/login-history', authorize('admin', 'staff'), accountController.getAdminUserLoginHistory);

// GET /api/account/admin/users/:id/activity
router.get('/admin/users/:id/activity', authorize('admin', 'staff'), accountController.getAdminUserActivity);

// GET /api/account/admin/users/:id/cart-history
router.get('/admin/users/:id/cart-history', authorize('admin', 'staff'), accountController.getAdminUserCartHistory);

// GET /api/account/admin/users/:id/chat-history
router.get('/admin/users/:id/chat-history', authorize('admin', 'staff'), accountController.getAdminUserChatHistory);

export default router;
