#  Giai đoạn 7: Xây dựng Hệ thống Gợi ý Sản phẩm (Recommendation System)
Tôi sẽ tiến hành triển khai toàn bộ Giai đoạn 7 dựa trên kiến trúc Hybrid Recommendation (Kết hợp Content-Based và Collaborative Filtering). Dữ liệu sẽ đi xuyên suốt từ Python (Machine Learning) -> Node.js (Backend) -> ReactJS (Frontend).

Các thay đổi Đề xuất
1. Phân hệ Python (AI Service)
Cần bổ sung các thư viện ML (pandas, scikit-learn, numpy) vào ai-service/requirements.txt.

[NEW] `ai-service/services/recommendation.py`
Chịu trách nhiệm thực hiện tính toán gợi ý:

Truy vấn Dữ liệu: Đọc dữ liệu từ các bảng products, categories, user_behaviors, và reviews.
Content-Based Filtering: Sử dụng thuật toán TF-IDF trên name, description, category_name và tính cosine_similarity để tìm ra các sản phẩm giống nhau về mặt nội dung (dùng cho similar/:productId).
Collaborative Filtering: Dựa vào bảng user_behaviors để tính điểm trọng số (VIEW=1, CLICK=2, ADD_TO_CART=3, PURCHASE=5). Dựng User-Item matrix để gợi ý cho user có hành vi giống nhau.
Hybrid & Fallback: Kết hợp cả 2 phương pháp. Nếu user mới tinh (Cold Start) -> Chuyển sang gợi ý Sản phẩm phổ biến (Popular) dựa trên lượt bán.
[MODIFY] ai-service/main.py
Khai báo thêm các router cho hệ thống gợi ý để Backend Node.js gọi qua.

2. Phân hệ Node.js (Backend API)
[NEW] backend/src/controllers/recommendation.controller.ts
Làm cầu nối, nhận request từ phía Client, format dữ liệu, gọi sang Python Service bằng axios, và trả về kết quả chuẩn cho Frontend (bao gồm các trường product_id, image, price, reason...).

[NEW] backend/src/routes/recommendation.routes.ts
Mở các endpoints công khai:

`GET /api/recommendations/similar/:productId`
`GET /api/recommendations/user/:userId`
`GET /api/recommendations/popular`
`GET /api/recommendations`
[MODIFY] backend/src/app.ts
Import và sử dụng recommendationRoutes.

3. Phân hệ ReactJS (Frontend Client)
[NEW] `frontend/src/services/recommendation.service.ts`
Chứa các function gọi API tương ứng.

[NEW] `frontend/src/components/RecommendationList.tsx`
Tạo một Component dạng thanh trượt (Carousel) tái sử dụng để hiển thị các thẻ sản phẩm kèm theo thẻ reason ("Được gợi ý vì bạn thường xem sản phẩm cùng danh mục").

[MODIFY] `frontend/src/pages/Home.tsx`
Tích hợp RecommendationList để hiển thị "Gợi ý dành riêng cho bạn" ngay tại trang chủ (truyền userId nếu đã login, ngược lại sẽ hiện đồ phổ biến).

[MODIFY] `frontend/src/pages/ProductDetail.tsx`
Tích hợp RecommendationList phía dưới cùng để hiển thị danh sách "Sản phẩm tương tự" nhằm kích thích mua chéo (Cross-sell).

Kế hoạch Kiểm thử (Verification Plan)
Automated Tests (Terminal)
Khởi động lại Python Service và Node.js Service, theo dõi log xem có lỗi khởi tạo TF-IDF Vectorizer hay không.
Manual Verification
Test bằng Postman để check định dạng trả về của 3 Endpoint gợi ý.
Đăng nhập vào UI dưới quyền 1 User chưa từng mua hàng, check xem màn hình Home có hiển thị mục "Sản phẩm phổ biến" không.
Bấm vào một sản phẩm như Laptop, check xem dưới đáy trang có gợi ý đúng các Laptop tương tự hay không.