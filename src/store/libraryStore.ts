import { create } from 'zustand';
import type { GeneratedAsset } from '../types';
import { mockAssets } from '../services/mock/data';

interface LibraryState {
  assets: GeneratedAsset[];
  addAssets: (assets: GeneratedAsset[]) => void;
  removeAsset: (id: string) => void;
}

// Local cache of the user's generations. With the backend live, GET /library is the
// source of truth and this store only holds what was generated in this session.
export const useLibraryStore = create<LibraryState>(set => ({
  assets: mockAssets,
  addAssets: assets =>
    set(state => {
      const known = new Set(state.assets.map(a => a.id));
      return {
        assets: [...assets.filter(a => !known.has(a.id)), ...state.assets],
      };
    }),
  removeAsset: id =>
    set(state => ({ assets: state.assets.filter(a => a.id !== id) })),
}));
