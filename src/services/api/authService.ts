import { env } from '../../config/env';
import type { AuthSession } from '../../types';
import { delay } from '../../utils';
import { mockUser } from '../mock/data';
import { api } from './client';

export type SocialProvider = 'google' | 'apple';

const mockSession = (
  email = mockUser.email,
  name = mockUser.name,
): AuthSession => ({
  user: { ...mockUser, email, name },
  accessToken: 'mock-access-token',
  refreshToken: 'mock-refresh-token',
});

export const authService = {
  async login(email: string, password: string): Promise<AuthSession> {
    if (env.mocks.auth) {
      await delay(600);
      return mockSession(email);
    }
    const { data } = await api.post<AuthSession>('/auth/login', {
      email,
      password,
    });
    return data;
  },

  async register(
    name: string,
    email: string,
    password: string,
  ): Promise<AuthSession> {
    if (env.mocks.auth) {
      await delay(600);
      return mockSession(email, name);
    }
    const { data } = await api.post<AuthSession>('/auth/register', {
      name,
      email,
      password,
    });
    return data;
  },

  /**
   * Social sign-in: the native SDK (Firebase / Supabase) returns an ID token, which the
   * backend verifies and exchanges for our own JWT pair.
   */
  async loginWithProvider(
    provider: SocialProvider,
    idToken = '',
  ): Promise<AuthSession> {
    if (env.mocks.auth) {
      await delay(600);
      return mockSession();
    }
    const { data } = await api.post<AuthSession>(`/auth/${provider}`, {
      idToken,
    });
    return data;
  },
};
