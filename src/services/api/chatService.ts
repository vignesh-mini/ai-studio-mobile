import { env } from '../../config/env';
import type { ChatMessage, Conversation } from '../../types';
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
    await api.delete(`/chat/conversations/${conversationId}`);
  },
};
