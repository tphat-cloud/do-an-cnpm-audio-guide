/**
 * Phiên đăng nhập Admin lưu trong localStorage (PRD 7.1.3).
 * Tách riêng để lớp gọi API (bắt 401) và lớp bảo vệ route dùng chung một nguồn.
 */

const TOKEN_KEY = 'smarttour.admin.token';
const ADMIN_KEY = 'smarttour.admin.info';

/** Thông tin tài khoản cơ bản trả về từ API01 (không có mật khẩu). */
export interface AdminInfo {
  id: number;
  username: string;
}

export function readAdminToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function readAdminInfo(): AdminInfo | null {
  const raw = localStorage.getItem(ADMIN_KEY);
  if (!raw) return null;

  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return null;

    const { id, username } = parsed as { id?: unknown; username?: unknown };
    if (typeof id !== 'number' || typeof username !== 'string') return null;

    return { id, username };
  } catch {
    return null;
  }
}

export function saveAdminSession(token: string, admin: AdminInfo): void {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(ADMIN_KEY, JSON.stringify(admin));
}

export function clearAdminSession(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(ADMIN_KEY);
}

/** Giải mã payload JWT (base64url, có thể chứa UTF-8) để đọc hạn token. */
function decodeTokenPayload(token: string): Record<string, unknown> | null {
  const payload = token.split('.')[1];
  if (!payload) return null;

  try {
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
    const binary = atob(padded);
    // atob trả chuỗi nhị phân; giải mã lại UTF-8 để JSON.parse đúng.
    const json = decodeURIComponent(
      Array.from(binary, (char) =>
        `%${char.charCodeAt(0).toString(16).padStart(2, '0')}`
      ).join('')
    );

    const parsed: unknown = JSON.parse(json);
    return typeof parsed === 'object' && parsed !== null
      ? (parsed as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

/** Token còn dùng được khi có trường exp và chưa hết hạn. */
export function isAdminTokenUsable(token: string | null): boolean {
  if (!token) return false;

  const exp = decodeTokenPayload(token)?.exp;
  return typeof exp === 'number' && exp * 1000 > Date.now();
}
