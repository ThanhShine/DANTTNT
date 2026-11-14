const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
dotenv.config();

async function check() {
  const conn = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: process.env.DB_PASSWORD || '1234',
    database: 'sales_ai_system',
  });
  
  try {
    const [rows] = await conn.execute('SHOW TABLES LIKE "chat_sessions"');
    console.log('Exists:', rows.length > 0);
  } catch (err) {
    console.error('Error:', err.message);
  }
  await conn.end();
}

check();
