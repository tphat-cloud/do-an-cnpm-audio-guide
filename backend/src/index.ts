import express from 'express';
import cors from 'cors';
import { env } from './config/env';
import { pingDatabase } from './config/database';
import { authRouter } from './auth';
import { contentRouter } from './content';

const app = express();

app.use(cors());
app.use(express.json());

// Gắn module theo tiền tố service (PRD 2.2): /api/auth/..., /api/content/...
// Hiện hai router còn rỗng, chưa có route nào.
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
