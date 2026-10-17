import { create } from 'zustand';

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  role: 'admin' | 'user';
}

interface AuthState {
  user: AuthUser | null;
  login: (user: AuthUser) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  // Mặc định ban đầu chưa login
  user: null,
  login: (user) => set({ user }),
  logout: () => set({ user: null }),
}));
