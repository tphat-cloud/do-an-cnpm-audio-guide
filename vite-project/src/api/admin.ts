import axios from 'axios';
import { apiClient, readHttpStatus } from './client';
import { clearAdminSession, readAdminToken } from './adminToken';
import type { Lang, LocationDetail, PoiNarration } from '../types';

/**
 * API quản trị (PRD 6.2 - API01, API04, API08).
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

/** Điểm tham quan sau khi lưu (API04). */
export interface PoiDetail extends PoiCreatePayload {
  id: number;
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

/** API04 - POST /api/content/pois (UC08). */
export async function createPoi(payload: PoiCreatePayload): Promise<PoiDetail> {
  const { data } = await adminClient.post<PoiDetail>('/content/pois', payload);
  return data;
}

/**
 * API03 - đọc nội dung hiện có để điền sẵn biểu mẫu (UC09).
 * `fallback: true` nghĩa là ngôn ngữ này chưa có nội dung riêng.
 */
export async function fetchPoiContent(
  poiId: number,
  lang: Lang
): Promise<PoiNarration> {
  const { data } = await adminClient.get<PoiNarration>(`/content/pois/${poiId}`, {
    params: { lang },
  });
  return data;
}

/** API08 - PUT multipart/form-data, báo tiến độ tải file (PRD 7.1.5). */
export async function savePoiTranslation(
  poiId: number,
  lang: Lang,
  text: string,
  file: File | null,
  onProgress: (percent: number) => void
): Promise<TranslationResponse> {
  const form = new FormData();
  form.append('text', text);
  if (file) {
    form.append('audio', file);
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
