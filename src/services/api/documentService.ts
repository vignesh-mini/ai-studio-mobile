import { env } from '../../config/env';
import type { DocumentAnalysis, UploadedFile } from '../../types';
import { delay, uid } from '../../utils';
import { api } from './client';

export interface LocalFile {
  uri: string;
  name: string;
  mimeType: string;
  size: number;
}

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

export const documentService = {
  async upload(file: LocalFile): Promise<UploadedFile> {
    if (file.size > MAX_UPLOAD_BYTES)
      throw new Error('Files must be 10 MB or smaller');
    if (env.useMocks) {
      await delay(900);
      return {
        fileId: uid('file'),
        name: file.name,
        mimeType: file.mimeType,
        size: file.size,
      };
    }
    const form = new FormData();
    form.append('file', {
      uri: file.uri,
      name: file.name,
      type: file.mimeType,
    } as unknown as Blob);
    const { data } = await api.post<UploadedFile>('/files/upload', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  async analyze(file: UploadedFile): Promise<DocumentAnalysis> {
    if (env.useMocks) {
      await delay(1400);
      return {
        fileId: file.fileId,
        fileName: file.name,
        pages: 12,
        summary:
          'This document describes a multi-provider AI platform: one React Native app talking to a NestJS gateway that routes chat, image, video and audio requests to different model providers.',
        keyPoints: [
          'Provider API keys stay on the backend; the app only holds a user JWT.',
          'Long-running image and video work runs as queued jobs with status polling.',
          'Usage quotas and credits are enforced per user before every request.',
          'Media files live in object storage; PostgreSQL keeps metadata only.',
        ],
      };
    }
    const { data } = await api.post<DocumentAnalysis>(
      `/documents/${file.fileId}/analyze`,
    );
    return data;
  },

  async ask(fileId: string, question: string): Promise<string> {
    if (env.useMocks) {
      await delay(1000);
      return `Based on the document (mock answer): the section most relevant to “${question}” explains that requests pass through the AI gateway, which checks quota, picks a provider adapter and stores the result.`;
    }
    const { data } = await api.post<{ answer: string }>(
      `/documents/${fileId}/ask`,
      { question },
    );
    return data.answer;
  },
};
