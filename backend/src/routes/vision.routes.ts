import { Router } from 'express';
import { upload, detectProduct } from '../controllers/vision.controller';

const router = Router();

/**
 * POST /api/vision/detect
 * Body: multipart/form-data với field "image"
 *
 * Ví dụ cURL:
 *   curl -X POST http://localhost:5000/api/vision/detect \
 *        -F "image=@/path/to/laptop.jpg"
 */
router.post(
  '/detect',
  upload.single('image'),   // Multer xử lý file upload
  detectProduct
);

export default router;
