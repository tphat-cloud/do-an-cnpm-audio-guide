import assert from 'node:assert/strict';
import { randomInt } from 'node:crypto';
import { existsSync } from 'node:fs';
import { readFile, unlink } from 'node:fs/promises';
import { once } from 'node:events';
import path from 'node:path';
import type { Server } from 'node:http';
import { after, before, beforeEach, describe, it } from 'node:test';
import express from 'express';
import jwt from 'jsonwebtoken';
import { pool } from '../src/config/database';
import { env } from '../src/config/env';
import { contentRouter } from '../src/content';
import { validatePoiCreate, validatePoiUpdate } from '../src/content/poi.validation';
import { AUDIO_DIR } from '../src/content/upload';

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

const uploadTestPoiId = randomInt(100_000_000, 900_000_000);
const uploadTestPath = path.join(AUDIO_DIR, `poi${uploadTestPoiId}-en.mp3`);

let fakePois: FakePoi[];
let fakeTranslations: FakeTranslation[];
let fakeSessions: Map<string, Date>;
let nextPoiId: number;
let baseUrl: string;
let server: Server;

function resetFakeDatabase(): void {
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
    {
      id: uploadTestPoiId,
      location_id: 999,
      name: 'Upload test POI',
      latitude: '10.0000000',
      longitude: '106.0000000',
      radius_m: 10,
      order_index: 0,
    },
  ];

  fakeTranslations = [
    {
      poi_id: 1,
      lang: 'vi',
      name: 'Cổng chính Dinh Độc Lập',
      narration_text: 'Chào mừng quý khách đến với Cổng chính Dinh Độc Lập.',
      audio_url: null,
    },
    {
      poi_id: 1,
      lang: 'en',
      name: 'Independence Palace Main Gate',
      narration_text: 'Welcome to the Main Gate of Independence Palace.',
      audio_url: null,
    },
  ];
  fakeSessions = new Map<string, Date>();
  nextPoiId = 10;
}

type MockQuery = (
  sql: string,
  params?: unknown[]
) => Promise<[unknown, unknown]>;

