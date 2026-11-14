import { Router } from 'express';
import { body } from 'express-validator';
import * as userController from '../controllers/user.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';

const router = Router();

// Tất cả routes đều cần đăng nhập
router.use(authenticate);

// GET  /api/users           [Admin/Staff]
router.get('/',         authorize('admin', 'staff'), userController.getAllUsers);

// GET  /api/users/:id       [Admin/Staff hoặc chính mình]
router.get('/:id',                                  userController.getUserById);

// PUT  /api/users/:id       [Admin hoặc chính mình]
router.put('/:id', [
  body('full_name').trim().notEmpty().withMessage('Họ tên không được để trống'),
  body('phone').optional().isMobilePhone('vi-VN').withMessage('Số điện thoại không hợp lệ'),
  validate,
], userController.updateUser);

// DELETE /api/users/:id     [Admin]
router.delete('/:id', authorize('admin'), userController.deleteUser);

// PUT  /api/users/:id/status [Admin]
router.put('/:id/status', authorize('admin'), userController.toggleUserStatus);

// POST /api/users/:id/reset-password [Admin]
router.post('/:id/reset-password', authorize('admin'), [
  body('newPassword').isLength({ min: 6 }).withMessage('Mật khẩu mới phải ít nhất 6 ký tự'),
  validate,
], userController.resetPassword);

// POST /api/users/addresses
router.post('/addresses', [
  body('recipient_name').trim().notEmpty().withMessage('Tên người nhận không được để trống'),
  body('recipient_phone').isMobilePhone('vi-VN').withMessage('SĐT không hợp lệ'),
  body('province').trim().notEmpty().withMessage('Tỉnh/thành phố không được để trống'),
  body('district').trim().notEmpty().withMessage('Quận/huyện không được để trống'),
  body('ward').trim().notEmpty().withMessage('Phường/xã không được để trống'),
  body('address_detail').trim().notEmpty().withMessage('Địa chỉ chi tiết không được để trống'),
  validate,
], userController.addAddress);

// DELETE /api/users/addresses/:addressId
router.delete('/addresses/:addressId', userController.deleteAddress);

export default router;
