import { create } from 'zustand';
import {
  clearAdminSession,
  readAdminInfo,
  readAdminToken,
  saveAdminSession,
  type AdminInfo,
} from '../api/adminToken';

interface AdminState {
  token: string | null;
  admin: AdminInfo | null;
  signIn: (token: string, admin: AdminInfo) => void;
  signOut: () => void;
}

/**
 * Phiên đăng nhập Admin (PRD 2.5 - Zustand, PRD 7.1.3).
 * Token được giữ trong localStorage để tải lại trang /admin vẫn còn phiên.
 */
export const useAdminStore = create<AdminState>()((set) => ({
  token: readAdminToken(),
  admin: readAdminInfo(),

  signIn: (token, admin) => {
    saveAdminSession(token, admin);
    set({ token, admin });
  },

  signOut: () => {
    clearAdminSession();
    set({ token: null, admin: null });
  },
}));
