import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { testDbConnection } from './config/database.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware cho phép Frontend gọi API và đọc dữ liệu JSON gửi lên
app.use(cors());
app.use(express.json());

// API kiểm tra trạng thái hoạt động của server (Health check)
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'success',
    message: '🚀 VN Audio Guide Backend Server đang hoạt động bình thường!',
    timestamp: new Date().toISOString(),
  });
});

// Khởi động server
async function startServer() {
  console.log('⏳ Đang khởi động Backend Server...');

  // Kiểm tra kết nối tới MySQL
  const dbOk = await testDbConnection();
  if (!dbOk) {
    console.warn('⚠️ Cảnh báo: Chưa kết nối được MySQL. Hãy kiểm tra lại container Docker!');
  }

  app.listen(PORT, () => {
    console.log(`\n==================================================`);
    console.log(`🎉 BACKEND SERVER ĐANG CHẠY TẠI: http://localhost:${PORT}`);
    console.log(`👉 Test API Health: http://localhost:${PORT}/api/health`);
    console.log(`==================================================\n`);
  });
}

startServer();
