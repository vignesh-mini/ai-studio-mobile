import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { env } from '../config/env';
import { libraryService } from '../services/api/mediaService';
import { useLibraryStore } from '../store/libraryStore';

/** Loads the user's saved generations from the backend into the library store. */
export function useLibrarySync() {
  const setServerAssets = useLibraryStore(s => s.setServerAssets);
  const query = useQuery({
    queryKey: ['library'],
    queryFn: libraryService.list,
    enabled: !env.mocks.images,
  });

  useEffect(() => {
    if (query.data) setServerAssets(query.data);
  }, [query.data, setServerAssets]);

  return query;
}
