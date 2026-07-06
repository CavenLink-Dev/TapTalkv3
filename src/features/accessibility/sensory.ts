/**
 * Sensory profile — gates haptics + non-essential sounds for users with
 * sensory processing differences. Cooperates with the existing
 * `hapticsEnabled` flag in `src/utils/haptics.ts`.
 */
export type SensoryProfile = 'off' | 'light' | 'standard';

let sensoryProfile: SensoryProfile = 'standard';

export function setSensoryProfile(p: SensoryProfile): void {
  sensoryProfile = p;
}

export function getSensoryProfile(): SensoryProfile {
  return sensoryProfile;
}

export type HapticKind = 'selection' | 'impact' | 'notification';

/**
 * Called from `src/utils/haptics.ts` at the top of every helper.
 * Returns `true` if the haptic should fire under the current profile.
 */
export function shouldFireHaptic(kind: HapticKind): boolean {
  if (sensoryProfile === 'off') return false;
  if (sensoryProfile === 'light' && kind === 'notification') return false;
  return true;
}

/** Same gate for optional UI/celebration sounds — not for TTS. */
export function shouldFireSound(kind: 'celebration' | 'ambient' | 'ui'): boolean {
  if (sensoryProfile === 'off') return false;
  if (sensoryProfile === 'light' && (kind === 'ambient' || kind === 'celebration')) return false;
  return true;
}
