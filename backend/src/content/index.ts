import { Router } from 'express';
import type { NextFunction, Request, Response } from 'express';
import { requireAdmin } from './auth.middleware';
import { findLocationWithPois } from './location.repository';
import {
  createPoi,
  deletePoiWithTranslations,
  findPoiById,
  findPoiNarration,
  findPoiTranslations,
  findTranslationContent,
  isDuplicateEntryError,
  isPoiNameTaken,
  isSupportedLang,
  locationExists,
  saveTranslation,
  updatePoi,
  type SupportedLang,
} from './poi.repository';
import { validatePoiCreate, validatePoiUpdate } from './poi.validation';
import { countPresence, isValidSessionId, recordPresence } from './presence';
import {
  commitAudioFile,
  discardAudioFile,
  receiveAudio,
  removeAudioFile,
} from './upload';

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

// Thư mục audio do module content quản lý, src/index.ts dùng để phục vụ tĩnh.
export { AUDIO_DIR, AUDIO_URL_PREFIX } from './upload';

const ID_PATTERN = /^\d+$/;
const DEFAULT_LANG = 'vi';

/** Tham số đường dẫn của Express 5 có thể là mảng; route ở đây chỉ dùng tham số đơn. */
function readParam(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? '';
  return value ?? '';
}

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

// API04 - POST /api/content/pois (UC08)
contentRouter.post('/pois', requireAdmin, async (req, res) => {
  const { input, errors } = validatePoiCreate(req.body);

  if (!input) {
    res.status(400).json({ message: 'Dữ liệu không hợp lệ', errors });
    return;
  }

  try {
    if (!(await locationExists(input.locationId))) {
      res.status(404).json({ message: 'Không tìm thấy địa danh' });
      return;
    }

    if (await isPoiNameTaken(input.locationId, input.name)) {
      res.status(409).json({ message: 'Tên điểm đã tồn tại' });
      return;
    }

    const poi = await createPoi(input);
    res.status(201).json(poi);
  } catch (error) {
    // Hai request đồng thời có thể cùng vượt bước kiểm tra trùng tên phía trên,
    // khi đó ràng buộc uq_pois_location_name mới là nơi báo lỗi.
    if (isDuplicateEntryError(error)) {
      res.status(409).json({ message: 'Tên điểm đã tồn tại' });
      return;
    }

    console.error('Lỗi API04 - thêm điểm tham quan:', error);
    res.status(500).json({ message: 'Lỗi máy chủ' });
  }
});

// API05 - PUT /api/content/pois/:id (UC08)
contentRouter.put('/pois/:id', requireAdmin, async (req, res) => {
  const rawId = readParam(req.params.id);

  if (!ID_PATTERN.test(rawId)) {
    res.status(404).json({ message: 'Không tìm thấy điểm tham quan' });
    return;
  }

  const { input, errors } = validatePoiUpdate(req.body);

  if (!input) {
    res.status(400).json({ message: 'Dữ liệu không hợp lệ', errors });
    return;
  }

  try {
    const existing = await findPoiById(Number(rawId));

    if (!existing) {
      res.status(404).json({ message: 'Không tìm thấy điểm tham quan' });
      return;
    }

    // Chỉ so trùng trong địa danh hiện tại của điểm và bỏ qua chính nó,
    // nhờ vậy giữ nguyên tên cũ thì không bị coi là trùng (PRD 3.3.8 - 6d).
    if (await isPoiNameTaken(existing.locationId, input.name, existing.id)) {
      res.status(409).json({ message: 'Tên điểm đã tồn tại' });
      return;
    }

    const poi = await updatePoi(existing.id, input);
    res.status(200).json(poi);
  } catch (error) {
    // Hai request đồng thời có thể cùng vượt bước kiểm tra trùng tên phía trên.
    if (isDuplicateEntryError(error)) {
      res.status(409).json({ message: 'Tên điểm đã tồn tại' });
      return;
    }

    console.error('Lỗi API05 - sửa điểm tham quan:', error);
    res.status(500).json({ message: 'Lỗi máy chủ' });
  }
});

// API06 - DELETE /api/content/pois/:id (UC08)
contentRouter.delete('/pois/:id', requireAdmin, async (req, res) => {
  const rawId = readParam(req.params.id);

  if (!ID_PATTERN.test(rawId)) {
    res.status(404).json({ message: 'Không tìm thấy điểm tham quan' });
    return;
  }

  try {
    const deleted = await deletePoiWithTranslations(Number(rawId));

    if (!deleted) {
      res.status(404).json({ message: 'Không tìm thấy điểm tham quan' });
      return;
    }

    // Chỉ dọn file sau khi CSDL đã xóa xong (PRD 5.2.3); file thiếu thì bỏ qua.
    await Promise.all(deleted.audioUrls.map((audioUrl) => removeAudioFile(audioUrl)));

    res.status(200).json({
      message: 'Đã xóa điểm tham quan',
      deletedTranslations: deleted.deletedTranslations,
    });
  } catch (error) {
    console.error('Lỗi API06 - xóa điểm tham quan:', error);
    res.status(500).json({ message: 'Lỗi máy chủ' });
  }
});

