import { Router } from 'express';
import { findLocationWithPois } from './location.repository';
import { findPoiNarration, isSupportedLang } from './poi.repository';

/**
 * Module content (PRD 2.2 - giai đoạn 1, sau tách thành content-service).
 *
 * Phạm vi: địa danh, điểm tham quan, nội dung thuyết minh và file audio
 * (UC01, UC03, UC05, UC06, UC08, UC09, UC10); sở hữu các bảng
 * `locations`, `pois`, `poi_translations`.
 * Quy ước: KHÔNG import code từ `src/auth`; tự kiểm tra JWT bằng secret
 * dùng chung thay vì gọi sang auth.
 */
export const contentRouter = Router();

const ID_PATTERN = /^\d+$/;
const DEFAULT_LANG = 'vi';

// API02 - GET /api/content/locations/:id (UC01, UC06, UC10)
contentRouter.get('/locations/:id', async (req, res) => {
  const rawId = req.params.id;

  if (!ID_PATTERN.test(rawId)) {
    res.status(404).json({ message: 'Mã QR không hợp lệ' });
    return;
  }

  try {
    const location = await findLocationWithPois(Number(rawId));

    if (!location) {
      res.status(404).json({ message: 'Mã QR không hợp lệ' });
      return;
    }

    // Địa danh chưa có điểm nào vẫn trả 200 với pois: []
    res.status(200).json(location);
  } catch (error) {
    console.error('Lỗi API02 - lấy địa danh:', error);
    res.status(500).json({ message: 'Lỗi máy chủ' });
  }
});

// API03 - GET /api/content/pois/:id?lang=vi (UC03, UC05, UC10)
contentRouter.get('/pois/:id', async (req, res) => {
  const rawId = req.params.id;

  if (!ID_PATTERN.test(rawId)) {
    res.status(404).json({ message: 'Không tìm thấy điểm tham quan' });
    return;
  }

  const lang =
    typeof req.query.lang === 'string' && req.query.lang !== ''
      ? req.query.lang
      : DEFAULT_LANG;

  if (!isSupportedLang(lang)) {
    res.status(400).json({ message: 'Ngôn ngữ không được hỗ trợ' });
    return;
  }

  try {
    const narration = await findPoiNarration(Number(rawId), lang);

    if (!narration) {
      res.status(404).json({ message: 'Không tìm thấy điểm tham quan' });
      return;
    }

    res.status(200).json(narration);
  } catch (error) {
    console.error('Lỗi API03 - lấy nội dung điểm:', error);
    res.status(500).json({ message: 'Lỗi máy chủ' });
  }
});
