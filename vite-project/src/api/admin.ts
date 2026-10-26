import axios from 'axios';
import { apiClient, readHttpStatus } from './client';
import { clearAdminSession, readAdminToken } from './adminToken';
import type { Lang, LocationDetail } from '../types';

/**
 * API quản trị (PRD 6.2 - API01, API04, API05, API06, API07, API08).
 * Dùng axios riêng để mọi yêu cầu tự gắn Bearer token và tự xử lý 401,
 * không ảnh hưởng tới các lời gọi công khai của Web Client.
 */

/** Bản demo chỉ có một địa danh; Admin luôn thao tác trên địa danh này. */
export const ADMIN_LOCATION_ID = 1;

/** Nơi đưa Admin về khi token thiếu hoặc hết hạn (PRD 7.1.3 - 7a). */
export const ADMIN_LOGIN_PATH = '/admin/login';
export const ADMIN_LOGIN_EXPIRED_PATH = `${ADMIN_LOGIN_PATH}?expired=1`;

export interface LoginResponse {
  token: string;
  expiresIn: number;
  admin: { id: number; username: string };
}

/** Dữ liệu gửi lên API04. */
export interface PoiCreatePayload {
  locationId: number;
  name: string;
  latitude: number;
  longitude: number;
  radiusM: number;
  orderIndex: number;
}

/** Điểm tham quan sau khi lưu (API04, API05). */
export interface PoiDetail extends PoiCreatePayload {
  id: number;
}

/** Dữ liệu gửi lên API05: như API04 nhưng không có locationId. */
export type PoiUpdatePayload = Omit<PoiCreatePayload, 'locationId'>;

/** Kết quả xóa điểm tham quan (API06). */
export interface PoiDeleteResponse {
  message: string;
  deletedTranslations: number;
}

/** Kết quả lưu nội dung một ngôn ngữ (API08). */
export interface TranslationResponse {
  poiId: number;
  lang: Lang;
  text: string;
  audioUrl: string | null;
  overwritten: boolean;
}

interface ApiErrorBody {
  message?: string;
  errors?: Record<string, string>;
  retryAfterSeconds?: number;
}

/** Lỗi đã đọc từ body của backend, dùng để báo đúng ô nhập. */
export interface ParsedApiError {
  status: number | null;
  message: string;
  errors: Record<string, string>;
  retryAfterSeconds: number | null;
}

export const adminClient = axios.create({
  baseURL: '/api',
  timeout: 15000,
});

adminClient.interceptors.request.use((config) => {
  const token = readAdminToken();
  if (token) {
    config.headers.set('Authorization', `Bearer ${token}`);
  }
  return config;
});

adminClient.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    // 401 = thiếu hoặc hết hạn token: xóa phiên rồi về trang đăng nhập kèm thông báo.
    if (readHttpStatus(error) === 401) {
      clearAdminSession();
      window.location.replace(ADMIN_LOGIN_EXPIRED_PATH);
    }
    return Promise.reject(error);
  }
);

/**
 * API01 - POST /api/auth/login (UC07).
 * Cố ý dùng apiClient công khai: 401 ở đây là sai mật khẩu, không phải hết phiên.
 */
export async function loginAdmin(
  username: string,
  password: string
): Promise<LoginResponse> {
  const { data } = await apiClient.post<LoginResponse>('/auth/login', {
    username,
    password,
  });
  return data;
}

/** API02 - lấy địa danh kèm danh sách điểm cho trang quản trị. */
export async function fetchAdminLocation(): Promise<LocationDetail> {
  const { data } = await adminClient.get<LocationDetail>(
    `/content/locations/${ADMIN_LOCATION_ID}`
  );
  return data;
}

/** Số liệu truy cập trả về từ API11. */
export interface PresenceStats {
  activeSessions: number;
  totalSessions: number;
}

