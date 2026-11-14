-- ============================================================
-- GIAI ĐOẠN: PERSONALIZED AI MEMORY (BỘ NHỚ NGƯỜI DÙNG CHO CHATBOT AI)
-- Database: he_thong_ban_hang_ai
-- ============================================================

USE he_thong_ban_hang_ai;

-- 1. Bảng user_memories (Lưu từng đơn vị ký ức dài hạn của người dùng)
CREATE TABLE IF NOT EXISTS user_memories (
    id            BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id       INT NOT NULL,
    memory_type   ENUM('preference', 'budget', 'brand', 'category', 'feature', 'dislike', 'purchase', 'behavior') NOT NULL,
    memory_key    VARCHAR(100) NOT NULL,
    memory_value  TEXT NOT NULL,
    confidence    FLOAT NOT NULL DEFAULT 0.5,
    source        VARCHAR(50) NOT NULL DEFAULT 'chat_extraction',
    created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_um_user FOREIGN KEY (user_id) 
        REFERENCES nguoi_dung(ma_id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT uq_user_memory_key UNIQUE (user_id, memory_type, memory_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_user_memories_user ON user_memories (user_id);
CREATE INDEX idx_user_memories_type ON user_memories (memory_type);

-- 2. Bảng user_preference_summary (Hồ sơ tổng hợp sở thích người dùng)
CREATE TABLE IF NOT EXISTS user_preference_summary (
    user_id             INT NOT NULL PRIMARY KEY,
    preferred_categories JSON NULL,
    preferred_brands    JSON NULL,
    price_min           DECIMAL(15, 2) NULL,
    price_max           DECIMAL(15, 2) NULL,
    preferred_features  JSON NULL,
    disliked_features   JSON NULL,
    favorite_products   JSON NULL,
    summary             TEXT NULL,
    updated_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_ups_user FOREIGN KEY (user_id) 
        REFERENCES nguoi_dung(ma_id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
