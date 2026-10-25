import { useEffect, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { isAdminTokenUsable } from '../api/adminToken';
import { useAdminStore } from '../store/useAdminStore';

interface AdminGuardProps {
  children: ReactNode;
}

/**
 * Chặn các trang /admin khi chưa có token hợp lệ (PRD 3.3.7 - 7b).
 * Token đã hết hạn tại chỗ thì xóa phiên và báo "Phiên đăng nhập đã hết hạn".
 */
export function AdminGuard({ children }: AdminGuardProps) {
  const navigate = useNavigate();
  const token = useAdminStore((state) => state.token);
  const signOut = useAdminStore((state) => state.signOut);
  const usable = isAdminTokenUsable(token);

  useEffect(() => {
    if (!token) {
      navigate('/admin/login', { replace: true });
      return;
    }

    if (!usable) {
      signOut();
      navigate('/admin/login?expired=1', { replace: true });
    }
  }, [token, usable, signOut, navigate]);

  // Chờ chuyển trang; không hiện nội dung quản trị khi phiên chưa hợp lệ.
  if (!token || !usable) return null;

  return <>{children}</>;
}
