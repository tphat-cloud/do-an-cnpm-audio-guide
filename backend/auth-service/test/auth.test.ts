import assert from 'node:assert/strict';
import { once } from 'node:events';
import type { Server } from 'node:http';
import { after, before, beforeEach, describe, it } from 'node:test';
import bcrypt from 'bcryptjs';
import express from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../src/config/env';
import { pool } from '../src/config/database';
import { authRouter } from '../src/auth';

interface FakeAdmin {
  id: number;
  username: string;
  password_hash: string;
  failed_attempts: number;
  locked_until: Date | null;
}

const adminPasswordHash = bcrypt.hashSync('matkhau123', 4);
let fakeAdmin: FakeAdmin;
let baseUrl: string;
let server: Server;

function resetFakeDatabase(): void {
  fakeAdmin = {
    id: 1,
    username: 'admin',
    password_hash: adminPasswordHash,
    failed_attempts: 0,
    locked_until: null,
  };
}

type MockQuery = (
  sql: string,
  params?: unknown[]
) => Promise<[unknown, unknown]>;

function installDatabaseMock(): void {
  const handleQuery: MockQuery = async (sql, params = []) => {
    const normalized = sql.replace(/\s+/g, ' ').trim();

    if (
      normalized.startsWith(
        'SELECT id, username, password_hash, failed_attempts, locked_until'
      )
    ) {
      const username = String(params[0] ?? '');
      if (username !== fakeAdmin.username) return [[], []];

      const remainingSeconds =
        fakeAdmin.locked_until !== null
          ? Math.floor((fakeAdmin.locked_until.getTime() - Date.now()) / 1000)
          : null;

      return [
        [
          {
            ...fakeAdmin,
            lock_remaining_seconds: remainingSeconds,
          },
        ],
        [],
      ];
    }

    if (
      normalized.startsWith(
        'UPDATE admins SET failed_attempts = 0, locked_until = NULL'
      )
    ) {
      fakeAdmin.failed_attempts = 0;
      fakeAdmin.locked_until = null;
      return [{ affectedRows: 1 }, []];
    }

    if (normalized.startsWith('UPDATE admins SET failed_attempts = ?')) {
      const attempts = Number(params[0]);
      const maxAttempts = Number(params[2]);
      fakeAdmin.failed_attempts = attempts;
      fakeAdmin.locked_until =
        attempts >= maxAttempts ? new Date(Date.now() + 5 * 60 * 1000) : null;
      return [{ affectedRows: 1 }, []];
    }

    throw new Error(`Câu SQL chưa được mock trong test: ${normalized}`);
  };

  Object.defineProperty(pool, 'getConnection', {
    configurable: true,
    value: async () => ({
      beginTransaction: async () => {},
      commit: async () => {},
      rollback: async () => {},
      release: () => {},
      query: handleQuery,
      execute: handleQuery,
    }),
  });
}

async function postLogin(body: unknown): Promise<Response> {
  return fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

before(async () => {
  installDatabaseMock();
  resetFakeDatabase();

  const app = express();
  app.use(express.json());
  app.use('/api/auth', authRouter);
  server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');

  const address = server.address();
  if (!address || typeof address === 'string') {
    throw new Error('Không lấy được cổng test auth-service');
  }
  baseUrl = `http://127.0.0.1:${address.port}`;
});

after(async () => {
  if (server) {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});

beforeEach(resetFakeDatabase);

describe('Auth service - POST /api/auth/login (API01)', () => {
  it('trả 400 khi thiếu username hoặc password', async () => {
    const response = await postLogin({ username: 'admin', password: '' });

    assert.equal(response.status, 400);
    assert.deepEqual(await response.json(), {
      message: 'Vui lòng nhập đầy đủ',
    });
  });

  it('đăng nhập đúng và cấp JWT có thời hạn 3600 giây', async () => {
    const response = await postLogin({
      username: 'admin',
      password: 'matkhau123',
    });

    assert.equal(response.status, 200);
    const body = (await response.json()) as {
      token: string;
      expiresIn: number;
      admin: { id: number; username: string };
    };
    assert.equal(body.expiresIn, 3600);
    assert.deepEqual(body.admin, { id: 1, username: 'admin' });

    const claims = jwt.verify(body.token, env.jwtSecret);
    assert.equal(typeof claims, 'object');
    if (typeof claims === 'string') {
      throw new Error('JWT payload không hợp lệ');
    }
    assert.equal(claims.sub, '1');
    assert.equal(claims.username, 'admin');
  });

  it('khóa tài khoản sau 5 lần sai và tiếp tục từ chối đăng nhập', async () => {
    for (let attempt = 1; attempt <= 4; attempt++) {
      const response = await postLogin({
        username: 'admin',
        password: 'sai_mat_khau',
      });
      assert.equal(response.status, 401);
    }

    const fifthAttempt = await postLogin({
      username: 'admin',
      password: 'sai_mat_khau',
    });
    assert.equal(fifthAttempt.status, 429);
    assert.deepEqual(await fifthAttempt.json(), {
      message: 'Đăng nhập sai quá nhiều lần, vui lòng thử lại sau',
      retryAfterSeconds: 300,
    });

    const correctPasswordWhileLocked = await postLogin({
      username: 'admin',
      password: 'matkhau123',
    });
    assert.equal(correctPasswordWhileLocked.status, 429);
  });
});
