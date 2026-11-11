import assert from 'node:assert/strict';
import { IncomingMessage, ServerResponse } from 'node:http';
import { Socket } from 'node:net';
import { before, beforeEach, describe, it } from 'node:test';
import bcrypt from 'bcryptjs';
import express, { type Express } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { pool } from '../config/database';
import { authRouter } from '../auth';
import { contentRouter } from '../content';
import { validatePoiCreate, validatePoiUpdate } from '../content/poi.validation';

/**
 * Bộ kiểm thử tự động cho Backend API (Task B3 - PRD 4.5.1):
 * 1. Kiểm tra dữ liệu đầu vào POI (validatePoiCreate, validatePoiUpdate)
 * 2. Xác thực & khóa tài khoản sau 5 lần đăng nhập sai (API01 - UC07)
 * 3. Lấy địa danh, thuyết minh & cơ chế Fallback về tiếng Việt (API02, API03)
 * 4. Quản lý điểm tham quan POI CRUD + phân quyền JWT (API04, API05, API06)
 * 5. Quản lý bản dịch & đếm lượt truy cập (API07, API10, API11)
 *
 * Giả lập (mock) tầng kết nối MySQL (`pool`) bằng dữ liệu trên bộ nhớ để:
 * - Chạy độc lập trong < 1 giây, không phụ thuộc MySQL đang bật hay tắt.
 * - Sẵn sàng chạy tự động trên GitHub Actions CI (Task B4).
 */

interface FakePoi {
  id: number;
  location_id: number;
  name: string;
  latitude: string;
  longitude: string;
  radius_m: number;
  order_index: number;
}

interface FakeTranslation {
  poi_id: number;
  lang: 'vi' | 'en' | 'zh' | 'ko' | 'ja';
  name: string | null;
  narration_text: string;
  audio_url: string | null;
}

interface FakeAdmin {
  id: number;
  username: string;
  password_hash: string;
  failed_attempts: number;
  locked_until: Date | null;
}

// Đảm bảo có JWT_SECRET cố định khi chạy môi trường test
env.jwtSecret = 'test_jwt_secret_key_for_automated_testing_2026';

const ADMIN_PASS_HASH = bcrypt.hashSync('matkhau123', 4);

let fakeAdmin: FakeAdmin;
let fakePois: FakePoi[];
let fakeTranslations: FakeTranslation[];
let fakeSessions: Map<string, Date>;
let nextPoiId = 10;

function resetFakeDatabase(): void {
  fakeAdmin = {
    id: 1,
    username: 'admin',
    password_hash: ADMIN_PASS_HASH,
    failed_attempts: 0,
    locked_until: null,
  };

  fakePois = [
    {
      id: 1,
      location_id: 1,
      name: 'Cổng chính Dinh Độc Lập',
      latitude: '10.7774000',
      longitude: '106.6954000',
      radius_m: 10,
      order_index: 1,
    },
    {
      id: 2,
      location_id: 1,
      name: 'Phòng khánh tiết',
      latitude: '10.7770000',
      longitude: '106.6956500',
      radius_m: 15,
      order_index: 2,
    },
  ];

  fakeTranslations = [
    {
      poi_id: 1,
      lang: 'vi',
      name: 'Cổng chính Dinh Độc Lập',
      narration_text: 'Chào mừng quý khách đến với Cổng chính Dinh Độc Lập.',
      audio_url: '/uploads/audio/poi1-vi.mp3',
    },
    {
      poi_id: 1,
      lang: 'en',
      name: 'Independence Palace Main Gate',
      narration_text: 'Welcome to the Main Gate of Independence Palace.',
      audio_url: '/uploads/audio/poi1-en.mp3',
    },
  ];

  fakeSessions = new Map<string, Date>();
  nextPoiId = 10;
}

