import type {
  AIModel,
  ChatMessage,
  Conversation,
  GeneratedAsset,
  Usage,
  User,
} from '../../types';

export const mockUser: User = {
  id: 'user_demo',
  name: 'Manoj',
  email: 'demo@aistudio.app',
  plan: 'free',
};

// Mirrors the backend `ai_models` table. The gateway owns this list so models can be
// enabled, disabled or re-routed without shipping a new app build.
export const mockModels: AIModel[] = [
  {
    id: 'auto',
    name: 'Auto',
    provider: 'AI Gateway',
    task: 'chat',
    description: 'Routes each message to the best model for the task.',
    tier: 'free',
    capabilities: ['routing'],
    available: true,
  },
  {
    id: 'gemini-flash',
    name: 'Gemini Flash',
    provider: 'Google Gemini',
    task: 'chat',
    description:
      'Default assistant. Great for general chat, images and documents.',
    tier: 'free',
    capabilities: ['vision', 'long-context', 'documents'],
    available: true,
  },
  {
    id: 'groq-gpt-oss-120b',
    name: 'GPT-OSS 120B',
    provider: 'Groq',
    task: 'chat',
    description: 'Open-weight reasoning model on very fast inference hardware.',
    tier: 'free',
    capabilities: ['fast', 'reasoning'],
    available: true,
  },
  {
    id: 'groq-qwen3-32b',
    name: 'Qwen3 32B',
    provider: 'Groq',
    task: 'chat',
    description: 'Strong coding and multilingual model with fast responses.',
    tier: 'free',
    capabilities: ['coding', 'fast'],
    available: true,
  },
  {
    id: 'openrouter-llama-free',
    name: 'Nemotron 3 Ultra (free)',
    provider: 'OpenRouter',
    task: 'chat',
    description: 'Free community model served through OpenRouter.',
    tier: 'free',
    capabilities: ['reasoning'],
    available: true,
  },
  {
    id: 'mistral-small',
    name: 'Mistral Small',
    provider: 'Mistral AI',
    task: 'chat',
    description: 'Efficient model for coding and everyday questions.',
    tier: 'free',
    capabilities: ['coding'],
    available: true,
  },
  {
    id: 'gemini-pro',
    name: 'Gemini Pro',
    provider: 'Google Gemini',
    task: 'chat',
    description: 'Highest-quality reasoning for complex problems.',
    tier: 'premium',
    capabilities: ['reasoning', 'vision', 'long-context', 'documents'],
    available: true,
  },
  {
    id: 'flux-schnell',
    name: 'FLUX.1 schnell',
    provider: 'fal.ai',
    task: 'image',
    description: 'Fast, photorealistic text-to-image.',
    tier: 'free',
    capabilities: ['image-edit'],
    available: true,
  },
  {
    id: 'flux-dev',
    name: 'FLUX.1 dev',
    provider: 'Replicate',
    task: 'image',
    description: 'Higher detail and prompt adherence.',
    tier: 'premium',
    capabilities: ['image-edit'],
    available: true,
  },
  {
    id: 'sdxl',
    name: 'Stable Diffusion XL',
    provider: 'Hugging Face',
    task: 'image',
    description: 'Versatile styles, image-to-image variations.',
    tier: 'free',
    capabilities: ['image-edit'],
    available: true,
  },
  {
    id: 'wan-2.2',
    name: 'Wan 2.2',
    provider: 'fal.ai',
    task: 'video',
    description: 'Apache 2.0 open weights. Text-to-video and image-to-video.',
    tier: 'free',
    capabilities: ['text-to-video', 'image-to-video'],
    available: true,
  },
  {
    id: 'ltx-video',
    name: 'LTX Video',
    provider: 'Replicate',
    task: 'video',
    description: 'Fast video generation with image-to-video support.',
    tier: 'premium',
    capabilities: ['text-to-video', 'image-to-video'],
    available: true,
  },
  {
    id: 'hunyuan-video',
    name: 'HunyuanVideo',
    provider: 'fal.ai',
    task: 'video',
    description: 'High-quality cinematic text-to-video.',
    tier: 'premium',
    capabilities: ['text-to-video'],
    available: true,
  },
  {
    id: 'whisper-large-v3',
    name: 'Whisper large-v3',
    provider: 'Groq',
    task: 'audio',
    description: 'Speech-to-text transcription.',
    tier: 'free',
    capabilities: ['transcription'],
    available: true,
  },
];

