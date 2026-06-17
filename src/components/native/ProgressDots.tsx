import React from 'react';
import { StyleSheet, View } from 'react-native';
import { colors } from '../../theme/tokens';

interface ProgressDotsProps {
  current: number;
  total: number;
}

export function ProgressDots({ current, total }: ProgressDotsProps) {
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={`Onboarding progress ${current} of ${total}`}
      style={styles.track}
    >
      {Array.from({ length: total }, (_, index) => {
        const active = index < current;
        return <View key={index} style={[styles.dot, active && styles.active]} />;
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  active: {
    backgroundColor: colors.primary,
    width: 26,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.softBlue,
  },
  track: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
});
