import { env } from '../../config/env';
import { delay } from '../../utils';
import type { Recording } from '../audio';
import { api } from './client';

const sampleQuestions = [
  'What is the difference between React and React Native?',
  'Give me three ideas for a weekend side project.',
  'Summarize how image generation jobs work in this app.',
];

export const voiceService = {
  /** Uploads a recorded clip; the backend transcribes it with Whisper. */
  async transcribe(recording: Recording): Promise<string> {
    if (env.mocks.voice) {
      await delay(900);
      return sampleQuestions[
        Math.floor(Math.random() * sampleQuestions.length)
      ];
    }
    const form = new FormData();
    form.append('audio', {
      uri: recording.uri,
      name: recording.name,
      type: recording.mimeType,
    } as unknown as Blob);
    const { data } = await api.post<{ text: string }>(
      '/audio/transcribe',
      form,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 60_000,
      },
    );
    return data.text;
  },

  /** Returns a short-lived URL of `text` read aloud. */
  async synthesize(text: string): Promise<string | null> {
    if (env.mocks.voice) return null;
    const { data } = await api.post<{ audioUrl: string }>(
      '/audio/speech',
      { text },
      { timeout: 60_000 },
    );
    return data.audioUrl.startsWith('/')
      ? `${env.apiBaseUrl}${data.audioUrl}`
      : data.audioUrl;
  },
};
