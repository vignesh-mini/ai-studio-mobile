import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Icon } from '../../components/Icon';
import { colors, spacing, typography } from '../../theme';

export function Logo({ size = 72 }: { size?: number }) {
  return (
    <View
      style={[
        styles.logo,
        { width: size, height: size, borderRadius: size / 3.6 },
      ]}
    >
      <Icon name="sparkles" size={size * 0.5} color={colors.white} />
    </View>
  );
}

export function SplashScreen() {
  return (
    <View style={styles.root}>
      <Logo size={88} />
      <Text style={typography.h1}>AI Studio</Text>
      <Text style={typography.muted}>
        Chat · Images · Video · Documents · Voice
      </Text>
      <ActivityIndicator color={colors.primary} style={styles.spinner} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    backgroundColor: colors.background,
  },
  logo: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    marginBottom: spacing.sm,
  },
  spinner: { marginTop: spacing.xl },
});
