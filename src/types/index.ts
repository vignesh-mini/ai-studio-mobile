export type AITask = 'chat' | 'image' | 'video' | 'audio';
export type PlanTier = 'free' | 'premium';

export type ModelCapability =
  | 'routing'
  | 'vision'
  | 'reasoning'
  | 'coding'
  | 'fast'
  | 'long-context'
  | 'documents'
  | 'edit'
  | 'paid'
  | 'aspect-ratio'
  | 'text-to-video'
  | 'image-to-video'
  | 'transcription'
  | 'speech';

export interface AIModel {
  id: string;
  name: string;
  provider: string;
  task: AITask;
  description: string;
  tier: PlanTier;
  capabilities: ModelCapability[];
  available: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  plan: PlanTier;
  /** `owner` accounts have no usage limits and can use every model. */
  role?: 'user' | 'owner';
  avatarUrl?: string;
}

/** The tier that decides model access: owners count as premium. */
export const accessTier = (user?: User | null): PlanTier =>
  user?.role === 'owner' ? 'premium' : user?.plan ?? 'free';

export interface AuthSession {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface Attachment {
  id: string;
  kind: 'image' | 'document';
  name: string;
  uri: string;
  mimeType: string;
  size?: number;
}

export type MessageRole = 'user' | 'assistant';
export type MessageStatus = 'streaming' | 'done' | 'stopped' | 'error';

export interface ChatMessage {
  id: string;
  conversationId: string;
  role: MessageRole;
  content: string;
  /** 'event' messages (e.g. "Switched to Qwen") are UI-only and never sent to a model. */
  kind?: 'message' | 'event';
  modelId?: string;
  attachments?: Attachment[];
  status?: MessageStatus;
  createdAt: string;
}

export interface Conversation {
  id: string;
  title: string;
  modelId: string;
  createdAt: string;
  updatedAt: string;
}

export type AspectRatio = '1:1' | '16:9' | '9:16' | '4:3' | '3:4';
export type JobStatus = 'queued' | 'processing' | 'completed' | 'failed';
export type AssetType = 'image' | 'video';

export interface GeneratedAsset {
  id: string;
  type: AssetType;
  url: string;
  thumbnailUrl?: string;
  prompt: string;
  modelId: string;
  aspectRatio: AspectRatio;
  durationSec?: number;
  createdAt: string;
  /** Produced by the offline mock layer; never sent to or deleted on the backend. */
  local?: boolean;
}

export interface GenerationJob {
  jobId: string;
  type: AssetType;
  status: JobStatus;
  progress: number;
  assets?: GeneratedAsset[];
  error?: string;
}

export interface JobCreatedResponse {
  jobId: string;
  status: JobStatus;
}

export interface ImageGenerateRequest {
  model: string;
  prompt: string;
  count: 1 | 2 | 4;
  aspectRatio: AspectRatio;
  quality: 'standard' | 'high';
}

/** A photo picked on the device, before upload. */
export interface PickedPhoto {
  uri: string;
  name: string;
  mimeType: string;
  size: number;
}

/** Edits either a library image (sourceAssetId) or a photo from the device. */
export interface ImageEditRequest {
  model: string;
  prompt: string;
  count: 1 | 2 | 4;
  sourceAssetId?: string;
  photo?: PickedPhoto;
}

export type VideoMode = 'text-to-video' | 'image-to-video';

export interface VideoGenerateRequest {
  model: string;
  prompt: string;
  mode: VideoMode;
  durationSec: number;
  aspectRatio: AspectRatio;
  sourceAssetId?: string;
}

export interface UploadedFile {
  fileId: string;
  name: string;
  mimeType: string;
  size: number;
}

export interface DocumentAnalysis {
  fileId: string;
  fileName: string;
  pages: number;
  summary: string;
  keyPoints: string[];
}

export interface UsageMeter {
  used: number;
  /** null = unlimited (owner accounts). */
  limit: number | null;
}

export interface Usage {
  plan: PlanTier;
  chat: UsageMeter;
  images: UsageMeter;
  videos: UsageMeter;
  documents: UsageMeter;
  resetsAt: string;
}
