import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { animation, colors, radii } from '../../theme/tokens';
import { timingFill } from '../../theme/motion';
import { useReduceMotion } from '../../hooks/useReduceMotion';

interface SegmentedProgressBarProps {
  /** 1-based index of the step the user is currently on. */
  currentStep: number;
  /** Total number of steps in the flow. */
  totalSteps: number;
}

interface SegmentProps {
  index: number;
  filled: boolean;
  reduceMotion: boolean;
  complete: boolean;
}

function Segment({ index, filled, reduceMotion, complete }: SegmentProps) {
  const progress = useSharedValue(filled ? 1 : 0);
  const done = useSharedValue(complete ? 1 : 0);

  useEffect(() => {
    const target = filled ? 1 : 0;
    if (reduceMotion) {
      progress.value = target;
      return;
    }
    progress.value = withDelay(filled ? index * animation.stagSeg : 0, withTiming(target, timingFill()));
  }, [filled, index, progress, reduceMotion]);

  useEffect(() => {
    done.value = withTiming(complete ? 1 : 0, { duration: 220 });
  }, [complete, done]);

  const fillStyle = useAnimatedStyle(() => {
    const fill = interpolateColor(done.value, [0, 1], [colors.progressFill, colors.success]);
    return { width: `${progress.value * 100}%`, backgroundColor: fill };
  });

  return (
    <View style={styles.segment}>
      <Animated.View style={[styles.fill, fillStyle]} />
    </View>
  );
}

/**
 * Segmented pill progress bar.
 *
 * Motion (from the design handoff):
 *   • Advance   · each segment fills left → right over 360ms easeStandard,
 *                 with a 45ms catch-up stagger when multiple segments are
 *                 filled at once.
 *   • Complete  · all-segments cross-fade primary → success over 220ms, then
 *                 a single celebration pulse scale 1 → 1.03 → 1 over 260ms.
 *
 * Reduce Motion: instant fill + color cross-fade, no pulse.
 */
export function SegmentedProgressBar({ currentStep, totalSteps }: SegmentedProgressBarProps) {
  const reduceMotion = useReduceMotion();
  const complete = currentStep >= totalSteps;
  const pulse = useSharedValue(1);

  useEffect(() => {
    if (!complete) return;
    if (reduceMotion) return;
    pulse.value = withDelay(
      220,
      withSequence(
        withTiming(animation.scalePulse, { duration: 130 }),
        withTiming(1, { duration: 130 }),
      ),
    );
  }, [complete, pulse, reduceMotion]);

  const rowStyle = useAnimatedStyle(() => ({ transform: [{ scale: pulse.value }] }));

  return (
    <Animated.View
      style={[styles.row, rowStyle]}
      accessibilityRole="progressbar"
      accessibilityLabel={`Step ${currentStep} of ${totalSteps}`}
      accessibilityValue={{ min: 0, max: totalSteps, now: currentStep }}
      accessibilityLiveRegion="polite"
    >
      {Array.from({ length: totalSteps }).map((_, i) => (
        <Segment
          key={i}
          index={i}
          filled={i < currentStep}
          reduceMotion={reduceMotion}
          complete={complete}
        />
      ))}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  row: {
    flex: 1,
    flexDirection: 'row',
    gap: 5,
    alignItems: 'center',
  },
  segment: {
    flex: 1,
    height: 7,
    borderRadius: radii.pill,
    backgroundColor: colors.progressTrack,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: radii.pill,
    backgroundColor: colors.progressFill,
  },
});
