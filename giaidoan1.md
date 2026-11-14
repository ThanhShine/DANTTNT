# GIAI ĐOẠN 1: PHÂN TÍCH VÀ THIẾT KẾ HỆ THỐNG

**Dự án:** XÂY DỰNG HỆ THỐNG BÁN HÀNG CLIENT–SERVER TÍCH HỢP AI CHATBOT TƯ VẤN SẢN PHẨM VÀ HỆ THỐNG GỢI Ý SẢN PHẨM

Dưới đây là bản phân tích và thiết kế chi tiết cho dự án dựa trên các công nghệ yêu cầu (ReactJS, Node.js, Python, YOLOv8, MySQL).

---

## 1. Phân tích bài toán thực tế
Trong môi trường thương mại điện tử hiện nay, ngoài việc cung cấp hàng hóa, trải nghiệm người dùng đóng vai trò quyết định. Các vấn đề thường gặp của người dùng:
- Khó khăn trong việc tìm kiếm đúng sản phẩm mong muốn giữa hàng ngàn sản phẩm.
- Có nhu cầu tìm sản phẩm bằng hình ảnh (thấy ở ngoài đời hoặc trên mạng) nhưng hệ thống chỉ hỗ trợ tìm bằng văn bản.
- Cần được tư vấn ngay lập tức về thông tin, cấu hình, chính sách đổi trả của sản phẩm mà không muốn phải đợi nhân viên hỗ trợ.
**Giải pháp:** Xây dựng hệ thống TMĐT thông minh tích hợp **AI Chatbot** (hỗ trợ giải đáp tự động bằng NLP) và **Computer Vision** (tìm kiếm sản phẩm qua ảnh), đồng thời có hệ thống **Gợi ý** (Recommend) để upsell và cross-sell hiệu quả.

## 2. Xác định Actor
- **Customer (Khách hàng):** Người sử dụng hệ thống frontend để tìm kiếm, mua sắm và tương tác với AI.
- **Admin (Quản trị viên):** Người sử dụng hệ thống quản trị (Dashboard) để quản lý toàn bộ dữ liệu (Sản phẩm, Đơn hàng, Người dùng).
- **Hệ thống (System/Background Services):** Các dịch vụ ngầm xử lý phân tích hình ảnh, sinh câu trả lời chat và tính toán gợi ý.

## 3. Xác định chức năng của Customer
- Đăng ký / Đăng nhập (Auth).
- Xem danh sách sản phẩm, lọc theo danh mục, giá, tìm kiếm bằng text.
- **Tìm kiếm sản phẩm bằng hình ảnh (Visual Search).**
- Xem chi tiết sản phẩm, đánh giá (Rating & Review).
- **Trò chuyện với AI Chatbot** để hỏi đáp về sản phẩm và chính sách.
- Nhận danh sách **Sản phẩm gợi ý** tại trang chủ hoặc trang chi tiết sản phẩm.
- Thêm sản phẩm vào giỏ hàng, quản lý giỏ.
- Tiến hành đặt hàng (Checkout) và theo dõi trạng thái đơn hàng.

## 4. Xác định chức năng của Admin
- Đăng nhập (phân quyền Admin).
- Xem Dashboard thống kê (Doanh thu, Đơn hàng mới, Sản phẩm bán chạy).
- Quản lý Sản phẩm (Thêm, Sửa, Xóa, Ẩn/Hiện, Quản lý kho, Tải ảnh sản phẩm).
- Quản lý Danh mục sản phẩm (Categories).
- Quản lý Đơn hàng (Cập nhật trạng thái: Chờ xử lý -> Đang giao -> Đã giao / Hủy).
- Quản lý Người dùng (Xem danh sách, Khóa tài khoản).

## 5. Xác định các chức năng AI (OpenAI API)
- **Tư vấn tự động (AI Chatbot):** Đóng vai trò như một nhân viên Sale. Chatbot sẽ được cung cấp context (ngữ cảnh) về thông tin sản phẩm từ Database để trả lời các câu hỏi cụ thể của khách hàng.
- **Phân loại ý định (Intent Recognition):** AI hiểu được khách hàng đang muốn tìm sản phẩm, hỏi về chính sách hay phàn nàn, từ đó điều hướng phù hợp.
- **Trích xuất thông tin (Information Extraction):** Lấy ra các key metrics (màu sắc, kích cỡ, mức giá) từ câu chat của user để tự động gọi API tìm kiếm.

