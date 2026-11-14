# Giai đoạn 3: Xây dựng Backend REST API

## 1. Lệnh cài đặt

Hệ thống được thiết kế hoàn chỉnh bằng Node.js và TypeScript. Để bắt đầu, bạn thực hiện các lệnh sau:

```bash
# Di chuyển vào thư mục backend
cd backend

# Cài đặt toàn bộ dependencies (Express, MySQL2, JWT, Bcrypt, Typescript...)
npm install
```

## 2. Cấu trúc thư mục

Dự án tuân thủ chặt chẽ cấu trúc được đề xuất, giúp dễ dàng mở rộng và bảo trì:

```text
backend/
├── src/
│   ├── config/          # Cấu hình Database, CORS, JWT
│   ├── controllers/     # Xử lý logic của từng API (Auth, User, Product...)
│   ├── middleware/      # Middleware bảo mật, xác thực JWT, Validate, Error Handler
│   ├── routes/          # Khai báo các endpoints (router)
│   ├── types/           # Định nghĩa các type/interface TypeScript
│   ├── utils/           # Các hàm helper hỗ trợ (response handler)
│   ├── app.ts           # Khởi tạo Express app, gắn middlewares và routes
│   └── server.ts        # Entry point để chạy HTTP server
├── .env.example         # File mẫu chứa các biến môi trường
├── package.json         # Khai báo thư viện và scripts
└── tsconfig.json        # Cấu hình trình biên dịch TypeScript
```

## 3. Toàn bộ code cần thiết

Toàn bộ mã nguồn đã được tạo đầy đủ và chạy thành công trong thư mục `backend/`. Bạn có thể tham khảo trực tiếp một số file cốt lõi:
- **Khởi tạo App & Routes:** [backend/src/app.ts](file:///c:/Users/shine/OneDrive/Desktop/Trí tuệ nhân tạo/backend/src/app.ts)
- **Kết nối MySQL:** [backend/src/config/database.ts](file:///c:/Users/shine/OneDrive/Desktop/Trí tuệ nhân tạo/backend/src/config/database.ts)
- **Controller Xác thực (Auth):** [backend/src/controllers/auth.controller.ts](file:///c:/Users/shine/OneDrive/Desktop/Trí tuệ nhân tạo/backend/src/controllers/auth.controller.ts)
- **Middleware JWT (Role-base):** [backend/src/middleware/auth.middleware.ts](file:///c:/Users/shine/OneDrive/Desktop/Trí tuệ nhân tạo/backend/src/middleware/auth.middleware.ts)

Tất cả Controller và Route cho Users, Categories, Products, Carts, Orders, Reviews, Behaviors đều đã được viết hoàn thiện và validate dữ liệu.

## 4. File `.env.example`

Dưới đây là cấu hình biến môi trường.

```env
# Server
NODE_ENV=development
PORT=5000

# Database MySQL
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=sales_ai_system
DB_CONNECTION_LIMIT=10

# JWT
JWT_SECRET=your_super_secret_jwt_key_min_32_chars_here
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=your_refresh_token_secret_key_here
JWT_REFRESH_EXPIRES_IN=30d

# bcrypt
BCRYPT_ROUNDS=12

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## 5. Cách chạy Backend

```bash
# Trong thư mục backend/
npm run dev
```
> Server sẽ chạy tại: **http://localhost:5000**

Nếu muốn build ra code Production (JavaScript thuần) và chạy:
```bash
npm run build
npm start
```

## 6. Danh sách API để test bằng Postman

Mọi API trả về JSON chuẩn xác, kiểm soát lỗi và bắt HTTP Status Codes chuẩn (200, 201, 400, 401, 403, 404, 500).

### Xác thực & Người dùng (AUTH & USER)
- `POST /api/auth/register` : Đăng ký tài khoản (Tự động hash bcrypt)
- `POST /api/auth/login` : Đăng nhập & Lấy Access Token (JWT)
- `GET /api/auth/profile` : Lấy thông tin user hiện tại *(Yêu cầu Token)*
- `GET /api/users` : Lấy danh sách users *(Admin Only)*
- `GET /api/users/:id` : Chi tiết 1 user
- `PUT /api/users/:id` : Cập nhật thông tin user
- `DELETE /api/users/:id` : Xóa user *(Admin Only)*

### Sản phẩm & Danh mục (PRODUCT & CATEGORY)
- `GET /api/categories` : Lấy toàn bộ danh mục
- `POST /api/categories` : Tạo danh mục mới *(Admin Only)*
- `PUT /api/categories/:id` : Cập nhật danh mục *(Admin Only)*
- `DELETE /api/categories/:id` : Xóa danh mục *(Admin Only)*

- `GET /api/products` : Lấy danh sách sản phẩm (có filter/phân trang)
- `GET /api/products/:id` : Lấy chi tiết sản phẩm
- `POST /api/products` : Thêm mới sản phẩm *(Admin Only)*
- `PUT /api/products/:id` : Sửa sản phẩm *(Admin Only)*
- `DELETE /api/products/:id` : Xóa sản phẩm *(Admin Only)*

### Giỏ hàng & Đơn hàng (CART & ORDER)
- `GET /api/cart` : Lấy giỏ hàng *(Yêu cầu Token)*
- `POST /api/cart` : Thêm sản phẩm vào giỏ hàng
- `PUT /api/cart/:itemId` : Cập nhật số lượng
- `DELETE /api/cart/:itemId` : Xóa 1 sản phẩm khỏi giỏ

- `POST /api/orders` : Tạo đơn hàng mới từ giỏ hàng *(Yêu cầu Token)*
- `GET /api/orders` : Lấy danh sách đơn hàng của user đó
- `GET /api/orders/:id` : Chi tiết đơn hàng
- `PUT /api/orders/:id/status` : Cập nhật trạng thái (PROCESSING, SHIPPED...) *(Admin Only)*

### Đánh giá & Hành vi AI (REVIEW & USER BEHAVIOR)
- `GET /api/reviews/product/:productId` : Xem toàn bộ đánh giá 1 sản phẩm
- `POST /api/reviews` : Đăng đánh giá sao và comment *(Yêu cầu Token)*
- `DELETE /api/reviews/:id` : Xóa review

- `GET /api/behaviors` : Lấy toàn bộ log lịch sử hành vi *(Admin Only)*
- `POST /api/behaviors` : Bắn sự kiện tracking (VIEW, CLICK, ADD_TO_CART) vào DB. *(Phục vụ cho Giai đoạn Recommendation System sau này)*
