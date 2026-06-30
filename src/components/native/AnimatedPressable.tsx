/**
 * AnimatedPressable — spring scale + opacity press feedback with haptics.
 *
 * Use for list rows, cards, and any tappable surface that is not already
 * wrapped by PrimaryButton / SelectableCard / PressableTabButton.
 */

import React, { useCallback } from 'react';
import {
  Pressable,
  PressableProps,
  StyleProp,
  ViewStyle,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { animation } from '../../theme/tokens';
import { springPop, timingFast } from '../../theme/motion';
import { useReduceMotion } from '../../hooks/useReduceMotion';
import { hapticSelection } from '../../utils/haptics';

export interface AnimatedPressableProps extends Omit<PressableProps, 'style'> {
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  /** Scale factor while pressed (default 0.985). */
  pressScale?: number;
  /** Fire selection haptic on press (default true). */
  haptic?: boolean;
  children: React.ReactNode;
}

export function AnimatedPressable({
  style,
  contentStyle,
  pressScale = animation.scalePressSm,
  haptic = true,
  disabled,
  onPressIn,
  onPressOut,
  onPress,
  children,
  ...rest
}: AnimatedPressableProps) {
  const reduceMotion = useReduceMotion();
  const pressed = useSharedValue(0);
  const opacity = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => {
    const scale = reduceMotion
      ? 1
      : 1 - pressed.value * (1 - pressScale);
    return {
      transform: [{ scale }],
      opacity: opacity.value,
    };
  });

  const handlePressIn = useCallback(
    (e: Parameters<NonNullable<PressableProps['onPressIn']>>[0]) => {
      if (reduceMotion) {
        opacity.value = withTiming(0.85, timingFast());
      } else {
        pressed.value = withTiming(1, timingFast());
      }
      onPressIn?.(e);
    },
    [onPressIn, opacity, pressed, reduceMotion],
  );

  const handlePressOut = useCallback(
    (e: Parameters<NonNullable<PressableProps['onPressOut']>>[0]) => {
      if (reduceMotion) {
        opacity.value = withTiming(1, { ...timingFast(), duration: animation.durRelease });
      } else {
        pressed.value = withSpring(0, springPop);
      }
      onPressOut?.(e);
    },
    [onPressOut, opacity, pressed, reduceMotion],
  );

  const handlePress = useCallback(
    (e: Parameters<NonNullable<PressableProps['onPress']>>[0]) => {
      if (disabled) return;
      if (haptic) hapticSelection();
      onPress?.(e);
    },
    [disabled, haptic, onPress],
  );

  return (
    <Pressable
      disabled={disabled}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      style={[styles.hitTarget, style]}
      {...rest}
    >
      <Animated.View style={[contentStyle, animatedStyle]}>{children}</Animated.View>
    </Pressable>
  );
}

const styles = {
  hitTarget: {
    minHeight: 44,
    minWidth: 44,
  } satisfies ViewStyle,
};
