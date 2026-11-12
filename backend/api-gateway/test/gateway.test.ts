import assert from 'node:assert/strict';
import { once } from 'node:events';
import { spawn, type ChildProcess } from 'node:child_process';
import {
  createServer,
  type IncomingMessage,
  type Server,
  type ServerResponse,
} from 'node:http';
import path from 'node:path';
import { after, before, describe, it } from 'node:test';

let contentHealthy = true;
let authServer: Server | undefined;
let contentServer: Server | undefined;
let gatewayProcess: ChildProcess | undefined;
let gatewayUrl: string;

function getPort(server: Server): number {
  const address = server.address();
  if (!address || typeof address === 'string') {
    throw new Error('Không lấy được cổng test server');
  }
  return address.port;
}

async function listen(server: Server): Promise<number> {
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  return getPort(server);
}

async function close(server: Server | undefined): Promise<void> {
  if (!server?.listening) return;
  await new Promise<void>((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
}

function echoService(healthy: () => boolean): Server {
  return createServer((req: IncomingMessage, res: ServerResponse) => {
    if (req.url === '/api/health') {
      const isHealthy = healthy();
      res.writeHead(isHealthy ? 200 : 503, {
        'content-type': 'application/json',
      });
      res.end(JSON.stringify({ status: isHealthy ? 'ok' : 'error' }));
      return;
    }

    const chunks: Buffer[] = [];
    req.on('data', (chunk: Buffer) => chunks.push(chunk));
    req.on('end', () => {
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(
        JSON.stringify({
          method: req.method,
          url: req.url,
          body: Buffer.concat(chunks).toString('utf8'),
        })
      );
    });
  });
}

async function reservePort(): Promise<number> {
  const server = createServer();
  const port = await listen(server);
  await close(server);
  return port;
}

async function waitForGateway(): Promise<void> {
  for (let attempt = 0; attempt < 50; attempt++) {
    try {
      const response = await fetch(`${gatewayUrl}/api/health`);
      if (response.status === 200) return;
    } catch {
      // The gateway may not have finished listening yet.
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error('Gateway không sẵn sàng sau 5 giây');
}

before(async () => {
  contentHealthy = true;
  authServer = echoService(() => true);
  contentServer = echoService(() => contentHealthy);
  const authPort = await listen(authServer);
  const contentPort = await listen(contentServer);
  const gatewayPort = await reservePort();
  gatewayUrl = `http://127.0.0.1:${gatewayPort}`;

  gatewayProcess = spawn(process.execPath, ['dist/index.js'], {
    cwd: path.resolve('.'),
    env: {
      ...process.env,
      PORT: String(gatewayPort),
      CORS_ORIGIN: 'http://localhost:5173',
      AUTH_SERVICE_URL: `http://127.0.0.1:${authPort}`,
      CONTENT_SERVICE_URL: `http://127.0.0.1:${contentPort}`,
    },
    stdio: 'ignore',
  });

  await waitForGateway();
});

after(async () => {
  if (gatewayProcess && gatewayProcess.exitCode === null) {
    const exited = once(gatewayProcess, 'exit');
    gatewayProcess.kill();
    await exited;
  }
  await Promise.all([close(authServer), close(contentServer)]);
});

describe('API Gateway', () => {
  it('proxy giữ nguyên API paths, query, JSON và multipart body', async () => {
    const authPayload = '{"username":"admin"}';
    const authResponse = await fetch(
      `${gatewayUrl}/api/auth/login?source=test`,
      {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          origin: 'http://localhost:5173',
        },
        body: authPayload,
      }
    );
    assert.equal(
      authResponse.headers.get('access-control-allow-origin'),
      'http://localhost:5173'
    );
    const authResult = (await authResponse.json()) as {
      url: string;
      body: string;
    };
    assert.equal(authResult.url, '/api/auth/login?source=test');
    assert.equal(authResult.body, authPayload);

    const contentPayload = '{"locationId":1}';
    const contentResponse = await fetch(
      `${gatewayUrl}/api/content/pois?lang=vi`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: contentPayload,
      }
    );
    const contentResult = (await contentResponse.json()) as {
      url: string;
      body: string;
    };
    assert.equal(contentResult.url, '/api/content/pois?lang=vi');
    assert.equal(contentResult.body, contentPayload);

    const multipartBody =
      '--test-boundary\r\nContent-Disposition: form-data; name="audio"; filename="sample.mp3"\r\nContent-Type: audio/mpeg\r\n\r\ntest-audio-bytes\r\n--test-boundary--\r\n';
    const uploadResponse = await fetch(
      `${gatewayUrl}/uploads/audio/sample.mp3`,
      {
        method: 'PUT',
        headers: {
          'content-type': 'multipart/form-data; boundary=test-boundary',
        },
        body: multipartBody,
      }
    );
    const uploadResult = (await uploadResponse.json()) as {
      url: string;
      body: string;
    };
    assert.equal(uploadResult.url, '/uploads/audio/sample.mp3');
    assert.equal(uploadResult.body, multipartBody);
  });

  it('health chỉ trả 200 khi cả hai service khỏe', async () => {
    const healthy = await fetch(`${gatewayUrl}/api/health`);
    assert.equal(healthy.status, 200);
    assert.deepEqual(await healthy.json(), { status: 'ok' });

    contentHealthy = false;
    const unhealthy = await fetch(`${gatewayUrl}/api/health`);
    assert.equal(unhealthy.status, 503);
    assert.deepEqual(await unhealthy.json(), { status: 'error' });
  });
});
