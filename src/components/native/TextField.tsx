import React, { useEffect, useRef, useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
} from 'react-native';

type FocusHandler = NonNullable<TextInputProps['onFocus']>;
type BlurHandler  = NonNullable<TextInputProps['onBlur']>;
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { animation, colors, radii, spacing, typography } from '../../theme/tokens';
import { springPop, timingFocus } from '../../theme/motion';
import { useReduceMotion } from '../../hooks/useReduceMotion';
import { hapticError } from '../../utils/haptics';

export interface TextFieldProps extends TextInputProps {
  accessibilityLabel: string;
  /** Error string toggles a shake + red border + helper text. */
  error?: string | null;
  /** Renders a green check icon and a green border. */
  success?: boolean;
  /** Optional helper / hint below the field. */
  helper?: string;
}

/**
 * Adult-tone text input with proper motion.
 *
 * Motion (from the design handoff):
 *   • Focus    · borderWidth 1.5 → 2 + border color cross-fades 200ms; brand
 *                shadow fades in over 260ms.
 *   • Error    · border snaps red, container shakes ±6px horizontally over
 *                3 cycles in 400ms, error haptic fires.
 *   • Success  · border cross-fades green, check springs 0 → 1.
 *
 * Reduce Motion: no shake, no scale; states still cross-fade colors over 200ms.
 */
export const TextField = React.forwardRef<TextInput, TextFieldProps>(function TextField(
  {
    accessibilityLabel,
    error,
    success,
    helper,
    onFocus,
    onBlur,
    style,
    ...rest
  },
  ref,
) {
  const reduceMotion = useReduceMotion();
  const [focused, setFocused] = useState(false);

  const focus   = useSharedValue(0);   // 0 → 1 focused
  const errorV  = useSharedValue(0);   // 0 → 1 error
  const successV = useSharedValue(0);  // 0 → 1 success
  const shakeX  = useSharedValue(0);   // ±6 px

  // Drive focus -> width/color
  useEffect(() => {
    focus.value = withTiming(focused ? 1 : 0, timingFocus());
  }, [focused, focus]);

  // Drive error: crossfade red + shake
  const lastError = useRef<string | null | undefined>(null);
  useEffect(() => {
    const hasError = !!error;
    errorV.value = withTiming(hasError ? 1 : 0, timingFocus());
    if (hasError && lastError.current !== error) {
      hapticError();
      if (!reduceMotion) {
        const amp = animation.shakeAmp;
        // 3 cycles ≈ 400ms total. Each step ~ 66ms.
        shakeX.value = withSequence(
          withTiming(-amp, { duration: 60 }),
          withTiming( amp, { duration: 70 }),
          withTiming(-amp * 0.66, { duration: 70 }),
          withTiming( amp * 0.5,  { duration: 70 }),
          withTiming(-amp * 0.25, { duration: 70 }),
          withTiming(0, { duration: 60 }),
        );
      }
    }
    lastError.current = error;
  }, [error, errorV, shakeX, reduceMotion]);

  // Drive success
  useEffect(() => {
    if (reduceMotion) {
      successV.value = withTiming(success ? 1 : 0, { duration: animation.durReduced });
      return;
    }
    successV.value = success ? withSpring(1, springPop) : withTiming(0, timingFocus());
  }, [success, successV, reduceMotion]);

  const containerStyle = useAnimatedStyle(() => {
    const baseBorder = interpolateColor(focus.value, [0, 1], [colors.borderBlue, colors.primary]);
    const errBorder  = interpolateColor(errorV.value,   [0, 1], [baseBorder, colors.danger]);
    const finalBorder = interpolateColor(successV.value, [0, 1], [errBorder, colors.success]);
    const borderWidth = 1.5 + focus.value * 0.5;
    const shadowOpacity = reduceMotion ? 0 : 0.16 * focus.value;
    return {
      borderColor: finalBorder,
      borderWidth,
      transform: [{ translateX: shakeX.value }],
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity,
      shadowRadius: 14,
    };
  });

  const checkStyle = useAnimatedStyle(() => ({
    opacity: successV.value,
    transform: [{ scale: successV.value }],
  }));

  const handleFocus: FocusHandler = (e) => {
    setFocused(true);
    onFocus?.(e as Parameters<FocusHandler>[0]);
  };
  const handleBlur: BlurHandler = (e) => {
    setFocused(false);
    onBlur?.(e as Parameters<BlurHandler>[0]);
  };

  return (
    <View style={styles.wrap}>
      <Animated.View style={[styles.container, containerStyle]}>
        <TextInput
          ref={ref}
          accessibilityLabel={accessibilityLabel}
          placeholderTextColor={colors.textTertiary}
          onFocus={handleFocus}
          onBlur={handleBlur}
          {...rest}
          style={[styles.input, style]}
        />
        {success ? (
          <Animated.View style={[styles.checkSlot, checkStyle]} pointerEvents="none">
            <Ionicons name="checkmark-circle" size={22} color={colors.success} />
          </Animated.View>
        ) : null}
      </Animated.View>
      {error ? (
        <Text style={styles.errorText} accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : helper ? (
        <Text style={styles.helperText}>{helper}</Text>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 48,
    borderRadius: radii.input,
    backgroundColor: colors.input,
  },
  input: {
    flex: 1,
    color: colors.text,
    fontSize: typography.body,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  checkSlot: {
    paddingHorizontal: 12,
  },
  errorText: {
    marginTop: spacing.xs + 2,
    marginLeft: spacing.sm,
    color: colors.danger,
    fontSize: typography.callout,
    fontWeight: typography.weightCaption,
  },
  helperText: {
    marginTop: spacing.xs + 2,
    marginLeft: spacing.sm,
    color: colors.textTertiary,
    fontSize: typography.callout,
  },
});
