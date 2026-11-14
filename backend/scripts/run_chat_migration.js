// Migration script for Chatbot History (chat_sessions and chat_messages)
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mysql = require('mysql2/promise');

async function runMigration() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '1234',
    database: process.env.DB_NAME || 'he_thong_ban_hang_ai',
  });

  console.log('Connected to MySQL. Running chat history migration...');

  // 1. Tạo VIEW users nếu chưa có để tương thích
  try {
    await conn.query(`
      CREATE OR REPLACE VIEW users AS
      SELECT 
        ma_id AS id,
        dia_chi_email AS email,
        ho_ten AS full_name,
        so_dien_thoai AS phone,
        duong_dan_anh_dai_dien AS avatar_url,
        vai_tro AS role,
        dang_hoat_dong AS is_active,
        ngay_tao AS created_at
      FROM nguoi_dung
    `);
    console.log('✅ Created / verified VIEW users');
  } catch (err) {
    console.warn('⚠️ Note on VIEW users:', err.message);
  }

  // 2. Tạo bảng chat_sessions
  await conn.query(`
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
  `);
  console.log('✅ Table chat_sessions ready');

  // 3. Tạo bảng chat_messages
  await conn.query(`
    CREATE TABLE IF NOT EXISTS chat_messages (
      id              BIGINT AUTO_INCREMENT PRIMARY KEY,
      session_id      INT NOT NULL,
      sender_type     ENUM('user', 'ai') NOT NULL,
      message         LONGTEXT NOT NULL,
      suggested_products JSON NULL,
      created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_cm_chatsessions_id FOREIGN KEY (session_id) 
        REFERENCES chat_sessions(id) ON DELETE CASCADE ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
  console.log('✅ Table chat_messages ready');

  // Tạo index nếu chưa có
  const [indexes] = await conn.query(`SHOW INDEX FROM chat_sessions WHERE Key_name = 'idx_chat_sessions_user'`);
  if (indexes.length === 0) {
    await conn.query(`CREATE INDEX idx_chat_sessions_user ON chat_sessions(user_id)`);
  }
  const [msgIndexes] = await conn.query(`SHOW INDEX FROM chat_messages WHERE Key_name = 'idx_chat_messages_session'`);
  if (msgIndexes.length === 0) {
    await conn.query(`CREATE INDEX idx_chat_messages_session ON chat_messages(session_id)`);
  }

  // 4. Migrate dữ liệu cũ từ phien_tro_chuyen và tin_nhan_tro_chuyen (nếu có)
  try {
    const [existingSessions] = await conn.query(`SELECT COUNT(*) as count FROM chat_sessions`);
    if (existingSessions[0].count === 0) {
      console.log('Checking for old session data to migrate...');
      const [oldSessions] = await conn.query(`
        SELECT ma_id, ma_phien_uuid, ma_nguoi_dung, tieu_de, trang_thai, tong_tin_nhan, bat_dau_luc, tin_nhan_cuoi_luc
        FROM phien_tro_chuyen
      `);
      for (const s of oldSessions) {
        const [res] = await conn.query(`
          INSERT INTO chat_sessions (session_uuid, user_id, title, status, total_messages, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, COALESCE(?, ?))
        `, [
          s.ma_phien_uuid,
          s.ma_nguoi_dung,
          s.tieu_de || 'Cuộc trò chuyện',
          s.trang_thai || 'active',
          s.tong_tin_nhan || 0,
          s.bat_dau_luc || new Date(),
          s.tin_nhan_cuoi_luc,
          s.bat_dau_luc || new Date()
        ]);
        const newSessionId = res.insertId;

        const [oldMessages] = await conn.query(`
          SELECT vai_tro, noi_dung, san_pham_duoc_goi_y, ngay_tao
          FROM tin_nhan_tro_chuyen
          WHERE ma_phien = ?
          ORDER BY ngay_tao ASC
        `, [s.ma_id]);

        for (const m of oldMessages) {
          const senderType = m.vai_tro === 'user' ? 'user' : 'ai';
          await conn.query(`
            INSERT INTO chat_messages (session_id, sender_type, message, suggested_products, created_at)
            VALUES (?, ?, ?, ?, ?)
          `, [
            newSessionId,
            senderType,
            m.noi_dung,
            m.san_pham_duoc_goi_y ? JSON.stringify(m.san_pham_duoc_goi_y) : null,
            m.ngay_tao || new Date()
          ]);
        }
      }
      console.log(`Migrated ${oldSessions.length} sessions from old tables.`);
    }
  } catch (migErr) {
    console.warn('Old table migration notice:', migErr.message);
  }

  console.log('🚀 Chat History Migration Finished Successfully!');
  await conn.end();
}

runMigration().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
