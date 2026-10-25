import { apiClient } from './client';

/**
 * API10 - POST /api/content/presence (công khai).
 * Tín hiệu sống ngắn nên không cần chờ lâu bằng các API thường.
 */
const PRESENCE_TIMEOUT_MS = 5000;

/**
 * Gửi tín hiệu truy cập của một phiên khách.
 * Mọi lỗi đều bỏ qua: đếm truy cập không được làm phiền khách.
 */
export async function sendPresence(sessionId: string): Promise<void> {
  try {
    await apiClient.post(
      '/content/presence',
      { sessionId },
      { timeout: PRESENCE_TIMEOUT_MS }
    );
  } catch {
    // Lần gửi kế tiếp (30 giây sau) sẽ tự thử lại.
  }
}
