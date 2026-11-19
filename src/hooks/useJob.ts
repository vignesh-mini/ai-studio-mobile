import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { jobService } from '../services/api/mediaService';
import { useLibraryStore } from '../store/libraryStore';

const isFinished = (status?: string) =>
  status === 'completed' || status === 'failed';

/** Polls a generation job until it completes, then saves its assets to the library. */
export function useJob(jobId: string | null) {
  const addAssets = useLibraryStore(s => s.addAssets);

  const query = useQuery({
    queryKey: ['job', jobId],
    queryFn: () => jobService.get(jobId!),
    enabled: !!jobId,
    refetchInterval: q => (isFinished(q.state.data?.status) ? false : 1500),
  });

  const assets = query.data?.assets;
  useEffect(() => {
    if (assets?.length) addAssets(assets);
  }, [assets, addAssets]);

  return query;
}
