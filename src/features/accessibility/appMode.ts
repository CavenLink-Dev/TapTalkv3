/**
 * Communication vs Learning mode.
 *
 *   • communicate — zero decoration. Fastest tap-to-speak. Predictions and
 *                   word-type badges hidden. No celebration animations.
 *   • learn       — badges on tiles, hints on empty state, larger tap targets,
 *                   subtle success animations.
 *
 * Add `mode: AppMode` to AppState.accessibility (or a top-level field —
 * placement is up to you). Default 'communicate' so first-launch users see
 * the calmest possible board.
 */
import { useMemo } from 'react';
import { useAppContext } from '../../hooks/useAppContext';

export type AppMode = 'communicate' | 'learn';

export type ModeConfig = {
  showPredictions: boolean;
  showWordTypeBadges: boolean;
  celebrateOnSpeak: boolean;
  minTileBonus: number; // added to motor.minTile
};

export const MODE_CONFIG: Record<AppMode, ModeConfig> = {
  communicate: {
    showPredictions: true,   // predictions are speed, not decoration
    showWordTypeBadges: false,
    celebrateOnSpeak: false,
    minTileBonus: 0,
  },
  learn: {
    showPredictions: true,
    showWordTypeBadges: true,
    celebrateOnSpeak: true,
    minTileBonus: 8,
  },
};

export function useAppMode(): { mode: AppMode; config: ModeConfig } {
  const { state } = useAppContext();
  const mode: AppMode =
    ((state.accessibility as { mode?: AppMode }).mode) ?? 'communicate';
  return useMemo(() => ({ mode, config: MODE_CONFIG[mode] }), [mode]);
}
