import fs from 'node:fs';
import path from 'node:path';
import type { NextFunction, Request, Response } from 'express';
import multer from 'multer';

/**
 * Nhận file audio thuyết minh (PRD 2.7.3, 6.1, 6.2 - API08).
 *
 * File nằm ngoài `src`, cạnh thư mục `database`: backend/uploads/audio/
 * và được phục vụ tĩnh tại /uploads/audio/<tên file>.
 */

/** Thư mục lưu audio; tính từ file này nên chạy bằng tsx hay bản build đều đúng. */
export const AUDIO_DIR = path.resolve(__dirname, '..', '..', 'uploads', 'audio');

/** Tiền tố URL công khai, ghép vào cột `audio_url` của bảng poi_translations. */
export const AUDIO_URL_PREFIX = '/uploads/audio';

/** Giới hạn dung lượng theo PRD 2.7.3: tối đa 10 MB. */
const MAX_AUDIO_BYTES = 10 * 1024 * 1024;

const MP3_EXTENSION = '.mp3';

// Tạo sẵn thư mục để multer không lỗi ở lần tải file đầu tiên.
fs.mkdirSync(AUDIO_DIR, { recursive: true });

/** Lỗi nội bộ khi file không phải .mp3 -> trả 415 thay vì 500. */
class AudioTypeError extends Error {
  constructor() {
    super('Chỉ chấp nhận file .mp3');
    this.name = 'AudioTypeError';
  }
}

/**
 * Đặt tên tạm cho file vừa nhận. Chỉ đổi sang tên chính thức sau khi dữ liệu
 * hợp lệ, nhờ vậy không làm mất audio cũ khi request bị từ chối.
 */
function buildTempFileName(originalName: string): string {
  const unique = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  const extension = path.extname(originalName).toLowerCase();
  return `tmp-${unique}${extension === MP3_EXTENSION ? extension : MP3_EXTENSION}`;
}

const uploader = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, callback) => {
      callback(null, AUDIO_DIR);
    },
    filename: (_req, file, callback) => {
      callback(null, buildTempFileName(file.originalname));
    },
  }),
  limits: { fileSize: MAX_AUDIO_BYTES, files: 1 },
  fileFilter: (_req, file, callback) => {
    // Kiểm tra đuôi file: một số trình duyệt gửi .mp3 với MIME application/octet-stream.
    if (path.extname(file.originalname).toLowerCase() !== MP3_EXTENSION) {
      callback(new AudioTypeError());
      return;
    }

    callback(null, true);
  },
});

/** Middleware đọc multipart/form-data, field `audio` không bắt buộc. */
export function receiveAudio(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  uploader.single('audio')(req, res, (error: unknown) => {
    if (!error) {
      next();
      return;
    }

    if (error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE') {
      res.status(413).json({ message: 'File quá lớn, tối đa 10 MB' });
      return;
    }

    if (error instanceof AudioTypeError) {
      res.status(415).json({ message: 'Chỉ chấp nhận file .mp3' });
      return;
    }

    console.error('Lỗi API08 - tải file audio:', error);
    res.status(500).json({ message: 'Lỗi máy chủ' });
  });
}

/**
 * Đổi tên file tạm thành poi<id>-<lang>.mp3 rồi trả về đường dẫn công khai.
 * Ghi đè đúng file cũ để mỗi ngôn ngữ của một điểm chỉ có một file audio.
 */
export async function commitAudioFile(
  req: Request,
  poiId: number,
  lang: string
): Promise<string> {
  const file = req.file;

  if (!file) {
    throw new Error('Không tìm thấy file audio vừa tải lên');
  }

  const finalName = `poi${poiId}-${lang}${MP3_EXTENSION}`;
  await fs.promises.rename(file.path, path.join(AUDIO_DIR, finalName));

  return `${AUDIO_URL_PREFIX}/${finalName}`;
}

/** Xóa file tạm khi request bị từ chối, tránh để lại file rác. */
export async function discardAudioFile(req: Request): Promise<void> {
  if (!req.file) return;

  await fs.promises.unlink(req.file.path).catch((error: unknown) => {
    console.error('Không xóa được file audio tạm:', error);
  });
}
