-- ============================================================
-- Dữ liệu mẫu tối thiểu (chạy sau schema.sql)
-- 1 địa danh: Dinh Độc Lập
-- 1 tài khoản admin: admin / matkhau123 (mật khẩu đã băm bằng bcrypt)
-- Idempotent: chạy lại nhiều lần không sinh bản ghi trùng.
-- ============================================================

USE narration_db;

INSERT INTO locations (id, name, description)
VALUES (
  1,
  'Dinh Độc Lập',
  'Di tích lịch sử quốc gia đặc biệt tại Quận 1, TP. Hồ Chí Minh. Nơi ghi dấu sự kiện 30/4/1975.'
)
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  description = VALUES(description);

INSERT INTO admins (username, password_hash)
VALUES (
  'admin',
  '$2b$10$OuLj/8mWTnJXjfRkJzjYPeH7qaRIOzt.YJ2XDMJIYg6wU.saqUwTi'
)
ON DUPLICATE KEY UPDATE
  password_hash = VALUES(password_hash);
