import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing, typography } from '../theme';
import { IconButton } from './IconButton';

interface AppHeaderProps {
  title?: string;
  subtitle?: string;
  onBack?: () => void;
  center?: ReactNode;
  right?: ReactNode;
}

export function AppHeader({
  title,
  subtitle,
  onBack,
  center,
  right,
}: AppHeaderProps) {
  return (
    <View style={styles.row}>
      <View style={styles.side}>
        {onBack ? (
          <IconButton name="chevron-back" onPress={onBack} label="Back" />
        ) : null}
      </View>
      <View style={styles.center}>
        {center ?? (
          <>
            {title ? (
              <Text style={typography.h3} numberOfLines={1}>
                {title}
              </Text>
            ) : null}
            {subtitle ? (
              <Text style={typography.caption}>{subtitle}</Text>
            ) : null}
          </>
        )}
      </View>
      <View style={[styles.side, styles.right]}>{right}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  side: { minWidth: 88, flexDirection: 'row' },
  right: { justifyContent: 'flex-end' },
  center: { flex: 1, alignItems: 'center' },
});
