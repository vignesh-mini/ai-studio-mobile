import { Platform } from 'react-native';

export const env = {
  // The Android emulator reaches the host machine through 10.0.2.2.
  apiBaseUrl: Platform.select({
    android: 'http://10.0.2.2:3000/api/v1',
    default: 'http://localhost:3000/api/v1',
  }),
  // Which features answer from local mock data instead of the backend. Auth, models,
  // chat and account run on the NestJS gateway since Phase 3; media, documents and
  // voice switch over as their backend phases land. Screens do not change.
  mocks: {
    auth: false,
    models: false,
    chat: false,
    account: false,
    media: true,
    documents: true,
    voice: true,
  },
  defaultChatModel: 'auto',
  defaultImageModel: 'flux-schnell',
  defaultVideoModel: 'wan-2.2',
};
