/**
 * Thin wrappers around `expo-haptics` so callers never have to remember to
 * `.catch(() => undefined)` — every helper returns a resolved promise on
 * platforms (e.g. web, simulator) that throw or no-op.
 *
 * Mapping (from the design handoff "Motion" rows):
 *   • PrimaryButton press in        → selection
 *   • SelectableCard select         → light impact
 *   • TextField error               → notification(error)
 *   • TextField success / completed → notification(success)
 *   • Pill / Chip toggle            → selection
 */

import * as Haptics from 'expo-haptics';

export function hapticSelection(): Promise<void> {
  return Haptics.selectionAsync().catch(() => undefined) as Promise<void>;
}

export function hapticLight(): Promise<void> {
  return Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined) as Promise<void>;
}

export function hapticMedium(): Promise<void> {
  return Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => undefined) as Promise<void>;
}

export function hapticSuccess(): Promise<void> {
  return Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined) as Promise<void>;
}

export function hapticError(): Promise<void> {
  return Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => undefined) as Promise<void>;
}
