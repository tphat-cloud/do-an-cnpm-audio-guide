import mysql from 'mysql2/promise';
import { env } from './env';

/**
 * Connection pool dùng chung cho các module trong cùng process.
 * Khi tách service (PRD 2.2 - giai đoạn 2), mỗi service giữ một bản
 * cấu hình riêng nhưng vẫn trỏ tới database narration_db.
 */
export const pool = mysql.createPool({
  host: env.db.host,
  port: env.db.port,
  user: env.db.user,
  password: env.db.password,
  database: env.db.name,
  charset: 'utf8mb4',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

/** Kiểm tra MySQL còn kết nối được hay không (dùng cho API09). */
export async function pingDatabase(): Promise<boolean> {
  try {
    await pool.query('SELECT 1');
    return true;
  } catch (error) {
    console.error('Không kết nối được MySQL:', error);
    return false;
  }
}
