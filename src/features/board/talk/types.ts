// Types extracted from app/(tabs)/talk.tsx.
// Pure declarations — no runtime side effects. Kept together because
// they are all part of the Talk board surface (tiles, dock, edit state).

import type { LayoutRectangle } from 'react-native';
import type React from 'react';
import { TILE_ASSETS } from '../components/TileRenderer';

export type TileKind = 'folder' | 'word' | 'action';

// `places` was previously (incorrectly) named `animals` while holding
// places vocabulary — renamed so the key matches the content and the
// `animals` key stays free for real animal vocabulary later.
export type BoardMode =
  | 'home'
  | 'foods'
  | 'places'
  | 'tools'
  | 'quick'
  | 'settings'
  | 'emergency'
  | 'feelings';

// Top-nav vocabulary (board_control_bar restructure): EDIT opens the Edit
// Control Bar (moved up from the bottom dock), LAYOUT is the old Resize
// tool (grid + handles), SAVED opens saved sentences, SETTINGS opens
// board settings. CLEAR was removed.
export type TopTab = 'edit' | 'layout' | 'saved' | 'settings';

export type BoardTile = {
  id: string;
  label: string;
  kind: TileKind;
  color: string;
  target?: BoardMode;
  speech?: string;
  background?: keyof typeof TILE_ASSETS;
  backgroundOpacity?: number;
  outlineColor?: string;
  outlineOpacity?: number;
  customImageUri?: string;
  // Production-quality Mulberry pictogram (asset-map ID, e.g.
  // `mulberry_apple_1ogqpa9`).
  mulberrySymbolId?: string;
  // Optional curated fallback key (e.g. `good`, `bad`).
  mulberryName?: string;
  // Optional word-type label (e.g. 'noun', 'verb') exposed as an
  // accessibilityHint so VoiceOver users get the same semantic layer
  // that colour gives sighted users (principle 23).
  wordType?: string;
  /** Protected tiles cannot be deleted or hidden in edit mode (Priority 4). */
  isProtected?: boolean;
};

export type WindowRect = LayoutRectangle;

// Tile placement: which slot it starts in (coarse 88+10px grid), and
// its size in TILE UNITS. fw=1 → one 88px tile, fw=2 → 186px (spans
// 2 slots). Default is fw=fh=1. Resize grows in whole tile-unit steps
// so placements always align cleanly with the background grid.
export type TilePlacement = {
  id: string;
  slot: number;
  fw: number;
  fh: number;
};

export type BoardLayout = TilePlacement[];

export type GhostTile = {
  id: string;
  tile: BoardTile;
  from: WindowRect;
  to: WindowRect;
  size: number;
};

// ── Contextual dock ────────────────────────────────────────────────
export type DockActionKind = 'primary' | 'neutral' | 'muted';

// Contextual dock states, highest render priority first.
export type DockMode =
  | 'homeCollapsed'
  | 'homeExpanded'
  | 'addExpanded'
  | 'folderExpanded'
  | 'folderCollapsed'
  | 'editControls'
  | 'editClean'
  | 'editDirty'
  | 'quickManage';

/**
 * Edit tools inside the Edit Control Bar. Only one tool is active
 * at a time. The old `editMode` boolean is preserved but is now
 * specifically the "resize tool active" flag.
 */
export type BoardEditTool = 'none' | 'select' | 'move' | 'resize';

/** Sort options offered by the Sort popover. */
export type BoardSortMode = 'type' | 'name' | 'category';

/**
 * One reversible board edit. `layouts` is a snapshot of the whole
 * custom layouts map, `favourites` the active board's pinned list,
 * and `restoreTileIds` any tiles a delete hid via the persisted
 * HIDE_TILE dispatch (undo re-shows them with RESTORE_TILE).
 */
export type BoardUndoEntry = {
  label: string;
  layouts: Partial<Record<BoardMode, BoardLayout>>;
  favourites: string[];
  board: BoardMode;
  restoreTileIds?: string[];
};

export type DockPopoverOption = {
  key: string;
  label: string;
  a11yLabel: string;
  selected?: boolean;
  onPress: () => void;
};

export type DockSubControlSpec = {
  key: string;
  icon: string;
  label: string;
  a11yLabel: string;
  a11yHint?: string;
  onPress: () => void;
  kind?: DockActionKind;
  tint?: string;
  disabled?: boolean;
};

// Rect in board-content coordinate space (relative to the ScrollView's
// content container). Kept for type-compat; no longer used for drag logic.
export type SlotRect = { x: number; y: number; width: number; height: number };
export type TileRectsRef = React.MutableRefObject<Record<string, SlotRect>>;

export type QuickDockMode = 'hidden' | 'manage';
