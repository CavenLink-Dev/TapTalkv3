import React, { useEffect } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  FadeInDown,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { colors, radii, shadows, typography } from '../../theme/tokens';

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
  ageRange,
  selected,
  onPress,
  entranceDelay = 0,
  blocked = false,
  showChevron = true,
}: AnimatedAgeButtonProps) {
  const scale = useSharedValue(1);
  const chevronRotation = useSharedValue(selected ? 1 : 0);

  useEffect(() => {
    chevronRotation.value = withTiming(selected ? 1 : 0, { duration: 200 });
  }, [selected, chevronRotation]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${chevronRotation.value * 90}deg` }],
  }));

  const handlePressIn = () => {
    scale.value = withTiming(0.985, { duration: 100 });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
  };

  const handlePressOut = () => {
    scale.value = withTiming(1, { duration: 100 });
  };

  return (
    <Animated.View
      entering={FadeInDown.duration(280).delay(entranceDelay)}
      style={styles.stretch}
    >
      <Animated.View style={animatedStyle}>
        <Pressable
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          onPress={onPress}
          style={[
            styles.button,
            selected && !blocked && styles.buttonSelected,
            selected && blocked && styles.buttonBlocked,
          ]}
          accessibilityRole="button"
          accessibilityState={{ selected }}
        >
          <Text
            style={[
              styles.label,
              selected && !blocked && styles.labelSelected,
              selected && blocked && styles.labelBlocked,
            ]}
          >
            {label}
          </Text>
          {showChevron && (
            <Animated.View style={chevronStyle}>
              <Text
                style={[
                  styles.chevron,
                  selected && !blocked && styles.chevronSelected,
                  selected && blocked && styles.chevronBlocked,
                ]}
              >
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
    backgroundColor: colors.softBlue,
    borderRadius: radii.card,
    paddingVertical: 16,
    paddingHorizontal: 24,
    minHeight: 60,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  buttonSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primaryDark,
    ...shadows.card,
  },
  buttonBlocked: {
    backgroundColor: colors.danger,
    borderColor: colors.danger,
    ...shadows.card,
  },
  label: {
    fontSize: typography.body,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
  },
  labelSelected: {
    color: colors.surface,
  },
  labelBlocked: {
    color: colors.surface,
  },
  chevron: {
    fontSize: 28,
    fontWeight: '300',
    color: colors.text,
    marginLeft: 8,
  },
  chevronSelected: {
    color: colors.surface,
  },
  chevronBlocked: {
    color: colors.surface,
  },
});
