/**
 * VoiceOver / TalkBack labelling helpers. One place to keep tile a11y
 * consistent across TileRenderer, MessageStrip, and the edit-mode overlay.
 *
 * Every tile a screen-reader user encounters should announce WHAT it does
 * when activated, without making VoiceOver speech compete with app speech.
 */
import type {
  AccessibilityActionInfo,
  AccessibilityState,
  AccessibilityValue,
} from 'react-native';

type TileA11yInput = {
  id?: string;
  label: string;
  speech?: string;
  kind: 'folder' | 'word' | 'action';
  wordType?: string;
};

export type TileA11yMode = 'normal' | 'layout' | 'select' | 'move';

export type TileA11yOptions = {
  mode?: TileA11yMode;
  isSelected?: boolean;
  isNav?: boolean;
  speaksOnPress?: boolean;
  canOpenEditMenu?: boolean;
  canReorder?: boolean;
  canRemove?: boolean;
};

function spokenTextFor(tile: Pick<TileA11yInput, 'label' | 'speech'>): string {
  return (tile.speech ?? tile.label).trim();
}

function normalHint(tile: TileA11yInput, speaksOnPress: boolean): string {
  if (tile.id === 'back') return 'Double tap to go back one board';
  if (tile.id === 'home') return 'Double tap to open the Home board';
  if (tile.kind === 'folder') return `Double tap to open the ${tile.label} board`;
  if (tile.kind === 'action') return `Double tap to run ${tile.label}`;

  const spoken = spokenTextFor(tile);
  return speaksOnPress
    ? `Double tap to add and speak ${spoken}`
    : `Double tap to add ${spoken} to your message`;
}

export function tileA11yProps(tile: TileA11yInput, options: TileA11yOptions = {}) {
  const mode = options.mode ?? 'normal';
  const isNav = options.isNav ?? (tile.id === 'back' || tile.id === 'home');
  let accessibilityHint = normalHint(tile, options.speaksOnPress ?? false);
  let accessibilityState: AccessibilityState | undefined;
  let accessibilityActions: AccessibilityActionInfo[] | undefined;

  if (mode === 'select' && !isNav) {
    accessibilityHint = options.isSelected
      ? 'Double tap to remove this tile from the selection'
      : 'Double tap to add this tile to the selection';
    accessibilityState = { selected: Boolean(options.isSelected) };
  } else if (mode === 'move' && !isNav) {
    if (tile.kind === 'folder') {
      accessibilityHint = `Double tap to move the selected tiles to ${tile.label}`;
    } else {
      accessibilityHint = 'Only folders can be move destinations';
      accessibilityState = { disabled: true };
    }
  } else if (mode === 'layout' && !isNav) {
    accessibilityHint = 'Double tap to show resize handles. Long press and drag to move this tile.';
    accessibilityState = options.isSelected ? { selected: true } : undefined;
    if (options.canReorder) {
      accessibilityActions = [
        { name: 'increment', label: 'Move tile forward' },
        { name: 'decrement', label: 'Move tile back' },
      ];
    }
    if (options.canRemove) {
      accessibilityActions = [
        ...(accessibilityActions ?? []),
        { name: 'remove', label: 'Remove tile' },
      ];
    }
  } else if (options.canOpenEditMenu && !isNav) {
    accessibilityActions = [{ name: 'longpress', label: 'Edit tile' }];
  }

  const accessibilityValue: AccessibilityValue | undefined =
    tile.wordType ? { text: tile.wordType } : undefined;

  return {
    accessible: true,
    accessibilityRole: 'button' as const,
    accessibilityLabel: tile.label,
    accessibilityHint,
    accessibilityState,
    accessibilityActions,
    accessibilityValue,
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
