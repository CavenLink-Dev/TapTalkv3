import React, { useEffect, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import { Href, useRouter } from 'expo-router';
import Animated_Re, { FadeIn } from 'react-native-reanimated';
import Svg, { Circle, Path } from 'react-native-svg';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useReduceMotion } from '../../src/hooks/useReduceMotion';
import { colors, spacing, typography } from '../../src/theme/tokens';
import { fonts } from '../../src/theme/fonts';
import { hapticSuccess } from '../../src/utils/haptics';

const nextRoute = '/registration/08-accessibility' as Href;

// Check path geometry — designed inside a 96×96 viewbox so we can use the
// path-length trick (offset → 0) to stroke-draw it on mount.
const CHECK_PATH = 'M28 50 L44 66 L70 36';
const CHECK_LENGTH = 80; // empirical — close enough that one full sweep "draws" it.
const AnimatedPath = Animated.createAnimatedComponent(Path);

export default function RegStep7Verified() {
  const router = useRouter();
  const reduceMotion = useReduceMotion();

  const [showContinue, setShowContinue] = useState(reduceMotion);
  const offset = React.useRef(new Animated.Value(reduceMotion ? 0 : CHECK_LENGTH)).current;

  useEffect(() => {
    hapticSuccess();

    if (reduceMotion) {
      // Snap state; navigate after a calm pause so the heading is readable.
      const t = setTimeout(() => router.replace(nextRoute), 1400);
      return () => clearTimeout(t);
    }

    // Stroke draw — 380ms per spec.
    Animated.timing(offset, {
      toValue: 0,
      duration: 380,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();

    // Continue link appears at 1s as a fallback for users who want to skip.
    const continueTimer = setTimeout(() => setShowContinue(true), 1000);
    // Auto-advance at 1.8s.
    const advanceTimer = setTimeout(() => router.replace(nextRoute), 1800);
    return () => {
      clearTimeout(continueTimer);
      clearTimeout(advanceTimer);
    };
  }, [reduceMotion, offset, router]);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.content}>
        <Animated_Re.View
          entering={FadeIn.duration(220)}
          style={styles.circleWrap}
          accessibilityElementsHidden
        >
          <Svg width={120} height={120} viewBox="0 0 96 96">
            <Circle cx={48} cy={48} r={46} fill={colors.success} />
            <AnimatedPath
              d={CHECK_PATH}
              stroke={colors.surface}
              strokeWidth={8}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
              strokeDasharray={CHECK_LENGTH}
              strokeDashoffset={offset}
            />
          </Svg>
        </Animated_Re.View>

        <Animated_Re.Text
          entering={FadeIn.duration(260).delay(120)}
          style={styles.title}
          accessibilityRole="header"
          accessibilityLiveRegion="polite"
        >
          Verified
        </Animated_Re.Text>
        <Animated_Re.Text
          entering={FadeIn.duration(260).delay(220)}
          style={styles.subtitle}
        >
          Your account is ready. Let's tune the experience for you next.
        </Animated_Re.Text>
      </View>

      {showContinue ? (
        <Animated_Re.View entering={FadeIn.duration(220)} style={styles.continueWrap}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Continue to accessibility setup"
            onPress={() => router.replace(nextRoute)}
            hitSlop={8}
            style={styles.continueBtn}
          >
            <Text style={styles.continueLabel}>Continue</Text>
          </Pressable>
        </Animated_Re.View>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    gap: spacing.lg,
  },
  circleWrap: {
    width: 120,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    fontFamily: fonts.displayHeavy,
    fontSize: typography.title,
    color: colors.text,
    letterSpacing: typography.trackTitle,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: fonts.body,
    fontSize: typography.body,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 320,
  },
  continueWrap: {
    paddingBottom: spacing.xl,
    alignItems: 'center',
  },
  continueBtn: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
  },
  continueLabel: {
    fontFamily: fonts.displayBold,
    fontSize: typography.body,
    color: colors.primary,
  },
});
