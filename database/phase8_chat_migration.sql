-- ============================================================
-- GIAI ĐOẠN 8: AI CHATBOT — Database Migration
-- Chạy file này trong MySQL Workbench / phpMyAdmin
-- (Dùng IF NOT EXISTS để an toàn nếu bảng đã tồn tại)
-- ============================================================

USE sales_ai_system;

-- ------------------------------------------------------------
-- Bảng: chat_sessions
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS chat_sessions (
    id              INT             NOT NULL AUTO_INCREMENT,
    session_uuid    VARCHAR(100)    NOT NULL COMMENT 'UUID định danh session (sinh từ client)',
    user_id         INT             NULL     COMMENT 'NULL = khách vãng lai',
    title           VARCHAR(300)    NULL     COMMENT 'Tiêu đề phiên (tự sinh từ câu đầu)',
    status          ENUM('active','closed') NOT NULL DEFAULT 'active',
    total_messages  INT             NOT NULL DEFAULT 0,
    started_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_message_at DATETIME        NULL,
    closed_at       DATETIME        NULL,

    CONSTRAINT pk_chat_sessions       PRIMARY KEY (id),
    CONSTRAINT uq_chat_sessions_uuid  UNIQUE (session_uuid),
    CONSTRAINT fk_chat_sessions_user  FOREIGN KEY (user_id)
        REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX IF NOT EXISTS idx_chat_sessions_user   ON chat_sessions (user_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_status ON chat_sessions (status);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_last   ON chat_sessions (last_message_at);

-- ------------------------------------------------------------
-- Bảng: chat_messages
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS chat_messages (
    id                  BIGINT      NOT NULL AUTO_INCREMENT,
    session_id          INT         NOT NULL,
    role                ENUM('user','assistant','system') NOT NULL,
    content             LONGTEXT    NOT NULL,
    tokens_used         INT         NULL     COMMENT 'Số token OpenAI đã dùng',
    model_used          VARCHAR(60) NULL     COMMENT 'VD: gpt-4o-mini',
    suggested_products  JSON        NULL     COMMENT 'Mảng product_id AI gợi ý',
    intent              VARCHAR(100)NULL     COMMENT 'product_inquiry, budget_search, comparison...',
    is_error            TINYINT(1)  NOT NULL DEFAULT 0,
    created_at          DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT pk_chat_messages         PRIMARY KEY (id),
    CONSTRAINT fk_chat_messages_session FOREIGN KEY (session_id)
        REFERENCES chat_sessions(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX IF NOT EXISTS idx_chat_messages_session ON chat_messages (session_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_role    ON chat_messages (role);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created ON chat_messages (created_at);

-- Kiểm tra kết quả
SELECT 'chat_sessions' AS table_name, COUNT(*) AS rows FROM chat_sessions
UNION ALL
SELECT 'chat_messages', COUNT(*) FROM chat_messages;
