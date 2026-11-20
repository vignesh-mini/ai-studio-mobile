import { env } from '../../config/env';
import type {
  GeneratedAsset,
  GenerationJob,
  ImageEditRequest,
  ImageGenerateRequest,
  JobCreatedResponse,
  VideoGenerateRequest,
} from '../../types';
import { delay, nowIso, uid } from '../../utils';
import { mockImageUrl, SAMPLE_VIDEO_URL } from '../mock/data';
import { createMockJob, getMockJob, isMockJob } from '../mock/jobs';
import { api } from './client';

/** The backend returns media paths relative to the API (e.g. /media/<key>). */
const withAbsoluteUrl = (asset: GeneratedAsset): GeneratedAsset =>
  asset.url.startsWith('/')
    ? { ...asset, url: `${env.apiBaseUrl}${asset.url}` }
    : asset;

// Image and video generation are asynchronous: the API returns a job id immediately
// and the app polls GET /jobs/:id (or receives a push) instead of holding a request open.

export const imageService = {
  async generate(request: ImageGenerateRequest): Promise<JobCreatedResponse> {
    if (env.mocks.images) {
      await delay(300);
      const jobId = createMockJob('image', 4000 + request.count * 800, () =>
        Array.from({ length: request.count }, (_, i) => ({
          id: uid('asset'),
          type: 'image' as const,
          url: mockImageUrl(
            `${request.prompt}-${Date.now()}-${i}`,
            request.aspectRatio,
          ),
          prompt: request.prompt,
          modelId: request.model,
          aspectRatio: request.aspectRatio,
          createdAt: nowIso(),
        })),
      );
      return { jobId, status: 'queued' };
    }
    const { data } = await api.post<JobCreatedResponse>(
      '/images/generate',
      request,
    );
    return data;
  },

  async edit(request: ImageEditRequest): Promise<JobCreatedResponse> {
    if (env.mocks.images) {
      await delay(300);
      const jobId = createMockJob('image', 4500, () => [
        {
          id: uid('asset'),
          type: 'image',
          url: mockImageUrl(
            `${request.sourceAssetId}-${request.prompt}`,
            request.aspectRatio,
          ),
          prompt: request.prompt,
          modelId: request.model,
          aspectRatio: request.aspectRatio,
          createdAt: nowIso(),
        },
      ]);
      return { jobId, status: 'queued' };
    }
    const { data } = await api.post<JobCreatedResponse>(
      '/images/edit',
      request,
    );
    return data;
  },

  async enhancePrompt(prompt: string): Promise<string> {
    if (env.mocks.images) {
      await delay(500);
      return `${prompt
        .trim()
        .replace(
          /[.,]$/,
          '',
        )}, cinematic lighting, ultra-detailed, 35mm lens, rich color grading, high dynamic range`;
    }
    const { data } = await api.post<{ prompt: string }>('/prompts/enhance', {
      prompt,
    });
    return data.prompt;
  },
};

export const videoService = {
  async generate(request: VideoGenerateRequest): Promise<JobCreatedResponse> {
    if (env.mocks.videos) {
      await delay(300);
      const jobId = createMockJob('video', 9000, () => [
        {
          id: uid('asset'),
          type: 'video',
          url: SAMPLE_VIDEO_URL,
          thumbnailUrl: mockImageUrl(
            `${request.prompt}-${Date.now()}`,
            request.aspectRatio,
          ),
          prompt: request.prompt,
          modelId: request.model,
          aspectRatio: request.aspectRatio,
          durationSec: request.durationSec,
          createdAt: nowIso(),
        },
      ]);
      return { jobId, status: 'queued' };
    }
    const { data } = await api.post<JobCreatedResponse>(
      '/videos/generate',
      request,
    );
    return data;
  },
};

export const jobService = {
  async get(jobId: string): Promise<GenerationJob> {
    // Jobs created while a feature runs on the mock layer are resolved locally.
    if (isMockJob(jobId)) return getMockJob(jobId);
    const { data } = await api.get<GenerationJob>(`/jobs/${jobId}`);
    return { ...data, assets: data.assets?.map(withAbsoluteUrl) };
  },
};

export const libraryService = {
  async list(): Promise<GeneratedAsset[]> {
    if (env.mocks.images) return [];
    const { data } = await api.get<GeneratedAsset[]>('/library');
    return data.map(withAbsoluteUrl);
  },

  async remove(asset: GeneratedAsset): Promise<void> {
    if (asset.local) return;
    await api.delete(`/library/${asset.id}`);
  },
};
