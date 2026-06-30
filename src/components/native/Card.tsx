import React from 'react';
import { StyleProp, StyleSheet, View, ViewProps, ViewStyle } from 'react-native';
import { radii, spacing } from '../../theme/tokens';
import { useTheme } from '../../theme/useTheme';

interface CardProps extends ViewProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

/**
 * Flat surface card. Design rule: no border, no shadow — contrast comes
 * from the surface fill sitting on the muted page background. Radius is
 * fixed to the global `card` token so every card in the app reads as
 * the same shape regardless of which screen it lives on.
 */
export function Card({ children, style, ...viewProps }: CardProps) {
  const t = useTheme();
  return (
    <View style={[styles.card, { backgroundColor: t.colors.surface }, style]} {...viewProps}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radii.card,
    padding: spacing.lg,
  },
});
