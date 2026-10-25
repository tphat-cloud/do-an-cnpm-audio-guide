import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { sendPresence } from '../api/presence';

/** Mỗi tab là một phiên; tab mới (hoặc đóng rồi mở lại) tính là lượt mới. */
const SESSION_KEY = 'smarttour.visitor.session';

const HEARTBEAT_MS = 30_000;

/**
 * Lấy mã phiên của tab hiện tại, chưa có thì sinh ngẫu nhiên và giữ lại trong
 * sessionStorage. 32 ký tự hex nằm trong giới hạn 8-64 của API10.
 */
function readOrCreateSessionId(): string {
  try {
    const existing = window.sessionStorage.getItem(SESSION_KEY);
    if (existing) return existing;

    const bytes = new Uint8Array(16);
    window.crypto.getRandomValues(bytes);
    const created = Array.from(bytes, (byte) =>
      byte.toString(16).padStart(2, '0')
    ).join('');

    window.sessionStorage.setItem(SESSION_KEY, created);
    return created;
  } catch {
    // Trình duyệt chặn sessionStorage: vẫn gửi tín hiệu cho tab này.
    return `tab-${Date.now().toString(36)}`;
  }
}

/**
 * Gửi tín hiệu truy cập của khách (API10): ngay khi vào trang và lặp lại mỗi
 * 30 giây. Không áp dụng cho khu vực /admin để số đếm chỉ phản ánh người xem
 * nội dung; khách không thấy bất kỳ thông báo nào nếu gửi thất bại.
 */
export function VisitorPresence() {
  const { pathname } = useLocation();
  const isVisitorRoute = !pathname.startsWith('/admin');

  useEffect(() => {
    if (!isVisitorRoute) return;

    const sessionId = readOrCreateSessionId();
    const ping = () => void sendPresence(sessionId);

    ping();
    const timer = window.setInterval(ping, HEARTBEAT_MS);

    return () => window.clearInterval(timer);
  }, [isVisitorRoute]);

  return null;
}
