import axios from 'axios';

/**
 * Web Client gọi đường dẫn tương đối; vite.config.ts proxy /api và /uploads
 * sang backend cổng 5000 nên không cần cấu hình CORS ở trình duyệt.
 */
export const apiClient = axios.create({
  baseURL: '/api',
  timeout: 10000,
});

/** Mã HTTP của lỗi Axios; trả null khi mất mạng hoặc hết thời gian chờ. */
export function readHttpStatus(error: unknown): number | null {
  if (axios.isAxiosError(error) && error.response) {
    return error.response.status;
  }
  return null;
}
