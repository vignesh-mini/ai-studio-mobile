import { useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { AppHeader } from '../../components/AppHeader';
import { Card } from '../../components/Card';
import { EmptyState } from '../../components/EmptyState';
import { Icon } from '../../components/Icon';
import { Screen } from '../../components/Screen';
import { useModels } from '../../hooks/useModels';
import type { RootScreenProps } from '../../navigation/types';
import { useChatStore } from '../../store/chatStore';
import { colors, radius, spacing, typography } from '../../theme';
import { timeAgo } from '../../utils';

export function HistoryScreen({ navigation }: RootScreenProps<'History'>) {
  const conversations = useChatStore(s => s.conversations);
  const messages = useChatStore(s => s.messages);
  const deleteConversation = useChatStore(s => s.deleteConversation);
  const { data: models } = useModels();
  const [query, setQuery] = useState('');

  const items = useMemo(() => {
    const q = query.trim().toLowerCase();
    return Object.values(conversations)
      .filter(c => (messages[c.id]?.length ?? 0) > 0)
      .filter(
        c =>
          !q ||
          c.title.toLowerCase().includes(q) ||
          messages[c.id].some(m => m.content.toLowerCase().includes(q)),
      )
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }, [conversations, messages, query]);

  const open = (id: string) =>
    navigation.navigate('Main', {
      screen: 'Chat',
      params: { conversationId: id },
    });

  const confirmDelete = (id: string, title: string) =>
    Alert.alert('Delete conversation?', title, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => deleteConversation(id),
      },
    ]);

  return (
    <Screen
      edges={['top', 'bottom']}
      header={<AppHeader title="History" onBack={navigation.goBack} />}
    >
      <FlatList
        data={items}
        keyExtractor={c => c.id}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          <View style={styles.search}>
            <Icon name="search" size={16} color={colors.textMuted} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search conversations"
              placeholderTextColor={colors.textFaint}
              style={styles.searchInput}
            />
          </View>
        }
        ListEmptyComponent={
          <EmptyState
            icon="chatbubbles-outline"
            title="No conversations"
            message="Chats you start appear here."
          />
        }
        renderItem={({ item }) => {
          const last = messages[item.id].filter(m => m.kind !== 'event').at(-1);
          return (
            <Card style={styles.card} onPress={() => open(item.id)}>
              <View style={styles.flex}>
                <Text style={typography.h3} numberOfLines={1}>
                  {item.title}
                </Text>
                {last ? (
                  <Text style={typography.muted} numberOfLines={2}>
                    {last.content.replace(/[*_`#>]/g, '')}
                  </Text>
                ) : null}
                <Text style={typography.caption}>
                  {models?.find(m => m.id === item.modelId)?.name ??
                    item.modelId}{' '}
                  · {timeAgo(item.updatedAt)}
                </Text>
              </View>
              <Icon
                name="trash-outline"
                size={18}
                color={colors.textFaint}
                onPress={() => confirmDelete(item.id, item.title)}
                accessibilityLabel="Delete conversation"
              />
            </Card>
          );
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, gap: spacing.xs },
  content: { padding: spacing.lg, gap: spacing.sm },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
  },
  searchInput: { flex: 1, height: 44, color: colors.text, fontSize: 15 },
  card: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
});
