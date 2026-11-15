import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';

dotenv.config();

const env = {
  port: Number(process.env.PORT) || 5000,
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  authServiceUrl: process.env.AUTH_SERVICE_URL || 'http://localhost:3001',
  contentServiceUrl: process.env.CONTENT_SERVICE_URL || 'http://localhost:3002',
};

const app = express();

app.use(cors({ origin: env.corsOrigin }));

async function isServiceHealthy(serviceUrl: string): Promise<boolean> {
  try {
    const healthUrl = new URL('/api/health', serviceUrl);
    const response = await fetch(healthUrl, {
      signal: AbortSignal.timeout(3000),
    });

    if (!response.ok) return false;

    const body: unknown = await response.json();
    return (
      typeof body === 'object' &&
      body !== null &&
      'status' in body &&
      body.status === 'ok'
    );
  } catch (error) {
    console.error(`Không kiểm tra được health của ${serviceUrl}:`, error);
    return false;
  }
}

app.get('/api/health', async (_req, res) => {
  const [authHealthy, contentHealthy] = await Promise.all([
    isServiceHealthy(env.authServiceUrl),
    isServiceHealthy(env.contentServiceUrl),
  ]);
  const isHealthy = authHealthy && contentHealthy;

  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? 'ok' : 'error',
  });
});

function createServiceProxy(target: string, prefix: string) {
  return createProxyMiddleware({
    target,
    changeOrigin: true,
    pathFilter: (pathname) =>
      pathname === prefix || pathname.startsWith(`${prefix}/`),
  });
}

app.use(createServiceProxy(env.authServiceUrl, '/api/auth'));
app.use(createServiceProxy(env.contentServiceUrl, '/api/content'));
app.use(createServiceProxy(env.contentServiceUrl, '/uploads'));

app.listen(env.port, () => {
  console.log(`API Gateway đang chạy tại http://localhost:${env.port}`);
});
