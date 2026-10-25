import { Router } from 'express';

/**
 * Module auth (PRD 2.2 - giai đoạn 1, sau tách thành auth-service).
 *
 * Phạm vi: đăng nhập (UC07), cấp và xác thực JWT, quản lý bảng `admins`.
 * Quy ước: KHÔNG import code từ `src/content`; chỉ dùng `src/config` và
 * trao đổi với content thông qua JWT secret dùng chung.
 *
 * Chưa cài API nào - route sẽ được thêm ở bước tiếp theo (API01).
 */
export const authRouter = Router();
