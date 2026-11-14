import mysql2, { Pool, PoolOptions, RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const poolConfig: PoolOptions = {
  host:            process.env.DB_HOST            || 'localhost',
  port:            parseInt(process.env.DB_PORT   || '3306', 10),
  user:            process.env.DB_USER            || 'root',
  password:        process.env.DB_PASSWORD        || '',
  database:        process.env.DB_NAME            || 'sales_ai_system',
  connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT || '10', 10),
  waitForConnections: true,
  queueLimit:      0,
  charset:         'utf8mb4',
  timezone:        '+07:00',
};

const pool: Pool = mysql2.createPool(poolConfig);

// Kiểm tra kết nối khi khởi động
export const testConnection = async (): Promise<void> => {
  try {
    const connection = await pool.getConnection();
    console.log('✅ MySQL connected successfully to database:', process.env.DB_NAME);
    connection.release();
  } catch (error) {
    console.error('❌ MySQL connection failed:', error);
    process.exit(1);
  }
};

// Helper: query trả về mảng rows
export const query = async <T extends RowDataPacket>(
  sql: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  params?: any[]
): Promise<T[]> => {
  const [rows] = await pool.execute<T[]>(sql, params);
  return rows;
};

// Helper: query trả về ResultSetHeader (INSERT/UPDATE/DELETE)
export const execute = async (
  sql: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  params?: any[]
): Promise<ResultSetHeader> => {
  const [result] = await pool.execute<ResultSetHeader>(sql, params);
  return result;
};

// Helper: query trả về row đầu tiên hoặc null
export const queryOne = async <T extends RowDataPacket>(
  sql: string,
  params?: unknown[]
): Promise<T | null> => {
  const rows = await query<T>(sql, params);
  return rows.length > 0 ? rows[0] : null;
};

export { pool };
export default pool;

