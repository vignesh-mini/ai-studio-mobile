import { env } from '../../config/env';
import type { ChatMessage, Conversation } from '../../types';
import { isAxiosError } from 'axios';
import { api } from './client';

// Sending messages goes through ../chatStream.ts (SSE); this covers saved history.
// With mocks on, history lives only in the local store, so these are no-ops.
export const chatService = {
  async listConversations(): Promise<Conversation[]> {
    if (env.mocks.chat) return [];
    const { data } = await api.get<Conversation[]>('/chat/conversations');
    return data;
  },

  async getMessages(conversationId: string): Promise<ChatMessage[]> {
    if (env.mocks.chat) return [];
    const { data } = await api.get<ChatMessage[]>(
      `/chat/conversations/${conversationId}/messages`,
    );
    return data;
  },

  async deleteConversation(conversationId: string): Promise<void> {
    if (env.mocks.chat) return;
    try {
      await api.delete(`/chat/conversations/${conversationId}`);
    } catch (error) {
      // A chat that never reached the server (e.g. the reply failed) has nothing
      // to delete there.
      if (!isAxiosError(error) || error.response?.status !== 404) throw error;
    }
  },

  async deleteAllConversations(): Promise<void> {
    if (env.mocks.chat) return;
    await api.delete('/chat/conversations');
  },
};
