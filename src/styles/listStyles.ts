import { StyleSheet } from 'react-native';
import { radii, spacing, typography } from '../theme/tokens';
import type { ThemeValues } from '../theme/useTheme';

export function createListStyles(t: ThemeValues) {
  return StyleSheet.create({
    addButton: {
      width: 50,
      minHeight: 44,
    },
    checkCircle: {
      width: 26,
      height: 26,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: t.colors.disabled,
      borderRadius: 13,
    },
    checkCircleDone: {
      borderColor: t.colors.success,
      backgroundColor: t.colors.success,
    },
    checkMark: {
      color: t.colors.surface,
      fontFamily: t.fonts.displayHeavy,
      fontWeight: '900',
    },
    emptyIcon: {
      fontSize: 38,
    },
    input: {
      flex: 1,
    },
    inputRow: {
      flexDirection: 'row',
      gap: spacing.sm,
      marginTop: spacing.md,
    },
    itemRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      marginTop: spacing.md,
      borderRadius: radii.card,
      backgroundColor: t.colors.input,
      padding: spacing.md,
      minHeight: 44,
    },
    itemText: {
      flex: 1,
      color: t.colors.text,
      fontFamily: t.fonts.displayHeavy,
      fontSize: t.typography.callout,
      fontWeight: typography.weightCaption,
    },
    itemTextDone: {
      color: t.colors.textTertiary,
      textDecorationLine: 'line-through',
    },
    section: {
      marginBottom: spacing.lg,
    },
    sectionTitle: {
      color: t.colors.text,
      fontFamily: t.fonts.displayHeavy,
      fontSize: t.typography.body,
      fontWeight: typography.weightHeading,
    },
  });
}