/** Cài đặt mock cho `pool.query` và `pool.getConnection` theo đúng các câu SQL của repository. */
function installDatabaseMock(): void {
  const handleQuery = async (sql: string, params: unknown[] = []): Promise<[unknown, unknown]> => {
    const normalized = sql.replace(/\s+/g, ' ').trim();

    // --- Bảng admins (admin.repository.ts) ---
    if (normalized.startsWith('SELECT id, username, password_hash, failed_attempts, locked_until')) {
      const username = String(params[0] ?? '');
      if (username !== fakeAdmin.username) {
        return [[], []];
      }
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

    if (normalized.startsWith('UPDATE admins SET failed_attempts = 0, locked_until = NULL')) {
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

    // --- Bảng locations (location.repository.ts & poi.repository.ts) ---
    if (normalized.startsWith('SELECT l.id,')) {
      const lang = String(params[0] ?? 'vi');
      const locationId = Number(params[1]);
      if (locationId !== 1) return [[], []];
      return [
        [
          {
            id: 1,
            name: lang === 'en' ? 'Independence Palace' : 'Dinh Độc Lập',
            description: 'Di tích lịch sử quốc gia đặc biệt',
          },
        ],
        [],
      ];
    }

    if (normalized.startsWith('SELECT id FROM locations WHERE id = ?')) {
      const locationId = Number(params[0]);
      return [locationId === 1 ? [{ id: 1 }] : [], []];
    }

    // --- Danh sách POI của địa danh (API02) ---
    if (normalized.startsWith('SELECT p.id, COALESCE(NULLIF(pt.name')) {
      const lang = String(params[0] ?? 'vi');
      const locationId = Number(params[1]);
      const rows = fakePois
        .filter((p) => p.location_id === locationId)
        .sort((a, b) => a.order_index - b.order_index || a.id - b.id)
        .map((p) => {
          const trans = fakeTranslations.find((t) => t.poi_id === p.id && t.lang === lang);
          return {
            ...p,
            name: trans?.name && trans.name.trim() !== '' ? trans.name : p.name,
          };
        });
      return [rows, []];
    }

    // --- Tìm POI theo id ---
    if (normalized.startsWith('SELECT id, name FROM pois WHERE id = ?')) {
      const poiId = Number(params[0]);
      const found = fakePois.find((p) => p.id === poiId);
      return [found ? [{ id: found.id, name: found.name }] : [], []];
    }

    if (normalized.startsWith('SELECT id, location_id, name, latitude, longitude, radius_m, order_index FROM pois WHERE id = ?')) {
      const poiId = Number(params[0]);
      const found = fakePois.find((p) => p.id === poiId);
      return [found ? [found] : [], []];
    }

    if (normalized.startsWith('SELECT id FROM pois WHERE id = ? FOR UPDATE')) {
      const poiId = Number(params[0]);
      const found = fakePois.find((p) => p.id === poiId);
      return [found ? [{ id: found.id }] : [], []];
    }

    // --- Kiểm tra trùng tên POI trong cùng địa danh ---
    if (normalized.startsWith('SELECT id FROM pois WHERE location_id = ? AND name = ? AND id <> ?')) {
      const locationId = Number(params[0]);
      const name = String(params[1]);
      const excludeId = Number(params[2]);
      const duplicate = fakePois.find(
        (p) => p.location_id === locationId && p.name === name && p.id !== excludeId
      );
      return [duplicate ? [{ id: duplicate.id }] : [], []];
    }

    // --- Thêm / sửa / xóa POI ---
    if (normalized.startsWith('INSERT INTO pois')) {
      const newPoi: FakePoi = {
        id: nextPoiId++,
        location_id: Number(params[0]),
        name: String(params[1]),
        latitude: Number(params[2]).toFixed(7),
        longitude: Number(params[3]).toFixed(7),
        radius_m: Number(params[4]),
        order_index: Number(params[5]),
      };
      fakePois.push(newPoi);
      return [{ insertId: newPoi.id, affectedRows: 1 }, []];
    }

    if (normalized.startsWith('UPDATE pois SET name = ?')) {
      const poiId = Number(params[5]);
      const target = fakePois.find((p) => p.id === poiId);
      if (target) {
        target.name = String(params[0]);
        target.latitude = Number(params[1]).toFixed(7);
        target.longitude = Number(params[2]).toFixed(7);
        target.radius_m = Number(params[3]);
        target.order_index = Number(params[4]);
      }
      return [{ affectedRows: target ? 1 : 0 }, []];
    }

    if (normalized.startsWith('DELETE FROM pois WHERE id = ?')) {
      const poiId = Number(params[0]);
      fakePois = fakePois.filter((p) => p.id !== poiId);
      fakeTranslations = fakeTranslations.filter((t) => t.poi_id !== poiId);
      return [{ affectedRows: 1 }, []];
    }

    // --- Bảng poi_translations ---
    if (normalized.startsWith('SELECT lang, name, narration_text, audio_url FROM poi_translations WHERE poi_id = ? AND lang = ?')) {
      const poiId = Number(params[0]);
      const lang = String(params[1]);
      const found = fakeTranslations.find((t) => t.poi_id === poiId && t.lang === lang);
      return [found ? [found] : [], []];
    }

    if (normalized.startsWith('SELECT lang, name, narration_text, audio_url FROM poi_translations WHERE poi_id = ?')) {
      const poiId = Number(params[0]);
      const rows = fakeTranslations.filter((t) => t.poi_id === poiId);
      return [rows, []];
    }

    // --- Bảng visitor_sessions (presence.ts) ---
    if (normalized.startsWith('INSERT INTO visitor_sessions')) {
      const sessionId = String(params[0]);
      fakeSessions.set(sessionId, new Date());
      return [{ affectedRows: 1 }, []];
    }

    if (normalized.startsWith('SELECT COUNT(*) AS totalSessions')) {
      return [
        [
          {
            totalSessions: fakeSessions.size,
            activeSessions: fakeSessions.size,
          },
        ],
        [],
      ];
    }

    throw new Error(`Câu SQL chưa được mock trong test: ${normalized}`);
  };

  (pool as unknown as { query: typeof handleQuery }).query = handleQuery;
  (pool as unknown as { getConnection: () => Promise<unknown> }).getConnection = async () => ({
    beginTransaction: async () => {},
    commit: async () => {},
    rollback: async () => {},
    release: () => {},
    query: handleQuery,
    execute: handleQuery,
  });
}

let app: Express;

/** Tạo token Admin hợp lệ để gọi các API quản trị (API04..API08, API11). */
function createAdminToken(): string {
  return jwt.sign({ sub: '1', username: 'admin', role: 'admin' }, env.jwtSecret, {
    expiresIn: 3600,
  });
}

interface TestRequestOptions {
  method?: string;
  headers?: Record<string, string>;
  body?: unknown;
}

interface TestResponse {
  status: number;
  json: <T = unknown>() => Promise<T>;
}

/**
 * Gửi request giả lập trực tiếp qua Express app trong bộ nhớ (không cần mở cổng mạng),
 * giúp test chạy siêu nhanh và không bị chặn bởi tường lửa / sandbox.
 */
async function sendRequest(
  urlPath: string,
  options: TestRequestOptions = {}
): Promise<TestResponse> {
  return new Promise<TestResponse>((resolve, reject) => {
    const socket = new Socket();
    const req = new IncomingMessage(socket);
    req.method = options.method ?? 'GET';
    req.url = urlPath;

    const rawHeaders: Record<string, string> = {};
    if (options.headers) {
      for (const [k, v] of Object.entries(options.headers)) {
        rawHeaders[k.toLowerCase()] = v;
      }
    }

    let payloadBuffer: Buffer | null = null;
    if (options.body !== undefined) {
      const jsonStr =
        typeof options.body === 'string' ? options.body : JSON.stringify(options.body);
      payloadBuffer = Buffer.from(jsonStr, 'utf8');
      rawHeaders['content-type'] = rawHeaders['content-type'] ?? 'application/json';
      rawHeaders['content-length'] = String(payloadBuffer.byteLength);
    }

    req.headers = rawHeaders;

    const res = new ServerResponse(req);
    const chunks: Buffer[] = [];

    const originalWrite = res.write.bind(res);
    const originalEnd = res.end.bind(res);

    res.write = ((chunk: unknown, ...args: unknown[]) => {
      if (chunk) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk)));
      }
      return (originalWrite as (...a: unknown[]) => boolean)(chunk, ...args);
    }) as typeof res.write;

    res.end = ((chunk?: unknown, ...args: unknown[]) => {
      if (chunk && typeof chunk !== 'function') {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk)));
      }
      const result = (originalEnd as (...a: unknown[]) => ServerResponse)(chunk, ...args);
      const rawText = Buffer.concat(chunks).toString('utf8');
      resolve({
        status: res.statusCode,
        json: async <T = unknown>() => JSON.parse(rawText) as T,
      });
      return result;
    }) as typeof res.end;

    res.on('error', reject);

    app(req, res);

    if (payloadBuffer) {
      req.push(payloadBuffer);
    }
    req.push(null);
  });
}

