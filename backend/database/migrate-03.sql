-- ============================================================
-- Migration 03 - Bảng visitor_sessions (đếm truy cập - API10, API11)
-- (PRD Chương 5, mục 5.2.6)
--
-- Dùng cho CSDL ĐANG CHẠY và ĐÃ CÓ DỮ LIỆU THẬT:
--   * chỉ thêm bảng còn thiếu, không xóa hay sửa dữ liệu hiện có;
--   * chạy lại nhiều lần vẫn an toàn (CREATE TABLE IF NOT EXISTS).
--
-- Lệnh chạy (PowerShell, từ thư mục gốc dự án):
--   docker cp .\backend\database\migrate-03.sql doan-mysql:/tmp/migrate-03.sql
--   docker exec -i doan-mysql sh -c "mysql -u root -proot123 --default-character-set=utf8mb4 < /tmp/migrate-03.sql"
-- ============================================================

USE narration_db;

-- Ép client dùng UTF-8, tránh lỗi tiếng Việt khi import
SET NAMES utf8mb4;

-- 5.2.6 Bảng visitor_sessions (phiên truy cập của du khách)
-- Du khách truy cập ẩn danh nên bảng KHÔNG có khóa ngoại: mỗi dòng chỉ là một
-- mã phiên ngẫu nhiên do trình duyệt sinh, không lưu thông tin cá nhân.
-- session_id là khóa chính để nhịp tim 30 giây chỉ cập nhật last_seen_at
-- (INSERT ... ON DUPLICATE KEY UPDATE) chứ không sinh thêm dòng mới.
CREATE TABLE IF NOT EXISTS visitor_sessions (
  session_id    VARCHAR(64) NOT NULL,
  first_seen_at TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_seen_at  TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (session_id),
  KEY idx_visitor_sessions_last_seen (last_seen_at)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;