import { PermissionsAndroid, Platform } from 'react-native';
import Sound from 'react-native-nitro-sound';

/** Asks for the microphone on Android; iOS shows its own prompt on first recording. */
export async function requestMicrophone(): Promise<boolean> {
  if (Platform.OS !== 'android') return true;
  const result = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
    {
      title: 'Microphone',
      message: 'AI Studio needs the microphone to hear your question.',
      buttonPositive: 'Allow',
      buttonNegative: 'Not now',
    },
  );
  return result === PermissionsAndroid.RESULTS.GRANTED;
}

export interface Recording {
  uri: string;
  name: string;
  mimeType: string;
  durationMs: number;
}

let startedAt = 0;

export async function startRecording() {
  await Sound.stopPlayer().catch(() => undefined);
  startedAt = Date.now();
  await Sound.startRecorder();
}

/** AAC in an MP4 container on Android (sound.mp4), M4A on iOS; Whisper reads both. */
export async function stopRecording(): Promise<Recording> {
  const path = await Sound.stopRecorder();
  return {
    uri: path.startsWith('file://') ? path : `file://${path}`,
    name: Platform.OS === 'android' ? 'speech.mp4' : 'speech.m4a',
    mimeType: 'audio/mp4',
    durationMs: Date.now() - startedAt,
  };
}

export function cancelRecording() {
  return Sound.stopRecorder().catch(() => undefined);
}

/** Plays a URL and resolves when playback finishes or is stopped. */
export function playUrl(url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    Sound.addPlaybackEndListener(() => {
      Sound.removePlaybackEndListener();
      resolve();
    });
    Sound.startPlayer(url).catch(error => {
      Sound.removePlaybackEndListener();
      reject(error);
    });
  });
}

export function stopPlayback() {
  Sound.removePlaybackEndListener();
  return Sound.stopPlayer().catch(() => undefined);
}
