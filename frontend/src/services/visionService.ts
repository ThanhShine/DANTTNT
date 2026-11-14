/**
 * visionService.ts — Gọi API Vision detect (upload ảnh)
 * Giai đoạn 9: Computer Vision
 */

import api from './api';

export interface Detection {
  class_name:  string;
  confidence:  number;
  bbox:        [number, number, number, number];
}

export interface VisionProduct {
  product_id:    number;
  product_name:  string;
  price:         number;
  sale_price:    number | null;
  image:         string;
  avg_rating:    number;
  category_name: string;
}

export interface VisionResult {
  detections:  Detection[];
  products:    VisionProduct[];
  top_class:   string | null;
  confidence:  number;
  message:     string;
  fallback:    boolean;
}

/**
 * Upload ảnh và nhận danh sách sản phẩm từ YOLOv8
 */
export async function detectFromImage(file: File): Promise<VisionResult> {
  const formData = new FormData();
  formData.append('image', file);

  const response = await api.post<{ success: boolean; data: VisionResult }>(
    '/vision/detect',
    formData,
    {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 20000,
    }
  );

  return response.data.data;
}
