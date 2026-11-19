import { env } from '../config/env';
import { useAuthStore } from '../store/authStore';
import type { Attachment, ChatMessage, MessageRole } from '../types';
import { buildMockReply, resolveAutoModel } from './mock/chat';

export interface ChatPayloadMessage {
  role: MessageRole;
  content: string;
  modelId?: string;
  attachments?: Attachment[];
}

export interface StreamChatParams {
  conversationId: string;
  modelId: string;
  messages: ChatPayloadMessage[];
}

export interface StreamHandlers {
  onToken: (text: string) => void;
  /** `modelId` is the model that actually answered (differs from the request when using Auto). */
  onDone: (result: { modelId: string }) => void;
  onError: (error: Error) => void;
}

/** Strips UI-only events and in-progress messages before sending history to the gateway. */
export function toPayload(messages: ChatMessage[]): ChatPayloadMessage[] {
  return messages
    .filter(
      m =>
        m.kind !== 'event' &&
        m.status !== 'streaming' &&
        m.content.trim().length > 0,
    )
    .map(({ role, content, modelId, attachments }) => ({
      role,
      content,
      modelId,
      attachments,
    }));
}

/**
 * Streams a chat completion. Returns a cancel function used by "Stop generating".
 *
 * Wire format (Server-Sent Events from POST /chat/messages):
 *   data: {"type":"token","text":"..."}
 *   data: {"type":"done","modelId":"gemini-flash"}
 *   data: {"type":"error","message":"..."}
 */
export function streamChat(
  params: StreamChatParams,
  handlers: StreamHandlers,
): () => void {
  return env.useMocks
    ? streamMock(params, handlers)
    : streamSse(params, handlers);
}

function streamSse(params: StreamChatParams, handlers: StreamHandlers) {
  // RN's fetch cannot read a body incrementally; XHR exposes partial responseText.
  const xhr = new XMLHttpRequest();
  let cursor = 0;
  let finished = false;

  const finish = (fn: () => void) => {
    if (finished) return;
    finished = true;
    fn();
  };

  const consume = () => {
    const chunk = xhr.responseText.slice(cursor);
    const lastBoundary = chunk.lastIndexOf('\n\n');
    if (lastBoundary < 0) return;
    cursor += lastBoundary + 2;

    for (const block of chunk.slice(0, lastBoundary).split('\n\n')) {
      const data = block
        .split('\n')
        .filter(line => line.startsWith('data:'))
        .map(line => line.slice(5).trim())
        .join('');
      if (!data) continue;
      try {
        const event = JSON.parse(data);
        if (event.type === 'token') handlers.onToken(event.text);
        else if (event.type === 'done')
          finish(() => handlers.onDone({ modelId: event.modelId }));
        else if (event.type === 'error')
          finish(() => handlers.onError(new Error(event.message)));
      } catch {
        // Ignore keep-alive comments or malformed frames.
      }
    }
  };

  xhr.open('POST', `${env.apiBaseUrl}/chat/messages`);
  xhr.setRequestHeader('Content-Type', 'application/json');
  xhr.setRequestHeader('Accept', 'text/event-stream');
  const token = useAuthStore.getState().accessToken;
  if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);

  xhr.onprogress = consume;
  xhr.onload = () => {
    consume();
    if (xhr.status >= 400) {
      finish(() =>
        handlers.onError(new Error(`Request failed (${xhr.status})`)),
      );
    } else {
      finish(() => handlers.onDone({ modelId: params.modelId }));
    }
  };
  xhr.onerror = () =>
    finish(() => handlers.onError(new Error('Network error')));
  xhr.send(JSON.stringify(params));

  return () => {
    finished = true;
    xhr.abort();
  };
}

function streamMock(params: StreamChatParams, handlers: StreamHandlers) {
  const lastUser = [...params.messages].reverse().find(m => m.role === 'user');
  const modelId =
    params.modelId === 'auto'
      ? resolveAutoModel(lastUser?.content ?? '')
      : params.modelId;
  const tokens =
    buildMockReply(modelId, params.messages).match(/\S+\s*|\s+/g) ?? [];
  let index = 0;

  const timer = setInterval(() => {
    if (index >= tokens.length) {
      clearInterval(timer);
      handlers.onDone({ modelId });
      return;
    }
    handlers.onToken(tokens.slice(index, index + 2).join(''));
    index += 2;
  }, 35);

  return () => clearInterval(timer);
}
