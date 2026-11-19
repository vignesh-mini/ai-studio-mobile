import { create } from 'zustand';
import {
  clearStoredSession,
  saveRefreshToken,
} from '../services/sessionStorage';
import type { AuthSession, User } from '../types';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  /** "Remember me": keep the session in secure storage across app restarts. */
  remember: boolean;
  setSession: (session: AuthSession, remember?: boolean) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  remember: true,

  setSession: (
    { user, accessToken, refreshToken },
    remember = get().remember,
  ) => {
    set({ user, accessToken, refreshToken, remember });
    if (remember) saveRefreshToken(refreshToken);
    else clearStoredSession();
  },

  // Called after every token refresh; the old refresh token is now revoked, so the
  // stored one must be replaced or the next app launch could not restore the session.
  setTokens: (accessToken, refreshToken) => {
    set({ accessToken, refreshToken });
    if (get().remember) saveRefreshToken(refreshToken);
  },

  logout: () => {
    set({ user: null, accessToken: null, refreshToken: null });
    clearStoredSession();
  },
}));
