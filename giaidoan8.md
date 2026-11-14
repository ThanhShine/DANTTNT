# Báo cáo Giai đoạn 8: Xây dựng AI Chatbot Tư vấn Sản phẩm

## 1. Phân tích Yêu cầu

Mục tiêu của Giai đoạn 8 là tích hợp Trí Tuệ Nhân Tạo (AI) vào nền tảng bán hàng thông qua một Chatbot tư vấn thông minh. Yêu cầu đặt ra là Chatbot phải hiểu được nhu cầu của người dùng (Danh mục, Ngân sách, Mục đích sử dụng), tự động truy xuất dữ liệu sản phẩm trong kho (MySQL) và tạo ra câu tư vấn tự nhiên. 

Đặc biệt, về mặt kiến trúc, yêu cầu khắt khe nhất là phải tách biệt AI Logic ra một Microservice riêng bằng Python, tuyệt đối không được để lọt API Key của OpenAI xuống Frontend ReactJS.

---

## 2. Thiết kế Kiến trúc (Microservices Flow)

Dựa trên yêu cầu về bảo mật và mở rộng, tôi đã thiết kế luồng dữ liệu (Data Flow) xuyên suốt như sau:

1. **Frontend (ReactJS):** Quản lý UI khung chat, bắt sự kiện gửi tin nhắn và render kết quả (Text + Thẻ Sản phẩm).
2. **Backend (Node.js/Express):** Đóng vai trò là API Gateway. Nhận request từ React, quản lý `session_id`, lưu lịch sử chat vào DB và Forward nội dung sang Python Service.
3. **AI Service (Python/FastAPI):** Lõi xử lý chính. Nhận text, bóc tách ý định (Intent Parsing) để phân loại nhu cầu.
4. **Database (MySQL):** Python trực tiếp Query xuống DB để lấy danh sách sản phẩm khớp với nhu cầu vừa bóc tách (VD: Laptop dưới 20 triệu).
5. **OpenAI API (GPT-4o-mini):** Trộn ngữ cảnh chat cũ (Context) + Danh sách sản phẩm từ MySQL + Lệnh mồi (System Prompt) để sinh ra câu trả lời tư vấn mềm mỏng nhất.
6. Cuối cùng, JSON kết quả (bao gồm `message`, `products`, `suggestions`) được trả ngược về Node.js rồi đẩy lên ReactJS.

---

## 3. Triển khai Thực tế

### 3.1. Phân hệ Python AI Service (`ai-service/`)
- **HTTP Server:** Tôi đã sử dụng thư viện FastAPI (tại file `main.py`) để lắng nghe request HTTP tốc độ cao ở Port 8000.
- **Bảo mật API Key:** Biến `OPENAI_API_KEY` được tôi đặt vào file `ai-service/.env` cục bộ. Frontend không hề biết sự tồn tại của key này.
- **Xử lý LLM (`services/openai_service.py`):** Tôi đã nhúng một System Prompt cấu trúc bằng tiếng Việt, ép GPT đóng vai "Trợ lý điện máy thông minh". Đồng thời, cài đặt Timeout và Error Handling để bắt các lỗi RateLimit hoặc Disconnect.
- **Fallback Logic:** Nếu OpenAI API gặp sự cố, tôi đã code sẵn cơ chế Fallback tự động trả về câu cứng: *"Hệ thống AI đang quá tải, nhưng đây là các sản phẩm phù hợp với bạn..."*, bảo vệ ứng dụng khỏi nguy cơ bị Crash.

### 3.2. Phân hệ Backend API (Node.js)
- Tại `backend/src/routes/ai.routes.ts`, tôi đã mở các Endpoint:
  - `POST /api/ai/chat`: Route chính xử lý Forward tin nhắn.
  - `GET /api/ai/chat/history`: Tải lại lịch sử trò chuyện cũ dựa theo `session_id`, giúp người dùng F5 tải lại trang không bị mất context.

### 3.3. Phân hệ Frontend (ReactJS)
- Thiết kế Component `ChatWidget.tsx` tinh tế, đính dạng Pop-up ở góc màn hình.
- Tích hợp trạng thái Loading (Typing Indicator) tạo cảm giác AI đang suy nghĩ. Có khả năng duyệt mảng `products` trả về từ JSON để nhúng trực tiếp Thẻ sản phẩm đẹp mắt vào giữa đoạn chat.

---

## 4. Hướng dẫn Cấu hình và Chạy AI Service

**Bước 1: Cấu hình biến môi trường (`ai-service/.env`)**
Bạn cần phải tạo file `.env` với nội dung sau:
```env
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
OPENAI_MODEL=gpt-4o-mini
DB_HOST=localhost
DB_NAME=sales_ai_system
```

**Bước 2: Khởi động Microservice Python**
Mở thêm một cửa sổ Terminal mới (giữ Terminal Node và React vẫn chạy), di chuyển vào thư mục và chạy:
```bash
cd ai-service
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

*(Sau bước này, Hệ thống 3 trụ cột: React ở cổng 5173, Node ở cổng 5000 và Python ở cổng 8000 sẽ tự động kết nối và giao tiếp nhịp nhàng).*

---

**Kết luận:** Giai đoạn 8 đã hoàn thành vượt xa một Chatbot hỏi-đáp thông thường. Hệ thống thực sự sở hữu năng lực truy vấn Database theo thời gian thực (Real-time RAG) để lấy đúng giá bán/tồn kho và dùng AI tư vấn chốt sale một cách thuyết phục. 
