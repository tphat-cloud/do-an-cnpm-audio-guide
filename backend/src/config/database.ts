import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// Tạo Connection Pool kết nối MySQL Docker
export const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'doan_user',
  password: process.env.DB_PASSWORD || 'doan_pass123',
  database: process.env.DB_NAME || 'narration_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Hàm kiểm tra kết nối thử
export async function testDbConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Đã kết nối thành công tới MySQL Database trên Docker!');
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ Lỗi kết nối MySQL:', error);
    return false;
  }
}
