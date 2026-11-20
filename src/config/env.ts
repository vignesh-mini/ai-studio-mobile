import { Platform } from 'react-native';

/**
 * The deployed backend used by release builds (the APK you install on a phone).
 * Replace with your Render service URL after the first deploy.
 */
const PRODUCTION_API_URL = 'https://ai-studio-backend-xf1h.onrender.com/api/v1';

// Development builds talk to the backend on this PC; the Android emulator reaches the
// host machine through 10.0.2.2.
const DEVELOPMENT_API_URL = Platform.select({
  android: 'http://10.0.2.2:3000/api/v1',
  default: 'http://localhost:3000/api/v1',
});

export const env = {
  apiBaseUrl: __DEV__ ? DEVELOPMENT_API_URL : PRODUCTION_API_URL,
  // Which features answer from local mock data instead of the backend. Auth, models,
  // chat and account run on the NestJS gateway since Phase 3; media, documents and
  // voice switch over as their backend phases land. Screens do not change.
  mocks: {
    auth: false,
    models: false,
    chat: false,
    account: false,
    images: false,
    videos: false,
    documents: false,
    voice: false,
  },
  defaultChatModel: 'auto',
  defaultImageModel: 'flux-schnell',
  defaultEditModel: 'flux-2-klein',
  defaultVideoModel: 'wan-2.2',
};
