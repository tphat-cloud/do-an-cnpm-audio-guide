import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mysql from 'mysql2/promise';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// Kết nối MySQL (chưa dùng cho nghiệp vụ, chỉ phục vụ health check)
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'doan_user',
  password: process.env.DB_PASSWORD || 'doan_pass123',
  database: process.env.DB_NAME || 'narration_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// API09 - GET /api/health (PRD 6.1): 200 nếu MySQL OK, 503 nếu lỗi kết nối
app.get('/api/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.status(200).json({ status: 'ok' });
  } catch (error) {
    console.error('Health check thất bại - không kết nối được MySQL:', error);
    res.status(503).json({ status: 'error' });
  }
});

const port = Number(process.env.PORT) || 5000;

app.listen(port, () => {
  console.log(`Backend đang chạy tại http://localhost:${port}`);
});
