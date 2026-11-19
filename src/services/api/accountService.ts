import { env } from '../../config/env';
import type { Usage, User } from '../../types';
import { delay } from '../../utils';
import { mockUsage, mockUser } from '../mock/data';
import { api } from './client';

export const accountService = {
  async profile(): Promise<User> {
    if (env.useMocks) {
      await delay(200);
      return mockUser;
    }
    const { data } = await api.get<User>('/profile');
    return data;
  },

  async usage(): Promise<Usage> {
    if (env.useMocks) {
      await delay(300);
      return mockUsage;
    }
    const { data } = await api.get<Usage>('/usage');
    return data;
  },

  async deleteAccountData(): Promise<void> {
    if (env.useMocks) {
      await delay(500);
      return;
    }
    await api.delete('/profile/data');
  },
};
