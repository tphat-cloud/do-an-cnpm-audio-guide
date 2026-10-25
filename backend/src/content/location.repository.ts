import type { RowDataPacket } from 'mysql2';
import { pool } from '../config/database';

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
 * Trả null nếu địa danh không tồn tại.
 */
export async function findLocationWithPois(
  locationId: number
): Promise<LocationDetail | null> {
  const [locationRows] = await pool.query<LocationRow[]>(
    'SELECT id, name, description FROM locations WHERE id = ? LIMIT 1',
    [locationId]
  );

  const location = locationRows[0];
  if (!location) return null;

  const [poiRows] = await pool.query<PoiRow[]>(
    `SELECT id, name, latitude, longitude, radius_m, order_index
       FROM pois
      WHERE location_id = ?
      ORDER BY order_index ASC, id ASC`,
    [locationId]
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
