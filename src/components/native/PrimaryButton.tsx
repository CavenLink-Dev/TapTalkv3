import React, { useEffect } from 'react';
import { Pressable, StyleSheet, View, ViewStyle } from 'react-native';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { LoadingDots } from '../LoadingDots';
import { animation, radii, typography } from '../../theme/tokens';
import type { ColorTokens } from '../../theme/tokens';
import { springPop, timingFast, timingReduced } from '../../theme/motion';
import { useReduceMotion } from '../../hooks/useReduceMotion';
import { useTheme } from '../../theme/useTheme';
import { hapticSelection, hapticSuccess } from '../../utils/haptics';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost';

interface PrimaryButtonProps {
  label: string;
  onPress: () => void;
  accessibilityLabel: string;
  disabled?: boolean;
  /** Inline loading dots; taps are locked while true. */
  loading?: boolean;
  /** One-shot success flash — fill crossfades to success, check springs in. */
  success?: boolean;
  variant?: Variant;
  style?: ViewStyle;
}

type Palette = {
  base: string;
  pressed: string;
  label: string;
  border: string | null;
};

function makePalettes(colors: ColorTokens): Record<Variant, Palette> {
  return {
    primary:   { base: colors.primary,  pressed: colors.primaryPressed, label: colors.surface,     border: null          },
    secondary: { base: colors.softBlue, pressed: colors.progressTrack,  label: colors.primaryDark, border: null          },
    danger:    { base: colors.danger,   pressed: '#FF6A66',             label: colors.surface,     border: null          },
    ghost:     { base: 'rgba(0,0,0,0)', pressed: colors.input,          label: colors.text,        border: colors.border },
  };
}

/**
 * The single dominant action per screen. Bottom-docked, full-width by default.
 *
 * Motion (from the design handoff):
 *   • Press in  · scale 1 → 0.97 over 120ms easeStandard, fill crossfades to
 *                 the variant's pressed tone, brand-tinted "pop" shadow rises in.
 *   • Release   · scale 0.97 → 1 via springPop (the same spring used by checks
 *                 and pulses, so everything in the UI shares a feel) — fill and
 *                 shadow ease back.
 *   • Loading   · inline LoadingDots (onPrimary), taps locked.
 *   • Success   · fill cross-fades to `success`, check icon springs in with a
 *                 short Success haptic, then settles back to default fill.
 *
 * Reduce Motion: no scale, no shadow change — opacity dip 1 → 0.85 → 1 instead.
 */
export function PrimaryButton({
  label,
  onPress,
  accessibilityLabel,
  disabled = false,
  loading = false,
  success = false,
  variant = 'primary',
  style,
}: PrimaryButtonProps) {
  const reduceMotion = useReduceMotion();
  const t = useTheme();
  const palettes = makePalettes(t.colors);
  const palette = palettes[variant];

  const pressed  = useSharedValue(0);   // 0 → 1 while finger is down
  const successV = useSharedValue(0);   // 0 → 1 during success flash
  const opacity  = useSharedValue(1);   // reduce-motion press feedback

  const isLocked = disabled || loading;
  const baseFill = disabled ? t.colors.disabled : palette.base;

  useEffect(() => {
    if (!success) return;
    hapticSuccess();
    if (reduceMotion) {
      successV.value = withSequence(
        withTiming(1, timingReduced()),
        withTiming(0, { ...timingReduced(), duration: 600 }),
      );
      return;
    }
    successV.value = withSequence(
      withTiming(1, { duration: 220 }),
      withTiming(1, { duration: 460 }),
      withTiming(0, { duration: 320 }),
    );
  }, [success, reduceMotion, successV]);

  // Design rule: flat fills only. No press glow, no brand shadow — pressed
  // state reads via fill cross-fade + a small scale dip, nothing else.
  const containerStyle = useAnimatedStyle(() => {
    const pressedFill = interpolateColor(pressed.value, [0, 1], [baseFill, palette.pressed]);
    const finalFill   = interpolateColor(successV.value, [0, 1], [pressedFill, t.colors.success]);
    const scale       = reduceMotion ? 1 : 1 - pressed.value * (1 - animation.scalePressLg);
    return {
      backgroundColor: finalFill,
      transform: [{ scale }],
      opacity: opacity.value,
    };
  });

  const checkStyle = useAnimatedStyle(() => ({
    opacity: successV.value,
    transform: [{ scale: successV.value }],
  }));

  const labelStyle = useAnimatedStyle(() => ({
    opacity: 1 - successV.value * 0.6,
  }));

  const handlePressIn = () => {
    if (isLocked) return;
    if (reduceMotion) {
      opacity.value = withTiming(0.85, timingFast());
      return;
    }
    pressed.value = withTiming(1, timingFast());
  };

  const handlePressOut = () => {
    if (reduceMotion) {
      opacity.value = withTiming(1, { ...timingFast(), duration: animation.durRelease });
      return;
    }
    pressed.value = withSpring(0, springPop);
  };

  const handlePress = () => {
    if (isLocked) return;
    hapticSelection();
    onPress();
  };

  return (
    <Animated.View style={[styles.container, containerStyle, style]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityState={{ disabled: isLocked, busy: loading }}
        disabled={isLocked}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
        style={[
          styles.button,
          { minHeight: t.buttonMinHeight },
          palette.border ? { borderWidth: 1.5, borderColor: palette.border } : null,
        ]}
      >
        {loading ? (
          <LoadingDots variant="onPrimary" color={palette.label} />
        ) : (
          <View style={styles.inner}>
            <Animated.View style={[styles.check, checkStyle]} pointerEvents="none">
              <Ionicons name="checkmark" size={22} color={t.colors.surface} />
            </Animated.View>
            <Animated.Text
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.85}
              style={[
                styles.label,
                { color: disabled ? t.colors.textTertiary : palette.label, fontSize: t.typography.body },
                labelStyle,
              ]}
            >
              {label}
            </Animated.Text>
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: radii.button,
  },
  button: {
    minHeight: 54, // overridden inline via t.buttonMinHeight
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.button,
    paddingHorizontal: 18,
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  label: {
    fontFamily: typography.fontFamilyDisplay,
    fontSize: typography.body,
    fontWeight: typography.weightButton,
    letterSpacing: typography.trackButton,
  },
  check: {
    position: 'absolute',
    left: -28,
  },
});
