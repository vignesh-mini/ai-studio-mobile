import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing } from '../theme';
import { Icon } from './Icon';

/**
 * Shown on features still served by the mock layer, so sample output is never
 * mistaken for a real generation from the user's prompt.
 */
export function DemoNotice({
  visible,
  what,
}: {
  visible: boolean;
  what: string;
}) {
  if (!visible) return null;
  return (
    <View style={styles.box} accessibilityRole="text">
      <Icon name="flask-outline" size={16} color={colors.warning} />
      <Text style={styles.text}>
        <Text style={styles.bold}>Demo mode. </Text>
        {what} are sample placeholders – your prompt is not sent to an AI model
        yet. This feature connects to real models in a later phase.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.35)',
    backgroundColor: 'rgba(251, 191, 36, 0.08)',
  },
  text: { flex: 1, color: colors.textMuted, fontSize: 13, lineHeight: 18 },
  bold: { color: colors.warning, fontWeight: '700' },
});
