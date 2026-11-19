import { StyleSheet } from 'react-native';
import { DarkTheme, type Theme } from '@react-navigation/native';

export const colors = {
  background: '#0A0F1E',
  surface: '#121A2F',
  surfaceAlt: '#1A2440',
  elevated: '#222D4D',
  border: '#27324F',
  primary: '#6E8BFF',
  primaryMuted: 'rgba(110, 139, 255, 0.16)',
  accent: '#2DD4BF',
  text: '#F1F5FF',
  textMuted: '#93A0BD',
  textFaint: '#5D6A88',
  success: '#34D399',
  warning: '#FBBF24',
  danger: '#F87171',
  white: '#FFFFFF',
  overlay: 'rgba(5, 8, 18, 0.72)',
};

export const toolColors = {
  chat: '#6E8BFF',
  image: '#F472B6',
  video: '#F59E0B',
  document: '#2DD4BF',
  voice: '#A78BFA',
  compare: '#38BDF8',
};

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };

export const radius = { sm: 8, md: 12, lg: 16, xl: 24, pill: 999 };

export const typography = StyleSheet.create({
  h1: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.5,
  },
  h2: { fontSize: 22, fontWeight: '700', color: colors.text },
  h3: { fontSize: 17, fontWeight: '600', color: colors.text },
  body: { fontSize: 15, lineHeight: 22, color: colors.text },
  muted: { fontSize: 14, lineHeight: 20, color: colors.textMuted },
  caption: { fontSize: 12, color: colors.textMuted },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
});

export const navigationTheme: Theme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: colors.primary,
    background: colors.background,
    card: colors.surface,
    text: colors.text,
    border: colors.border,
    notification: colors.accent,
  },
};
