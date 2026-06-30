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

let hapticsEnabled = true;

export function setHapticsEnabled(enabled: boolean): void {
  hapticsEnabled = enabled;
}

const noop = Promise.resolve();

export function hapticSelection(): Promise<void> {
  if (!hapticsEnabled) return noop;
  return Haptics.selectionAsync().catch(() => undefined) as Promise<void>;
}

export function hapticLight(): Promise<void> {
  if (!hapticsEnabled) return noop;
  return Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined) as Promise<void>;
}

export function hapticMedium(): Promise<void> {
  if (!hapticsEnabled) return noop;
  return Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => undefined) as Promise<void>;
}

export function hapticSuccess(): Promise<void> {
  if (!hapticsEnabled) return noop;
  return Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined) as Promise<void>;
}

export function hapticError(): Promise<void> {
  if (!hapticsEnabled) return noop;
  return Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => undefined) as Promise<void>;
}
