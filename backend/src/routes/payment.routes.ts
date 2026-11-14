import { Router } from 'express';
import { body } from 'express-validator';
import * as paymentController from '../controllers/payment.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';

const router = Router();

// POST /api/payment/vnpay/create-url  [Customer / Admin]
router.post(
  '/vnpay/create-url',
  authenticate,
  [
    body('order_id').isInt({ min: 1 }).withMessage('order_id không hợp lệ'),
    validate,
  ],
  paymentController.createVNPayUrl
);

// GET  /api/payment/vietqr/:orderId   [Customer / Admin]
router.get('/vietqr/:orderId', authenticate, paymentController.getVietQRInfo);

// GET  /api/payment/vnpay/return      [Public] (VNPay redirect về browser)
router.get('/vnpay/return', paymentController.handleVNPayReturn);

// GET  /api/payment/vnpay/ipn         [Public] (VNPay webhook server-to-server)
router.get('/vnpay/ipn', paymentController.handleVNPayIPN);

// POST /api/payment/vietqr/confirm/:orderId [Customer]
router.post('/vietqr/confirm/:orderId', authenticate, paymentController.confirmCustomerTransfer);

// PUT  /api/payment/admin/verify/:orderId   [Admin]
router.put('/admin/verify/:orderId', authenticate, authorize('admin'), paymentController.adminVerifyBankPayment);

export default router;
