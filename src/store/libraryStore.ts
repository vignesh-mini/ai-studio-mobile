import { create } from 'zustand';
import { env } from '../config/env';
import type { GeneratedAsset } from '../types';
import { mockAssets } from '../services/mock/data';

interface LibraryState {
  assets: GeneratedAsset[];
  addAssets: (assets: GeneratedAsset[]) => void;
  /** Replaces backend assets with GET /library, keeping local mock items. */
  setServerAssets: (assets: GeneratedAsset[]) => void;
  removeAsset: (id: string) => void;
  reset: () => void;
}

// Sample items only for the features still served by the mock layer.
const initialAssets = () =>
  mockAssets
    .filter(a => (a.type === 'image' ? env.mocks.images : env.mocks.videos))
    .map(a => ({ ...a, local: true }));

const byNewest = (a: GeneratedAsset, b: GeneratedAsset) =>
  b.createdAt.localeCompare(a.createdAt);

export const useLibraryStore = create<LibraryState>(set => ({
  assets: initialAssets(),
  addAssets: assets =>
    set(state => {
      const known = new Set(state.assets.map(a => a.id));
      return {
        assets: [...assets.filter(a => !known.has(a.id)), ...state.assets],
      };
    }),
  setServerAssets: assets =>
    set(state => ({
      assets: [...state.assets.filter(a => a.local), ...assets].sort(byNewest),
    })),
  removeAsset: id =>
    set(state => ({ assets: state.assets.filter(a => a.id !== id) })),
  reset: () => set({ assets: initialAssets() }),
}));
