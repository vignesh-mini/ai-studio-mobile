import { create } from 'zustand';
import { env } from '../config/env';

interface SettingsState {
  defaultChatModel: string;
  imageModel: string;
  editModel: string;
  videoModel: string;
  autoSpeakReplies: boolean;
  setDefaultChatModel: (id: string) => void;
  setImageModel: (id: string) => void;
  setEditModel: (id: string) => void;
  setVideoModel: (id: string) => void;
  setAutoSpeakReplies: (value: boolean) => void;
}

export const useSettingsStore = create<SettingsState>(set => ({
  defaultChatModel: env.defaultChatModel,
  imageModel: env.defaultImageModel,
  editModel: env.defaultEditModel,
  videoModel: env.defaultVideoModel,
  autoSpeakReplies: false,
  setDefaultChatModel: defaultChatModel => set({ defaultChatModel }),
  setImageModel: imageModel => set({ imageModel }),
  setEditModel: editModel => set({ editModel }),
  setVideoModel: videoModel => set({ videoModel }),
  setAutoSpeakReplies: autoSpeakReplies => set({ autoSpeakReplies }),
}));
