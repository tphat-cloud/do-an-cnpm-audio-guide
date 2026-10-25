-- ============================================================
-- Schema database narration_db (PRD Chương 5)
-- MySQL 8.0 - 4 bảng: locations, pois, poi_translations, admins
-- ============================================================

CREATE DATABASE IF NOT EXISTS narration_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE narration_db;

-- 5.2.1 Bảng locations (địa danh)
CREATE TABLE IF NOT EXISTS locations (
  id          INT           NOT NULL AUTO_INCREMENT,
  name        VARCHAR(255)  NOT NULL,
  description TEXT          NULL,
  created_at  TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- 5.2.2 Bảng pois (điểm tham quan)
CREATE TABLE IF NOT EXISTS pois (
  id          INT            NOT NULL AUTO_INCREMENT,
  location_id INT            NOT NULL,
  name        VARCHAR(255)   NOT NULL,
  latitude    DECIMAL(10, 7) NOT NULL,
  longitude   DECIMAL(10, 7) NOT NULL,
  radius_m    INT            NOT NULL DEFAULT 10,
  order_index INT            NOT NULL DEFAULT 0,
  created_at  TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP      NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_pois_location_name (location_id, name),
  CONSTRAINT fk_pois_location
    FOREIGN KEY (location_id) REFERENCES locations (id)
    ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- 5.2.3 Bảng poi_translations (nội dung thuyết minh theo ngôn ngữ)
CREATE TABLE IF NOT EXISTS poi_translations (
  id             INT          NOT NULL AUTO_INCREMENT,
  poi_id         INT          NOT NULL,
  lang           VARCHAR(5)   NOT NULL,
  narration_text TEXT         NOT NULL,
  audio_url      VARCHAR(500) NULL,
  created_at     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     TIMESTAMP    NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_poi_translations_poi_lang (poi_id, lang),
  CONSTRAINT fk_poi_translations_poi
    FOREIGN KEY (poi_id) REFERENCES pois (id)
    ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- 5.2.4 Bảng admins (tài khoản quản trị)
CREATE TABLE IF NOT EXISTS admins (
  id              INT          NOT NULL AUTO_INCREMENT,
  username        VARCHAR(100) NOT NULL,
  password_hash   VARCHAR(255) NOT NULL,
  created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  failed_attempts INT          NOT NULL DEFAULT 0,
  locked_until    TIMESTAMP    NULL DEFAULT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_admins_username (username)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