before(() => {
  installDatabaseMock();
  resetFakeDatabase();

  app = express();
  app.use(express.json());
  app.use('/api/auth', authRouter);
  app.use('/api/content', contentRouter);
});

beforeEach(() => {
  resetFakeDatabase();
});

// ============================================================================
// 1. KIỂM THỬ HÀM VALIDATE DỮ LIỆU ĐIỂM THAM QUAN (Unit Test)
// ============================================================================
describe('1. Kiểm tra dữ liệu điểm tham quan (poi.validation)', () => {
  it('chấp nhận dữ liệu hợp lệ và tự gán mặc định radiusM = 10, orderIndex = 0', () => {
    const result = validatePoiCreate({
      locationId: 1,
      name: '  Nhà trưng bày  ',
      latitude: 10.777,
      longitude: 106.695,
    });

    assert.deepEqual(result.errors, {});
    assert.deepEqual(result.input, {
      locationId: 1,
      name: 'Nhà trưng bày',
      latitude: 10.777,
      longitude: 106.695,
      radiusM: 10,
      orderIndex: 0,
    });
  });

  it('từ chối khi thiếu tên, tọa độ ngoài phạm vi hoặc bán kính ngoài 1..100m', () => {
    const result = validatePoiCreate({
      locationId: 0,
      name: '   ',
      latitude: 95,
      longitude: -190,
      radiusM: 150,
    });

    assert.equal(result.input, null);
    assert.equal(result.errors.locationId, 'Vui lòng chọn địa danh');
    assert.equal(result.errors.name, 'Vui lòng nhập tên điểm tham quan');
    assert.equal(result.errors.latitude, 'Tọa độ không hợp lệ');
    assert.equal(result.errors.longitude, 'Tọa độ không hợp lệ');
    assert.equal(result.errors.radiusM, 'Bán kính phải từ 1 đến 100m');
  });

  it('validatePoiUpdate không yêu cầu locationId', () => {
    const result = validatePoiUpdate({
      name: 'Sảnh chính',
      latitude: 10.77,
      longitude: 106.69,
      radiusM: 20,
      orderIndex: 3,
    });

    assert.deepEqual(result.errors, {});
    assert.equal(result.input?.radiusM, 20);
  });
});

