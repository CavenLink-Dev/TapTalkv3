import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { colors } from '../theme/tokens';

interface LoadingDotsProps {
  size?: number;
  color?: string;
}

export function LoadingDots({ size = 14, color = colors.primary }: LoadingDotsProps) {
  const dot1 = useRef(new Animated.Value(0.3)).current;
  const dot2 = useRef(new Animated.Value(0.3)).current;
  const dot3 = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const pulse = (anim: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, { toValue: 1, duration: 400, useNativeDriver: true }),
          Animated.timing(anim, { toValue: 0.3, duration: 400, useNativeDriver: true }),
          Animated.delay(800),
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
  }, [dot1, dot2, dot3]);

  const dotStyle = (anim: Animated.Value) => ({
    width: size,
    height: size,
    borderRadius: size / 2,
    backgroundColor: color,
    opacity: anim,
    transform: [{ scale: anim.interpolate({ inputRange: [0.3, 1], outputRange: [0.8, 1.15] }) }],
  });

  return (
    <View style={[styles.container, { backgroundColor: colors.softBlue, borderRadius: (size + 16) / 2, paddingHorizontal: size + 2, paddingVertical: 8 }]}>
      <Animated.View style={dotStyle(dot1)} />
      <Animated.View style={[dotStyle(dot2), styles.middle]} />
      <Animated.View style={dotStyle(dot3)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  middle: {
    marginHorizontal: 8,
  },
});
