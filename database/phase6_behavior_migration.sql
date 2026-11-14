-- ============================================================
-- GIAI ĐOẠN 6: BỔ SUNG CHO HỆ THỐNG THEO DÕI HÀNH VI
-- Database: sales_ai_system
-- Chạy file này trong MySQL Workbench / phpMyAdmin
-- ============================================================

USE sales_ai_system;

-- Bổ sung cột search_keyword nếu chưa có
ALTER TABLE user_behaviors
  ADD COLUMN IF NOT EXISTS search_keyword VARCHAR(500) NULL
    COMMENT 'Từ khóa tìm kiếm (chỉ có với action=search)'
    AFTER duration;

-- Cập nhật ENUM action_type để hỗ trợ tất cả event
ALTER TABLE user_behaviors
  MODIFY COLUMN action_type
    ENUM('view','click','add_to_cart','remove_from_cart','purchase','wishlist','like','review','search')
    NOT NULL;

-- Indexes tối ưu
CREATE INDEX IF NOT EXISTS idx_behaviors_keyword      ON user_behaviors (search_keyword(100));
CREATE INDEX IF NOT EXISTS idx_behaviors_user_product ON user_behaviors (user_id, product_id);
CREATE INDEX IF NOT EXISTS idx_behaviors_action_time  ON user_behaviors (action_type, created_at);

-- Kiểm tra kết quả
DESCRIBE user_behaviors;
SELECT action_type, COUNT(*) AS count FROM user_behaviors GROUP BY action_type;
