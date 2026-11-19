import { env } from '../../config/env';
import type { AIModel } from '../../types';
import { delay } from '../../utils';
import { mockModels } from '../mock/data';
import { api } from './client';

export const modelService = {
  async list(): Promise<AIModel[]> {
    if (env.mocks.models) {
      await delay(250);
      return mockModels;
    }
    const { data } = await api.get<AIModel[]>('/models');
    return data;
  },
};