/** API11 - GET /api/content/presence/count (chỉ Admin). */
export async function fetchPresence(): Promise<PresenceStats> {
  const { data } = await adminClient.get<PresenceStats>(
    '/content/presence/count'
  );
  return data;
}

/** API04 - POST /api/content/pois (UC08). */
export async function createPoi(payload: PoiCreatePayload): Promise<PoiDetail> {
  const { data } = await adminClient.post<PoiDetail>('/content/pois', payload);
  return data;
}

/** API05 - PUT /api/content/pois/:id (UC08). */
export async function updatePoi(
  poiId: number,
  payload: PoiUpdatePayload
): Promise<PoiDetail> {
  const { data } = await adminClient.put<PoiDetail>(
    `/content/pois/${poiId}`,
    payload
  );
  return data;
}

/** API06 - DELETE /api/content/pois/:id (UC08), xóa luôn nội dung và audio. */
export async function deletePoi(poiId: number): Promise<PoiDeleteResponse> {
  const { data } = await adminClient.delete<PoiDeleteResponse>(
    `/content/pois/${poiId}`
  );
  return data;
}

/** Nội dung một ngôn ngữ trả về từ API07; ngôn ngữ chưa có nội dung thì null. */
export interface PoiTranslationEntry {
  lang: Lang;
  /** Tên điểm theo ngôn ngữ này; chưa đặt thì null (API07). */
  name: string | null;
  text: string | null;
  audioUrl: string | null;
}

export interface PoiTranslationsResponse {
  poiId: number;
  translations: PoiTranslationEntry[];
}

/**
 * API07 - GET /api/content/pois/:id/translations (UC09).
 * Trả đủ 5 ngôn ngữ trong một lời gọi, dùng để điền sẵn cả 5 tab.
 */
export async function fetchPoiTranslations(
  poiId: number
): Promise<PoiTranslationsResponse> {
  const { data } = await adminClient.get<PoiTranslationsResponse>(
    `/content/pois/${poiId}/translations`
  );
  return data;
}

/** Dữ liệu gửi lên API08 cho một ngôn ngữ. */
export interface TranslationPayload {
  /** Tên điểm theo ngôn ngữ; chuỗi rỗng nghĩa là xóa tên (lưu NULL). */
  name: string;
  text: string;
  file: File | null;
}

/** API08 - PUT multipart/form-data, báo tiến độ tải file (PRD 7.1.5). */
export async function savePoiTranslation(
  poiId: number,
  lang: Lang,
  payload: TranslationPayload,
  onProgress: (percent: number) => void
): Promise<TranslationResponse> {
  const form = new FormData();
  form.append('name', payload.name);
  form.append('text', payload.text);
  if (payload.file) {
    form.append('audio', payload.file);
  }

  const { data } = await adminClient.put<TranslationResponse>(
    `/content/pois/${poiId}/translations/${lang}`,
    form,
    {
      // File audio tối đa 10 MB nên thời gian chờ dài hơn các API thường.
      timeout: 120000,
      onUploadProgress: (event) => {
        const total = event.total ?? 0;
        onProgress(
          total > 0 ? Math.min(100, Math.round((event.loaded / total) * 100)) : 0
        );
      },
    }
  );
  return data;
}

/** Đọc lỗi backend thành dạng giao diện dùng được (message, errors, retryAfter). */
export function readApiError(error: unknown): ParsedApiError {
  const status = readHttpStatus(error);
  let body: ApiErrorBody = {};

  if (axios.isAxiosError(error) && error.response) {
    const data: unknown = error.response.data;
    if (typeof data === 'object' && data !== null) {
      body = data as ApiErrorBody;
    }
  }

  return {
    status,
    message:
      typeof body.message === 'string' && body.message !== ''
        ? body.message
        : 'Không kết nối được máy chủ',
    errors:
      typeof body.errors === 'object' && body.errors !== null ? body.errors : {},
    retryAfterSeconds:
      typeof body.retryAfterSeconds === 'number' ? body.retryAfterSeconds : null,
  };
}
