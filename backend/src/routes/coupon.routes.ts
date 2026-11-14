import { Router } from 'express';
import { body } from 'express-validator';
import * as couponController from '../controllers/coupon.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';

const router = Router();

// POST /api/coupons/validate  [Public/Customer]
router.post(
  '/validate',
  [
    body('code').trim().notEmpty().withMessage('Mã giảm giá không được để trống'),
    validate,
  ],
  couponController.validateCoupon
);

// GET  /api/coupons/available [Public]
router.get('/available', couponController.getAvailableCoupons);

// ── Admin routes ─────────────────────────────────────────────
router.get('/admin', authenticate, authorize('admin'), couponController.adminGetCoupons);

router.post(
  '/admin',
  authenticate,
  authorize('admin'),
  [
    body('code').trim().notEmpty().withMessage('Mã code không được để trống'),
    body('value').isFloat({ min: 0.01 }).withMessage('Giá trị giảm phải lớn hơn 0'),
    body('type').isIn(['percentage', 'fixed']).withMessage('Loại giảm giá không hợp lệ'),
    validate,
  ],
  couponController.adminCreateCoupon
);

router.put('/admin/:id', authenticate, authorize('admin'), couponController.adminUpdateCoupon);
router.patch('/admin/:id/toggle', authenticate, authorize('admin'), couponController.adminToggleCoupon);
router.delete('/admin/:id', authenticate, authorize('admin'), couponController.adminDeleteCoupon);

export default router;
