import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { authenticateAdmin } from './admin.repository';

/**
 * Module auth (PRD 2.2 - giai đoạn 1, sau tách thành auth-service).
 *
 * Phạm vi: đăng nhập (UC07), cấp và xác thực JWT, quản lý bảng `admins`.
 * Quy ước: KHÔNG import code từ `src/content`; chỉ dùng `src/config` và
 * trao đổi với content thông qua JWT secret dùng chung.
 */
export const authRouter = Router();

/** Thời hạn token theo mẫu response của PRD 6.2 (API01). */
const TOKEN_TTL_SECONDS = 3600;

// API01 - POST /api/auth/login (UC07)
authRouter.post('/login', async (req, res) => {
  const body = (req.body ?? {}) as { username?: unknown; password?: unknown };
  const { username, password } = body;

  if (
    typeof username !== 'string' ||
    typeof password !== 'string' ||
    username.trim() === '' ||
    password === ''
  ) {
    res.status(400).json({ message: 'Vui lòng nhập đầy đủ' });
    return;
  }

  if (env.jwtSecret === '') {
    console.error('Chưa cấu hình JWT_SECRET trong .env');
    res.status(500).json({ message: 'Lỗi máy chủ' });
    return;
  }

  try {
    const result = await authenticateAdmin(username.trim(), (passwordHash) =>
      bcrypt.compare(password, passwordHash)
    );

    if (result.status === 'locked') {
      res.status(429).json({
        message: 'Đăng nhập sai quá nhiều lần, vui lòng thử lại sau',
        retryAfterSeconds: result.retryAfterSeconds,
      });
      return;
    }

    if (result.status === 'invalid') {
      res.status(401).json({ message: 'Sai tên đăng nhập hoặc mật khẩu' });
      return;
    }

    const { admin } = result;
    const token = jwt.sign(
      { sub: String(admin.id), username: admin.username, role: 'admin' },
      env.jwtSecret,
      { expiresIn: TOKEN_TTL_SECONDS }
    );

    res.status(200).json({
      token,
      expiresIn: TOKEN_TTL_SECONDS,
      admin: { id: admin.id, username: admin.username },
    });
  } catch (error) {
    console.error('Lỗi API01 - đăng nhập:', error);
    res.status(500).json({ message: 'Lỗi máy chủ' });
  }
});
