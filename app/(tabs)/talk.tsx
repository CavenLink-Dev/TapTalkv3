import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  AccessibilityActionEvent,
  AccessibilityInfo,
  ActionSheetIOS,
  Alert,
  Animated as RNAnimated,
  Easing as RNEasing,
  LayoutAnimation,
  LayoutRectangle,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import Reanimated, {
  cancelAnimation,
  Easing as ReanimatedEasing,
  runOnJS,
  useAnimatedReaction,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
  SharedValue,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Icon } from '../../src/components/native/Icon';
import { Href, useRouter } from 'expo-router';
import { BoardBackIcon, BoardHomeIcon } from '../../src/components/icons/FigmaIcons';
import { TalkMessageStrip, type MessageStripTile } from '../../src/components/talk/TalkMessageStrip';
import { AddSymbolModal } from '../../src/components/talk/AddSymbolModal';
import { AddFolderModal } from '../../src/components/talk/AddFolderModal';
import { MulberrySymbol, prewarmMulberryAssets } from '../../src/components/symbols/MulberrySymbol';
import { useAppContext } from '../../src/hooks/useAppContext';
import { useSpeech } from '../../src/hooks/useSpeech';
import { buildMessageUtterances } from '../../src/utils/speechRules';
import { animation, CHROME_SEPARATOR_WIDTH, colors, radii, spacing } from '../../src/theme/tokens';
import { useTheme } from '../../src/theme/useTheme';
import { hapticError, hapticSelection } from '../../src/utils/haptics';
import { predictNextWords } from '../../src/utils/ngram';
import { useReduceMotion } from '../../src/hooks/useReduceMotion';
import {
  resolveSymbolForKeyword,
  ResolvedSymbol,
} from '../../src/features/symbol-brain/resolveSymbolForKeyword';
import type { AACWord } from '../../src/context/types';

type TileKind = 'folder' | 'word' | 'action';
type BoardMode = 'home' | 'foods' | 'animals' | 'tools' | 'quick' | 'settings' | 'emergency';
// New top-nav vocabulary: TAPTALK opens the keyboard page, QUICK opens
// Quick Talk, EDIT is a stub for now (no behaviour), CLEAR clears the
// message strip in place. See to_do/NEXT.md "Board top nav" for the lock.
type TopTab = 'taptalk' | 'quick' | 'edit' | 'clear';

type BoardTile = {
  id: string;
  label: string;
  kind: TileKind;
  color: string;
  target?: BoardMode;
  speech?: string;
  background?: keyof typeof TILE_ASSETS;
  // Production-quality Mulberry pictogram (asset-map ID, e.g.
  // `mulberry_apple_1ogqpa9`). Resolves through `expo-asset` for a sharp
  // bundled SVG.
  mulberrySymbolId?: string;
  // Optional curated fallback key (e.g. `good`, `bad`). Used when an
  // asset-map ID isn't a clean match for the label.
  mulberryName?: string;
  // Optional word-type label (e.g. 'noun', 'verb') exposed as an
  // accessibilityHint so VoiceOver users get the same semantic layer
  // that colour gives sighted users (principle 23).
  wordType?: string;
  /** Protected tiles cannot be deleted or hidden in edit mode (Priority 4). */
  isProtected?: boolean;
};

type WindowRect = LayoutRectangle;

// Tile placement: which slot it starts in (coarse 88+10px grid), and
// its size in TILE UNITS. fw=1 → one 88px tile, fw=2 → 186px (spans
// 2 slots). Default is fw=fh=1. Resize grows in whole tile-unit steps
// so placements always align cleanly with the background grid.
type TilePlacement = {
  id: string;
  slot: number;
  fw: number;
  fh: number;
};

type BoardLayout = TilePlacement[];

type GhostTile = {
  id: string;
  tile: BoardTile;
  from: WindowRect;
  to: WindowRect;
  size: number;
};

const FIGMA_WIDTH = 393;
const MESSAGE_HEIGHT = 104;
const TOP_NAV_HEIGHT = 76;
const BOARD_COLUMNS = 4;
// 10pt uniform gap between columns and rows — outer spacing, not inner.
const TILE_GAP = 10;
const TILE_V_GAP = 10;
// 5pt side gutter. With TILE_GAP=10 and TILE_SIZE=88, this produces
// exactly 88pt tiles on a 393pt iPhone: (393-10-30)/4 = 88.
const TILE_LEFT_PADDING = 5;
const BOARD_TOP_GAP = 32;
// Hard cap at 88pt — the AAC standard square size.
const TILE_SIZE = 88;
// Fine grid unit: resize handles snap in 44px increments (half a tile).
// Default tile is fw=fh=2 (88×88); each drag step grows by 44px so users
// get finer control than whole-tile jumps.
const FINE = 44;
const MAX_FW = 8; // 8 * 44 = 352px, roughly the full board width
// Bottom dock spacing: 16px gap between dock and bottom tab bar edge.
const DOCK_BOTTOM_GAP = spacing.lg; // 16
// Contextual dock control sizes (pt) — fixed, not tied to tileSize.
const DOCK_ACTION_SIZE = 68;
const DOCK_TOGGLE_SIZE = 68;
const DOCK_GAP = 8;
const DOCK_ACTION_PADDING = 10;
const DOCK_ICON_STROKE = 4;
const DOCK_ICON_TOGGLE = 39;
const DOCK_ICON_ACTION = 22;
const DOCK_ICON_ROW = 18;
const DOCK_ROW_LABEL = 15;
// Coarse tile-cell footprint of a placement — used for collision math
// and multi-cell highlights. fw=2 → 1 col, fw=3 or 4 → 2 cols, fw=5 or 6 → 3.
const coarseCols = (fw: number) => Math.ceil(fw / 2);
const coarseRows = (fh: number) => Math.ceil(fh / 2);

// ── Footprint helpers ────────────────────────────────────────────────────────
// Shared by resize AND drag-drop so multi-cell tiles can never be committed
// on top of each other. A footprint is the coarse-cell rectangle a placement
// occupies, anchored at its slot.
type CellFootprint = {
  startCol: number;
  startRow: number;
  endCol: number;
  endRow: number;
};

const footprintAt = (slot: number, fw: number, fh: number): CellFootprint => {
  const startCol = slot % BOARD_COLUMNS;
  const startRow = Math.floor(slot / BOARD_COLUMNS);
  return {
    startCol,
    startRow,
    endCol: startCol + coarseCols(fw) - 1,
    endRow: startRow + coarseRows(fh) - 1,
  };
};

const footprintsOverlap = (a: CellFootprint, b: CellFootprint) =>
  !(a.startCol > b.endCol || b.startCol > a.endCol ||
    a.startRow > b.endRow || b.startRow > a.endRow);

/**
 * Push-aside reflow around one pinned placement. Every other tile keeps its
 * slot when possible; tiles whose footprint now collides walk forward to the
 * nearest empty slot that fits (wrapping rows). Returns the full layout with
 * the pinned placement included. Used by both resize and drag-drop commits so
 * a multi-cell tile can never end up overlapping a neighbour.
 */
function reflowAroundPinned(
  others: TilePlacement[],
  pinned: TilePlacement,
): BoardLayout {
  const placed: { p: TilePlacement; fp: CellFootprint }[] = [
    { p: pinned, fp: footprintAt(pinned.slot, pinned.fw, pinned.fh) },
  ];
  const sorted = [...others].sort((a, b) => a.slot - b.slot);

  for (const other of sorted) {
    const desiredFp = footprintAt(other.slot, other.fw, other.fh);
    const fits = (fp: CellFootprint) =>
      fp.endCol < BOARD_COLUMNS &&
      !placed.some(pl => footprintsOverlap(pl.fp, fp));

    if (fits(desiredFp)) {
      placed.push({ p: other, fp: desiredFp });
      continue;
    }

    // Search forward for the nearest slot that fits.
    const cw = coarseCols(other.fw);
    let found = false;
    for (let s = other.slot + 1; s < 500; s++) {
      if ((s % BOARD_COLUMNS) + cw > BOARD_COLUMNS) continue;
      const testFp = footprintAt(s, other.fw, other.fh);
      if (fits(testFp)) {
        placed.push({ p: { ...other, slot: s }, fp: testFp });
        found = true;
        break;
      }
    }
    if (!found) {
      // Give up gracefully — keep in original slot (may overlap; unlikely).
      placed.push({ p: other, fp: desiredFp });
    }
  }

  return placed.map(x => x.p);
}
// All board tiles — folders and words alike — render as perfect squares so
// the grid reads as a single rhythm. The previous `FOLDER_HEIGHT_RATIO`
// made folders ~3% taller than words, which showed up as "Foods looks
// bigger than Actions" in QA. Keeping a constant lets us swap to a
// different square multiplier if needed without re-threading the ratio
// through every render path.
const TILE_HEIGHT_RATIO = 1.25;
const MESSAGE_CHIP_SIZE = 40;
const MESSAGE_SLOT_COUNT = 6;
const MESSAGE_SLOT_GAP = 5;
    
const TILE_ASSETS = {
  loud: require('../../assets/aac/board_tiles/symbol-loud.png'),
  straw: require('../../assets/aac/board_tiles/symbol-straw.png'),
  green: require('../../assets/aac/board_tiles/symbol-green.png'),
  red: require('../../assets/aac/board_tiles/symbol-red.png'),
  yellow: require('../../assets/aac/board_tiles/symbol-yellow.png'),
  cyan: require('../../assets/aac/board_tiles/symbol-cyan.png'),
  blue: require('../../assets/aac/board_tiles/symbol-blue.png'),
  coral: require('../../assets/aac/board_tiles/symbol-coral.png'),
  purple: require('../../assets/aac/board_tiles/symbol-purple.png'),
};

function wordBackgroundForTile(tile: BoardTile) {
  return TILE_ASSETS[tile.background ?? 'cyan'];
}

// Top-nav tab metadata. Replaces the brightly-coloured cartoon PNGs with
// neutral outlined Ionicons + uppercase text labels — matches the bottom
// nav vocabulary (one tint, two states: idle grey, active brand blue).
const TOP_TAB_META: Record<TopTab, { icon: React.ComponentProps<typeof Ionicons>['name']; label: string }> = {
  taptalk: { icon: 'keypad',       label: 'TAPTALK' },
  quick:   { icon: 'flash',        label: 'QUICK'   },
  edit:    { icon: 'create',       label: 'EDIT'    },
  clear:   { icon: 'close-circle', label: 'CLEAR'   },
};

// ─── Symbol palette ──────────────────────────────────────────────────────────
// Vibrant, matte primaries chosen from the iOS system palette. The tile
// background renders these flat (no PNG) at 30% opacity so the boards read
// as clean, soft-coloured chips rather than busy stickers.
const SYMBOL_RED    = '#FF3B30';
const SYMBOL_ORANGE = '#FF9F0A';
const SYMBOL_YELLOW = '#FFD60A';
const SYMBOL_GREEN  = '#34C759';
const SYMBOL_BLUE   = '#0A84FF';
const SYMBOL_PURPLE = '#BF5AF2';

// Mulberry symbols selected to match the existing tile labels. Asset-map
// IDs (production-quality bundled SVGs) are preferred; curated `name`
// fallbacks are used where the asset-map naming isn't a clean match.
// Mappings live alongside the tile data so the data-to-symbol
// relationship is obvious during review.
const HOME_TILES: BoardTile[] = [
  // Each folder now carries a curated Mulberry pictogram so the icon reads
  // at a glance, not just the label: People → family, Places → house,
  // Actions → run, Foods → food. These are intentional, hand-picked IDs;
  // any folder left without one still falls back to the resolver.
  { id: 'people', label: 'People', kind: 'folder', target: 'quick',   color: '#1DCDFF', mulberrySymbolId: 'mulberry_family_excv0f' },
  { id: 'foods',  label: 'Foods',  kind: 'folder', target: 'foods',   color: '#1DCDFF', mulberrySymbolId: 'mulberry_food_atkyaz' },
  { id: 'places', label: 'Places', kind: 'folder', target: 'animals', color: '#1DCDFF', mulberrySymbolId: 'mulberry_house_1ice1xp' },
  { id: 'actions',label: 'Actions',kind: 'folder', target: 'tools',   color: '#1DCDFF', mulberrySymbolId: 'mulberry_run_1l6fpg7' },
  // Emergency & Help folder — visually distinct with danger colour + icon
  // prefix (Rule 23: not colour alone). Protected / non-deletable.
  { id: 'emergency-folder', label: '⚠ Help', kind: 'folder', target: 'emergency', color: '#FF3B30', isProtected: true, mulberrySymbolId: 'mulberry_help_1g1ppr' },
];

// ── Emergency & Help phrases (Priority 4) ──────────────────────────────────
// Protected quick-access phrases. Speaks on tap via useSpeech. Non-deletable
// in edit mode. Contact wording is user-editable (not hardcoded emergency #s).
const EMERGENCY_TILES: BoardTile[] = [
  { id: 'emer-aac',     label: 'I use AAC',            kind: 'word', color: '#FF3B30', speech: 'I use A A C to communicate', isProtected: true, wordType: 'phrase' },
  { id: 'emer-wait',    label: 'Please wait',          kind: 'word', color: '#FF9500', speech: 'Please wait',                isProtected: true, wordType: 'phrase' },
  { id: 'emer-help',    label: 'I need help',          kind: 'word', color: '#FF3B30', speech: 'I need help',                isProtected: true, wordType: 'phrase' },
  { id: 'emer-pain',    label: 'I am in pain',         kind: 'word', color: '#FF3B30', speech: 'I am in pain',               isProtected: true, wordType: 'phrase' },
  { id: 'emer-call',    label: 'Call my support person',kind: 'word', color: '#FF9500', speech: 'Please call my support person', isProtected: true, wordType: 'phrase' },
  { id: 'back-emergency', label: 'Home', kind: 'folder', target: 'home', color: '#1DCDFF' },
];

export const BOARD_TILES: Record<BoardMode, BoardTile[]> = {
  home: HOME_TILES,
  foods: [
    { id: 'cheese', label: 'Cheese', kind: 'word',   color: SYMBOL_YELLOW, speech: 'cheese', mulberrySymbolId: 'mulberry_cheese_qsgfck', wordType: 'noun' },
    { id: 'apple',  label: 'Apple',  kind: 'word',   color: SYMBOL_RED,    speech: 'apple',  mulberrySymbolId: 'mulberry_apple_1ogqpa9',  wordType: 'noun' },
    { id: 'bread',  label: 'Bread',  kind: 'word',   color: SYMBOL_ORANGE, speech: 'bread',  mulberrySymbolId: 'mulberry_bread_t6g6ux',   wordType: 'noun' },
    { id: 'banana', label: 'Banana', kind: 'word',   color: SYMBOL_YELLOW, speech: 'banana', mulberrySymbolId: 'mulberry_banana_rcoei',   wordType: 'noun' },
    { id: 'milk',   label: 'Milk',   kind: 'word',   color: SYMBOL_BLUE,   speech: 'milk',   mulberrySymbolId: 'mulberry_milk_1pcjn1m',   wordType: 'noun' },
    { id: 'water',  label: 'Water',  kind: 'word',   color: SYMBOL_BLUE,   speech: 'water',  mulberrySymbolId: 'mulberry_water_139tuvw',   wordType: 'noun' },
    { id: 'back-foods', label: 'Home', kind: 'folder', target: 'home', color: '#1DCDFF' },
  ],
  animals: [
    { id: 'cat',  label: 'Cat',  kind: 'word', color: SYMBOL_ORANGE, speech: 'cat',  mulberrySymbolId: 'mulberry_cat_1lz3nun',  wordType: 'noun' },
    { id: 'dog',  label: 'Dog',  kind: 'word', color: SYMBOL_GREEN,  speech: 'dog',  mulberrySymbolId: 'mulberry_dog_1bfmoh1',  wordType: 'noun' },
    { id: 'fish', label: 'Fish', kind: 'word', color: SYMBOL_BLUE,   speech: 'fish', mulberrySymbolId: 'mulberry_fish_1u95ovx', wordType: 'noun' },
    { id: 'bird', label: 'Bird', kind: 'word', color: SYMBOL_BLUE,   speech: 'bird', mulberrySymbolId: 'mulberry_bird_13ztxas', wordType: 'noun' },
    { id: 'rabbit', label: 'Rabbit', kind: 'word', color: SYMBOL_PURPLE, speech: 'rabbit', mulberrySymbolId: 'mulberry_rabbit_sjorvr', wordType: 'noun' },
    { id: 'horse', label: 'Horse', kind: 'word', color: SYMBOL_ORANGE, speech: 'horse', mulberrySymbolId: 'mulberry_horse_c0o22y', wordType: 'noun' },
    { id: 'back-animals', label: 'Home', kind: 'folder', target: 'home', color: '#1DCDFF' },
  ],
  tools: [
    { id: 'loud-tool', label: 'Loud',   kind: 'word',   color: SYMBOL_BLUE,   speech: 'loud',  mulberrySymbolId: 'mulberry_loud_1kbu7nf',  wordType: 'adjective' },
    { id: 'quiet',     label: 'Quiet',  kind: 'word',   color: SYMBOL_PURPLE, speech: 'quiet', mulberrySymbolId: 'mulberry_quiet_4csbx1',  wordType: 'adjective' },
    { id: 'repeat',    label: 'Repeat', kind: 'action', color: SYMBOL_GREEN },
    { id: 'clear-tool',label: 'Clear',  kind: 'action', color: SYMBOL_RED   },
  ],
  quick: [
    // Curated fallbacks: the Mulberry asset map has no plain 'yes'/'no'
    // pictograms, so we lean on the curated `good` / `bad` glyphs which
    // ship as inline SVG strings.
    { id: 'yes',  label: 'Yes',  kind: 'word', color: SYMBOL_GREEN, speech: 'yes',  mulberryName: 'good', wordType: 'interjection' },
    { id: 'no',   label: 'No',   kind: 'word', color: SYMBOL_RED,   speech: 'no',   mulberryName: 'bad',  wordType: 'interjection' },
    { id: 'help', label: 'Help', kind: 'word', color: SYMBOL_BLUE,  speech: 'help', mulberrySymbolId: 'mulberry_help_1g1ppr', wordType: 'verb' },
    { id: 'stop', label: 'Stop', kind: 'word', color: SYMBOL_RED,   speech: 'stop', wordType: 'verb' },
    { id: 'more', label: 'More', kind: 'word', color: SYMBOL_GREEN, speech: 'more', mulberrySymbolId: 'mulberry_more_1r3s2f0', wordType: 'adjective' },
    { id: 'want', label: 'Want', kind: 'word', color: SYMBOL_BLUE,  speech: 'want', mulberrySymbolId: 'mulberry_want_16yheia', wordType: 'verb' },
    { id: 'eat',  label: 'Eat',  kind: 'word', color: SYMBOL_ORANGE, speech: 'eat',  mulberrySymbolId: 'mulberry_eat_18rupbi',  wordType: 'verb' },
    { id: 'drink',label: 'Drink',kind: 'word', color: SYMBOL_PURPLE, speech: 'drink', mulberrySymbolId: 'mulberry_drink_16zxzpv', wordType: 'verb' },
  ],
  settings: [
    { id: 'hide-nav',        label: 'Hide nav', kind: 'action', color: SYMBOL_PURPLE },
    { id: 'clear-settings',  label: 'Clear',    kind: 'action', color: SYMBOL_RED    },
    { id: 'home-settings',   label: 'Home',     kind: 'folder', target: 'home', color: '#1DCDFF' },
    { id: 'repeat-settings', label: 'Repeat',   kind: 'action', color: SYMBOL_GREEN  },
  ],
  emergency: EMERGENCY_TILES,
};

