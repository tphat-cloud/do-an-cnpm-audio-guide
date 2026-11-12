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

/** Dữ liệu đã kiểm tra hợp lệ để sửa điểm tham quan (API05, không có locationId). */
export interface PoiUpdateInput {
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
  name: string | null;
  narration_text: string;
  audio_url: string | null;
}

/** Nội dung thuyết minh hiện có của một điểm theo ngôn ngữ. */
export interface TranslationContent {
  text: string;
  audioUrl: string | null;
}

/** Một ngôn ngữ trong kết quả API07; chưa có nội dung thì text, audioUrl, name là null. */
export interface PoiTranslationEntry {
  lang: SupportedLang;
  name: string | null;
  text: string | null;
  audioUrl: string | null;
}

export interface PoiTranslations {
  poiId: number;
  translations: PoiTranslationEntry[];
}

/** Kết quả xóa điểm tham quan: số dòng nội dung đã xóa và audio cần dọn. */
export interface DeletedPoiResult {
  deletedTranslations: number;
  audioUrls: string[];
}

async function findTranslation(
  poiId: number,
  lang: SupportedLang
): Promise<TranslationRow | null> {
  const [rows] = await pool.query<TranslationRow[]>(
    `SELECT lang, name, narration_text, audio_url
       FROM poi_translations
      WHERE poi_id = ? AND lang = ?
      LIMIT 1`,
    [poiId, lang]
  );

  return rows[0] ?? null;
}

/** Bản dịch tên điểm để trống hoặc chưa có thì coi như null. */
function normalizeName(name: string | null): string | null {
  return name !== null && name.trim() !== '' ? name : null;
}

/** Tên điểm theo ngôn ngữ; thiếu bản dịch thì dùng tên gốc trong `pois.name`. */
function pickTranslatedName(name: string | null, originalName: string): string {
  return normalizeName(name) ?? originalName;
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
      name: pickTranslatedName(translation.name, poi.name),
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
        // Tên đi theo ngôn ngữ thực sự trả về (vi), thiếu thì dùng tên gốc.
        name: pickTranslatedName(vietnamese.name, poi.name),
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

/**
 * Trùng tên điểm trong cùng một địa danh (ràng buộc uq_pois_location_name).
 * `excludePoiId` dùng cho API05: giữ nguyên tên của chính điểm đang sửa thì
 * không tính là trùng.
 */
export async function isPoiNameTaken(
  locationId: number,
  name: string,
  excludePoiId?: number
): Promise<boolean> {
  const [rows] = await pool.query<RowDataPacket[]>(
    'SELECT id FROM pois WHERE location_id = ? AND name = ? AND id <> ? LIMIT 1',
    [locationId, name, excludePoiId ?? 0]
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

/**
 * Sửa điểm tham quan và trả lại bản ghi sau khi sửa (API05 - UC08).
 * Không đổi location_id: địa danh của điểm do API04 quyết định.
 */
export async function updatePoi(
  poiId: number,
  input: PoiUpdateInput
): Promise<PoiDetail> {
  await pool.query(
    `UPDATE pois
        SET name = ?, latitude = ?, longitude = ?, radius_m = ?, order_index = ?
      WHERE id = ?`,
    [
      input.name,
      input.latitude,
      input.longitude,
      input.radiusM,
      input.orderIndex,
      poiId,
    ]
  );

  // Đọc lại từ CSDL để trả đúng giá trị đã lưu (DECIMAL, updated_at).
  const poi = await findPoiById(poiId);

  if (!poi) {
    throw new Error(`Không đọc lại được điểm vừa sửa (id=${poiId})`);
  }

  return poi;
}

/**
 * Xóa điểm tham quan (API06 - UC08). Các dòng poi_translations bị xóa theo
 * nhờ ON DELETE CASCADE, nên phải đọc audio_url trước khi xóa để còn dọn file.
 * Trả null nếu điểm không tồn tại.
 */
export async function deletePoiWithTranslations(
  poiId: number
): Promise<DeletedPoiResult | null> {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [poiRows] = await connection.query<RowDataPacket[]>(
      'SELECT id FROM pois WHERE id = ? FOR UPDATE',
      [poiId]
    );

    if (poiRows.length === 0) {
      await connection.rollback();
      return null;
    }

    const [translationRows] = await connection.query<TranslationRow[]>(
      'SELECT lang, name, narration_text, audio_url FROM poi_translations WHERE poi_id = ?',
      [poiId]
    );

    await connection.query('DELETE FROM pois WHERE id = ?', [poiId]);
    await connection.commit();

    return {
      deletedTranslations: translationRows.length,
      audioUrls: translationRows
        .map((row) => row.audio_url)
        .filter((url): url is string => url !== null && url !== ''),
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

/**
 * Nội dung của một điểm ở tất cả ngôn ngữ (API07 - UC09).
 * Luôn trả đủ 5 ngôn ngữ theo thứ tự vi, en, zh, ko, ja; ngôn ngữ chưa có
 * nội dung thì text, audioUrl và name là null (PRD 6.2).
 */
export async function findPoiTranslations(
  poiId: number
): Promise<PoiTranslations> {
  const [rows] = await pool.query<TranslationRow[]>(
    'SELECT lang, name, narration_text, audio_url FROM poi_translations WHERE poi_id = ?',
    [poiId]
  );

  const byLang = new Map<SupportedLang, TranslationRow>();

  for (const row of rows) {
    // Bỏ qua mã ngôn ngữ lạ nếu CSDL bị sửa tay ngoài 5 ngôn ngữ hỗ trợ.
    if (isSupportedLang(row.lang)) {
      byLang.set(row.lang, row);
    }
  }

  return {
    poiId,
    translations: SUPPORTED_LANGS.map((lang) => {
      const row = byLang.get(lang);

      return row
        ? {
            lang,
            name: normalizeName(row.name),
            text: row.narration_text,
            audioUrl: row.audio_url,
          }
        : { lang, name: null, text: null, audioUrl: null };
    }),
  };
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
 * `name` = undefined nghĩa là Admin không gửi trường name -> giữ nguyên tên cũ;
 * `name` = null nghĩa là gửi chuỗi rỗng -> lưu NULL.
 */
export async function saveTranslation(
  poiId: number,
  lang: SupportedLang,
  text: string,
  audioUrl: string | null,
  name: string | null | undefined
): Promise<void> {
  await pool.query(
    `INSERT INTO poi_translations (poi_id, lang, narration_text, audio_url, name)
     VALUES (?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       narration_text = VALUES(narration_text),
       audio_url = COALESCE(VALUES(audio_url), audio_url),
       name = IF(?, VALUES(name), name)`,
    [poiId, lang, text, audioUrl, name ?? null, name === undefined ? 0 : 1]
  );
}