// API07 - GET /api/content/pois/:id/translations (UC09)
contentRouter.get('/pois/:id/translations', requireAdmin, async (req, res) => {
  const rawId = readParam(req.params.id);

  if (!ID_PATTERN.test(rawId)) {
    res.status(404).json({ message: 'Không tìm thấy điểm tham quan' });
    return;
  }

  try {
    if (!(await findPoiById(Number(rawId)))) {
      res.status(404).json({ message: 'Không tìm thấy điểm tham quan' });
      return;
    }

    // Luôn đủ 5 ngôn ngữ vi, en, zh, ko, ja; thiếu nội dung thì text/audioUrl = null.
    res.status(200).json(await findPoiTranslations(Number(rawId)));
  } catch (error) {
    console.error('Lỗi API07 - lấy nội dung điểm:', error);
    res.status(500).json({ message: 'Lỗi máy chủ' });
  }
});

/**
 * Kiểm tra tham số trước khi nhận file (API08): id và lang phải đúng ngay từ
 * đầu để không ghi file rác vào backend/uploads/audio.
 */
function validateTranslationTarget(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (!ID_PATTERN.test(readParam(req.params.id))) {
    res.status(404).json({ message: 'Không tìm thấy điểm tham quan' });
    return;
  }

  if (!isSupportedLang(readParam(req.params.lang))) {
    res.status(400).json({ message: 'Ngôn ngữ không được hỗ trợ' });
    return;
  }

  next();
}

/** Điểm phải tồn tại (404) trước khi nhận file, để không phải dọn file rác. */
async function ensurePoiExists(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const poi = await findPoiById(Number(readParam(req.params.id)));

    if (!poi) {
      res.status(404).json({ message: 'Không tìm thấy điểm tham quan' });
      return;
    }

    next();
  } catch (error) {
    console.error('Lỗi API08 - kiểm tra điểm tham quan:', error);
    res.status(500).json({ message: 'Lỗi máy chủ' });
  }
}

// API08 - PUT /api/content/pois/:id/translations/:lang (UC09)
contentRouter.put(
  '/pois/:id/translations/:lang',
  requireAdmin,
  validateTranslationTarget,
  ensurePoiExists,
  receiveAudio,
  async (req, res) => {
    const poiId = Number(readParam(req.params.id));
    // Lang đã được kiểm tra trong validateTranslationTarget.
    const lang = readParam(req.params.lang) as SupportedLang;
    const body = (req.body ?? {}) as { text?: unknown };
    const text = typeof body.text === 'string' ? body.text.trim() : '';

    if (text === '') {
      // Văn bản bắt buộc, kể cả khi Admin đã chọn file (PRD 3.3.9 - 6a).
      await discardAudioFile(req);
      res.status(400).json({ message: 'Vui lòng nhập nội dung thuyết minh' });
      return;
    }

    try {
      const existing = await findTranslationContent(poiId, lang);

      // Có file mới thì đổi tên thành poi<id>-<lang>.mp3, ghi đè file cũ.
      const uploadedAudioUrl = req.file
        ? await commitAudioFile(req, poiId, lang)
        : null;

      // uploadedAudioUrl = null: giữ nguyên audio cũ trong CSDL.
      await saveTranslation(poiId, lang, text, uploadedAudioUrl);

      res.status(200).json({
        poiId,
        lang,
        text,
        audioUrl: uploadedAudioUrl ?? existing?.audioUrl ?? null,
        overwritten: existing !== null,
      });
    } catch (error) {
      console.error('Lỗi API08 - lưu nội dung thuyết minh:', error);
      await discardAudioFile(req);
      res.status(500).json({ message: 'Lỗi máy chủ' });
    }
  }
);

// API10 - POST /api/content/presence (công khai, không cần đăng nhập)
contentRouter.post('/presence', (req, res) => {
  const body = (req.body ?? {}) as { sessionId?: unknown };

  if (!isValidSessionId(body.sessionId)) {
    res.status(400).json({ message: 'Mã phiên không hợp lệ' });
    return;
  }

  // Không trả nội dung: Web Client chỉ cần biết là đã ghi nhận.
  recordPresence(body.sessionId);
  res.status(204).end();
});

// API11 - GET /api/content/presence/count (chỉ Admin, PRD 2.7.1)
contentRouter.get('/presence/count', requireAdmin, (_req, res) => {
  res.status(200).json(countPresence());
});