const BACK_TILE: BoardTile = { id: 'back', label: 'Back', kind: 'action', color: '#6B7580' };

const BoardNavTile = React.memo(function BoardNavTile({ tile, size }: { tile: BoardTile; size: number }) {
  const t = useTheme();
  return (
    <View
      style={[
        styles.navTileShell,
        {
          width: size,
          height: size,
          backgroundColor: t.isDark ? t.colors.surface : '#F4F6F8',
          borderWidth: 1.6,
          borderColor: t.isDark ? t.colors.primary : colors.primary,
        },
      ]}
    >
      <View style={styles.navTileIconMount}>
        {tile.id === 'back' ? <BoardBackIcon size={40} /> : <BoardHomeIcon size={40} />}
      </View>
      <Text
        style={[styles.navTileLabel, { color: t.colors.primary }]}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {tile.label}
      </Text>
    </View>
  );
});

// ── Contextual dock action ────────────────────────────────────────────────
// A square, symbol-styled control used by the Talk board bottom dock. It is
// visually distinct from AAC word/folder tiles (neutral fill + primary
// outline) so it reads as "a button, not a symbol". Three visual kinds:
//   • primary — filled primary (Done / Save / Add + on home)
//   • neutral — soft fill, primary outline (Back / Home / Symbol / Folder / < / >)
//   • muted   — soft fill, muted outline (Delete / Cancel) — avoids harsh red
type DockActionKind = 'primary' | 'neutral' | 'muted';

// Contextual dock states, highest render priority first.
type DockMode =
  | 'homeCollapsed'   // > (default main-board state)
  | 'homeExpanded'    // Add / Board / Hide
  | 'addExpanded'     // Back / Symbol / Folder / Add
  | 'folderExpanded'  // Back / Add / Hide
  | 'folderCollapsed' // > / Add
  | 'editClean'       // Delete? / Add + / Done
  | 'editDirty';      // Cancel / Save

const BoardDockAction = React.memo(function BoardDockAction({
  label,
  icon,
  iconOnly = false,
  iconLabelLayout = 'stack',
  a11yLabel,
  a11yHint,
  onPress,
  size = DOCK_ACTION_SIZE,
  kind = 'neutral',
  disabled = false,
  isToggle = false,
  isActive = false,
  wide = false,
}: {
  label?: string;
  icon?: string;
  iconOnly?: boolean;
  iconLabelLayout?: 'stack' | 'row';
  a11yLabel: string;
  a11yHint?: string;
  onPress: () => void;
  size?: number;
  kind?: DockActionKind;
  disabled?: boolean;
  /** 44pt square — Add toggle or chevrons. */
  isToggle?: boolean;
  /** Toggle is on (Add flow open). */
  isActive?: boolean;
  /** Auto-width for readable multi-word labels (e.g. Board Settings). */
  wide?: boolean;
}) {
  const t = useTheme();
  const dim = size;
  const isRowLabel = Boolean(icon && label && iconLabelLayout === 'row');
  const softFill = t.colors.surface;
  const effectiveKind: DockActionKind =
    isActive && isToggle ? 'primary' : kind;
  const dockIconProps = {
    strokeWidth: DOCK_ICON_STROKE,
  } as const;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={a11yLabel}
      accessibilityHint={a11yHint}
      accessibilityState={{ disabled, selected: isActive }}
      disabled={disabled}
      hitSlop={iconOnly ? { top: 4, bottom: 4, left: 4, right: 4 } : undefined}
      onPress={onPress}
      style={({ pressed }) => {
        const bg =
          pressed
            ? effectiveKind === 'primary'
              ? t.colors.primaryPressed
              : effectiveKind === 'muted'
                ? (t.isDark ? t.colors.input : '#E8ECF0')
                : (t.isDark ? t.colors.input : colors.softBlue)
            : effectiveKind === 'primary'
              ? t.colors.primary
              : softFill;
        return [
          styles.dockAction,
          {
            width: wide || isRowLabel ? undefined : dim,
            minWidth: isRowLabel ? 76 : dim,
            minHeight: dim,
            height: dim,
            paddingHorizontal: wide
              ? spacing.md
              : isRowLabel
                ? spacing.sm + 2
                : DOCK_ACTION_PADDING,
            paddingVertical: DOCK_ACTION_PADDING,
            backgroundColor: bg,
            borderColor: pressed && effectiveKind !== 'primary'
              ? t.colors.text
              : t.colors.symbolOutline,
            borderWidth: effectiveKind === 'primary' ? 0 : 1.6,
          },
          disabled && { opacity: 0.4 },
        ];
      }}
    >
      {({ pressed }) => {
        const contentColor =
          pressed && effectiveKind !== 'primary'
            ? t.colors.text
            : effectiveKind === 'primary'
              ? '#FFFFFF'
              : effectiveKind === 'muted'
                ? t.colors.textMuted
                : t.colors.text;

        if (iconOnly && icon) {
          return (
            <View style={styles.dockIconOnlyMount}>
              <Icon
                name={icon}
                size={DOCK_ICON_TOGGLE}
                color={contentColor}
                {...dockIconProps}
              />
            </View>
          );
        }

        if (icon && label && iconLabelLayout === 'row') {
          return (
            <View style={styles.dockIconRow}>
              <View style={styles.dockIconRowGlyph}>
                <Icon
                  name={icon}
                  size={DOCK_ICON_ROW}
                  color={contentColor}
                  {...dockIconProps}
                />
              </View>
              <Text
                style={[styles.dockRowLabel, { color: contentColor }]}
                numberOfLines={1}
              >
                {label}
              </Text>
            </View>
          );
        }

        if (icon && label) {
          return (
            <View style={styles.dockIconStack}>
              <View style={styles.dockIconStackGlyph}>
                <Icon
                  name={icon}
                  size={DOCK_ICON_ACTION}
                  color={contentColor}
                  {...dockIconProps}
                />
              </View>
              <Text
                style={[styles.dockActionLabel, { color: contentColor }]}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.65}
              >
                {label}
              </Text>
            </View>
          );
        }

        return (
          <Text
            style={[
              isToggle
                ? styles.dockAddToggleLabel
                : styles.dockActionLabel,
              { color: contentColor },
            ]}
            numberOfLines={2}
            adjustsFontSizeToFit
            minimumFontScale={0.65}
          >
            {label}
          </Text>
        );
      }}
    </Pressable>
  );
});

// Mulberry pictograms render inside the `symbolMount` region at ~52% of
// the tile size, which keeps them comfortably below the label without
// crowding. Returns null when the tile has no symbol assigned so existing
// tiles (e.g. People, Places) stay clean until we curate one for them.
function TileSymbol({ tile, width, height, resolved, horizontal }: {
  tile: BoardTile; width: number; height: number; resolved?: ResolvedSymbol; horizontal?: boolean;
}) {
  const symbolId = tile.mulberrySymbolId ?? resolved?.symbol.id;
  const symbolName = tile.mulberryName;
  if (!symbolId && !symbolName) return null;
  // Two layout modes:
  //  • horizontal — for wide (landscape) tiles: symbol fills the LEFT half,
  //    label on the right. Symbol size = height * 0.78 (fills vertically).
  //  • vertical (default) — label at top, symbol fills remaining area.
  //    Symbol size scales with the smaller dimension bumped to 0.72 so
  //    it reads MUCH bigger than the previous 0.58 baseline.
  if (horizontal) {
    const size = Math.round(Math.min(width * 0.42, height * 0.78));
    return (
      <View
        style={{
          position: 'absolute', left: 4, top: 0, bottom: 0,
          width: Math.round(width * 0.42),
          alignItems: 'center', justifyContent: 'center',
        }}
        pointerEvents="none"
      >
        <MulberrySymbol symbolId={symbolId} name={symbolName} size={size} />
      </View>
    );
  }
  const size = Math.round(Math.min(width * 0.85, height * 0.72));
  return (
    <View style={styles.symbolMount} pointerEvents="none">
      <MulberrySymbol symbolId={symbolId} name={symbolName} size={size} />
    </View>
  );
}

function BoardFolderTile({ tile, width, height, resolved }: { tile: BoardTile; width: number; height: number; resolved?: ResolvedSymbol }) {
  const t = useTheme();
  const edgeColor = t.isDark ? t.colors.border : t.colors.primary;
  // When the tile is much wider than tall (aspect > 1.5), use a
  // horizontal layout: symbol on the left, label on the right. This
  // keeps the symbol readable on landscape resized tiles instead of
  // shrinking it to fit the short height.
  const horizontal = width > height * 1.5;
  const tabWidth = Math.round(width * 0.48);
  const tabHeight = Math.round(height * 0.17);
  const faceTop = Math.round(height * 0.08);
  return (
    <View style={[styles.tileShell, { width, height }]}>
      <View
        pointerEvents="none"
        style={[
          styles.folderTab,
          {
            width: tabWidth,
            height: tabHeight,
            backgroundColor: tile.color,
            borderColor: edgeColor,
          },
        ]}
      />
      <View
        pointerEvents="none"
        style={[
          styles.folderFace,
          {
            top: faceTop,
            backgroundColor: tile.color,
            borderColor: edgeColor,
          },
        ]}
      />
      <Text
        style={[
          styles.folderLabel,
          horizontal
            ? { left: Math.round(width * 0.44), right: 8, textAlign: 'left' as const,
                bottom: 0, top: 0, ...({ textAlignVertical: 'center' } as any) }
            : { color: t.colors.text },
          { color: t.colors.text },
        ]}
        numberOfLines={horizontal ? 2 : 1}
        adjustsFontSizeToFit
      >
        {tile.label}
      </Text>
      <TileSymbol tile={tile} width={width} height={height} resolved={resolved} horizontal={horizontal} />
    </View>
  );
}

function BoardWordTile({ tile, width, height, resolved }: { tile: BoardTile; width: number; height: number; resolved?: ResolvedSymbol }) {
  const t = useTheme();
  const isFallback =
    resolved != null &&
    !tile.mulberrySymbolId &&
    !tile.mulberryName &&
    (resolved.tier === 'fuzzy' || resolved.tier === 'semantic' ||
      resolved.tier === 'category' || resolved.tier === 'unknown');
  const horizontal = width > height * 1.5;
  return (
    <View style={[styles.wordTile, { width, height }]}>
      <View
        style={[
          styles.wordTileFill,
          { width, height, backgroundColor: tile.color, opacity: 0.3 },
        ]}
      />
      {isFallback ? (
        <View
          style={[
            StyleSheet.absoluteFillObject,
            styles.wordTileFallbackBorder,
            { borderColor: t.isDark ? t.colors.textTertiary : '#8A8F95' },
          ]}
          pointerEvents="none"
        />
      ) : null}
      <Text
        style={[
          styles.wordLabel,
          horizontal
            ? {
                left: Math.round(width * 0.44), right: 8,
                top: 0, bottom: 0,
                textAlign: 'left' as const,
                ...({ textAlignVertical: 'center' } as any),
              }
            : null,
          { color: t.colors.text },
        ]}
        numberOfLines={horizontal ? 2 : 1}
        adjustsFontSizeToFit
      >
        {isFallback ? '≈ ' : ''}{tile.label}
      </Text>
      <TileSymbol tile={tile} width={width} height={height} resolved={resolved} horizontal={horizontal} />
    </View>
  );
}

function GhostTileClone({
  ghost,
  onDone,
}: {
  ghost: GhostTile;
  onDone: (id: string) => void;
}) {
  // Item 1 — Reduce Motion: skip the arc-fly and instead fade in-place
  // at the source tile position. Full motion keeps the arc + shrink.
  const reduceMotion = useReduceMotion();
  const progress = useSharedValue(0);
  const fromX = ghost.from.x + ghost.from.width / 2 - ghost.size / 2;
  const fromY = ghost.from.y + ghost.from.height / 2 - ghost.size / 2;
  const toX = ghost.to.x + ghost.to.width / 2 - ghost.size / 2;
  const toY = ghost.to.y + ghost.to.height / 2 - ghost.size / 2;

  useEffect(() => {
    progress.value = withTiming(
      1,
      {
        duration: reduceMotion ? animation.durReduced : 430,
        easing: reduceMotion ? undefined : ReanimatedEasing.bezier(0.22, 1, 0.36, 1),
      },
      finished => {
        if (finished) runOnJS(onDone)(ghost.id);
      },
    );
  }, [ghost.id, onDone, progress, reduceMotion]);

  const animatedStyle = useAnimatedStyle(() => {
    if (reduceMotion) {
      // Fade in-place only — no translate, no shrink.
      return { opacity: 0.55 * (1 - progress.value) };
    }
    return {
      opacity: 0.55 * (1 - progress.value),
      transform: [
        { translateX: fromX + (toX - fromX) * progress.value },
        { translateY: fromY + (toY - fromY) * progress.value },
        { scale: 1 - 0.55 * progress.value },
      ],
    };
  });

  // Folder and word tiles now share the same square footprint, so the
  // ghost clone tracks the unified size directly. `TILE_HEIGHT_RATIO`
  // stays available in case we later differentiate kinds again.
  const cloneHeight = Math.round(ghost.size * TILE_HEIGHT_RATIO);

  return (
    <Reanimated.View
      pointerEvents="none"
      style={[
        styles.ghostTile,
        {
          width: ghost.size,
          height: cloneHeight,
          // RM: position absolutely at the source tile so the fade
          // happens where the tile actually is, not at the origin.
          ...(reduceMotion ? { left: fromX, top: fromY } : {}),
        },
        animatedStyle,
      ]}
    >
      {ghost.tile.kind === 'folder' ? (
        <BoardFolderTile tile={ghost.tile} width={ghost.size} height={ghost.size} />
      ) : (
        <BoardWordTile tile={ghost.tile} width={ghost.size} height={ghost.size} />
      )}
    </Reanimated.View>
  );
}

// ── GridOverlay ──────────────────────────────────────────────────────────────
// Renders dashed slot outlines behind all tiles. Opacity is driven by a
// Reanimated shared value so it fades in/out with a spring when edit mode
// toggles — no JS-thread involvement during the transition.
function GridOverlay({
  cols,
  totalSlots,
  tileSize,
  gap,
  rowGap,
  opacity,
  alwaysVisible = false,
}: {
  cols: number;
  totalSlots: number;
  tileSize: number;
  gap: number;
  rowGap?: number;
  opacity: SharedValue<number>;
  alwaysVisible?: boolean;
}) {
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: alwaysVisible ? 1 : opacity.value,
  }));
  const colStep = tileSize + gap;
  const rowStep = tileSize + (rowGap ?? gap);
  return (
    <Reanimated.View
      pointerEvents="none"
      style={[StyleSheet.absoluteFillObject, animatedStyle]}
    >
      {Array.from({ length: totalSlots }).map((_, slot) => {
        const col = slot % cols;
        const row = Math.floor(slot / cols);
        return (
          <View
            key={slot}
            style={{
              position: 'absolute',
              left: col * colStep,
              top: row * rowStep,
              width: tileSize,
              height: tileSize,
              borderWidth: 1.5,
              borderStyle: 'dashed',
              borderRadius: 14,
              borderColor: alwaysVisible
                ? 'rgba(120, 140, 200, 0.38)'
                : 'rgba(100, 130, 255, 0.55)',
              backgroundColor: alwaysVisible
                ? 'rgba(120, 140, 200, 0.06)'
                : 'rgba(100, 130, 255, 0.08)',
            }}
          />
        );
      })}
    </Reanimated.View>
  );
}

// ── DragPlaceholder ───────────────────────────────────────────────────────────
// A highlighted slot outline that tracks the snap target while the user drags.
// Driven entirely from the UI thread via snapSlot shared value.
function DragPlaceholder({
  snapSlot,
  dragFw,
  dragFh,
  tileSize,
  gap,
  rowGap,
  cols,
}: {
  snapSlot: SharedValue<number>;
  /** FINE units of the dragged tile — highlight cells = ceil(fw/2) × ceil(fh/2). */
  dragFw: SharedValue<number>;
  dragFh: SharedValue<number>;
  tileSize: number;
  gap: number;
  rowGap?: number;
  cols: number;
}) {
  const colStep = tileSize + gap;
  const rowStep = tileSize + (rowGap ?? gap);
  // Render a single wrapper positioned at snapSlot, then N×M individual
  // cell outlines inside it so the highlight matches the dragged tile's
  // footprint (e.g. a 2×2 shows 4 cells).
  const wrapperStyle = useAnimatedStyle(() => {
    if (snapSlot.value < 0) return { opacity: 0, transform: [] };
    const col = snapSlot.value % cols;
    const row = Math.floor(snapSlot.value / cols);
    return {
      opacity: 1,
      transform: [
        { translateX: col * colStep },
        { translateY: row * rowStep },
      ],
    };
  });
  // Cell grid style: recomputed when dragFw/dragFh change (which happens
  // on drag start). Uses fixed width/height (up to MAX_FW) to render all
  // cells; opacity of cells beyond the tile's footprint drops to 0.
  const cellsStyle = useAnimatedStyle(() => {
    const cCols = Math.max(1, Math.ceil(dragFw.value / 2));
    const cRows = Math.max(1, Math.ceil(dragFh.value / 2));
    return {
      width: cCols * colStep - gap,
      height: cRows * rowStep - (rowGap ?? gap),
    };
  });
  // For each possible cell in the max footprint, decide whether it's active.
  const maxC = Math.ceil(MAX_FW / 2);
  return (
    <Reanimated.View
      pointerEvents="none"
      style={[
        { position: 'absolute', left: 0, top: 0 },
        wrapperStyle,
        cellsStyle,
      ]}
    >
      {Array.from({ length: maxC * maxC }).map((_, i) => {
        const c = i % maxC;
        const r = Math.floor(i / maxC);
        return (
          <MultiCell
            key={i}
            c={c}
            r={r}
            dragFw={dragFw}
            dragFh={dragFh}
            tileSize={tileSize}
            colStep={colStep}
            rowStep={rowStep}
          />
        );
      })}
    </Reanimated.View>
  );
}

