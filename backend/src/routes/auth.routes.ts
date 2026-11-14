import { Router } from 'express';
import { body } from 'express-validator';
import * as authController from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';

const router = Router();

// POST /api/auth/register
router.post('/register', [
  body('email').isEmail().normalizeEmail().withMessage('Email không hợp lệ'),
  body('password').isLength({ min: 6 }).withMessage('Mật khẩu phải ít nhất 6 ký tự'),
  body('full_name').trim().notEmpty().withMessage('Họ tên không được để trống'),
  body('phone').optional().isMobilePhone('vi-VN').withMessage('Số điện thoại không hợp lệ'),
  validate,
], authController.register);

// POST /api/auth/login
router.post('/login', [
  body('email').isEmail().normalizeEmail().withMessage('Email không hợp lệ'),
  body('password').notEmpty().withMessage('Mật khẩu không được để trống'),
  validate,
], authController.login);

// POST /api/auth/refresh
router.post('/refresh', [
  body('refreshToken').notEmpty().withMessage('Refresh token không được để trống'),
  validate,
], authController.refreshToken);

// POST /api/auth/logout [Protected]
router.post('/logout', authenticate, authController.logout);

// GET /api/auth/profile [Protected]
router.get('/profile', authenticate, authController.getProfile);

// PUT /api/auth/change-password [Protected]
router.put('/change-password', authenticate, [
  body('currentPassword').notEmpty().withMessage('Mật khẩu hiện tại không được để trống'),
  body('newPassword').isLength({ min: 6 }).withMessage('Mật khẩu mới phải ít nhất 6 ký tự'),
  validate,
], authController.changePassword);

// POST /api/auth/forgot-password [Public]
router.post('/forgot-password', [
  body('email').isEmail().normalizeEmail().withMessage('Email không hợp lệ'),
  validate,
], authController.forgotPassword);

// POST /api/auth/reset-password [Public]
router.post('/reset-password', [
  body('email').isEmail().normalizeEmail().withMessage('Email không hợp lệ'),
  body('otp').trim().isLength({ min: 6, max: 6 }).withMessage('Mã OTP phải gồm 6 chữ số'),
  body('new_password').isLength({ min: 6 }).withMessage('Mật khẩu mới phải ít nhất 6 ký tự'),
  validate,
], authController.resetPassword);

export default router;
