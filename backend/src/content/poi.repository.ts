import type { ResultSetHeader, RowDataPacket } from 'mysql2';
import { pool } from '../config/database';

/** 5 ngôn ngữ hỗ trợ (PRD 2.7.3). */
export const SUPPORTED_LANGS = ['vi', 'en', 'zh', 'ko', 'ja'] as const;

export type SupportedLang = (typeof SUPPORTED_LANGS)[number];

export function isSupportedLang(value: string): value is SupportedLang {
  return (SUPPORTED_LANGS as readonly string[]).includes(value);
}

export interface PoiNarration {
  poiId: number;
  name: string;
  lang: SupportedLang;
  text: string;
  audioUrl: string | null;
  fallback: boolean;
}

interface PoiRow extends RowDataPacket {
  id: number;
  name: string;
}

export interface PoiDetail {
  id: number;
  locationId: number;
  name: string;
  latitude: number;
  longitude: number;
  radiusM: number;
  orderIndex: number;
}

/** Dữ liệu đã kiểm tra hợp lệ để thêm điểm tham quan (API04). */
export interface PoiCreateInput {
  locationId: number;
  name: string;
  latitude: number;
  longitude: number;
  radiusM: number;
  orderIndex: number;
}

interface PoiDetailRow extends RowDataPacket {
  id: number;
  location_id: number;
  name: string;
  latitude: string;
  longitude: string;
  radius_m: number;
  order_index: number;
}

interface TranslationRow extends RowDataPacket {
  lang: SupportedLang;
  narration_text: string;
  audio_url: string | null;
}

/** Nội dung thuyết minh hiện có của một điểm theo ngôn ngữ. */
export interface TranslationContent {
  text: string;
  audioUrl: string | null;
}

async function findTranslation(
  poiId: number,
  lang: SupportedLang
): Promise<TranslationRow | null> {
  const [rows] = await pool.query<TranslationRow[]>(
    `SELECT lang, narration_text, audio_url
       FROM poi_translations
      WHERE poi_id = ? AND lang = ?
      LIMIT 1`,
    [poiId, lang]
  );

  return rows[0] ?? null;
}

/**
 * Lấy văn bản và audio của một điểm theo ngôn ngữ (API03 - UC03, UC05, UC10).
 * Thiếu bản dịch thì trả bản tiếng Việt kèm fallback = true (PRD 2.7.3).
 * Trả null nếu điểm không tồn tại.
 */
export async function findPoiNarration(
  poiId: number,
  lang: SupportedLang
): Promise<PoiNarration | null> {
  const [poiRows] = await pool.query<PoiRow[]>(
    'SELECT id, name FROM pois WHERE id = ? LIMIT 1',
    [poiId]
  );

  const poi = poiRows[0];
  if (!poi) return null;

  const translation = await findTranslation(poiId, lang);
  if (translation) {
    return {
      poiId: poi.id,
      name: poi.name,
      lang: translation.lang,
      text: translation.narration_text,
      audioUrl: translation.audio_url,
      fallback: false,
    };
  }

  // Thiếu bản dịch ở ngôn ngữ đã chọn -> dùng tiếng Việt làm dự phòng.
  if (lang !== 'vi') {
    const vietnamese = await findTranslation(poiId, 'vi');
    if (vietnamese) {
      return {
        poiId: poi.id,
        name: poi.name,
        lang: 'vi',
        text: vietnamese.narration_text,
        audioUrl: vietnamese.audio_url,
        fallback: true,
      };
    }
  }

  // Điểm chưa có nội dung ở bất kỳ ngôn ngữ nào (PRD chưa quy định trường hợp này).
  return {
    poiId: poi.id,
    name: poi.name,
    lang: 'vi',
    text: '',
    audioUrl: null,
    fallback: true,
  };
}

function mapPoiDetail(row: PoiDetailRow): PoiDetail {
  // Chuyển snake_case -> camelCase; DECIMAL của MySQL trả về string nên ép số.
  return {
    id: row.id,
    locationId: row.location_id,
    name: row.name,
    latitude: Number(row.latitude),
    longitude: Number(row.longitude),
    radiusM: row.radius_m,
    orderIndex: row.order_index,
  };
}

/** Lấy một điểm tham quan theo id; trả null nếu không tồn tại. */
export async function findPoiById(poiId: number): Promise<PoiDetail | null> {
  const [rows] = await pool.query<PoiDetailRow[]>(
    `SELECT id, location_id, name, latitude, longitude, radius_m, order_index
       FROM pois
      WHERE id = ?
      LIMIT 1`,
    [poiId]
  );

  const row = rows[0];
  return row ? mapPoiDetail(row) : null;
}

/** Kiểm tra địa danh tồn tại trước khi thêm điểm (API04 trả 404 nếu thiếu). */
export async function locationExists(locationId: number): Promise<boolean> {
  const [rows] = await pool.query<RowDataPacket[]>(
    'SELECT id FROM locations WHERE id = ? LIMIT 1',
    [locationId]
  );

  return rows.length > 0;
}

/** Trùng tên điểm trong cùng một địa danh (ràng buộc uq_pois_location_name). */
export async function isPoiNameTaken(
  locationId: number,
  name: string
): Promise<boolean> {
  const [rows] = await pool.query<RowDataPacket[]>(
    'SELECT id FROM pois WHERE location_id = ? AND name = ? LIMIT 1',
    [locationId, name]
  );

  return rows.length > 0;
}

/** Thêm điểm tham quan và trả lại bản ghi vừa tạo (API04 - UC08). */
export async function createPoi(input: PoiCreateInput): Promise<PoiDetail> {
  const [result] = await pool.query<ResultSetHeader>(
    `INSERT INTO pois (location_id, name, latitude, longitude, radius_m, order_index)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      input.locationId,
      input.name,
      input.latitude,
      input.longitude,
      input.radiusM,
      input.orderIndex,
    ]
  );

  // Đọc lại từ CSDL để trả đúng giá trị đã lưu (DECIMAL, giá trị mặc định).
  const poi = await findPoiById(result.insertId);

  if (!poi) {
    throw new Error(`Không đọc lại được điểm vừa tạo (id=${result.insertId})`);
  }

  return poi;
}

/** MySQL báo trùng khóa duy nhất (ER_DUP_ENTRY) - dùng để trả 409. */
export function isDuplicateEntryError(error: unknown): boolean {
  return (error as { code?: string }).code === 'ER_DUP_ENTRY';
}

/** Nội dung thuyết minh hiện có của một điểm theo ngôn ngữ (dùng cho API08). */
export async function findTranslationContent(
  poiId: number,
  lang: SupportedLang
): Promise<TranslationContent | null> {
  const row = await findTranslation(poiId, lang);

  return row ? { text: row.narration_text, audioUrl: row.audio_url } : null;
}

/**
 * Lưu hoặc ghi đè nội dung thuyết minh của một điểm theo ngôn ngữ (API08 - UC09).
 * `audioUrl` = null nghĩa là Admin không tải file mới -> giữ nguyên audio cũ.
 */
export async function saveTranslation(
  poiId: number,
  lang: SupportedLang,
  text: string,
  audioUrl: string | null
): Promise<void> {
  await pool.query(
    `INSERT INTO poi_translations (poi_id, lang, narration_text, audio_url)
     VALUES (?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       narration_text = VALUES(narration_text),
       audio_url = COALESCE(VALUES(audio_url), audio_url)`,
    [poiId, lang, text, audioUrl]
  );
}