// One highlight cell — only visible when it falls inside the dragged tile's
// coarse footprint. Drives visibility from dragFw/dragFh so highlight cell
// count matches the tile's size on every drag start.
function MultiCell({
  c, r, dragFw, dragFh, tileSize, colStep, rowStep,
}: {
  c: number; r: number;
  dragFw: SharedValue<number>;
  dragFh: SharedValue<number>;
  tileSize: number;
  colStep: number;
  rowStep: number;
}) {
  const style = useAnimatedStyle(() => {
    const cCols = Math.max(1, Math.ceil(dragFw.value / 2));
    const cRows = Math.max(1, Math.ceil(dragFh.value / 2));
    const active = c < cCols && r < cRows;
    return { opacity: active ? 1 : 0 };
  });
  return (
    <Reanimated.View
      pointerEvents="none"
      style={[
        {
          position: 'absolute',
          left: c * colStep,
          top: r * rowStep,
          width: tileSize,
          height: tileSize,
          borderRadius: 14,
          borderWidth: 2.5,
          borderStyle: 'dashed',
          borderColor: 'rgba(60, 120, 255, 0.65)',
          backgroundColor: 'rgba(60, 120, 255, 0.10)',
        },
        style,
      ]}
    />
  );
}

// ── SourceGhost ───────────────────────────────────────────────────────────────
// A low-opacity card outline that hovers at the slot the dragged tile left
// behind — the "phantom" trail that shows where the displaced tile will land.
function SourceGhost({
  dragSourceSlot: sourceSlot,
  tileSize,
  gap,
  rowGap,
  cols,
}: {
  dragSourceSlot: SharedValue<number>;
  tileSize: number;
  gap: number;
  rowGap?: number;
  cols: number;
}) {
  const colStep = tileSize + gap;
  const rowStep = tileSize + (rowGap ?? gap);
  const animatedStyle = useAnimatedStyle(() => {
    if (sourceSlot.value < 0) return { opacity: 0, transform: [] };
    const col = sourceSlot.value % cols;
    const row = Math.floor(sourceSlot.value / cols);
    return {
      opacity: 1,
      transform: [
        { translateX: col * colStep },
        { translateY: row * rowStep },
      ],
    };
  });
  return (
    <Reanimated.View
      pointerEvents="none"
      style={[
        {
          position: 'absolute',
          left: 0,
          top: 0,
          width: tileSize,
          height: tileSize,
          borderRadius: 14,
          borderWidth: 1.5,
          borderStyle: 'dashed',
          borderColor: 'rgba(180, 180, 200, 0.45)',
          backgroundColor: 'rgba(180, 180, 200, 0.08)',
        },
        animatedStyle,
      ]}
    />
  );
}

// Rect in board-content coordinate space (relative to the ScrollView's
// content container). Kept for type-compat; no longer used for drag logic.
type SlotRect = { x: number; y: number; width: number; height: number };
type TileRectsRef = React.MutableRefObject<Record<string, SlotRect>>;

// ── ResizeHandles ──────────────────────────────────────────────────────────
// Renders 4 edge pills + 4 corner circles around a tile in edit mode.
// ALL handles are functional: right/bottom grow in 44px (FINE) steps;
// left/top move the tile's anchor slot, so they snap in whole coarse cells
// (88px) to keep every placement on the grid. Corners combine both axes.
const HANDLE_PILL_LEN = 28;
const HANDLE_PILL_THICK = 8;
const HANDLE_CORNER_SIZE = 14;
// One coarse grid cell in px — the left/top resize step.
const CELL = FINE * 2;

function ResizeHandles({
  editMode,
  width,
  height,
  fw,
  fh,
  onResize,
  isDragging: _isDragging,
  tileLabel,
}: {
  editMode: boolean;
  width: number;
  height: number;
  fw: number;
  fh: number;
  /**
   * dCols/dRows — coarse cells the tile's anchor moves LEFT/UP (positive
   * when growing from the left/top edge, negative when shrinking back).
   * The parent clamps against the grid edges and commits the slot shift.
   */
  onResize: (newFw: number, newFh: number, dCols: number, dRows: number) => void;
  isDragging: SharedValue<number>;
  tileLabel: string;
}) {
  const t = useTheme();
  const reduceMotion = useReduceMotion();

  // Preview offsets — shared values that grow/shrink the tile visually
  // during drag before the resize is committed to state.
  const previewW = useSharedValue(0); // right edge (FINE steps)
  const previewH = useSharedValue(0); // bottom edge (FINE steps)
  const previewL = useSharedValue(0); // left edge (CELL steps, negative = grow)
  const previewT = useSharedValue(0); // top edge (CELL steps, negative = grow)
  // Track last-fired haptic step so we only pulse on step crossings.
  const lastHapticStepW = useSharedValue(0);
  const lastHapticStepH = useSharedValue(0);
  const lastHapticStepL = useSharedValue(0);
  const lastHapticStepT = useSharedValue(0);

  const rightPan = useMemo(() => Gesture.Pan()
    .onStart(() => { previewW.value = 0; lastHapticStepW.value = 0; })
    .onUpdate((e) => {
      const steps = Math.round(e.translationX / FINE);
      if (steps !== lastHapticStepW.value) {
        lastHapticStepW.value = steps;
        runOnJS(hapticSelection)();
      }
      previewW.value = steps * FINE;
    })
    .onEnd(() => {
      const deltaSteps = Math.round(previewW.value / FINE);
      const newFw = Math.max(2, Math.min(MAX_FW, fw + deltaSteps));
      previewW.value = reduceMotion ? 0 : withTiming(0, { duration: 120 });
      if (newFw !== fw) runOnJS(onResize)(newFw, fh, 0, 0);
    })
  , [fw, fh, onResize, previewW]);

  const bottomPan = useMemo(() => Gesture.Pan()
    .onStart(() => { previewH.value = 0; lastHapticStepH.value = 0; })
    .onUpdate((e) => {
      const steps = Math.round(e.translationY / FINE);
      if (steps !== lastHapticStepH.value) {
        lastHapticStepH.value = steps;
        runOnJS(hapticSelection)();
      }
      previewH.value = steps * FINE;
    })
    .onEnd(() => {
      const deltaSteps = Math.round(previewH.value / FINE);
      const newFh = Math.max(2, Math.min(MAX_FW, fh + deltaSteps));
      previewH.value = reduceMotion ? 0 : withTiming(0, { duration: 120 });
      if (newFh !== fh) runOnJS(onResize)(fw, newFh, 0, 0);
    })
  , [fw, fh, onResize, previewH]);

  const cornerPan = useMemo(() => Gesture.Pan()
    .onStart(() => {
      previewW.value = 0; previewH.value = 0;
      lastHapticStepW.value = 0; lastHapticStepH.value = 0;
    })
    .onUpdate((e) => {
      const sw = Math.round(e.translationX / FINE);
      const sh = Math.round(e.translationY / FINE);
      if (sw !== lastHapticStepW.value || sh !== lastHapticStepH.value) {
        lastHapticStepW.value = sw;
        lastHapticStepH.value = sh;
        runOnJS(hapticSelection)();
      }
      previewW.value = sw * FINE;
      previewH.value = sh * FINE;
    })
    .onEnd(() => {
      const dw = Math.round(previewW.value / FINE);
      const dh = Math.round(previewH.value / FINE);
      const newFw = Math.max(2, Math.min(MAX_FW, fw + dw));
      const newFh = Math.max(2, Math.min(MAX_FW, fh + dh));
      previewW.value = withTiming(0, { duration: 120 });
      previewH.value = withTiming(0, { duration: 120 });
      if (newFw !== fw || newFh !== fh) runOnJS(onResize)(newFw, newFh, 0, 0);
    })
  , [fw, fh, onResize, previewW, previewH]);

  // ── Left / top edges — anchor-shifting, whole-cell steps ──
  const leftPan = useMemo(() => Gesture.Pan()
    .onStart(() => { previewL.value = 0; lastHapticStepL.value = 0; })
    .onUpdate((e) => {
      const steps = Math.round(-e.translationX / CELL); // + = grow leftwards
      if (steps !== lastHapticStepL.value) {
        lastHapticStepL.value = steps;
        runOnJS(hapticSelection)();
      }
      previewL.value = -steps * CELL;
    })
    .onEnd(() => {
      const cells = Math.round(-previewL.value / CELL);
      previewL.value = reduceMotion ? 0 : withTiming(0, { duration: 120 });
      const newFw = Math.max(2, Math.min(MAX_FW, fw + cells * 2));
      const applied = (newFw - fw) / 2;
      if (applied !== 0) runOnJS(onResize)(newFw, fh, applied, 0);
    })
  , [fw, fh, onResize, previewL, reduceMotion, lastHapticStepL]);

  const topPan = useMemo(() => Gesture.Pan()
    .onStart(() => { previewT.value = 0; lastHapticStepT.value = 0; })
    .onUpdate((e) => {
      const steps = Math.round(-e.translationY / CELL); // + = grow upwards
      if (steps !== lastHapticStepT.value) {
        lastHapticStepT.value = steps;
        runOnJS(hapticSelection)();
      }
      previewT.value = -steps * CELL;
    })
    .onEnd(() => {
      const cells = Math.round(-previewT.value / CELL);
      previewT.value = reduceMotion ? 0 : withTiming(0, { duration: 120 });
      const newFh = Math.max(2, Math.min(MAX_FW, fh + cells * 2));
      const applied = (newFh - fh) / 2;
      if (applied !== 0) runOnJS(onResize)(fw, newFh, 0, applied);
    })
  , [fw, fh, onResize, previewT, reduceMotion, lastHapticStepT]);

  // ── Remaining corners — combine the two adjacent edge behaviours ──
  const tlCornerPan = useMemo(() => Gesture.Pan()
    .onStart(() => {
      previewL.value = 0; previewT.value = 0;
      lastHapticStepL.value = 0; lastHapticStepT.value = 0;
    })
    .onUpdate((e) => {
      const sc = Math.round(-e.translationX / CELL);
      const sr = Math.round(-e.translationY / CELL);
      if (sc !== lastHapticStepL.value || sr !== lastHapticStepT.value) {
        lastHapticStepL.value = sc;
        lastHapticStepT.value = sr;
        runOnJS(hapticSelection)();
      }
      previewL.value = -sc * CELL;
      previewT.value = -sr * CELL;
    })
    .onEnd(() => {
      const cCells = Math.round(-previewL.value / CELL);
      const rCells = Math.round(-previewT.value / CELL);
      previewL.value = reduceMotion ? 0 : withTiming(0, { duration: 120 });
      previewT.value = reduceMotion ? 0 : withTiming(0, { duration: 120 });
      const newFw = Math.max(2, Math.min(MAX_FW, fw + cCells * 2));
      const newFh = Math.max(2, Math.min(MAX_FW, fh + rCells * 2));
      const dCols = (newFw - fw) / 2;
      const dRows = (newFh - fh) / 2;
      if (dCols !== 0 || dRows !== 0) runOnJS(onResize)(newFw, newFh, dCols, dRows);
    })
  , [fw, fh, onResize, previewL, previewT, reduceMotion, lastHapticStepL, lastHapticStepT]);

  const trCornerPan = useMemo(() => Gesture.Pan()
    .onStart(() => {
      previewW.value = 0; previewT.value = 0;
      lastHapticStepW.value = 0; lastHapticStepT.value = 0;
    })
    .onUpdate((e) => {
      const sw = Math.round(e.translationX / FINE);
      const sr = Math.round(-e.translationY / CELL);
      if (sw !== lastHapticStepW.value || sr !== lastHapticStepT.value) {
        lastHapticStepW.value = sw;
        lastHapticStepT.value = sr;
        runOnJS(hapticSelection)();
      }
      previewW.value = sw * FINE;
      previewT.value = -sr * CELL;
    })
    .onEnd(() => {
      const dw = Math.round(previewW.value / FINE);
      const rCells = Math.round(-previewT.value / CELL);
      previewW.value = reduceMotion ? 0 : withTiming(0, { duration: 120 });
      previewT.value = reduceMotion ? 0 : withTiming(0, { duration: 120 });
      const newFw = Math.max(2, Math.min(MAX_FW, fw + dw));
      const newFh = Math.max(2, Math.min(MAX_FW, fh + rCells * 2));
      const dRows = (newFh - fh) / 2;
      if (newFw !== fw || dRows !== 0) runOnJS(onResize)(newFw, newFh, 0, dRows);
    })
  , [fw, fh, onResize, previewW, previewT, reduceMotion, lastHapticStepW, lastHapticStepT]);

  const blCornerPan = useMemo(() => Gesture.Pan()
    .onStart(() => {
      previewL.value = 0; previewH.value = 0;
      lastHapticStepL.value = 0; lastHapticStepH.value = 0;
    })
    .onUpdate((e) => {
      const sc = Math.round(-e.translationX / CELL);
      const sh = Math.round(e.translationY / FINE);
      if (sc !== lastHapticStepL.value || sh !== lastHapticStepH.value) {
        lastHapticStepL.value = sc;
        lastHapticStepH.value = sh;
        runOnJS(hapticSelection)();
      }
      previewL.value = -sc * CELL;
      previewH.value = sh * FINE;
    })
    .onEnd(() => {
      const cCells = Math.round(-previewL.value / CELL);
      const dh = Math.round(previewH.value / FINE);
      previewL.value = reduceMotion ? 0 : withTiming(0, { duration: 120 });
      previewH.value = reduceMotion ? 0 : withTiming(0, { duration: 120 });
      const newFw = Math.max(2, Math.min(MAX_FW, fw + cCells * 2));
      const newFh = Math.max(2, Math.min(MAX_FW, fh + dh));
      const dCols = (newFw - fw) / 2;
      if (dCols !== 0 || newFh !== fh) runOnJS(onResize)(newFw, newFh, dCols, 0);
    })
  , [fw, fh, onResize, previewL, previewH, reduceMotion, lastHapticStepL, lastHapticStepH]);

  // Style: right pill follows the tile's right edge + previewW growth
  const rightPillStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: previewW.value }],
  }));
  const bottomPillStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: previewH.value }],
  }));
  const brCornerStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: previewW.value },
      { translateY: previewH.value },
    ],
  }));
  const leftPillStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: previewL.value }],
  }));
  const topPillStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: previewT.value }],
  }));
  const tlCornerStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: previewL.value },
      { translateY: previewT.value },
    ],
  }));
  const trCornerStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: previewW.value },
      { translateY: previewT.value },
    ],
  }));
  const blCornerStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: previewL.value },
      { translateY: previewH.value },
    ],
  }));

  if (!editMode) return null;

  const handleColor = t.colors.primary;
  const handleBg = t.colors.surface;

  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="box-none">
      {/* Right edge pill — functional */}
      <GestureDetector gesture={rightPan}>
        <Reanimated.View
          hitSlop={12}
          accessible
          accessibilityRole="adjustable"
          accessibilityLabel={`Resize ${tileLabel} width`}
          style={[
            {
              position: 'absolute',
              right: -HANDLE_PILL_THICK / 2,
              top: height / 2 - HANDLE_PILL_LEN / 2,
              width: HANDLE_PILL_THICK,
              height: HANDLE_PILL_LEN,
              borderRadius: HANDLE_PILL_THICK / 2,
              backgroundColor: handleBg,
              borderWidth: 2,
              borderColor: handleColor,
            },
            rightPillStyle,
          ]}
        />
      </GestureDetector>

      {/* Bottom edge pill — functional */}
      <GestureDetector gesture={bottomPan}>
        <Reanimated.View
          hitSlop={12}
          accessible
          accessibilityRole="adjustable"
          accessibilityLabel={`Resize ${tileLabel} height`}
          style={[
            {
              position: 'absolute',
              bottom: -HANDLE_PILL_THICK / 2,
              left: width / 2 - HANDLE_PILL_LEN / 2,
              width: HANDLE_PILL_LEN,
              height: HANDLE_PILL_THICK,
              borderRadius: HANDLE_PILL_THICK / 2,
              backgroundColor: handleBg,
              borderWidth: 2,
              borderColor: handleColor,
            },
            bottomPillStyle,
          ]}
        />
      </GestureDetector>

      {/* Bottom-right corner — functional (grows both dimensions) */}
      <GestureDetector gesture={cornerPan}>
        <Reanimated.View
          hitSlop={10}
          accessible
          accessibilityRole="adjustable"
          accessibilityLabel={`Resize ${tileLabel}`}
          style={[
            {
              position: 'absolute',
              right: -HANDLE_CORNER_SIZE / 2,
              bottom: -HANDLE_CORNER_SIZE / 2,
              width: HANDLE_CORNER_SIZE,
              height: HANDLE_CORNER_SIZE,
              borderRadius: HANDLE_CORNER_SIZE / 2,
              backgroundColor: handleColor,
              borderWidth: 2,
              borderColor: handleBg,
            },
            brCornerStyle,
          ]}
        />
      </GestureDetector>

      {/* Left edge pill — functional (whole-cell steps, shifts anchor) */}
      <GestureDetector gesture={leftPan}>
        <Reanimated.View
          hitSlop={12}
          accessible
          accessibilityRole="adjustable"
          accessibilityLabel={`Resize ${tileLabel} from the left edge`}
          style={[
            {
              position: 'absolute',
              left: -HANDLE_PILL_THICK / 2,
              top: height / 2 - HANDLE_PILL_LEN / 2,
              width: HANDLE_PILL_THICK,
              height: HANDLE_PILL_LEN,
              borderRadius: HANDLE_PILL_THICK / 2,
              backgroundColor: handleBg,
              borderWidth: 2,
              borderColor: handleColor,
            },
            leftPillStyle,
          ]}
        />
      </GestureDetector>

      {/* Top edge pill — functional (whole-cell steps, shifts anchor) */}
      <GestureDetector gesture={topPan}>
        <Reanimated.View
          hitSlop={12}
          accessible
          accessibilityRole="adjustable"
          accessibilityLabel={`Resize ${tileLabel} from the top edge`}
          style={[
            {
              position: 'absolute',
              top: -HANDLE_PILL_THICK / 2,
              left: width / 2 - HANDLE_PILL_LEN / 2,
              width: HANDLE_PILL_LEN,
              height: HANDLE_PILL_THICK,
              borderRadius: HANDLE_PILL_THICK / 2,
              backgroundColor: handleBg,
              borderWidth: 2,
              borderColor: handleColor,
            },
            topPillStyle,
          ]}
        />
      </GestureDetector>

      {/* Top-left corner — functional */}
      <GestureDetector gesture={tlCornerPan}>
        <Reanimated.View
          hitSlop={10}
          accessible
          accessibilityRole="adjustable"
          accessibilityLabel={`Resize ${tileLabel} from the top left corner`}
          style={[
            {
              position: 'absolute',
              left: -HANDLE_CORNER_SIZE / 2,
              top: -HANDLE_CORNER_SIZE / 2,
              width: HANDLE_CORNER_SIZE,
              height: HANDLE_CORNER_SIZE,
              borderRadius: HANDLE_CORNER_SIZE / 2,
              backgroundColor: handleColor,
              borderWidth: 2,
              borderColor: handleBg,
            },
            tlCornerStyle,
          ]}
        />
      </GestureDetector>

      {/* Top-right corner — functional */}
      <GestureDetector gesture={trCornerPan}>
        <Reanimated.View
          hitSlop={10}
          accessible
          accessibilityRole="adjustable"
          accessibilityLabel={`Resize ${tileLabel} from the top right corner`}
          style={[
            {
              position: 'absolute',
              right: -HANDLE_CORNER_SIZE / 2,
              top: -HANDLE_CORNER_SIZE / 2,
              width: HANDLE_CORNER_SIZE,
              height: HANDLE_CORNER_SIZE,
              borderRadius: HANDLE_CORNER_SIZE / 2,
              backgroundColor: handleColor,
              borderWidth: 2,
              borderColor: handleBg,
            },
            trCornerStyle,
          ]}
        />
      </GestureDetector>

      {/* Bottom-left corner — functional */}
      <GestureDetector gesture={blCornerPan}>
        <Reanimated.View
          hitSlop={10}
          accessible
          accessibilityRole="adjustable"
          accessibilityLabel={`Resize ${tileLabel} from the bottom left corner`}
          style={[
            {
              position: 'absolute',
              left: -HANDLE_CORNER_SIZE / 2,
              bottom: -HANDLE_CORNER_SIZE / 2,
              width: HANDLE_CORNER_SIZE,
              height: HANDLE_CORNER_SIZE,
              borderRadius: HANDLE_CORNER_SIZE / 2,
              backgroundColor: handleColor,
              borderWidth: 2,
              borderColor: handleBg,
            },
            blCornerStyle,
          ]}
        />
      </GestureDetector>
    </View>
  );
}

