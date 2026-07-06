/**
 * Motor profile — one flag that cascades to gap sizes, debounce, dwell,
 * long-press, and minimum touch target across the whole board.
 *
 * Add `motorProfile: MotorProfile` to AppState.accessibility (see
 * src/context/types.ts) and default to 'standard'.
 */
import { useMemo } from 'react';
import { useAppContext } from '../../hooks/useAppContext';

export type MotorProfile = 'standard' | 'tremor' | 'severe';

export type MotorPreset = {
  tileGap: number;
  tapDebounceMs: number;
  /** 0 = fire on release. > 0 = fire after hold time (dwell activation). */
  dwellMs: number;
  longPress: boolean;
  minTile: number;
};

export const MOTOR_PRESETS: Record<MotorProfile, MotorPreset> = {
  standard: { tileGap: 4,  tapDebounceMs: 0,   dwellMs: 0,   longPress: true,  minTile: 88 },
  tremor:   { tileGap: 12, tapDebounceMs: 120, dwellMs: 0,   longPress: false, minTile: 96 },
  severe:   { tileGap: 16, tapDebounceMs: 200, dwellMs: 800, longPress: false, minTile: 120 },
};

export function useMotor(): MotorPreset {
  const { state } = useAppContext();
  // Fall back to 'standard' until the new field is added to types.
  const profile =
    ((state.accessibility as { motorProfile?: MotorProfile }).motorProfile) ?? 'standard';
  return useMemo(() => MOTOR_PRESETS[profile], [profile]);
}
