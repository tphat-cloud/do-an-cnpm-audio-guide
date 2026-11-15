import express from 'express';
import { env } from './config/env';
import { pingDatabase } from './config/database';
import {
  AUDIO_DIR,
  AUDIO_URL_PREFIX,
  contentRouter,
  pruneOldSessions,
} from './content';

const PRESENCE_CLEANUP_INTERVAL_MS = 24 * 60 * 60 * 1000;

const app = express();

app.use(express.json());
app.use(AUDIO_URL_PREFIX, express.static(AUDIO_DIR));
app.use('/api/content', contentRouter);

app.get('/api/health', async (_req, res) => {
  const isHealthy = await pingDatabase();
  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? 'ok' : 'error',
  });
});

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
  console.log(`Content service đang chạy tại http://localhost:${env.port}`);
  schedulePresenceCleanup();
});
