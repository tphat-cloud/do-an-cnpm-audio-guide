import type { RowDataPacket } from 'mysql2';
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

interface TranslationRow extends RowDataPacket {
  lang: SupportedLang;
  narration_text: string;
  audio_url: string | null;
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
