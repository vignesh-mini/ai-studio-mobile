import { env } from '../config/env';
import { useAuthStore } from '../store/authStore';
import type { Attachment, ChatMessage, MessageRole } from '../types';
import { refreshSession } from './api/client';
import { buildMockReply, resolveAutoModel } from './mock/chat';

export interface ChatPayloadMessage {
  id?: string;
  role: MessageRole;
  content: string;
  modelId?: string;
  attachments?: Attachment[];
}

export interface StreamChatParams {
  /** Omit for one-off requests (Compare, Voice) that should not be saved server-side. */
  conversationId?: string;
  /** Id the app already gave the reply placeholder, so both sides store the same message. */
  assistantMessageId?: string;
  title?: string;
  modelId: string;
  messages: ChatPayloadMessage[];
}

export interface StreamHandlers {
  onToken: (text: string) => void;
  /** `modelId` is the model that actually answered (differs from the request when using Auto). */
  onDone: (result: { modelId: string }) => void;
  onError: (error: Error) => void;
}

/**
 * Strips UI-only events, in-progress replies and error notices before sending history
 * to the gateway, so the model only ever sees real conversation turns.
 */
export function toPayload(messages: ChatMessage[]): ChatPayloadMessage[] {
  return messages
    .filter(
      m =>
        m.kind !== 'event' &&
        m.status !== 'streaming' &&
        m.status !== 'error' &&
        m.content.trim().length > 0,
    )
    .map(({ id, role, content, modelId, attachments }) => ({
      id,
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
  return env.mocks.chat
    ? streamMock(params, handlers)
    : streamSse(params, handlers);
}

/** Retries once with a refreshed access token, since XHR bypasses the Axios interceptor. */
function streamSse(params: StreamChatParams, handlers: StreamHandlers) {
  let cancelled = false;
  let cancelCurrent = () => {};

  const start = (allowRefresh: boolean) => {
    cancelCurrent = openSse(params, handlers, async () => {
      if (allowRefresh && !cancelled && (await refreshSession())) {
        if (!cancelled) start(false);
        return;
      }
      handlers.onError(
        new Error('Your session expired. Please sign in again.'),
      );
      useAuthStore.getState().logout();
    });
  };
  start(true);

  return () => {
    cancelled = true;
    cancelCurrent();
  };
}

function openSse(
  params: StreamChatParams,
  handlers: StreamHandlers,
  onUnauthorized: () => void,
) {
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
    if (xhr.status >= 400) return;
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
    if (xhr.status === 401) {
      finish(onUnauthorized);
      return;
    }
    if (xhr.status >= 400) {
      finish(() => handlers.onError(new Error(serverMessage(xhr))));
      return;
    }
    consume();
    finish(() => handlers.onDone({ modelId: params.modelId }));
  };
  xhr.onerror = () =>
    finish(() => handlers.onError(new Error('Cannot reach the server')));
  xhr.send(JSON.stringify(params));

  return () => {
    finished = true;
    xhr.abort();
  };
}

/** Errors raised before streaming (quota, premium model, no provider) are JSON bodies. */
function serverMessage(xhr: XMLHttpRequest) {
  try {
    const { message } = JSON.parse(xhr.responseText);
    if (typeof message === 'string') return message;
    if (Array.isArray(message)) return message.join('\n');
  } catch {
    // Fall through to the generic message.
  }
  return `Request failed (${xhr.status})`;
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
