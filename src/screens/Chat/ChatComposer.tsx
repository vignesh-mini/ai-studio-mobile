import { useEffect, useState } from 'react';
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Icon } from '../../components/Icon';
import { IconButton } from '../../components/IconButton';
import { colors, radius, spacing, typography } from '../../theme';
import type { Attachment, ChatMessage } from '../../types';
import { uid } from '../../utils';

interface ChatComposerProps {
  isStreaming: boolean;
  editing: ChatMessage | null;
  onCancelEdit: () => void;
  onSend: (text: string, attachments: Attachment[]) => void;
  onStop: () => void;
}

// Phase 1 attaches sample files. Phase 6 swaps these for react-native-image-picker and
// @react-native-documents/picker, uploading through POST /files/upload first.
const sampleAttachment = (kind: Attachment['kind']): Attachment =>
  kind === 'image'
    ? {
        id: uid('att'),
        kind,
        name: 'photo.jpg',
        uri: 'mock://photo.jpg',
        mimeType: 'image/jpeg',
      }
    : {
        id: uid('att'),
        kind,
        name: 'report.pdf',
        uri: 'mock://report.pdf',
        mimeType: 'application/pdf',
      };

export function ChatComposer({
  isStreaming,
  editing,
  onCancelEdit,
  onSend,
  onStop,
}: ChatComposerProps) {
  const [text, setText] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);

  useEffect(() => {
    if (editing) {
      setText(editing.content);
      setAttachments(editing.attachments ?? []);
    }
  }, [editing]);

  const canSend = text.trim().length > 0 && !isStreaming;

  const submit = () => {
    if (!canSend) return;
    onSend(text, attachments);
    setText('');
    setAttachments([]);
  };

  const attach = () =>
    Alert.alert('Attach', 'Add a file to your message', [
      {
        text: 'Image',
        onPress: () => setAttachments(a => [...a, sampleAttachment('image')]),
      },
      {
        text: 'Document',
        onPress: () =>
          setAttachments(a => [...a, sampleAttachment('document')]),
      },
      { text: 'Cancel', style: 'cancel' },
    ]);

  return (
    <View style={styles.root}>
      {editing ? (
        <View style={styles.editBar}>
          <Icon name="create-outline" size={14} color={colors.primary} />
          <Text style={[typography.caption, styles.flex]}>
            Editing message – later replies will be replaced
          </Text>
          <Pressable
            onPress={() => {
              setText('');
              setAttachments([]);
              onCancelEdit();
            }}
            hitSlop={8}
          >
            <Text style={styles.cancel}>Cancel</Text>
          </Pressable>
        </View>
      ) : null}

      {attachments.length ? (
        <View style={styles.attachments}>
          {attachments.map(a => (
            <View key={a.id} style={styles.chip}>
              <Icon
                name={a.kind === 'image' ? 'image' : 'document-text'}
                size={14}
                color={colors.textMuted}
              />
              <Text style={typography.caption}>{a.name}</Text>
              <Pressable
                onPress={() =>
                  setAttachments(list => list.filter(x => x.id !== a.id))
                }
                hitSlop={8}
                accessibilityLabel={`Remove ${a.name}`}
              >
                <Icon name="close" size={14} color={colors.textMuted} />
              </Pressable>
            </View>
          ))}
        </View>
      ) : null}

      <View style={styles.inputRow}>
        <IconButton
          name="add-circle-outline"
          label="Attach file"
          color={colors.textMuted}
          onPress={attach}
        />
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="Message AI Studio…"
          placeholderTextColor={colors.textFaint}
          multiline
          style={styles.input}
        />
        {isStreaming ? (
          <Pressable
            onPress={onStop}
            style={[styles.send, styles.stop]}
            accessibilityLabel="Stop generating"
          >
            <Icon name="stop" size={16} color={colors.white} />
          </Pressable>
        ) : (
          <Pressable
            onPress={submit}
            disabled={!canSend}
            style={[styles.send, !canSend && styles.sendDisabled]}
            accessibilityLabel="Send message"
          >
            <Icon name="arrow-up" size={20} color={colors.white} />
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
    gap: spacing.sm,
  },
  flex: { flex: 1 },
  editBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  cancel: { color: colors.primary, fontWeight: '600', fontSize: 13 },
  attachments: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceAlt,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.xs,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xs,
  },
  input: {
    flex: 1,
    maxHeight: 140,
    minHeight: 40,
    color: colors.text,
    fontSize: 15,
    paddingVertical: spacing.sm,
  },
  send: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
  },
  sendDisabled: { backgroundColor: colors.elevated },
  stop: { backgroundColor: colors.danger },
});
