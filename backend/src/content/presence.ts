/**
 * Đếm người đang truy cập (API10, API11).
 *
 * Cố ý giữ đơn giản: không dùng Redis, không thêm bảng CSDL, chỉ một Map
 * trong bộ nhớ tiến trình. Hệ quả chấp nhận được với đồ án: số liệu mất khi
 * khởi động lại backend và mỗi instance (nếu chạy nhiều) đếm riêng.
 */

/** Phiên không gửi tín hiệu trong 2 phút thì coi như đã rời trang. */
const SESSION_TTL_MS = 2 * 60 * 1000;

/** Mã phiên do Web Client sinh: chữ, số, gạch ngang/gạch dưới, 8-64 ký tự. */
const SESSION_ID_PATTERN = /^[A-Za-z0-9_-]{8,64}$/;

/** Phiên -> thời điểm nhận tín hiệu gần nhất. */
const activeSessions = new Map<string, number>();

/** Mọi mã phiên từng xuất hiện; mỗi mã chỉ tính vào tổng một lần. */
const knownSessions = new Set<string>();

export function isValidSessionId(value: unknown): value is string {
  return typeof value === 'string' && SESSION_ID_PATTERN.test(value);
}

/** Xóa phiên hết hạn; gọi trước mỗi lần đọc/ghi để không cần bộ hẹn giờ riêng. */
function pruneExpired(now: number): void {
  for (const [sessionId, lastSeenAt] of activeSessions) {
    if (now - lastSeenAt > SESSION_TTL_MS) {
      activeSessions.delete(sessionId);
    }
  }
}

/** Ghi nhận tín hiệu sống của một phiên (API10). */
export function recordPresence(sessionId: string, now: number = Date.now()): void {
  pruneExpired(now);
  activeSessions.set(sessionId, now);
  knownSessions.add(sessionId);
}

/** Số phiên đang hoạt động và tổng số mã phiên đã từng vào (API11). */
export function countPresence(now: number = Date.now()): {
  activeSessions: number;
  totalSessions: number;
} {
  pruneExpired(now);
  return {
    activeSessions: activeSessions.size,
    totalSessions: knownSessions.size,
  };
}