## 6. Xác định chức năng Computer Vision (YOLOv8 + OpenCV)
- **Nhận diện đối tượng (Object Detection):** Nhận diện xem trong bức ảnh upload có những loại sản phẩm nào (ví dụ: áo thun, quần jean, túi xách) bằng mô hình YOLOv8.
- **Trích xuất đặc trưng (Feature Extraction):** Dùng một mạng CNN hoặc hàm của OpenCV để trích xuất vector đặc trưng của sản phẩm trong ảnh.
- **Tìm kiếm tương đồng (Similarity Search):** So sánh vector hình ảnh của khách tải lên với cơ sở dữ liệu ảnh sản phẩm của hệ thống để trả ra các sản phẩm giống hoặc tương tự nhất.

## 7. Xác định chức năng Recommendation System
- **Content-Based Filtering:** Gợi ý các sản phẩm có cùng thuộc tính (cùng danh mục, mức giá, thương hiệu) với sản phẩm mà người dùng đang xem.
- **Collaborative Filtering:** Dựa vào lịch sử mua hàng, gợi ý cho người dùng những sản phẩm mà những người dùng khác có cùng sở thích đã mua.
- **Popularity-Based:** Gợi ý các sản phẩm đang có lượt xem và lượt mua cao nhất hệ thống.

## 8. Đề xuất kiến trúc Client–Server
Sử dụng kiến trúc Client-Server với hệ thống Backend được chia làm 2 cụm nhỏ (Microservices nhẹ):
- **Client Side (SPA):** Giao diện web chạy trên trình duyệt của người dùng.
- **Main Server (Node.js API):** Xử lý toàn bộ logic nghiệp vụ (CRUD, xác thực, thanh toán, gọi Database).
- **AI Server (Python API):** Đứng độc lập, chuyên nhận request từ Node.js để chạy Model YOLO, xử lý tính toán Recommender System và giao tiếp với OpenAI, sau đó trả kết quả về cho Node.js.

## 9. Đề xuất kiến trúc ReactJS → Node.js → MySQL
- **ReactJS (TypeScript):** Xây dựng các component UI, quản lý state bằng Redux hoặc Context API. Giao tiếp với Backend qua RESTful API bằng thư viện `axios`.
- **Node.js (Express.js):** 
  - Tiếp nhận HTTP Request.
  - Sử dụng JWT để Authentication.
  - Sử dụng ORM (như Sequelize hoặc TypeORM) để mapping dữ liệu Object thành các câu lệnh SQL.
- **MySQL:** Lưu trữ dữ liệu cấu trúc có quan hệ chặt chẽ (Users, Orders, Products, Cart...).

## 10. Đề xuất kiến trúc Node.js → Python AI Service
Node.js sẽ đóng vai trò như một **API Gateway/Proxy** cho Python Service:
1. ReactJS gửi yêu cầu AI (Upload ảnh hoặc Chat text) lên Node.js.
2. Node.js nhận file ảnh, lưu tạm thời (hoặc upload lên Cloud Storage) và lấy URL.
3. Node.js dùng `axios` tạo một HTTP Request nội bộ (Internal Call) gửi sang Python Service (Flask/FastAPI) chứa URL ảnh hoặc Text cần phân tích.
4. Python xử lý xong, trả về JSON data (vd: mảng Product_ID tương ứng).
5. Node.js dùng mảng ID đó query vào MySQL để lấy chi tiết sản phẩm, sau đó trả Response cuối cùng về cho ReactJS.

## 11. Mô tả luồng dữ liệu
- **Luồng mua hàng chuẩn:** Customer -> Tương tác ReactJS -> Bấm Đặt hàng -> Gửi JSON Payload đến Node.js -> Lưu vào MySQL -> Phản hồi thành công.
- **Luồng Chatbot:** Customer nhập tin nhắn -> ReactJS -> Node.js -> Chuyển tiếp tin nhắn + Context tới Python Service -> Python gọi OpenAI API -> Trả kết quả chữ về Python -> Trả về Node.js -> Trả về ReactJS hiển thị.
- **Luồng Visual Search:** Customer tải ảnh lên -> ReactJS post form-data -> Node.js lưu ảnh -> Chuyển đường dẫn ảnh tới Python Service -> Chạy YOLOv8 detect -> Extract feature vector -> So sánh độ tương đồng FAISS/Cosine -> Trả về top N IDs -> Node.js query MySQL lấy info -> ReactJS hiển thị danh sách.

