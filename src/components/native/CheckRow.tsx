import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { animation, spacing, typography } from '../../theme/tokens';
import { springPop, timingFast, timingFocus } from '../../theme/motion';
import { useReduceMotion } from '../../hooks/useReduceMotion';
import { useTheme } from '../../theme/useTheme';
import { hapticSelection } from '../../utils/haptics';
import { fonts } from '../../theme/fonts';

interface CheckRowProps {
  label: string;
  value: boolean;
  onChange: (next: boolean) => void;
  accessibilityLabel?: string;
}

/**
 * Compact inline checkbox + label row.
 *
 * Used for "Remember me" style options where a full SelectableCard would be
 * visually too heavy. Hit target stays ≥ 44pt via `hitSlop`.
 *
 * Motion: 28pt box border + fill cross-fade; check icon springs 0→1 with
 * `springPop`. Reduce Motion → instant fill swap.
 */
export function CheckRow({ label, value, onChange, accessibilityLabel }: CheckRowProps) {
  const reduceMotion = useReduceMotion();
  const t = useTheme();
  const v = useSharedValue(value ? 1 : 0);
  const pressed = useSharedValue(0);

  React.useEffect(() => {
    if (reduceMotion) {
      v.value = withTiming(value ? 1 : 0, { duration: animation.durReduced });
    } else if (value) {
      v.value = withSpring(1, springPop);
    } else {
      v.value = withTiming(0, timingFocus());
    }
  }, [value, v, reduceMotion]);

  const boxStyle = useAnimatedStyle(() => {
    const background = interpolateColor(v.value, [0, 1], [t.colors.surface, t.colors.primary]);
    const border = interpolateColor(v.value, [0, 1], [t.colors.border, t.colors.primary]);
    const scale = reduceMotion ? 1 : 1 - pressed.value * 0.06;
    return { backgroundColor: background, borderColor: border, transform: [{ scale }] };
  }, [t.colors.surface, t.colors.primary, t.colors.border, reduceMotion]);

  const checkStyle = useAnimatedStyle(() => ({
    opacity: v.value,
    transform: [{ scale: v.value }],
  }));

  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ checked: value }}
      hitSlop={10}
      onPressIn={() => {
        if (!reduceMotion) pressed.value = withTiming(1, timingFast());
      }}
      onPressOut={() => {
        if (!reduceMotion) pressed.value = withSpring(0, springPop);
      }}
      onPress={() => {
        hapticSelection();
        onChange(!value);
      }}
      style={styles.row}
    >
      <Animated.View style={[styles.box, boxStyle]}>
        <Animated.View style={checkStyle}>
          <Ionicons name="checkmark" size={16} color={t.colors.surface} />
        </Animated.View>
      </Animated.View>
      <Text style={[styles.label, { color: t.colors.text }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm + 2,
    minHeight: 44,
  },
  box: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontFamily: fonts.body,
    fontSize: typography.callout,
  },
});
