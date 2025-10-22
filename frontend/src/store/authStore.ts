import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '../types';
import api from '../services/api';

interface AuthState {
  token: string | null;
  user: User | null;
  setAuth: (token: string, user: User) => void;
  setUser: (user: User) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set: (partial: Partial<AuthState>) => void) => ({
      token: null,
      user: null,
      setAuth: (token: string, user: User) => set({ token, user }),
      setUser: (user: User) => set({ user }),
      logout: async () => {
        try {
          await api.post('/auth/logout');
        } catch {}
        set({ token: null, user: null });
      },
    }),
    {
      name: 'auth',
      partialize: (state: AuthState) => ({ token: state.token, user: state.user }),
    }
  )
);

