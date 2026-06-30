/**
 * ScreenHeader — large bold title for stack screens that don't use `Screen`.
 */

import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { spacing } from '../../theme/tokens';
import { useTheme } from '../../theme/useTheme';
import { ThemedText } from './ThemedText';

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  /** Trailing action slot (e.g. toolbar button). */
  right?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function ScreenHeader({ title, subtitle, right, style }: ScreenHeaderProps) {
  const t = useTheme();

  return (
    <View style={[styles.row, style]}>
      <View style={styles.copy}>
        <ThemedText variant="title" accessibilityRole="header">
          {title}
        </ThemedText>
        {subtitle ? (
          <ThemedText variant="callout" color={t.colors.textMuted} style={styles.subtitle}>
            {subtitle}
          </ThemedText>
        ) : null}
      </View>
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  copy: {
    flex: 1,
  },
  subtitle: {
    marginTop: 4,
  },
});
