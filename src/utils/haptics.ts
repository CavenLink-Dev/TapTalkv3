/**
 * Thin wrappers around `expo-haptics` so callers never have to remember to
 * `.catch(() => undefined)` — every helper returns a resolved promise on
 * platforms (e.g. web, simulator) that throw or no-op.
 *
 * Global enabled flag: the user can disable haptics in Settings → Display.
 * Call `setHapticsEnabled(bool)` (wired at the app root from
 * `state.accessibility.hapticsEnabled`) and every helper below becomes a no-op
 * when disabled. This keeps every call site simple — they don't need to read
 * context themselves.
 *
 * Mapping (from the design handoff "Motion" rows):
 *   • PrimaryButton press in        → selection
 *   • SelectableCard select         → light impact
 *   • TextField error               → notification(error)
 *   • TextField success / completed → notification(success)
 *   • Pill / Chip toggle            → selection
 */

import * as Haptics from 'expo-haptics';
import { shouldFireHaptic } from '../features/accessibility/sensory';

export type HapticStrength = 'gentle' | 'standard' | 'strong';

let hapticsEnabled = true;
let hapticStrength: HapticStrength = 'standard';

export function setHapticsEnabled(enabled: boolean): void {
  hapticsEnabled = enabled;
}

/**
 * Global strength preference (Settings → Accessibility → Motor).
 * 'gentle' maps every impact down to Light; 'strong' maps impacts up one
 * step so users who need clearer confirmation feel it. Selection cues stay
 * as-is under 'standard'/'gentle' and become a light impact under 'strong'.
 */
export function setHapticStrength(strength: HapticStrength): void {
  hapticStrength = strength;
}

const noop = Promise.resolve();

function impactFor(base: Haptics.ImpactFeedbackStyle): Haptics.ImpactFeedbackStyle {
  if (hapticStrength === 'gentle') return Haptics.ImpactFeedbackStyle.Light;
  if (hapticStrength === 'strong') {
    return base === Haptics.ImpactFeedbackStyle.Light
      ? Haptics.ImpactFeedbackStyle.Medium
      : Haptics.ImpactFeedbackStyle.Heavy;
  }
  return base;
}

export function hapticSelection(): Promise<void> {
  if (!hapticsEnabled || !shouldFireHaptic('selection')) return noop;
  if (hapticStrength === 'strong') {
    return Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined) as Promise<void>;
  }
  return Haptics.selectionAsync().catch(() => undefined) as Promise<void>;
}

export function hapticLight(): Promise<void> {
  if (!hapticsEnabled || !shouldFireHaptic('impact')) return noop;
  return Haptics.impactAsync(impactFor(Haptics.ImpactFeedbackStyle.Light)).catch(() => undefined) as Promise<void>;
}

export function hapticMedium(): Promise<void> {
  if (!hapticsEnabled || !shouldFireHaptic('impact')) return noop;
  return Haptics.impactAsync(impactFor(Haptics.ImpactFeedbackStyle.Medium)).catch(() => undefined) as Promise<void>;
}

export function hapticSuccess(): Promise<void> {
  if (!hapticsEnabled || !shouldFireHaptic('notification')) return noop;
  return Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined) as Promise<void>;
}

export function hapticWarning(): Promise<void> {
  if (!hapticsEnabled || !shouldFireHaptic('notification')) return noop;
  return Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => undefined) as Promise<void>;
}

export function hapticError(): Promise<void> {
  if (!hapticsEnabled || !shouldFireHaptic('notification')) return noop;
  return Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => undefined) as Promise<void>;
}
