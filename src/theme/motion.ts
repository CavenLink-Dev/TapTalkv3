/**
 * Reanimated configuration builders, derived from `src/theme/tokens.ts`.
 *
 * Components should import the helpers from this file instead of constructing
 * `withTiming` / `withSpring` configs ad-hoc — this keeps motion consistent
 * across the app and gives us a single place to globally tweak feel.
 *
 * The handoff doc defines three "voices":
 *   • Standard ease — fades, crossfades, page transitions
 *   • Spring ease   — pops and scales (buttons, checkmarks)
 *   • Linear        — infinite loops (shimmer, idle float)
 *
 * These map to `timingStandard`, `springPop` / `springGentle`, and
 * `timingLinear` respectively.
 */

import { Easing, type WithSpringConfig, type WithTimingConfig } from 'react-native-reanimated';
import { animation } from './tokens';

// ─── Easings ──────────────────────────────────────────────────────────────────

const ease = (cps: readonly [number, number, number, number]) =>
  Easing.bezier(cps[0], cps[1], cps[2], cps[3]);

export const easings = {
  standard: ease(animation.easeStandard),
  spring:   ease(animation.easeSpring),
  linear:   Easing.linear,
} as const;

// ─── Timing presets ───────────────────────────────────────────────────────────

export const timingFast    = (): WithTimingConfig => ({ duration: animation.durFast,    easing: easings.standard });
export const timingFocus   = (): WithTimingConfig => ({ duration: animation.durFocus,   easing: easings.standard });
export const timingRelease = (): WithTimingConfig => ({ duration: animation.durRelease, easing: easings.spring });
export const timingBase    = (): WithTimingConfig => ({ duration: animation.durBase,    easing: easings.standard });
export const timingSlide   = (): WithTimingConfig => ({ duration: animation.durSlide,   easing: easings.standard });
export const timingFill    = (): WithTimingConfig => ({ duration: animation.durFill,    easing: easings.standard });
export const timingDraw    = (): WithTimingConfig => ({ duration: animation.durDraw,    easing: easings.standard });
export const timingReduced = (): WithTimingConfig => ({ duration: animation.durReduced, easing: easings.standard });
export const timingShimmer = (): WithTimingConfig => ({ duration: animation.durShimmer, easing: easings.linear   });
export const timingFloat   = (): WithTimingConfig => ({ duration: animation.durFloat,   easing: easings.standard });

// ─── Spring presets ───────────────────────────────────────────────────────────

export const springPop:    WithSpringConfig = animation.springPop;
export const springGentle: WithSpringConfig = animation.springGentle;
export const springStiff:  WithSpringConfig = animation.springStiff;

// ─── Reduce-Motion-aware helpers ──────────────────────────────────────────────

/** Pick a timing config — collapses to a short crossfade when Reduce Motion is on. */
export function timing(normal: () => WithTimingConfig, reduceMotion: boolean): WithTimingConfig {
  return reduceMotion ? timingReduced() : normal();
}

/** Pick a spring config — collapses to a stiff near-linear spring when Reduce Motion is on. */
export function spring(normal: WithSpringConfig, reduceMotion: boolean): WithSpringConfig {
  return reduceMotion ? springStiff : normal;
}
