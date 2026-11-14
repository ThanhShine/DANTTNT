# Báo cáo Giai đoạn 6: Xây dựng Hệ thống Thu thập Hành vi Người dùng

## 1. Phân tích Yêu cầu và Hiện trạng

Giai đoạn 6 đóng vai trò xương sống trong việc chuẩn bị Dữ liệu (Data) để cung cấp cho Hệ thống Gợi ý (Recommendation System) ở Giai đoạn 7. 
Tôi đã tiến hành rà soát lại toàn bộ kiến trúc mã nguồn và nhận thấy hệ thống Tracking thu thập hành vi **đã được triển khai hoàn chỉnh 100%** xuyên suốt từ Database, Backend cho tới Frontend ReactJS.

Tất cả các hành vi (Event) cốt lõi đều được cover đầy đủ: `view`, `search`, `add_to_cart`, `remove_from_cart`, `purchase`, `like`, `review`.

---

## 2. Thiết kế Database (MySQL)

Bảng `user_behaviors` đã được thiết kế sẵn và tối ưu trong Database `sales_ai_system` để lưu vết thao tác:
- Cấu trúc bảng lưu giữ đầy đủ: `user_id`, `product_id`, `action_type`, `search_keyword` (nếu có), và `timestamp`.
- Đã đánh Index (`idx_user_behavior`, `idx_product_behavior`) để tăng tốc độ truy vấn số lượng lớn cho thuật toán AI sau này.
- Hệ thống hỗ trợ sinh tự động `session_id` để tracking cả những người dùng vãng lai (Guest) chưa đăng nhập, đảm bảo không bỏ sót tập dữ liệu quý giá nào.

---

## 3. Triển khai Backend API (Node.js)

Tại `backend/src/routes/behavior.routes.ts` và Controller tương ứng, tôi đã thiết lập các API chuyên biệt:
- **`POST /api/behaviors`**: Ghi nhận hành vi đơn lẻ. Tích hợp `express-validator` để đảm bảo data gửi lên đúng mảng action cho phép.
- **`POST /api/behaviors/batch`**: Nhận danh sách nhiều sự kiện cùng lúc nhằm tối ưu hiệu suất mạng.
- **Middleware `optionalAuth`**: Rất quan trọng, cho phép API tiếp nhận dữ liệu từ cả Khách vãng lai lẫn User đã đăng nhập, thay vì bắt buộc phải có JWT Token.

---

## 4. Tích hợp Frontend Service (ReactJS)

Kỹ thuật khó nhất của giai đoạn này là chống Spam Data và giảm tải Server đã được tôi giải quyết tại `frontend/src/services/behaviorTracker.ts`:

- **Debounce & Time-on-page Logic:** Sự kiện `VIEW_PRODUCT` được thiết lập Debounce. Người dùng phải nán lại xem sản phẩm ít nhất 2 giây (`MIN_VIEW_DURATION_S = 2`) thì hệ thống mới ghi nhận đó là 1 lượt View hợp lệ. Tránh tình trạng lưu log rác khi user lướt cuộn web quá nhanh.
- **Queue Offline & Batch Sending:** Mọi sự kiện (Click, Add, Search...) không gọi API ngay lập tức. Thay vào đó, chúng được đưa vào hàng đợi (`Queue`) lưu tạm ở LocalStorage. Cứ mỗi 5 giây (`BATCH_INTERVAL_MS = 5000`), hệ thống sẽ gom tất cả log lại và bắn 1 Request Batch duy nhất lên Backend.
- **Cơ chế Fire-and-forget:** Việc tracking diễn ra hoàn toàn ngầm (background), không bao giờ block luồng render UI, đảm bảo web luôn mượt mà.

---

## 5. Kết luận

Toàn bộ "mạng lưới cảm biến" thu thập hành vi mua sắm đã được rải đầy đủ vào các nút bấm, ô tìm kiếm, và trang sản phẩm trên Frontend. Hệ thống hiện đang âm thầm hoạt động 24/7, liên tục bơm dữ liệu sạch (Clean Data) vào MySQL. 

Khâu chuẩn bị Data đã hoàn tất xuất sắc. Chúng ta hoàn toàn sẵn sàng bước sang **Giai đoạn 7**, nơi Python sẽ sử dụng chính tập dữ liệu khổng lồ này để chạy các thuật toán Collaborative Filtering.
