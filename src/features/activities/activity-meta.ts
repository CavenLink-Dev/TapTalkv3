/**
 * Shared display metadata for activities — title, accent, and icon per
 * game. Mirrors the Activities tab list. Used by the Progress overview,
 * the per-activity detail screen, and the therapist export so all three
 * agree on naming. Accents are the existing per-activity brand colours
 * (the one sanctioned hardcoded-hex exception).
 */

import type { ComponentProps } from 'react';
import type { Ionicons } from '@expo/vector-icons';

export type ActivityMeta = {
  title: string;
  accent: string;
  icon: ComponentProps<typeof Ionicons>['name'];
};

export const ACTIVITY_META: Record<string, ActivityMeta> = {
  'shape-match':  { title: 'Shape Match',  accent: '#1B8A4A', icon: 'shapes-outline' },
  'colour-pop':   { title: 'Colour Pop',   accent: '#7C3AED', icon: 'color-palette-outline' },
  'memory-match': { title: 'Memory Match', accent: '#0A6ED1', icon: 'albums-outline' },
};

/** Title lookup for export text (falls back to the raw id). */
export function activityTitles(): Record<string, string> {
  return Object.fromEntries(
    Object.entries(ACTIVITY_META).map(([id, m]) => [id, m.title]),
  );
}
