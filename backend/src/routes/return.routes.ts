import { Router } from 'express';
import { body } from 'express-validator';
import * as returnController from '../controllers/return.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';

const router = Router();

// ── Customer Routes [Protected] ───────────────────────────────
router.post(
  '/orders/:id',
  authenticate,
  [
    body('reason').trim().notEmpty().withMessage('Lý do đổi trả không được để trống'),
    validate,
  ],
  returnController.requestOrderReturn
);

router.get('/orders/:id', authenticate, returnController.getOrderReturnDetail);

// ── Admin Routes [Admin Only] ─────────────────────────────────
router.get('/admin', authenticate, authorize('admin'), returnController.adminGetReturns);
router.put(
  '/admin/:id',
  authenticate,
  authorize('admin'),
  [
    body('status').isIn(['approved', 'rejected', 'completed']).withMessage('Trạng thái không hợp lệ'),
    validate,
  ],
  returnController.adminProcessReturn
);

export default router;
