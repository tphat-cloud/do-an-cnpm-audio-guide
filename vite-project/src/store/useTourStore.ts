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
  /** Đang tải lại địa danh do đổi ngôn ngữ; nội dung cũ vẫn hiển thị (UC03). */
  refreshing: boolean;
  /** Đổi ngôn ngữ thất bại: giữ ngôn ngữ cũ, hiện thông báo và nút thử lại (5b). */
  refreshFailed: boolean;
  /** Ngôn ngữ vừa tải lỗi, dùng cho nút "Thử lại". */
  failedLang: Lang | null;
  listenedPoiIds: number[];
  setLang: (lang: Lang) => void;
  loadLocation: (locationId: number) => Promise<void>;
  retryLangReload: () => void;
  markListened: (poiId: number) => void;
}

// Tăng mỗi lần tải địa danh; phản hồi của lần tải đã bị thay thế thì bỏ qua.
let requestSeq = 0;

/**
 * Tải lại địa danh theo ngôn ngữ mới nhưng GIỮ nội dung đang hiển thị (UC03),
 * nhờ vậy trang không chớp trắng khi du khách đổi ngôn ngữ.
 */
async function refreshForLang(
  locationId: number,
  target: Lang,
  previous: Lang,
  set: (partial: Partial<TourState>) => void,
  get: () => TourState
): Promise<void> {
  const seq = (requestSeq += 1);
  set({ refreshing: true, refreshFailed: false });

  try {
    const location = await fetchLocation(locationId, target);
    if (seq !== requestSeq || get().locationId !== locationId) return;

    set({ location, refreshing: false, refreshFailed: false, failedLang: null });
  } catch {
    if (seq !== requestSeq || get().locationId !== locationId) return;

    // UC03 - 5b: mất mạng thì giữ nguyên ngôn ngữ cũ, báo lỗi và cho thử lại.
    localStorage.setItem(LANG_STORAGE_KEY, previous);
    set({
      lang: previous,
      refreshing: false,
      refreshFailed: true,
      failedLang: target,
    });
  }
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
  refreshing: false,
  refreshFailed: false,
  failedLang: null,
  listenedPoiIds: [],

  setLang: (lang) => {
    const current = get();
    if (lang === current.lang) return;

    localStorage.setItem(LANG_STORAGE_KEY, lang);

    // Chưa có dữ liệu địa danh: chỉ đổi ngôn ngữ giao diện, lần tải sau dùng ?lang mới.
    if (current.locationId === null || current.location === null || current.status !== 'ready') {
      set({ lang, refreshFailed: false, failedLang: null });
      return;
    }

    // API02 trả tên/mô tả địa danh và tên điểm theo ?lang nên phải tải lại.
    set({ lang });
    void refreshForLang(current.locationId, lang, current.lang, set, get);
  },

  retryLangReload: () => {
    const { locationId, failedLang, lang } = get();
    const target = failedLang ?? lang;
    if (locationId === null) return;

    localStorage.setItem(LANG_STORAGE_KEY, target);
    set({ lang: target });
    void refreshForLang(locationId, target, target, set, get);
  },

  loadLocation: async (locationId) => {
    if (!Number.isInteger(locationId) || locationId <= 0) {
      requestSeq += 1;
      set({
        locationId: null,
        location: null,
        status: 'error',
        errorKind: 'invalid',
        refreshing: false,
        refreshFailed: false,
        failedLang: null,
        listenedPoiIds: [],
      });
      return;
    }

    sessionStorage.setItem(LOCATION_STORAGE_KEY, String(locationId));
    const seq = (requestSeq += 1);
    set({
      locationId,
      location: null,
      status: 'loading',
      errorKind: null,
      refreshing: false,
      refreshFailed: false,
      failedLang: null,
      listenedPoiIds: readListenedPoiIds(locationId),
    });

    try {
      const location = await fetchLocation(locationId, get().lang);
      // Bỏ qua kết quả của địa danh cũ khi người dùng đã đổi QR khác.
      if (seq !== requestSeq || get().locationId !== locationId) return;

      set({ location, status: 'ready', errorKind: null });
    } catch (error) {
      if (seq !== requestSeq || get().locationId !== locationId) return;

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
