import { StyleSheet } from 'react-native';
import { colors, radii, spacing, typography } from '../theme/tokens';

export const listStyles = StyleSheet.create({
  addButton: {
    width: 50,
  },
  checkCircle: {
    width: 26,
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.disabled,
    borderRadius: 13,
  },
  checkCircleDone: {
    borderColor: colors.success,
    backgroundColor: colors.success,
  },
  checkMark: {
    color: colors.surface,
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
    backgroundColor: colors.input,
    padding: spacing.md,
  },
  itemText: {
    flex: 1,
    color: colors.text,
    fontSize: typography.callout,
    fontWeight: '700',
  },
  itemTextDone: {
    color: colors.textTertiary,
    textDecorationLine: 'line-through',
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: '800',
  },
});
