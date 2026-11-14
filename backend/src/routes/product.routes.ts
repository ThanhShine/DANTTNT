import { Router } from 'express';
import { body } from 'express-validator';
import * as productController from '../controllers/product.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';

const router = Router();

// GET  /api/products/search  [Public]
router.get('/search',  productController.searchProducts);
// GET  /api/products         [Public]
router.get('/',        productController.getProducts);
// GET  /api/products/:id     [Public]
router.get('/:id',     productController.getProductById);

// POST /api/products         [Admin]
router.post('/', authenticate, authorize('admin'), [
  body('category_id').isInt({ min: 1 }).withMessage('category_id không hợp lệ'),
  body('name').trim().notEmpty().withMessage('Tên sản phẩm không được để trống'),
  body('sku').trim().notEmpty().withMessage('SKU không được để trống'),
  body('base_price').isFloat({ min: 0 }).withMessage('Giá sản phẩm phải là số dương'),
  body('stock_quantity').optional().isInt({ min: 0 }).withMessage('Tồn kho phải là số không âm'),
  body('sale_price').optional().isFloat({ min: 0 }).withMessage('Giá khuyến mãi phải là số dương'),
  validate,
], productController.createProduct);

// PUT  /api/products/:id     [Admin]
router.put('/:id', authenticate, authorize('admin'), [
  body('category_id').isInt({ min: 1 }).withMessage('category_id không hợp lệ'),
  body('name').trim().notEmpty().withMessage('Tên sản phẩm không được để trống'),
  body('base_price').isFloat({ min: 0 }).withMessage('Giá sản phẩm phải là số dương'),
  validate,
], productController.updateProduct);

// DELETE /api/products/:id   [Admin]
router.delete('/:id', authenticate, authorize('admin'), productController.deleteProduct);

// ── Variants Routes [Admin] ───────────────────────────────────
router.post('/:id/variants', authenticate, authorize('admin'), productController.addProductVariant);
router.put('/:id/variants/:variantId', authenticate, authorize('admin'), productController.updateProductVariant);
router.delete('/:id/variants/:variantId', authenticate, authorize('admin'), productController.deleteProductVariant);

// ── Gallery Images Routes [Admin] ─────────────────────────────
router.post('/:id/images', authenticate, authorize('admin'), productController.addProductImage);
router.delete('/:id/images/:imageId', authenticate, authorize('admin'), productController.deleteProductImage);
router.patch('/:id/images/:imageId/primary', authenticate, authorize('admin'), productController.setPrimaryProductImage);

export default router;
