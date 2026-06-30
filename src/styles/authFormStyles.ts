import { StyleSheet } from 'react-native';
import { spacing, typography } from '../theme/tokens';
import type { ThemeValues } from '../theme/useTheme';

export function createAuthFormStyles(t: ThemeValues) {
  return StyleSheet.create({
    button: {
      marginTop: spacing.md,
    },
    field: {
      marginBottom: spacing.md,
      marginTop: 6,
    },
    label: {
      color: t.colors.text,
      fontFamily: t.fonts.displayHeavy,
      fontSize: t.typography.caption,
      fontWeight: typography.weightEyebrow,
      letterSpacing: typography.trackEyebrow,
      textTransform: 'uppercase',
    },
    link: {
      color: t.colors.primary,
      fontFamily: t.fonts.displayHeavy,
      fontSize: t.typography.callout,
      fontWeight: typography.weightHeading,
      textAlign: 'center',
    },
    linkButton: {
      paddingTop: spacing.lg,
      minHeight: 44,
    },
  });
}
