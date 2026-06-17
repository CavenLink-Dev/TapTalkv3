import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { colors, radii, typography } from '../../theme/tokens';

interface PillProps {
  label: string;
  selected: boolean;
  onPress: () => void;
  accessibilityLabel: string;
}

export function Pill({ label, selected, onPress, accessibilityLabel }: PillProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.pill,
        selected && styles.selected,
        pressed && styles.pressed,
      ]}
    >
      <Text style={[styles.label, selected && styles.selectedLabel]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  label: {
    color: colors.textMuted,
    fontSize: typography.caption,
    fontWeight: '700',
  },
  pill: {
    minHeight: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    paddingHorizontal: 14,
  },
  pressed: {
    transform: [{ scale: 0.97 }],
  },
  selected: {
    backgroundColor: colors.primary,
  },
  selectedLabel: {
    color: colors.surface,
  },
});
