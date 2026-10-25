import { apiClient } from './client';
import type { Lang, LocationDetail, PoiNarration } from '../types';

/** API02 - GET /api/content/locations/:id (UC01). */
export async function fetchLocation(locationId: number): Promise<LocationDetail> {
  const { data } = await apiClient.get<LocationDetail>(`/content/locations/${locationId}`);
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
