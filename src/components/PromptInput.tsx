import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { colors, radius, spacing } from '../theme';
import { Icon } from './Icon';

interface PromptInputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  onEnhance?: () => void;
  enhancing?: boolean;
}

export function PromptInput({
  value,
  onChangeText,
  placeholder,
  onEnhance,
  enhancing,
}: PromptInputProps) {
  return (
    <View style={styles.box}>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textFaint}
        multiline
        maxLength={2000}
        style={styles.input}
        textAlignVertical="top"
      />
      <View style={styles.footer}>
        <Text style={styles.count}>{value.length}/2000</Text>
        {onEnhance ? (
          <Pressable
            onPress={onEnhance}
            disabled={!value.trim() || enhancing}
            accessibilityRole="button"
            style={[
              styles.enhance,
              (!value.trim() || enhancing) && styles.disabled,
            ]}
          >
            {enhancing ? (
              <ActivityIndicator size="small" color={colors.accent} />
            ) : (
              <Icon name="color-wand" size={14} color={colors.accent} />
            )}
            <Text style={styles.enhanceText}>Enhance prompt</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  input: {
    minHeight: 110,
    color: colors.text,
    fontSize: 15,
    lineHeight: 22,
    padding: 0,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  count: { color: colors.textFaint, fontSize: 12 },
  enhance: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(45, 212, 191, 0.12)',
  },
  enhanceText: { color: colors.accent, fontSize: 13, fontWeight: '600' },
  disabled: { opacity: 0.5 },
});
