import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { colors, radii } from '../../theme/tokens';

// Phase 1 (parent setup) spans steps 1-6, Phase 2 (child customisation) spans 7-8.
const PHASE_1_STEPS = 6;
const PHASE_2_STEPS = 2;

function clamp(value: number) {
  return Math.max(0, Math.min(1, value));
}

interface ProgressBarProps {
  currentStep: number;
}

function LiquidPill({ fraction }: { fraction: number }) {
  const fill = useRef(new Animated.Value(fraction)).current;

  useEffect(() => {
    Animated.spring(fill, {
      toValue: fraction,
      useNativeDriver: false,
      tension: 45,
      friction: 11,
    }).start();
  }, [fraction, fill]);

  const width = fill.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.pillTrack}>
      <Animated.View style={[styles.pillFill, { width }]} />
    </View>
  );
}

export function ProgressBar({ currentStep }: ProgressBarProps) {
  const fraction1 = clamp(currentStep / PHASE_1_STEPS);
  const fraction2 = clamp((currentStep - PHASE_1_STEPS) / PHASE_2_STEPS);

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={`Onboarding progress, step ${currentStep}`}
      style={styles.track}
    >
      <LiquidPill fraction={fraction1} />
      <LiquidPill fraction={fraction2} />
    </View>
  );
}

const styles = StyleSheet.create({
  pillFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: radii.pill,
  },
  pillTrack: {
    flex: 1,
    height: 16,
    borderRadius: radii.pill,
    overflow: 'hidden',
    backgroundColor: colors.softBlue,
  },
  track: {
    flex: 1,
    flexDirection: 'row',
    gap: 10,
    // Give breathing room between the side icon buttons and the pills.
    marginHorizontal: 10,
  },
});
