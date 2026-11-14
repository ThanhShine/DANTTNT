import { Router } from 'express';
import { body } from 'express-validator';
import * as categoryController from '../controllers/category.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';

const router = Router();

// GET  /api/categories       [Public]
router.get('/',     categoryController.getCategories);
// GET  /api/categories/:id   [Public]
router.get('/:id',  categoryController.getCategoryById);

// POST /api/categories       [Admin]
router.post('/', authenticate, authorize('admin'), [
  body('name').trim().notEmpty().withMessage('Tên danh mục không được để trống'),
  body('parent_id').optional().isInt().withMessage('parent_id phải là số nguyên'),
  body('sort_order').optional().isInt({ min: 0 }).withMessage('sort_order phải là số nguyên không âm'),
  validate,
], categoryController.createCategory);

// PUT  /api/categories/:id   [Admin]
router.put('/:id', authenticate, authorize('admin'), [
  body('name').trim().notEmpty().withMessage('Tên danh mục không được để trống'),
  validate,
], categoryController.updateCategory);

// DELETE /api/categories/:id [Admin]
router.delete('/:id', authenticate, authorize('admin'), categoryController.deleteCategory);

export default router;
