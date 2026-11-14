const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

async function runBackup() {
  const rootDir = path.resolve(__dirname, '../..');
  const backupDir = path.join(rootDir, 'database', 'backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const timeTag = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;

  console.log('🔄 Đang tiến hành sao lưu cơ sở dữ liệu...');

  // 1. Export SQL Dump
  const sqlFileName = `backup_full_${timeTag}.sql`;
  const sqlFilePath = path.join(backupDir, sqlFileName);
  const mysqldumpPath = 'C:\\Program Files\\MySQL\\MySQL Server 8.0\\bin\\mysqldump.exe';

  try {
    execSync(`"${mysqldumpPath}" -u root -p1234 --routines --triggers --events he_thong_ban_hang_ai > "${sqlFilePath}"`, {
      stdio: ['pipe', 'pipe', 'pipe']
    });
    console.log(`✅ Đã xuất file SQL Dump: ${sqlFilePath}`);
  } catch (err) {
    console.warn('⚠️ Lỗi khi chạy mysqldump:', err.message);
  }

  // Also copy/update main backup_full_he_thong_ban_hang_ai.sql at database root
  const mainSqlPath = path.join(rootDir, 'database', 'backup_full_he_thong_ban_hang_ai.sql');
  if (fs.existsSync(sqlFilePath)) {
    fs.copyFileSync(sqlFilePath, mainSqlPath);
    console.log(`✅ Đã cập nhật file SQL chính: ${mainSqlPath}`);
  }

  // 2. Export Structured JSON
  const conn = await mysql.createConnection({
    host: '127.0.0.1',
    user: 'root',
    password: '1234',
    database: 'he_thong_ban_hang_ai'
  });

  const [tables] = await conn.query("SHOW FULL TABLES WHERE Table_type = 'BASE TABLE'");
  const tableNames = tables.map(r => Object.values(r)[0]);

  const stats = {};
  const fullJson = {};

  for (const tbl of tableNames) {
    const [rows] = await conn.query(`SELECT * FROM \`${tbl}\``);
    stats[tbl] = rows.length;
    fullJson[tbl] = rows;
  }

  const jsonFileName = `backup_full_${timeTag}.json`;
  const jsonFilePath = path.join(backupDir, jsonFileName);
  fs.writeFileSync(jsonFilePath, JSON.stringify(fullJson, null, 2), 'utf8');
  console.log(`✅ Đã xuất file JSON dữ liệu: ${jsonFilePath}`);

  console.log('\n📊 Thống kê số lượng bản ghi các bảng:');
  console.table(stats);

  await conn.end();
}

runBackup().catch(err => {
  console.error('❌ Lỗi sao lưu:', err);
  process.exit(1);
});
