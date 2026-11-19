import { env } from '../../config/env';
import { delay } from '../../utils';
import { api } from './client';

const sampleQuestions = [
  'What is the difference between React and React Native?',
  'Give me three ideas for a weekend side project.',
  'Summarize how image generation jobs work in this app.',
];

export const voiceService = {
  /** Uploads a recorded audio clip; the backend transcribes it with Whisper. */
  async transcribe(audioUri: string): Promise<string> {
    if (env.mocks.voice) {
      await delay(900);
      return sampleQuestions[
        Math.floor(Math.random() * sampleQuestions.length)
      ];
    }
    const form = new FormData();
    form.append('audio', {
      uri: audioUri,
      name: 'speech.m4a',
      type: 'audio/m4a',
    } as unknown as Blob);
    const { data } = await api.post<{ text: string }>(
      '/audio/transcribe',
      form,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
      },
    );
    return data.text;
  },

  /** Returns a signed URL for synthesized speech of `text`. */
  async synthesize(text: string): Promise<string | null> {
    if (env.mocks.voice) return null;
    const { data } = await api.post<{ audioUrl: string }>('/audio/speech', {
      text,
    });
    return data.audioUrl;
  },
};
