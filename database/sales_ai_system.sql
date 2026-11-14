-- ==============================================================================
-- GIAI ĐOẠN 2: THIẾT KẾ DATABASE MYSQL (SALES AI SYSTEM)
-- Hệ thống bán hàng Client-Server tích hợp AI Chatbot và Recommendation System
-- ==============================================================================

-- 1. TẠO DATABASE
DROP DATABASE IF EXISTS sales_ai_system;
CREATE DATABASE sales_ai_system CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE sales_ai_system;

-- ==============================================================================
-- 2. TẠO CÁC BẢNG (TABLES)
-- ==============================================================================

-- 2.1 Bảng users (Người dùng và Admin)
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100),
    role ENUM('ADMIN', 'CUSTOMER') DEFAULT 'CUSTOMER',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_role (role)
);

-- 2.2 Bảng categories (Danh mục sản phẩm)
CREATE TABLE categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 2.3 Bảng products (Sản phẩm)
CREATE TABLE products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    category_id INT NOT NULL,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    stock_quantity INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT,
    INDEX idx_category (category_id),
    INDEX idx_name (name)
);

-- 2.4 Bảng product_images (Hình ảnh sản phẩm)
CREATE TABLE product_images (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    image_url VARCHAR(255) NOT NULL,
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    INDEX idx_product (product_id)
);

-- 2.5 Bảng carts (Giỏ hàng)
CREATE TABLE carts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 2.6 Bảng cart_items (Chi tiết giỏ hàng)
CREATE TABLE cart_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    cart_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (cart_id) REFERENCES carts(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    UNIQUE KEY unique_cart_product (cart_id, product_id)
);

-- 2.7 Bảng orders (Đơn hàng)
CREATE TABLE orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    status ENUM('PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED') DEFAULT 'PENDING',
    shipping_address TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT,
    INDEX idx_user (user_id),
    INDEX idx_status (status)
);

-- 2.8 Bảng order_items (Chi tiết đơn hàng)
CREATE TABLE order_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL,
    price_at_time DECIMAL(10,2) NOT NULL, -- Giá tại thời điểm mua
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT
);

-- 2.9 Bảng reviews (Đánh giá)
CREATE TABLE reviews (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    product_id INT NOT NULL,
    rating INT NOT NULL CHECK(rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    INDEX idx_product_review (product_id)
);

-- 2.10 Bảng user_behaviors (Hành vi người dùng cho Recommendation System)
CREATE TABLE user_behaviors (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    product_id INT NOT NULL,
    action_type ENUM('VIEW', 'CLICK', 'ADD_TO_CART', 'PURCHASE') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    INDEX idx_user_behavior (user_id),
    INDEX idx_product_behavior (product_id),
    INDEX idx_action (action_type)
);

-- 2.11 Bảng chat_sessions (Phiên chat AI)
CREATE TABLE chat_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 2.12 Bảng chat_messages (Tin nhắn chat AI)
CREATE TABLE chat_messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_id INT NOT NULL,
    sender_type ENUM('USER', 'BOT') NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES chat_sessions(id) ON DELETE CASCADE
);

-- 2.13 Bảng recommendations (Kết quả AI gợi ý)
CREATE TABLE recommendations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    product_id INT NOT NULL,
    score DECIMAL(5,4) NOT NULL, -- Điểm phù hợp (vd: 0.9542)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    INDEX idx_user_recommend (user_id)
);


-- ==============================================================================
-- 3. DỮ LIỆU MẪU (SAMPLE DATA)
-- ==============================================================================

-- 3.1 Dữ liệu Users (Bao gồm Admin)
INSERT INTO users (username, email, password_hash, full_name, role) VALUES
('admin_sales', 'admin@sales.ai', 'hash_admin_123', 'System Admin', 'ADMIN'),
('john_doe', 'john@example.com', 'hash_user_123', 'John Doe', 'CUSTOMER'),
('jane_smith', 'jane@example.com', 'hash_user_456', 'Jane Smith', 'CUSTOMER');

-- 3.2 Dữ liệu Categories
INSERT INTO categories (name, description) VALUES
('Laptop', 'Máy tính xách tay các loại'),
('Smartphone', 'Điện thoại thông minh'),
('Accessories', 'Phụ kiện công nghệ');

-- 3.3 Dữ liệu Products
INSERT INTO products (category_id, name, description, price, stock_quantity) VALUES
(1, 'MacBook Pro 16 M3 Max', 'Apple MacBook Pro 16 inch with M3 Max chip', 3499.00, 50),
(1, 'Dell XPS 15', 'Dell XPS 15 inch OLED display', 1999.00, 30),
(2, 'iPhone 15 Pro Max', 'Apple iPhone 15 Pro Max 256GB', 1199.00, 100),
(2, 'Samsung Galaxy S24 Ultra', 'Samsung flagship smartphone', 1299.00, 80),
(3, 'AirPods Pro 2', 'Apple true wireless earbuds with ANC', 249.00, 200);

-- 3.4 Dữ liệu Product Images
INSERT INTO product_images (product_id, image_url, is_primary) VALUES
(1, 'https://example.com/macbook_pro_1.jpg', TRUE),
(1, 'https://example.com/macbook_pro_2.jpg', FALSE),
(3, 'https://example.com/iphone15_1.jpg', TRUE);

-- 3.5 Dữ liệu Carts và Cart Items
INSERT INTO carts (user_id) VALUES (2), (3);

INSERT INTO cart_items (cart_id, product_id, quantity) VALUES
(1, 3, 1),
(1, 5, 1),
(2, 1, 1);

-- 3.6 Dữ liệu Orders và Order Items
INSERT INTO orders (user_id, total_amount, status, shipping_address) VALUES
(2, 1448.00, 'DELIVERED', '123 Tech Street, Silicon Valley, CA'),
(3, 3499.00, 'PROCESSING', '456 Innovation Ave, New York, NY');

INSERT INTO order_items (order_id, product_id, quantity, price_at_time) VALUES
(1, 3, 1, 1199.00),
(1, 5, 1, 249.00),
(2, 1, 1, 3499.00);

-- 3.7 Dữ liệu Reviews
INSERT INTO reviews (user_id, product_id, rating, comment) VALUES
(2, 3, 5, 'Điện thoại rất tuyệt, chụp ảnh đẹp!'),
(2, 5, 4, 'Chống ồn tốt nhưng pin hơi hẻo.');

-- 3.8 Dữ liệu User Behaviors
INSERT INTO user_behaviors (user_id, product_id, action_type) VALUES
(2, 3, 'VIEW'),
(2, 3, 'ADD_TO_CART'),
(2, 3, 'PURCHASE'),
(3, 1, 'VIEW'),
(3, 2, 'VIEW'),
(3, 1, 'ADD_TO_CART');

-- 3.9 Dữ liệu Chat Sessions & Messages
INSERT INTO chat_sessions (user_id) VALUES (2);

INSERT INTO chat_messages (session_id, sender_type, message) VALUES
(1, 'USER', 'Bạn có thể gợi ý cho tôi tai nghe chống ồn tốt không?'),
(1, 'BOT', 'Chào bạn, hiện tại AirPods Pro 2 đang là sản phẩm tai nghe chống ồn tốt nhất với giá $249. Bạn có muốn xem thêm chi tiết không?');

-- 3.10 Dữ liệu Recommendations
INSERT INTO recommendations (user_id, product_id, score) VALUES
(2, 5, 0.9850),
(3, 2, 0.8540);
