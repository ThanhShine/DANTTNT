"""
detector.py — YOLOv8 + OpenCV Detection Engine
Giai đoạn 9: Computer Vision
"""

import os
import cv2
import numpy as np
from pathlib import Path
from typing import Optional

# YOLOv8 — load lazy để khởi động nhanh
_model = None
_model_path: Optional[str] = None


def _get_model():
    """Load model 1 lần duy nhất (Singleton pattern)."""
    global _model, _model_path

    if _model is not None:
        return _model

    from ultralytics import YOLO

    # Ưu tiên model đã train riêng, nếu không có dùng pretrained YOLOv8n
    candidates = [
        os.getenv("YOLO_MODEL_PATH", ""),
        "models/best.pt",          # Model đã train custom
        "yolov8n.pt",              # Pretrained fallback (tự tải về lần đầu)
    ]

    for path in candidates:
        if not path:
            continue
        if Path(path).exists() or path == "yolov8n.pt":
            try:
                print(f"[Vision] Loading YOLO model: {path}")
                _model = YOLO(path)
                _model_path = path
                print(f"[Vision] Model loaded successfully. Classes: {len(_model.names)}")
                return _model
            except Exception as e:
                print(f"[Vision] Failed to load {path}: {e}")
                continue

    raise RuntimeError(
        "Không tìm thấy YOLO model. "
        "Hãy chạy: python train.py  hoặc cài ultralytics để tự tải yolov8n.pt"
    )


def preprocess_image(image_bytes: bytes) -> np.ndarray:
    """
    Tiền xử lý ảnh bằng OpenCV:
    - Decode từ bytes
    - Resize về 640x640 (YOLO chuẩn)
    - Normalize màu sắc (CLAHE) để cải thiện độ tương phản
    """
    nparr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    if img is None:
        raise ValueError("Không thể đọc file ảnh. File có thể bị lỗi hoặc không phải ảnh.")

    # Resize về tỷ lệ chuẩn YOLO mà không méo ảnh (letterbox)
    h, w = img.shape[:2]
    scale = 640 / max(h, w)
    new_w, new_h = int(w * scale), int(h * scale)
    resized = cv2.resize(img, (new_w, new_h))

    # Pad về đúng 640x640
    canvas = np.zeros((640, 640, 3), dtype=np.uint8)
    pad_y = (640 - new_h) // 2
    pad_x = (640 - new_w) // 2
    canvas[pad_y:pad_y + new_h, pad_x:pad_x + new_w] = resized

    # CLAHE — tăng độ tương phản ảnh tối/mờ
    lab = cv2.cvtColor(canvas, cv2.COLOR_BGR2LAB)
    l_channel, a, b = cv2.split(lab)
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    cl = clahe.apply(l_channel)
    enhanced = cv2.merge((cl, a, b))
    result = cv2.cvtColor(enhanced, cv2.COLOR_LAB2BGR)

    return result


def detect(image_bytes: bytes, conf_threshold: float = 0.40) -> list[dict]:
    """
    Nhận diện đối tượng trong ảnh.

    Returns:
        list[dict] với mỗi phần tử là:
        {
            "class_name": str,
            "confidence": float,
            "bbox": [x1, y1, x2, y2]
        }
    """
    model = _get_model()
    img = preprocess_image(image_bytes)

    # Chạy inference
    results = model(img, conf=conf_threshold, verbose=False)

    detections: list[dict] = []
    for result in results:
        for box in result.boxes:
            cls_id = int(box.cls[0])
            conf   = float(box.conf[0])
            x1, y1, x2, y2 = box.xyxy[0].tolist()

            detections.append({
                "class_name":  model.names[cls_id],
                "confidence":  round(conf, 4),
                "bbox": [int(x1), int(y1), int(x2), int(y2)],
            })

    # Sắp xếp theo confidence giảm dần, loại trùng class
    seen: set[str] = set()
    unique_detections: list[dict] = []
    for det in sorted(detections, key=lambda d: d["confidence"], reverse=True):
        if det["class_name"] not in seen:
            seen.add(det["class_name"])
            unique_detections.append(det)

    return unique_detections


def get_model_info() -> dict:
    """Trả về thông tin model đang dùng."""
    try:
        model = _get_model()
        return {
            "loaded": True,
            "model_path": _model_path,
            "num_classes": len(model.names),
            "classes": list(model.names.values()),
        }
    except Exception as e:
        return {"loaded": False, "error": str(e)}
