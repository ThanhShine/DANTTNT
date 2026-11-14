import { Router } from 'express';
import { body } from 'express-validator';
import * as adminController from '../controllers/admin.controller';
import * as userController from '../controllers/user.controller';
import * as chatController from '../controllers/chat.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';

const router = Router();

// Tất cả routes admin đều cần xác thực + quyền admin
router.use(authenticate, authorize('admin', 'staff'));

// ── Dashboard ─────────────────────────────────────────────────
router.get('/dashboard', adminController.getDashboard);

// ── Revenue Reports ───────────────────────────────────────────
router.get('/reports/revenue', adminController.getRevenueReport);

// ── Orders ───────────────────────────────────────────────────
router.get('/orders', adminController.getAdminOrders);
router.put('/orders/:id/status', [
  body('status').optional().isIn(['pending','processing','shipped','delivered','cancelled','returned']),
  body('payment_status').optional().isIn(['pending','paid','failed','refunded']),
  validate,
], adminController.updateAdminOrderStatus);

// ── Reviews ───────────────────────────────────────────────────
router.get('/reviews', adminController.getAdminReviews);
router.put('/reviews/:id/visibility', adminController.toggleReviewVisibility);
router.delete('/reviews/:id', adminController.deleteAdminReview);

// ── Stats ─────────────────────────────────────────────────────
router.get('/stats/top-products', adminController.getTopProducts);
router.get('/stats/users', adminController.getUserStats);
router.get('/chat-stats', chatController.getAdminChatStats);

// ── Inventory ─────────────────────────────────────────────────
router.get('/inventory', adminController.getInventory);
router.put('/inventory/:id', [
  body('stock_quantity').isInt({ min: 0 }).withMessage('Tồn kho phải là số không âm'),
  validate,
], adminController.updateInventory);

// ── Users (forward to userController) ────────────────────────
router.get('/users', userController.getAllUsers);
router.get('/users/:id', userController.getUserById);
router.put('/users/:id/status', authorize('admin'), userController.toggleUserStatus);
router.delete('/users/:id', authorize('admin'), userController.deleteUser);

export default router;
