/**
 * VoiceOver / TalkBack labelling helpers. One place to keep tile a11y
 * consistent across TileRenderer, MessageStrip, and the edit-mode overlay.
 *
 * Every tile a screen-reader user encounters should announce WHAT it says
 * when tapped — not just its written label.
 */
import type { BoardTile } from './types';

export function tileA11yProps(tile: Pick<BoardTile, 'label' | 'speech' | 'kind' | 'wordType'>) {
  const spoken = tile.speech ?? tile.label;
  const hint =
    tile.kind === 'folder'
      ? `Opens ${tile.label} folder`
      : tile.kind === 'action'
        ? `Runs ${tile.label}`
        : `Adds ${spoken} to your message`;

  return {
    accessible: true,
    accessibilityRole: 'button' as const,
    accessibilityLabel: tile.label,
    accessibilityHint: hint,
    accessibilityValue: tile.wordType ? { text: tile.wordType } : undefined,
  };
}

export function messageStripA11yProps(words: string[]) {
  const sentence = words.join(' ').trim();
  return {
    accessible: true,
    accessibilityLiveRegion: 'polite' as const,
    accessibilityRole: 'text' as const,
    accessibilityLabel: sentence ? `Message: ${sentence}` : 'Message empty',
  };
}
