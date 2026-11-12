import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';

/**
 * Kiểm tra JWT cho các API quản trị của module content (PRD 2.7.1, 6.1).
 *
 * Cố ý viết riêng thay vì import từ `src/auth` (PRD 2.2 - module isolation):
 * hai module chỉ chia sẻ `JWT_SECRET` trong `src/config`, sau này tách thành
 * content-service vẫn xác thực được token do auth-service cấp.
 */

const UNAUTHORIZED_MESSAGE = 'Phiên đăng nhập đã hết hạn';

const BEARER_PATTERN = /^Bearer\s+(\S+)$/i;

export interface AdminClaims {
  adminId: number;
  username: string;
}

/** Giải mã token; trả null khi thiếu, sai chữ ký, hỏng hoặc hết hạn. */
function decodeAdminToken(authorization: string | undefined): AdminClaims | null {
  if (!authorization) return null;

  const matched = BEARER_PATTERN.exec(authorization.trim());
  if (!matched) return null;

  try {
    const payload = jwt.verify(matched[1], env.jwtSecret);
    // Token do API01 cấp luôn là object có sub = id admin.
    if (typeof payload === 'string') return null;

    return {
      adminId: Number(payload.sub),
      username: String(payload.username ?? ''),
    };
  } catch {
    return null;
  }
}

/** Middleware chặn mọi API quản trị khi thiếu hoặc hết hạn token (401). */
export function requireAdmin(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (env.jwtSecret === '') {
    console.error('Chưa cấu hình JWT_SECRET trong .env');
    res.status(500).json({ message: 'Lỗi máy chủ' });
    return;
  }

  const claims = decodeAdminToken(req.header('authorization'));

  if (!claims) {
    res.status(401).json({ message: UNAUTHORIZED_MESSAGE });
    return;
  }

  // Dùng res.locals thay vì mở rộng kiểu Request của Express.
  res.locals.admin = claims;
  next();
}