function installDatabaseMock(): void {
  const handleQuery: MockQuery = async (sql, params = []) => {
    const normalized = sql.replace(/\s+/g, ' ').trim();

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
      return [Number(params[0]) === 1 ? [{ id: 1 }] : [], []];
    }

    if (normalized.startsWith('SELECT p.id, COALESCE(NULLIF(pt.name')) {
      const lang = String(params[0] ?? 'vi');
      const locationId = Number(params[1]);
      const rows = fakePois
        .filter((poi) => poi.location_id === locationId)
        .sort((a, b) => a.order_index - b.order_index || a.id - b.id)
        .map((poi) => {
          const translation = fakeTranslations.find(
            (item) => item.poi_id === poi.id && item.lang === lang
          );
          return {
            ...poi,
            name:
              translation?.name && translation.name.trim() !== ''
                ? translation.name
                : poi.name,
          };
        });
      return [rows, []];
    }

    if (normalized.startsWith('SELECT id, name FROM pois WHERE id = ?')) {
      const poiId = Number(params[0]);
      const poi = fakePois.find((item) => item.id === poiId);
      return [poi ? [{ id: poi.id, name: poi.name }] : [], []];
    }

    if (
      normalized.startsWith(
        'SELECT id, location_id, name, latitude, longitude, radius_m, order_index FROM pois WHERE id ='
      )
    ) {
      const poi = fakePois.find((item) => item.id === Number(params[0]));
      return [poi ? [poi] : [], []];
    }

    if (normalized.startsWith('SELECT id FROM pois WHERE id = ? FOR UPDATE')) {
      const poi = fakePois.find((item) => item.id === Number(params[0]));
      return [poi ? [{ id: poi.id }] : [], []];
    }

    if (
      normalized.startsWith(
        'SELECT id FROM pois WHERE location_id = ? AND name = ? AND id <> ?'
      )
    ) {
      const locationId = Number(params[0]);
      const name = String(params[1]);
      const excludedId = Number(params[2]);
      const duplicate = fakePois.find(
        (poi) =>
          poi.location_id === locationId &&
          poi.name === name &&
          poi.id !== excludedId
      );
      return [duplicate ? [{ id: duplicate.id }] : [], []];
    }

    if (normalized.startsWith('INSERT INTO pois')) {
      const poi: FakePoi = {
        id: nextPoiId++,
        location_id: Number(params[0]),
        name: String(params[1]),
        latitude: Number(params[2]).toFixed(7),
        longitude: Number(params[3]).toFixed(7),
        radius_m: Number(params[4]),
        order_index: Number(params[5]),
      };
      fakePois.push(poi);
      return [{ insertId: poi.id, affectedRows: 1 }, []];
    }

    if (normalized.startsWith('UPDATE pois SET name = ?')) {
      const poi = fakePois.find((item) => item.id === Number(params[5]));
      if (poi) {
        poi.name = String(params[0]);
        poi.latitude = Number(params[1]).toFixed(7);
        poi.longitude = Number(params[2]).toFixed(7);
        poi.radius_m = Number(params[3]);
        poi.order_index = Number(params[4]);
      }
      return [{ affectedRows: poi ? 1 : 0 }, []];
    }

    if (normalized.startsWith('DELETE FROM pois WHERE id = ?')) {
      const poiId = Number(params[0]);
      fakePois = fakePois.filter((poi) => poi.id !== poiId);
      fakeTranslations = fakeTranslations.filter(
        (translation) => translation.poi_id !== poiId
      );
      return [{ affectedRows: 1 }, []];
    }

    if (
      normalized.startsWith(
        'SELECT lang, name, narration_text, audio_url FROM poi_translations WHERE poi_id = ? AND lang = ?'
      )
    ) {
      const poiId = Number(params[0]);
      const lang = String(params[1]);
      const translation = fakeTranslations.find(
        (item) => item.poi_id === poiId && item.lang === lang
      );
      return [translation ? [translation] : [], []];
    }

    if (
      normalized.startsWith(
        'SELECT lang, name, narration_text, audio_url FROM poi_translations WHERE poi_id = ?'
      )
    ) {
      const poiId = Number(params[0]);
      return [
        fakeTranslations.filter((item) => item.poi_id === poiId),
        [],
      ];
    }

    if (normalized.startsWith('INSERT INTO poi_translations')) {
      const poiId = Number(params[0]);
      const lang = String(params[1]) as FakeTranslation['lang'];
      const text = String(params[2]);
      const audioUrl = params[3] === null ? null : String(params[3]);
      const name = params[4] === null ? null : String(params[4]);
      const updateName = Number(params[5]) === 1;
      const existing = fakeTranslations.find(
        (item) => item.poi_id === poiId && item.lang === lang
      );

      if (existing) {
        existing.narration_text = text;
        if (audioUrl !== null) existing.audio_url = audioUrl;
        if (updateName) existing.name = name;
      } else {
        fakeTranslations.push({
          poi_id: poiId,
          lang,
          narration_text: text,
          audio_url: audioUrl,
          name,
        });
      }
      return [{ affectedRows: 1 }, []];
    }

    if (normalized.startsWith('INSERT INTO visitor_sessions')) {
      fakeSessions.set(String(params[0]), new Date());
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

  Object.defineProperty(pool, 'query', {
    configurable: true,
    value: handleQuery,
  });
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

function createAdminToken(): string {
  return jwt.sign(
    { sub: '1', username: 'admin', role: 'admin' },
    env.jwtSecret,
    { expiresIn: 3600 }
  );
}

async function sendJson(
  urlPath: string,
  method = 'GET',
  body?: unknown,
  token?: string
): Promise<Response> {
  const headers: Record<string, string> = {};
  if (body !== undefined) headers['content-type'] = 'application/json';
  if (token) headers.authorization = `Bearer ${token}`;

  return fetch(`${baseUrl}${urlPath}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

before(async () => {
  installDatabaseMock();
  resetFakeDatabase();

  const app = express();
  app.use(express.json());
  app.use('/api/content', contentRouter);
  server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');

  const address = server.address();
  if (!address || typeof address === 'string') {
    throw new Error('Không lấy được cổng test content-service');
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

describe('Content service - validation', () => {
  it('chấp nhận POI hợp lệ và áp dụng giá trị mặc định', () => {
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

  it('từ chối tên, tọa độ, bán kính không hợp lệ', () => {
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

describe('Content service - locations and narration (API02, API03)', () => {
  it('trả địa danh và POI theo ngôn ngữ yêu cầu', async () => {
    const response = await sendJson('/api/content/locations/1?lang=en');
    assert.equal(response.status, 200);

    const body = (await response.json()) as {
      name: string;
      pois: Array<{ name: string }>;
    };
    assert.equal(body.name, 'Independence Palace');
    assert.equal(body.pois.length, 2);
    assert.equal(body.pois[0].name, 'Independence Palace Main Gate');
    assert.equal(body.pois[1].name, 'Phòng khánh tiết');
  });

  it('trả bản dịch hoặc fallback tiếng Việt; từ chối ngôn ngữ sai và POI không tồn tại', async () => {
    const translated = await sendJson('/api/content/pois/1?lang=en');
    assert.equal(translated.status, 200);
    const translatedBody = (await translated.json()) as {
      poiId: number;
      lang: string;
      fallback: boolean;
    };
    assert.equal(translatedBody.poiId, 1);
    assert.equal(translatedBody.lang, 'en');
    assert.equal(translatedBody.fallback, false);

    const fallback = await sendJson('/api/content/pois/1?lang=ja');
    assert.equal(fallback.status, 200);
    const fallbackBody = (await fallback.json()) as {
      lang: string;
      text: string;
      fallback: boolean;
    };
    assert.equal(fallbackBody.lang, 'vi');
    assert.equal(
      fallbackBody.text,
      'Chào mừng quý khách đến với Cổng chính Dinh Độc Lập.'
    );
    assert.equal(fallbackBody.fallback, true);

    const unsupported = await sendJson('/api/content/pois/1?lang=fr');
    assert.equal(unsupported.status, 400);
    assert.deepEqual(await unsupported.json(), {
      message: 'Ngôn ngữ không được hỗ trợ',
    });

    const missing = await sendJson('/api/content/pois/999?lang=vi');
    assert.equal(missing.status, 404);
  });
});

describe('Content service - POI administration (API04..API07)', () => {
  it('chặn request không có JWT', async () => {
    const response = await sendJson('/api/content/pois', 'POST', {
      locationId: 1,
      name: 'Điểm mới',
      latitude: 10.777,
      longitude: 106.695,
    });

    assert.equal(response.status, 401);
    assert.deepEqual(await response.json(), {
      message: 'Phiên đăng nhập đã hết hạn',
    });
  });

  it('thêm POI và từ chối tên trùng trong cùng địa danh', async () => {
    const token = createAdminToken();
    const created = await sendJson(
      '/api/content/pois',
      'POST',
      {
        locationId: 1,
        name: 'Khu trưng bày xe tăng 390',
        latitude: 10.77745,
        longitude: 106.69595,
        radiusM: 12,
        orderIndex: 3,
      },
      token
    );
    assert.equal(created.status, 201);
    const createdBody = (await created.json()) as {
      name: string;
      radiusM: number;
      orderIndex: number;
    };
    assert.equal(createdBody.name, 'Khu trưng bày xe tăng 390');
    assert.equal(createdBody.radiusM, 12);
    assert.equal(createdBody.orderIndex, 3);

    const duplicate = await sendJson(
      '/api/content/pois',
      'POST',
      {
        locationId: 1,
        name: 'Cổng chính Dinh Độc Lập',
        latitude: 10.777,
        longitude: 106.695,
      },
      token
    );
    assert.equal(duplicate.status, 409);
    assert.deepEqual(await duplicate.json(), {
      message: 'Tên điểm đã tồn tại',
    });
  });

  it('sửa và xóa POI, trả đủ các ngôn ngữ của bản dịch', async () => {
    const token = createAdminToken();
    const updated = await sendJson(
      '/api/content/pois/1',
      'PUT',
      {
        name: 'Cổng chính Dinh Độc Lập',
        latitude: 10.778,
        longitude: 106.696,
        radiusM: 25,
        orderIndex: 1,
      },
      token
    );
    assert.equal(updated.status, 200);
    const updatedBody = (await updated.json()) as {
      radiusM: number;
      latitude: number;
    };
    assert.equal(updatedBody.radiusM, 25);
    assert.equal(updatedBody.latitude, 10.778);

    const translations = await sendJson(
      '/api/content/pois/1/translations',
      'GET',
      undefined,
      token
    );
    assert.equal(translations.status, 200);
    const translationBody = (await translations.json()) as {
      translations: Array<{ lang: string; text: string | null }>;
    };
    assert.deepEqual(
      translationBody.translations.map((entry) => entry.lang),
      ['vi', 'en', 'zh', 'ko', 'ja']
    );
    assert.notEqual(translationBody.translations[0].text, null);
    assert.equal(translationBody.translations[2].text, null);

    const deleted = await sendJson(
      '/api/content/pois/1',
      'DELETE',
      undefined,
      token
    );
    assert.equal(deleted.status, 200);
    assert.deepEqual(await deleted.json(), {
      message: 'Đã xóa điểm tham quan',
      deletedTranslations: 2,
    });
    assert.equal(
      (await sendJson('/api/content/pois/1?lang=vi')).status,
      404
    );
  });
});

describe('Content service - audio and presence (API08, API10, API11)', () => {
  it('nhận multipart MP3 và lưu đường dẫn audio', async () => {
    assert.equal(existsSync(uploadTestPath), false, 'test upload path must be unused');
    const token = createAdminToken();
    const form = new FormData();
    form.set('text', 'Lời thuyết minh mới');
    form.set('name', 'Tên điểm dịch');
    form.set(
      'audio',
      new Blob(['test-mp3-content'], { type: 'audio/mpeg' }),
      'test.mp3'
    );

    try {
      const response = await fetch(
        `${baseUrl}/api/content/pois/${uploadTestPoiId}/translations/en`,
        {
          method: 'PUT',
          headers: { authorization: `Bearer ${token}` },
          body: form,
        }
      );
      assert.equal(response.status, 200);
      assert.deepEqual(await response.json(), {
        poiId: uploadTestPoiId,
        lang: 'en',
        text: 'Lời thuyết minh mới',
        audioUrl: `/uploads/audio/poi${uploadTestPoiId}-en.mp3`,
        overwritten: false,
      });
      assert.equal(
        (await readFile(uploadTestPath)).toString(),
        'test-mp3-content'
      );
    } finally {
      await unlink(uploadTestPath).catch((error: NodeJS.ErrnoException) => {
        if (error.code !== 'ENOENT') throw error;
      });
    }
  });

  it('ghi nhận presence hợp lệ và trả thống kê cho admin', async () => {
    const invalid = await sendJson('/api/content/presence', 'POST', {
      sessionId: 'short',
    });
    assert.equal(invalid.status, 400);

    const recorded = await sendJson('/api/content/presence', 'POST', {
      sessionId: 'session_du_khach_01',
    });
    assert.equal(recorded.status, 204);

    const stats = await sendJson(
      '/api/content/presence/count',
      'GET',
      undefined,
      createAdminToken()
    );
    assert.equal(stats.status, 200);
    assert.deepEqual(await stats.json(), {
      activeSessions: 1,
      totalSessions: 1,
    });
  });
});