/**
 * Real, playable stand-in for generated videos until a video provider is connected:
 * a short public-domain (CC0) clip hosted by MDN.
 */
export const SAMPLE_VIDEO_URL =
  'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4';

export const mockImageUrl = (seed: string, ratio: string, width = 768) => {
  const [w, h] = ratio.split(':').map(Number);
  return `https://picsum.photos/seed/${encodeURIComponent(
    seed,
  )}/${width}/${Math.round((width * h) / w)}`;
};

const hoursAgo = (h: number) =>
  new Date(Date.now() - h * 3600_000).toISOString();

export const mockAssets: GeneratedAsset[] = [
  {
    id: 'asset_beach',
    type: 'image',
    url: mockImageUrl('midnight-beach', '16:9'),
    prompt: 'A cinematic beach at midnight with a glowing blue ocean',
    modelId: 'flux-schnell',
    aspectRatio: '16:9',
    createdAt: hoursAgo(2),
  },
  {
    id: 'asset_city',
    type: 'image',
    url: mockImageUrl('neon-city', '1:1'),
    prompt: 'Neon city skyline in the rain, cyberpunk style',
    modelId: 'sdxl',
    aspectRatio: '1:1',
    createdAt: hoursAgo(6),
  },
  {
    id: 'asset_forest_video',
    type: 'video',
    url: SAMPLE_VIDEO_URL,
    thumbnailUrl: mockImageUrl('misty-forest', '16:9'),
    prompt: 'Drone shot flying through a misty forest at sunrise',
    modelId: 'wan-2.2',
    aspectRatio: '16:9',
    durationSec: 6,
    createdAt: hoursAgo(20),
  },
  {
    id: 'asset_portrait',
    type: 'image',
    url: mockImageUrl('studio-portrait', '3:4'),
    prompt: 'Studio portrait of an astronaut, soft rim lighting',
    modelId: 'flux-dev',
    aspectRatio: '3:4',
    createdAt: hoursAgo(30),
  },
];

export const mockConversations: Conversation[] = [
  {
    id: 'conv_rn',
    title: 'React Native architecture',
    modelId: 'gemini-flash',
    createdAt: hoursAgo(5),
    updatedAt: hoursAgo(5),
  },
  {
    id: 'conv_trip',
    title: 'Weekend trip ideas',
    modelId: 'groq-gpt-oss-120b',
    createdAt: hoursAgo(28),
    updatedAt: hoursAgo(27),
  },
];

export const mockMessages: Record<string, ChatMessage[]> = {
  conv_rn: [
    {
      id: 'msg_rn_1',
      conversationId: 'conv_rn',
      role: 'user',
      content: 'Explain React Native architecture in short.',
      createdAt: hoursAgo(5),
    },
    {
      id: 'msg_rn_2',
      conversationId: 'conv_rn',
      role: 'assistant',
      modelId: 'gemini-flash',
      status: 'done',
      content:
        'React Native runs your **JavaScript** on the Hermes engine and renders **real native views**.\n\n' +
        '- **Fabric** – the new renderer\n- **TurboModules** – lazy, typed native modules\n- **JSI** – direct JS ↔ C++ calls, no bridge\n\n' +
        '```tsx\nexport default function App() {\n  return <Text>Hello native</Text>;\n}\n```',
      createdAt: hoursAgo(5),
    },
  ],
  conv_trip: [
    {
      id: 'msg_trip_1',
      conversationId: 'conv_trip',
      role: 'user',
      content: 'Suggest a 2-day weekend trip from Bangalore.',
      createdAt: hoursAgo(28),
    },
    {
      id: 'msg_trip_2',
      conversationId: 'conv_trip',
      role: 'assistant',
      modelId: 'groq-gpt-oss-120b',
      status: 'done',
      content:
        'Try **Coorg**: coffee estates, Abbey Falls and Raja’s Seat on day one, then Dubare elephant camp on day two.',
      createdAt: hoursAgo(27),
    },
  ],
};

export const mockUsage: Usage = {
  plan: 'free',
  chat: { used: 18, limit: 50 },
  images: { used: 6, limit: 10 },
  videos: { used: 1, limit: 2 },
  documents: { used: 2, limit: 5 },
  resetsAt: new Date(new Date().setHours(24, 0, 0, 0)).toISOString(),
};
