import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type UserTheme = 'light' | 'dark';
export type UserLang = 'en' | 'ta';

export interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: {
    id: string;
    role: string;
    fullName: string;
    languagePref: UserLang;
    themePref?: UserTheme;
  } | null;
  setAuth: (access: string, refresh: string, user: any) => void;
  logout: () => void;
  setLanguage: (lang: UserLang) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      setAuth: (accessToken, refreshToken, user) => set({ accessToken, refreshToken, user }),
      logout: () => set({ accessToken: null, refreshToken: null, user: null }),
      setLanguage: (lang) => set((state) => ({ user: state.user ? { ...state.user, languagePref: lang } : null })),
    }),
    {
      name: 'auth-storage',
    }
  )
);
