// Constants extracted from app/(tabs)/talk.tsx.
// Layout sizes, symbol palette, and top-nav metadata for the Talk board.

import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { boardSizes, spacing } from '../../../theme/tokens';
import type { TopTab } from './types';

export const FIGMA_WIDTH = 393;
// Chrome sizes come from the shared board sizing system
// so the message strip, top nav, and control bar stay in one predictable
// density scale instead of one-off values.
export const MESSAGE_HEIGHT = boardSizes.messageStripHeight;
export const TOP_NAV_HEIGHT = boardSizes.topNavHeight;
export const BOARD_COLUMNS = 4;
// Target number of tile rows visible in the board viewport.
export const VISIBLE_ROWS = 4;
// 4pt uniform gap between columns and rows (Phase 3 — Board Density Pass).
export const TILE_CORNER_RADIUS = 5;
export const TILE_GAP = 4;
export const TILE_V_GAP = 4;
// 4pt side gutter (≤ 8pt cap), added on top of the safe-area inset.
export const TILE_LEFT_PADDING = 4;
export const BOARD_TOP_GAP = 32;
// Absolute max tile edge (pt).
export const TILE_SIZE = boardSizes.tileMax;
export const MAX_FW = 8;
// Bottom dock spacing: 16px gap between dock and bottom tab bar edge.
export const DOCK_BOTTOM_GAP = spacing.lg; // 16
// Contextual dock control sizes (pt) — from the shared board sizing system.
export const DOCK_ACTION_SIZE = boardSizes.controlBarItem;
export const DOCK_TOGGLE_SIZE = boardSizes.controlBarItem;
export const DOCK_GAP = 8;
export const DOCK_ACTION_PADDING = 8;
export const DOCK_ICON_STROKE = 2;
export const DOCK_ICON_TOGGLE = boardSizes.controlBarToggleIcon; // 22
export const DOCK_ICON_ACTION = boardSizes.controlBarIcon;       // 22
export const DOCK_ICON_ROW = boardSizes.controlBarIcon;          // 22
export const DOCK_ROW_LABEL = 14;

// All board tiles — folders and words alike — render as perfect squares so
// the grid reads as a single rhythm.
export const TILE_HEIGHT_RATIO = 1.25;
export const MESSAGE_CHIP_SIZE = 40;
export const MESSAGE_SLOT_COUNT = 6;
export const MESSAGE_SLOT_GAP = 5;

// TILE_ASSETS, WORD_TYPE_COLOR, wordTypeColour, wordBackgroundForTile,
// and the SYMBOL_* palette originals live in
// src/features/board/components/TileRenderer.tsx.
// Local aliases are kept here for the tile-data literals that reference the
// palette by short name.
export const SYMBOL_RED    = '#FF3B30';
export const SYMBOL_ORANGE = '#FF9F0A';
export const SYMBOL_YELLOW = '#FFD60A';
export const SYMBOL_GREEN  = '#34C759';
export const SYMBOL_BLUE   = '#0A84FF';
export const SYMBOL_PURPLE = '#BF5AF2';

// Top-nav tab metadata. Neutral outlined Ionicons + uppercase text labels.
export const TOP_TAB_META: Record<TopTab, { icon: React.ComponentProps<typeof Ionicons>['name']; label: string }> = {
  edit:     { icon: 'create',   label: 'EDIT'     },
  layout:   { icon: 'grid',     label: 'LAYOUT'   },
  saved:    { icon: 'bookmark', label: 'SAVED'    },
  settings: { icon: 'settings', label: 'SETTINGS' },
};

// Persisted Quick-tag storage key — the user's pinned Quick symbols
// survive app restarts (session-independent, all boards share one list).
export const QUICK_TAGS_STORAGE_KEY = 'taptalk.quickTaggedIds.v1';

// ── ResizeHandles ────────────────────────────────────────────────
export const HANDLE_PILL_LEN = 28;
export const HANDLE_PILL_THICK = 8;
export const HANDLE_CORNER_SIZE = 14;
