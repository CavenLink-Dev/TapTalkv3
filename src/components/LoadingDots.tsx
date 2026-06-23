import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { colors } from '../theme/tokens';
import { useReduceMotion } from '../hooks/useReduceMotion';

type Variant = 'standalone' | 'onPrimary' | 'inline';

interface LoadingDotsProps {
  variant?: Variant;
  size?: number;
  color?: string;
  accessibilityLabel?: string;
}

/**
 * Indeterminate loading. Three dots stagger 0/220/440ms, opacity 0.3 → 1 → 0.3
 * with a mild scale 0.8 → 1.15 in parallel.
 *
 * Variants:
 *   • standalone — 12pt primary dots in a soft-blue capsule. Default.
 *   • onPrimary  — 8pt white dots, no capsule (used inside PrimaryButton).
 *   • inline     — 7pt dots in current text color, no capsule (text rows).
 *
 * Reduce Motion: collapses to a single dot pulsing opacity 0.5 → 1 → 0.5 at
 * 0.6 Hz (no stagger, no scale).
 */
export function LoadingDots({
  variant = 'standalone',
  size,
  color,
  accessibilityLabel = 'Loading',
}: LoadingDotsProps) {
  const reduceMotion = useReduceMotion();

  const dotSize = size ?? defaultSize(variant);
  const dotColor = color ?? defaultColor(variant);

  // ── Reduce Motion: single dot, gentle breathing ────────────────────────────
  const single = useRef(new Animated.Value(0.5)).current;
  useEffect(() => {
    if (!reduceMotion) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(single, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(single, { toValue: 0.5, duration: 800, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [reduceMotion, single]);

  // ── Default: 3 dots, staggered pulse ───────────────────────────────────────
  const dot1 = useRef(new Animated.Value(0.3)).current;
  const dot2 = useRef(new Animated.Value(0.3)).current;
  const dot3 = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    if (reduceMotion) return;
    const pulse = (anim: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, { toValue: 1,   duration: 400, useNativeDriver: true }),
          Animated.timing(anim, { toValue: 0.3, duration: 400, useNativeDriver: true }),
          Animated.delay(800 - delay),
        ]),
      );

    const a1 = pulse(dot1, 0);
    const a2 = pulse(dot2, 220);
    const a3 = pulse(dot3, 440);
    a1.start();
    a2.start();
    a3.start();
    return () => {
      a1.stop();
      a2.stop();
      a3.stop();
    };
  }, [reduceMotion, dot1, dot2, dot3]);

  const wrapStyle = capsule(variant, dotSize);
  const gap = dotSize * 0.66;

  if (reduceMotion) {
    return (
      <View
        accessibilityRole="progressbar"
        accessibilityState={{ busy: true }}
        accessibilityLabel={accessibilityLabel}
        style={wrapStyle}
      >
        <Animated.View
          style={{
            width: dotSize,
            height: dotSize,
            borderRadius: dotSize / 2,
            backgroundColor: dotColor,
            opacity: single,
          }}
        />
      </View>
    );
  }

  const dotStyle = (anim: Animated.Value) => ({
    width: dotSize,
    height: dotSize,
    borderRadius: dotSize / 2,
    backgroundColor: dotColor,
    opacity: anim,
    transform: [{ scale: anim.interpolate({ inputRange: [0.3, 1], outputRange: [0.8, 1.15] }) }],
  });

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityState={{ busy: true }}
      accessibilityLabel={accessibilityLabel}
      style={wrapStyle}
    >
      <Animated.View style={dotStyle(dot1)} />
      <Animated.View style={[dotStyle(dot2), { marginHorizontal: gap }]} />
      <Animated.View style={dotStyle(dot3)} />
    </View>
  );
}

function defaultSize(variant: Variant): number {
  switch (variant) {
    case 'onPrimary': return 8;
    case 'inline':    return 7;
    default:          return 12;
  }
}

function defaultColor(variant: Variant): string {
  switch (variant) {
    case 'onPrimary': return colors.surface;
    case 'inline':    return colors.textMuted;
    default:          return colors.primary;
  }
}

function capsule(variant: Variant, dotSize: number) {
  if (variant === 'standalone') {
    return [
      styles.row,
      {
        backgroundColor: colors.softBlue,
        borderRadius: (dotSize + 16) / 2,
        paddingHorizontal: dotSize + 2,
        paddingVertical: 8,
      },
    ];
  }
  return styles.row;
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
