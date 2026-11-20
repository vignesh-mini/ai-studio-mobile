jest.mock('@react-native-clipboard/clipboard', () => ({
  setString: jest.fn(),
  getString: jest.fn(() => Promise.resolve('')),
}));

jest.mock(
  'react-native-safe-area-context',
  () => require('react-native-safe-area-context/jest/mock').default,
);

// Native download/gallery modules: not available in Jest.
jest.mock('react-native-blob-util', () => ({
  config: jest.fn(() => ({ fetch: jest.fn() })),
}));
jest.mock('@react-native-camera-roll/camera-roll', () => ({
  CameraRoll: { saveAsset: jest.fn() },
}));
jest.mock('react-native-video', () => 'Video');
jest.mock('react-native-keychain', () => ({
  ACCESSIBLE: {
    WHEN_UNLOCKED_THIS_DEVICE_ONLY: 'AccessibleWhenUnlockedThisDeviceOnly',
  },
  setGenericPassword: jest.fn(() => Promise.resolve(true)),
  getGenericPassword: jest.fn(() => Promise.resolve(false)),
  resetGenericPassword: jest.fn(() => Promise.resolve(true)),
}));
jest.mock('react-native-nitro-sound', () => ({
  __esModule: true,
  default: {
    startRecorder: jest.fn(() => Promise.resolve('file:///tmp/sound.mp4')),
    stopRecorder: jest.fn(() => Promise.resolve('file:///tmp/sound.mp4')),
    startPlayer: jest.fn(() => Promise.resolve('')),
    stopPlayer: jest.fn(() => Promise.resolve('')),
    addPlaybackEndListener: jest.fn(),
    removePlaybackEndListener: jest.fn(),
  },
}));
jest.mock('@react-native-documents/picker', () => ({
  pick: jest.fn(),
  isErrorWithCode: jest.fn(() => false),
  errorCodes: { OPERATION_CANCELED: 'OPERATION_CANCELED' },
  types: { pdf: 'application/pdf', plainText: 'text/plain' },
}));
