import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Pressable,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import { AppHeader } from '../../components/AppHeader';
import { Icon } from '../../components/Icon';
import { IconButton } from '../../components/IconButton';
import { ModelPicker } from '../../components/ModelPicker';
import { Screen } from '../../components/Screen';
import { useChatSession } from '../../hooks/useChatSession';
import { useConversationMessages } from '../../hooks/useConversationSync';
import type { TabScreenProps } from '../../navigation/types';
import { useChatStore } from '../../store/chatStore';
import { useSettingsStore } from '../../store/settingsStore';
import { colors, radius, spacing, typography } from '../../theme';
import type { ChatMessage } from '../../types';
import { notify } from '../../utils/notify';
import { ChatComposer } from './ChatComposer';
import { MessageBubble } from './MessageBubble';

const EMPTY: ChatMessage[] = [];

const suggestions = [
  'Explain React Native architecture',
  'Write a TypeScript debounce function',
  'Plan a 3-day trip to Goa',
  'Summarize the pros and cons of NestJS',
];

export function ChatScreen({ navigation, route }: TabScreenProps<'Chat'>) {
  const activeId = useChatStore(s => s.activeConversationId);
  const conversation = useChatStore(s =>
    activeId ? s.conversations[activeId] : undefined,
  );
  const messages =
    useChatStore(s => (activeId ? s.messages[activeId] : undefined)) ?? EMPTY;
  const createConversation = useChatStore(s => s.createConversation);
  const setActiveConversation = useChatStore(s => s.setActiveConversation);
  const defaultModel = useSettingsStore(s => s.defaultChatModel);

  const session = useChatSession(conversation ? activeId : null);
  const history = useConversationMessages(conversation ? activeId : null);
  const [editing, setEditing] = useState<ChatMessage | null>(null);
  const listRef = useRef<FlatList<ChatMessage>>(null);
  const pendingPrompt = useRef<{ conversationId: string; text: string } | null>(
    null,
  );

  const { conversationId, initialPrompt } = route.params ?? {};

  useEffect(() => {
    if (!conversationId) return;
    setActiveConversation(conversationId);
    setEditing(null);
    navigation.setParams({ conversationId: undefined });
  }, [conversationId, navigation, setActiveConversation]);

  useEffect(() => {
    if (!initialPrompt) return;
    pendingPrompt.current = {
      conversationId: createConversation(defaultModel),
      text: initialPrompt,
    };
    navigation.setParams({ initialPrompt: undefined });
  }, [initialPrompt, navigation, createConversation, defaultModel]);

  // Always have a conversation to type into.
  useEffect(() => {
    if (!conversation) createConversation(defaultModel);
  }, [conversation, createConversation, defaultModel]);

  // A prompt handed over from Home is sent once the new conversation is active.
  const { send } = session;
  useEffect(() => {
    const pending = pendingPrompt.current;
    if (pending && pending.conversationId === conversation?.id) {
      pendingPrompt.current = null;
      send(pending.text);
    }
  }, [conversation, send]);

  const lastAssistantId = useMemo(
    () =>
      [...messages]
        .reverse()
        .find(m => m.role === 'assistant' && m.kind !== 'event')?.id,
    [messages],
  );

  const newChat = () => {
    setEditing(null);
    if (messages.length > 0) createConversation(defaultModel);
  };

  const exportChat = () => {
    const transcript = messages
      .filter(m => m.kind !== 'event')
      .map(
        m => `${m.role === 'user' ? 'You' : m.modelId ?? 'AI'}:\n${m.content}`,
      )
      .join('\n\n');
    if (transcript)
      Share.share({ title: conversation?.title, message: transcript });
  };

  const onCopy = useCallback((m: ChatMessage) => {
    Clipboard.setString(m.content);
    notify('Copied to clipboard');
  }, []);
  const onShare = useCallback((m: ChatMessage) => {
    Share.share({ message: m.content });
  }, []);

  return (
    <Screen
      header={
        <AppHeader
          center={
            conversation ? (
              <ModelPicker
                compact
                task="chat"
                value={conversation.modelId}
                onChange={m => session.switchModel(m.id, m.name)}
              />
            ) : null
          }
          right={
            <>
              <IconButton
                name="git-compare-outline"
                label="Compare models"
                onPress={() => navigation.navigate('Compare')}
              />
              <IconButton
                name="create-outline"
                label="New chat"
                onPress={newChat}
              />
            </>
          }
        />
      }
    >
      <View style={styles.leftActions}>
        <Pressable
          onPress={() => navigation.navigate('History')}
          style={styles.linkRow}
          hitSlop={8}
        >
          <Icon name="time-outline" size={14} color={colors.textMuted} />
          <Text style={typography.caption} numberOfLines={1}>
            {conversation?.title ?? 'New chat'}
          </Text>
        </Pressable>
        {messages.length ? (
          <Pressable onPress={exportChat} style={styles.linkRow} hitSlop={8}>
            <Icon name="download-outline" size={14} color={colors.textMuted} />
            <Text style={typography.caption}>Export</Text>
          </Pressable>
        ) : null}
      </View>

      <KeyboardAvoidingView style={styles.flex} behavior="padding">
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={m => m.id}
          contentContainerStyle={[
            styles.list,
            !messages.length && styles.flexGrow,
          ]}
          keyboardShouldPersistTaps="handled"
          onContentSizeChange={() =>
            listRef.current?.scrollToEnd({ animated: true })
          }
          ListEmptyComponent={
            history.isLoading ? (
              <View style={styles.empty}>
                <ActivityIndicator color={colors.primary} />
              </View>
            ) : (
              <View style={styles.empty}>
                <View style={styles.logo}>
                  <Icon name="sparkles" size={28} color={colors.white} />
                </View>
                <Text style={typography.h2}>How can I help today?</Text>
                <Text style={[typography.muted, styles.center]}>
                  Switch models any time – the conversation carries over.
                </Text>
                <View style={styles.suggestions}>
                  {suggestions.map(s => (
                    <Pressable
                      key={s}
                      style={styles.suggestion}
                      onPress={() => session.send(s)}
                    >
                      <Text style={typography.body}>{s}</Text>
                      <Icon
                        name="arrow-forward"
                        size={16}
                        color={colors.textMuted}
                      />
                    </Pressable>
                  ))}
                </View>
              </View>
            )
          }
          renderItem={({ item }) => (
            <MessageBubble
              message={item}
              busy={session.isStreaming}
              canRegenerate={item.id === lastAssistantId}
              onCopy={onCopy}
              onShare={onShare}
              onRegenerate={session.regenerate}
              onEdit={setEditing}
            />
          )}
        />
        <ChatComposer
          isStreaming={session.isStreaming}
          editing={editing}
          onCancelEdit={() => setEditing(null)}
          onStop={session.stop}
          onSend={(text, attachments) => {
            if (editing) {
              session.editAndResend(editing.id, text);
              setEditing(null);
            } else {
              session.send(text, attachments);
            }
          }}
        />
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  flexGrow: { flexGrow: 1 },
  leftActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    gap: spacing.lg,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flexShrink: 1,
  },
  list: { paddingHorizontal: spacing.lg, paddingBottom: spacing.lg },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  logo: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
  },
  center: { textAlign: 'center' },
  suggestions: { alignSelf: 'stretch', gap: spacing.sm, marginTop: spacing.md },
  suggestion: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
});
