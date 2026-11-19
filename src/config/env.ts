import { Platform } from 'react-native';

export const env = {
  // The Android emulator reaches the host machine through 10.0.2.2.
  apiBaseUrl: Platform.select({
    android: 'http://10.0.2.2:3000/api/v1',
    default: 'http://localhost:3000/api/v1',
  }),
  // Phase 1: every service answers from local mock data. Set to false once the
  // NestJS gateway is running; screens do not change.
  useMocks: true,
  defaultChatModel: 'auto',
  defaultImageModel: 'flux-schnell',
  defaultVideoModel: 'wan-2.2',
};