interface BoardTileButtonProps {
  tile: BoardTile;
  /** Coarse slot size (88) — used for drag-snap grid math. */
  size: number;
  /** Actual visual width (default = size). Enables non-square resized tiles. */
  width?: number;
  /** Actual visual height (default = size). */
  height?: number;
  /** Width in FINE units (44px each). Default 2 = 88px. */
  fw?: number;
  /** Height in FINE units (44px each). Default 2 = 88px. */
  fh?: number;
  onPress: (rect: WindowRect | null) => void;
  onMeasuredPress?: () => void;
  resolved?: ResolvedSymbol;
  // ── Drag + edit-mode plumbing ──
  editMode?: boolean;
  onLongPressEnterEdit?: (tileId: string) => void;
  /** Slot index of this tile in the grid (0-based, row-major). */
  slot?: number;
  /** Total tile count for clamping the snap target. */
  totalSlots?: number;
  /** Called on the JS thread after the tile springs to its new slot. */
  onMoveToSlot?: (tileId: string, targetSlot: number) => void;
  /** Shared value written on every drag frame so DragPlaceholder tracks snap target. */
  snapSlot?: SharedValue<number>;
  /** Shared value set to this tile's slot when it starts dragging, cleared on drop. */
  dragSourceSlot?: SharedValue<number>;
  /** Written to on drag start: the dragged tile's fw/fh so DragPlaceholder highlights match its footprint. */
  dragFw?: SharedValue<number>;
  dragFh?: SharedValue<number>;
  onHide?: (tile: BoardTile) => void;
  onAccessibilityReorder?: (tileId: string, direction: 'forward' | 'back') => void;
  /** Called when the user commits a resize via the corner/edge handles. */
  onResize?: (tileId: string, newFw: number, newFh: number, dCols: number, dRows: number) => void;
  jiggle?: SharedValue<number>;
  /** Motor Access Mode: called on tile tap in edit mode for action sheet (Priority 5). */
  onEditTap?: (tileId: string) => void;
}

function BoardTileButton({
  tile,
  size,
  width,
  height,
  fw = 2,
  fh = 2,
  onPress,
  onMeasuredPress,
  resolved,
  editMode = false,
  onLongPressEnterEdit,
  slot = 0,
  totalSlots = 1,
  onMoveToSlot,
  snapSlot,
  dragSourceSlot,
  dragFw,
  dragFh,
  onHide,
  onAccessibilityReorder,
  onResize,
  jiggle,
  onEditTap,
}: BoardTileButtonProps) {
  // Actual visual dimensions default to a square of `size` for backwards
  // compatibility with existing single-slot tiles.
  const tileWidth = width ?? size;
  const tileHeightPx = height ?? size;
  const t = useTheme();
  const pressableRef = useRef<View>(null);
  const scale = useRef(new RNAnimated.Value(1)).current;
  const tileOpacity = useRef(new RNAnimated.Value(1)).current;
  const reduceMotion = useReduceMotion();

  // ── Drag state (Reanimated SVs so the gesture runs on the UI thread)
  const dragX = useSharedValue(0);
  const dragY = useSharedValue(0);
  const lifted = useSharedValue(0);
  // ── Live-displacement state ────────────────────────────────────────────
  // Non-dragging tiles spring to the dragger's source slot when they are
  // the hover target. This is the iOS app-rearrange "shuffle" behaviour:
  // tile B moves into tile A's spot while A hovers over B. Release commits
  // the data swap; leaving the hover springs B back to its home slot.
  const displaceX = useSharedValue(0);
  const displaceY = useSharedValue(0);

  // ── Live-swap slot tracking ────────────────────────────────────────────
  // currentSlotSV mirrors the `slot` prop on the UI thread so the pan
  // gesture can always read the latest slot without being recreated on
  // every live swap (which would drop the gesture mid-drag).
  const currentSlotSV = useSharedValue(slot);
  // lastSwapSlotSV gates runOnJS calls — only fires when the hover target
  // genuinely crosses a new slot boundary.
  const lastSwapSlotSV = useSharedValue(-1);

  // Keep currentSlotSV in sync with the prop (runs on JS thread, fast).
  useEffect(() => {
    currentSlotSV.value = slot;
  }, [slot, currentSlotSV]);

  // After a swap commits and the `slot` prop changes, the absolutely-
  // positioned container moves to the new slot's coords. We must snap
  // dragX/dragY back to 0 so the tile renders AT the new slot, not
  // offset from it. Otherwise the leftover gesture translation stacks
  // on top of the new slot position — a 2-row drag visually looks like
  // a 4-row drag.
  const prevSlotRef = useRef(slot);
  useLayoutEffect(() => {
    const prev = prevSlotRef.current;
    prevSlotRef.current = slot;
    if (prev !== slot) {
      dragX.value = 0;
      dragY.value = 0;
      // Also snap displacement to 0 — after a commit the displaced tile
      // is now AT the source slot for real, no offset needed.
      displaceX.value = 0;
      displaceY.value = 0;
    }
  });

  // ── Live shuffle reaction ─────────────────────────────────────────────
  // Watches snapSlot + dragSourceSlot. When this tile is the hover target
  // and is NOT the one being dragged, spring it to the dragger's source
  // slot. When the hover leaves, spring back to home.
  //
  // CRITICAL: reaction dependencies are ENCODED AS PRIMITIVES (a packed
  // integer for X, one for Y), not objects. Returning `{ snap, src, ... }`
  // creates a new object every read, and Reanimated's default equality
  // check (Object.is) treats every new reference as a change — that
  // restarts withSpring on every frame and the tile never converges to
  // its displaced position until the drag ends. Primitives fire the
  // reaction ONLY on genuine transitions.
  const SHUFFLE_SPRING = { damping: 18, stiffness: 220, mass: 0.6 } as const;

  // Encode "where should I visually sit right now?" as a single number.
  // Any tile-relevant state change (snap crosses into or out of this
  // tile, drag source changes, dragger status flips) produces a distinct
  // packed value. `useDerivedValue` runs on the UI thread and only
  // notifies dependents when the value changes.
  const targetDX = useDerivedValue(() => {
    if (lifted.value > 0.1) return 0; // I'm the dragger — no displacement
    const snap = snapSlot ? snapSlot.value : -1;
    const src = dragSourceSlot ? dragSourceSlot.value : -1;
    const mine = currentSlotSV.value;
    if (snap < 0 || src < 0) return 0;
    if (snap !== mine) return 0;    // hover is on a different tile
    if (src === mine) return 0;     // dragger hovering its own home
    const myCol = mine % BOARD_COLUMNS;
    const srcCol = src % BOARD_COLUMNS;
    return (srcCol - myCol) * (size + TILE_GAP);
  });
  const targetDY = useDerivedValue(() => {
    if (lifted.value > 0.1) return 0;
    const snap = snapSlot ? snapSlot.value : -1;
    const src = dragSourceSlot ? dragSourceSlot.value : -1;
    const mine = currentSlotSV.value;
    if (snap < 0 || src < 0) return 0;
    if (snap !== mine) return 0;
    if (src === mine) return 0;
    const myRow = Math.floor(mine / BOARD_COLUMNS);
    const srcRow = Math.floor(src / BOARD_COLUMNS);
    return (srcRow - myRow) * (size + TILE_V_GAP);
  });

  useAnimatedReaction(
    () => targetDX.value,
    (target, prev) => {
      if (target !== prev) {
        displaceX.value = withSpring(target, SHUFFLE_SPRING);
      }
    },
  );
  useAnimatedReaction(
    () => targetDY.value,
    (target, prev) => {
      if (target !== prev) {
        displaceY.value = withSpring(target, SHUFFLE_SPRING);
      }
    },
  );

  const animateTo = useCallback((toValue: number) => {
    if (reduceMotion) {
      RNAnimated.timing(tileOpacity, {
        toValue: toValue < 1 ? 0.7 : 1,
        duration: toValue < 1 ? animation.durFast : animation.durRelease,
        useNativeDriver: true,
      }).start();
      return;
    }
    RNAnimated.spring(scale, {
      toValue,
      speed: 30,
      bounciness: 7,
      useNativeDriver: true,
    }).start();
  }, [reduceMotion, scale, tileOpacity]);

  const isNav = tile.id === 'back' || tile.id === 'home';
  const isDraggable = editMode && !isNav;
  // All tiles are perfectly square: the gesture area, wrapper, and content
  // all match `size`. This prevents the old 1.25× height wrapper from
  // overflowing into the row below and misaligning the grid.
  const tileHeight = tileHeightPx;

  const handlePress = useCallback(() => {
    if (editMode) {
      // Motor Access Mode: tile taps show context menu instead of doing nothing
      if (onEditTap) { onEditTap(tile.id); return; }
      return;
    }
    onMeasuredPress?.();
    pressableRef.current?.measureInWindow((x, y, width, height) => {
      onPress({ x, y, width, height });
    });
  }, [editMode, onEditTap, onMeasuredPress, onPress, tile.id]);

  // Item 7 — word-type hint for VoiceOver (principle 23: don't rely on
  // colour alone). Folder tiles already say "Open …" in the label.
  const a11yHint = tile.kind === 'word' && tile.wordType
    ? `Word type: ${tile.wordType}`
    : undefined;

  // ── Drag gesture — swap on release, no spring/rubber-band ────────────────
  // Uses currentSlotSV so the gesture closure is never recreated mid-drag.
  // Swap is committed only on release for precise, intentional placement.
  const SNAP_TIMING = { duration: 160, easing: ReanimatedEasing.out(ReanimatedEasing.quad) } as const;

  // Single JS callback fired from the timing-end worklet. Commits the
  // swap, then defers clearing snapSlot / dragSourceSlot to the next
  // animation frame — by then React has committed the new slot props
  // and each tile's useLayoutEffect has hard-reset displaceX/Y to 0.
  // Clearing earlier would let the shuffle reaction fire a redundant
  // spring-back animation on the displaced tile, causing a visual jitter.
  const finalizeSwap = useCallback((tileId: string, target: number) => {
    onMoveToSlot?.(tileId, target);
    requestAnimationFrame(() => {
      if (snapSlot) snapSlot.value = -1;
      if (dragSourceSlot) dragSourceSlot.value = -1;
    });
  }, [onMoveToSlot, snapSlot, dragSourceSlot]);

  const pan = useMemo(() => Gesture.Pan()
    .enabled(isDraggable)
    .onStart(() => {
      lifted.value = withTiming(1, { duration: 100 });
      // Record source slot — drives both the SourceGhost outline AND
      // the live-shuffle reaction in sibling tiles.
      if (dragSourceSlot) dragSourceSlot.value = currentSlotSV.value;
      // Publish the dragged tile's size so DragPlaceholder highlights match.
      if (dragFw) dragFw.value = fw;
      if (dragFh) dragFh.value = fh;
      // Start "hovering own slot" so the first slot crossing is detected
      // cleanly and no stale snapSlot from a previous drag bleeds in.
      if (snapSlot) snapSlot.value = currentSlotSV.value;
      // Haptic on pickup — matches iOS app-rearrange "lift" feedback.
      runOnJS(hapticSelection)();
    })
    .onUpdate((e) => {
      dragX.value = e.translationX;
      dragY.value = e.translationY;

      // Compute snap target and update DragPlaceholder + hover-dim effect.
      // Multi-slot tiles (fw>2 or fh>2) can't go past the right edge or
      // bottom edge — their coarse footprint (cCols × cRows) must fit.
      const mySlot = currentSlotSV.value;
      const myCol = mySlot % BOARD_COLUMNS;
      const myRow = Math.floor(mySlot / BOARD_COLUMNS);
      const maxRow = Math.floor((totalSlots - 1) / BOARD_COLUMNS);
      const colStep = size + TILE_GAP;
      const rowStep = size + TILE_V_GAP;
      const cCols = Math.max(1, Math.ceil(fw / 2));
      const cRows = Math.max(1, Math.ceil(fh / 2));
      const tCol = Math.max(0, Math.min(BOARD_COLUMNS - cCols,
        Math.round(myCol + e.translationX / colStep)));
      const tRow = Math.max(0, Math.min(maxRow - (cRows - 1),
        Math.round(myRow + e.translationY / rowStep)));
      const hoverSlot = Math.min(totalSlots - 1, tRow * BOARD_COLUMNS + tCol);
      if (snapSlot) {
        // Fire a selection-style haptic each time the hover crosses a
        // new slot boundary (excluding our own home slot). lastSwapSlotSV
        // gates duplicates so we don't fire on every frame.
        if (hoverSlot !== snapSlot.value && hoverSlot !== mySlot) {
          runOnJS(hapticSelection)();
        }
        snapSlot.value = hoverSlot;
      }
    })
    .onEnd((_e) => {
      const mySlot = currentSlotSV.value;
      const myCol = mySlot % BOARD_COLUMNS;
      const myRow = Math.floor(mySlot / BOARD_COLUMNS);
      const colStep = size + TILE_GAP;
      const rowStep = size + TILE_V_GAP;

      // Use the LAST highlighted snapSlot (computed fresh each onUpdate frame)
      // rather than re-deriving from e.translationX/Y — finger-lift drift
      // can shift the translation by a few px, putting the target one slot off.
      const snapped = snapSlot && snapSlot.value >= 0 ? snapSlot.value : mySlot;
      const target = snapped;
      const tCol = target % BOARD_COLUMNS;
      const tRow = Math.floor(target / BOARD_COLUMNS);

      lifted.value = withTiming(0, { duration: 120 });

      if (target !== mySlot && onMoveToSlot) {
        // Glide to target slot, then commit swap. snapSlot/dragSourceSlot
        // are KEPT until the commit lands so the displaced tile stays at
        // the source position. Once slot props update, each tile's
        // useLayoutEffect resets its own displacement to 0 cleanly.
        const dX = (tCol - myCol) * colStep;
        const dY = (tRow - myRow) * rowStep;
        dragX.value = withTiming(dX, SNAP_TIMING);
        dragY.value = withTiming(dY, SNAP_TIMING, (finished) => {
          if (!finished) return;
          runOnJS(finalizeSwap)(tile.id, target);
        });
      } else {
        // Return cleanly to home slot.
        if (snapSlot) snapSlot.value = -1;
        if (dragSourceSlot) dragSourceSlot.value = -1;
        dragX.value = withTiming(0, SNAP_TIMING);
        dragY.value = withTiming(0, SNAP_TIMING);
      }
    })
    // fw/fh MUST be deps — without them a resized tile publishes stale
    // dragFw/dragFh on its next drag and the highlight stays one cell.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    , [currentSlotSV, dragSourceSlot, dragX, dragY, finalizeSwap, isDraggable, lifted, onMoveToSlot, size, snapSlot, tile.id, totalSlots, fw, fh, dragFw, dragFh]);

  const animatedDragStyle = useAnimatedStyle(() => {
    // Jiggle drives a continuous gentle wobble during edit mode.
    // We only rotate when NOT dragging so the dragged tile stays visually stable.
    const rotateDeg = (!isDraggable || lifted.value < 0.1) && jiggle
      ? jiggle.value
      : 0;
    return {
      transform: [
        // Drag offset (only set on the dragger) + shuffle displacement
        // (only set on hovered-over tiles). They never both apply.
        { translateX: dragX.value + displaceX.value },
        { translateY: dragY.value + displaceY.value },
        { scale: 1 + lifted.value * 0.06 },
        { rotate: `${rotateDeg}deg` },
      ],
      zIndex: lifted.value > 0 ? 100 : 1,
    };
  });

  const handleAccessibilityAction = useCallback((event: AccessibilityActionEvent) => {
    if (!onAccessibilityReorder) return;
    if (event.nativeEvent.actionName === 'increment') {
      onAccessibilityReorder(tile.id, 'forward');
    } else if (event.nativeEvent.actionName === 'decrement') {
      onAccessibilityReorder(tile.id, 'back');
    }
  }, [onAccessibilityReorder, tile.id]);

  const accessibilityActions = isDraggable
    ? [
        { name: 'increment' as const, label: 'Move forward' },
        { name: 'decrement' as const, label: 'Move back' },
      ]
    : undefined;

  const tileContent = (
    <>
      {isNav ? (
        <BoardNavTile tile={tile} size={size} />
      ) : tile.kind === 'folder' ? (
        <BoardFolderTile tile={tile} width={tileWidth} height={tileHeightPx} resolved={resolved} />
      ) : (
        <BoardWordTile tile={tile} width={tileWidth} height={tileHeightPx} resolved={resolved} />
      )}
      {isDraggable && onHide && !tile.isProtected ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Remove ${tile.label}`}
          onPress={() => onHide(tile)}
          hitSlop={10}
          style={[styles.deleteBadge, { backgroundColor: t.colors.danger }]}
        >
          <Icon name="close" size={16} color={t.colors.surface} />
        </Pressable>
      ) : null}
    </>
  );

  const inner = (
    <Reanimated.View
      style={[
        { width: tileWidth, height: tileHeight },
        animatedDragStyle,
      ]}
    >
      <RNAnimated.View style={{ flex: 1, transform: [{ scale }], opacity: tileOpacity }}>
        <Pressable
          ref={pressableRef}
          accessibilityRole="button"
          accessibilityLabel={
            isNav
              ? tile.label
              : tile.kind === 'folder'
                ? `Open ${tile.label}`
                : `Say ${tile.label}`
          }
          accessibilityHint={a11yHint}
          accessibilityActions={accessibilityActions}
          onAccessibilityAction={handleAccessibilityAction}
          onPress={handlePress}
          onLongPress={!editMode && !isNav ? () => onLongPressEnterEdit?.(tile.id) : undefined}
          delayLongPress={450}
          onPressIn={() => !editMode && animateTo(0.94)}
          onPressOut={() => !editMode && animateTo(1)}
          style={({ pressed: _pressed }) => [
            styles.tilePressable,
            isDraggable && [styles.tileEditOutline, { borderColor: t.colors.primary }],
          ]}
        >
          {tileContent}
        </Pressable>
      </RNAnimated.View>
      {/* Resize handles — visible in edit mode, absolute-positioned around
          the tile edges. All 4 edges + 4 corners are functional; left/top
          shift the anchor slot in whole cells. Nav tiles skip handles. */}
      {editMode && !isNav && onResize ? (
        <ResizeHandles
          editMode={editMode}
          width={tileWidth}
          height={tileHeight}
          fw={fw}
          fh={fh}
          isDragging={lifted}
          tileLabel={tile.label}
          onResize={(newFw, newFh, dCols, dRows) => onResize(tile.id, newFw, newFh, dCols, dRows)}
        />
      ) : null}
    </Reanimated.View>
  );

  if (isDraggable) {
    return <GestureDetector gesture={pan}>{inner}</GestureDetector>;
  }
  return inner;
}

const MemoBoardTileButton = React.memo(BoardTileButton);

const BoardTileCell = React.memo(function BoardTileCell({
  tile,
  size,
  width,
  height,
  fw,
  fh,
  slot,
  totalSlots,
  resolved,
  onTilePress,
  editMode,
  onLongPressEnterEdit,
  onMoveToSlot,
  onHide,
  onResize,
  snapSlot,
  dragSourceSlot,
  dragFw,
  dragFh,
  jiggle,
  onEditTap,
}: {
  tile: BoardTile;
  size: number;
  width?: number;
  height?: number;
  fw?: number;
  fh?: number;
  slot?: number;
  totalSlots?: number;
  resolved?: ResolvedSymbol;
  onTilePress: (tile: BoardTile, rect: WindowRect | null) => void;
  editMode?: boolean;
  onLongPressEnterEdit?: (tileId: string) => void;
  onMoveToSlot?: (tileId: string, targetSlot: number) => void;
  onHide?: (tile: BoardTile) => void;
  onResize?: (tileId: string, newFw: number, newFh: number, dCols: number, dRows: number) => void;
  snapSlot?: SharedValue<number>;
  dragSourceSlot?: SharedValue<number>;
  dragFw?: SharedValue<number>;
  dragFh?: SharedValue<number>;
  jiggle?: SharedValue<number>;
  onEditTap?: (tileId: string) => void;
}) {
  const handlePress = useCallback(
    (rect: WindowRect | null) => onTilePress(tile, rect),
    [onTilePress, tile],
  );
  return (
    <MemoBoardTileButton
      tile={tile}
      size={size}
      width={width}
      height={height}
      fw={fw}
      fh={fh}
      slot={slot}
      totalSlots={totalSlots}
      onPress={handlePress}
      resolved={resolved}
      editMode={editMode}
      onLongPressEnterEdit={onLongPressEnterEdit}
      onMoveToSlot={onMoveToSlot}
      onHide={onHide}
      onResize={onResize}
      snapSlot={snapSlot}
      dragSourceSlot={dragSourceSlot}
      dragFw={dragFw}
      dragFh={dragFh}
      jiggle={jiggle}
      onEditTap={onEditTap}
    />
  );
});

function TopNavTab({
  tab,
  active,
  onPress,
}: {
  tab: TopTab;
  active: boolean;
  onPress: () => void;
}) {
  const meta = TOP_TAB_META[tab];
  // Items 3 & 4 — RM: zero duration + no scale lift (principle 18).
  const reduceMotion = useReduceMotion();
  const t = useTheme();
  const idleColor = t.colors.textMuted;
  const activeColor = t.colors.text;

  // Single shared value drives both colour and scale so the active tab
  // brightens and lifts together. JS-driver because of the colour
  // interpolation; only 1–4 tabs animate at a time so this is fine.
  const activeAnim = useRef(new RNAnimated.Value(active ? 1 : 0)).current;

  useEffect(() => {
    RNAnimated.timing(activeAnim, {
      toValue: active ? 1 : 0,
      duration: reduceMotion ? 0 : 180,
      easing: RNEasing.out(RNEasing.cubic),
      useNativeDriver: false,
    }).start();
  }, [active, activeAnim, reduceMotion]);

  const tintColor = activeAnim.interpolate({
    inputRange:  [0, 1],
    outputRange: [idleColor, activeColor],
  });
  const scale = activeAnim.interpolate({
    inputRange:  [0, 1],
    // 1.03 (down from 1.05) — less optical jump when the active tint
    // crossfades in, so the icon doesn't read as "hovering".
    outputRange: [1, reduceMotion ? 1 : 1.03],
  });

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${meta.label} top tab`}
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.topTab,
        // Subtle press-in dip — uses Pressable's own state so it doesn't
        // need its own Animated value.
        pressed && styles.topTabPressed,
      ]}
    >
      <RNAnimated.View style={[styles.topTabContent, { transform: [{ scale }] }]}>
        <View style={styles.topTabIconMount}>
          <Ionicons
            name={meta.icon}
            size={30}
            color={active ? activeColor : idleColor}
          />
        </View>
        <RNAnimated.Text style={[styles.topTabLabel, { color: tintColor }]}>
          {meta.label}
        </RNAnimated.Text>
      </RNAnimated.View>
    </Pressable>
  );
}

