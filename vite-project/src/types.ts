/** 5 ngôn ngữ hỗ trợ (PRD 2.7.3). */
export type Lang = 'vi' | 'en' | 'zh' | 'ko' | 'ja';

/** Một điểm tham quan trong danh sách của địa danh (API02). */
export interface PoiSummary {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  radiusM: number;
  orderIndex: number;
}

/** Địa danh kèm danh sách điểm tham quan (API02 - UC01). */
export interface LocationDetail {
  id: number;
  name: string;
  description: string | null;
  pois: PoiSummary[];
}

/** Nội dung thuyết minh một điểm theo ngôn ngữ (API03 - UC05, UC10). */
export interface PoiNarration {
  poiId: number;
  name: string;
  lang: Lang;
  text: string;
  audioUrl: string | null;
  fallback: boolean;
}