// ============================================================================
// 2. KIỂM THỬ AUTH API & KHÓA TÀI KHOẢN SAU 5 LẦN SAI (API01 - UC07)
// ============================================================================
describe('2. Auth API - POST /api/auth/login (UC07)', () => {
  it('trả 400 khi để trống username hoặc password', async () => {
    const res = await sendRequest(`/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: '' }),
    });

    assert.equal(res.status, 400);
    const body = (await res.json()) as { message: string };
    assert.equal(body.message, 'Vui lòng nhập đầy đủ');
  });

  it('trả 200 kèm JWT token khi đăng nhập đúng tài khoản admin', async () => {
    const res = await sendRequest(`/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'matkhau123' }),
    });

    assert.equal(res.status, 200);
    const body = (await res.json()) as {
      token: string;
      expiresIn: number;
      admin: { id: number; username: string };
    };
    assert.equal(typeof body.token, 'string');
    assert.equal(body.expiresIn, 3600);
    assert.deepEqual(body.admin, { id: 1, username: 'admin' });
  });

  it('khóa tài khoản 5 phút (trả 429 + retryAfterSeconds) sau 5 lần nhập sai liên tiếp', async () => {
    // 4 lần đầu nhập sai -> trả 401
    for (let attempt = 1; attempt <= 4; attempt++) {
      const res = await sendRequest(`/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'admin', password: 'sai_mat_khau' }),
      });
      assert.equal(res.status, 401);
    }

    // Lần thứ 5 nhập sai -> trả 429 Too Many Requests và khóa 300 giây
    const fifthRes = await sendRequest(`/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'sai_mat_khau' }),
    });
    assert.equal(fifthRes.status, 429);
    const fifthBody = (await fifthRes.json()) as {
      message: string;
      retryAfterSeconds: number;
    };
    assert.equal(fifthBody.retryAfterSeconds, 300);

    // Đang bị khóa thì kể cả nhập ĐÚNG mật khẩu vẫn bị chặn 429
    const lockedRes = await sendRequest(`/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'matkhau123' }),
    });
    assert.equal(lockedRes.status, 429);
  });
});

// ============================================================================
// 3. KIỂM THỬ LẤY NỘI DUNG & FALLBACK NGÔN NGỮ VỀ TIẾNG VIỆT (API02, API03)
// ============================================================================
describe('3. Nội dung thuyết minh & Fallback ngôn ngữ (API02, API03)', () => {
  it('API02: trả thông tin địa danh và danh sách POI theo ngôn ngữ đã chọn', async () => {
    const res = await sendRequest(`/api/content/locations/1?lang=en`);
    assert.equal(res.status, 200);

    const body = (await res.json()) as {
      id: number;
      name: string;
      pois: Array<{ id: number; name: string }>;
    };
    assert.equal(body.name, 'Independence Palace');
    assert.equal(body.pois.length, 2);
    // Điểm 1 có tên tiếng Anh, điểm 2 chưa có nên tự fallback về tên tiếng Việt gốc
    assert.equal(body.pois[0].name, 'Independence Palace Main Gate');
    assert.equal(body.pois[1].name, 'Phòng khánh tiết');
  });

  it('API03: trả đúng bản dịch khi ngôn ngữ yêu cầu đã có nội dung (fallback = false)', async () => {
    const res = await sendRequest(`/api/content/pois/1?lang=en`);
    assert.equal(res.status, 200);

    const body = (await res.json()) as {
      poiId: number;
      lang: string;
      name: string;
      text: string;
      fallback: boolean;
    };
    assert.equal(body.poiId, 1);
    assert.equal(body.lang, 'en');
    assert.equal(body.name, 'Independence Palace Main Gate');
    assert.equal(body.fallback, false);
  });

  it('API03: tự động fallback về bản tiếng Việt (fallback = true) khi thiếu bản dịch', async () => {
    // Điểm 1 chưa có bản dịch tiếng Nhật (ja) -> phải trả về bản tiếng Việt (vi)
    const res = await sendRequest(`/api/content/pois/1?lang=ja`);
    assert.equal(res.status, 200);

    const body = (await res.json()) as {
      poiId: number;
      lang: string;
      name: string;
      text: string;
      fallback: boolean;
    };
    assert.equal(body.poiId, 1);
    assert.equal(body.lang, 'vi');
    assert.equal(body.name, 'Cổng chính Dinh Độc Lập');
    assert.equal(body.text, 'Chào mừng quý khách đến với Cổng chính Dinh Độc Lập.');
    assert.equal(body.fallback, true);
  });

  it('API03: trả 400 khi mã ngôn ngữ không thuộc 5 ngôn ngữ hỗ trợ', async () => {
    const res = await sendRequest(`/api/content/pois/1?lang=fr`);
    assert.equal(res.status, 400);
    const body = (await res.json()) as { message: string };
    assert.equal(body.message, 'Ngôn ngữ không được hỗ trợ');
  });

  it('API03: trả 404 khi điểm tham quan không tồn tại', async () => {
    const res = await sendRequest(`/api/content/pois/999?lang=vi`);
    assert.equal(res.status, 404);
  });
});

// ============================================================================
// 4. KIỂM THỬ QUẢN LÝ ĐIỂM THAM QUAN - POI CRUD & PHÂN QUYỀN ADMIN (API04..06)
// ============================================================================
describe('4. Quản lý điểm tham quan - POI CRUD (API04, API05, API06)', () => {
  it('chặn trả 401 khi gọi API quản trị mà không gửi JWT token', async () => {
    const res = await sendRequest(`/api/content/pois`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        locationId: 1,
        name: 'Điểm mới',
        latitude: 10.777,
        longitude: 106.695,
      }),
    });

    assert.equal(res.status, 401);
    const body = (await res.json()) as { message: string };
    assert.equal(body.message, 'Phiên đăng nhập đã hết hạn');
  });

  it('API04 (POST /api/content/pois): thêm điểm tham quan mới thành công trả 201', async () => {
    const token = createAdminToken();
    const res = await sendRequest(`/api/content/pois`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        locationId: 1,
        name: 'Khu trưng bày xe tăng 390',
        latitude: 10.77745,
        longitude: 106.69595,
        radiusM: 12,
        orderIndex: 3,
      }),
    });

    assert.equal(res.status, 201);
    const created = (await res.json()) as {
      id: number;
      name: string;
      radiusM: number;
      orderIndex: number;
    };
    assert.equal(created.name, 'Khu trưng bày xe tăng 390');
    assert.equal(created.radiusM, 12);
    assert.equal(created.orderIndex, 3);
  });

  it('API04 (POST /api/content/pois): trả 409 khi trùng tên điểm trong cùng địa danh', async () => {
    const token = createAdminToken();
    const res = await sendRequest(`/api/content/pois`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        locationId: 1,
        name: 'Cổng chính Dinh Độc Lập',
        latitude: 10.777,
        longitude: 106.695,
      }),
    });

    assert.equal(res.status, 409);
    const body = (await res.json()) as { message: string };
    assert.equal(body.message, 'Tên điểm đã tồn tại');
  });

  it('API05 (PUT /api/content/pois/:id): sửa điểm thành công và cho phép giữ nguyên tên cũ', async () => {
    const token = createAdminToken();
    const res = await sendRequest(`/api/content/pois/1`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        name: 'Cổng chính Dinh Độc Lập',
        latitude: 10.778,
        longitude: 106.696,
        radiusM: 25,
        orderIndex: 1,
      }),
    });

    assert.equal(res.status, 200);
    const updated = (await res.json()) as { radiusM: number; latitude: number };
    assert.equal(updated.radiusM, 25);
    assert.equal(updated.latitude, 10.778);
  });

  it('API06 (DELETE /api/content/pois/:id): xóa điểm tham quan và trả số bản dịch đã xóa', async () => {
    const token = createAdminToken();
    const res = await sendRequest(`/api/content/pois/1`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });

    assert.equal(res.status, 200);
    const body = (await res.json()) as { message: string; deletedTranslations: number };
    assert.equal(body.message, 'Đã xóa điểm tham quan');
    assert.equal(body.deletedTranslations, 2);

    // Sau khi xóa, gọi lại API03 cho điểm 1 phải trả 404
    const checkRes = await sendRequest(`/api/content/pois/1?lang=vi`);
    assert.equal(checkRes.status, 404);
  });
});

// ============================================================================
// 5. KIỂM THỬ BẢN DỊCH (API07) & ĐẾM LƯỢT TRUY CẬP (API10, API11)
// ============================================================================
describe('5. Danh sách bản dịch (API07) & Đếm lượt truy cập (API10, API11)', () => {
  it('API07: luôn trả đủ 5 ngôn ngữ (vi, en, zh, ko, ja)', async () => {
    const token = createAdminToken();
    const res = await sendRequest(`/api/content/pois/1/translations`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    assert.equal(res.status, 200);
    const body = (await res.json()) as {
      poiId: number;
      translations: Array<{ lang: string; text: string | null }>;
    };
    assert.equal(body.translations.length, 5);
    assert.deepEqual(
      body.translations.map((t) => t.lang),
      ['vi', 'en', 'zh', 'ko', 'ja']
    );
    assert.notEqual(body.translations[0].text, null);
    assert.equal(body.translations[2].text, null);
  });

  it('API10 & API11: ghi nhận phiên truy cập hợp lệ (204) và trả thống kê cho Admin (200)', async () => {
    // sessionId quá ngắn -> trả 400
    const badRes = await sendRequest(`/api/content/presence`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: 'short' }),
    });
    assert.equal(badRes.status, 400);

    // sessionId hợp lệ (8-64 ký tự) -> trả 204
    const okRes = await sendRequest(`/api/content/presence`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: 'session_du_khach_01' }),
    });
    assert.equal(okRes.status, 204);

    // Admin xem thống kê -> activeSessions = 1, totalSessions = 1
    const token = createAdminToken();
    const countRes = await sendRequest(`/api/content/presence/count`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    assert.equal(countRes.status, 200);
    const stats = (await countRes.json()) as {
      activeSessions: number;
      totalSessions: number;
    };
    assert.equal(stats.activeSessions, 1);
    assert.equal(stats.totalSessions, 1);
  });
});
