import { Router } from 'express';
import { body } from 'express-validator';
import * as behaviorController from '../controllers/behavior.controller';
import { authenticate, authorize, optionalAuth } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';

const router = Router();

const VALID_ACTIONS = ['view', 'click', 'add_to_cart', 'remove_from_cart', 'purchase', 'wishlist', 'like', 'review', 'search'];

// ── POST /api/behaviors — Ghi hành vi đơn ───────────────────
// Optional Auth: guest và user đều có thể ghi
router.post(
  '/',
  optionalAuth,
  [
    body('action_type')
      .isIn(VALID_ACTIONS)
      .withMessage(`action_type không hợp lệ. Chấp nhận: ${VALID_ACTIONS.join(', ')}`),
    body('product_id')
      .optional({ nullable: true })
      .isInt({ min: 1 })
      .withMessage('product_id phải là số nguyên dương'),
    body('search_keyword')
      .optional({ nullable: true })
      .isString()
      .trim()
      .isLength({ max: 500 })
      .withMessage('search_keyword tối đa 500 ký tự'),
    body('session_id').optional().isString(),
    body('duration').optional({ nullable: true }).isInt({ min: 0 }),
    body('source').optional().isString().isLength({ max: 100 }),
    validate,
  ],
  behaviorController.logBehavior
);

// ── POST /api/behaviors/batch — Ghi nhiều hành vi ───────────
// Dùng khi offline rồi sync lại hoặc track nhiều event cùng lúc
router.post(
  '/batch',
  optionalAuth,
  [
    body('behaviors').isArray({ min: 1, max: 50 }).withMessage('behaviors là mảng 1-50 phần tử'),
    body('behaviors.*.action_type').isIn(VALID_ACTIONS),
    body('behaviors.*.product_id').optional({ nullable: true }).isInt({ min: 1 }),
    body('behaviors.*.search_keyword').optional({ nullable: true }).isString().trim(),
    body('behaviors.*.duration').optional({ nullable: true }).isInt({ min: 0 }),
    validate,
  ],
  behaviorController.logBehaviorBatch
);

// ── GET /api/behaviors — Admin: Xem log ─────────────────────
router.get('/', authenticate, authorize('admin', 'staff'), behaviorController.getBehaviors);

// ── GET /api/behaviors/stats — Admin: Thống kê ──────────────
router.get('/stats', authenticate, authorize('admin', 'staff'), behaviorController.getBehaviorStats);

// ── GET /api/behaviors/user/:userId — Hành vi user ──────────
router.get('/user/:userId', authenticate, behaviorController.getUserBehaviors);

// ── GET /api/behaviors/product/:productId — Hành vi SP ──────
router.get('/product/:productId', authenticate, authorize('admin', 'staff'), behaviorController.getProductBehaviors);

export default router;
