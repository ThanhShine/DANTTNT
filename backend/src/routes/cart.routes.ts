import { Router } from 'express';
import { body } from 'express-validator';
import * as cartController from '../controllers/cart.controller';
import * as accountController from '../controllers/account.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';

const router = Router();

// Tất cả cart routes cần đăng nhập
router.use(authenticate);

// GET    /api/cart
router.get('/', cartController.getCart);

// POST   /api/cart/items
router.post('/items', [
  body('product_id').isInt({ min: 1 }).withMessage('product_id không hợp lệ'),
  body('quantity').isInt({ min: 1 }).withMessage('Số lượng phải lớn hơn 0'),
  body('variant_id').optional().isInt({ min: 1 }).withMessage('variant_id không hợp lệ'),
  validate,
], cartController.addToCart);

// POST   /api/cart/sync — Đồng bộ giỏ hàng khách vãng lai
router.post('/sync', cartController.syncCart);


// PUT    /api/cart/items/:itemId
router.put('/items/:itemId', [
  body('quantity').isInt({ min: 1 }).withMessage('Số lượng phải lớn hơn 0'),
  validate,
], cartController.updateCartItem);

// DELETE /api/cart/items/:itemId
router.delete('/items/:itemId', cartController.removeFromCart);

// DELETE /api/cart
router.delete('/', cartController.clearCart);

// GET    /api/cart/history — Lịch sử thao tác giỏ hàng
router.get('/history', accountController.getCartHistory);

export default router;
