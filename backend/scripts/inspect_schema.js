// Dump actual MySQL schema (tables + columns) to verify code matches DB.
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mysql = require('mysql2/promise');

(async () => {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST, port: process.env.DB_PORT,
    user: process.env.DB_USER, password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });
  const [cols] = await conn.query(
    `SELECT TABLE_NAME t, COLUMN_NAME c, COLUMN_TYPE ty
     FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = ?
     ORDER BY TABLE_NAME, ORDINAL_POSITION`, [process.env.DB_NAME]);
  const map = {};
  for (const r of cols) (map[r.t] ||= []).push(`${r.c}:${r.ty}`);
  for (const [t, c] of Object.entries(map)) console.log(`${t}: ${c.join(', ')}`);
  await conn.end();
})().catch(e => { console.error('ERR', e.message); process.exit(1); });