function TopNav({
  visible,
  activeTab,
  onTabPress,
}: {
  visible: boolean;
  activeTab: TopTab;
  onTabPress: (tab: TopTab) => void;
}) {
  // Item 3 — RM: collapse/expand at duration 0 (principle 18).
  const reduceMotion = useReduceMotion();
  const t = useTheme();
  const anim = useRef(new RNAnimated.Value(visible ? 1 : 0)).current;

  useEffect(() => {
    RNAnimated.timing(anim, {
      toValue: visible ? 1 : 0,
      duration: reduceMotion ? 0 : 220,
      easing: RNEasing.out(RNEasing.cubic),
      useNativeDriver: false,
    }).start();
  }, [anim, reduceMotion, visible]);

  const slotHeight = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, TOP_NAV_HEIGHT],
  });
  const panelOpacity = anim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 0, 1],
  });

  return (
    <RNAnimated.View
      style={[
        styles.topNavSlot,
        { height: slotHeight, backgroundColor: t.colors.surface },
      ]}
    >
      <RNAnimated.View
        pointerEvents={visible ? 'auto' : 'none'}
        style={[
          styles.topNavPanel,
          {
            opacity: panelOpacity,
            backgroundColor: t.isDark ? t.colors.navBackground : '#FFFFFF',
          },
        ]}
      >
        {(['taptalk', 'quick', 'edit', 'clear'] as TopTab[]).map(tab => (
          <TopNavTab
            key={tab}
            tab={tab}
            active={activeTab === tab}
            onPress={() => onTabPress(tab)}
          />
        ))}
      </RNAnimated.View>
      <RNAnimated.View
        pointerEvents="none"
        style={[
          styles.topNavBottomBorder,
          { backgroundColor: t.colors.border, opacity: panelOpacity },
        ]}
      />
    </RNAnimated.View>
  );
}

