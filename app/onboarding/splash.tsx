import React, { useEffect } from 'react';
import { Dimensions, Image, StyleSheet, Text, View } from 'react-native';
import { Href, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { DevSkip } from '../../src/components/DevSkip';
import { useReduceMotion } from '../../src/hooks/useReduceMotion';
import { colors, typography } from '../../src/theme/tokens';
import { fonts } from '../../src/theme/fonts';

const onboardingRoute = '/onboarding/get-started' as Href;
const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
// Diameter big enough to cover both portrait and landscape from a centered seed.
const REVEAL_SIZE = Math.hypot(SCREEN_W, SCREEN_H) * 2.2;

/**
 * Splash sequence (target: ~2.6s end-to-end on iPhone 16):
 *   0   – 700ms : logo image fades + slides up · tagline trails 140ms behind
 *   700 – 2050ms: three primary dots bounce up-and-down in a staggered wave
 *   2050        : a primary-color disc seeded under the logo expands to
 *                 "eat" the screen while the TapTalk wordmark scales up on
 *                 top — this is the brand reveal that hands off to the
 *                 get-started screen.
 *   2650        : router.replace → get-started
 *
 * Reduce Motion: skip the dots and the disc reveal — the logo cross-fades in,
 * holds for 800ms, then we navigate. No translateY, no scale, no repeats.
 */
export default function Splash() {
  const router = useRouter();
  const reduceMotion = useReduceMotion();

  // Phase 1
  const logoOpacity = useSharedValue(0);
  const logoY       = useSharedValue(16);
  const taglineOpacity = useSharedValue(0);

  // Phase 2 — dot bounce
  const dot1Y = useSharedValue(0);
  const dot2Y = useSharedValue(0);
  const dot3Y = useSharedValue(0);
  const dotsOpacity = useSharedValue(0);

  // Phase 3 — reveal
  const revealScale = useSharedValue(0);
  const wordmarkOpacity = useSharedValue(0);
  const wordmarkScale   = useSharedValue(0.92);
  const logoFade        = useSharedValue(1); // fade the logo out once the wordmark takes over

  useEffect(() => {
    if (reduceMotion) {
      logoOpacity.value = withTiming(1, { duration: 200 });
      taglineOpacity.value = withDelay(120, withTiming(1, { duration: 200 }));
      const t = setTimeout(() => router.replace(onboardingRoute), 1300);
      return () => clearTimeout(t);
    }

    // ── Phase 1 ──
    logoOpacity.value = withTiming(1, { duration: 600, easing: Easing.out(Easing.cubic) });
    logoY.value       = withSpring(0, { damping: 14, stiffness: 120 });
    taglineOpacity.value = withDelay(280, withTiming(1, { duration: 420 }));

    // ── Phase 2 ── dots fade in then bounce (looped) until the reveal kicks in
    dotsOpacity.value = withDelay(700, withTiming(1, { duration: 220 }));
    const bounce = (anim: typeof dot1Y, delay: number) => {
      anim.value = withDelay(
        700 + delay,
        withRepeat(
          withSequence(
            withTiming(-10, { duration: 280, easing: Easing.out(Easing.quad) }),
            withTiming(0,   { duration: 320, easing: Easing.in(Easing.quad)  }),
          ),
          -1,
          false,
        ),
      );
    };
    bounce(dot1Y, 0);
    bounce(dot2Y, 120);
    bounce(dot3Y, 240);

    // ── Phase 3 ── brand reveal
    wordmarkOpacity.value = withDelay(2050, withTiming(1, { duration: 240 }));
    wordmarkScale.value   = withDelay(2050, withSpring(1, { damping: 14, stiffness: 180 }));
    logoFade.value        = withDelay(2050, withTiming(0, { duration: 260 }));
    revealScale.value     = withDelay(
      2050,
      withTiming(1, { duration: 520, easing: Easing.bezier(0.65, 0, 0.35, 1) }, () => {
        // schedule the route swap from the worklet
        runOnJS(navigateToGetStarted)();
      }),
    );

    function navigateToGetStarted() {
      router.replace(onboardingRoute);
    }
  }, [
    reduceMotion,
    router,
    logoOpacity,
    logoY,
    taglineOpacity,
    dot1Y,
    dot2Y,
    dot3Y,
    dotsOpacity,
    revealScale,
    wordmarkOpacity,
    wordmarkScale,
    logoFade,
  ]);

  // ── Animated styles ──
  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value * logoFade.value,
    transform: [{ translateY: logoY.value }],
  }));
  const taglineStyle = useAnimatedStyle(() => ({
    opacity: taglineOpacity.value * logoFade.value,
  }));
  const dotsStyle = useAnimatedStyle(() => ({
    opacity: dotsOpacity.value * logoFade.value,
  }));
  const dotAStyle = useAnimatedStyle(() => ({ transform: [{ translateY: dot1Y.value }] }));
  const dotBStyle = useAnimatedStyle(() => ({ transform: [{ translateY: dot2Y.value }] }));
  const dotCStyle = useAnimatedStyle(() => ({ transform: [{ translateY: dot3Y.value }] }));

  const revealStyle = useAnimatedStyle(() => ({
    transform: [{ scale: revealScale.value }],
    opacity: revealScale.value > 0 ? 1 : 0,
  }));
  const wordmarkStyle = useAnimatedStyle(() => ({
    opacity: wordmarkOpacity.value,
    transform: [{ scale: wordmarkScale.value }],
  }));

  return (
    <SafeAreaView style={styles.container}>
      {/* Phase 1 + 2 — calm logo + tagline + bouncing dots */}
      <View style={styles.content}>
        <Animated.View style={[styles.logoBlock, logoStyle]}>
          <Image
            source={require('../../asset/taptalk_logo.png')}
            style={styles.logo}
            resizeMode="contain"
            accessibilityLabel="TapTalk"
          />
        </Animated.View>
        <Animated.Text style={[styles.tagline, taglineStyle]}>
          Everyone deserves a voice
        </Animated.Text>
      </View>

      <Animated.View style={[styles.dotsRow, dotsStyle]} pointerEvents="none">
        <Animated.View style={[styles.dot, dotAStyle]} />
        <Animated.View style={[styles.dot, styles.dotMiddle, dotBStyle]} />
        <Animated.View style={[styles.dot, dotCStyle]} />
      </Animated.View>

      {/* Phase 3 — reveal disc + wordmark "eats" the screen */}
      <Animated.View pointerEvents="none" style={[styles.reveal, revealStyle]} />
      <Animated.View pointerEvents="none" style={[styles.wordmarkWrap, wordmarkStyle]}>
        <Text style={styles.wordmark}>TapTalk</Text>
      </Animated.View>

      <DevSkip next="/onboarding/get-started" />
    </SafeAreaView>
  );
}

const REVEAL_SEED_Y = SCREEN_H * 0.42;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoBlock: {
    alignItems: 'center',
  },
  logo: {
    width: 240,
    height: 88,
  },
  tagline: {
    position: 'absolute',
    bottom: '38%',
    fontFamily: fonts.body,
    fontSize: typography.body,
    color: colors.textMuted,
    letterSpacing: 0.2,
  },
  dotsRow: {
    position: 'absolute',
    bottom: 72,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primary,
  },
  dotMiddle: {
    marginHorizontal: 10,
  },
  // Reveal disc: seeded at the logo position, scales 0 → 1 → covers screen.
  reveal: {
    position: 'absolute',
    width: REVEAL_SIZE,
    height: REVEAL_SIZE,
    borderRadius: REVEAL_SIZE / 2,
    backgroundColor: colors.primary,
    top: REVEAL_SEED_Y - REVEAL_SIZE / 2,
    left: SCREEN_W / 2 - REVEAL_SIZE / 2,
  },
  wordmarkWrap: {
    position: 'absolute',
    top: 0, bottom: 0, left: 0, right: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wordmark: {
    fontFamily: fonts.displayBlack,
    fontSize: 64,
    letterSpacing: -2.5,
    color: colors.surface,
  },
});
