import express from 'express';
import cors from 'cors';
import { env } from './config/env';
import { pingDatabase } from './config/database';
import { authRouter } from './auth';
import { AUDIO_DIR, AUDIO_URL_PREFIX, contentRouter, pruneOldSessions } from './content';

/** Chu kỳ dọn phiên truy cập cũ: 1 ngày. */
const PRESENCE_CLEANUP_INTERVAL_MS = 24 * 60 * 60 * 1000;

const app = express();

// Chỉ cho Web Client (Vite) gọi API, kèm header cho preflight của request multipart/mọi method.
app.use(cors({ origin: env.corsOrigin }));
app.use(express.json());

// File audio thuyết minh phục vụ tĩnh (PRD 6.1): /uploads/audio/poi5-en.mp3
app.use(AUDIO_URL_PREFIX, express.static(AUDIO_DIR));

// Gắn module theo tiền tố service (PRD 2.2): /api/auth/..., /api/content/...
app.use('/api/auth', authRouter);
app.use('/api/content', contentRouter);

// API09 - GET /api/health: 200 nếu MySQL OK, 503 nếu lỗi kết nối
app.get('/api/health', async (_req, res) => {
  const isHealthy = await pingDatabase();
  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? 'ok' : 'error',
  });
});

/**
 * Dọn phiên truy cập cũ (bảng visitor_sessions) một lần lúc khởi động, sau đó
 * mỗi ngày. Lỗi chỉ ghi log: dọn dẹp không được làm gián đoạn API.
 */
function schedulePresenceCleanup(): void {
  const run = (): void => {
    void pruneOldSessions()
      .then((deleted) => {
        if (deleted > 0) {
          console.log(`Đã dọn ${deleted} phiên truy cập cũ`);
        }
      })
      .catch((error) => {
        console.error('Lỗi dọn phiên truy cập cũ:', error);
      });
  };

  run();
  setInterval(run, PRESENCE_CLEANUP_INTERVAL_MS);
}

app.listen(env.port, () => {
  console.log(`Backend đang chạy tại http://localhost:${env.port}`);
  schedulePresenceCleanup();
});
