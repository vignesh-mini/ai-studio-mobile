import { useQuery } from '@tanstack/react-query';
import { modelService } from '../services/api/modelService';
import type { AITask } from '../types';

export function useModels(task?: AITask) {
  return useQuery({
    queryKey: ['models'],
    queryFn: modelService.list,
    staleTime: 10 * 60_000,
    select: models =>
      task ? models.filter(m => m.task === task && m.available) : models,
  });
}

export function useModel(id: string | undefined) {
  const { data } = useModels();
  return data?.find(m => m.id === id);
}
