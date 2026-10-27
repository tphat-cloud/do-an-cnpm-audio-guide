import type { LatLng, PoiSummary } from '../types';

/** Bán kính kích hoạt dùng khi điểm chưa cấu hình (PRD 2.7.2 - BR01). */
export const DEFAULT_GEOFENCE_RADIUS_M = 10;

/** Bỏ qua tọa độ có sai số lớn hơn ngưỡng này (PRD 2.7.2 - BR06). */
export const MAX_ACCURACY_M = 30;

/** Bán kính Trái Đất theo mét, dùng cho công thức Haversine. */
const EARTH_RADIUS_M = 6_371_000;

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/** Khoảng cách giữa hai tọa độ theo công thức Haversine (PRD 2.7.2 - BR02). */
export function haversineMeters(from: LatLng, to: LatLng): number {
  const deltaLat = toRadians(to.latitude - from.latitude);
  const deltaLng = toRadians(to.longitude - from.longitude);
  const latFrom = toRadians(from.latitude);
  const latTo = toRadians(to.latitude);

  const h =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(latFrom) * Math.cos(latTo) * Math.sin(deltaLng / 2) ** 2;

  // Clamp để sai số dấu phẩy động không đẩy asin ra khỏi miền xác định.
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(h)));
}

export interface PoiDistance {
  poi: PoiSummary;
  distanceM: number;
}

/**
 * Điểm gần nhất đang nằm trong bán kính kích hoạt của chính nó (UC04 - bước 3, 4).
 * Không có điểm nào trong vùng thì trả null để chờ tọa độ mới.
 */
export function findTriggeredPoi(
  pois: PoiSummary[],
  position: LatLng
): PoiDistance | null {
  let nearest: PoiDistance | null = null;

  for (const poi of pois) {
    const distanceM = haversineMeters(position, poi);
    const radiusM = poi.radiusM > 0 ? poi.radiusM : DEFAULT_GEOFENCE_RADIUS_M;

    if (distanceM > radiusM) continue;
    if (nearest === null || distanceM < nearest.distanceM) {
      nearest = { poi, distanceM };
    }
  }

  return nearest;
}
