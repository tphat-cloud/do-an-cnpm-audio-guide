import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { once } from 'node:events';
import type { Server } from 'node:http';
import { after, before, describe, it } from 'node:test';
import bcrypt from 'bcryptjs';
import express from 'express';
import jwt from 'jsonwebtoken';
import type { RowDataPacket } from 'mysql2';
import { pool } from '../src/config/database';
import { env } from '../src/config/env';
import { authRouter } from '../src/auth';

interface AdminLoginState extends RowDataPacket {
  failed_attempts: number;
  locked_until: Date | string | null;
}

const username = `mysql_it_${randomUUID().replaceAll('-', '')}`;
const password = 'integration-test-password';
let baseUrl: string;
let server: Server;

async function postLogin(body: unknown): Promise<Response> {
  return fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

before(async () => {
  const passwordHash = await bcrypt.hash(password, 4);
  await pool.execute(
    'INSERT INTO admins (username, password_hash) VALUES (?, ?)',
    [username, passwordHash]
  );

  const app = express();
  app.use(express.json());
  app.use('/api/auth', authRouter);
  server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');

  const address = server.address();
  if (!address || typeof address === 'string') {
    throw new Error('Could not determine auth integration-test port');
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
    await pool.execute('DELETE FROM admins WHERE username = ?', [username]);
  } finally {
    await pool.end();
  }
});

describe('Auth service with MySQL', () => {
  it('authenticates against MySQL and persists the five-failure lockout', async () => {
    const validLogin = await postLogin({ username, password });
    assert.equal(validLogin.status, 200);

    const validBody = (await validLogin.json()) as {
      token: string;
      expiresIn: number;
      admin: { id: number; username: string };
    };
    assert.equal(validBody.expiresIn, 3600);
    assert.equal(validBody.admin.username, username);

    const claims = jwt.verify(validBody.token, env.jwtSecret);
    assert.equal(typeof claims, 'object');
    if (typeof claims === 'string') {
      throw new Error('JWT payload is invalid');
    }
    assert.equal(claims.sub, String(validBody.admin.id));

    const invalidBeforeSuccess = await postLogin({
      username,
      password: 'incorrect-password',
    });
    assert.equal(invalidBeforeSuccess.status, 401);

    const validAfterFailure = await postLogin({ username, password });
    assert.equal(validAfterFailure.status, 200);

    const [resetRows] = await pool.query<AdminLoginState[]>(
      'SELECT failed_attempts, locked_until FROM admins WHERE username = ?',
      [username]
    );
    assert.equal(resetRows[0]?.failed_attempts, 0);
    assert.equal(resetRows[0]?.locked_until, null);

    for (let attempt = 1; attempt <= 4; attempt++) {
      const response = await postLogin({
        username,
        password: 'incorrect-password',
      });
      assert.equal(response.status, 401);
    }

    const fifthAttempt = await postLogin({
      username,
      password: 'incorrect-password',
    });
    assert.equal(fifthAttempt.status, 429);

    const [lockedRows] = await pool.query<AdminLoginState[]>(
      'SELECT failed_attempts, locked_until FROM admins WHERE username = ?',
      [username]
    );
    assert.equal(lockedRows[0]?.failed_attempts, 5);
    assert.ok(lockedRows[0]?.locked_until);

    const validWhileLocked = await postLogin({ username, password });
    assert.equal(validWhileLocked.status, 429);
  });
});
