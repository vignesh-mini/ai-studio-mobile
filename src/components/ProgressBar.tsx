import { StyleSheet, View } from 'react-native';
import { colors, radius } from '../theme';

export function ProgressBar({
  value,
  color = colors.primary,
}: {
  value: number;
  color?: string;
}) {
  const percent = `${Math.round(
    Math.min(1, Math.max(0, value)) * 100,
  )}%` as const;
  return (
    <View style={styles.track}>
      <View style={[styles.fill, { width: percent, backgroundColor: color }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceAlt,
    overflow: 'hidden',
  },
  fill: { height: '100%', borderRadius: radius.pill },
});
