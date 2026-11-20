import { ActivityIndicator, Image, StyleSheet, Text, View } from 'react-native';
import { colors, spacing, typography } from '../../theme';

const logo = require('../../assets/logo.png');

export function Logo({ size = 72 }: { size?: number }) {
  return (
    <Image
      source={logo}
      style={[styles.logo, { width: size, height: size }]}
      accessibilityIgnoresInvertColors
      accessible={false}
    />
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
  logo: { marginBottom: spacing.sm },
  spinner: { marginTop: spacing.xl },
});
