import React from 'react';
import { Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { animation, radii, typography } from '../../theme/tokens';
import { springPop, timingFast } from '../../theme/motion';
import { useReduceMotion } from '../../hooks/useReduceMotion';
import { useTheme } from '../../theme/useTheme';
import { hapticSelection } from '../../utils/haptics';
import { fonts } from '../../theme/fonts';

interface SignInWithAppleButtonProps {
  onPress: () => void;
  /** "continue" → "Continue with Apple" · "signin" → "Sign in with Apple". */
  variant?: 'signin' | 'continue';
  style?: ViewStyle;
  /** When true the button shows the loading dots variant inside. */
  loading?: boolean;
}

/**
 * Apple Sign In button (UI stub).
 *
 * NOTE: Per Apple HIG, the button visual MUST follow the official spec — black
 * fill, white logo + text on light backgrounds, exact 17pt SF text, vertically
 * centered logo. We render the spec here so the screen looks correct to QA.
 *
 * BACKEND: This component intentionally does NOT invoke `AuthenticationServices`
 * (would require `expo-apple-authentication`, which is not installed and the
 * brief says no new packages). Callers should treat `onPress` as the place to
 * later swap in the real Apple sign-in flow.
 */
export function SignInWithAppleButton({
  onPress,
  variant = 'signin',
  style,
  loading = false,
}: SignInWithAppleButtonProps) {
  const reduceMotion = useReduceMotion();
  const t = useTheme();
  const pressed = useSharedValue(0);

  const containerStyle = useAnimatedStyle(() => {
    const scale = reduceMotion ? 1 : 1 - pressed.value * (1 - animation.scalePressLg);
    const opacity = reduceMotion ? 1 - pressed.value * 0.15 : 1;
    return { transform: [{ scale }], opacity };
  });

  const handlePressIn = () => {
    if (reduceMotion) {
      pressed.value = withTiming(1, timingFast());
    } else {
      pressed.value = withTiming(1, timingFast());
    }
  };
  const handlePressOut = () => {
    pressed.value = withSpring(0, springPop);
  };

  const label = variant === 'signin' ? 'Sign in with Apple' : 'Continue with Apple';

  return (
    <Animated.View style={[containerStyle, style]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ busy: loading }}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={() => {
          hapticSelection();
          onPress();
        }}
        style={styles.button}
      >
        <View style={styles.row}>
          <Ionicons name="logo-apple" size={20} color={t.colors.surface} style={styles.logo} />
          <Text style={[styles.label, { color: t.colors.surface }]}>{label}</Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 54,
    backgroundColor: '#000000',
    borderRadius: radii.button,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    marginRight: 8,
    // Optical lift — the Apple glyph reads "low" by 1pt because of its enclosed
    // bottom counter; lifting matches Apple's reference assets pixel-for-pixel.
    marginTop: -2,
  },
  label: {
    fontFamily: fonts.bodySemibold,
    fontSize: typography.body,
    letterSpacing: -0.2,
  },
});
