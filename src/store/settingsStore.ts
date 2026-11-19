import { create } from 'zustand';
import { env } from '../config/env';

interface SettingsState {
  defaultChatModel: string;
  imageModel: string;
  videoModel: string;
  autoSpeakReplies: boolean;
  setDefaultChatModel: (id: string) => void;
  setImageModel: (id: string) => void;
  setVideoModel: (id: string) => void;
  setAutoSpeakReplies: (value: boolean) => void;
}

export const useSettingsStore = create<SettingsState>(set => ({
  defaultChatModel: env.defaultChatModel,
  imageModel: env.defaultImageModel,
  videoModel: env.defaultVideoModel,
  autoSpeakReplies: false,
  setDefaultChatModel: defaultChatModel => set({ defaultChatModel }),
  setImageModel: imageModel => set({ imageModel }),
  setVideoModel: videoModel => set({ videoModel }),
  setAutoSpeakReplies: autoSpeakReplies => set({ autoSpeakReplies }),
}));
