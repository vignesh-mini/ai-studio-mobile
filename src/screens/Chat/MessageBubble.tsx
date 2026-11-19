import { memo } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Icon } from '../../components/Icon';
import { IconButton } from '../../components/IconButton';
import { MarkdownText } from '../../components/MarkdownText';
import { useModel } from '../../hooks/useModels';
import { colors, radius, spacing, typography } from '../../theme';
import type { ChatMessage } from '../../types';

interface MessageBubbleProps {
  message: ChatMessage;
  canRegenerate: boolean;
  busy: boolean;
  onCopy: (message: ChatMessage) => void;
  onShare: (message: ChatMessage) => void;
  onRegenerate: () => void;
  onEdit: (message: ChatMessage) => void;
}

export const MessageBubble = memo(function MessageBubbleView({
  message,
  canRegenerate,
  busy,
  onCopy,
  onShare,
  onRegenerate,
  onEdit,
}: MessageBubbleProps) {
  const model = useModel(message.modelId);

  if (message.kind === 'event') {
    return (
      <View style={styles.event}>
        <Icon name="swap-horizontal" size={12} color={colors.textFaint} />
        <Text style={styles.eventText}>{message.content}</Text>
      </View>
    );
  }

  if (message.role === 'user') {
    return (
      <View style={styles.userWrap}>
        {message.attachments?.map(a => (
          <View key={a.id} style={styles.attachment}>
            <Icon
              name={a.kind === 'image' ? 'image' : 'document-text'}
              size={14}
              color={colors.textMuted}
            />
            <Text style={typography.caption} numberOfLines={1}>
              {a.name}
            </Text>
          </View>
        ))}
        <View style={styles.userBubble}>
          <Text style={styles.userText} selectable>
            {message.content}
          </Text>
        </View>
        <View style={styles.actions}>
          <IconButton
            name="create-outline"
            size={16}
            color={colors.textFaint}
            label="Edit prompt"
            onPress={() => onEdit(message)}
            disabled={busy}
          />
          <IconButton
            name="copy-outline"
            size={16}
            color={colors.textFaint}
            label="Copy"
            onPress={() => onCopy(message)}
          />
        </View>
      </View>
    );
  }

  const streaming = message.status === 'streaming';
  return (
    <View style={styles.assistant}>
      <View style={styles.modelRow}>
        <View style={styles.avatar}>
          <Icon name="sparkles" size={12} color={colors.white} />
        </View>
        <Text style={styles.modelName}>
          {model?.name ?? message.modelId ?? 'Assistant'}
        </Text>
      </View>

      {streaming && !message.content ? (
        <View style={styles.thinking}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={typography.muted}>Thinking…</Text>
        </View>
      ) : message.status === 'error' ? (
        <Text style={styles.error}>{message.content}</Text>
      ) : (
        <MarkdownText>{message.content}</MarkdownText>
      )}

      {message.status === 'stopped' ? (
        <Text style={typography.caption}>Stopped</Text>
      ) : null}

      {!streaming && message.content ? (
        <View style={styles.actionsLeft}>
          <IconButton
            name="copy-outline"
            size={16}
            color={colors.textMuted}
            label="Copy"
            onPress={() => onCopy(message)}
          />
          <IconButton
            name="share-outline"
            size={16}
            color={colors.textMuted}
            label="Share"
            onPress={() => onShare(message)}
          />
          {canRegenerate ? (
            <IconButton
              name="refresh"
              size={16}
              color={colors.textMuted}
              label="Regenerate"
              onPress={onRegenerate}
              disabled={busy}
            />
          ) : null}
        </View>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  event: {
    flexDirection: 'row',
    alignSelf: 'center',
    alignItems: 'center',
    gap: spacing.xs,
    marginVertical: spacing.sm,
  },
  eventText: { color: colors.textFaint, fontSize: 12 },
  userWrap: {
    alignItems: 'flex-end',
    marginVertical: spacing.sm,
    gap: spacing.xs,
  },
  userBubble: {
    maxWidth: '85%',
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    borderBottomRightRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
  },
  userText: { color: colors.white, fontSize: 15, lineHeight: 22 },
  attachment: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    maxWidth: '70%',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceAlt,
  },
  actions: { flexDirection: 'row' },
  actionsLeft: { flexDirection: 'row', marginLeft: -spacing.sm },
  assistant: { marginVertical: spacing.sm, gap: spacing.xs },
  modelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  avatar: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
  },
  modelName: { color: colors.textMuted, fontSize: 13, fontWeight: '600' },
  thinking: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  error: { color: colors.danger, fontSize: 15 },
});
