import { pool } from '../config/database.js';
import bcrypt from 'bcryptjs';

async function initDatabase() {
  console.log('⏳ Đang khởi tạo Database và các Bảng dữ liệu trong MySQL...');

  try {
    const connection = await pool.getConnection();

    // 1. Tạo bảng USERS (Người dùng & Phân quyền)
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        full_name VARCHAR(255) NOT NULL,
        role ENUM('admin', 'user') DEFAULT 'user',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('  ✔️ Bảng users đã sẵn sàng');

    // 2. Tạo bảng PLACES (Địa danh / Điểm du lịch)
    await connection.query(`
      CREATE TABLE IF NOT EXISTS places (
        id VARCHAR(100) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        category VARCHAR(50) NOT NULL,
        category_label VARCHAR(100) NOT NULL,
        city VARCHAR(100) NOT NULL,
        image_url TEXT NOT NULL,
        short_desc TEXT NOT NULL,
        history_text LONGTEXT NOT NULL,
        opening_hours VARCHAR(100) DEFAULT '08:00 - 17:00 hàng ngày',
        ticket_price VARCHAR(100) DEFAULT 'Miễn phí',
        total_listens INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('  ✔️ Bảng places đã sẵn sàng');

    // 3. Tạo bảng NARRATIONS (Bản thuyết minh đa ngôn ngữ & Audio)
    await connection.query(`
      CREATE TABLE IF NOT EXISTS narrations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        place_id VARCHAR(100) NOT NULL,
        language VARCHAR(10) NOT NULL,
        language_name VARCHAR(50) NOT NULL,
        flag VARCHAR(10) NOT NULL,
        voice_name VARCHAR(100) NOT NULL,
        audio_url TEXT NOT NULL,
        title VARCHAR(255) NOT NULL,
        narration_text LONGTEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (place_id) REFERENCES places(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('  ✔️ Bảng narrations đã sẵn sàng');

    // 4. Thêm tài khoản mẫu Admin và User
    const adminPasswordHash = await bcrypt.hash('admin123', 10);
    const touristPasswordHash = await bcrypt.hash('tourist123', 10);

    await connection.query(`
      INSERT IGNORE INTO users (id, email, password_hash, full_name, role)
      VALUES 
      (1, 'admin@audioguide.vn', ?, 'Trưởng Ban Quản Lý Di Tích', 'admin'),
      (2, 'tourist@gmail.com', ?, 'Trần Minh Khang (Du Khách)', 'user');
    `, [adminPasswordHash, touristPasswordHash]);
    console.log('  ✔️ Đã nạp tài khoản Admin & Khách Du Lịch mặc định');

    // 5. Thêm dữ liệu địa danh mẫu: Dinh Độc Lập
    await connection.query(`
      INSERT IGNORE INTO places (id, name, category, category_label, city, image_url, short_desc, history_text, opening_hours, ticket_price, total_listens)
      VALUES (
        'dinh-doc-lap',
        'Dinh Độc Lập (Hội trường Thống Nhất)',
        'ditich',
        'Di tích lịch sử',
        'TP. Hồ Chí Minh',
        'https://images.unsplash.com/photo-1583417319070-4a69db38a482?auto=format&fit=crop&w=1000&q=80',
        'Biểu tượng lịch sử trọng đại ghi dấu thời khắc non sông liền một dải ngày 30/4/1975.',
        'Dinh Độc Lập được xây dựng vào năm 1962 trên nền Dinh Norodom cũ do kiến trúc sư Ngô Viết Thụ thiết kế. Công trình là sự kết hợp hài hòa giữa kiến trúc hiện đại phương Tây và triết lý phong thủy Á Đông.',
        '08:00 - 16:30 hàng ngày',
        '40.000 VNĐ / người',
        14250
      );
    `);

    // Thêm bản thuyết minh mẫu cho Dinh Độc Lập (Tiếng Việt & Tiếng Anh)
    await connection.query(`
      INSERT IGNORE INTO narrations (id, place_id, language, language_name, flag, voice_name, audio_url, title, narration_text)
      VALUES 
      (
        1,
        'dinh-doc-lap',
        'vi',
        'Tiếng Việt',
        '🇻🇳',
        'Giọng Nam miền Nam (Truyền cảm)',
        'https://actions.google.com/sounds/v1/ambiences/daytime_forest_bonfire.ogg',
        'Thuyết minh Dinh Độc Lập',
        'Chào mừng quý khách đến với Dinh Độc Lập – Di tích quốc gia đặc biệt tại trung tâm Thành phố Hồ Chí Minh. Nơi đây từng là cơ quan đầu não của chính quyền Việt Nam Cộng hòa trước năm 1975.'
      ),
      (
        2,
        'dinh-doc-lap',
        'en',
        'English',
        '🇬🇧',
        'English (US - Natural Female)',
        'https://actions.google.com/sounds/v1/ambiences/daytime_forest_bonfire.ogg',
        'Independence Palace Audio Tour',
        'Welcome to the Independence Palace, also known as the Reunification Convention Hall. This iconic landmark stands as a powerful symbol of Vietnam modern history.'
      );
    `);
    console.log('  ✔️ Đã nạp dữ liệu địa danh mẫu vào MySQL');

    connection.release();
    console.log('🎉 Khởi tạo cơ sở dữ liệu MySQL THÀNH CÔNG RỰC RỠ!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Lỗi khi khởi tạo database:', err);
    process.exit(1);
  }
}

initDatabase();
