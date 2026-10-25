-- ============================================================
-- Dữ liệu mẫu tối thiểu (chạy sau schema.sql)
-- 1 địa danh: Dinh Độc Lập
-- 3 điểm tham quan kèm nội dung thuyết minh tiếng Việt (chưa có audio)
-- 1 tài khoản admin: admin / matkhau123 (mật khẩu đã băm bằng bcrypt)
-- Idempotent: chạy lại nhiều lần không sinh bản ghi trùng.
-- ============================================================

USE narration_db;

-- Ép client dùng UTF-8, tránh lỗi tiếng Việt khi import bằng client mặc định latin1 (container)
SET NAMES utf8mb4;

INSERT INTO locations (id, name, description)
VALUES (
  1,
  'Dinh Độc Lập',
  'Di tích lịch sử quốc gia đặc biệt tại Quận 1, TP. Hồ Chí Minh. Nơi ghi dấu sự kiện 30/4/1975.'
)
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  description = VALUES(description);

-- 3 điểm tham quan mẫu cho địa danh 1 (dùng cho bản demo Web Client)
INSERT INTO pois (location_id, name, latitude, longitude, radius_m, order_index)
VALUES
  (1, 'Cổng chính Dinh Độc Lập', 10.7771000, 106.6956000, 10, 1),
  (1, 'Phòng khánh tiết', 10.7769000, 106.6952000, 10, 2),
  (1, 'Khu trưng bày xe tăng 390', 10.7774000, 106.6958000, 10, 3)
ON DUPLICATE KEY UPDATE
  latitude = VALUES(latitude),
  longitude = VALUES(longitude),
  radius_m = VALUES(radius_m),
  order_index = VALUES(order_index);

-- Nội dung thuyết minh tiếng Việt ngắn, chưa có audio (audio_url để NULL)
INSERT INTO poi_translations (poi_id, lang, narration_text)
SELECT id, 'vi', 'Cổng chính Dinh Độc Lập mở ra con đường Nam Kỳ Khởi Nghĩa. Đây là nơi du khách bắt đầu hành trình tham quan di tích và cảm nhận kiến trúc độc đáo của công trình.'
  FROM pois WHERE location_id = 1 AND name = 'Cổng chính Dinh Độc Lập'
ON DUPLICATE KEY UPDATE narration_text = VALUES(narration_text);

INSERT INTO poi_translations (poi_id, lang, narration_text)
SELECT id, 'vi', 'Phòng khánh tiết là nơi diễn ra các nghi lễ tiếp khách của chính quyền. Căn phòng được bày trí trang trọng, gắn với nhiều sự kiện quan trọng trong lịch sử Việt Nam.'
  FROM pois WHERE location_id = 1 AND name = 'Phòng khánh tiết'
ON DUPLICATE KEY UPDATE narration_text = VALUES(narration_text);

INSERT INTO poi_translations (poi_id, lang, narration_text)
SELECT id, 'vi', 'Chiếc xe tăng 390 đã húc đổ cổng Dinh Độc Lập trưa ngày 30/4/1975, đánh dấu thời khắc kết thúc chiến tranh. Hiện vật được bảo quản và trưng bày ngay trong khuôn viên dinh.'
  FROM pois WHERE location_id = 1 AND name = 'Khu trưng bày xe tăng 390'
ON DUPLICATE KEY UPDATE narration_text = VALUES(narration_text);

INSERT INTO admins (username, password_hash)
VALUES (
  'admin',
  '$2b$10$OuLj/8mWTnJXjfRkJzjYPeH7qaRIOzt.YJ2XDMJIYg6wU.saqUwTi'
)
ON DUPLICATE KEY UPDATE
  password_hash = VALUES(password_hash);
