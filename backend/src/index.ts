import express from 'express';
import cors from 'cors';
import { env } from './config/env';
import { pingDatabase } from './config/database';
import { authRouter } from './auth';
import { AUDIO_DIR, AUDIO_URL_PREFIX, contentRouter } from './content';

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

app.listen(env.port, () => {
  console.log(`Backend đang chạy tại http://localhost:${env.port}`);
});
