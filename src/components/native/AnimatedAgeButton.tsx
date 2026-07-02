import React, { useEffect } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  FadeInDown,
} from 'react-native-reanimated';
import { hapticLight } from '../../utils/haptics';
import { radii, shadows, typography } from '../../theme/tokens';
import { useTheme } from '../../theme/useTheme';
import { useReduceMotion } from '../../hooks/useReduceMotion';

export type AgeRange = 'under-13' | '13-to-15' | '16-to-17' | '18-or-older';

interface AnimatedAgeButtonProps {
  label: string;
  ageRange: AgeRange;
  selected: boolean;
  onPress: () => void;
  /**
   * Delay for the entrance animation (used for staggering)
   */
  entranceDelay?: number;
  /**
   * Blocked state (red) - shown when age is under consent threshold
   */
  blocked?: boolean;
  /**
   * Show chevron on the right side
   */
  showChevron?: boolean;
}

/**
 * Animated age selection button with iOS-native press feedback.
 * Supports normal (blue), blocked (red), and unselected states.
 */
export function AnimatedAgeButton({
  label,
  selected,
  onPress,
  entranceDelay = 0,
  blocked = false,
  showChevron = true,
}: AnimatedAgeButtonProps) {
  const t = useTheme();
  const reduceMotion = useReduceMotion();
  const scale = useSharedValue(1);
  const chevronRotation = useSharedValue(selected ? 1 : 0);

  useEffect(() => {
    if (reduceMotion) {
      chevronRotation.value = selected ? 1 : 0;
      return;
    }
    chevronRotation.value = withTiming(selected ? 1 : 0, { duration: 200 });
  }, [selected, chevronRotation, reduceMotion]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${chevronRotation.value * 90}deg` }],
  }));

  const handlePressIn = () => {
    if (!reduceMotion) {
      scale.value = withTiming(0.985, { duration: 100 });
    }
    hapticLight();
  };

  const handlePressOut = () => {
    if (reduceMotion) return;
    scale.value = withTiming(1, { duration: 100 });
  };

  const buttonBackground = selected && blocked
    ? t.colors.danger
    : selected
      ? t.colors.primary
      : t.colors.softBlue;

  const buttonBorder = selected && blocked
    ? t.colors.danger
    : selected
      ? t.colors.primaryDark
      : 'transparent';

  const labelColor = selected ? t.colors.surface : t.colors.text;
  const entering = reduceMotion
    ? FadeInDown.duration(180)
        .delay(Math.min(entranceDelay, 80))
        .withInitialValues({ transform: [{ translateY: 0 }] })
    : FadeInDown.duration(280).delay(entranceDelay);

  return (
    <Animated.View
      entering={entering}
      style={styles.stretch}
    >
      <Animated.View style={animatedStyle}>
        <Pressable
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          onPress={onPress}
          style={[
            styles.button,
            {
              backgroundColor: buttonBackground,
              borderColor: buttonBorder,
            },
            selected && styles.buttonSelected,
          ]}
          accessibilityRole="button"
          accessibilityLabel={label}
          accessibilityState={{ selected }}
        >
          <Text style={[styles.label, { color: labelColor }]}>
            {label}
          </Text>
          {showChevron && (
            <Animated.View style={chevronStyle}>
              <Text style={[styles.chevron, { color: labelColor }]}>
                {'\u203A'}
              </Text>
            </Animated.View>
          )}
        </Pressable>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  stretch: {
    width: '100%',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.card,
    paddingVertical: 16,
    paddingHorizontal: 24,
    minHeight: 60,
    borderWidth: 2,
  },
  buttonSelected: {
    ...shadows.card,
  },
  label: {
    fontSize: typography.body,
    fontWeight: '600',
    textAlign: 'center',
  },
  chevron: {
    fontSize: 28,
    fontWeight: '300',
    marginLeft: 8,
  },
});
