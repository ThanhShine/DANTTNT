-- ============================================================
-- GIAI ĐOẠN: LƯU LỊCH SỬ CHATBOT (chat_sessions, chat_messages)
-- Database: he_thong_ban_hang_ai
-- ============================================================

USE he_thong_ban_hang_ai;

-- 1. Bảng chat_sessions
CREATE TABLE IF NOT EXISTS chat_sessions (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    session_uuid    VARCHAR(100) NOT NULL,
    user_id         INT NULL,
    title           VARCHAR(255) NULL,
    status          VARCHAR(50) NOT NULL DEFAULT 'active',
    total_messages  INT NOT NULL DEFAULT 0,
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT uq_chat_sessions_uuid UNIQUE (session_uuid),
    CONSTRAINT fk_cs_nguoidung_user FOREIGN KEY (user_id) 
        REFERENCES nguoi_dung(ma_id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX IF NOT EXISTS idx_chat_sessions_user   ON chat_sessions (user_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_status ON chat_sessions (status);

-- 2. Bảng chat_messages
CREATE TABLE IF NOT EXISTS chat_messages (
    id                  BIGINT AUTO_INCREMENT PRIMARY KEY,
    session_id          INT NOT NULL,
    sender_type         ENUM('user', 'ai') NOT NULL,
    message             LONGTEXT NOT NULL,
    suggested_products  JSON NULL,
    created_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_cm_chatsessions_id FOREIGN KEY (session_id) 
        REFERENCES chat_sessions(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX IF NOT EXISTS idx_chat_messages_session ON chat_messages (session_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created ON chat_messages (created_at);
