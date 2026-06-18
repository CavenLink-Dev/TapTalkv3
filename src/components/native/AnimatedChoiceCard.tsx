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
            <Animated.View style={chevronStyle}>
              <Text style={[styles.chevron, selected && styles.chevronSelected]}>{'\u203A'}</Text>
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
  chevron: {
    fontSize: 28,
    fontWeight: '300',
    color: colors.text,
    marginLeft: 8,
  },
  chevronSelected: {
    color: colors.surface,
  },
});
