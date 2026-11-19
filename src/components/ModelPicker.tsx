import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useModel, useModels } from '../hooks/useModels';
import { useAuthStore } from '../store/authStore';
import { colors, radius, spacing, typography } from '../theme';
import { accessTier, type AIModel, type AITask } from '../types';
import { Icon } from './Icon';

interface ModelPickerProps {
  task: AITask;
  value: string;
  onChange: (model: AIModel) => void;
  /** Compact pill for headers; the default is a full-width field for studio forms. */
  compact?: boolean;
  label?: string;
}

/** Shows the selected model and opens the model selection sheet on press. */
export function ModelPicker({
  task,
  value,
  onChange,
  compact,
  label,
}: ModelPickerProps) {
  const [open, setOpen] = useState(false);
  const model = useModel(value);

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel="Choose AI model"
        style={compact ? styles.pill : styles.field}
      >
        {compact ? null : (
          <View style={styles.fieldIcon}>
            <Icon name="sparkles" size={16} color={colors.primary} />
          </View>
        )}
        <View style={compact ? undefined : styles.flex}>
          {label ? <Text style={typography.caption}>{label}</Text> : null}
          <Text
            style={compact ? styles.pillText : typography.h3}
            numberOfLines={1}
          >
            {model?.name ?? value}
          </Text>
          {!compact && model ? (
            <Text style={typography.caption}>{model.provider}</Text>
          ) : null}
        </View>
        <Icon name="chevron-down" size={16} color={colors.textMuted} />
      </Pressable>
      <ModelSheet
        visible={open}
        task={task}
        selectedId={value}
        onClose={() => setOpen(false)}
        onSelect={m => {
          setOpen(false);
          onChange(m);
        }}
      />
    </>
  );
}

interface ModelSheetProps {
  visible: boolean;
  task: AITask;
  selectedId: string;
  onClose: () => void;
  onSelect: (model: AIModel) => void;
}

export function ModelSheet({
  visible,
  task,
  selectedId,
  onClose,
  onSelect,
}: ModelSheetProps) {
  const { data: models, isLoading } = useModels(task);
  const plan = useAuthStore(s => accessTier(s.user));
  const insets = useSafeAreaInsets();

  const choose = (model: AIModel) => {
    if (model.tier === 'premium' && plan === 'free') {
      Alert.alert(
        'Premium model',
        `${model.name} is available on the Premium plan.`,
      );
      return;
    }
    onSelect(model);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable
        style={styles.backdrop}
        onPress={onClose}
        accessibilityLabel="Close"
      />
      <View
        style={[styles.sheet, { paddingBottom: insets.bottom + spacing.lg }]}
      >
        <View style={styles.handle} />
        <Text style={[typography.h2, styles.title]}>Choose a model</Text>
        {isLoading ? (
          <ActivityIndicator color={colors.primary} style={styles.loading} />
        ) : (
          <FlatList
            data={models}
            keyExtractor={m => m.id}
            contentContainerStyle={styles.list}
            renderItem={({ item }) => {
              const selected = item.id === selectedId;
              const locked = item.tier === 'premium' && plan === 'free';
              return (
                <Pressable
                  onPress={() => choose(item)}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  style={[styles.option, selected && styles.optionSelected]}
                >
                  <View style={styles.flex}>
                    <View style={styles.optionTitleRow}>
                      <Text style={typography.h3}>{item.name}</Text>
                      {item.tier === 'premium' ? (
                        <View style={styles.premium}>
                          <Icon
                            name={locked ? 'lock-closed' : 'star'}
                            size={10}
                            color={colors.warning}
                          />
                          <Text style={styles.premiumText}>PRO</Text>
                        </View>
                      ) : null}
                    </View>
                    <Text style={typography.caption}>{item.provider}</Text>
                    <Text style={[typography.muted, styles.description]}>
                      {item.description}
                    </Text>
                    <View style={styles.tags}>
                      {item.capabilities.map(c => (
                        <Text key={c} style={styles.tag}>
                          {c}
                        </Text>
                      ))}
                    </View>
                  </View>
                  {selected ? (
                    <Icon
                      name="checkmark-circle"
                      size={22}
                      color={colors.primary}
                    />
                  ) : null}
                </Pressable>
              );
            }}
          />
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    maxWidth: 200,
  },
  pillText: { color: colors.text, fontWeight: '600', fontSize: 14 },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  fieldIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryMuted,
  },
  backdrop: { flex: 1, backgroundColor: colors.overlay },
  sheet: {
    maxHeight: '80%',
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingTop: spacing.sm,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    marginBottom: spacing.md,
  },
  title: { paddingHorizontal: spacing.lg, marginBottom: spacing.sm },
  loading: { margin: spacing.xl },
  list: { padding: spacing.lg, gap: spacing.sm },
  option: {
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  optionSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryMuted,
  },
  optionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  premium: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(251, 191, 36, 0.14)',
  },
  premiumText: { color: colors.warning, fontSize: 10, fontWeight: '700' },
  description: { marginTop: spacing.xs },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  tag: {
    fontSize: 11,
    color: colors.textMuted,
    backgroundColor: colors.surfaceAlt,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
});
