import { Platform, StyleSheet } from 'react-native';
import Markdown from 'react-native-markdown-display';
import { colors, radius, spacing } from '../theme';

export function MarkdownText({ children }: { children: string }) {
  return <Markdown style={markdownStyles}>{children}</Markdown>;
}

const mono = {
  fontFamily: Platform.select({ ios: 'Menlo', default: 'monospace' }),
  fontSize: 13,
  color: '#E2E8F0',
};

const markdownStyles = StyleSheet.create({
  body: { color: colors.text, fontSize: 15, lineHeight: 22 },
  paragraph: { marginTop: 0, marginBottom: spacing.sm },
  strong: { fontWeight: '700' },
  em: { fontStyle: 'italic', color: colors.textMuted },
  link: { color: colors.primary },
  heading1: { fontSize: 20, fontWeight: '700', marginVertical: spacing.sm },
  heading2: { fontSize: 18, fontWeight: '700', marginVertical: spacing.sm },
  heading3: { fontSize: 16, fontWeight: '700', marginVertical: spacing.xs },
  bullet_list: { marginBottom: spacing.sm },
  ordered_list: { marginBottom: spacing.sm },
  list_item: { marginVertical: 2 },
  code_inline: {
    ...mono,
    backgroundColor: colors.background,
    borderRadius: 4,
    paddingHorizontal: 4,
  },
  fence: {
    ...mono,
    backgroundColor: colors.background,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.sm,
    padding: spacing.md,
    marginVertical: spacing.sm,
  },
  code_block: {
    ...mono,
    backgroundColor: colors.background,
    borderRadius: radius.sm,
    padding: spacing.md,
  },
  blockquote: {
    backgroundColor: colors.surfaceAlt,
    borderLeftColor: colors.primary,
    borderLeftWidth: 3,
    paddingHorizontal: spacing.md,
  },
  hr: { backgroundColor: colors.border },
  table: { borderColor: colors.border },
  tr: { borderColor: colors.border },
});
