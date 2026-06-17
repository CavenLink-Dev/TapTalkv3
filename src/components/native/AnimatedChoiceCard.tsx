import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  FadeInDown,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { colors, radii, shadows, typography } from '../../theme/tokens';

interface AnimatedChoiceCardProps {
  label: string;
  selected: boolean;
  onPress: () => void;
  /**
   * Delay for the entrance animation (used for staggering)
   */
  entranceDelay?: number;
  /**
   * Show chevron on the right side
   */
  showChevron?: boolean;
}

/**
 * Animated choice card with iOS-native press feedback.
 * Scales down to 0.97 with a spring on press, and haptic feedback.
 * When selected, shows blue border and slight lift with shadow.
 */
export function AnimatedChoiceCard({
  label,
  selected,
  onPress,
  entranceDelay = 0,
  showChevron = false,
}: AnimatedChoiceCardProps) {
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
          styles.card,
          selected && styles.cardSelected,
        ]}
        accessibilityRole="button"
        accessibilityState={{ selected }}
      >
        <Text style={[styles.label, selected && styles.labelSelected]}>
          {label}
        </Text>
        {showChevron && (
          <Text style={styles.chevron}>{'\u203A'}</Text>
        )}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
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
  cardSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primaryDark,
    ...shadows.card,
    // Slight lift effect
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
  chevron: {
    fontSize: 28,
    fontWeight: '300',
    color: colors.text,
    marginLeft: 8,
  },
});
