import express from 'express';
import { env } from './config/env';
import { pingDatabase } from './config/database';
import { authRouter } from './auth';

const app = express();

app.use(express.json());
app.use('/api/auth', authRouter);

app.get('/api/health', async (_req, res) => {
  const isHealthy = await pingDatabase();
  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? 'ok' : 'error',
  });
});

app.listen(env.port, () => {
  console.log(`Auth service đang chạy tại http://localhost:${env.port}`);
});
