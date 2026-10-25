import { create } from 'zustand';
import { fetchLocation } from '../api/content';
import { readHttpStatus } from '../api/client';
import { detectDefaultLang, isSupportedLang } from '../i18n/messages';
import type { Lang, LocationDetail } from '../types';

const LANG_STORAGE_KEY = 'smarttour.lang';
const LOCATION_STORAGE_KEY = 'smarttour.location_id';
const LISTENED_STORAGE_PREFIX = 'smarttour.listened.';

type LoadStatus = 'idle' | 'loading' | 'ready' | 'error';

/** invalid: mã QR sai (404); network: mất mạng hoặc API lỗi (UC01 4a). */
type ErrorKind = 'invalid' | 'network' | null;

/** Đọc ngôn ngữ đã lưu, chưa có thì theo trình duyệt (UC03 - 1a). */
function readStoredLang(): Lang {
  const stored = localStorage.getItem(LANG_STORAGE_KEY);
  return stored && isSupportedLang(stored) ? stored : detectDefaultLang();
}

/** Điểm đã nghe được lưu trong phiên (PRD 2.7.4 - sessionStorage). */
function readListenedPoiIds(locationId: number | null): number[] {
  if (locationId === null) return [];

  try {
    const raw = sessionStorage.getItem(LISTENED_STORAGE_PREFIX + locationId);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((id) => typeof id === 'number') : [];
  } catch {
    return [];
  }
}

interface TourState {
  lang: Lang;
  locationId: number | null;
  location: LocationDetail | null;
  status: LoadStatus;
  errorKind: ErrorKind;
  listenedPoiIds: number[];
  setLang: (lang: Lang) => void;
  loadLocation: (locationId: number) => Promise<void>;
  markListened: (poiId: number) => void;
}

/**
 * State dùng chung giữa trang chào và màn hình tham quan (Zustand - PRD 2.5).
 * location_id được lưu vào sessionStorage để tải lại trang /tour vẫn có dữ liệu.
 */
export const useTourStore = create<TourState>()((set, get) => ({
  lang: readStoredLang(),
  locationId: null,
  location: null,
  status: 'idle',
  errorKind: null,
  listenedPoiIds: [],

  setLang: (lang) => {
    localStorage.setItem(LANG_STORAGE_KEY, lang);
    set({ lang });
  },

  loadLocation: async (locationId) => {
    if (!Number.isInteger(locationId) || locationId <= 0) {
      set({
        locationId: null,
        location: null,
        status: 'error',
        errorKind: 'invalid',
        listenedPoiIds: [],
      });
      return;
    }

    sessionStorage.setItem(LOCATION_STORAGE_KEY, String(locationId));
    set({
      locationId,
      status: 'loading',
      errorKind: null,
      listenedPoiIds: readListenedPoiIds(locationId),
    });

    try {
      const location = await fetchLocation(locationId);
      // Bỏ qua kết quả của địa danh cũ khi người dùng đã đổi QR khác.
      if (get().locationId !== locationId) return;

      set({ location, status: 'ready', errorKind: null });
    } catch (error) {
      if (get().locationId !== locationId) return;

      set({
        location: null,
        status: 'error',
        errorKind: readHttpStatus(error) === 404 ? 'invalid' : 'network',
      });
    }
  },

  markListened: (poiId) => {
    const { locationId, listenedPoiIds } = get();
    if (locationId === null || listenedPoiIds.includes(poiId)) return;

    const next = [...listenedPoiIds, poiId];
    sessionStorage.setItem(LISTENED_STORAGE_PREFIX + locationId, JSON.stringify(next));
    set({ listenedPoiIds: next });
  },
}));

/** Đọc lại location_id đã quét khi tải lại trang /tour. */
export function readStoredLocationId(): number | null {
  const raw = sessionStorage.getItem(LOCATION_STORAGE_KEY);
  const parsed = raw === null ? NaN : Number(raw);

  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}
