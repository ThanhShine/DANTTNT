# Báo cáo Phân tích Giai đoạn 9: Tích hợp Computer Vision (YOLOv8 & OpenCV)

## 1. Phân tích Mục tiêu và Kiến trúc

Ở Giai đoạn 9, tôi sẽ tích hợp công nghệ Computer Vision để phát triển tính năng Tìm kiếm bằng hình ảnh (Visual Search). Khách hàng có thể tải ảnh lên, hệ thống sẽ tự động nhận diện sản phẩm trong ảnh và gợi ý các mặt hàng tương tự đang có bán.

**Luồng dữ liệu (Data Flow) thiết kế:**
ReactJS (Tải ảnh) -> Node.js (Validate File Gateway) -> Python Vision Service -> OpenCV (Tiền xử lý) -> YOLOv8 (Nhận diện đối tượng) -> Trích xuất Tên danh mục (Class) -> Truy vấn MySQL -> Trả kết quả gợi ý về cho Frontend.

---

## 2. Kế hoạch Chuẩn bị Dữ liệu (Dataset & Labeling)

Để mô hình YOLOv8 nhận diện chính xác các sản phẩm đặc thù của dự án, tôi sẽ thực hiện các bước sau:
1. **Thu thập dữ liệu (Collect):** Chuẩn bị khoảng 300-500 ảnh cho mỗi danh mục (Laptop, Smartphone, Headphone...).
2. **Gán nhãn (Labeling):** Sử dụng công cụ `Roboflow` (hoặc phần mềm `LabelImg` cục bộ) để vẽ Bounding Box bao quanh sản phẩm và gán ID (ví dụ: `0: laptop`, `1: smartphone`).
3. **Cấu trúc thư mục YOLO:**
   - `dataset/images/train`, `dataset/images/val`
   - `dataset/labels/train`, `dataset/labels/val`
   - File cấu hình `data.yaml`.

---

## 3. Thiết lập Môi trường và Huấn luyện Model (Training)

**Cài đặt thư viện:**
Khởi tạo môi trường ảo Python và cài đặt các core packages:
```bash
pip install ultralytics opencv-python fastapi uvicorn python-multipart mysql-connector-python
```

**Huấn luyện Model (YOLOv8):**
Tôi ưu tiên dùng `yolov8n.pt` (bản Nano) để model nhẹ, nhận diện realtime nhanh, dễ dàng demo trên laptop cá nhân mà không cần GPU quá mạnh.
```python
from ultralytics import YOLO

# Load pre-trained model Nano
model = YOLO('yolov8n.pt')

# Train với dataset tự tạo
results = model.train(data='dataset/data.yaml', epochs=50, imgsz=640)

# Trọng số tốt nhất sẽ tự động lưu tại: runs/detect/train/weights/best.pt
```

---

## 4. Xây dựng Python API (Computer Vision Service)

Tôi sẽ viết một microservice bằng FastAPI để nhận ảnh, xử lý và bắt các trường hợp lỗi như (Ảnh mờ, Confidence thấp...):

```python
from fastapi import FastAPI, UploadFile, File, HTTPException
from ultralytics import YOLO
import cv2
import numpy as np
import mysql.connector

app = FastAPI()

# Load model đã train
try:
    model = YOLO('runs/detect/train/weights/best.pt')
except Exception:
    model = None # Xử lý lỗi nếu chưa train model

@app.post("/api/vision/detect")
async def detect_product(file: UploadFile = File(...)):
    if not model:
        raise HTTPException(status_code=500, detail="YOLO model không tồn tại. Vui lòng train model trước.")

    # 1. Validate file
    if file.content_type not in ["image/jpeg", "image/png"]:
        raise HTTPException(status_code=400, detail="Chỉ hỗ trợ file ảnh JPG/PNG")

    # 2. OpenCV Tiền xử lý
    contents = await file.read()
    if len(contents) > 5 * 1024 * 1024: # Giới hạn 5MB
        raise HTTPException(status_code=400, detail="File quá lớn (Tối đa 5MB)")
        
    nparr = np.frombuffer(contents, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    # 3. YOLOv8 Nhận diện
    results = model(img)
    detections = []
    
    for r in results:
        for box in r.boxes:
            conf = float(box.conf[0])
            if conf < 0.6: continue # Bỏ qua nếu độ tin cậy < 60%
            
            cls_id = int(box.cls[0])
            detections.append({
                "class": model.names[cls_id],
                "confidence": conf
            })
            
    if not detections:
        return {"error": "Không nhận diện được sản phẩm rõ ràng trong ảnh", "detections": []}

    # 4. Tìm sản phẩm tương tự trong MySQL
    # (Kết nối DB và SELECT * FROM products WHERE category LIKE ...)
    top_class = detections[0]['class']
    products = get_similar_products_from_mysql(top_class) # Hàm tự định nghĩa

    return {
        "detections": detections,
        "products": products
    }
```

---

## 5. Tích hợp Node.js và ReactJS

**Node.js (API Gateway):**
Mở Endpoint `POST /api/vision/detect`. Frontend sẽ không gọi thẳng sang Python (tránh lộ port nội bộ). Node.js sẽ nhận request, bóc tách file `multipart/form-data`, và dùng Axios bắn stream ảnh sang cổng của Python.

**ReactJS (Giao diện người dùng):**
- Thêm biểu tượng Camera 📷 cạnh ô Search Bar.
- Khi người dùng click, mở Modal "Tìm kiếm bằng hình ảnh".
- Hiển thị trạng thái "Đang phân tích..." khi call API.
- Render lỗi khéo léo bằng Toast (ví dụ: *"Ảnh quá mờ, vui lòng thử lại"*).
- Nếu nhận diện thành công, điều hướng đến trang kết quả tìm kiếm kèm theo danh sách `products` lấy được.

**Tổng kết:** Kiến trúc tách rời `vision-service` giúp hệ thống Node.js không bị treo (Block Event Loop) khi phải xử lý các ma trận ảnh nặng nề của OpenCV. Code được thiết kế tối giản, dễ hiểu và đảm bảo tính trực quan cao khi chạy Demo đồ án.
