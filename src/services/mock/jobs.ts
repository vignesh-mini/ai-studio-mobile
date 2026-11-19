import type { AssetType, GeneratedAsset, GenerationJob } from '../../types';
import { uid } from '../../utils';

interface MockJob {
  type: AssetType;
  startedAt: number;
  durationMs: number;
  buildAssets: () => GeneratedAsset[];
  assets?: GeneratedAsset[];
}

const jobs = new Map<string, MockJob>();

/** Simulates a BullMQ job: queued → processing → completed over `durationMs`. */
export function createMockJob(
  type: AssetType,
  durationMs: number,
  buildAssets: () => GeneratedAsset[],
) {
  const jobId = uid('job');
  jobs.set(jobId, { type, startedAt: Date.now(), durationMs, buildAssets });
  return jobId;
}

export const isMockJob = (jobId: string) => jobs.has(jobId);

export function getMockJob(jobId: string): GenerationJob {
  const job = jobs.get(jobId);
  if (!job) {
    return {
      jobId,
      type: 'image',
      status: 'failed',
      progress: 0,
      error: 'Job not found',
    };
  }
  const progress = Math.min(1, (Date.now() - job.startedAt) / job.durationMs);
  if (progress < 0.15)
    return { jobId, type: job.type, status: 'queued', progress: 0 };
  if (progress < 1)
    return { jobId, type: job.type, status: 'processing', progress };

  job.assets ??= job.buildAssets().map(a => ({ ...a, local: true }));
  return {
    jobId,
    type: job.type,
    status: 'completed',
    progress: 1,
    assets: job.assets,
  };
}
