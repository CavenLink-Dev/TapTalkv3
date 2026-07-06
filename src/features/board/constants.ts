// ─── Board UI constants ───────────────────────────────────────────────────────
// Centralises every magic number used across the board grid, dock, and chrome
// so changes propagate to layout math, components, and styles alike without
// hunting through a 7 k-line file.
//
// Layout-math constants (BOARD_COLUMNS, TILE_GAP…) are also re-exported from
// layout.ts so callers that import layout functions get them for free.

import { boardSizes, CHROME_SEPARATOR_WIDTH, spacing } from '../../theme/tokens';

// ── Grid ─────────────────────────────────────────────────────────────────────
export const BOARD_COLUMNS = 4;
export const VISIBLE_ROWS  = 4;
export const TILE_CORNER_RADIUS = 5;
export const TILE_GAP     = 4;   // horizontal gap between columns (pt)
export const TILE_V_GAP   = 4;   // vertical gap between rows (pt)
export const TILE_LEFT_PADDING = 4;
export const BOARD_TOP_GAP = 32;
/** Absolute maximum tile edge in pt. Actual size is the lesser of this,
 *  what fits the width in BOARD_COLUMNS columns, and what keeps VISIBLE_ROWS
 *  rows visible in the viewport. */
export const TILE_SIZE = boardSizes.tileMax;
/** Maximum fine-unit width/height for a resizable tile. */
export const MAX_FW = 8;
/** Folder/word tile height multiplier — kept at 1.25 for ghost-clone math. */
export const TILE_HEIGHT_RATIO = 1.25;

// ── Message strip ─────────────────────────────────────────────────────────────
export const MESSAGE_HEIGHT     = boardSizes.messageStripHeight;
export const MESSAGE_CHIP_SIZE  = 40;
export const MESSAGE_SLOT_COUNT = 6;
export const MESSAGE_SLOT_GAP   = 5;

// ── Top nav ───────────────────────────────────────────────────────────────────
export const TOP_NAV_HEIGHT = boardSizes.topNavHeight;
export const FIGMA_WIDTH    = 393;

// ── Dock (bottom control bar) ─────────────────────────────────────────────────
export const DOCK_BOTTOM_GAP    = spacing.lg;          // 16 pt
export const DOCK_ACTION_SIZE   = boardSizes.controlBarItem;
export const DOCK_TOGGLE_SIZE   = boardSizes.controlBarItem;
export const DOCK_GAP           = 8;
export const DOCK_ACTION_PADDING = 8;
export const DOCK_ICON_STROKE   = 2;
export const DOCK_ICON_TOGGLE   = boardSizes.controlBarToggleIcon; // 22
export const DOCK_ICON_ACTION   = boardSizes.controlBarIcon;       // 22
export const DOCK_ICON_ROW      = boardSizes.controlBarIcon;       // 22
export const DOCK_ROW_LABEL     = 14;

// Re-export for consumers that import both the chrome and the separator.
export { CHROME_SEPARATOR_WIDTH, spacing, boardSizes };
