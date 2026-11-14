import { Request, Response, NextFunction } from 'express';
import axios, { AxiosError } from 'axios';
import FormData from 'form-data';
import multer from 'multer';
import { sendSuccess, sendBadRequest, sendError } from '../utils/helpers';
import { config } from '../config';

const VISION_SERVICE_URL = process.env.VISION_SERVICE_URL || 'http://localhost:8001';
const VISION_TIMEOUT_MS  = 15_000; // 15 giây
const MAX_FILE_SIZE_MB   = 5;

// ── Multer: lưu ảnh vào RAM (không ghi đĩa) ─────────────────
export const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_FILE_SIZE_MB * 1024 * 1024,
    files: 1,
  },
  fileFilter(_req, file, cb) {
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Chỉ hỗ trợ file ảnh JPG, PNG hoặc WEBP'));
    }
  },
});

// ── POST /api/vision/detect ───────────────────────────────────
export const detectProduct = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Multer đã xử lý file — req.file chứa buffer ảnh
    if (!req.file) {
      sendBadRequest(res, 'Vui lòng upload một file ảnh (field: image)');
      return;
    }

    // ── Tạo FormData để gửi stream sang Python ────────────────
    const form = new FormData();
    form.append('file', req.file.buffer, {
      filename:    req.file.originalname || 'image.jpg',
      contentType: req.file.mimetype,
    });

    // ── Gọi Python Vision Service ─────────────────────────────
    let visionData: {
      detections:  Array<{ class_name: string; confidence: number; bbox: number[] }>;
      products:    Array<Record<string, unknown>>;
      top_class:   string | null;
      confidence:  number;
      message:     string;
      fallback:    boolean;
    };

    try {
      const { data } = await axios.post(
        `${VISION_SERVICE_URL}/api/vision/detect`,
        form,
        {
          headers: {
            ...form.getHeaders(),
            'x-internal-key': process.env.INTERNAL_API_KEY || '',
          },
          timeout: VISION_TIMEOUT_MS,
          maxContentLength: Infinity,
          maxBodyLength: Infinity,
        }
      );
      visionData = data;
    } catch (err) {
      const axiosErr = err as AxiosError<{ detail?: string }>;

      // Phân loại lỗi từ Python để trả message rõ ràng
      if (axiosErr.response?.status === 400) {
        sendBadRequest(res, axiosErr.response.data?.detail || 'Ảnh không hợp lệ');
        return;
      }
      if (axiosErr.code === 'ECONNABORTED') {
        sendError(res, 'Vision Service phản hồi quá chậm. Vui lòng thử lại với ảnh nhỏ hơn.', 504);
        return;
      }
      if (axiosErr.code === 'ECONNREFUSED') {
        sendError(res, 'Vision Service chưa khởi động. Hãy chạy vision-service/main.py.', 503);
        return;
      }

      console.error('[Vision Controller Error]', axiosErr.message);
      sendError(res, 'Không thể kết nối tới Vision Service', 502);
      return;
    }

    // ── Trả kết quả về Frontend ───────────────────────────────
    sendSuccess(res, {
      detections: visionData.detections,
      products:   visionData.products,
      top_class:  visionData.top_class,
      confidence: visionData.confidence,
      message:    visionData.message,
      fallback:   visionData.fallback,
    }, visionData.message);

  } catch (error) {
    next(error);
  }
};
