# Báo cáo Giai đoạn 4: Xây dựng Frontend Client

## 1. Phân tích Yêu cầu và Hiện trạng

Dựa trên yêu cầu của Giai đoạn 4, tôi đã tiến hành phân tích các đầu việc cần thực hiện và đối chiếu với mã nguồn Frontend hiện tại. Toàn bộ mã nguồn cốt lõi đã được xây dựng và đáp ứng đầy đủ yêu cầu cho một Frontend bán hàng:

| Yêu cầu hệ thống | Trạng thái triển khai thực tế |
| :--- | :--- |
| **Công nghệ:** ReactJS, TS, Vite, Axios, Tailwind CSS | **Hoàn thành.** Đã setup dự án sử dụng Vite + React 19 + TypeScript + TailwindCSS v4. |
| **Giao diện cốt lõi:** Login, Register, Home, Product List, Detail, Cart, Checkout, Orders, Profile, Review | **Hoàn thành.** Đã xây dựng đầy đủ trong thư mục `src/pages/` và cấu hình route tại `src/App.tsx`. |
| **Protected Route & JWT:** Lưu JWT, chặn route khi chưa đăng nhập. | **Hoàn thành.** Triển khai Component `<ProtectedRoute />` và `<AuthProvider />` xử lý lưu trữ token an toàn. |
| **Hiển thị lỗi API & Loading state:** | **Hoàn thành.** Tích hợp `react-hot-toast` và thiết kế các UI loading state thân thiện với người dùng. |
| **Phạm vi module:** | **Đúng yêu cầu.** Tập trung 100% vào nghiệp vụ E-commerce cơ bản, chưa tích hợp AI Chatbot / YOLOv8 / Recommendation System. |

**Kết luận phân tích:** Toàn bộ khung giao diện bán hàng Frontend Client đã được triển khai đầy đủ tính năng, code TypeScript rõ ràng, có tái sử dụng Component và đã sẵn sàng để hoạt động.

---

## 2. Cấu trúc thư mục

Dự án Frontend được tổ chức theo kiến trúc chuẩn, giúp dễ dàng mở rộng và bảo trì:

```text
frontend/
├── .env                 # Cấu hình biến môi trường (API URL)
├── package.json         # Danh sách thư viện (react, axios, react-router-dom...)
├── vite.config.ts       # Cấu hình Vite builder
└── src/
    ├── assets/          # Tài nguyên tĩnh (Hình ảnh, icon...)
    ├── components/      # Các UI component dùng chung (Button, Input, ProtectedRoute...)
    ├── context/         # Quản lý State toàn cục (AuthContext, CartContext)
    ├── hooks/           # Các custom hooks (useDebounce, useAuth...)
    ├── layouts/         # Layout cho Customer (MainLayout) và Admin (AdminLayout)
    ├── pages/           # Các View/Trang cụ thể (Home, Login, ProductDetail, Cart...)
    ├── services/        # Lớp giao tiếp API gọi lên Backend (axios instances)
    ├── types/           # Định nghĩa TypeScript Interface cho các Model dữ liệu
    ├── utils/           # Các hàm tiện ích (format tiền tệ, format ngày tháng...)
    ├── App.tsx          # Cấu hình React Router tổng của ứng dụng
    └── main.tsx         # Entry point mount React vào DOM
```

---

## 3. Cách cấu hình API URL

Frontend kết nối với Backend thông qua biến môi trường. File `.env` đã được tạo ở thư mục gốc của `frontend/` và cấu hình để trỏ tới địa chỉ của Backend API:

```env
VITE_API_URL=http://localhost:5000/api
```
*(Nếu Backend được deploy lên server khác, chỉ cần cập nhật lại giá trị biến này).*

---

## 4. Hướng dẫn Cài đặt & Chạy ứng dụng

Để khởi chạy dự án Frontend ở môi trường phát triển (Local), thực hiện các bước sau:

**Bước 1: Cài đặt dependencies**
Mở Terminal, di chuyển vào thư mục `frontend` và cài đặt các thư viện cần thiết:
```bash
cd frontend
npm install
```

**Bước 2: Khởi động Development Server**
Chạy lệnh sau để khởi động Frontend:
```bash
npm run dev
```
Giao diện web sẽ được chạy tại địa chỉ mặc định: **http://localhost:5173** (đảm bảo Backend cũng đang chạy song song ở port 5000 để các API lấy được dữ liệu).

**Bước 3 (Triển khai Production):**
Để build ứng dụng thành các file tĩnh chuẩn bị cho việc deploy lên server:
```bash
npm run build
npm run preview
```

---

**Tổng kết:** Giai đoạn 4 đã hoàn thiện toàn bộ luồng nghiệp vụ Frontend cho ứng dụng Bán hàng (từ đăng ký/đăng nhập, xem sản phẩm, giỏ hàng, đến đặt hàng và quản trị). Hệ thống đã sẵn sàng để chuyển sang các bước tích hợp AI phức tạp hơn.
