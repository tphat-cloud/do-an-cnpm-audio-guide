-- ==========================================================
-- DỰ ÁN: HỆ THỐNG THUYẾT MINH DU LỊCH TỰ ĐỘNG ĐA NGÔN NGỮ
-- CƠ SỞ DỮ LIỆU: MySQL 8.0
-- DATABASE: narration_db
-- ==========================================================

CREATE DATABASE IF NOT EXISTS narration_db 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE narration_db;

-- ----------------------------------------------------------
-- 1. BẢNG USERS (Tài khoản người dùng & Phân quyền RBAC)
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role ENUM('admin', 'user') NOT NULL DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_email (email),
    INDEX idx_user_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------
-- 2. BẢNG PLACES (Thông tin Địa danh, Di tích & Danh thắng)
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS places (
    id VARCHAR(100) PRIMARY KEY,                  -- Ví dụ: 'dinh-doc-lap', 'chua-mot-cot'
    name VARCHAR(255) NOT NULL,                   -- Tên địa danh tiếng Việt
    category ENUM('ditich', 'thangcanh', 'baotang', 'tongiao') NOT NULL DEFAULT 'ditich',
    category_label VARCHAR(100) NOT NULL,         -- Nhãn hiển thị tiếng Việt (VD: 'Di tích lịch sử')
    city VARCHAR(100) NOT NULL,                   -- Tỉnh / Thành phố
    image_url TEXT NOT NULL,                      -- Ảnh bìa đại diện
    short_desc TEXT NOT NULL,                     -- Mô tả tóm tắt ngắn
    history_text LONGTEXT NOT NULL,               -- Bài viết lịch sử chi tiết
    opening_hours VARCHAR(100) DEFAULT '08:00 - 17:00 hàng ngày',
    ticket_price VARCHAR(100) DEFAULT 'Miễn phí',
    total_listens INT UNSIGNED DEFAULT 0,         -- Đếm số lượt khách đã nghe thuyết minh
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_place_city (city),
    INDEX idx_place_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------
-- 3. BẢNG NARRATIONS (Bản thuyết minh theo từng ngôn ngữ)
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS narrations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    place_id VARCHAR(100) NOT NULL,               -- Khóa ngoại trỏ về bảng PLACES
    language VARCHAR(10) NOT NULL,                -- Mã ngôn ngữ: 'vi', 'en', 'ja', 'ko', 'zh'
    language_name VARCHAR(50) NOT NULL,          -- 'Tiếng Việt', 'English', '日本語', '한국어', '中文'
    flag VARCHAR(10) NOT NULL,                    -- Cờ hiển thị: 🇻🇳, 🇬🇧, 🇯🇵, 🇰🇷, 🇨🇳
    voice_name VARCHAR(100) NOT NULL,             -- Tên mô hình giọng đọc TTS
    audio_url TEXT NOT NULL,                      -- Đường dẫn file âm thanh MP3
    title VARCHAR(255) NOT NULL,                  -- Tiêu đề thuyết minh bằng ngôn ngữ tương ứng
    narration_text LONGTEXT NOT NULL,             -- Lời bình thuyết minh đầy đủ
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Ràng buộc toàn vẹn dữ liệu
    CONSTRAINT fk_narrations_place 
        FOREIGN KEY (place_id) 
        REFERENCES places(id) 
        ON DELETE CASCADE 
        ON UPDATE CASCADE,
        
    -- Mỗi địa danh chỉ có 1 bản thuyết minh duy nhất cho 1 ngôn ngữ cụ thể
    UNIQUE KEY uq_place_language (place_id, language),
    INDEX idx_narration_lang (language)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
