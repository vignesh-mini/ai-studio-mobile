import { useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Card } from '../../components/Card';
import { Icon, type IconName } from '../../components/Icon';
import { MediaTile } from '../../components/MediaGrid';
import { Screen } from '../../components/Screen';
import type { TabScreenProps } from '../../navigation/types';
import { useAuthStore } from '../../store/authStore';
import { useConversationList } from '../../hooks/useConversationSync';
import { isListedConversation, useChatStore } from '../../store/chatStore';
import { useLibraryStore } from '../../store/libraryStore';
import { colors, radius, spacing, toolColors, typography } from '../../theme';
import { timeAgo } from '../../utils';

interface Tool {
  key: string;
  title: string;
  subtitle: string;
  icon: IconName;
  color: string;
  onPress: () => void;
}

export function HomeScreen({ navigation }: TabScreenProps<'Home'>) {
  const user = useAuthStore(s => s.user);
  const assets = useLibraryStore(s => s.assets);
  const conversations = useChatStore(s => s.conversations);
  const messages = useChatStore(s => s.messages);
  const setActiveConversation = useChatStore(s => s.setActiveConversation);
  useConversationList();
  const [prompt, setPrompt] = useState('');

  const recentChats = useMemo(
    () =>
      Object.values(conversations)
        .filter(c => isListedConversation(messages, c.id))
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
        .slice(0, 3),
    [conversations, messages],
  );

  const tools: Tool[] = [
    {
      key: 'chat',
      title: 'AI Chat',
      subtitle: 'Ask anything',
      icon: 'chatbubbles',
      color: toolColors.chat,
      onPress: () => navigation.navigate('Chat'),
    },
    {
      key: 'image',
      title: 'AI Image',
      subtitle: 'Create artwork',
      icon: 'image',
      color: toolColors.image,
      onPress: () => navigation.navigate('Images'),
    },
    {
      key: 'video',
      title: 'AI Video',
      subtitle: 'Animate ideas',
      icon: 'videocam',
      color: toolColors.video,
      onPress: () => navigation.navigate('Videos'),
    },
    {
      key: 'doc',
      title: 'Document AI',
      subtitle: 'Understand files',
      icon: 'document-text',
      color: toolColors.document,
      onPress: () => navigation.navigate('Documents'),
    },
    {
      key: 'voice',
      title: 'Voice AI',
      subtitle: 'Talk naturally',
      icon: 'mic',
      color: toolColors.voice,
      onPress: () => navigation.navigate('Voice'),
    },
    {
      key: 'compare',
      title: 'Compare',
      subtitle: 'Two models, one prompt',
      icon: 'git-compare',
      color: toolColors.compare,
      onPress: () => navigation.navigate('Compare'),
    },
  ];

  const ask = () => {
    if (!prompt.trim()) return;
    navigation.navigate('Chat', { initialPrompt: prompt.trim() });
    setPrompt('');
  };

  return (
    <Screen scroll>
      <View style={styles.topRow}>
        <View>
          <Text style={typography.caption}>Welcome back</Text>
          <Text style={typography.h2}>{user?.name ?? 'Creator'}</Text>
        </View>
        <Pressable
          onPress={() => navigation.navigate('Profile')}
          style={styles.avatar}
          accessibilityRole="button"
          accessibilityLabel="Profile"
        >
          <Text style={styles.avatarText}>
            {(user?.name ?? 'U').charAt(0).toUpperCase()}
          </Text>
        </Pressable>
      </View>

      <View style={styles.hero}>
        <Text style={typography.h1}>What would you like to create?</Text>
        <View style={styles.askRow}>
          <TextInput
            value={prompt}
            onChangeText={setPrompt}
            onSubmitEditing={ask}
            placeholder="Ask anything, create images or generate videos…"
            placeholderTextColor={colors.textFaint}
            style={styles.askInput}
            returnKeyType="send"
          />
          <Pressable
            onPress={ask}
            style={styles.askButton}
            accessibilityLabel="Ask"
          >
            <Icon name="arrow-up" size={20} color={colors.white} />
          </Pressable>
        </View>
      </View>

      <Text style={typography.label}>Explore AI tools</Text>
      <View style={styles.grid}>
        {tools.map(tool => (
          <Pressable
            key={tool.key}
            onPress={tool.onPress}
            style={styles.toolCell}
            accessibilityRole="button"
          >
            {({ pressed }) => (
              <View style={[styles.tool, pressed && styles.toolPressed]}>
                <View
                  style={[
                    styles.toolIcon,
                    { backgroundColor: `${tool.color}22` },
                  ]}
                >
                  <Icon name={tool.icon} size={20} color={tool.color} />
                </View>
                <Text style={typography.h3}>{tool.title}</Text>
                <Text style={typography.caption}>{tool.subtitle}</Text>
              </View>
            )}
          </Pressable>
        ))}
      </View>

      <View style={styles.sectionRow}>
        <Text style={typography.label}>Recent creations</Text>
        <Pressable onPress={() => navigation.navigate('Library')} hitSlop={8}>
          <Text style={styles.link}>See all</Text>
        </Pressable>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.recentRow}
      >
        {assets.slice(0, 8).map(asset => (
          <View key={asset.id} style={styles.recentTile}>
            <MediaTile
              asset={asset}
              square
              onPress={() =>
                navigation.navigate('AssetViewer', { assetId: asset.id })
              }
            />
          </View>
        ))}
      </ScrollView>

      {recentChats.length ? (
        <>
          <View style={styles.sectionRow}>
            <Text style={typography.label}>Recent chats</Text>
            <Pressable
              onPress={() => navigation.navigate('History')}
              hitSlop={8}
            >
              <Text style={styles.link}>History</Text>
            </Pressable>
          </View>
          {recentChats.map(c => (
            <Card
              key={c.id}
              style={styles.chatCard}
              onPress={() => {
                setActiveConversation(c.id);
                navigation.navigate('Chat', { conversationId: c.id });
              }}
            >
              <Icon
                name="chatbubble-ellipses-outline"
                size={18}
                color={colors.textMuted}
              />
              <View style={styles.flex}>
                <Text style={typography.body} numberOfLines={1}>
                  {c.title}
                </Text>
                <Text style={typography.caption}>{timeAgo(c.updatedAt)}</Text>
              </View>
              <Icon name="chevron-forward" size={16} color={colors.textFaint} />
            </Card>
          ))}
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryMuted,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  avatarText: { color: colors.text, fontWeight: '700', fontSize: 16 },
  hero: {
    gap: spacing.lg,
    padding: spacing.lg,
    borderRadius: radius.xl,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  askRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingLeft: spacing.md,
    padding: spacing.xs,
    borderRadius: radius.pill,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  askInput: {
    flex: 1,
    color: colors.text,
    fontSize: 15,
    paddingVertical: spacing.sm,
  },
  askButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', margin: -spacing.xs },
  toolCell: { width: '50%', padding: spacing.xs },
  tool: {
    gap: spacing.xs,
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  toolPressed: { backgroundColor: colors.surfaceAlt },
  toolIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  sectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  link: { color: colors.primary, fontWeight: '600', fontSize: 13 },
  recentRow: { gap: spacing.sm },
  recentTile: { width: 120 },
  chatCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
});
