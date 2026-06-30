import React, { useEffect } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  FadeInDown,
} from 'react-native-reanimated';
import { radii, typography } from '../../theme/tokens';
import { springPop, timingFast } from '../../theme/motion';
import { useReduceMotion } from '../../hooks/useReduceMotion';
import { useTheme } from '../../theme/useTheme';
import { hapticSelection } from '../../utils/haptics';
import { ThemedText } from './ThemedText';

interface AnimatedChoiceCardProps {
  label: string;
  selected: boolean;
  onPress: () => void;
  accessibilityLabel?: string;
  entranceDelay?: number;
  showChevron?: boolean;
}

export function AnimatedChoiceCard({
  label,
  selected,
  onPress,
  accessibilityLabel,
  entranceDelay = 0,
  showChevron = false,
}: AnimatedChoiceCardProps) {
  const t = useTheme();
  const reduceMotion = useReduceMotion();
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  const chevronRotation = useSharedValue(selected ? 1 : 0);

  useEffect(() => {
    chevronRotation.value = withTiming(selected ? 1 : 0, { duration: 200 });
  }, [selected, chevronRotation]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${chevronRotation.value * 90}deg` }],
  }));

  const handlePressIn = () => {
    if (reduceMotion) {
      opacity.value = withTiming(0.85, timingFast());
      return;
    }
    scale.value = withTiming(0.985, timingFast());
  };

  const handlePressOut = () => {
    if (reduceMotion) {
      opacity.value = withTiming(1, timingFast());
      return;
    }
    scale.value = withSpring(1, springPop);
  };

  const handlePress = () => {
    hapticSelection();
    onPress();
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
          onPress={handlePress}
          style={({ pressed }) => [
            styles.card,
            {
              backgroundColor: pressed ? t.colors.primaryPressed : t.colors.primary,
            },
            selected && styles.cardSelected,
          ]}
          accessibilityRole="button"
          accessibilityLabel={accessibilityLabel ?? label}
          accessibilityState={{ selected }}
        >
          <ThemedText variant="body" color={t.colors.surface} style={styles.label}>
            {label}
          </ThemedText>
          {showChevron && (
            <Animated.View style={chevronStyle}>
              <ThemedText variant="heading" color={t.colors.surface} style={styles.chevron}>
                {'\u203A'}
              </ThemedText>
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
    borderRadius: radii.card,
    paddingVertical: 16,
    paddingHorizontal: 24,
    minHeight: 60,
  },
  cardSelected: {},
  label: {
    fontWeight: typography.weightSubhead,
    textAlign: 'center',
  },
  chevron: {
    marginLeft: 8,
    fontWeight: '300',
  },
});
