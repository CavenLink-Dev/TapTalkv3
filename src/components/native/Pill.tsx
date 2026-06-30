import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { animation, radii, typography } from '../../theme/tokens';
import { springPop, timingBase, timingFast } from '../../theme/motion';
import { useReduceMotion } from '../../hooks/useReduceMotion';
import { useTheme } from '../../theme/useTheme';
import { hapticSelection } from '../../utils/haptics';

interface PillProps {
  label: string;
  selected: boolean;
  onPress: () => void;
  accessibilityLabel: string;
}

/**
 * Selectable pill (filter chip / role tag).
 *
 * Motion (from handoff "Chip / Pill"):
 *   • Press in   · scale 1 → 0.96 in 120ms easeStandard, haptic `selection`.
 *   • Release    · scale 0.96 → 1 via springPop.
 *   • Selection  · fill crossfades surface ↔ primary over 260ms, label color
 *                  crossfades in parallel (handled by interpolateColor so
 *                  there's no flash).
 *
 * Reduce Motion: no scale; selection becomes an instant fill swap.
 */
export function Pill({ label, selected, onPress, accessibilityLabel }: PillProps) {
  const reduceMotion = useReduceMotion();
  const t = useTheme();
  const pressed  = useSharedValue(0);
  const selectedV = useSharedValue(selected ? 1 : 0);

  React.useEffect(() => {
    selectedV.value = withTiming(selected ? 1 : 0, reduceMotion ? { duration: 0 } : timingBase());
  }, [selected, selectedV, reduceMotion]);

  const containerStyle = useAnimatedStyle(() => {
    const fill = interpolateColor(selectedV.value, [0, 1], [t.colors.surface, t.colors.primary]);
    const scale = reduceMotion ? 1 : 1 - pressed.value * (1 - animation.scalePressMd);
    return { backgroundColor: fill, transform: [{ scale }] };
  });

  const labelStyle = useAnimatedStyle(() => {
    const color = interpolateColor(selectedV.value, [0, 1], [t.colors.textMuted, t.colors.surface]);
    return { color };
  });

  const handlePressIn = () => {
    if (reduceMotion) return;
    pressed.value = withTiming(1, timingFast());
  };

  const handlePressOut = () => {
    if (reduceMotion) return;
    pressed.value = withSpring(0, springPop);
  };

  const handlePress = () => {
    hapticSelection();
    onPress();
  };

  return (
    <Animated.View style={[styles.pill, containerStyle]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityState={{ selected }}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
        style={styles.hit}
      >
        <Animated.Text style={[styles.label, labelStyle]}>{label}</Animated.Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  pill: {
    borderRadius: radii.pill,
    overflow: 'hidden',
  },
  hit: {
    minHeight: 34,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  label: {
    fontFamily: typography.fontFamilyDisplay,
    fontSize: typography.caption,
    fontWeight: typography.weightButton,
  },
});
