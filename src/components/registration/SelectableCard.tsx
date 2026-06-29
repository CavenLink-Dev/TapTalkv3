import React, { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  FadeInDown,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { animation, colors, radii, spacing, typography } from '../../theme/tokens';
import { springPop, timingBase, timingFast, timingFocus } from '../../theme/motion';
import { useReduceMotion } from '../../hooks/useReduceMotion';
import { hapticLight } from '../../utils/haptics';

interface SelectableCardProps {
  label: string;
  description?: string;
  selected: boolean;
  onPress: () => void;
  accessibilityLabel?: string;
  /** Entrance stagger index (0-based). Renders translateY 12 → 0 + fade. */
  entranceIndex?: number;
}

/**
 * Radio / picker card. Used for app mode, theme, text size, role.
 *
 * Motion (from the design handoff):
 *   • Press in   · scale 1 → 0.98 in 120ms easeStandard, haptic `light`.
 *   • Release    · scale back via springPop.
 *   • Selection  · border-width 1.5 → 2 + border + background cross-fade
 *                  200ms easeStandard; check ring scales 0 → 1 with springPop;
 *                  brand-tinted shadow fades in over 260ms. Deselect mirrors.
 *   • Entrance   · translateY 12 → 0 + opacity 0 → 1 over 260ms, staggered
 *                  60ms per card (80ms when Reduce Motion is on, no translate).
 */
export function SelectableCard({
  label,
  description,
  selected,
  onPress,
  accessibilityLabel,
  entranceIndex = 0,
}: SelectableCardProps) {
  const reduceMotion = useReduceMotion();
  const pressed   = useSharedValue(0);
  const selectedV = useSharedValue(selected ? 1 : 0);

  useEffect(() => {
    if (reduceMotion) {
      selectedV.value = withTiming(selected ? 1 : 0, { duration: animation.durReduced });
    } else if (selected) {
      selectedV.value = withSpring(1, springPop);
    } else {
      selectedV.value = withTiming(0, timingFocus());
    }
  }, [selected, selectedV, reduceMotion]);

  const cardStyle = useAnimatedStyle(() => {
    const borderWidth = 1.5 + selectedV.value * 0.5;
    const borderColor = interpolateColor(
      selectedV.value,
      [0, 1],
      [colors.border, colors.primary],
    );
    const background = interpolateColor(
      selectedV.value,
      [0, 1],
      [colors.surface, '#EAF5FE'],
    );
    const scale = reduceMotion ? 1 : 1 - pressed.value * (1 - 0.98);
    // Design rule: no glow on selection — the border + tinted fill
    // already communicate the state clearly.
    return {
      borderWidth,
      borderColor,
      backgroundColor: background,
      transform: [{ scale }],
    };
  });

  const ringStyle = useAnimatedStyle(() => {
    const background = interpolateColor(
      selectedV.value,
      [0, 1],
      ['rgba(25,154,238,0)', colors.primary],
    );
    const border = interpolateColor(
      selectedV.value,
      [0, 1],
      [colors.border, colors.primary],
    );
    return { backgroundColor: background, borderColor: border };
  });

  const checkStyle = useAnimatedStyle(() => ({
    opacity: selectedV.value,
    transform: [{ scale: selectedV.value }],
  }));

  const labelStyle = useAnimatedStyle(() => {
    const color = interpolateColor(selectedV.value, [0, 1], [colors.text, colors.primaryDark]);
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
    hapticLight();
    onPress();
  };

  // Entrance: small translateY + opacity, staggered. Reduce Motion → fade only.
  const stagger = (reduceMotion ? animation.stagRowRM : animation.stagRow) * entranceIndex;
  const entering = reduceMotion
    ? FadeInDown.duration(animation.durBase).delay(stagger).withInitialValues({ transform: [{ translateY: 0 }] })
    : FadeInDown.duration(animation.durBase).delay(stagger);

  return (
    <Animated.View entering={entering} style={styles.wrap}>
      <Animated.View style={[styles.card, cardStyle]}>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ selected }}
          accessibilityLabel={accessibilityLabel ?? label}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          onPress={handlePress}
          style={styles.row}
        >
          <View style={styles.textBlock}>
            <Animated.Text style={[styles.label, labelStyle]}>{label}</Animated.Text>
            {description ? <Text style={styles.description}>{description}</Text> : null}
          </View>
          <Animated.View style={[styles.checkRing, ringStyle]}>
            <Animated.View style={checkStyle}>
              <Ionicons name="checkmark" size={16} color={colors.surface} />
            </Animated.View>
          </Animated.View>
        </Pressable>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
  },
  card: {
    borderRadius: radii.card,
    minHeight: 60,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  textBlock: {
    flex: 1,
  },
  label: {
    fontSize: typography.body,
    fontWeight: typography.weightCaption,
  },
  description: {
    marginTop: 2,
    fontSize: typography.callout,
    color: colors.textMuted,
    lineHeight: 20,
  },
  checkRing: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
