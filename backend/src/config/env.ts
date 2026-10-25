import dotenv from 'dotenv';

dotenv.config();

/**
 * Cấu hình đọc từ biến môi trường (PRD 2.5: dotenv).
 * Giá trị mặc định chỉ dùng cho môi trường dev cục bộ.
 */
export const env = {
  port: Number(process.env.PORT) || 5000,

  db: {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'doan_user',
    password: process.env.DB_PASSWORD || 'doan_pass123',
    name: process.env.DB_NAME || 'narration_db',
  },

  // Dùng chung giữa auth và content: content-service tự kiểm tra JWT
  // bằng secret này, không gọi sang auth-service (PRD 2.2).
  jwtSecret: process.env.JWT_SECRET || '',
};
