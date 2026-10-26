-- ============================================================
-- Migration 02 - Đa ngôn ngữ cho tên/mô tả địa danh và tên điểm
-- (PRD 2.7.3, 5.2.3, 5.2.5, 6.2 - API02, API03, API07, API08)
--
-- Dùng cho CSDL ĐANG CHẠY và ĐÃ CÓ DỮ LIỆU THẬT:
--   * chỉ thêm bảng/cột còn thiếu, không xóa hay sửa dữ liệu hiện có;
--   * chạy lại nhiều lần vẫn an toàn (CREATE TABLE IF NOT EXISTS + kiểm tra
--     information_schema trước khi ALTER TABLE);
--   * các bản dịch được nạp bằng INSERT ... ON DUPLICATE KEY UPDATE.
--
-- Lệnh chạy (PowerShell, từ thư mục gốc dự án):
--   docker cp .\backend\database\migrate-02.sql doan-mysql:/tmp/migrate-02.sql
--   docker exec -i doan-mysql sh -c "mysql -u root -proot123 --default-character-set=utf8mb4 < /tmp/migrate-02.sql"
-- ============================================================

USE narration_db;

-- Ép client dùng UTF-8, tránh lỗi tiếng Việt/Trung/Nhật/Hàn khi import
SET NAMES utf8mb4;

-- 5.2.5 Bảng location_translations (tên và mô tả địa danh theo ngôn ngữ)
-- PRD chỉ nêu tên bảng ở mục 5.2.5, nên các cột được lấy theo cấu trúc của
-- poi_translations (5.2.3), thay narration_text/audio_url bằng name/description.
CREATE TABLE IF NOT EXISTS location_translations (
  id          INT          NOT NULL AUTO_INCREMENT,
  location_id INT          NOT NULL,
  lang        VARCHAR(5)   NOT NULL,
  name        VARCHAR(255) NULL,
  description TEXT         NULL,
  created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP    NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_location_translations_location_lang (location_id, lang),
  CONSTRAINT fk_location_translations_location
    FOREIGN KEY (location_id) REFERENCES locations (id)
    ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- 5.2.3 Bổ sung cột name vào poi_translations (tên điểm theo ngôn ngữ).
-- MySQL 8.0 không có ALTER TABLE ... ADD COLUMN IF NOT EXISTS nên phải kiểm tra
-- information_schema trong một thủ tục tạm; thủ tục bị xóa ngay sau khi chạy.
DROP PROCEDURE IF EXISTS migrate_02_add_poi_translation_name;

DELIMITER $$

CREATE PROCEDURE migrate_02_add_poi_translation_name()
BEGIN
  IF NOT EXISTS (
    SELECT 1
      FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = 'narration_db'
       AND TABLE_NAME = 'poi_translations'
       AND COLUMN_NAME = 'name'
  ) THEN
    ALTER TABLE poi_translations
      ADD COLUMN name VARCHAR(255) NULL AFTER lang;
  END IF;
END$$

DELIMITER ;

CALL migrate_02_add_poi_translation_name();

DROP PROCEDURE migrate_02_add_poi_translation_name;

-- Tên và mô tả địa danh 1 theo 5 ngôn ngữ (PRD 2.7.3).
-- Bản vi lấy nguyên văn nội dung ở bảng locations; các bản en, zh, ko, ja là
-- BẢN DỊCH TẠM, cần người phụ trách kiểm tra lại trước khi dùng chính thức.
INSERT INTO location_translations (location_id, lang, name, description)
VALUES
  (1, 'vi', 'Dinh Độc Lập', 'Di tích lịch sử quốc gia đặc biệt tại Quận 1, TP. Hồ Chí Minh. Nơi ghi dấu sự kiện 30/4/1975.'),
  (1, 'en', 'Independence Palace', 'A special national historical relic in District 1, Ho Chi Minh City. It marks the events of 30 April 1975.'),
  (1, 'zh', '独立宫', '位于胡志明市第一郡的国家级特别历史遗迹，见证了1975年4月30日的历史事件。'),
  (1, 'ko', '독립궁', '호찌민시 1군에 있는 국가 특별 사적지로, 1975년 4월 30일의 역사적 사건을 간직한 곳입니다.'),
  (1, 'ja', '統一会堂', 'ホーチミン市1区にある国家特別史跡で、1975年4月30日の歴史的な出来事を今に伝える場所です。')
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  description = VALUES(description);
