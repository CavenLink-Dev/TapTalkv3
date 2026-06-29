import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Dimensions, Image, StyleSheet, View } from 'react-native';
import { Href, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { DevSkip } from '../../src/components/DevSkip';
import { useReduceMotion } from '../../src/hooks/useReduceMotion';
import { useAppContext } from '../../src/hooks/useAppContext';
import { colors, typography } from '../../src/theme/tokens';
import { fonts } from '../../src/theme/fonts';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
// Disc large enough to cover the screen from a centered seed in any orientation.
const REVEAL_SIZE = Math.hypot(SCREEN_W, SCREEN_H) * 2.2;

// ── Timeline (ms) ────────────────────────────────────────────────────────────
// Tuned for ~5.8s end-to-end, breath-paced. Reduce Motion takes a much shorter
// path (~4.5s) but still respects the "always play" requirement.
const T = {
  // open
  logoIn:        { start:    0, duration: 1100 },
  mottoIn:       { start:  650, duration:  720 },
  loaderIn:      { start: 1000, duration:  520 },
  // breathe
  breathStart:   1500,
  breathDuration: 2900,
  // swallow
  swallowStart:  4200,
  fadeOut:       { start: 4200, duration: 700 },   // logo + motto + loader gently fade out
  discGrow:      { start: 4400, duration: 1000 },  // primary disc inflates from center
  wordmarkIn:    { start: 4900, duration: 480 },   // brand wordmark resolves on the disc
  // blink
  navAt:         5750,
  // reduce-motion path (no scale, no translate)
  rm: {
    fadeIn:   500,
    hold:     3300,
    fadeOut:  500,
    navAt:    4500,
  },
} as const;

const TARGET_ROUTES = {
  getStarted: '/onboarding/get-started' as Href,
  login:      '/auth/login' as Href,
  talk:       '/(tabs)/talk' as Href,
};

/**
 * TapTalk splash — premium, breath-paced.
 *
 * Plays on every cold start (the user spec calls this out). The animation is
 * decoupled from navigation: while the animation runs, AsyncStorage hydration
 * happens behind the scenes; at ~5.75s we look at the resolved app state and
 * route to either Talk, Login, or Get Started.
 *
 * Layout — fixed positions, not flex-centered, so the rhythm is the same on
 * every device size:
 *   • Logo at the top-middle (~22% from top).
 *   • Motto "Everyone deserves a voice." pinned near the lower third.
 *   • Loading dots at the very bottom of the safe area.
 *
 * Motion — three phases:
 *   • OPEN     (0–1.5s)  · logo fades + lifts, motto eases up, loader resolves.
 *   • BREATHE  (1.5–4.2s)· logo "breath" scale 1 → 1.015 → 1; loader runs.
 *   • SWALLOW  (4.2–5.4s)· all foreground fades; brand disc inflates from the
 *                          logo seed to fill the screen; wordmark resolves on
 *                          top. The disc is the "pull-in".
 *   • BLINK    (5.4–5.8s)· wordmark holds briefly, then we hand off to the
 *                          next route — feels like a soft eye-blink.
 *
 * Reduce Motion: replaces every scale/translate with a single opacity sweep,
 * shortens the timeline to ~4.5s, holds the brand fill before navigating.
 * Loader is rendered as a single low-opacity pulse on one dot.
 */
export default function Splash() {
  const router = useRouter();
  const reduceMotion = useReduceMotion();
  const { state, hydrated } = useAppContext();
  const [navReady, setNavReady] = useState(false);

  // ── Shared values ──
  // Open
  const logoOpacity = useSharedValue(0);
  const logoY       = useSharedValue(reduceMotion ? 0 : -10);
  const logoScale   = useSharedValue(reduceMotion ? 1 : 0.96);

  const mottoOpacity = useSharedValue(0);
  const mottoY       = useSharedValue(reduceMotion ? 0 : 8);

  const loaderOpacity = useSharedValue(0);

  // Loader dot wave (one shared value per dot's translateY + glow)
  const d1Y = useSharedValue(0); const d1G = useSharedValue(0.45);
  const d2Y = useSharedValue(0); const d2G = useSharedValue(0.45);
  const d3Y = useSharedValue(0); const d3G = useSharedValue(0.45);

  // Swallow
  const foregroundFade = useSharedValue(1);          // multiplied into logo/motto/loader
  const revealScale    = useSharedValue(0);          // disc 0 → 1
  const wordmarkOpacity = useSharedValue(0);
  const wordmarkScale   = useSharedValue(reduceMotion ? 1 : 0.94);

  // ── Choose destination route ──
  const decideRoute = useCallback((): Href => {
    if (state.signedIn && state.rememberLogin) return TARGET_ROUTES.talk;
    if (state.onboardingComplete) return TARGET_ROUTES.login;
    return TARGET_ROUTES.getStarted;
  }, [state.signedIn, state.rememberLogin, state.onboardingComplete]);

  // Track the latest decision in a ref so animation callbacks always pick up
  // the freshest state without re-running the animation.
  const routeRef = useRef<Href>(decideRoute());
  useEffect(() => {
    routeRef.current = decideRoute();
  }, [decideRoute]);

  // ── Animation orchestration (runs once on mount) ──
  useEffect(() => {
    const easeOut = Easing.out(Easing.cubic);
    const easeInOut = Easing.bezier(0.65, 0, 0.35, 1);
    const easeSine  = Easing.inOut(Easing.sin);

    if (reduceMotion) {
      // ── Reduce-motion timeline (opacity only) ──
      logoOpacity.value   = withTiming(1, { duration: T.rm.fadeIn });
      mottoOpacity.value  = withDelay(150, withTiming(1, { duration: T.rm.fadeIn }));
      loaderOpacity.value = withDelay(280, withTiming(1, { duration: T.rm.fadeIn }));

      // Single calm pulse on the middle dot.
      d2G.value = withDelay(
        T.rm.fadeIn,
        withRepeat(
          withSequence(
            withTiming(1,    { duration: 800, easing: Easing.inOut(Easing.quad) }),
            withTiming(0.45, { duration: 800, easing: Easing.inOut(Easing.quad) }),
          ),
          -1,
          true,
        ),
      );

      // Swallow as a soft cross-fade only.
      const swallowAt = T.rm.fadeIn + T.rm.hold;
      foregroundFade.value = withDelay(swallowAt, withTiming(0, { duration: T.rm.fadeOut }));
      revealScale.value    = withDelay(swallowAt, withTiming(1, { duration: T.rm.fadeOut + 60 }));
      wordmarkOpacity.value = withDelay(swallowAt + 100, withTiming(1, { duration: 320 }));

      const t = setTimeout(() => setNavReady(true), T.rm.navAt);
      return () => clearTimeout(t);
    }

    // ────────────────────────────────────────────────────────────────────────
    // FULL TIMELINE
    // ────────────────────────────────────────────────────────────────────────

    // OPEN — logo
    logoOpacity.value = withDelay(
      T.logoIn.start,
      withTiming(1, { duration: T.logoIn.duration, easing: easeOut }),
    );
    logoY.value = withDelay(
      T.logoIn.start,
      withTiming(0, { duration: T.logoIn.duration, easing: easeOut }),
    );
    logoScale.value = withDelay(
      T.logoIn.start,
      withTiming(1, { duration: T.logoIn.duration, easing: easeOut }),
    );

    // OPEN — motto
    mottoOpacity.value = withDelay(
      T.mottoIn.start,
      withTiming(1, { duration: T.mottoIn.duration, easing: easeOut }),
    );
    mottoY.value = withDelay(
      T.mottoIn.start,
      withTiming(0, { duration: T.mottoIn.duration, easing: easeOut }),
    );

    // OPEN — loader
    loaderOpacity.value = withDelay(
      T.loaderIn.start,
      withTiming(1, { duration: T.loaderIn.duration, easing: easeOut }),
    );

    // Loader dot wave — calm sine motion + glow. Stops naturally when
    // foregroundFade hits 0 in the swallow phase (they share the multiplier).
    const startWave = (yVal: ReturnType<typeof useSharedValue<number>>, gVal: ReturnType<typeof useSharedValue<number>>, offset: number) => {
      yVal.value = withDelay(
        T.loaderIn.start + offset,
        withRepeat(
          withSequence(
            withTiming(-6, { duration: 700, easing: easeSine }),
            withTiming( 0, { duration: 700, easing: easeSine }),
          ),
          -1,
          false,
        ),
      );
      gVal.value = withDelay(
        T.loaderIn.start + offset,
        withRepeat(
          withSequence(
            withTiming(1,    { duration: 700, easing: easeSine }),
            withTiming(0.45, { duration: 700, easing: easeSine }),
          ),
          -1,
          false,
        ),
      );
    };
    startWave(d1Y, d1G,   0);
    startWave(d2Y, d2G, 220);
    startWave(d3Y, d3G, 440);

    // BREATHE — single gentle breath cycle on the logo.
    logoScale.value = withDelay(
      T.breathStart,
      withSequence(
        withTiming(1.015, { duration: T.breathDuration / 2, easing: easeSine }),
        withTiming(1,     { duration: T.breathDuration / 2, easing: easeSine }),
      ),
    );

    // SWALLOW — soft foreground fade-out (all elements use this multiplier).
    foregroundFade.value = withDelay(
      T.fadeOut.start,
      withTiming(0, { duration: T.fadeOut.duration, easing: easeOut }),
    );

    // SWALLOW — disc grows. Long, smooth, almost imperceptibly accelerating.
    revealScale.value = withDelay(
      T.discGrow.start,
      withTiming(1, { duration: T.discGrow.duration, easing: easeInOut }),
    );

    // SWALLOW — wordmark resolves on top of the brand fill.
    wordmarkOpacity.value = withDelay(
      T.wordmarkIn.start,
      withTiming(1, { duration: T.wordmarkIn.duration, easing: easeOut }),
    );
    wordmarkScale.value = withDelay(
      T.wordmarkIn.start,
      withTiming(1, { duration: T.wordmarkIn.duration, easing: easeOut }),
    );

    // BLINK — flip the nav switch a beat after the disc has settled. The
    // actual route swap is gated below on hydration so we never navigate
    // with stale state.
    const t = setTimeout(() => setNavReady(true), T.navAt);
    return () => clearTimeout(t);
  // We deliberately want this to run exactly once. The route is decided later
  // from a ref, so omitting it here is correct.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduceMotion]);

  // Navigation — only fires once both: (a) the animation is done, (b) the
  // app state has hydrated from AsyncStorage. In practice hydration finishes
  // well before the animation ends, but this guarantees correctness on a
  // very cold start.
  useEffect(() => {
    if (navReady && hydrated) {
      router.replace(routeRef.current);
    }
  }, [navReady, hydrated, router]);

  // ── Animated styles ──
  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value * foregroundFade.value,
    transform: [
      { translateY: logoY.value },
      { scale: logoScale.value },
    ],
  }));

  const mottoStyle = useAnimatedStyle(() => ({
    opacity: mottoOpacity.value * foregroundFade.value,
    transform: [{ translateY: mottoY.value }],
  }));

  const loaderStyle = useAnimatedStyle(() => ({
    opacity: loaderOpacity.value * foregroundFade.value,
  }));

  const dotA = useAnimatedStyle(() => ({
    transform: [{ translateY: d1Y.value }],
    opacity: d1G.value,
  }));
  const dotB = useAnimatedStyle(() => ({
    transform: [{ translateY: d2Y.value }],
    opacity: d2G.value,
  }));
  const dotC = useAnimatedStyle(() => ({
    transform: [{ translateY: d3Y.value }],
    opacity: d3G.value,
  }));

  const revealStyle = useAnimatedStyle(() => ({
    transform: [{ scale: revealScale.value }],
    opacity: revealScale.value > 0 ? 1 : 0,
  }));

  const wordmarkStyle = useAnimatedStyle(() => ({
    opacity: wordmarkOpacity.value,
    transform: [{ scale: wordmarkScale.value }],
  }));

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Logo — top-middle */}
      <Animated.View style={[styles.logoBlock, logoStyle]}>
        <Image
          source={require('../../asset/taptalk_logo.png')}
          style={styles.logo}
          resizeMode="contain"
          accessibilityLabel="TapTalk"
        />
      </Animated.View>

      {/* Motto — near the bottom */}
      <Animated.Text style={[styles.motto, mottoStyle]}>
        Everyone deserves a voice.
      </Animated.Text>

      {/* Loader — bottom */}
      <Animated.View style={[styles.loaderRow, loaderStyle]} pointerEvents="none">
        <Animated.View style={[styles.dot, dotA]} />
        <Animated.View style={[styles.dot, styles.dotSpacer, dotB]} />
        <Animated.View style={[styles.dot, dotC]} />
      </Animated.View>

      {/* SWALLOW disc + brand wordmark — sit above everything else */}
      <Animated.View pointerEvents="none" style={[styles.reveal, revealStyle]} />
      <Animated.View pointerEvents="none" style={[styles.wordmarkWrap, wordmarkStyle]}>
        <Animated.Text style={styles.wordmark}>TapTalk</Animated.Text>
      </Animated.View>

      <DevSkip next="/onboarding/get-started" />
    </SafeAreaView>
  );
}

// Disc seed sits roughly under the logo so the inflate reads as a "pull from
// the brand mark" rather than a generic centered radial.
const REVEAL_SEED_Y = SCREEN_H * 0.28;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  logoBlock: {
    position: 'absolute',
    top: '22%',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  logo: {
    width: 220,
    height: 80,
  },
  motto: {
    position: 'absolute',
    bottom: '24%',
    left: 0,
    right: 0,
    textAlign: 'center',
    fontFamily: fonts.bodyMedium,
    fontSize: typography.body,
    color: colors.textMuted,
    letterSpacing: 0.1,
  },
  loaderRow: {
    position: 'absolute',
    bottom: 56,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  dotSpacer: {
    marginHorizontal: 12,
  },
  // Reveal disc — seeded under the logo. Scales 0 → 1 to swallow the screen.
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
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wordmark: {
    fontFamily: fonts.displayBlack,
    fontSize: 60,
    letterSpacing: -2.2,
    color: colors.surface,
  },
});
