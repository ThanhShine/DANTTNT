import { Router } from 'express';
import { body } from 'express-validator';
import * as reviewController from '../controllers/review.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';

const router = Router();

// GET  /api/reviews/my               [Protected - Customer]
router.get('/my', authenticate, reviewController.getMyReviews);

// GET  /api/reviews/product/:productId [Public]
router.get('/product/:productId', reviewController.getProductReviews);

// POST /api/reviews                  [Protected - Customer]
router.post('/', authenticate, [
  body('product_id').isInt({ min: 1 }).withMessage('product_id không hợp lệ'),
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating phải từ 1 đến 5'),
  body('comment').optional().isString().isLength({ max: 1000 }).withMessage('Nhận xét tối đa 1000 ký tự'),
  body('title').optional().isString().isLength({ max: 200 }),
  validate,
], reviewController.createReview);

// DELETE /api/reviews/:id            [Protected - chủ review hoặc Admin]
router.delete('/:id', authenticate, reviewController.deleteReview);

export default router;
