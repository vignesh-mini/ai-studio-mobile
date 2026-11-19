import { create } from 'zustand';
import { env } from '../config/env';
import type { ChatMessage, Conversation } from '../types';
import { mockConversations, mockMessages } from '../services/mock/data';
import { nowIso, truncate, uid } from '../utils';

type NewMessage = Omit<ChatMessage, 'id' | 'conversationId' | 'createdAt'>;

interface ChatState {
  conversations: Record<string, Conversation>;
  messages: Record<string, ChatMessage[]>;
  activeConversationId: string | null;

  createConversation: (modelId: string, seed?: NewMessage[]) => string;
  setActiveConversation: (id: string | null) => void;
  setConversationModel: (id: string, modelId: string) => void;
  deleteConversation: (id: string) => void;

  addMessage: (conversationId: string, message: NewMessage) => ChatMessage;
  updateMessage: (
    conversationId: string,
    messageId: string,
    patch: Partial<ChatMessage>,
  ) => void;
  appendToMessage: (
    conversationId: string,
    messageId: string,
    text: string,
  ) => void;
  /** Removes the given message and everything after it (used by edit + regenerate). */
  truncateFrom: (conversationId: string, messageId: string) => void;

  /** Merges the server's conversation list; their messages load when opened. */
  upsertConversations: (list: Conversation[]) => void;
  setMessages: (conversationId: string, messages: ChatMessage[]) => void;
  /** Clears everything, e.g. on sign-out so the next user starts fresh. */
  reset: () => void;
}

/**
 * A conversation is listed in History/Home once it has messages, or when it came from
 * the server and its messages are not loaded yet (`messages[id]` is undefined).
 * New local drafts have an empty array and stay hidden.
 */
export const isListedConversation = (
  messages: Record<string, ChatMessage[]>,
  id: string,
) => messages[id] === undefined || messages[id].length > 0;

const initialState = () =>
  env.mocks.chat
    ? {
        conversations: Object.fromEntries(
          mockConversations.map(c => [c.id, c]),
        ),
        messages: { ...mockMessages },
        activeConversationId: null,
      }
    : { conversations: {}, messages: {}, activeConversationId: null };

const titleFrom = (text: string) =>
  truncate(text.replace(/\s+/g, ' ').trim(), 40) || 'New chat';

export const useChatStore = create<ChatState>((set, get) => ({
  ...initialState(),

  createConversation: (modelId, seed = []) => {
    const id = uid('conv');
    const createdAt = nowIso();
    const firstUser = seed.find(m => m.role === 'user');
    set(state => ({
      conversations: {
        ...state.conversations,
        [id]: {
          id,
          modelId,
          createdAt,
          updatedAt: createdAt,
          title: firstUser ? titleFrom(firstUser.content) : 'New chat',
        },
      },
      messages: {
        ...state.messages,
        [id]: seed.map(m => ({
          ...m,
          id: uid('msg'),
          conversationId: id,
          createdAt,
        })),
      },
      activeConversationId: id,
    }));
    return id;
  },

  setActiveConversation: id => set({ activeConversationId: id }),

  setConversationModel: (id, modelId) =>
    set(state => ({
      conversations: {
        ...state.conversations,
        [id]: { ...state.conversations[id], modelId },
      },
    })),

  deleteConversation: id =>
    set(state => {
      const conversations = { ...state.conversations };
      const messages = { ...state.messages };
      delete conversations[id];
      delete messages[id];
      return {
        conversations,
        messages,
        activeConversationId:
          state.activeConversationId === id ? null : state.activeConversationId,
      };
    }),

  addMessage: (conversationId, message) => {
    const full: ChatMessage = {
      ...message,
      id: uid('msg'),
      conversationId,
      createdAt: nowIso(),
    };
    set(state => {
      const conversation = state.conversations[conversationId];
      const existing = state.messages[conversationId] ?? [];
      const isFirstUserMessage =
        message.role === 'user' && !existing.some(m => m.role === 'user');
      return {
        messages: { ...state.messages, [conversationId]: [...existing, full] },
        conversations: {
          ...state.conversations,
          [conversationId]: {
            ...conversation,
            updatedAt: full.createdAt,
            title: isFirstUserMessage
              ? titleFrom(message.content)
              : conversation.title,
          },
        },
      };
    });
    return full;
  },

  updateMessage: (conversationId, messageId, patch) =>
    set(state => ({
      messages: {
        ...state.messages,
        [conversationId]: (state.messages[conversationId] ?? []).map(m =>
          m.id === messageId ? { ...m, ...patch } : m,
        ),
      },
    })),

  appendToMessage: (conversationId, messageId, text) => {
    const message = get().messages[conversationId]?.find(
      m => m.id === messageId,
    );
    if (message)
      get().updateMessage(conversationId, messageId, {
        content: message.content + text,
      });
  },

  truncateFrom: (conversationId, messageId) =>
    set(state => {
      const list = state.messages[conversationId] ?? [];
      const index = list.findIndex(m => m.id === messageId);
      if (index < 0) return state;
      return {
        messages: { ...state.messages, [conversationId]: list.slice(0, index) },
      };
    }),

  upsertConversations: list =>
    set(state => ({
      conversations: {
        ...state.conversations,
        ...Object.fromEntries(list.map(c => [c.id, c])),
      },
    })),

  setMessages: (conversationId, list) =>
    set(state => ({ messages: { ...state.messages, [conversationId]: list } })),

  reset: () => set(initialState()),
}));
