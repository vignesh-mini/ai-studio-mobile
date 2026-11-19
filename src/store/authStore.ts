import { create } from 'zustand';
import type { AuthSession, User } from '../types';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  setSession: (session: AuthSession) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  logout: () => void;
}

// Tokens live in memory for Phase 1. Persist them with react-native-keychain once
// real auth (Firebase / Supabase) is wired up in Phase 2.
export const useAuthStore = create<AuthState>(set => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  setSession: ({ user, accessToken, refreshToken }) =>
    set({ user, accessToken, refreshToken }),
  setTokens: (accessToken, refreshToken) => set({ accessToken, refreshToken }),
  logout: () => set({ user: null, accessToken: null, refreshToken: null }),
}));
