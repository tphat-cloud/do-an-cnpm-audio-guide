import { apiClient } from './client';
import type { Lang, LocationDetail, PoiNarration } from '../types';

/**
 * API02 - GET /api/content/locations/:id?lang=xx (UC01, UC03, UC06, UC10).
 * Tên, mô tả địa danh và tên các điểm do backend trả theo ngôn ngữ `lang`.
 */
export async function fetchLocation(
  locationId: number,
  lang: Lang
): Promise<LocationDetail> {
  const { data } = await apiClient.get<LocationDetail>(
    `/content/locations/${locationId}`,
    { params: { lang } }
  );
  return data;
}

/** API03 - GET /api/content/pois/:id?lang=xx (UC03, UC05, UC10). */
export async function fetchPoiNarration(
  poiId: number,
  lang: Lang
): Promise<PoiNarration> {
  const { data } = await apiClient.get<PoiNarration>(`/content/pois/${poiId}`, {
    params: { lang },
  });
  return data;
}
