import { Router } from 'express';
import { body } from 'express-validator';
import * as orderController from '../controllers/order.controller';
import * as accountController from '../controllers/account.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';

const router = Router();

router.use(authenticate);

// POST /api/orders          [Customer]
router.post('/', [
  body('address_id').isInt({ min: 1 }).withMessage('Vui lòng chọn địa chỉ giao hàng'),
  body('payment_method').isIn(['COD','VNPAY','MOMO','BANK_TRANSFER']).withMessage('Phương thức thanh toán không hợp lệ'),
  body('coupon_code').optional().isString(),
  validate,
], orderController.createOrder);

// GET  /api/orders          [Customer - đơn của mình]
router.get('/', orderController.getMyOrders);

// GET  /api/orders/admin/all [Admin/Staff - tất cả đơn]
router.get('/admin/all', authorize('admin', 'staff'), orderController.getAllOrders);

// GET  /api/orders/:id/history — Timeline trạng thái đơn hàng
router.get('/:id/history', accountController.getOrderHistory);

// GET  /api/orders/:id      [Customer - đơn của mình | Admin - bất kỳ đơn]
router.get('/:id', orderController.getOrderById);

// PUT  /api/orders/:id/status [Admin/Staff]
router.put('/:id/status', authorize('admin', 'staff'), [
  body('status').isIn(['pending','processing','shipped','delivered','cancelled','returned'])
    .withMessage('Trạng thái không hợp lệ'),
  validate,
], orderController.updateOrderStatus);

// PUT  /api/orders/:id/cancel [Customer]
router.put('/:id/cancel', orderController.cancelOrder);

export default router;
