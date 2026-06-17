import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  FadeInDown,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { colors, radii, shadows, typography } from '../../theme/tokens';

export type AgeRange = 'under-13' | '13-to-15' | '15-to-17' | '16-to-17' | '18-or-older';

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

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.97, { damping: 12, stiffness: 300 });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 12, stiffness: 300 });
  };

  return (
    <Animated.View
      entering={FadeInDown.duration(280).delay(entranceDelay)}
      style={animatedStyle}
    >
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
          <Text
            style={[
              styles.chevron,
              selected && !blocked && styles.chevronSelected,
              selected && blocked && styles.chevronBlocked,
            ]}
          >
            {'\u203A'}
          </Text>
        )}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
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
    transform: [{ translateY: -1 }],
  },
  buttonBlocked: {
    backgroundColor: colors.danger,
    borderColor: '#CC0000',
    ...shadows.card,
    transform: [{ translateY: -1 }],
  },
  label: {
    fontSize: typography.body,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
  },
  labelSelected: {
    color: '#FFFFFF',
  },
  labelBlocked: {
    color: '#FFFFFF',
  },
  chevron: {
    fontSize: 28,
    fontWeight: '300',
    color: colors.text,
    marginLeft: 8,
  },
  chevronSelected: {
    color: '#FFFFFF',
  },
  chevronBlocked: {
    color: '#FFFFFF',
  },
});
