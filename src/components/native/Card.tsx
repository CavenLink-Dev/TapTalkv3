import React from 'react';
import { StyleProp, StyleSheet, View, ViewProps, ViewStyle } from 'react-native';
import { colors, radii, spacing } from '../../theme/tokens';

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
  return (
    <View style={[styles.card, style]} {...viewProps}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    padding: spacing.lg,
  },
});
