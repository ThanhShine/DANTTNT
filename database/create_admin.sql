-- Script tạo tài khoản admin (mật khẩu: Admin@123456)
-- Chạy script này trong MySQL Workbench hoặc phpMyAdmin

USE sales_ai_system;

-- Kiểm tra đã có admin chưa
SELECT id, email, full_name, role FROM users WHERE role = 'admin';

-- Nếu chưa có, chạy lệnh dưới để tạo admin
-- Password hash của 'Admin@123456' với bcrypt rounds=12
INSERT INTO users (email, password_hash, full_name, role, is_active, email_verified)
VALUES (
  'admin@salesai.com',
  '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdcprI2JC5RuC3C',
  'Super Admin',
  'admin',
  1,
  1
)
ON DUPLICATE KEY UPDATE role = 'admin', is_active = 1;

-- Hoặc nếu bạn đã có tài khoản, đổi role thành admin:
-- UPDATE users SET role = 'admin' WHERE email = 'your-email@example.com';

-- Kiểm tra kết quả
SELECT id, email, full_name, role, is_active FROM users WHERE role = 'admin';
