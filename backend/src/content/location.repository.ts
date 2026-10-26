import type { RowDataPacket } from 'mysql2';
import { pool } from '../config/database';
import type { SupportedLang } from './poi.repository';

export interface PoiSummary {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  radiusM: number;
  orderIndex: number;
}

export interface LocationDetail {
  id: number;
  name: string;
  description: string | null;
  pois: PoiSummary[];
}

interface LocationRow extends RowDataPacket {
  id: number;
  name: string;
  description: string | null;
}

interface PoiRow extends RowDataPacket {
  id: number;
  name: string;
  latitude: string;
  longitude: string;
  radius_m: number;
  order_index: number;
}

/**
 * Lấy địa danh kèm danh sách điểm tham quan (API02 - UC01, UC06, UC10).
 * Tên, mô tả địa danh và tên từng điểm lấy theo ngôn ngữ `lang` (PRD 2.7.3);
 * bản dịch chưa có hoặc để trống thì dùng cột gốc trong `locations`/`pois`.
 * Trả null nếu địa danh không tồn tại.
 */
export async function findLocationWithPois(
  locationId: number,
  lang: SupportedLang
): Promise<LocationDetail | null> {
  const [locationRows] = await pool.query<LocationRow[]>(
    `SELECT l.id,
            COALESCE(NULLIF(lt.name, ''), l.name) AS name,
            COALESCE(NULLIF(lt.description, ''), l.description) AS description
       FROM locations l
       LEFT JOIN location_translations lt
              ON lt.location_id = l.id AND lt.lang = ?
      WHERE l.id = ?
      LIMIT 1`,
    [lang, locationId]
  );

  const location = locationRows[0];
  if (!location) return null;

  const [poiRows] = await pool.query<PoiRow[]>(
    `SELECT p.id,
            COALESCE(NULLIF(pt.name, ''), p.name) AS name,
            p.latitude,
            p.longitude,
            p.radius_m,
            p.order_index
       FROM pois p
       LEFT JOIN poi_translations pt
              ON pt.poi_id = p.id AND pt.lang = ?
      WHERE p.location_id = ?
      ORDER BY p.order_index ASC, p.id ASC`,
    [lang, locationId]
  );

  return {
    id: location.id,
    name: location.name,
    description: location.description,
    // Chuyển snake_case -> camelCase; DECIMAL của MySQL trả về string nên ép số.
    pois: poiRows.map((row) => ({
      id: row.id,
      name: row.name,
      latitude: Number(row.latitude),
      longitude: Number(row.longitude),
      radiusM: row.radius_m,
      orderIndex: row.order_index,
    })),
  };
}
