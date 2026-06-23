import React, { useEffect } from 'react';
import { AccessibilityInfo, StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { colors, radii } from '../../theme/tokens';

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
}

function Segment({ index, filled, reduceMotion }: SegmentProps) {
  const progress = useSharedValue(filled ? 1 : 0);

  useEffect(() => {
    const target = filled ? 1 : 0;
    if (reduceMotion) {
      progress.value = target;
      return;
    }
    // Stagger the fill so completed segments "catch up" with a gentle wave.
    progress.value = withDelay(filled ? index * 45 : 0, withTiming(target, { duration: 360 }));
  }, [filled, index, progress, reduceMotion]);

  const fillStyle = useAnimatedStyle(() => ({ width: `${progress.value * 100}%` }));

  return (
    <View style={styles.segment}>
      <Animated.View style={[styles.fill, fillStyle]} />
    </View>
  );
}

/**
 * Segmented pill progress bar — one rounded segment per step. Each segment
 * fills left-to-right in sequence as the user advances, so the bar visibly
 * grows toward full. Honors Reduce Motion.
 */
export function SegmentedProgressBar({ currentStep, totalSteps }: SegmentedProgressBarProps) {
  const [reduceMotion, setReduceMotion] = React.useState(false);

  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((enabled) => mounted && setReduceMotion(enabled))
      .catch(() => undefined);
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => {
      mounted = false;
      sub.remove();
    };
  }, []);

  return (
    <View
      style={styles.row}
      accessibilityRole="progressbar"
      accessibilityLabel={`Step ${currentStep} of ${totalSteps}`}
      accessibilityValue={{ min: 0, max: totalSteps, now: currentStep }}
    >
      {Array.from({ length: totalSteps }).map((_, i) => (
        <Segment key={i} index={i} filled={i < currentStep} reduceMotion={reduceMotion} />
      ))}
    </View>
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
