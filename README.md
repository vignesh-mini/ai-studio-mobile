# AI Studio – mobile app

React Native CLI (TypeScript) client for a multi-provider AI platform: chat, image, video,
document and voice AI behind a single backend gateway.

The app **never talks to AI providers directly** and never holds provider keys. Every
request goes to our NestJS gateway (`/api/v1`) with the user's JWT; the gateway picks the
provider (Gemini, Groq, OpenRouter, Mistral, FLUX, Wan 2.2…), enforces quotas, and stores
results.

## Status

| Feature | Source |
| --- | --- |
| Sign-in (email), model catalogue, chat (streaming, history, model switching), profile, usage | **Backend** ([ai-studio-backend](https://github.com/vignesh-mini/ai-studio-backend)) |
| Image, video, documents, voice | Local mock layer (`src/services/mock`) until Phases 4–6 |

Each feature is switched in `env.mocks` in `src/config/env.ts`. Set every flag to `true`
to run the whole app offline without the backend. Google/Apple sign-in reports
"not set up yet" until social auth is added; use email and password.

## Run

The backend must be running first (see its README). On the Android emulator the app
calls `http://10.0.2.2:3000/api/v1`, which is the host machine's `localhost:3000`. On a
physical phone, run `adb reverse tcp:3000 tcp:3000` and change `apiBaseUrl` to
`http://localhost:3000/api/v1`.

```sh
yarn install
yarn start            # Metro
yarn android         # or: yarn ios (after `cd ios && bundle exec pod install`)
yarn test             # Jest
yarn tsc --noEmit    # type-check
```

## Structure

```
src/
├── config/env.ts          API base URL, mock switch, default models
├── theme/                 Navy design tokens + navigation theme
├── types/                 Shared domain types (models, messages, jobs, assets…)
├── navigation/            Root stack (auth gate) + 5 bottom tabs
├── components/            Button, Card, ModelPicker, PromptInput, MediaGrid, JobProgress…
├── hooks/
│   ├── useChatSession.ts  send / stop / regenerate / edit / switch model
│   ├── useJob.ts          polls GET /jobs/:id, saves results to the library
│   └── useModels.ts       model catalogue from GET /models
├── services/
│   ├── api/client.ts      Axios + JWT + single-flight token refresh
│   ├── api/*Service.ts    auth, models, images/videos/jobs, documents, voice, account
│   ├── chatStream.ts      SSE streaming over XHR (+ mock streamer)
│   └── mock/              Mock catalogue, conversations, job engine, auto-router
├── store/                 Zustand: auth, chat, library, settings
└── screens/               Splash, Login, Home, Chat, Compare, ImageStudio, VideoStudio,
                           Documents, Voice, History, Library, AssetViewer, Profile, Subscription
```

## Features in this build

| Area | What works (mock-backed) |
| --- | --- |
| Chat | Token streaming, stop, regenerate, edit a previous prompt, copy, share, export, markdown + code, attachments, history and search |
| Models | Catalogue from the gateway, Auto routing, **switching models mid-conversation** with context carried over, Premium gating |
| Compare | Same prompt to two models side by side, then continue with the better answer |
| Image Studio | Text-to-image (1/2/4 images, aspect ratio, quality), image editing, prompt enhancement, async job progress |
| Video Studio | Text-to-video and image-to-video, duration and aspect ratio, capability checks per model, background jobs |
| Document AI | Upload a PDF, get a summary and key points, ask follow-up questions |
| Voice AI | Speak → transcribe → streamed answer, continue in chat |
| Account | Login (Google / Apple / email), usage meters, default model, plans, delete-my-data |

## Backend contract the app expects

| Method | Endpoint | Notes |
| --- | --- | --- |
| POST | `/auth/login`, `/auth/register`, `/auth/{google,apple}`, `/auth/refresh` | Returns `{ user, accessToken, refreshToken }` |
| GET | `/models` | `AIModel[]` – drives every model picker |
| POST | `/chat/messages` | SSE: `data: {"type":"token","text"}` … `{"type":"done","modelId"}` |
| POST | `/images/generate`, `/images/edit`, `/videos/generate` | Returns `{ jobId, status }` |
| GET | `/jobs/:id` | `{ status: queued \| processing \| completed \| failed, progress, assets? }` |
| POST | `/prompts/enhance` | `{ prompt }` |
| POST | `/files/upload`, `/documents/:id/analyze`, `/documents/:id/ask` | Multipart upload, then analysis |
| POST | `/audio/transcribe`, `/audio/speech` | Whisper STT, TTS URL |
| GET | `/library`, `/usage`, `/profile` | |

## Next phases (native modules still to add)

- **Phase 2 – auth:** Firebase/Supabase SDK + `react-native-keychain` for token storage.
- **Phase 5 – video playback:** `react-native-video`.
- **Phase 6 – real pickers & audio:** `react-native-image-picker`, `@react-native-documents/picker`,
  an audio recorder for voice input, and audio playback for spoken replies.
- Persist chat/library offline (MMKV or SQLite) if needed. The server is the source of truth.
