import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { colors } from '../../theme/tokens';

interface TwoSegmentProgressBarProps {
  /**
   * Fractional fill for segment 1 (0 to 1).
   * Segment 1 = privacy, data, and security steps.
   */
  segment1: number;
  /**
   * Fractional fill for segment 2 (0 to 1).
   * Segment 2 = personalisation and customisation steps.
   */
  segment2: number;
}

/**
 * Two-segment progress bar matching the PNG design.
 * Each segment animates smoothly with a spring when progress changes.
 */
export function TwoSegmentProgressBar({ segment1, segment2 }: TwoSegmentProgressBarProps) {
  const segment1Width = useSharedValue(Math.min(1, Math.max(0, segment1)));
  const segment2Width = useSharedValue(Math.min(1, Math.max(0, segment2)));

  useEffect(() => {
    segment1Width.value = withTiming(Math.min(1, Math.max(0, segment1)), { duration: 300 });
  }, [segment1, segment1Width]);

  useEffect(() => {
    segment2Width.value = withTiming(Math.min(1, Math.max(0, segment2)), { duration: 300 });
  }, [segment2, segment2Width]);

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
    height: 12,
  },
  segment: {
    flex: 1,
    backgroundColor: colors.softBlue,
    borderRadius: 10,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 10,
  },
});
