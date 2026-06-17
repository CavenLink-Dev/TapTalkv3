import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { colors } from '../../theme/tokens';

interface TwoSegmentProgressBarProps {
  /**
   * Current progress (0-2):
   * - 0: no segments filled
   * - 1: first segment filled
   * - 2: both segments filled
   */
  progress: number;
  /**
   * Duration in ms for the fill animation (default: 300)
   */
  duration?: number;
}

/**
 * Two-segment progress bar matching the PNG design.
 * Each segment animates smoothly with a spring when progress changes.
 */
export function TwoSegmentProgressBar({ progress, duration = 300 }: TwoSegmentProgressBarProps) {
  const segment1Width = useSharedValue(0);
  const segment2Width = useSharedValue(0);

  useEffect(() => {
    // Segment 1 fills when progress >= 1
    segment1Width.value = withSpring(progress >= 1 ? 1 : 0, {
      damping: 14,
      stiffness: 110,
    });

    // Segment 2 fills when progress >= 2
    segment2Width.value = withSpring(progress >= 2 ? 1 : 0, {
      damping: 14,
      stiffness: 110,
    });
  }, [progress, segment1Width, segment2Width]);

  const segment1Style = useAnimatedStyle(() => ({
    width: `${segment1Width.value * 100}%`,
  }));

  const segment2Style = useAnimatedStyle(() => ({
    width: `${segment2Width.value * 100}%`,
  }));

  return (
    <View style={styles.container} accessible={false}>
      <View style={styles.segment}>
        <Animated.View style={[styles.fill, segment1Style]} />
      </View>
      <View style={styles.segment}>
        <Animated.View style={[styles.fill, segment2Style]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 8,
    width: '100%',
    maxWidth: 320,
    height: 6,
  },
  segment: {
    flex: 1,
    backgroundColor: colors.border,
    borderRadius: 3,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 3,
  },
});