## 12. Liệt kê tất cả module của hệ thống
**A. Client Application (ReactJS)**
- Auth Module (Đăng nhập, Đăng ký).
- E-commerce Module (Trang chủ, Lọc sản phẩm, Chi tiết sản phẩm).
- Cart & Checkout Module.
- Smart Search Module (Văn bản & Camera/Hình ảnh).
- AI Chat Widget Module (Cửa sổ chat góc màn hình).
- User Profile & Order Tracking Module.

**B. Admin Dashboard (ReactJS)**
- Dashboard Analytics Module.
- Product Management Module.
- Order Management Module.

**C. Main Backend System (Node.js)**
- Auth & Security Controller.
- Product Controller.
- Order & Cart Controller.
- Upload/Media Controller.
- AI Gateway Service (Proxy).

**D. AI & CV System (Python)**
- YOLOv8 Inference Controller.
- Recommender Engine Controller.
- OpenAI Chatbot Controller.

## 13. Đề xuất cấu trúc thư mục tổng thể của project
```text
project-root/
│
├── frontend/                     # ReactJS + TypeScript (Vite)
│   ├── public/
│   ├── src/
│   │   ├── assets/               # Hình ảnh tĩnh, icons
│   │   ├── components/           # Components dùng chung (Button, Card, Modal)
│   │   ├── features/             # Logic và UI gom theo tính năng (Cart, Chatbot, VisualSearch)
│   │   ├── pages/                # Các trang route chính (Home, ProductDetail, Admin...)
│   │   ├── services/             # Cấu hình gọi API (api.ts, productApi.ts)
│   │   ├── store/                # Redux store / Context
│   │   └── utils/
│   └── package.json
│
├── backend/                      # Node.js + Express.js
│   ├── src/
│   │   ├── config/               # Biến môi trường, cấu hình MySQL
│   │   ├── controllers/          # Nhận request, xử lý, trả response
│   │   ├── middlewares/          # Auth JWT, Multer (xử lý upload)
│   │   ├── models/               # Khai báo schema/entity cơ sở dữ liệu
│   │   ├── routes/               # Khai báo các endpoints API
│   │   └── services/             # Chứa logic nghiệp vụ phức tạp
│   └── package.json
│
├── ai_service/                   # Python (FastAPI / Flask)
│   ├── models/                   # Chứa file weights đã train (yolov8.pt)
│   ├── services/                 # yolo_service.py, openai_service.py, recommender.py
│   ├── main.py                   # Điểm khởi chạy server
│   └── requirements.txt
│
└── database/
    └── init_schema.sql           # File script tạo bảng SQL ban đầu
```

## 14. Đề xuất các API cần xây dựng
*Lưu ý: Các API này do Node.js cung cấp cho Frontend.*

**Authentication & Users**
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/users/profile`

**Products & Categories**
- `GET /api/products` (Hỗ trợ query: `?category=..&price=..&sort=..`)
- `GET /api/products/:id`
- `POST/PUT/DELETE /api/products` (Chỉ Admin)

**Cart & Orders**
- `GET /api/cart`
- `POST /api/cart/add`
- `POST /api/orders/checkout`
- `GET /api/orders/me` (Lấy đơn hàng cá nhân)

**AI & Smart Features (Node.js proxy sang Python)**
- `POST /api/ai/chat` (Gửi tin nhắn lấy tư vấn)
- `POST /api/ai/visual-search` (Gửi ảnh `multipart/form-data`)
- `GET /api/ai/recommendations/:userId` (Lấy danh sách sản phẩm gợi ý)

## 15. Đề xuất các bảng Database cần có (MySQL)
Để đảm bảo hiệu năng và tính toàn vẹn dữ liệu, các bảng cốt lõi gồm:
1. **`users`**: id, name, email, password_hash, role (admin/customer), created_at.
2. **`categories`**: id, name, description, parent_id.
3. **`products`**: id, category_id, name, description, price, stock, image_url, created_at.
4. **`product_images`**: id, product_id, image_url (Cho phép 1 sản phẩm có nhiều ảnh).
5. **`orders`**: id, user_id, total_price, status (pending, shipping, done...), address, created_at.
6. **`order_items`**: id, order_id, product_id, quantity, price (Lưu lại giá tại thời điểm mua).
7. **`cart`** & **`cart_items`**: Lưu trữ giỏ hàng hiện tại của người dùng.
8. **`reviews`**: id, user_id, product_id, rating (1-5), comment.
9. **`product_features`** *(Bảng hỗ trợ AI)*: id, product_id, feature_vector (Lưu trữ ma trận đặc trưng của ảnh dưới dạng JSON hoặc Blob để so sánh trong thuật toán Visual Search).
