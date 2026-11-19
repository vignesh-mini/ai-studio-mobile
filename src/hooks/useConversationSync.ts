import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { env } from '../config/env';
import { chatService } from '../services/api/chatService';
import { useChatStore } from '../store/chatStore';

/** Pulls the saved conversation list from the backend into the local store. */
export function useConversationList() {
  const upsertConversations = useChatStore(s => s.upsertConversations);
  const query = useQuery({
    queryKey: ['conversations'],
    queryFn: chatService.listConversations,
    enabled: !env.mocks.chat,
  });

  useEffect(() => {
    if (query.data) upsertConversations(query.data);
  }, [query.data, upsertConversations]);

  return query;
}

/** Loads a server conversation's messages the first time it is opened. */
export function useConversationMessages(conversationId: string | null) {
  const notLoaded = useChatStore(
    s => !!conversationId && s.messages[conversationId] === undefined,
  );
  const setMessages = useChatStore(s => s.setMessages);

  const query = useQuery({
    queryKey: ['conversation-messages', conversationId],
    queryFn: () => chatService.getMessages(conversationId!),
    enabled: !env.mocks.chat && notLoaded,
  });

  useEffect(() => {
    if (conversationId && query.data && notLoaded) {
      setMessages(conversationId, query.data);
    }
  }, [conversationId, query.data, notLoaded, setMessages]);

  return { isLoading: notLoaded && query.isLoading, error: query.error };
}
