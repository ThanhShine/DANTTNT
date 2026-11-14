# ============================================================
# Hướng dẫn chạy Vision Service (Giai đoạn 9)
# ============================================================

# 1. Mở Terminal MỚI (giữ Node.js và React đang chạy)
cd vision-service

# 2. Tạo môi trường ảo Python (chỉ làm 1 lần đầu)
python -m venv .venv
.venv\Scripts\activate

# 3. Cài thư viện (chỉ làm 1 lần đầu, có thể mất 5-10 phút do ultralytics nặng)
pip install -r requirements.txt

# 4. Chạy Vision Service tại cổng 8001
uvicorn main:app --reload --port 8001

# ============================================================
# Khi chạy lần đầu, YOLOv8 sẽ TỰ ĐỘNG tải về model yolov8n.pt
# (~6MB). Chỉ cần có kết nối Internet.
#
# Health check sau khi chạy:
#   http://localhost:8001/health
#
# Test nhanh bằng cURL:
#   curl -X POST http://localhost:5000/api/vision/detect \
#        -F "image=@C:/path/to/laptop.jpg"
# ============================================================
