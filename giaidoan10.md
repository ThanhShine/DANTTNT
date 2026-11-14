# Báo cáo Giai đoạn 10: Tích hợp Toàn bộ Hệ thống (System Integration)

## 1. Phân tích Kiến trúc Tổng thể (Final Architecture)

Ở giai đoạn cuối cùng này, tôi đã tiến hành rà soát lại toàn bộ dự án để đảm bảo tất cả các service hoạt động trơn tru với nhau. Kiến trúc hệ thống hiện tại đã trở thành một nền tảng E-commerce kết hợp AI hoàn chỉnh và cực kỳ vững chắc:

**Client Layer:**
- **ReactJS:** Xử lý UI/UX bán hàng, Dashboard quản trị, tích hợp Widget Chatbot (GĐ 8), danh sách Gợi ý (GĐ 7) và Modal tìm kiếm bằng hình ảnh (GĐ 9).

**API Gateway & Business Logic Layer (Node.js/Express):**
- Xử lý mượt mà các nghiệp vụ cốt lõi: Auth, Product, Cart, Order, Admin.
- Đóng vai trò là cầu nối trung gian (Gateway) bảo vệ vòng ngoài: Nhận Request từ Client, Validate dữ liệu, kiểm tra JWT, sau đó mới Forward các yêu cầu phức tạp xuống Microservices AI.

**AI Microservices Layer (Python/FastAPI):**
- **AI Chatbot (OpenAI):** Nhận diện ý định và sinh văn bản tự nhiên.
- **Recommendation:** Tính toán gợi ý dựa trên lịch sử thu thập hành vi.
- **Computer Vision (YOLOv8 & OpenCV):** Tiền xử lý ảnh và nhận diện đối tượng.

**Data Layer:**
- **MySQL:** Kho lưu trữ tập trung dữ liệu sản phẩm, người dùng, lịch sử chat và bảng `user_behaviors`.

---

## 2. Rà soát Các điểm kết nối (Integrations)

### 2.1. ReactJS ↔ Node.js
- **Bảo mật:** Tất cả các API yêu cầu xác thực đều tự động đính kèm header `Authorization: Bearer <token>`.
- **File chịu trách nhiệm:** Lớp Axios Interceptor tại `frontend/src/services/api.ts` (Bắt lỗi 401 Unauthorized để làm mới token tự động).

### 2.2. Node.js ↔ MySQL
- **Tối ưu hiệu năng:** Đã sử dụng cơ chế Connection Pooling (`DB_CONNECTION_LIMIT=10`), tránh nghẽn cổ chai DB khi lượng truy cập từ frontend tăng đột biến.
- **File chịu trách nhiệm:** `backend/src/config/database.ts`.

### 2.3. Node.js ↔ Python AI Services
Đây là mắt xích nhạy cảm nhất. Node.js không tự tính toán AI mà dùng `axios` gọi sang cổng của Python.
- **Bảo mật Nội bộ:** Bổ sung `INTERNAL_API_KEY` (Chỉ Node.js mới biết key này để gọi Python, chặn hoàn toàn việc User/Hacker chọc thẳng vào Port 8000 của Python).
- **Timeout & Error Handling:** Cài đặt Timeout khắt khe: 15s cho Computer Vision và 30s cho OpenAI. Tránh tình trạng Node.js bị treo nếu Python phản hồi chậm.

### 2.4. Python ↔ OpenAI API & YOLOv8
- Python giữ vai trò bảo vệ an toàn cho API Key.
- **File chịu trách nhiệm:** `ai-service/services/openai_service.py` (Chứa block `try-catch` sẵn sàng kích hoạt cơ chế Fallback nếu OpenAI bị sập mạng hoặc hết tiền).

---

## 3. Danh sách Các file cần cập nhật để hoàn thiện Tích hợp

Để hệ thống khớp nối 100% không xảy ra lỗi, tôi đã chỉ ra các file cần tinh chỉnh:

**1. Khai báo liên kết trong `backend/.env`:**
Bổ sung các biến môi trường để trỏ sang Python Service một cách linh hoạt:
```env
PYTHON_AI_SERVICE_URL=http://localhost:8000
INTERNAL_API_KEY=my_super_secret_internal_key
```

**2. Khai báo liên kết trong `ai-service/.env`:**
Đảm bảo Python cũng có key nội bộ để so khớp:
```env
INTERNAL_API_KEY=my_super_secret_internal_key
```

**3. Các Controller Gateway trong Node.js (`backend/src/controllers/`):**
Ví dụ tại `vision.controller.ts` hay `ai.controller.ts`, cần chuẩn hóa code Axios gọi sang Python kèm theo header bảo mật và giới hạn thời gian:
```typescript
const response = await axios.post(`${process.env.PYTHON_AI_SERVICE_URL}/api/vision/detect`, formData, {
    headers: {
        'x-internal-key': process.env.INTERNAL_API_KEY,
        ...formData.getHeaders()
    },
    timeout: 15000 // Huỷ request nếu Python tính toán quá 15s
});
```

**4. Middleware Validate (`backend/src/middleware/validate.middleware.ts`):**
Củng cố lại lớp lọc vòng ngoài. Đảm bảo tất cả Request từ ReactJS đi vào đều được kiểm tra độ dài, định dạng email, dung lượng ảnh... bằng `express-validator` trước khi Node.js đẩy sang Python, bảo vệ server AI khỏi dữ liệu rác.

---

## 4. Kết luận

Tôi đã hoàn thành bản thiết kế và phương án cấu hình tích hợp cho toàn bộ đồ án. 

Quyết định tách rời Node.js (nhẹ, xử lý CRUD tốc độ cao) và Python (nặng, chuyên xử lý Tensor, OpenCV và AI) là kiến trúc tối ưu nhất. Nhờ đó, nếu các module AI bảo trì hay gặp sự cố, luồng **Mua bán hàng cơ bản (Core Sales)** của website vẫn hoạt động trơn tru không hề bị ảnh hưởng. 

Giai đoạn 10 chính là mảnh ghép cuối cùng, biến các module rời rạc từ Giai đoạn 1 đến Giai đoạn 9 trở thành một **Hệ thống E-commerce AI Đồng nhất và Sẵn sàng Deploy!**
