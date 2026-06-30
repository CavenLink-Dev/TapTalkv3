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
import { isWarmSession, markSessionWarm } from '../../src/utils/sessionFlags';
import { typography } from '../../src/theme/tokens';
import { useTheme } from '../../src/theme/useTheme';
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
  const t = useTheme();
  const reduceMotion = useReduceMotion();
  const { state, hydrated } = useAppContext();
  const warmResume = isWarmSession();
  const [navReady, setNavReady] = useState(warmResume);

  // ── Shared values ──
  // Open
  const logoOpacity = useSharedValue(0);
  const logoY       = useSharedValue(reduceMotion ? 0 : -10);
  const logoScale   = useSharedValue(reduceMotion ? 1 : 0.96);

  const mottoOpacity = useSharedValue(0);
  const mottoY       = useSharedValue(reduceMotion ? 0 : 8);

  const loaderOpacity = useSharedValue(0);

  // Loader — three dots that bounce in sequence (left → center → right)
  // then hold briefly before looping. Each dot has its own translateY so we
  // can stagger the bounces with a single Reanimated cycle per dot.
  const dot1Y = useSharedValue(0);
  const dot2Y = useSharedValue(0);
  const dot3Y = useSharedValue(0);
  // Reduce-motion path uses opacity instead of translation. Shared base so
  // all three dots breathe together.
  const dotsOpacity = useSharedValue(1);

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

  // Warm resume — skip the full splash when the JS runtime is still alive.
  useEffect(() => {
    if (!warmResume || !hydrated) return;
    markSessionWarm();
    router.replace(routeRef.current);
  }, [warmResume, hydrated, router]);

  // ── Animation orchestration (runs once on mount) ──
  useEffect(() => {
    if (warmResume) return;

    const easeOut = Easing.out(Easing.cubic);
    const easeInOut = Easing.bezier(0.65, 0, 0.35, 1);
    const easeSine  = Easing.inOut(Easing.sin);

    if (reduceMotion) {
      // ── Reduce-motion timeline (opacity only) ──
      logoOpacity.value   = withTiming(1, { duration: T.rm.fadeIn });
      mottoOpacity.value  = withDelay(150, withTiming(1, { duration: T.rm.fadeIn }));
      loaderOpacity.value = withDelay(280, withTiming(1, { duration: T.rm.fadeIn }));

      // Reduce-motion: hold all three dots static, just pulse the opacity
      // together so there's a calm sign of life without translation.
      dotsOpacity.value = withDelay(
        T.rm.fadeIn,
        withRepeat(
          withSequence(
            withTiming(1,   { duration: 900, easing: Easing.inOut(Easing.quad) }),
            withTiming(0.5, { duration: 900, easing: Easing.inOut(Easing.quad) }),
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

      const timer = setTimeout(() => setNavReady(true), T.rm.navAt);
      return () => clearTimeout(timer);
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

    // 3-dot bounce loader. Each dot follows the same total 1100ms cycle
    // but the up-down portion is offset by 100ms per dot, giving a clean
    // left → center → right wave. After all three settle the loader holds
    // for the remainder of the cycle so the eye gets a breath before the
    // next wave starts.
    const BOUNCE_UP = 300;
    const BOUNCE_DOWN = 300;
    const STAGGER = 100;
    const HOLD = 500;
    const BOUNCE_HEIGHT = -8;
    const easeBounceOut = Easing.out(Easing.quad);
    const easeBounceIn  = Easing.in(Easing.quad);
    const makeDotCycle = (offsetMs: number) =>
      withRepeat(
        withSequence(
          withTiming(0, { duration: offsetMs }),
          withTiming(BOUNCE_HEIGHT, { duration: BOUNCE_UP, easing: easeBounceOut }),
          withTiming(0,             { duration: BOUNCE_DOWN, easing: easeBounceIn }),
          withTiming(0, { duration: HOLD + (STAGGER * 2 - offsetMs) }),
        ),
        -1,
        false,
      );
    dot1Y.value = withDelay(T.loaderIn.start, makeDotCycle(0));
    dot2Y.value = withDelay(T.loaderIn.start, makeDotCycle(STAGGER));
    dot3Y.value = withDelay(T.loaderIn.start, makeDotCycle(STAGGER * 2));

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
    const timer = setTimeout(() => setNavReady(true), T.navAt);
    return () => clearTimeout(timer);
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
      markSessionWarm();
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

  // Per-dot translateY drives the bounce. Reduce-motion path leaves Y at 0
  // and modulates opacity through `dotsOpacity` instead so the animation
  // still feels alive without movement.
  const dot1Style = useAnimatedStyle(() => ({
    transform: [{ translateY: dot1Y.value }],
    opacity: dotsOpacity.value,
  }));
  const dot2Style = useAnimatedStyle(() => ({
    transform: [{ translateY: dot2Y.value }],
    opacity: dotsOpacity.value,
  }));
  const dot3Style = useAnimatedStyle(() => ({
    transform: [{ translateY: dot3Y.value }],
    opacity: dotsOpacity.value,
  }));

  const revealStyle = useAnimatedStyle(() => ({
    transform: [{ scale: revealScale.value }],
    opacity: revealScale.value > 0 ? 1 : 0,
  }));

  const wordmarkStyle = useAnimatedStyle(() => ({
    opacity: wordmarkOpacity.value,
    transform: [{ scale: wordmarkScale.value }],
  }));

  if (warmResume) {
    return null;
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: t.colors.background }]} edges={['top', 'bottom']}>
      {/* Logo + motto sit together as a centered stack. The motto reads
          directly beneath the logo so the brand mark anchors the page and
          the supporting line breathes with it. */}
      <Animated.View style={[styles.logoBlock, logoStyle]}>
        <Image
          source={require('../../assets/taptalk_logo.png')}
          style={styles.logo}
          resizeMode="contain"
          accessibilityLabel="TapTalk"
        />
        <Animated.Text style={[styles.motto, { color: t.colors.textMuted }, mottoStyle]}>
          Tap To Talk
        </Animated.Text>
      </Animated.View>

      {/* Loader — three dots bouncing in sequence, pinned to the bottom of
          the safe area. Stops naturally when foregroundFade hits 0. */}
      <Animated.View style={[styles.loaderWrap, loaderStyle]} pointerEvents="none">
        <Animated.View style={[styles.dot, { backgroundColor: t.colors.primary }, dot1Style]} />
        <Animated.View style={[styles.dot, { backgroundColor: t.colors.primary }, dot2Style]} />
        <Animated.View style={[styles.dot, { backgroundColor: t.colors.primary }, dot3Style]} />
      </Animated.View>

      {/* SWALLOW disc + brand wordmark — sit above everything else */}
      <Animated.View
        pointerEvents="none"
        style={[styles.reveal, { backgroundColor: t.colors.primary }, revealStyle]}
      />
      <Animated.View pointerEvents="none" style={[styles.wordmarkWrap, wordmarkStyle]}>
        <Animated.Text style={[styles.wordmark, { color: t.colors.surface }]}>TapTalk</Animated.Text>
      </Animated.View>

      <DevSkip next="/onboarding/get-started" />
    </SafeAreaView>
  );
}

// Disc seed sits at the logo's centered position so the inflate reads as a
// "pull from the brand mark" rather than a generic centered radial. The
// logo is vertically centered in `logoBlock` (50% of screen height), so
// the seed matches its origin exactly.
const REVEAL_SEED_Y = SCREEN_H * 0.5;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  // Logo centered both axes — the brand mark is the anchor of the screen.
  // Motto stacks directly beneath via flex order so it reads as one
  // composed mark rather than a disconnected line at the bottom.
  logoBlock: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 240,
    height: 88,
  },
  motto: {
    marginTop: 18,
    textAlign: 'center',
    fontFamily: fonts.bodyMedium,
    fontSize: typography.body,
    letterSpacing: 0.1,
  },
  // Loader sits at the bottom safe area, holding the three-dot bounce.
  loaderWrap: {
    position: 'absolute',
    bottom: '12%',
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    height: 16,
  },
  // 8 × 8 brand-blue dots — small enough to read as a loader, large enough
  // to feel intentional. The bounce uses translateY in `dotNStyle`.
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  // Reveal disc — seeded under the logo. Scales 0 → 1 to swallow the screen.
  reveal: {
    position: 'absolute',
    width: REVEAL_SIZE,
    height: REVEAL_SIZE,
    borderRadius: REVEAL_SIZE / 2,
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
  },
});
