import { useCallback, useEffect, useRef, useState } from 'react';
import { streamChat, toPayload } from '../services/chatStream';
import { useChatStore } from '../store/chatStore';
import type { Attachment } from '../types';

interface ActiveStream {
  conversationId: string;
  messageId: string;
  cancel: () => void;
}

/**
 * Drives one conversation: send, stop, regenerate, edit-and-resend and model switching.
 * The full history is sent on every turn, so a model picked mid-conversation receives
 * the earlier context; the gateway converts it to that provider's message format.
 */
export function useChatSession(conversationId: string | null) {
  const activeRef = useRef<ActiveStream | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);

  const cancelActive = useCallback(() => {
    const active = activeRef.current;
    if (!active) return;
    active.cancel();
    activeRef.current = null;
    useChatStore
      .getState()
      .updateMessage(active.conversationId, active.messageId, {
        status: 'stopped',
      });
    setIsStreaming(false);
  }, []);

  const respond = useCallback(() => {
    if (!conversationId) return;
    const store = useChatStore.getState();
    const history = store.messages[conversationId] ?? [];
    const { modelId } = store.conversations[conversationId];
    const assistant = store.addMessage(conversationId, {
      role: 'assistant',
      content: '',
      modelId,
      status: 'streaming',
    });

    const settle = () => {
      activeRef.current = null;
      setIsStreaming(false);
    };

    const cancel = streamChat(
      { conversationId, modelId, messages: toPayload(history) },
      {
        onToken: text =>
          useChatStore
            .getState()
            .appendToMessage(conversationId, assistant.id, text),
        onDone: result => {
          useChatStore.getState().updateMessage(conversationId, assistant.id, {
            status: 'done',
            modelId: result.modelId,
          });
          settle();
        },
        onError: error => {
          useChatStore.getState().updateMessage(conversationId, assistant.id, {
            status: 'error',
            content: error.message,
          });
          settle();
        },
      },
    );
    activeRef.current = { conversationId, messageId: assistant.id, cancel };
    setIsStreaming(true);
  }, [conversationId]);

  const send = useCallback(
    (text: string, attachments?: Attachment[]) => {
      if (!conversationId || activeRef.current) return;
      useChatStore.getState().addMessage(conversationId, {
        role: 'user',
        content: text.trim(),
        attachments: attachments?.length ? attachments : undefined,
      });
      respond();
    },
    [conversationId, respond],
  );

  const regenerate = useCallback(() => {
    if (!conversationId || activeRef.current) return;
    const store = useChatStore.getState();
    const list = store.messages[conversationId] ?? [];
    const lastAssistant = [...list]
      .reverse()
      .find(m => m.role === 'assistant' && m.kind !== 'event');
    if (!lastAssistant) return;
    store.truncateFrom(conversationId, lastAssistant.id);
    respond();
  }, [conversationId, respond]);

  const editAndResend = useCallback(
    (messageId: string, text: string) => {
      if (!conversationId || activeRef.current) return;
      const store = useChatStore.getState();
      const original = store.messages[conversationId]?.find(
        m => m.id === messageId,
      );
      store.truncateFrom(conversationId, messageId);
      send(text, original?.attachments);
    },
    [conversationId, send],
  );

  const switchModel = useCallback(
    (modelId: string, modelName: string) => {
      if (!conversationId) return;
      const store = useChatStore.getState();
      if (store.conversations[conversationId]?.modelId === modelId) return;
      store.setConversationModel(conversationId, modelId);
      if ((store.messages[conversationId] ?? []).length > 0) {
        store.addMessage(conversationId, {
          role: 'assistant',
          kind: 'event',
          content: `Switched to ${modelName}`,
        });
      }
    },
    [conversationId],
  );

  // Leaving a conversation mid-stream stops that reply rather than orphaning it.
  useEffect(() => cancelActive, [conversationId, cancelActive]);

  return {
    isStreaming,
    send,
    stop: cancelActive,
    regenerate,
    editAndResend,
    switchModel,
  };
}
