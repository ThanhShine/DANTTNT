"""
main.py — Vision Service FastAPI Application
Giai đoạn 9: Computer Vision với YOLOv8 & OpenCV

Chạy: uvicorn main:app --reload --port 8001
"""

import os
import sys
from contextlib import asynccontextmanager
from datetime import datetime
from pathlib import Path
from typing import Optional

# Windows console mặc định cp1258/cp1252 → print tiếng Việt gây UnicodeEncodeError khi khởi động
for _stream in (sys.stdout, sys.stderr):
    if hasattr(_stream, "reconfigure"):
        _stream.reconfigure(encoding="utf-8", errors="replace")

from fastapi import FastAPI, UploadFile, File, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from dotenv import load_dotenv

# Load .env trước khi import db/detector (chúng đọc biến môi trường)
load_dotenv(dotenv_path=Path(__file__).parent / ".env", override=True)

from detector import detect, get_model_info, preprocess_image
from db import find_products_by_category, find_popular_products

# ── Allowed image MIME types ──────────────────────────────────
ALLOWED_TYPES = {"image/jpeg", "image/jpg", "image/png", "image/webp"}
MAX_FILE_SIZE  = int(os.getenv("MAX_IMAGE_SIZE_MB", "5")) * 1024 * 1024  # bytes
CONF_THRESHOLD = float(os.getenv("YOLO_CONF_THRESHOLD", "0.40"))


# ── App lifespan ──────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    print(">>> Vision Service đang khởi động...")
    info = get_model_info()
    if info["loaded"]:
        print(f"  [OK] Model: {info['model_path']} | Classes: {info['num_classes']}")
    else:
        print(f"  [WARN] Model chưa sẵn sàng: {info.get('error')}")
    yield
    print(">>> Vision Service đang tắt...")


app = FastAPI(
    title="Sales AI — Vision Service",
    description="Nhận diện sản phẩm bằng YOLOv8 & OpenCV",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173", "http://localhost:5000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Security: Internal API Key ────────────────────────────────
def verify_key(x_internal_key: Optional[str]) -> bool:
    expected = os.getenv("INTERNAL_API_KEY", "")
    if not expected:
        return True  # Dev mode: bỏ qua kiểm tra
    return x_internal_key == expected


# ── Health Check ─────────────────────────────────────────────
@app.get("/health")
async def health():
    model_info = get_model_info()
    return {
        "status": "ok",
        "service": "Vision Service",
        "model_loaded": model_info["loaded"],
        "model_path": model_info.get("model_path"),
        "timestamp": datetime.now().isoformat(),
    }


# ── Model Info ────────────────────────────────────────────────
@app.get("/model-info")
async def model_info(x_internal_key: Optional[str] = Header(None)):
    if not verify_key(x_internal_key):
        raise HTTPException(status_code=403, detail="Forbidden")
    return get_model_info()


# ── POST /api/vision/detect ───────────────────────────────────
@app.post("/api/vision/detect")
async def detect_product(
    file: UploadFile = File(...),
    x_internal_key: Optional[str] = Header(None),
):
    """
    Nhận diện sản phẩm trong ảnh upload.

    Returns:
        {
            "detections": [...],    # Danh sách object nhận diện được
            "products": [...],      # Sản phẩm phù hợp từ DB
            "top_class": str,       # Class nhận diện cao nhất
            "confidence": float,
            "message": str,
        }
    """
    # ── 1. Validate internal key ──────────────────────────────
    if not verify_key(x_internal_key):
        raise HTTPException(status_code=403, detail="Forbidden: Invalid internal API key")

    # ── 2. Validate file type ─────────────────────────────────
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Định dạng file không hợp lệ. Chỉ hỗ trợ: JPG, PNG, WEBP"
        )

    # ── 3. Đọc và validate kích thước file ───────────────────
    image_bytes = await file.read()
    if len(image_bytes) == 0:
        raise HTTPException(status_code=400, detail="File ảnh rỗng")
    if len(image_bytes) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail=f"File quá lớn. Tối đa {MAX_FILE_SIZE // (1024*1024)}MB"
        )

    # ── 4. Tiền xử lý + Nhận diện bằng YOLOv8 ───────────────
    try:
        detections = detect(image_bytes, conf_threshold=CONF_THRESHOLD)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        print(f"[Vision Error] Lỗi khi nhận diện: {e}")
        raise HTTPException(status_code=500, detail="Lỗi khi phân tích ảnh")

    # ── 5. Xử lý kết quả nhận diện ───────────────────────────
    if not detections:
        # Không nhận diện được → trả về sản phẩm phổ biến (Fallback)
        popular = find_popular_products(limit=8)
        return {
            "detections": [],
            "products": _format_products(popular),
            "top_class": None,
            "confidence": 0.0,
            "message": "Không nhận diện rõ được sản phẩm trong ảnh. Đây là các sản phẩm bán chạy nhất.",
            "fallback": True,
        }

    top = detections[0]
    top_class = top["class_name"]
    confidence = top["confidence"]

    # ── 6. Tìm sản phẩm phù hợp trong MySQL ──────────────────
    products = find_products_by_category(top_class, limit=8)

    if not products:
        # Class nhận diện ra nhưng không có sản phẩm → gợi ý phổ biến
        products = find_popular_products(limit=8)
        message = f"Nhận diện được '{top_class}' nhưng hiện chưa có sản phẩm phù hợp. Đây là gợi ý thay thế."
        fallback = True
    else:
        message = f"Nhận diện được '{top_class}' với độ chính xác {confidence*100:.0f}%. Đây là các sản phẩm phù hợp."
        fallback = False

    return {
        "detections": detections,
        "products": _format_products(products),
        "top_class": top_class,
        "confidence": confidence,
        "message": message,
        "fallback": fallback,
    }


# ── Helper: format product dict ───────────────────────────────
def _format_products(rows: list[dict]) -> list[dict]:
    """Chuẩn hoá output giống với các API khác trong hệ thống."""
    formatted = []
    for p in rows:
        formatted.append({
            "product_id":    p.get("product_id"),
            "product_name":  p.get("product_name"),
            "price":         float(p.get("price") or 0),
            "sale_price":    float(p.get("sale_price")) if p.get("sale_price") else None,
            "image":         p.get("image") or "",
            "avg_rating":    float(p.get("avg_rating") or 0),
            "category_name": p.get("category_name"),
        })
    return formatted


# ── Global Error Handler ──────────────────────────────────────
@app.exception_handler(Exception)
async def global_error_handler(request, exc: Exception):
    print(f"[Vision Service Error] {exc}")
    return JSONResponse(
        status_code=500,
        content={
            "detections": [],
            "products": [],
            "message": "Vision Service gặp sự cố. Vui lòng thử lại sau.",
            "error": str(exc),
        }
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=os.getenv("VISION_SERVICE_HOST", "0.0.0.0"),
        port=int(os.getenv("VISION_SERVICE_PORT", "8001")),
        reload=True,
    )
