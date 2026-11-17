import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { once } from 'node:events';
import type { Server } from 'node:http';
import { after, before, describe, it } from 'node:test';
import express from 'express';
import jwt from 'jsonwebtoken';
import { pool } from '../src/config/database';
import { env } from '../src/config/env';
import { contentRouter } from '../src/content';

const token = jwt.sign(
  { sub: '1', username: 'admin', role: 'admin' },
  env.jwtSecret,
  { expiresIn: '5m' }
);
const poiName = `MySQL integration ${randomUUID()}`;
const updatedPoiName = `${poiName} updated`;
const sessionId = `it_${randomUUID().replaceAll('-', '')}`;
let baseUrl: string;
let server: Server;

async function sendJson(
  path: string,
  method: string,
  body?: unknown,
  authorization?: string
): Promise<Response> {
  const headers: Record<string, string> = {};
  if (body !== undefined) headers['content-type'] = 'application/json';
  if (authorization) headers.authorization = `Bearer ${authorization}`;

  return fetch(`${baseUrl}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

before(async () => {
  const app = express();
  app.use(express.json());
  app.use('/api/content', contentRouter);
  server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');

  const address = server.address();
  if (!address || typeof address === 'string') {
    throw new Error('Could not determine content integration-test port');
  }
  baseUrl = `http://127.0.0.1:${address.port}`;
});

after(async () => {
  if (server) {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }

  try {
    await pool.execute(
      'DELETE FROM pois WHERE location_id = ? AND name IN (?, ?)',
      [1, poiName, updatedPoiName]
    );
    await pool.execute('DELETE FROM visitor_sessions WHERE session_id = ?', [
      sessionId,
    ]);
  } finally {
    await pool.end();
  }
});

describe('Content service with MySQL', () => {
  it('reads seeded translations, persists POI changes, and records presence', async () => {
    const locationResponse = await fetch(
      `${baseUrl}/api/content/locations/1?lang=en`
    );
    assert.equal(locationResponse.status, 200);
    const location = (await locationResponse.json()) as {
      name: string;
      pois: Array<{ id: number; name: string }>;
    };
    assert.equal(location.name, 'Independence Palace');
    assert.equal(location.pois.length, 3);

    const createdResponse = await sendJson(
      '/api/content/pois',
      'POST',
      {
        locationId: 1,
        name: poiName,
        latitude: 10.7772,
        longitude: 106.6957,
        radiusM: 12,
        orderIndex: 4,
      },
      token
    );
    assert.equal(createdResponse.status, 201);
    const created = (await createdResponse.json()) as {
      id: number;
      name: string;
      radiusM: number;
    };
    assert.equal(created.name, poiName);
    assert.equal(created.radiusM, 12);

    const updatedResponse = await sendJson(
      `/api/content/pois/${created.id}`,
      'PUT',
      {
        name: updatedPoiName,
        latitude: 10.7773,
        longitude: 106.6958,
        radiusM: 14,
        orderIndex: 5,
      },
      token
    );
    assert.equal(updatedResponse.status, 200);
    const updated = (await updatedResponse.json()) as {
      name: string;
      radiusM: number;
    };
    assert.equal(updated.name, updatedPoiName);
    assert.equal(updated.radiusM, 14);

    const presenceResponse = await sendJson('/api/content/presence', 'POST', {
      sessionId,
    });
    assert.equal(presenceResponse.status, 204);

    const countResponse = await sendJson(
      '/api/content/presence/count',
      'GET',
      undefined,
      token
    );
    assert.equal(countResponse.status, 200);
    assert.deepEqual(await countResponse.json(), {
      activeSessions: 1,
      totalSessions: 1,
    });

    const deletedResponse = await sendJson(
      `/api/content/pois/${created.id}`,
      'DELETE',
      undefined,
      token
    );
    assert.equal(deletedResponse.status, 200);
  });
});
