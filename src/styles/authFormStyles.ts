import { StyleSheet } from 'react-native';
import { colors, spacing, typography } from '../theme/tokens';

export const authFormStyles = StyleSheet.create({
  button: {
    marginTop: spacing.md,
  },
  field: {
    marginBottom: spacing.md,
    marginTop: 6,
  },
  label: {
    color: colors.text,
    fontSize: typography.caption,
    fontWeight: '900',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  link: {
    color: colors.primary,
    fontSize: typography.callout,
    fontWeight: '800',
    textAlign: 'center',
  },
  linkButton: {
    paddingTop: spacing.lg,
  },
});
