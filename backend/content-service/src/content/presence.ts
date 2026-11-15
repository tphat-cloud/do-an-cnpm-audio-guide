import type { ResultSetHeader, RowDataPacket } from 'mysql2';
import { pool } from '../config/database';

/**
 * Đếm người đang truy cập (API10, API11).
 *
 * Số liệu lưu trong bảng `visitor_sessions` thay vì Map trong bộ nhớ: không mất
 * khi khởi động lại backend và nhiều instance (nếu chạy nhiều) cùng đọc chung
 * một nguồn. `session_id` là khóa chính nên mỗi phiên chỉ có đúng một dòng;
 * nhịp tim 30 giây chỉ cập nhật `last_seen_at`, không sinh thêm dòng mới.
 */

/** Phiên không gửi tín hiệu trong 2 phút thì coi như đã rời trang. */
const SESSION_TTL_SECONDS = 2 * 60;

/** Phiên cũ hơn số ngày này bị dọn để bảng không phình mãi. */
const RETENTION_DAYS = 90;

/** Mã phiên do Web Client sinh: chữ, số, gạch ngang/gạch dưới, 8-64 ký tự. */
const SESSION_ID_PATTERN = /^[A-Za-z0-9_-]{8,64}$/;

export function isValidSessionId(value: unknown): value is string {
  return typeof value === 'string' && SESSION_ID_PATTERN.test(value);
}

/** Ghi nhận tín hiệu sống của một phiên (API10). */
export async function recordPresence(sessionId: string): Promise<void> {
  // Một phiên chỉ có một dòng: đã có thì chỉ đẩy last_seen_at lên hiện tại.
  await pool.query(
    `INSERT INTO visitor_sessions (session_id, last_seen_at)
     VALUES (?, CURRENT_TIMESTAMP)
     ON DUPLICATE KEY UPDATE last_seen_at = CURRENT_TIMESTAMP`,
    [sessionId]
  );
}

/** Số phiên đang hoạt động và tổng số phiên đã từng vào (API11). */
export async function countPresence(): Promise<{
  activeSessions: number;
  totalSessions: number;
}> {
  // "Đang hoạt động" = có tín hiệu trong SESSION_TTL_SECONDS giây gần nhất.
  // SESSION_TTL_SECONDS là hằng số nội bộ nên nối thẳng vào câu lệnh; MySQL
  // không nhận tham số ? cho đơn vị của INTERVAL.
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT
       COUNT(*) AS totalSessions,
       COUNT(CASE WHEN last_seen_at >= NOW() - INTERVAL ${SESSION_TTL_SECONDS} SECOND
                  THEN 1 END) AS activeSessions
     FROM visitor_sessions`
  );

  const row = rows[0];
  return {
    activeSessions: Number(row?.activeSessions ?? 0),
    totalSessions: Number(row?.totalSessions ?? 0),
  };
}

/**
 * Dọn phiên cũ hơn RETENTION_DAYS ngày (gọi lúc khởi động và mỗi ngày một lần,
 * xem src/index.ts). Không dọn thì bảng chỉ tăng dù mỗi phiên chỉ chiếm một dòng.
 */
export async function pruneOldSessions(): Promise<number> {
  const [result] = await pool.query<ResultSetHeader>(
    `DELETE FROM visitor_sessions
      WHERE last_seen_at < NOW() - INTERVAL ${RETENTION_DAYS} DAY`
  );
  return result.affectedRows;
}
