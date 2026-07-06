// ─── Board domain types ───────────────────────────────────────────────────────
// Extracted from app/(tabs)/talk.tsx (Phase 4 — God-screen split).
// These are pure data-shape types with no RN/Reanimated dependencies so they
// can be imported by layout.ts, boardData.ts, and every component without
// triggering a circular reference.

export type TileKind = 'folder' | 'word' | 'action';

// `places` was previously named `animals` — renamed so the key matches content.
export type BoardMode =
  | 'home'
  | 'foods'
  | 'places'
  | 'tools'
  | 'quick'
  | 'settings'
  | 'emergency'
  | 'feelings';

// Top-nav: EDIT / LAYOUT / SAVED / SETTINGS (CLEAR removed).
export type TopTab = 'edit' | 'layout' | 'saved' | 'settings';

export type BoardTile = {
  id: string;
  label: string;
  kind: TileKind;
  color: string;
  target?: BoardMode;
  speech?: string;
  /** Key into TILE_ASSETS. */
  background?: 'loud' | 'straw' | 'green' | 'red' | 'yellow' | 'cyan' | 'blue' | 'coral' | 'purple';
  backgroundOpacity?: number;
  outlineColor?: string;
  outlineOpacity?: number;
  customImageUri?: string;
  /** Mulberry asset-map ID (bundled SVG). */
  mulberrySymbolId?: string;
  /** Curated fallback key (e.g. `good`, `bad`). */
  mulberryName?: string;
  /** Fitzgerald word type — used for colour + VoiceOver hints. */
  wordType?: string;
  /** Protected tiles cannot be deleted or hidden in edit mode. */
  isProtected?: boolean;
};

/** Measured screen rect — from measureInWindow or layout events. */
export type WindowRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

/** Fly-to animation token: animates a tile clone from `from` → `to`. */
export type GhostTile = {
  id: string;
  tile: BoardTile;
  from: WindowRect;
  to: WindowRect;
  size: number;
};

// ── Contextual dock ──────────────────────────────────────────────────────────

export type DockActionKind = 'primary' | 'neutral' | 'muted';

export type DockMode =
  | 'homeCollapsed'   // > (default main-board state)
  | 'homeExpanded'    // Add / Sort / Quick / Hide
  | 'addExpanded'     // Back / Symbol / Folder / Add
  | 'folderExpanded'  // Back / Add / Sort / Edit / Hide
  | 'folderCollapsed' // > / Add
  | 'editControls'    // Back / Undo / Select / Move / Save-or-Cancel
  | 'editClean'       // Delete? / Add + / Done (resize-mode dock)
  | 'editDirty'       // Cancel / Save
  | 'quickManage';    // Back / Select–Unselect / Create + / Done?

export type BoardEditTool = 'none' | 'select' | 'move' | 'resize';

export type BoardSortMode = 'type' | 'name' | 'category';

/** One reversible board edit pushed onto the undo stack before mutation. */
export type BoardUndoEntry = {
  label: string;
  layouts: Partial<Record<BoardMode, import('./layout').BoardLayout>>;
  favourites: string[];
  board: BoardMode;
  restoreTileIds?: string[];
};