export default function TalkScreen() {
  const { width, height: screenHeight } = useWindowDimensions();
  const rootRef = useRef<View>(null);
  const messageSlotRefs = useRef<Array<View | null>>([]);
  const ghostsRef = useRef<GhostTile[]>([]);
  const { state, dispatch } = useAppContext();
  const { speak, stop: stopSpeech, lastError, clearError } = useSpeech();
  const router = useRouter();
  const t = useTheme();
  const motorAccessEnabled = state.accessibility.motorAccessMode;
  // Default to closed — board is the hero, top nav stays out of the way
  // until the user explicitly taps the chevron to open it.
  const [showTopNav, setShowTopNav] = useState(false);
  const [activeMode, setActiveMode] = useState<BoardMode>('home');
  const [previousMode, setPreviousMode] = useState<BoardMode | null>(null);
  const [activeTab, setActiveTab] = useState<TopTab>('taptalk');
  const [ghosts, setGhosts] = useState<GhostTile[]>([]);
  const [resolvedSymbols, setResolvedSymbols] = useState<Map<string, ResolvedSymbol>>(new Map());
  // ── Edit mode & drag-and-snap state ─────────────────────────────────────
  const [editMode, setEditMode] = useState(false);
  // Sparse slot map: { slotIndex → tileId } per board mode.
  // Supports moving tiles to ANY grid slot (including empty ones) and leaving
  // gaps in the layout — just like the iOS home screen editor.
  // Falls back to the default sequential layout when no entry exists.
  // Per-mode variable-size layouts. Each placement records the tile's
  // top-left coarse slot and its size in FINE (44px) units. Default is
  // fw=fh=2 for 88×88 tiles.
  const [layouts, setLayouts] = useState<Partial<Record<BoardMode, BoardLayout>>>({});
  // Shared values live on the UI thread so drag updates never cross the bridge.
  const snapSlot = useSharedValue(-1);
  // Tracks the grid slot where the current drag started — used to render
  // the "source ghost" outline (the empty-slot shadow the tile left behind).
  const dragSourceSlot = useSharedValue(-1);
  // Size of the current dragged tile in FINE units — drives multi-cell
  // DragPlaceholder highlights. Coarse cell count = ceil(fw/2) × ceil(fh/2).
  const dragFw = useSharedValue(2);
  const dragFh = useSharedValue(2);
  const gridOverlayOpacity = useSharedValue(0);
  const jiggle = useSharedValue(0);
  const scrollRef = useRef<ScrollView>(null);
  const scrollPositions = useRef<Partial<Record<BoardMode, number>>>({});
  const reduceMotion = useReduceMotion();
  const [boardAreaHeight, setBoardAreaHeight] = useState(0);
  const [layoutDirty, setLayoutDirty] = useState(false);
  const layoutSnapshotRef = useRef<BoardLayout | null>(null);
  // ── Contextual dock state ────────────────────────────────────────────────
  // addFlowExpanded: Add + sub-menu open (Back / Symbol / Folder / <)
  // folderDockExpanded: folder nav shows Back/Home/< (true) or collapsed > (false)
  // editFocusTileId: the tile long-pressed to enter edit mode → Delete target
  const [addFlowExpanded, setAddFlowExpanded] = useState(false);
  const [folderDockExpanded, setFolderDockExpanded] = useState(false);
  // Main board dock: collapsed shows only ">", expanded shows
  // Add + / Board Settings / < (rule 1 — simple first, advanced later).
  const [homeDockExpanded, setHomeDockExpanded] = useState(false);
  const [editFocusTileId, setEditFocusTileId] = useState<string | null>(null);
  // ── Undo toast for tile hide/delete (Rule 26) ─────────────────────────
  const [undoToast, setUndoToast] = useState<{ tileId: string; placement: TilePlacement; board: BoardMode } | null>(null);
  const undoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // ── Add Symbol / Add Folder modals (Priority 2) ────────────────────────
  const [addSymbolModalVisible, setAddSymbolModalVisible] = useState(false);
  const [addFolderModalVisible, setAddFolderModalVisible] = useState(false);
  const [showSentenceHistory, setShowSentenceHistory] = useState(true);
  const folderCollapseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dockFade = useRef(new RNAnimated.Value(1)).current;
  const messageWordsRef = useRef(state.messageWords);
  messageWordsRef.current = state.messageWords;
  // User-added tiles (symbols/folders) that don't exist in the static BOARD_TILES data.
  const userTilesRef = useRef<Map<string, BoardTile>>(new Map());

  // Chained-utterance run tracking — cancels any in-flight clause chain so
  // rapid re-taps on the strip never overlap audio (board_speech_rules.md).
  const speakRunIdRef = useRef(0);
  const speakGapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hapticIfEnabled = useCallback(() => {
    if (state.accessibility.hapticsEnabled !== false) hapticSelection();
  }, [state.accessibility.hapticsEnabled]);

  // ── Hydrate local layouts from persisted boardPlacements on mount ─────────
  // Seeds the in-memory `layouts` state with any previously saved variable-size
  // placements so custom arrangements survive relaunch. Tiles added in future
  // code releases that aren't in stored placements get appended with default
  // fw=fh=2 at the next free slot.
  useEffect(() => {
    const persisted = state.boardPlacements;
    if (!persisted || Object.keys(persisted).length === 0) return;
    const seeded: Partial<Record<BoardMode, BoardLayout>> = {};
    for (const key of Object.keys(persisted) as BoardMode[]) {
      const stored = persisted[key];
      if (!stored || stored.length === 0) continue;
      const boardTiles = BOARD_TILES[key];
      if (!boardTiles) continue;
      // Start from stored placements
      const layout: BoardLayout = stored.map(p => ({ id: p.id, slot: p.slot, fw: p.fw, fh: p.fh }));
      // Append any new tiles from code that aren't in stored placements
      const storedIds = new Set(stored.map(p => p.id));
      const maxSlot = stored.reduce((max, p) => Math.max(max, p.slot + coarseCols(p.fw)), 0);
      let nextSlot = maxSlot;
      for (const tile of boardTiles) {
        if (!storedIds.has(tile.id)) {
          layout.push({ id: tile.id, slot: nextSlot, fw: 2, fh: 2 });
          nextSlot += 1;
        }
      }
      seeded[key] = layout;
    }
    if (Object.keys(seeded).length > 0) {
      setLayouts(prev => ({ ...prev, ...seeded }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Edit mode effects ────────────────────────────────────────────────────
  // Fade the grid overlay in/out and start/stop the jiggle animation when
  // edit mode toggles. Both run without touching the JS thread during the
  // transition (pure Reanimated shared value writes).
  useEffect(() => {
    gridOverlayOpacity.value = withTiming(editMode ? 1 : 0, { duration: 200 });
    if (editMode && !reduceMotion && !state.accessibility.reduceSensoryLoad) {
      // Gentle continuous wobble while in edit mode — ±0.7° at ~80ms per
      // half-cycle. Subtle enough to not be annoying, clear enough to signal
      // "you're in rearrange mode." Stops the moment edit mode exits.
      jiggle.value = withRepeat(
        withSequence(
          withTiming(-0.7, { duration: 80 }),
          withTiming( 0.7, { duration: 80 }),
        ),
        -1,   // loop forever
        true, // reverse direction each cycle
      );
    } else {
      cancelAnimation(jiggle);
      jiggle.value = withTiming(0, { duration: 80 });
    }
  }, [editMode, gridOverlayOpacity, jiggle, reduceMotion, state.accessibility.reduceSensoryLoad]);

  // ── Edit mode callbacks ──────────────────────────────────────────────────
  const enterEditFromTile = useCallback((tileId: string) => {
    hapticIfEnabled();
    const current: BoardLayout = layouts[activeMode]
      ?? BOARD_TILES[activeMode].map((t, i) => ({ id: t.id, slot: i, fw: 2, fh: 2 }));
    layoutSnapshotRef.current = current.map(p => ({ ...p }));
    setLayoutDirty(false);
    setEditFocusTileId(tileId);
    setAddFlowExpanded(false);
    setEditMode(true);
  }, [activeMode, hapticIfEnabled, layouts]);

  const exitEditClean = useCallback(() => {
    hapticIfEnabled();
    setEditMode(false);
    setLayoutDirty(false);
    setEditFocusTileId(null);
    setAddFlowExpanded(false);
    layoutSnapshotRef.current = null;
    snapSlot.value = -1;
  }, [hapticIfEnabled, snapSlot]);

  const handleSaveEdit = useCallback(() => {
    // Persist the current layout placements for the active board mode so
    // variable-size arrangements survive relaunch (PRIORITY 1).
    const current = layouts[activeMode];
    if (current) {
      dispatch({
        type: 'SET_BOARD_PLACEMENTS',
        payload: {
          board: activeMode,
          placements: current.map(p => ({ id: p.id, slot: p.slot, fw: p.fw, fh: p.fh })),
        },
      });
    }
    exitEditClean();
  }, [activeMode, dispatch, exitEditClean, layouts]);

  const handleCancelEdit = useCallback(() => {
    if (!layoutDirty) { exitEditClean(); return; }
    Alert.alert(
      'Discard changes?',
      'Your layout changes will be lost.',
      [
        { text: 'Keep editing', style: 'cancel' },
        {
          text: 'Discard',
          style: 'destructive',
          onPress: () => {
            if (layoutSnapshotRef.current) {
              setLayouts(prev => ({ ...prev, [activeMode]: layoutSnapshotRef.current! }));
            }
            exitEditClean();
          },
        },
      ],
      { cancelable: true },
    );
  }, [activeMode, exitEditClean, layoutDirty]);

  const handleExitEdit = useCallback(() => {
    if (layoutDirty) { handleCancelEdit(); return; }
    exitEditClean();
  }, [exitEditClean, handleCancelEdit, layoutDirty]);

  // Long-press on a tile: enter edit (focusing that tile) or, if already in
  // edit mode, exit via the shared exit logic (which prompts when dirty).
  const handleTileLongPress = useCallback((tileId: string) => {
    if (editMode) { handleExitEdit(); return; }
    enterEditFromTile(tileId);
  }, [editMode, enterEditFromTile, handleExitEdit]);

  // Tap-outside overlay: never silently discard. When dirty the user must use
  // the visible Cancel / Save dock; a clean edit session exits immediately.
  const handleOverlayPress = useCallback(() => {
    if (layoutDirty) return;
    exitEditClean();
  }, [exitEditClean, layoutDirty]);

  // ── Folder dock collapse timer (15s) ──────────────────────────────────────
  const clearFolderTimer = useCallback(() => {
    if (folderCollapseTimerRef.current) {
      clearTimeout(folderCollapseTimerRef.current);
      folderCollapseTimerRef.current = null;
    }
  }, []);

  const startFolderCollapseTimer = useCallback(() => {
    clearFolderTimer();
    folderCollapseTimerRef.current = setTimeout(() => {
      setFolderDockExpanded(false);
    }, 15000);
  }, [clearFolderTimer]);

  // ── Dock action handlers ──────────────────────────────────────────────────
  const handleDockAddToggle = useCallback(() => {
    hapticIfEnabled();
    setAddFlowExpanded(v => !v);
  }, [hapticIfEnabled]);

  const handleDockAddPlus = useCallback(() => {
    hapticIfEnabled();
    setAddFlowExpanded(true);
  }, [hapticIfEnabled]);

  const handleAddFlowClose = useCallback(() => {
    hapticIfEnabled();
    setAddFlowExpanded(false);
  }, [hapticIfEnabled]);

  const handleDockSymbol = useCallback(() => {
    hapticIfEnabled();
    setAddSymbolModalVisible(true);
  }, [hapticIfEnabled]);

  const handleDockAddFolder = useCallback(() => {
    hapticIfEnabled();
    setAddFolderModalVisible(true);
  }, [hapticIfEnabled]);

  // ── Add Symbol confirm: insert tile at first free slot ──────────────
  const handleAddSymbolConfirm = useCallback((result: { symbolId: string; label: string; color: string; wordType: string }) => {
    setAddSymbolModalVisible(false);
    const tileId = `user_${result.label.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}`;
    setLayouts(prev => {
      const current: BoardLayout = prev[activeMode]
        ?? BOARD_TILES[activeMode].map((tt, i) => ({ id: tt.id, slot: i, fw: 2, fh: 2 }));
      const maxSlot = current.reduce((max, p) => Math.max(max, p.slot + 1), 0);
      return { ...prev, [activeMode]: [...current, { id: tileId, slot: maxSlot, fw: 2, fh: 2 }] };
    });
    // Register the tile in BOARD_TILES dynamically isn't possible with static data,
    // so we store a user-added tile map. For now, add to the board tiles at runtime.
    const newTile: BoardTile = {
      id: tileId,
      label: result.label,
      kind: 'word',
      color: result.color,
      speech: result.label.toLowerCase(),
      mulberrySymbolId: result.symbolId,
      wordType: result.wordType,
    };
    userTilesRef.current.set(tileId, newTile);
    setLayoutDirty(true);
    hapticIfEnabled();
  }, [activeMode, hapticIfEnabled]);

  // ── Add Folder confirm: insert folder tile ──────────────────────────
  const handleAddFolderConfirm = useCallback((result: { label: string; boardKey: string; color: string; mulberrySymbolId?: string }) => {
    setAddFolderModalVisible(false);
    const tileId = `folder_${result.boardKey}`;
    setLayouts(prev => {
      const current: BoardLayout = prev[activeMode]
        ?? BOARD_TILES[activeMode].map((tt, i) => ({ id: tt.id, slot: i, fw: 2, fh: 2 }));
      const maxSlot = current.reduce((max, p) => Math.max(max, p.slot + 1), 0);
      return { ...prev, [activeMode]: [...current, { id: tileId, slot: maxSlot, fw: 2, fh: 2 }] };
    });
    const newTile: BoardTile = {
      id: tileId,
      label: result.label,
      kind: 'folder',
      color: result.color,
      target: result.boardKey as BoardMode,
      mulberrySymbolId: result.mulberrySymbolId,
    };
    userTilesRef.current.set(tileId, newTile);
    // Register the empty child board
    if (!BOARD_TILES[result.boardKey as BoardMode]) {
      (BOARD_TILES as Record<string, BoardTile[]>)[result.boardKey] = [
        { id: `back-${result.boardKey}`, label: 'Home', kind: 'folder', target: 'home', color: '#1DCDFF' },
      ];
    }
    setLayoutDirty(true);
    hapticIfEnabled();
  }, [activeMode, hapticIfEnabled]);

  const handleFolderCollapse = useCallback(() => {
    hapticIfEnabled();
    clearFolderTimer();
    setFolderDockExpanded(false);
  }, [clearFolderTimer, hapticIfEnabled]);

  const handleFolderExpand = useCallback(() => {
    hapticIfEnabled();
    setFolderDockExpanded(true);
    startFolderCollapseTimer();
  }, [hapticIfEnabled, startFolderCollapseTimer]);

  const handleHomeDockExpand = useCallback(() => {
    hapticIfEnabled();
    setHomeDockExpanded(true);
  }, [hapticIfEnabled]);

  const handleHomeDockCollapse = useCallback(() => {
    hapticIfEnabled();
    setHomeDockExpanded(false);
  }, [hapticIfEnabled]);

  const handleOpenBoardSettings = useCallback(() => {
    hapticIfEnabled();
    router.push('/board/settings' as Href);
  }, [hapticIfEnabled, router]);

  const handleDockDone = useCallback(() => {
    exitEditClean();
  }, [exitEditClean]);

  // Direct revert without an alert — the Cancel button is already an explicit,
  // visible choice (principle 12: separate destructive actions, but no scary
  // dialog when the control itself is the confirmation).
  const handleDockCancel = useCallback(() => {
    hapticIfEnabled();
    if (layoutSnapshotRef.current) {
      setLayouts(prev => ({ ...prev, [activeMode]: layoutSnapshotRef.current! }));
    }
    exitEditClean();
  }, [activeMode, exitEditClean, hapticIfEnabled]);

  // ── Dock mode resolver (priority: dirty edit > add > edit > folder) ────────
  const dockMode = useMemo<DockMode>(() => {
    if (editMode) {
      if (layoutDirty) return 'editDirty';
      if (addFlowExpanded) return 'addExpanded';
      return 'editClean';
    }
    if (addFlowExpanded) return 'addExpanded';
    if (activeMode === 'home') {
      return homeDockExpanded ? 'homeExpanded' : 'homeCollapsed';
    }
    return folderDockExpanded ? 'folderExpanded' : 'folderCollapsed';
  }, [activeMode, addFlowExpanded, editMode, folderDockExpanded, homeDockExpanded, layoutDirty]);

  // On board change: reset add flow; folders start expanded with a 15s timer,
  // home clears folder nav entirely.
  useEffect(() => {
    setAddFlowExpanded(false);
    setHomeDockExpanded(false); // home always lands calm — just ">"
    if (activeMode === 'home') {
      setFolderDockExpanded(false);
      clearFolderTimer();
    } else {
      setFolderDockExpanded(true);
      startFolderCollapseTimer();
    }
    return clearFolderTimer;
  }, [activeMode, clearFolderTimer, startFolderCollapseTimer]);

  // Entering edit mode hides folder nav + any open add flow.
  useEffect(() => {
    if (editMode) {
      setFolderDockExpanded(false);
      setAddFlowExpanded(false);
      clearFolderTimer();
    }
  }, [editMode, clearFolderTimer]);

  // A layout change (dirty) closes the add sub-flow so Cancel/Save can take over.
  useEffect(() => {
    if (layoutDirty) setAddFlowExpanded(false);
  }, [layoutDirty]);

  // Calm crossfade whenever the dock content changes; instant under Reduce Motion.
  useEffect(() => {
    if (reduceMotion) { dockFade.setValue(1); return; }
    dockFade.setValue(0);
    RNAnimated.timing(dockFade, {
      toValue: 1,
      duration: 150,
      useNativeDriver: true,
    }).start();
  }, [dockMode, reduceMotion, dockFade]);

  const handleMoveToSlot = useCallback((tileId: string, targetSlot: number) => {
    setLayouts(prev => {
      const current: BoardLayout = prev[activeMode]
        ?? BOARD_TILES[activeMode].map((t, i) => ({
          id: t.id, slot: i, fw: 2, fh: 2,
        }));
      const draggedIdx = current.findIndex(p => p.id === tileId);
      const dragged = draggedIdx >= 0 ? current[draggedIdx] : undefined;
      if (!dragged) return prev;
      if (dragged.slot === targetSlot) return prev;

      // Reject drops whose footprint would hang past the right edge —
      // the tile springs back.
      const movedFp = footprintAt(targetSlot, dragged.fw, dragged.fh);
      if (movedFp.endCol >= BOARD_COLUMNS) return prev;

      // Same-size tile anchored exactly at the target → classic swap.
      const targetIdx = current.findIndex(
        (p, i) => i !== draggedIdx && p.slot === targetSlot,
      );
      const target = targetIdx >= 0 ? current[targetIdx] : undefined;
      if (target && target.fw === dragged.fw && target.fh === dragged.fh) {
        const next = [...current];
        next[draggedIdx] = { ...dragged, slot: targetSlot };
        next[targetIdx]  = { ...target,  slot: dragged.slot };
        setLayoutDirty(true);
        return { ...prev, [activeMode]: next };
      }

      // Footprint-aware drop: pin the dragged tile at the target and
      // push-aside any neighbours whose cells it now covers, so a 2×2
      // dropped between tiles can never overlap them.
      const moved: TilePlacement = { ...dragged, slot: targetSlot };
      const others = current.filter((_, i) => i !== draggedIdx);
      const next = reflowAroundPinned(others, moved);
      setLayoutDirty(true);
      return { ...prev, [activeMode]: next };
    });
  }, [activeMode]);

  const handleHide = useCallback((tile: BoardTile) => {
    hapticIfEnabled();
    // Protected tiles cannot be deleted (Priority 4 — emergency phrases)
    if (tile.isProtected) {
      Alert.alert('Protected', 'This tile cannot be removed.', [{ text: 'OK' }]);
      return;
    }
    // Rule 12: destructive action requires confirmation
    Alert.alert(
      `Remove "${tile.label}"?`,
      'The tile will be hidden from this board.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            // Capture current placement for undo (Rule 26)
            const currentLayout: BoardLayout = layouts[activeMode]
              ?? BOARD_TILES[activeMode].map((t, i) => ({ id: t.id, slot: i, fw: 2, fh: 2 }));
            const removedPlacement = currentLayout.find(p => p.id === tile.id);

            // Remove from local placements
            setLayouts(prev => {
              const curr: BoardLayout = prev[activeMode]
                ?? BOARD_TILES[activeMode].map((t, i) => ({ id: t.id, slot: i, fw: 2, fh: 2 }));
              return { ...prev, [activeMode]: curr.filter(p => p.id !== tile.id) };
            });
            setLayoutDirty(true);

            // Persist hide across relaunch
            dispatch({ type: 'HIDE_TILE', payload: tile.id });

            // Show undo toast
            if (removedPlacement) {
              if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
              setUndoToast({ tileId: tile.id, placement: removedPlacement, board: activeMode });
              undoTimerRef.current = setTimeout(() => setUndoToast(null), 5000);
            }
          },
        },
      ],
      { cancelable: true },
    );
  }, [activeMode, dispatch, hapticIfEnabled, layouts]);

  const handleUndoHide = useCallback(() => {
    if (!undoToast) return;
    hapticIfEnabled();
    // Restore the tile placement
    setLayouts(prev => {
      const curr: BoardLayout = prev[undoToast.board] ?? [];
      return { ...prev, [undoToast.board]: [...curr, undoToast.placement] };
    });
    // Unpersist the hide
    dispatch({ type: 'RESTORE_TILE', payload: undoToast.tileId });
    setUndoToast(null);
    if (undoTimerRef.current) { clearTimeout(undoTimerRef.current); undoTimerRef.current = null; }
  }, [dispatch, hapticIfEnabled, undoToast]);

  // ── Push-aside resize handler ─────────────────────────────────────────
  // When a tile is resized, cascade-shift any tiles whose footprint now
  // overlaps the new one (shared reflowAroundPinned helper — same walk the
  // drag-drop commit uses). dCols/dRows are coarse cells the anchor moves
  // LEFT/UP when the resize came from the left/top edge; they are clamped
  // at the grid edges so a blocked shift never grows the tile rightwards.
  const handleResize = useCallback((
    tileId: string,
    newFw: number,
    newFh: number,
    dCols: number = 0,
    dRows: number = 0,
  ) => {
    hapticIfEnabled();
    setLayouts(prev => {
      const current: BoardLayout = prev[activeMode]
        ?? BOARD_TILES[activeMode].map((t, i) => ({
          id: t.id, slot: i, fw: 2, fh: 2,
        }));
      const idx = current.findIndex(p => p.id === tileId);
      const original = idx >= 0 ? current[idx] : undefined;
      if (!original) return prev;

      const startCol = original.slot % BOARD_COLUMNS;
      const startRow = Math.floor(original.slot / BOARD_COLUMNS);

      // Clamp anchor shifts at column/row 0. If the shift was clamped,
      // trim the matching growth so the tile doesn't jump sideways.
      const appliedCols = Math.min(dCols, startCol);
      const appliedRows = Math.min(dRows, startRow);
      const fwNext = Math.max(2, Math.min(MAX_FW, newFw - (dCols - appliedCols) * 2));
      const fhNext = Math.max(2, Math.min(MAX_FW, newFh - (dRows - appliedRows) * 2));
      const slotNext =
        (startRow - appliedRows) * BOARD_COLUMNS + (startCol - appliedCols);

      if (
        fwNext === original.fw &&
        fhNext === original.fh &&
        slotNext === original.slot
      ) return prev;

      const resized: TilePlacement = {
        ...original, slot: slotNext, fw: fwNext, fh: fhNext,
      };

      // Reject if the resized tile would extend past the right edge.
      if (footprintAt(slotNext, fwNext, fhNext).endCol >= BOARD_COLUMNS) return prev;

      const others = current.filter((_, i) => i !== idx);
      const next = reflowAroundPinned(others, resized);
      setLayoutDirty(true);
      return { ...prev, [activeMode]: next };
    });
  }, [activeMode, hapticIfEnabled]);

  // Item 8 — error banner shake animation (principle 13 + 14).
  const bannerShakeX = useSharedValue(0);
  const bannerAnimStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: bannerShakeX.value }],
  }));
  useEffect(() => {
    if (!lastError) return;
    // Haptic always fires; shake only when Reduce Motion is off.
    if (state.accessibility.hapticsEnabled !== false) hapticError();
    if (reduceMotion) return;
    const amp = animation.shakeAmp;
    bannerShakeX.value = withSequence(
      withTiming(-amp,          { duration: 55 }),
      withTiming( amp,          { duration: 65 }),
      withTiming(-amp * 0.65,   { duration: 65 }),
      withTiming( amp * 0.45,   { duration: 65 }),
      withTiming(-amp * 0.22,   { duration: 65 }),
      withTiming( 0,            { duration: 55 }),
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastError]);

  // Horizontal safe-area insets are 0 on most iPhones in portrait, but go
  // non-zero on iPad split view and landscape. Subtracting them up front
  // means `TILE_LEFT_PADDING` always reads as 16pt from the *safe* zone,
  // not from the raw screen edge, and the right column never sits flush
  // against the bezel.
  const insets = useSafeAreaInsets();
  const availableWidth = Math.max(0, width - insets.left - insets.right);
  const boardWidth = Math.min(availableWidth, FIGMA_WIDTH);
  const tileSize = Math.min(
    TILE_SIZE,
    Math.floor((boardWidth - TILE_LEFT_PADDING * 2 - TILE_GAP * (BOARD_COLUMNS - 1)) / BOARD_COLUMNS),
  );
  // Dock actions are fixed 60pt squares; toggles (< >) are 50pt.
  const dockPadLeft = insets.left + TILE_LEFT_PADDING + Math.max(0, (availableWidth - boardWidth) / 2);
  const dockPadRight = insets.right + TILE_LEFT_PADDING + Math.max(0, (availableWidth - boardWidth) / 2);

  // Lookup map: tileId → BoardTile for the active mode (includes user-added tiles).
  const tileMapForMode = useMemo(() => {
    const map = new Map(BOARD_TILES[activeMode]?.map(t => [t.id, t]) ?? []);
    // Merge user-added tiles so they resolve in the board renderer
    for (const [id, tile] of userTilesRef.current) {
      if (!map.has(id)) map.set(id, tile);
    }
    return map;
  }, [activeMode, layouts]);

  // ── Motor Access Mode: tap-based context menu (Priority 5, Rule 20/25) ──
  const handleMotorAccessMenu = useCallback((tileId: string) => {
    const tile = tileMapForMode.get(tileId);
    if (!tile) return;
    hapticIfEnabled();
    const options = ['Move left', 'Move right', 'Resize larger', 'Resize smaller', 'Delete', 'Cancel'];
    const cancelButtonIndex = options.length - 1;
    const destructiveButtonIndex = 4;
    ActionSheetIOS.showActionSheetWithOptions(
      {
        options,
        cancelButtonIndex,
        destructiveButtonIndex,
        title: tile.label,
        message: 'Choose an action',
      },
      (buttonIndex) => {
        if (buttonIndex === 0) {
          const layout = layouts[activeMode]
            ?? BOARD_TILES[activeMode].map((tt, i) => ({ id: tt.id, slot: i, fw: 2, fh: 2 }));
          const p = layout.find(lp => lp.id === tileId);
          if (p && p.slot > 0) handleMoveToSlot(tileId, p.slot - 1);
        } else if (buttonIndex === 1) {
          const layout = layouts[activeMode]
            ?? BOARD_TILES[activeMode].map((tt, i) => ({ id: tt.id, slot: i, fw: 2, fh: 2 }));
          const p = layout.find(lp => lp.id === tileId);
          if (p) handleMoveToSlot(tileId, p.slot + 1);
        } else if (buttonIndex === 2) {
          const layout = layouts[activeMode]
            ?? BOARD_TILES[activeMode].map((tt, i) => ({ id: tt.id, slot: i, fw: 2, fh: 2 }));
          const p = layout.find(lp => lp.id === tileId);
          if (p) handleResize(tileId, Math.min(p.fw + 2, 8), Math.min(p.fh + 2, 8), 0, 0);
        } else if (buttonIndex === 3) {
          const layout = layouts[activeMode]
            ?? BOARD_TILES[activeMode].map((tt, i) => ({ id: tt.id, slot: i, fw: 2, fh: 2 }));
          const p = layout.find(lp => lp.id === tileId);
          if (p) handleResize(tileId, Math.max(p.fw - 2, 2), Math.max(p.fh - 2, 2), 0, 0);
        } else if (buttonIndex === 4) {
          if (tile.isProtected) {
            Alert.alert('Protected', 'This tile cannot be removed.', [{ text: 'OK' }]);
          } else {
            handleHide(tile);
          }
        }
      },
    );
  }, [activeMode, handleHide, handleMoveToSlot, handleResize, hapticIfEnabled, layouts, tileMapForMode]);

  // Active layout for the current mode. Falls back to a sequential
  // default (each tile at its own slot, 2×2 fine size = 88×88).
  const activeLayout = useMemo<BoardLayout>(() => {
    const custom = layouts[activeMode];
    if (custom) return custom;
    return BOARD_TILES[activeMode].map((t, i) => ({
      id: t.id, slot: i, fw: 2, fh: 2,
    }));
  }, [activeMode, layouts]);

  // Fast lookup: slot index → placement (for collision checks + swap).
  const layoutBySlot = useMemo(() => {
    const m = new Map<number, TilePlacement>();
    activeLayout.forEach(p => m.set(p.slot, p));
    return m;
  }, [activeLayout]);

  // Keep `tiles` for the Mulberry prewarm effect (all tiles in active mode).
  const tiles = useMemo(() => BOARD_TILES[activeMode], [activeMode]);

  useEffect(() => {
    const y = scrollPositions.current[activeMode] ?? 0;
    scrollRef.current?.scrollTo({ y, animated: false });
  }, [activeMode]);

  useEffect(() => {
    // Resolve a Mulberry symbol for any tile that doesn't already carry a
    // hardcoded one — including folders (People / Places / Actions), which
    // previously stayed blank because the filter required kind === 'word'.
    // Nav tiles ('back' / 'home') render via BoardNavTile and ignore the
    // `resolved` prop, so they're unaffected even when present in the map.
    const toResolve = tiles.filter(
      t => !t.mulberrySymbolId && !t.mulberryName,
    );
    if (toResolve.length === 0) return;
    let alive = true;
    Promise.all(
      toResolve.map(t =>
        resolveSymbolForKeyword(t.speech ?? t.label).then(r => ({ id: t.id, r })),
      ),
    )
      .then(results => {
        if (!alive) return;
        setResolvedSymbols(prev => {
          const next = new Map(prev);
          results.forEach(({ id, r }) => next.set(id, r));
          return next;
        });
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [tiles]);
  const chipTileLookup = useMemo(() => {
    const lookup = new Map<string, BoardTile>();
    Object.values(BOARD_TILES).flat().forEach(tile => {
      lookup.set((tile.speech ?? tile.label).toLowerCase(), tile);
      lookup.set(tile.label.toLowerCase(), tile);
    });
    return lookup;
  }, []);

  const announce = useCallback((message: string) => {
    AccessibilityInfo.announceForAccessibility(message);
  }, []);

  // Chained clause runner — cancels any in-flight run, then walks the
  // utterance list, chaining each via `onDone` with a punctuation-aware
  // gap between clauses (board_speech_rules.md).
  const speakChained = useCallback((text: string) => {
    speakRunIdRef.current += 1;
    if (speakGapTimerRef.current) {
      clearTimeout(speakGapTimerRef.current);
      speakGapTimerRef.current = null;
    }
    stopSpeech();

    const utterances = buildMessageUtterances(
      text,
      state.accessibility.speechRate,
      state.accessibility.speechPitch,
    );
    if (utterances.length === 0) return;
    const run = speakRunIdRef.current;

    const speakNext = (i: number) => {
      if (run !== speakRunIdRef.current) return;
      const u = utterances[i];
      if (!u) return;
      speak(u.text, {
        rate: u.rate,
        pitch: u.pitch,
        onDone: () => {
          if (run !== speakRunIdRef.current) return;
          if (i + 1 < utterances.length) {
            speakGapTimerRef.current = setTimeout(() => speakNext(i + 1), u.gapAfter);
          }
        },
      });
    };

    speakNext(0);
  }, [speak, stopSpeech, state.accessibility.speechRate, state.accessibility.speechPitch]);

  // Never leave a chain running when the screen unmounts.
  useEffect(() => () => {
    speakRunIdRef.current += 1;
    if (speakGapTimerRef.current) {
      clearTimeout(speakGapTimerRef.current);
      speakGapTimerRef.current = null;
    }
  }, []);

  const handleStripSpeak = useCallback((messageText: string, hasWords: boolean) => {
    if (!messageText.trim() || !hasWords) {
      announce('No message to speak');
      return;
    }
    if (messageWordsRef.current.length > 0) {
      dispatch({ type: 'PUSH_SENTENCE_HISTORY', payload: { words: messageWordsRef.current } });
      dispatch({ type: 'UPDATE_NGRAM_MODEL', payload: { words: messageWordsRef.current.map(w => w.label) } });
    }
    speakChained(messageText);
    announce(`Speaking: ${messageText}`);
  }, [announce, speakChained, dispatch]);

  const handleReplaySentence = useCallback((words: AACWord[]) => {
    hapticIfEnabled();
    dispatch({ type: 'CLEAR_WORDS' });
    words.forEach((word) => {
      dispatch({
        type: 'APPEND_WORD',
        payload: {
          id: `replay-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          label: word.label,
          wordType: word.wordType,
          source: word.source ?? 'board',
        },
      });
    });
    const messageText = words.map(w => w.label).join(' ');
    setTimeout(() => {
      speakChained(messageText);
    }, 50);
  }, [dispatch, hapticIfEnabled, speakChained]);

  const handleStripBackspace = useCallback((hasWords: boolean) => {
    hapticIfEnabled();
    if (hasWords) {
      dispatch({ type: 'REMOVE_LAST_WORD' });
      return;
    }
    setActiveMode('home');
    setPreviousMode(null);
    setActiveTab('taptalk');
  }, [dispatch, hapticIfEnabled]);

  const handleStripRemoveWord = useCallback((index: number, label: string) => {
    hapticIfEnabled();
    dispatch({ type: 'REMOVE_WORD_AT_INDEX', payload: index });
    announce(`Removed ${label}`);
  }, [announce, dispatch, hapticIfEnabled]);

  const appendWord = useCallback((tile: BoardTile, silent = false) => {
    const label = tile.speech ?? tile.label;
    dispatch({
      type: 'APPEND_WORD',
      payload: {
        id: `${tile.id}-${Date.now()}`,
        label,
        wordType: 'core',
        source: 'board',
      },
    });
    // When silent=true the caller already called speak() immediately on press;
    // don't call it again here or the word would be said twice (and late).
    if (!silent) {
      speak(label, { rate: state.accessibility.speechRate, pitch: state.accessibility.speechPitch });
    }
    announce(`Added ${label}`);
  }, [announce, dispatch, speak, state.accessibility.speechRate, state.accessibility.speechPitch]);

  const addGhost = useCallback((ghost: GhostTile) => {
    ghostsRef.current = [...ghostsRef.current, ghost];
    setGhosts(ghostsRef.current);
  }, []);

  const finishGhost = useCallback((ghostId: string) => {
    const ghost = ghostsRef.current.find(item => item.id === ghostId);
    ghostsRef.current = ghostsRef.current.filter(item => item.id !== ghostId);
    setGhosts(ghostsRef.current);

    if (!ghost) return;
    // Pass silent=true — speech was already triggered immediately on tile press
    // so we only need to add the word to the strip now.
    appendWord(ghost.tile, true);
    hapticIfEnabled();
  }, [appendWord, hapticIfEnabled]);

  const repeatMessage = useCallback(() => {
    const messageText = messageWordsRef.current.map(word => word.label).join(' ');
    if (!messageText.trim()) {
      announce('No message to speak');
      return;
    }
    speakChained(messageText);
    announce(`Speaking: ${messageText}`);
  }, [announce, speakChained]);

  const clearMessage = useCallback(() => {
    // Cancel any in-flight chained clause run before wiping the message.
    speakRunIdRef.current += 1;
    if (speakGapTimerRef.current) {
      clearTimeout(speakGapTimerRef.current);
      speakGapTimerRef.current = null;
    }
    stopSpeech();
    ghostsRef.current = [];
    setGhosts([]);
    if (messageWordsRef.current.length > 0) {
      dispatch({ type: 'PUSH_SENTENCE_HISTORY', payload: { words: messageWordsRef.current } });
      dispatch({ type: 'UPDATE_NGRAM_MODEL', payload: { words: messageWordsRef.current.map(w => w.label) } });
    }
    dispatch({ type: 'CLEAR_WORDS' });
    announce('Message cleared');
  }, [announce, dispatch, stopSpeech]);

  const startGhostToMessage = useCallback((tile: BoardTile, fromRect: WindowRect | null) => {
    // Speak immediately on press — don't wait for the 430ms ghost animation
    // to complete. This eliminates the perceived delay between tapping and hearing.
    // Stop first so rapid tile taps replace the previous word instead of
    // queueing/overlapping (board_speech_rules.md — cancel before a new run).
    stopSpeech();
    speak(tile.speech ?? tile.label, {
      rate: state.accessibility.speechRate,
      pitch: state.accessibility.speechPitch,
    });

    if (!fromRect) {
      appendWord(tile, true); // silent — already spoken above
      return;
    }

    const targetIndex = Math.min(
      messageWordsRef.current.length + ghostsRef.current.length,
      MESSAGE_SLOT_COUNT - 1,
    );
    const targetRef = messageSlotRefs.current[targetIndex];

    if (!targetRef || !rootRef.current) {
      appendWord(tile, true); // silent — already spoken above
      return;
    }

    targetRef.measureInWindow((targetX, targetY, targetWidth, targetHeight) => {
      rootRef.current?.measureInWindow((rootX, rootY) => {
        addGhost({
          id: `${tile.id}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
          tile,
          from: {
            x: fromRect.x - rootX,
            y: fromRect.y - rootY,
            width: fromRect.width,
            height: fromRect.height,
          },
          to: {
            x: targetX - rootX,
            y: targetY - rootY,
            width: targetWidth,
            height: targetHeight,
          },
          size: Math.round(tileSize * 0.92),
        });
      });
    });
  }, [addGhost, appendWord, speak, stopSpeech, state.accessibility.speechPitch, state.accessibility.speechRate, tileSize]);

  useEffect(() => {
    prewarmMulberryAssets({
      symbolIds: tiles
        .map(tile => tile.mulberrySymbolId)
        .filter((id): id is string => Boolean(id)),
      names: tiles
        .map(tile => tile.mulberryName)
        .filter((name): name is string => Boolean(name)),
    });
  }, [tiles]);

  useEffect(() => {
    if (resolvedSymbols.size === 0) return;
    prewarmMulberryAssets({
      symbolIds: [...resolvedSymbols.values()].map(result => result.symbol.id),
    });
  }, [resolvedSymbols]);

  const navigateTo = useCallback((target: BoardMode) => {
    setPreviousMode(activeMode);
    setActiveMode(target);
    dispatch({ type: 'SET_BOARD', payload: target });
  }, [activeMode, dispatch]);

  const handleTilePress = useCallback((tile: BoardTile, rect: WindowRect | null) => {
    hapticIfEnabled();
    dispatch({ type: 'INCREMENT_TILE_TAP', payload: { tileId: tile.id } });
    if (tile.id === 'back') {
      const dest = previousMode ?? 'home';
      setActiveMode(dest);
      setPreviousMode(null);
      dispatch({ type: 'SET_BOARD', payload: dest });
      announce('Back');
      return;
    }
    if (tile.id === 'home') {
      setActiveMode('home');
      setPreviousMode(null);
      setActiveTab('taptalk');
      dispatch({ type: 'SET_BOARD', payload: 'home' });
      announce('Home');
      return;
    }
    if (tile.kind === 'folder' && tile.target) {
      navigateTo(tile.target);
      // Item 6 — richer folder announcement: include the symbol count so
      // VoiceOver users know what awaits them inside (principle 21).
      const symbolCount = BOARD_TILES[tile.target]?.length ?? 0;
      announce(`${tile.label} board, ${symbolCount} symbol${symbolCount !== 1 ? 's' : ''}`);
      return;
    }
    if (tile.kind === 'action') {
      if (tile.id.includes('clear')) clearMessage();
      if (tile.id.includes('repeat')) repeatMessage();
      if (tile.id === 'hide-nav') setShowTopNav(false);
      if (tile.id === 'home-settings') {
        setActiveMode('home');
        setPreviousMode(null);
        setActiveTab('taptalk');
        dispatch({ type: 'SET_BOARD', payload: 'home' });
      }
      return;
    }
    startGhostToMessage(tile, rect);
  }, [announce, clearMessage, dispatch, hapticIfEnabled, navigateTo, previousMode, repeatMessage, startGhostToMessage]);

  // Folder dock Back reuses the tile-press navigation logic.
  const handleDockBack = useCallback(() => handleTilePress(BACK_TILE, null), [handleTilePress]);

  // Delete removes the focused tile's placement from the in-memory layout for
  // the current board only. Marks the session dirty so Cancel/Save appear.
  const handleDockDelete = useCallback(() => {
    if (!editFocusTileId) return;
    hapticIfEnabled();
    // Check if the focused tile is protected (Priority 4)
    const focusedTile = tileMapForMode.get(editFocusTileId);
    if (focusedTile?.isProtected) {
      Alert.alert('Protected', 'This tile cannot be removed.', [{ text: 'OK' }]);
      return;
    }
    const target = editFocusTileId;
    setLayouts(prev => {
      const current: BoardLayout = prev[activeMode]
        ?? BOARD_TILES[activeMode].map((tt, i) => ({ id: tt.id, slot: i, fw: 2, fh: 2 }));
      const next = current.filter(p => p.id !== target);
      return { ...prev, [activeMode]: next };
    });
    setLayoutDirty(true);
    setEditFocusTileId(null);
    announce('Tile deleted');
  }, [activeMode, announce, editFocusTileId, hapticIfEnabled, tileMapForMode]);

  const handleTopTab = useCallback((tab: TopTab) => {
    hapticIfEnabled();
    // TAPTALK opens the dedicated keyboard page (new route — see
    // app/board/keyboard). QUICK opens Quick Talk. EDIT is a stub
    // for now. CLEAR is an in-place action on the message strip.
    if (tab === 'taptalk') {
      router.push('/board/keyboard' as Href);
      // Item 5 — announce destination for VoiceOver (principle 21).
      announce('TapTalk keyboard');
      return;
    }
    if (tab === 'quick') {
      router.push('/board/quick-talk' as Href);
      announce('Quick Talk');
      return;
    }
    if (tab === 'clear') {
      clearMessage();
      setActiveTab(tab);
      // clearMessage() already announces "Message cleared".
      return;
    }
    // EDIT — placeholder, intentionally no-op for v1.
    setActiveTab(tab);
    announce(`${TOP_TAB_META[tab].label} selected`);
  }, [announce, clearMessage, hapticIfEnabled, router]);

  const handleScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      scrollPositions.current[activeMode] = e.nativeEvent.contentOffset.y;
    },
    [activeMode],
  );

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: t.colors.surface }]} edges={['top']}>
      <View ref={rootRef} style={[styles.screenRoot, { backgroundColor: t.colors.background }]}>
        {/* Item 8 — shake wrapper lets the banner animate on error
            while the inner Pressable stays the dismiss hit target. */}
        {lastError ? (
          <Reanimated.View style={bannerAnimStyle}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Dismiss speech error"
              onPress={clearError}
              style={[styles.errorBanner, { backgroundColor: t.colors.danger }]}
            >
              <Text style={styles.errorText}>Speech unavailable: {lastError.message}</Text>
            </Pressable>
          </Reanimated.View>
        ) : null}

        <TalkMessageStrip
          messageSlotRefs={messageSlotRefs}
          chipTileLookup={chipTileLookup as Map<string, MessageStripTile>}
          ghostCount={ghosts.length}
          wordBackgroundForTile={(tile) => wordBackgroundForTile(tile as BoardTile)}
          onSpeak={handleStripSpeak}
          onBackspace={handleStripBackspace}
          onClearAll={clearMessage}
          onRemoveWord={handleStripRemoveWord}
          hapticsEnabled={state.accessibility.hapticsEnabled !== false}
          navVisible={showTopNav}
          onToggleNav={() => {
            hapticIfEnabled();
            setShowTopNav(value => !value);
          }}
        />

        {/* N-gram Predictions */}
        {(() => {
          const lastWord = state.messageWords[state.messageWords.length - 1]?.label;
          const preds = lastWord ? predictNextWords(lastWord, state.ngramModel, 3) : [];
          if (preds.length === 0) return null;
          return (
            <View style={{ marginTop: spacing.sm, paddingHorizontal: spacing.lg }}>
              <Text style={{ fontSize: 13, fontWeight: '700', color: t.colors.textMuted, marginBottom: spacing.xs }}>
                Suggestions
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: spacing.sm }}
              >
                {preds.map((word) => (
                  <Pressable
                    key={word}
                    accessibilityRole="button"
                    accessibilityLabel={`Add ${word}`}
                    onPress={() => {
                      hapticIfEnabled();
                      dispatch({
                        type: 'APPEND_WORD',
                        payload: {
                          id: `pred-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                          label: word,
                          wordType: 'core',
                          source: 'suggestion',
                        },
                      });
                    }}
                    style={({ pressed }) => ({
                      backgroundColor: pressed ? t.colors.selectionBg : t.colors.inputBg,
                      borderRadius: radii.pill,
                      paddingHorizontal: spacing.md,
                      paddingVertical: spacing.sm,
                      minHeight: 36,
                      justifyContent: 'center',
                    })}
                  >
                    <Text style={{ fontSize: 14, fontWeight: '600', color: t.colors.text }}>
                      {word}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          );
        })()}

        {/* Sentence History */}
        {state.sentenceHistory.length > 0 && (
          <View style={{ marginTop: spacing.sm }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg }}>
              <Text style={{ fontSize: 13, fontWeight: '700', color: t.colors.textMuted }}>Recent Sentences</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={showSentenceHistory ? 'Hide recent sentences' : 'Show recent sentences'}
                onPress={() => setShowSentenceHistory(v => !v)}
                hitSlop={12}
              >
                <Ionicons name={showSentenceHistory ? 'chevron-up' : 'chevron-down'} size={18} color={t.colors.textMuted} />
              </Pressable>
            </View>
            {showSentenceHistory && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, gap: spacing.sm }}
                accessibilityLabel="Recent sentences"
              >
                {state.sentenceHistory.map((entry) => {
                  const summary = entry.words.slice(0, 3).map(w => w.label).join(' ');
                  const hasMore = entry.words.length > 3;
                  return (
                    <Pressable
                      key={entry.id}
                      accessibilityRole="button"
                      accessibilityLabel={`Replay sentence: ${summary}${hasMore ? ' and more' : ''}`}
                      onPress={() => handleReplaySentence(entry.words)}
                      style={({ pressed }) => ({
                        backgroundColor: pressed ? t.colors.selectionBg : t.colors.inputBg,
                        borderRadius: radii.pill,
                        paddingHorizontal: spacing.md,
                        paddingVertical: spacing.sm,
                        minHeight: 36,
                        justifyContent: 'center',
                      })}
                    >
                      <Text style={{ fontSize: 14, fontWeight: '600', color: t.colors.text }} numberOfLines={1}>
                        {summary}{hasMore ? '…' : ''}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            )}
          </View>
        )}

        <TopNav
          visible={showTopNav}
          activeTab={activeTab}
          onTabPress={handleTopTab}
        />

        {/* Tap-outside overlay exits a clean edit session; when dirty it is a
            no-op so changes are never silently discarded (use Cancel/Save). */}
        {editMode ? (
          <Pressable
            style={StyleSheet.absoluteFillObject}
            onPress={handleOverlayPress}
            accessible={false}
            importantForAccessibility="no"
          />
        ) : null}

        {/* Board area: ScrollView (flex:1) + pinned bottom dock */}
        <View
          style={styles.boardArea}
          onLayout={e => setBoardAreaHeight(e.nativeEvent.layout.height)}
        >
          <ScrollView
            ref={scrollRef}
            style={[styles.board, { backgroundColor: t.colors.background }]}
            contentContainerStyle={[
              styles.boardContent,
              {
                paddingLeft:  insets.left  + TILE_LEFT_PADDING + Math.max(0, (availableWidth - boardWidth) / 2),
                paddingRight: insets.right + TILE_LEFT_PADDING + Math.max(0, (availableWidth - boardWidth) / 2),
              },
            ]}
          showsVerticalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={50}
          bounces
          alwaysBounceVertical
        >
            {(() => {
              const colStep = tileSize + TILE_GAP;
              const rowStep = tileSize + TILE_V_GAP;
              // Rows must count each tile's full footprint (anchor row +
              // coarse height), not just anchor slots — otherwise growing a
              // bottom-row tile taller doesn't extend the grid and the
              // background never refreshes under it.
              const tileRows = activeLayout.reduce(
                (m, p) =>
                  Math.max(m, Math.floor(p.slot / BOARD_COLUMNS) + coarseRows(p.fh)),
                0,
              );
              // Measured board area minus fixed chrome. The dock is always
              // visible (home shows the ">" toggle), so its height is
              // constant: one action row + top padding + bottom gap. Falls
              // back to an estimate before onLayout fires.
              const dockContentH = DOCK_ACTION_SIZE + spacing.sm + DOCK_BOTTOM_GAP;
              const measuredViewH = boardAreaHeight > 0
                ? boardAreaHeight - BOARD_TOP_GAP - 10 - dockContentH
                : screenHeight - MESSAGE_HEIGHT - BOARD_TOP_GAP - 100 - 50;
              const viewportRows = Math.max(1, Math.ceil(measuredViewH / rowStep));
              const gridRows = Math.max(tileRows, viewportRows);
              const totalGridSlots = gridRows * BOARD_COLUMNS;
              const gridH = gridRows * rowStep - TILE_V_GAP;
              return (
                <View style={{ width: boardWidth - TILE_LEFT_PADDING * 2, height: gridH, position: 'relative' }}>
                  <GridOverlay
                    cols={BOARD_COLUMNS}
                    totalSlots={totalGridSlots}
                    tileSize={tileSize}
                    gap={TILE_GAP}
                    rowGap={TILE_V_GAP}
                    opacity={gridOverlayOpacity}
                  />
                  {activeLayout.map((placement) => {
                    const tile = tileMapForMode.get(placement.id);
                    if (!tile) return null;
                    const col = placement.slot % BOARD_COLUMNS;
                    const row = Math.floor(placement.slot / BOARD_COLUMNS);
                    const w = placement.fw * FINE;
                    const h = placement.fh * FINE;
                    return (
                      <View
                        key={tile.id}
                        style={{
                          position: 'absolute',
                          left: col * colStep,
                          top: row * rowStep,
                          width: w,
                          height: h,
                        }}
                      >
                        <BoardTileCell
                          tile={tile}
                          size={tileSize}
                          width={w}
                          height={h}
                          fw={placement.fw}
                          fh={placement.fh}
                          slot={placement.slot}
                          totalSlots={totalGridSlots}
                          onTilePress={handleTilePress}
                          resolved={resolvedSymbols.get(tile.id)}
                          editMode={editMode}
                          onLongPressEnterEdit={handleTileLongPress}
                          onMoveToSlot={handleMoveToSlot}
                          onHide={handleHide}
                          onResize={handleResize}
                          snapSlot={snapSlot}
                          dragSourceSlot={dragSourceSlot}
                          dragFw={dragFw}
                          dragFh={dragFh}
                          jiggle={jiggle}
                          onEditTap={motorAccessEnabled ? handleMotorAccessMenu : undefined}
                        />
                        {editMode && state.showUsageHeatmap && (state.tileTapCounts[tile.id] ?? 0) > 0 && (
                          <View
                            style={{
                              position: 'absolute',
                              top: 4,
                              right: 4,
                              minWidth: 20,
                              height: 20,
                              borderRadius: 10,
                              backgroundColor: t.colors.primary,
                              alignItems: 'center',
                              justifyContent: 'center',
                              paddingHorizontal: 4,
                              pointerEvents: 'none',
                              zIndex: 10,
                            }}
                            accessibilityLabel={`${state.tileTapCounts[tile.id]} taps`}
                          >
                            <Text style={{ color: '#FFFFFF', fontSize: 10, fontWeight: '700' }}>
                              {state.tileTapCounts[tile.id]}
                            </Text>
                          </View>
                        )}
                      </View>
                    );
                  })}
                  {editMode ? (
                    <>
                      <DragPlaceholder
                        snapSlot={snapSlot}
                        dragFw={dragFw}
                        dragFh={dragFh}
                        tileSize={tileSize}
                        gap={TILE_GAP}
                        rowGap={TILE_V_GAP}
                        cols={BOARD_COLUMNS}
                      />
                      <SourceGhost
                        dragSourceSlot={dragSourceSlot}
                        tileSize={tileSize}
                        gap={TILE_GAP}
                        rowGap={TILE_V_GAP}
                        cols={BOARD_COLUMNS}
                      />
                    </>
                  ) : null}
                </View>
              );
            })()}
          </ScrollView>

          {/* ── Unified contextual dock (fixed, outside the ScrollView) ── */}
          <RNAnimated.View
            accessibilityRole="toolbar"
            accessibilityLabel="Board actions"
            style={[
              styles.boardDock,
              {
                paddingBottom: DOCK_BOTTOM_GAP,
                opacity: dockFade,
                transform: [{
                  translateX:
                    !reduceMotion &&
                    (dockMode === 'homeExpanded' || dockMode === 'homeCollapsed')
                      ? dockFade.interpolate({ inputRange: [0, 1], outputRange: [-12, 0] })
                      : 0,
                }],
              },
            ]}
          >
            <View
              style={[
                styles.dockRow,
                { paddingLeft: dockPadLeft, paddingRight: dockPadRight },
              ]}
            >
              {dockMode === 'homeCollapsed' ? (
                <BoardDockAction
                  icon="chevron-right" label="More"
                  a11yLabel="More"
                  a11yHint="Expand board controls. Shows Add and Board settings."
                  onPress={handleHomeDockExpand}
                  isToggle
                />
              ) : dockMode === 'homeExpanded' ? (
                <>
                  <BoardDockAction
                    icon="add" label="Add"
                    a11yLabel="Add"
                    a11yHint="Opens add options for the board"
                    onPress={handleDockAddPlus}
                    kind="neutral"
                  />
                  <BoardDockAction
                    icon="setting" label="Board"
                    a11yLabel="Board settings"
                    a11yHint="Opens board display and layout settings"
                    onPress={handleOpenBoardSettings}
                    kind="neutral"
                  />
                  <BoardDockAction
                    icon="chevron-left" label="Hide"
                    a11yLabel="Hide"
                    a11yHint="Collapse board controls"
                    onPress={handleHomeDockCollapse}
                    isToggle
                  />
                </>
              ) : dockMode === 'addExpanded' ? (
                <>
                  <BoardDockAction
                    icon="chevron-back" label="Back"
                    a11yLabel="Back" a11yHint="Close add options"
                    onPress={handleAddFlowClose} kind="neutral"
                  />
                  <BoardDockAction
                    label="Symbol" a11yLabel="Add symbol"
                    onPress={handleDockSymbol} kind="neutral"
                  />
                  <BoardDockAction
                    label="Folder" a11yLabel="Add folder"
                    onPress={handleDockAddFolder} kind="neutral"
                  />
                  <BoardDockAction
                    icon="add" label="Add"
                    a11yLabel="Add item"
                    a11yHint="Close add options"
                    onPress={handleDockAddToggle}
                    isToggle
                    isActive
                  />
                </>
              ) : dockMode === 'folderExpanded' ? (
                <>
                  <BoardDockAction
                    icon="chevron-back" label="Back"
                    a11yLabel="Back"
                    a11yHint="Go back one board"
                    onPress={handleDockBack} kind="neutral"
                  />
                  <BoardDockAction
                    icon="add" label="Add"
                    a11yLabel="Add item"
                    a11yHint="Opens add options"
                    onPress={handleDockAddToggle}
                    isToggle
                  />
                  <BoardDockAction
                    icon="chevron-left" label="Hide"
                    a11yLabel="Hide"
                    a11yHint="Collapse actions. Hides Back and Add."
                    onPress={handleFolderCollapse} isToggle
                  />
                </>
              ) : dockMode === 'folderCollapsed' ? (
                <BoardDockAction
                  icon="chevron-right" label="More"
                  a11yLabel="More"
                  a11yHint="Expand actions. Shows Back and Add."
                  onPress={handleFolderExpand} isToggle
                />
              ) : dockMode === 'editDirty' ? (
                <>
                  <BoardDockAction
                    icon="close" label="Cancel"
                    a11yLabel="Cancel changes"
                    onPress={handleDockCancel} kind="muted"
                  />
                  <BoardDockAction
                    icon="checkmark" label="Save"
                    a11yLabel="Save changes"
                    onPress={handleSaveEdit} kind="primary"
                  />
                </>
              ) : dockMode === 'editClean' ? (
                <>
                  {editFocusTileId ? (
                    <BoardDockAction
                      icon="remove" label="Delete"
                      a11yLabel="Delete selected tile"
                      onPress={handleDockDelete} kind="muted"
                    />
                  ) : null}
                  <BoardDockAction
                    icon="add" label="Add"
                    a11yLabel="Add item" a11yHint="Opens add options"
                    onPress={handleDockAddPlus} kind="neutral"
                  />
                  <BoardDockAction
                    icon="checkmark" label="Done"
                    a11yLabel="Finish editing"
                    onPress={handleDockDone} kind="primary"
                  />
                </>
              ) : null}
            </View>
          </RNAnimated.View>
        </View>

        {/* ── Undo toast (Rule 26) ─────────────────────────────────────── */}
        {undoToast ? (
          <View style={styles.undoToast} accessibilityRole="alert" accessibilityLiveRegion="polite">
            <Text style={styles.undoToastText}>Tile removed</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Undo remove tile"
              onPress={handleUndoHide}
              hitSlop={12}
              style={styles.undoToastButton}
            >
              <Text style={styles.undoToastButtonText}>Undo</Text>
            </Pressable>
          </View>
        ) : null}

        <View pointerEvents="none" style={styles.ghostOverlay}>
          {ghosts.map(ghost => (
            <GhostTileClone key={ghost.id} ghost={ghost} onDone={finishGhost} />
          ))}
        </View>
      </View>

      {/* ── Add Symbol / Folder modals (Priority 2) ───────────────────── */}
      <AddSymbolModal
        visible={addSymbolModalVisible}
        onDismiss={() => setAddSymbolModalVisible(false)}
        onAdd={handleAddSymbolConfirm}
      />
      <AddFolderModal
        visible={addFolderModalVisible}
        onDismiss={() => setAddFolderModalVisible(false)}
        onAdd={handleAddFolderConfirm}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  screenRoot: {
    flex: 1,
  },
  errorBanner: {
    marginHorizontal: spacing.md,
    marginTop: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 8,
  },
  errorText: {
    color: '#FFFFFF',
    fontWeight: '800',
    textAlign: 'center',
  },
  messageArea: {
    height: MESSAGE_HEIGHT,
    paddingLeft: 21,
    paddingRight: 17,
    paddingTop: 20,
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingBottom: 18,
    borderBottomWidth: 1.4,
  },
  messageButton: {
    flex: 1,
    height: 48,
    justifyContent: 'center',
    position: 'relative',
  },
  messageText: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '700',
  },
  messagePlaceholder: {
    fontWeight: '400',
  },
  messageSlotRow: {
    position: 'absolute',
    left: 0,
    top: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: MESSAGE_SLOT_GAP,
  },
  messageSlotRowHidden: {
    opacity: 0,
  },
  messageSlot: {
    width: MESSAGE_CHIP_SIZE,
    height: MESSAGE_CHIP_SIZE,
  },
  messageChip: {
    width: MESSAGE_CHIP_SIZE,
    height: MESSAGE_CHIP_SIZE,
    position: 'relative',
  },
  messageChipBackground: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: MESSAGE_CHIP_SIZE,
    height: MESSAGE_CHIP_SIZE,
  },
  messageChipLabel: {
    position: 'absolute',
    left: 3,
    right: 3,
    top: 5,
    fontSize: 8,
    lineHeight: 10,
    fontWeight: '800',
    textAlign: 'center',
  },
  backspace: {
    width: 58,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  topNavSlot: {
    position: 'relative',
    zIndex: 2,
    overflow: 'hidden',
  },
  topNavPanel: {
    marginHorizontal: 0,
    height: TOP_NAV_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 32,
    paddingTop: 12,
    paddingBottom: 9,
    paddingHorizontal: 20,
  },
  // Full-width bottom border of the top nav. Rendered as a view rather than
  // a border so it isn't clipped by the animated slot's overflow:hidden.
  topNavBottomBorder: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: CHROME_SEPARATOR_WIDTH,
  },
  topTab: {
    width: 72,
    height: 57,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Very subtle opacity dip — colour + scale animation already handles the active state.
  topTabPressed: {
    opacity: 0.95,
  },
  topTabContent: {
    alignItems: 'center',
    justifyContent: 'space-between',
    height: '100%',
    width: '100%',
    paddingTop: 2,
    paddingBottom: 1,
  },
  topTabIconMount: {
    height: 30,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  topTabLabel: {
    fontSize: 10,
    lineHeight: 12,
    fontWeight: '800',
    letterSpacing: 0.6,
    textAlign: 'center',
  },
  board: {
    flex: 1,
  },
  boardContent: {
    // Tiles are absolutely positioned inside the grid container View.
    // This contentContainerStyle only provides the outer padding.
    paddingTop: BOARD_TOP_GAP,
    paddingBottom: 10,
    alignItems: 'flex-start',
  },
  tilePressable: {
    width: '100%',
    height: '100%',
  },
  // tilePressed removed — spring scale on onPressIn/Out is the sole press feedback
  deleteBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5,
  },
  tileEditOutline: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 14,
  },
  tileShell: {
    position: 'relative',
  },
  folderTab: {
    position: 'absolute',
    left: 0,
    top: 0,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    borderWidth: 1.5,
    borderBottomWidth: 0,
  },
  folderFace: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 10,
    borderWidth: 1.5,
  },
  folderLabel: {
    position: 'absolute',
    left: 8,
    right: 8,
    top: 10,
    fontSize: 22,
    lineHeight: 26,
    fontWeight: '700',
    textAlign: 'center',
  },
  // Symbol mount sits below the label and centers the Mulberry pictogram.
  // Top offset clears the label (16 + 24 line-height + a hair of breathing
  // room) so glyph + label never overlap on the smallest 88×88 tile.
  symbolMount: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 34,
    bottom: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wordTile: {
    position: 'relative',
  },
  // Flat coloured fill behind the symbol/label. Rounded corners match the
  // optical weight of the folder PNGs so word and folder tiles share a
  // visual rhythm.
  wordTileFallbackBorder: {
    borderRadius: 14,
    borderWidth: 1.5,
    borderStyle: 'dashed',
  },
  wordTileFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    borderRadius: 14,
  },
  // Typography mirrors `folderLabel` so words and folders read as one family.
  wordLabel: {
    position: 'absolute',
    left: 8,
    right: 8,
    top: 10,
    fontSize: 22,
    lineHeight: 26,
    fontWeight: '700',
    textAlign: 'center',
  },
  ghostOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 20,
  },
  ghostTile: {
    position: 'absolute',
  },
  boardArea: {
    flex: 1,
  },
  boardDock: {
    paddingTop: spacing.sm,
  },
  dockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'nowrap',
    gap: DOCK_GAP,
  },
  dockAction: {
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dockActionLabel: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  dockAddToggleLabel: {
    fontSize: 13,
    lineHeight: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  dockIconOnlyMount: {
    width: DOCK_ICON_TOGGLE + 4,
    height: DOCK_ICON_TOGGLE + 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dockIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  dockIconRowGlyph: {
    width: DOCK_ICON_ROW + 2,
    height: DOCK_ROW_LABEL + 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dockRowLabel: {
    fontSize: DOCK_ROW_LABEL,
    lineHeight: DOCK_ROW_LABEL + 3,
    fontWeight: '700',
    textAlign: 'left',
  },
  dockIconStack: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 1,
  },
  dockIconStackGlyph: {
    width: DOCK_ICON_ACTION + 2,
    height: DOCK_ICON_ACTION + 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navRow: {
    flexDirection: 'row',
    gap: TILE_GAP,
    marginTop: 0,
  },
  navTileShell: {
    position: 'relative',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navTileIconMount: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navTileLabel: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    paddingBottom: 6,
  },
  // ── Undo toast ──────────────────────────────────────────────────────────
  undoToast: {
    position: 'absolute',
    bottom: 100,
    left: spacing.lg,
    right: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#323232',
    borderRadius: radii.button,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  undoToastText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  undoToastButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  undoToastButtonText: {
    color: '#62C1FF',
    fontSize: 15,
    fontWeight: '700',
  },
});
