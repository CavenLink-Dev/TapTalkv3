import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  AccessibilityActionEvent,
  AccessibilityInfo,
  ActionSheetIOS,
  Alert,
  Animated as RNAnimated,
  Easing as RNEasing,
  LayoutAnimation,
  LayoutChangeEvent,
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
import Svg, { Path as SvgPath } from 'react-native-svg';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Icon } from '../../src/components/native/Icon';
import { Href, useRouter } from 'expo-router';
import { BackOutIcon, BoardHomeIcon } from '../../src/components/icons/FigmaIcons';
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
import { useReduceMotion } from '../../src/hooks/useReduceMotion';
import {
  resolveSymbolForKeyword,
  ResolvedSymbol,
} from '../../src/features/symbol-brain/resolveSymbolForKeyword';
import { setTabBarHidden } from '../../src/features/board/chromeVisibility';

type TileKind = 'folder' | 'word' | 'action';
type BoardMode = 'home' | 'foods' | 'animals' | 'tools' | 'quick' | 'settings' | 'emergency' | 'feelings';
// Top-nav vocabulary (board_control_bar restructure): EDIT opens the Edit
// Control Bar (moved up from the bottom dock), LAYOUT is the old Resize
// tool (grid + handles), SAVED opens saved sentences (old Quick — the
// merged TapTalk+Saved page comes later), SETTINGS opens board settings
// (old "Board" dock action). CLEAR was removed.
type TopTab = 'edit' | 'layout' | 'saved' | 'settings';

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

/** Re-pack anchor slots in row-major order (e.g. after column count changes). */
function reflowLayoutSlots(layout: BoardLayout): BoardLayout {
  return [...layout]
    .sort((a, b) => a.slot - b.slot)
    .map((p, i) => ({ ...p, slot: i }));
}

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
// Target number of tile rows visible in the board viewport. Tiles are sized so
// roughly this many rows fit vertically (big, readable symbols/folders).
const VISIBLE_ROWS = 4;
// 8pt uniform gap between columns and rows — outer spacing, not inner.
const TILE_CORNER_RADIUS = 5;
const TILE_GAP = 8;
const TILE_V_GAP = 8;
// 4pt side gutter, added on top of the safe-area inset. 4 columns on a 393pt iPhone.
const TILE_LEFT_PADDING = 4;
const BOARD_TOP_GAP = 32;
// Absolute max tile edge (pt). Actual size is the lesser of this, what fits the
// width in 3 columns, and what lets VISIBLE_ROWS rows fit the viewport height.
const TILE_SIZE = 132;
const MAX_FW = 8;
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
  edit:     { icon: 'create',   label: 'EDIT'     },
  layout:   { icon: 'grid',     label: 'LAYOUT'   },
  saved:    { icon: 'bookmark', label: 'SAVED'    },
  settings: { icon: 'settings', label: 'SETTINGS' },
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
  // Category folders + 50 home-grid words (56 tiles — scrolls on the default screen).
  { id: 'people', label: 'People', kind: 'folder', target: 'quick',   color: '#1DCDFF', mulberrySymbolId: 'mulberry_family_excv0f' },
  { id: 'foods',  label: 'Foods',  kind: 'folder', target: 'foods',   color: '#1DCDFF', mulberrySymbolId: 'mulberry_food_atkyaz' },
  { id: 'places', label: 'Places', kind: 'folder', target: 'animals', color: '#1DCDFF', mulberrySymbolId: 'mulberry_house_1ice1xp' },
  { id: 'actions',label: 'Actions',kind: 'folder', target: 'tools',   color: '#1DCDFF', mulberrySymbolId: 'mulberry_run_1l6fpg7' },
  { id: 'feelings-folder', label: 'Feelings', kind: 'folder', target: 'feelings', color: '#1DCDFF', mulberrySymbolId: 'mulberry_happy_man_d75g78' },
  { id: 'emergency-folder', label: 'Help', kind: 'folder', target: 'emergency', color: '#1DCDFF', isProtected: true, mulberrySymbolId: 'mulberry_help_1g1ppr' },
  // Home-screen core words — visible on the main board for a fuller demo grid.
  { id: 'home-hello',   label: 'Hello',   kind: 'word', color: SYMBOL_GREEN,  speech: 'hello',   mulberrySymbolId: 'mulberry_hello_1jyrbjf',     wordType: 'social' },
  { id: 'home-mum',     label: 'Mum',     kind: 'word', color: SYMBOL_PURPLE, speech: 'mum',     mulberrySymbolId: 'mulberry_mum_parent_36g4lb', wordType: 'noun' },
  { id: 'home-dad',     label: 'Dad',     kind: 'word', color: SYMBOL_BLUE,   speech: 'dad',     mulberrySymbolId: 'mulberry_dad_parent_1u2b52j', wordType: 'noun' },
  { id: 'home-teacher', label: 'Teacher', kind: 'word', color: SYMBOL_ORANGE, speech: 'teacher', mulberrySymbolId: 'mulberry_teacher_1a_6kba0a', wordType: 'noun' },
  { id: 'home-good',    label: 'Good',    kind: 'word', color: SYMBOL_GREEN,  speech: 'good',    mulberrySymbolId: 'mulberry_good_eluzd6',       wordType: 'adjective' },
  { id: 'home-car',     label: 'Car',     kind: 'word', color: SYMBOL_YELLOW, speech: 'car',     mulberrySymbolId: 'mulberry_car_1m0ff95',       wordType: 'noun' },
  { id: 'home-apple',   label: 'Apple',   kind: 'word', color: SYMBOL_RED,    speech: 'apple',   mulberrySymbolId: 'mulberry_apple_1ogqpa9',     wordType: 'noun' },
  { id: 'home-pizza',   label: 'Pizza',   kind: 'word', color: SYMBOL_ORANGE, speech: 'pizza',   mulberrySymbolId: 'mulberry_pizza_rdymwh',      wordType: 'noun' },
  { id: 'home-cat',     label: 'Cat',     kind: 'word', color: SYMBOL_ORANGE, speech: 'cat',     mulberrySymbolId: 'mulberry_cat_1lz3nun',       wordType: 'noun' },
  { id: 'home-dog',     label: 'Dog',     kind: 'word', color: SYMBOL_GREEN,  speech: 'dog',     mulberrySymbolId: 'mulberry_dog_1bfmoh1',       wordType: 'noun' },
  { id: 'home-bus',     label: 'Bus',     kind: 'word', color: SYMBOL_YELLOW, speech: 'bus',     mulberrySymbolId: 'mulberry_bus_1abvtwt',       wordType: 'noun' },
  { id: 'home-book',    label: 'Book',    kind: 'word', color: SYMBOL_PURPLE, speech: 'book',    mulberrySymbolId: 'mulberry_read_book_nw97ne',  wordType: 'noun' },
  { id: 'home-fish',    label: 'Fish',    kind: 'word', color: SYMBOL_BLUE,   speech: 'fish',    mulberrySymbolId: 'mulberry_fish_1u95ovx',      wordType: 'noun' },
  { id: 'home-ice',     label: 'Icecream', kind: 'word', color: SYMBOL_YELLOW, speech: 'ice cream', mulberrySymbolId: 'mulberry_ice_cream_1lbnd6p', wordType: 'noun' },
  // Extra home-grid demo words — fills the default board so it scrolls.
  { id: 'home-bird',    label: 'Bird',    kind: 'word', color: SYMBOL_BLUE,   speech: 'bird',    mulberrySymbolId: 'mulberry_bird_13ztxas',       wordType: 'noun' },
  { id: 'home-rabbit',  label: 'Rabbit',  kind: 'word', color: SYMBOL_PURPLE, speech: 'rabbit',  mulberrySymbolId: 'mulberry_rabbit_sjorvr',      wordType: 'noun' },
  { id: 'home-horse',   label: 'Horse',   kind: 'word', color: SYMBOL_ORANGE, speech: 'horse',   mulberrySymbolId: 'mulberry_horse_c0o22y',       wordType: 'noun' },
  { id: 'home-cow',     label: 'Cow',     kind: 'word', color: SYMBOL_GREEN,  speech: 'cow',     mulberrySymbolId: 'mulberry_cow_1pwmwc2',        wordType: 'noun' },
  { id: 'home-sheep',   label: 'Sheep',   kind: 'word', color: SYMBOL_YELLOW, speech: 'sheep',   mulberrySymbolId: 'mulberry_sheep_k1gt9e',       wordType: 'noun' },
  { id: 'home-duck',    label: 'Duck',    kind: 'word', color: SYMBOL_GREEN,  speech: 'duck',    mulberrySymbolId: 'mulberry_duck_4lgl4g',        wordType: 'noun' },
  { id: 'home-bread',   label: 'Bread',   kind: 'word', color: SYMBOL_ORANGE, speech: 'bread',   mulberrySymbolId: 'mulberry_bread_t6g6ux',       wordType: 'noun' },
  { id: 'home-cheese',  label: 'Cheese',  kind: 'word', color: SYMBOL_YELLOW, speech: 'cheese',  mulberrySymbolId: 'mulberry_cheese_qsgfck',      wordType: 'noun' },
  { id: 'home-banana',  label: 'Banana',  kind: 'word', color: SYMBOL_YELLOW, speech: 'banana',  mulberrySymbolId: 'mulberry_banana_rcoei',       wordType: 'noun' },
  { id: 'home-milk',    label: 'Milk',    kind: 'word', color: SYMBOL_BLUE,   speech: 'milk',    mulberrySymbolId: 'mulberry_milk_1pcjn1m',       wordType: 'noun' },
  { id: 'home-water',   label: 'Water',   kind: 'word', color: SYMBOL_BLUE,   speech: 'water',   mulberrySymbolId: 'mulberry_water_139tuvw',      wordType: 'noun' },
  { id: 'home-orange',  label: 'Orange',  kind: 'word', color: SYMBOL_ORANGE, speech: 'orange',  mulberrySymbolId: 'mulberry_orange_tfdxfd',      wordType: 'noun' },
  { id: 'home-house',   label: 'House',   kind: 'word', color: SYMBOL_ORANGE, speech: 'house',   mulberrySymbolId: 'mulberry_house_1ice1xp',      wordType: 'noun' },
  { id: 'home-school',  label: 'School',  kind: 'word', color: SYMBOL_BLUE,   speech: 'school',  mulberrySymbolId: 'mulberry_school_7v1fml',      wordType: 'noun' },
  { id: 'home-park',    label: 'Park',    kind: 'word', color: SYMBOL_GREEN,  speech: 'park',    mulberrySymbolId: 'mulberry_park_18ux2ty',       wordType: 'noun' },
  { id: 'home-beach',   label: 'Beach',   kind: 'word', color: SYMBOL_YELLOW, speech: 'beach',   mulberrySymbolId: 'mulberry_beach_drxxqc',       wordType: 'noun' },
  { id: 'home-shop',    label: 'Shop',    kind: 'word', color: SYMBOL_GREEN,  speech: 'shop',    mulberrySymbolId: 'mulberry_shop_8euq19',        wordType: 'noun' },
  { id: 'home-train',   label: 'Train',   kind: 'word', color: SYMBOL_BLUE,   speech: 'train',   mulberrySymbolId: 'mulberry_train_6zo4kp',       wordType: 'noun' },
  { id: 'home-plane',   label: 'Plane',   kind: 'word', color: SYMBOL_BLUE,   speech: 'plane',   mulberrySymbolId: 'mulberry_plane_1pir8pr',      wordType: 'noun' },
  { id: 'home-toilet',  label: 'Toilet',  kind: 'word', color: SYMBOL_BLUE,   speech: 'toilet',  mulberrySymbolId: 'mulberry_toilet_1t82u6e',     wordType: 'noun' },
  { id: 'home-yes',     label: 'Yes',     kind: 'word', color: SYMBOL_GREEN,  speech: 'yes',     mulberryName: 'good',                          wordType: 'interjection' },
  { id: 'home-no',      label: 'No',      kind: 'word', color: SYMBOL_RED,    speech: 'no',      mulberryName: 'bad',                           wordType: 'interjection' },
  { id: 'home-want',    label: 'Want',    kind: 'word', color: SYMBOL_BLUE,   speech: 'want',    mulberrySymbolId: 'mulberry_want_16yheia',       wordType: 'verb' },
  { id: 'home-more',    label: 'More',    kind: 'word', color: SYMBOL_GREEN,  speech: 'more',    mulberrySymbolId: 'mulberry_more_1r3s2f0',       wordType: 'adjective' },
  { id: 'home-eat',     label: 'Eat',     kind: 'word', color: SYMBOL_ORANGE, speech: 'eat',     mulberrySymbolId: 'mulberry_eat_18rupbi',        wordType: 'verb' },
  { id: 'home-drink',   label: 'Drink',   kind: 'word', color: SYMBOL_PURPLE, speech: 'drink',   mulberrySymbolId: 'mulberry_drink_16zxzpv',      wordType: 'verb' },
  { id: 'home-run',     label: 'Run',     kind: 'word', color: SYMBOL_GREEN,  speech: 'run',     mulberrySymbolId: 'mulberry_run_1l6fpg7',        wordType: 'verb' },
  { id: 'home-walk',    label: 'Walk',    kind: 'word', color: SYMBOL_BLUE,   speech: 'walk',    mulberrySymbolId: 'mulberry_walk_usrwun',        wordType: 'verb' },
  { id: 'home-play',    label: 'Play',    kind: 'word', color: SYMBOL_YELLOW, speech: 'play',    mulberrySymbolId: 'mulberry_play_juloe2',        wordType: 'verb' },
  { id: 'home-sleep',   label: 'Sleep',   kind: 'word', color: SYMBOL_BLUE,   speech: 'sleep',   mulberrySymbolId: 'mulberry_sleep_male_1s97unf', wordType: 'verb' },
  { id: 'home-swim',    label: 'Swim',    kind: 'word', color: SYMBOL_BLUE,   speech: 'swim',    mulberrySymbolId: 'mulberry_swim_1konnmm',       wordType: 'verb' },
  { id: 'home-jump',    label: 'Jump',    kind: 'word', color: SYMBOL_ORANGE, speech: 'jump',    mulberrySymbolId: 'mulberry_jump_apgvlo',        wordType: 'verb' },
  { id: 'home-sit',     label: 'Sit',     kind: 'word', color: SYMBOL_PURPLE, speech: 'sit',     mulberrySymbolId: 'mulberry_sit_1aksru8',        wordType: 'verb' },
  { id: 'home-happy',   label: 'Happy',   kind: 'word', color: SYMBOL_YELLOW, speech: 'happy',   mulberrySymbolId: 'mulberry_happy_man_d75g78',   wordType: 'adjective' },
  { id: 'home-sad',     label: 'Sad',     kind: 'word', color: SYMBOL_BLUE,   speech: 'sad',     mulberrySymbolId: 'mulberry_sad_man_1xt7bsy',    wordType: 'adjective' },
  { id: 'home-help',    label: 'Help',    kind: 'word', color: SYMBOL_BLUE,   speech: 'help',    mulberrySymbolId: 'mulberry_help_1g1ppr',        wordType: 'verb' },
];

// ── Emergency & Help (Priority 4) ───────────────────────────────────────────
// One-word tile labels + symbols; full phrases live in `speech`. Non-deletable
// in edit mode. Longer sentences belong in Quick Text, not on board labels.
const EMERGENCY_TILES: BoardTile[] = [
  { id: 'emer-aac',  label: 'AAC',  kind: 'word', color: '#FF3B30', speech: 'I use A A C to communicate',      isProtected: true, wordType: 'phrase', mulberrySymbolId: 'mulberry_communication_device_m2l9ji' },
  { id: 'emer-wait', label: 'Wait', kind: 'word', color: '#FF9500', speech: 'Please wait',                   isProtected: true, wordType: 'phrase', mulberrySymbolId: 'mulberry_wait_17bhqut' },
  { id: 'emer-help', label: 'Help', kind: 'word', color: '#FF3B30', speech: 'I need help',                   isProtected: true, wordType: 'phrase', mulberrySymbolId: 'mulberry_help_1g1ppr' },
  { id: 'emer-pain', label: 'Pain', kind: 'word', color: '#FF3B30', speech: 'I am in pain',                  isProtected: true, wordType: 'phrase', mulberrySymbolId: 'mulberry_stomach_ache_16rpjjq' },
  { id: 'emer-call', label: 'Call', kind: 'word', color: '#FF9500', speech: 'Please call my support person', isProtected: true, wordType: 'phrase', mulberrySymbolId: 'mulberry_telephone_mobile_npvlt1' },
  { id: 'back-emergency', label: 'Home', kind: 'folder', target: 'home', color: '#1DCDFF', mulberrySymbolId: 'mulberry_house_1ice1xp' },
];

export const BOARD_TILES: Record<BoardMode, BoardTile[]> = {
  home: HOME_TILES,
  foods: [
    { id: 'cheese', label: 'Cheese', kind: 'word', color: SYMBOL_YELLOW, speech: 'cheese', mulberrySymbolId: 'mulberry_cheese_qsgfck', wordType: 'noun' },
    { id: 'apple',  label: 'Apple',  kind: 'word', color: SYMBOL_RED,    speech: 'apple',  mulberrySymbolId: 'mulberry_apple_1ogqpa9',  wordType: 'noun' },
    { id: 'bread',  label: 'Bread',  kind: 'word', color: SYMBOL_ORANGE, speech: 'bread',  mulberrySymbolId: 'mulberry_bread_t6g6ux',   wordType: 'noun' },
    { id: 'banana', label: 'Banana', kind: 'word', color: SYMBOL_YELLOW, speech: 'banana', mulberrySymbolId: 'mulberry_banana_rcoei',   wordType: 'noun' },
    { id: 'milk',   label: 'Milk',   kind: 'word', color: SYMBOL_BLUE,   speech: 'milk',   mulberrySymbolId: 'mulberry_milk_1pcjn1m',   wordType: 'noun' },
    { id: 'water',  label: 'Water',  kind: 'word', color: SYMBOL_BLUE,   speech: 'water',  mulberrySymbolId: 'mulberry_water_139tuvw',  wordType: 'noun' },
    { id: 'pizza',  label: 'Pizza',  kind: 'word', color: SYMBOL_ORANGE, speech: 'pizza',  mulberrySymbolId: 'mulberry_pizza_rdymwh',   wordType: 'noun' },
    { id: 'orange', label: 'Orange', kind: 'word', color: SYMBOL_ORANGE, speech: 'orange', mulberrySymbolId: 'mulberry_orange_tfdxfd',  wordType: 'noun' },
    { id: 'egg',    label: 'Egg',    kind: 'word', color: SYMBOL_YELLOW, speech: 'egg',    mulberrySymbolId: 'mulberry_egg_1u25ooc',    wordType: 'noun' },
    { id: 'carrot', label: 'Carrot', kind: 'word', color: SYMBOL_ORANGE, speech: 'carrot', mulberrySymbolId: 'mulberry_carrot_keil00',  wordType: 'noun' },
    { id: 'potato', label: 'Potato', kind: 'word', color: SYMBOL_YELLOW, speech: 'potato', mulberrySymbolId: 'mulberry_potato_167a7ko', wordType: 'noun' },
    { id: 'biscuit',label: 'Biscuit',kind: 'word', color: SYMBOL_ORANGE, speech: 'biscuit',mulberrySymbolId: 'mulberry_biscuits_209lah',wordType: 'noun' },
    { id: 'juice',  label: 'Juice',  kind: 'word', color: SYMBOL_ORANGE, speech: 'juice',  mulberrySymbolId: 'mulberry_orange_juice_vav8xi', wordType: 'noun' },
    { id: 'chicken',label: 'Chicken',kind: 'word', color: SYMBOL_YELLOW, speech: 'chicken',mulberrySymbolId: 'mulberry_chicken_live_2os875', wordType: 'noun' },
    { id: 'back-foods', label: 'Home', kind: 'folder', target: 'home', color: '#1DCDFF', mulberrySymbolId: 'mulberry_house_1ice1xp' },
  ],
  animals: [
    { id: 'school', label: 'School', kind: 'word', color: SYMBOL_BLUE,   speech: 'school', mulberrySymbolId: 'mulberry_school_7v1fml',  wordType: 'noun' },
    { id: 'shop',   label: 'Shop',   kind: 'word', color: SYMBOL_GREEN,  speech: 'shop',   mulberrySymbolId: 'mulberry_shop_8euq19',    wordType: 'noun' },
    { id: 'park',   label: 'Park',   kind: 'word', color: SYMBOL_GREEN,  speech: 'park',   mulberrySymbolId: 'mulberry_park_18ux2ty',   wordType: 'noun' },
    { id: 'beach',  label: 'Beach',  kind: 'word', color: SYMBOL_YELLOW, speech: 'beach',  mulberrySymbolId: 'mulberry_beach_drxxqc',   wordType: 'noun' },
    { id: 'house',  label: 'House',  kind: 'word', color: SYMBOL_ORANGE, speech: 'house',  mulberrySymbolId: 'mulberry_house_1ice1xp',  wordType: 'noun' },
    { id: 'car',    label: 'Car',    kind: 'word', color: SYMBOL_YELLOW, speech: 'car',    mulberrySymbolId: 'mulberry_car_1m0ff95',    wordType: 'noun' },
    { id: 'toilet', label: 'Toilet', kind: 'word', color: SYMBOL_BLUE,   speech: 'toilet', mulberrySymbolId: 'mulberry_toilet_1t82u6e', wordType: 'noun' },
    { id: 'doctor', label: 'Doctor', kind: 'word', color: SYMBOL_PURPLE, speech: 'doctor', mulberrySymbolId: 'mulberry_doctor_1a_lcuwh3', wordType: 'noun' },
    { id: 'train',  label: 'Train',  kind: 'word', color: SYMBOL_BLUE,   speech: 'train',  mulberrySymbolId: 'mulberry_train_6zo4kp',   wordType: 'noun' },
    { id: 'plane',  label: 'Plane',  kind: 'word', color: SYMBOL_BLUE,   speech: 'plane',  mulberrySymbolId: 'mulberry_plane_1pir8pr',    wordType: 'noun' },
    { id: 'bus-place', label: 'Bus', kind: 'word', color: SYMBOL_YELLOW, speech: 'bus',    mulberrySymbolId: 'mulberry_bus_1abvtwt',      wordType: 'noun' },
    { id: 'church', label: 'Church', kind: 'word', color: SYMBOL_PURPLE, speech: 'church', mulberrySymbolId: 'mulberry_church_1t13yb2', wordType: 'noun' },
    { id: 'swim-place', label: 'Swim', kind: 'word', color: SYMBOL_BLUE, speech: 'swim', mulberrySymbolId: 'mulberry_swimming_class_fnsmmt', wordType: 'noun' },
    { id: 'horse',  label: 'Horse',  kind: 'word', color: SYMBOL_ORANGE, speech: 'horse', mulberrySymbolId: 'mulberry_horse_c0o22y',  wordType: 'noun' },
    { id: 'back-animals', label: 'Home', kind: 'folder', target: 'home', color: '#1DCDFF', mulberrySymbolId: 'mulberry_house_1ice1xp' },
  ],
  tools: [
    { id: 'run',        label: 'Run',        kind: 'word', color: SYMBOL_GREEN,  speech: 'run',         mulberrySymbolId: 'mulberry_run_1l6fpg7',        wordType: 'verb' },
    { id: 'walk',       label: 'Walk',       kind: 'word', color: SYMBOL_BLUE,   speech: 'walk',        mulberrySymbolId: 'mulberry_walk_usrwun',        wordType: 'verb' },
    { id: 'jump',       label: 'Jump',       kind: 'word', color: SYMBOL_ORANGE, speech: 'jump',        mulberrySymbolId: 'mulberry_jump_apgvlo',        wordType: 'verb' },
    { id: 'sit',        label: 'Sit',        kind: 'word', color: SYMBOL_PURPLE, speech: 'sit',         mulberrySymbolId: 'mulberry_sit_1aksru8',        wordType: 'verb' },
    { id: 'play',       label: 'Play',       kind: 'word', color: SYMBOL_YELLOW, speech: 'play',        mulberrySymbolId: 'mulberry_play_juloe2',        wordType: 'verb' },
    { id: 'sleep',      label: 'Sleep',      kind: 'word', color: SYMBOL_BLUE,   speech: 'sleep',       mulberrySymbolId: 'mulberry_sleep_male_1s97unf', wordType: 'verb' },
    { id: 'wash-hands', label: 'Wash', kind: 'word', color: SYMBOL_BLUE,   speech: 'wash hands',  mulberrySymbolId: 'mulberry_wash_hands_zcbt6k',  wordType: 'verb' },
    { id: 'open',       label: 'Open',       kind: 'word', color: SYMBOL_GREEN,  speech: 'open',        mulberrySymbolId: 'mulberry_open_6n4556',        wordType: 'verb' },
    { id: 'close',      label: 'Close',      kind: 'word', color: SYMBOL_RED,    speech: 'close',       mulberrySymbolId: 'mulberry_close_l7weaw',       wordType: 'verb' },
    { id: 'dance',      label: 'Dance',      kind: 'word', color: SYMBOL_PURPLE, speech: 'dance',       mulberrySymbolId: 'mulberry_dance_rdll6b',       wordType: 'verb' },
    { id: 'read',       label: 'Read',       kind: 'word', color: SYMBOL_BLUE,   speech: 'read',        mulberrySymbolId: 'mulberry_read_1gmx20c',       wordType: 'verb' },
    { id: 'write',      label: 'Write',      kind: 'word', color: SYMBOL_GREEN,  speech: 'write',       mulberrySymbolId: 'mulberry_write_17xcc0z',      wordType: 'verb' },
    { id: 'sing',       label: 'Sing',       kind: 'word', color: SYMBOL_YELLOW, speech: 'sing',        mulberrySymbolId: 'mulberry_sing_v5z66l',        wordType: 'verb' },
    { id: 'draw',       label: 'Draw',       kind: 'word', color: SYMBOL_ORANGE, speech: 'draw',        mulberrySymbolId: 'mulberry_draw_19hlq66',       wordType: 'verb' },
    { id: 'look',       label: 'Look',       kind: 'word', color: SYMBOL_BLUE,   speech: 'look',        mulberrySymbolId: 'mulberry_look_1r6a5uh',       wordType: 'verb' },
    { id: 'back-tools', label: 'Home', kind: 'folder', target: 'home', color: '#1DCDFF', mulberrySymbolId: 'mulberry_house_1ice1xp' },
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
    { id: 'go',     label: 'Go',   kind: 'word', color: SYMBOL_GREEN,  speech: 'go',    mulberrySymbolId: 'mulberry_go_19b4gza',    wordType: 'verb' },
    { id: 'wait',   label: 'Wait', kind: 'word', color: SYMBOL_ORANGE, speech: 'wait',  mulberrySymbolId: 'mulberry_wait_17bhqut',  wordType: 'verb' },
    { id: 'hug',    label: 'Hug',  kind: 'word', color: SYMBOL_PURPLE, speech: 'hug',   mulberrySymbolId: 'mulberry_hug_1dc7yxw',   wordType: 'verb' },
    { id: 'share',  label: 'Share',kind: 'word', color: SYMBOL_BLUE,   speech: 'share', mulberrySymbolId: 'mulberry_share_1xz6lbn', wordType: 'verb' },
    { id: 'loud',   label: 'Loud', kind: 'word', color: SYMBOL_ORANGE, speech: 'loud',  mulberrySymbolId: 'mulberry_loud_1kbu7nf',  wordType: 'adjective' },
    { id: 'brother',label: 'Brother',kind:'word', color: SYMBOL_BLUE,   speech: 'brother',mulberrySymbolId: 'mulberry_brother_1jo99rx', wordType: 'noun' },
    { id: 'sister', label: 'Sister', kind: 'word', color: SYMBOL_PURPLE, speech: 'sister', mulberrySymbolId: 'mulberry_sister_1bahkrn', wordType: 'noun' },
    { id: 'baby',   label: 'Baby', kind: 'word', color: SYMBOL_YELLOW, speech: 'baby',  mulberrySymbolId: 'mulberry_baby_1cxo7l',   wordType: 'noun' },
    { id: 'grandma',label: 'Grandma',kind:'word', color: SYMBOL_GREEN,  speech: 'grandma',mulberrySymbolId: 'mulberry_grandmother_1h16pum', wordType: 'noun' },
    { id: 'grandpa',label: 'Grandpa',kind:'word', color: SYMBOL_GREEN,  speech: 'grandpa',mulberrySymbolId: 'mulberry_grandfather_1dr1fzv', wordType: 'noun' },
    { id: 'back-quick', label: 'Home', kind: 'folder', target: 'home', color: '#1DCDFF', mulberrySymbolId: 'mulberry_house_1ice1xp' },
  ],
  feelings: [
    { id: 'happy',    label: 'Happy',    kind: 'word', color: SYMBOL_YELLOW, speech: 'happy',    mulberrySymbolId: 'mulberry_happy_man_d75g78',    wordType: 'adjective' },
    { id: 'sad',      label: 'Sad',      kind: 'word', color: SYMBOL_BLUE,   speech: 'sad',      mulberrySymbolId: 'mulberry_sad_man_1xt7bsy',     wordType: 'adjective' },
    { id: 'angry',    label: 'Angry',    kind: 'word', color: SYMBOL_RED,    speech: 'angry',    mulberrySymbolId: 'mulberry_angry_man_1g31prr',   wordType: 'adjective' },
    { id: 'excited',  label: 'Excited',  kind: 'word', color: SYMBOL_ORANGE, speech: 'excited',  mulberrySymbolId: 'mulberry_excited_man_5aqbg6',  wordType: 'adjective' },
    { id: 'worried',  label: 'Worried',  kind: 'word', color: SYMBOL_PURPLE, speech: 'worried',  mulberrySymbolId: 'mulberry_worried_man_fzvxd0',  wordType: 'adjective' },
    { id: 'love',     label: 'Love',     kind: 'word', color: SYMBOL_RED,    speech: 'love',     mulberrySymbolId: 'mulberry_heart_9841r7',        wordType: 'noun' },
    { id: 'tired',    label: 'Tired',    kind: 'word', color: SYMBOL_BLUE,   speech: 'tired',    mulberrySymbolId: 'mulberry_sleep_male_1s97unf',  wordType: 'adjective' },
    { id: 'quiet',    label: 'Quiet',    kind: 'word', color: SYMBOL_GREEN,  speech: 'quiet',    mulberrySymbolId: 'mulberry_quiet_4csbx1',        wordType: 'adjective' },
    { id: 'hot',      label: 'Hot',      kind: 'word', color: SYMBOL_RED,    speech: 'hot',      mulberrySymbolId: 'mulberry_hot_person_3moowg', wordType: 'adjective' },
    { id: 'hungry',   label: 'Hungry',   kind: 'word', color: SYMBOL_ORANGE, speech: 'hungry',   mulberrySymbolId: 'mulberry_hungry_sp7py',        wordType: 'adjective' },
    { id: 'thirsty',  label: 'Thirsty',  kind: 'word', color: SYMBOL_BLUE,   speech: 'thirsty',  mulberrySymbolId: 'mulberry_thirsty_j9fv0w',      wordType: 'adjective' },
    { id: 'surprised',label: 'Surprised',kind: 'word', color: SYMBOL_YELLOW, speech: 'surprised',mulberrySymbolId: 'mulberry_surprised_man_580cux',wordType: 'adjective' },
    { id: 'cold',     label: 'Cold',     kind: 'word', color: SYMBOL_BLUE,   speech: 'cold',     mulberrySymbolId: 'mulberry_snow_i6crm4',       wordType: 'adjective' },
    { id: 'upset',    label: 'Upset',    kind: 'word', color: SYMBOL_RED,    speech: 'upset',    mulberrySymbolId: 'mulberry_bad_12s0dym',       wordType: 'adjective' },
    { id: 'back-feelings', label: 'Home', kind: 'folder', target: 'home', color: '#1DCDFF', mulberrySymbolId: 'mulberry_house_1ice1xp' },
  ],
  settings: [
    { id: 'hide-nav',        label: 'Hide',     kind: 'action', color: SYMBOL_PURPLE },
    { id: 'clear-settings',  label: 'Clear',    kind: 'action', color: SYMBOL_RED    },
    { id: 'home-settings',   label: 'Home',     kind: 'folder', target: 'home', color: '#1DCDFF', mulberrySymbolId: 'mulberry_house_1ice1xp' },
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
        {tile.id === 'back' ? (
          <BackOutIcon size={40} color={t.colors.text} />
        ) : (
          <BoardHomeIcon size={40} />
        )}
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
  | 'homeExpanded'    // Add / Sort / Board / Edit / Hide
  | 'addExpanded'     // Back / Symbol / Folder / Add
  | 'folderExpanded'  // Back / Add / Sort / Edit / Hide
  | 'folderCollapsed' // > / Add
  | 'editControls'    // Back / Select / Move / Delete / Resize / Done
  | 'editClean'       // Delete? / Add + / Done (resize-mode dock)
  | 'editDirty'       // Cancel / Save
  | 'quickManage';    // Back / Select–Unselect / Create + / Done? (Quick manage)

/**
 * Edit tools inside the new Edit Control Bar. Only one tool is active
 * at a time (users pick Select → tap tiles → pick Move / Delete). The
 * old `editMode` boolean is preserved but is now specifically the
 * "resize tool active" flag (jiggle + handles + grid overlay).
 */
type BoardEditTool = 'none' | 'select' | 'move' | 'resize';

/** Sort options offered by the Sort popover. */
type BoardSortMode = 'type' | 'name' | 'category';

/**
 * One reversible board edit. `layouts` is a snapshot of the whole custom
 * layouts map (moves touch two boards at once), `favourites` the active
 * board's pinned list, and `restoreTileIds` any tiles a delete hid via
 * the persisted HIDE_TILE dispatch (undo re-shows them with RESTORE_TILE).
 */
type BoardUndoEntry = {
  label: string;
  layouts: Partial<Record<BoardMode, BoardLayout>>;
  favourites: string[];
  board: BoardMode;
  restoreTileIds?: string[];
};

// The hidden control bar slides fully offscreen; the DockPeekPill on the
// left edge is the persistent, visible way back (item 4 v2 — Hide).

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
  tint,
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
  /** Optional border + content colour override (e.g. red Unselect). */
  tint?: string;
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
              ? (tint ?? t.colors.text)
              : (tint ?? t.colors.symbolOutline),
            borderWidth: effectiveKind === 'primary' ? 0 : 1.6,
          },
          disabled && { opacity: 0.4 },
        ];
      }}
    >
      {({ pressed }) => {
        const contentColor =
          pressed && effectiveKind !== 'primary'
            ? (tint ?? t.colors.text)
            : effectiveKind === 'primary'
              ? '#FFFFFF'
              : tint
                ? tint
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
                maxFontSizeMultiplier={1.3}
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
                maxFontSizeMultiplier={1.3}
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
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.6}
            maxFontSizeMultiplier={1.3}
          >
            {label}
          </Text>
        );
      }}
    </Pressable>
  );
});

// ── DockPopover ──────────────────────────────────────────────────────────
// Small vertical menu anchored just above a Bottom Control Bar action
// (Sort options, Hide options). Persistent: tapping an option does NOT
// dismiss it, so the user can toggle sort/unsort repeatedly. Springs in
// gently and settles (calm, no harsh shadows); instant under Reduce Motion.
type DockPopoverOption = {
  key: string;
  label: string;
  a11yLabel: string;
  selected?: boolean;
  onPress: () => void;
};

function DockPopover({
  visible,
  anchorX,
  anchorWidth,
  a11yLabel,
  options,
}: {
  visible: boolean;
  /** Anchor button x/width relative to the dock row (same coord space). */
  anchorX: number;
  anchorWidth: number;
  a11yLabel: string;
  options: DockPopoverOption[];
}) {
  const t = useTheme();
  const reduceMotion = useReduceMotion();
  const { width: screenW } = useWindowDimensions();
  const anim = useRef(new RNAnimated.Value(0)).current;
  const [mounted, setMounted] = useState(visible);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      if (reduceMotion) { anim.setValue(1); return; }
      anim.setValue(0);
      RNAnimated.spring(anim, {
        toValue: 1,
        friction: 9,
        tension: 90,
        useNativeDriver: true,
      }).start();
    } else if (reduceMotion) {
      anim.setValue(0);
      setMounted(false);
    } else {
      RNAnimated.timing(anim, {
        toValue: 0,
        duration: 120,
        useNativeDriver: true,
      }).start(({ finished }) => { if (finished) setMounted(false); });
    }
  }, [anim, reduceMotion, visible]);

  if (!mounted) return null;

  const POP_WIDTH = 172;
  // Centre over the anchor, clamped to the screen with an 8pt margin.
  const left = Math.min(
    Math.max(anchorX + anchorWidth / 2 - POP_WIDTH / 2, spacing.sm),
    screenW - POP_WIDTH - spacing.sm,
  );

  return (
    <RNAnimated.View
      accessibilityRole="menu"
      accessibilityLabel={a11yLabel}
      style={[
        styles.dockPopover,
        {
          left,
          width: POP_WIDTH,
          backgroundColor: t.isDark ? t.colors.navBackground : '#FFFFFF',
          borderColor: t.colors.symbolOutline,
          opacity: anim,
          transform: [{
            translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }),
          }],
        },
      ]}
    >
      {options.map(opt => (
        <Pressable
          key={opt.key}
          accessibilityRole="menuitem"
          accessibilityLabel={opt.a11yLabel}
          accessibilityState={{ selected: Boolean(opt.selected) }}
          onPress={opt.onPress}
          // Brief dim on press (opacity feedback) + soft fill — no harsh colour.
          style={({ pressed }) => [
            styles.dockPopoverItem,
            {
              backgroundColor: pressed
                ? (t.isDark ? t.colors.input : colors.softBlue)
                : 'transparent',
              opacity: pressed ? 0.85 : 1,
            },
          ]}
        >
          <Text
            style={[styles.dockPopoverItemLabel, { color: t.colors.text }]}
            numberOfLines={1}
            maxFontSizeMultiplier={1.4}
          >
            {opt.label}
          </Text>
          {/* Selected state does not rely on colour alone — checkmark glyph. */}
          <View style={styles.dockPopoverCheck}>
            {opt.selected ? (
              <Icon name="checkmark" size={18} color={t.colors.primary} strokeWidth={3} />
            ) : null}
          </View>
        </Pressable>
      ))}
    </RNAnimated.View>
  );
}

// ── Quick tag badge ──────────────────────────────────────────────────────
// Small circular lightning badge overlaid on Quick-tagged symbols
// (assets/symbol/quick_tag_for_quick_control_bar_selected.svg, inlined so
// it renders through react-native-svg like every other glyph). Rendered
// at 0.4 opacity while the Manage bar is open ("already tagged, editable").
const QuickTagBadge = React.memo(function QuickTagBadge({
  size = 16,
  dimmed = false,
}: { size?: number; dimmed?: boolean }) {
  return (
    <View style={[styles.quickBadge, dimmed && { opacity: 0.4 }]} pointerEvents="none">
      <Svg width={size} height={size} viewBox="0 0 16.1328 15.7715">
        <SvgPath fill="#FFFFFF" d="M7.88086 14.2773C4.3457 14.2773 1.49414 11.416 1.49414 7.88086C1.49414 4.3457 4.3457 1.48438 7.88086 1.48438C11.416 1.48438 14.2773 4.3457 14.2773 7.88086C14.2773 11.416 11.416 14.2773 7.88086 14.2773Z" />
        <SvgPath fill="#0A84FF" d="M7.88086 15.7617C12.2363 15.7617 15.7715 12.2363 15.7715 7.88086C15.7715 3.52539 12.2363 0 7.88086 0C3.53516 0 0 3.52539 0 7.88086C0 12.2363 3.53516 15.7617 7.88086 15.7617ZM7.88086 14.2773C4.3457 14.2773 1.49414 11.416 1.49414 7.88086C1.49414 4.3457 4.3457 1.48438 7.88086 1.48438C11.416 1.48438 14.2773 4.3457 14.2773 7.88086C14.2773 11.416 11.416 14.2773 7.88086 14.2773Z" />
        <SvgPath fill="#0A84FF" d="M4.55078 8.37891C4.55078 8.58398 4.7168 8.74023 4.93164 8.74023L7.4707 8.74023L6.12305 12.373C5.92773 12.9004 6.48438 13.1836 6.83594 12.7637L10.957 7.58789C11.0449 7.49023 11.0938 7.37305 11.0938 7.26562C11.0938 7.06055 10.918 6.9043 10.7129 6.9043L8.16406 6.9043L9.51172 3.28125C9.7168 2.75391 9.15039 2.46094 8.80859 2.89062L4.67773 8.05664C4.59961 8.1543 4.55078 8.27148 4.55078 8.37891Z" />
      </Svg>
    </View>
  );
});

// ── DockPeekPill ─────────────────────────────────────────────────────────
// Persistent "way back" while the control bar is hidden. A soft blob pill
// hugging the left edge, vertically centred where the dock used to sit,
// with a vertical grip (three stacked bars) so it reads as a floating
// handle above the board. Tap restores the controls; long-press opens a
// small popover with partial-hide toggles (Nav Bar / Control Bar). Springs
// in from the left edge when the dock hides; instant under Reduce Motion.
function DockPeekPill({
  onPress,
  onLongPress,
}: {
  onPress: () => void;
  onLongPress: () => void;
}) {
  const t = useTheme();
  const reduceMotion = useReduceMotion();
  const anim = useRef(new RNAnimated.Value(0)).current;

  useEffect(() => {
    if (reduceMotion) { anim.setValue(1); return; }
    anim.setValue(0);
    RNAnimated.spring(anim, {
      toValue: 1,
      friction: 7,
      tension: 64,
      useNativeDriver: true,
    }).start();
  }, [anim, reduceMotion]);

  return (
    <RNAnimated.View
      style={[
        styles.dockPeekPillMount,
        {
          opacity: anim,
          transform: [{
            translateX: anim.interpolate({ inputRange: [0, 1], outputRange: [-64, 0] }),
          }],
        },
      ]}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Show controls"
        accessibilityHint="Double tap to bring back the control bar and navigation bar. Long press for partial options."
        onPress={onPress}
        onLongPress={onLongPress}
        delayLongPress={350}
        hitSlop={{ top: 10, bottom: 10, left: 0, right: 10 }}
        style={({ pressed }) => [
          styles.dockPeekPill,
          {
            backgroundColor: t.isDark ? t.colors.navBackground : '#FFFFFF',
            borderColor: t.colors.symbolOutline,
            // Brief dim on press — opacity feedback, no colour switch.
            opacity: pressed ? 0.7 : 1,
          },
        ]}
      >
        {/* Vertical "burger" grip — three short stacked bars. */}
        <View style={styles.dockPeekGrip}>
          <View style={[styles.dockPeekGripBar, { backgroundColor: t.colors.textMuted }]} />
          <View style={[styles.dockPeekGripBar, { backgroundColor: t.colors.textMuted }]} />
          <View style={[styles.dockPeekGripBar, { backgroundColor: t.colors.textMuted }]} />
        </View>
      </Pressable>
    </RNAnimated.View>
  );
}

// Persisted Quick-tag storage key — the user's pinned Quick symbols
// survive app restarts (session-independent, all boards share one list).
const QUICK_TAGS_STORAGE_KEY = 'taptalk.quickTaggedIds.v1';

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
              borderRadius: TILE_CORNER_RADIUS,
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
          borderRadius: TILE_CORNER_RADIUS,
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
          borderRadius: TILE_CORNER_RADIUS,
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
const HANDLE_PILL_LEN = 28;
const HANDLE_PILL_THICK = 8;
const HANDLE_CORNER_SIZE = 14;

function ResizeHandles({
  editMode,
  width,
  height,
  fw,
  fh,
  fineUnit,
  onResize,
  isDragging: _isDragging,
  tileLabel,
}: {
  editMode: boolean;
  width: number;
  height: number;
  fw: number;
  fh: number;
  /** Half-tile snap unit — tileSize / 2 from the live board grid. */
  fineUnit: number;
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
  const cellSize = fineUnit * 2;

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
      const steps = Math.round(e.translationX / fineUnit);
      if (steps !== lastHapticStepW.value) {
        lastHapticStepW.value = steps;
        runOnJS(hapticSelection)();
      }
      previewW.value = steps * fineUnit;
    })
    .onEnd(() => {
      const deltaSteps = Math.round(previewW.value / fineUnit);
      const newFw = Math.max(2, Math.min(MAX_FW, fw + deltaSteps));
      previewW.value = reduceMotion ? 0 : withTiming(0, { duration: 120 });
      if (newFw !== fw) runOnJS(onResize)(newFw, fh, 0, 0);
    })
  , [fw, fh, onResize, previewW]);

  const bottomPan = useMemo(() => Gesture.Pan()
    .onStart(() => { previewH.value = 0; lastHapticStepH.value = 0; })
    .onUpdate((e) => {
      const steps = Math.round(e.translationY / fineUnit);
      if (steps !== lastHapticStepH.value) {
        lastHapticStepH.value = steps;
        runOnJS(hapticSelection)();
      }
      previewH.value = steps * fineUnit;
    })
    .onEnd(() => {
      const deltaSteps = Math.round(previewH.value / fineUnit);
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
      const sw = Math.round(e.translationX / fineUnit);
      const sh = Math.round(e.translationY / fineUnit);
      if (sw !== lastHapticStepW.value || sh !== lastHapticStepH.value) {
        lastHapticStepW.value = sw;
        lastHapticStepH.value = sh;
        runOnJS(hapticSelection)();
      }
      previewW.value = sw * fineUnit;
      previewH.value = sh * fineUnit;
    })
    .onEnd(() => {
      const dw = Math.round(previewW.value / fineUnit);
      const dh = Math.round(previewH.value / fineUnit);
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
      const steps = Math.round(-e.translationX / cellSize); // + = grow leftwards
      if (steps !== lastHapticStepL.value) {
        lastHapticStepL.value = steps;
        runOnJS(hapticSelection)();
      }
      previewL.value = -steps * cellSize;
    })
    .onEnd(() => {
      const cells = Math.round(-previewL.value / cellSize);
      previewL.value = reduceMotion ? 0 : withTiming(0, { duration: 120 });
      const newFw = Math.max(2, Math.min(MAX_FW, fw + cells * 2));
      const applied = (newFw - fw) / 2;
      if (applied !== 0) runOnJS(onResize)(newFw, fh, applied, 0);
    })
  , [fw, fh, onResize, previewL, reduceMotion, lastHapticStepL]);

  const topPan = useMemo(() => Gesture.Pan()
    .onStart(() => { previewT.value = 0; lastHapticStepT.value = 0; })
    .onUpdate((e) => {
      const steps = Math.round(-e.translationY / cellSize); // + = grow upwards
      if (steps !== lastHapticStepT.value) {
        lastHapticStepT.value = steps;
        runOnJS(hapticSelection)();
      }
      previewT.value = -steps * cellSize;
    })
    .onEnd(() => {
      const cells = Math.round(-previewT.value / cellSize);
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
      const sc = Math.round(-e.translationX / cellSize);
      const sr = Math.round(-e.translationY / cellSize);
      if (sc !== lastHapticStepL.value || sr !== lastHapticStepT.value) {
        lastHapticStepL.value = sc;
        lastHapticStepT.value = sr;
        runOnJS(hapticSelection)();
      }
      previewL.value = -sc * cellSize;
      previewT.value = -sr * cellSize;
    })
    .onEnd(() => {
      const cCells = Math.round(-previewL.value / cellSize);
      const rCells = Math.round(-previewT.value / cellSize);
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
      const sw = Math.round(e.translationX / fineUnit);
      const sr = Math.round(-e.translationY / cellSize);
      if (sw !== lastHapticStepW.value || sr !== lastHapticStepT.value) {
        lastHapticStepW.value = sw;
        lastHapticStepT.value = sr;
        runOnJS(hapticSelection)();
      }
      previewW.value = sw * fineUnit;
      previewT.value = -sr * cellSize;
    })
    .onEnd(() => {
      const dw = Math.round(previewW.value / fineUnit);
      const rCells = Math.round(-previewT.value / cellSize);
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
      const sc = Math.round(-e.translationX / cellSize);
      const sh = Math.round(e.translationY / fineUnit);
      if (sc !== lastHapticStepL.value || sh !== lastHapticStepH.value) {
        lastHapticStepL.value = sc;
        lastHapticStepH.value = sh;
        runOnJS(hapticSelection)();
      }
      previewL.value = -sc * cellSize;
      previewH.value = sh * fineUnit;
    })
    .onEnd(() => {
      const cCells = Math.round(-previewL.value / cellSize);
      const dh = Math.round(previewH.value / fineUnit);
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
  /** Written on each pan frame — used by TalkScreen's auto-scroll loop. */
  dragFingerAbsY?: SharedValue<number>;
  onHide?: (tile: BoardTile) => void;
  onAccessibilityReorder?: (tileId: string, direction: 'forward' | 'back') => void;
  /** Called when the user commits a resize via the corner/edge handles. */
  onResize?: (tileId: string, newFw: number, newFh: number, dCols: number, dRows: number) => void;
  jiggle?: SharedValue<number>;
  /** Motor Access Mode: called on tile tap in edit mode for action sheet (Priority 5). */
  onEditTap?: (tileId: string) => void;
  /** Select Mode: draws the circular outline + tick overlay. */
  selectable?: boolean;
  /** Whether this tile is currently selected (drives the blue tick). */
  isSelected?: boolean;
  /** Move Mode: highlight folder tiles as tappable destinations. */
  moveDestinationMode?: boolean;
  /** Favourite: draws a small star badge (pinned to the top of the board). */
  isFavourite?: boolean;
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
  dragFingerAbsY,
  onHide,
  onAccessibilityReorder,
  onResize,
  jiggle,
  onEditTap,
  selectable = false,
  isSelected = false,
  moveDestinationMode = false,
  isFavourite = false,
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
  // Split the "can this tile show edit visuals?" concern from the "is the
  // Pan gesture allowed to activate?" concern. Resize Mode (editMode)
  // enables the outline, handles, and jiggle. The Pan gesture below is
  // ALSO enabled in this mode, but it uses `activateAfterLongPress` so it
  // only picks up the tile after a *second* long press — normal finger
  // drags in Resize Mode fall through to the ScrollView so the board can
  // still scroll. See board_control_bar.md and Step 2 of the refactor.
  const canShowEditAffordance = editMode && !isNav;
  const canStartDrag = editMode && !isNav;
  // All tiles are perfectly square: the gesture area, wrapper, and content
  // all match `size`. This prevents the old 1.25× height wrapper from
  // overflowing into the row below and misaligning the grid.
  const tileHeight = tileHeightPx;

  const handlePress = useCallback(() => {
    // Select Mode / Move Mode: forward the press up (the parent's
    // handleTilePress decides whether to toggle selection or route to a
    // destination folder). Speech / folder navigation are already gated
    // upstream, so this is safe to call unconditionally.
    if (selectable || moveDestinationMode) {
      onPress(null);
      return;
    }
    if (editMode) {
      // Motor Access Mode: tile taps show context menu instead of doing nothing
      if (onEditTap) { onEditTap(tile.id); return; }
      return;
    }
    onMeasuredPress?.();
    pressableRef.current?.measureInWindow((x, y, width, height) => {
      onPress({ x, y, width, height });
    });
  }, [editMode, moveDestinationMode, onEditTap, onMeasuredPress, onPress, selectable, tile.id]);

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
    .enabled(canStartDrag)
    // Second long press picks up the tile. Without this, ANY finger drag
    // in Resize Mode moves the tile — which blocks the user from scrolling
    // the board while editing. `activateAfterLongPress` makes the pan wait
    // for a 280ms hold before it activates, so short/normal drags fall
    // through to the enclosing ScrollView and the board scrolls normally.
    // See board_control_bar.md and Step 2/3 of the refactor spec.
    .activateAfterLongPress(280)
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
      // Publish absolute finger Y for the parent's auto-scroll loop.
      if (dragFingerAbsY) dragFingerAbsY.value = e.absoluteY;

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
      // Auto-scroll loop should stop the moment the finger is up.
      if (dragFingerAbsY) dragFingerAbsY.value = -1;
    })
    // fw/fh MUST be deps — without them a resized tile publishes stale
    // dragFw/dragFh on its next drag and the highlight stays one cell.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    , [currentSlotSV, dragSourceSlot, dragX, dragY, finalizeSwap, canStartDrag, lifted, onMoveToSlot, size, snapSlot, tile.id, totalSlots, fw, fh, dragFw, dragFh]);

  const animatedDragStyle = useAnimatedStyle(() => {
    // Jiggle drives a continuous gentle wobble during edit mode.
    // We only rotate when NOT dragging so the dragged tile stays visually stable.
    const rotateDeg = (!canShowEditAffordance || lifted.value < 0.1) && jiggle
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

  const accessibilityActions = canShowEditAffordance
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
      {canShowEditAffordance && onHide && !tile.isProtected ? (
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
      {/* ── Favourite badge ─────────────────────────────────────────────
          Small calm star, top-left, so pinned tiles are recognisable at a
          glance without relying on their board position alone. */}
      {isFavourite && !isNav ? (
        <View
          pointerEvents="none"
          style={[styles.favouriteBadge, { backgroundColor: 'rgba(255,255,255,0.9)' }]}
        >
          <Icon name="star" size={14} color={t.colors.primary} strokeWidth={2.4} />
        </View>
      ) : null}
      {/* ── Select Mode overlay ─────────────────────────────────────────
          Unselected: soft circular outline (calm dark neutral). Selected:
          filled blue circle with a large tick. The overlay is
          pointerEvents="none" so the underlying Pressable stays the tap
          target. Positioned to overlap tile content enough to be obvious
          without hiding the label (principle 23: not colour alone —
          shape + icon carry the state too). */}
      {selectable && !isNav ? (
        <View
          pointerEvents="none"
          style={[
            styles.selectIndicator,
            {
              borderColor: isSelected ? t.colors.primary : t.colors.textMuted,
              backgroundColor: isSelected ? t.colors.primary : 'rgba(255,255,255,0.85)',
            },
          ]}
        >
          {isSelected ? (
            <Icon name="checkmark" size={26} color="#FFFFFF" strokeWidth={4} />
          ) : null}
        </View>
      ) : null}
      {/* ── Move Mode destination hint ──────────────────────────────────
          Only folder tiles are valid destinations. A soft dashed blue
          outline nudges the user without changing the folder's own art. */}
      {moveDestinationMode && tile.kind === 'folder' && !isNav ? (
        <View
          pointerEvents="none"
          style={[
            styles.moveDestinationOutline,
            { borderColor: t.colors.primary },
          ]}
        />
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
          accessibilityLabel={(() => {
            if (selectable && !isNav) {
              return `${tile.label}, ${isSelected ? 'selected' : 'not selected'}`;
            }
            if (moveDestinationMode && tile.kind === 'folder' && !isNav) {
              return `Move to ${tile.label}`;
            }
            if (isNav) return tile.label;
            return tile.kind === 'folder' ? `Open ${tile.label}` : `Say ${tile.label}`;
          })()}
          accessibilityHint={
            selectable && !isNav
              ? 'Double tap to toggle selection'
              : moveDestinationMode && tile.kind === 'folder' && !isNav
                ? 'Sends the selected items to this folder'
                : a11yHint
          }
          accessibilityState={
            selectable && !isNav
              ? { selected: isSelected }
              : undefined
          }
          accessibilityActions={accessibilityActions}
          onAccessibilityAction={handleAccessibilityAction}
          onPress={handlePress}
          onLongPress={!editMode && !isNav && !selectable && !moveDestinationMode ? () => onLongPressEnterEdit?.(tile.id) : undefined}
          delayLongPress={450}
          onPressIn={() => !editMode && animateTo(0.94)}
          onPressOut={() => !editMode && animateTo(1)}
          style={({ pressed: _pressed }) => [
            styles.tilePressable,
            canShowEditAffordance && [styles.tileEditOutline, { borderColor: t.colors.primary }],
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
          fineUnit={size / 2}
          isDragging={lifted}
          tileLabel={tile.label}
          onResize={(newFw, newFh, dCols, dRows) => onResize(tile.id, newFw, newFh, dCols, dRows)}
        />
      ) : null}
    </Reanimated.View>
  );

  if (canStartDrag) {
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
  dragFingerAbsY,
  jiggle,
  onEditTap,
  selectable,
  isSelected,
  moveDestinationMode,
  isFavourite,
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
  dragFingerAbsY?: SharedValue<number>;
  jiggle?: SharedValue<number>;
  onEditTap?: (tileId: string) => void;
  selectable?: boolean;
  isSelected?: boolean;
  moveDestinationMode?: boolean;
  isFavourite?: boolean;
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
      dragFingerAbsY={dragFingerAbsY}
      jiggle={jiggle}
      onEditTap={onEditTap}
      selectable={selectable}
      isSelected={isSelected}
      moveDestinationMode={moveDestinationMode}
      isFavourite={isFavourite}
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
  activeTab: TopTab | null;
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
        {(['edit', 'layout', 'saved', 'settings'] as TopTab[]).map(tab => (
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
  // No tab is "current" by default — the new top-nav items are actions
  // (Edit / Layout) and destinations (Saved / Settings), not modes.
  const [activeTab, setActiveTab] = useState<TopTab | null>(null);
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
  // Finger's absolute Y position on screen — published by the tile's Pan
  // onUpdate. -1 means "no drag active". A JS-side interval reads this and
  // auto-scrolls the board when the finger enters the top/bottom edge zone.
  const dragFingerAbsY = useSharedValue(-1);
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
  // Main board dock: expanded is the default (board_control_bar restructure:
  // Add + | Sort | Fullscreen | Hide is the default_control_bar).
  const [homeDockExpanded, setHomeDockExpanded] = useState(true);
  // ── Sort popover state (item 2) ─────────────────────────────────────────
  // Persistent popover above the Sort action — options toggle sort/unsort
  // without dismissing. Snapshot holds the pre-sort layout for "unsort".
  const [sortMenuVisible, setSortMenuVisible] = useState(false);
  const [activeSort, setActiveSort] = useState<BoardSortMode | null>(null);
  const sortSnapshotRef = useRef<BoardLayout | null>(null);
  const [sortAnchor, setSortAnchor] = useState({ x: 0, width: 0 });
  // ── Hide / Fullscreen state (item 4) ────────────────────────────────────
  // hideMenuVisible: vertical popover above Hide (Nav Bar / Control Bar / All).
  // navHidden: bottom tab bar collapsed. dockHidden: control bar slid left
  // fully offscreen, with the DockPeekPill as the visible way back.
  const [hideMenuVisible, setHideMenuVisible] = useState(false);
  const [navHidden, setNavHidden] = useState(false);
  const [dockHidden, setDockHidden] = useState(false);
  const [hideAnchor, setHideAnchor] = useState({ x: 0, width: 0 });
  const dockSlide = useRef(new RNAnimated.Value(0)).current;
  // Peek-pill long-press popover (partial hide toggles) while dock hidden.
  const [peekMenuVisible, setPeekMenuVisible] = useState(false);
  // ── Quick feature state ─────────────────────────────────────────────────
  // quickTaggedIds: persisted set of tile IDs the user pinned as "Quick".
  // Empty set ⇒ Quick newcomer (Quick press nudges towards Manage).
  const [quickTaggedIds, setQuickTaggedIds] = useState<Set<string>>(new Set());
  // quickViewActive: the Quick view overlay (reorder + highlight + dim).
  const [quickViewActive, setQuickViewActive] = useState(false);
  // quickDockMode: 'manage' shows the green Manage pill above the dock.
  type QuickDockMode = 'hidden' | 'manage';
  const [quickDockMode, setQuickDockMode] = useState<QuickDockMode>('hidden');
  // quickManageOpen: the Manage Control Bar replaces the default dock row.
  const [quickManageOpen, setQuickManageOpen] = useState(false);
  // Ephemeral selection intents while managing (session only).
  const [manageSelectedIds, setManageSelectedIds] = useState<Set<string>>(new Set());
  // A symbol was just created via Create + (auto-tagged) — makes Done appear.
  const [manageCreatedTag, setManageCreatedTag] = useState(false);
  // Accidental-selection guard: taps that land while (or right after) a
  // scroll gesture is moving must not toggle selection.
  const isScrollingRef = useRef(false);
  // One auto-scroll-to-top per Quick activation.
  const hasAutoScrolledRef = useRef(false);
  const [quickAnchor, setQuickAnchor] = useState({ x: 0, width: 0 });
  // Reanimated shared values for the Quick button feedback + Manage pill.
  const quickButtonShake = useSharedValue(0);
  const quickButtonErrorTint = useSharedValue(0);
  const manageAttentionPulse = useSharedValue(0);
  const manageEntrance = useSharedValue(0);
  const manageDoneEntrance = useSharedValue(0);
  const unselectBlink = useSharedValue(1);

  // Hydrate the persisted Quick list once on mount.
  useEffect(() => {
    AsyncStorage.getItem(QUICK_TAGS_STORAGE_KEY)
      .then(raw => {
        if (!raw) return;
        const ids = JSON.parse(raw);
        if (Array.isArray(ids)) setQuickTaggedIds(new Set(ids.filter(id => typeof id === 'string')));
      })
      .catch(() => {});
  }, []);
  // Persist on every change (cheap: a handful of IDs).
  const quickHydratedRef = useRef(false);
  useEffect(() => {
    if (!quickHydratedRef.current) { quickHydratedRef.current = true; return; }
    AsyncStorage.setItem(QUICK_TAGS_STORAGE_KEY, JSON.stringify(Array.from(quickTaggedIds))).catch(() => {});
  }, [quickTaggedIds]);
  // ── Edit undo stack (Phase 2) ───────────────────────────────────────────
  // Every board edit (delete / duplicate / move / group / favourite) pushes
  // a snapshot BEFORE mutating. Undo pops one and restores the layouts map
  // (and favourites, and any tiles hidden by a delete). Session-scoped:
  // cleared when the Edit Control Bar opens and when the board changes.
  const [undoStack, setUndoStack] = useState<BoardUndoEntry[]>([]);
  // ── Favourites (Phase 3) ────────────────────────────────────────────────
  // Per-board ordered list of favourited tile ids — favourites are pinned
  // to the top of the board (first slots) until unfavourited. Sort keeps
  // them pinned. Unfavouriting returns a tile to its remembered position.
  const [favouritesByMode, setFavouritesByMode] = useState<Partial<Record<BoardMode, string[]>>>({});
  const favouriteReturnIndexRef = useRef<Map<string, number>>(new Map());
  // Anchors for the Select / Move vertical pop-ups in the edit bar.
  const [selectAnchor, setSelectAnchor] = useState({ x: 0, width: 0 });
  const [moveAnchor, setMoveAnchor] = useState({ x: 0, width: 0 });
  const [editFocusTileId, setEditFocusTileId] = useState<string | null>(null);
  // ── Edit Control Bar state ───────────────────────────────────────────────
  // The Bottom Edit button opens a dedicated toolbar (Back | Select | Move |
  // Delete | Resize | Done). `editControlsOpen` gates the toolbar; the
  // individual tool states drive tile behaviour (Select gates taps,
  // Move gates folder taps, Resize is the existing `editMode`). See
  // to_do/board_control_bar.md and Step 5 of the refactor spec.
  const [editControlsOpen, setEditControlsOpen] = useState(false);
  const [activeEditTool, setActiveEditTool] = useState<BoardEditTool>('none');
  const [selectedTileIds, setSelectedTileIds] = useState<Set<string>>(new Set());
  // ── Undo toast for tile hide/delete (Rule 26) ─────────────────────────
  const [undoToast, setUndoToast] = useState<{ tileId: string; placement: TilePlacement; board: BoardMode } | null>(null);
  const undoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // ── Add Symbol / Add Folder modals (Priority 2) ────────────────────────
  const [addSymbolModalVisible, setAddSymbolModalVisible] = useState(false);
  const [addFolderModalVisible, setAddFolderModalVisible] = useState(false);
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
      const layout: BoardLayout = reflowLayoutSlots(
        stored.map(p => ({ id: p.id, slot: p.slot, fw: p.fw, fh: p.fh })),
      );
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
    // Land back on the full default_control_bar (Add + | Sort | Fullscreen | Hide).
    setHomeDockExpanded(true);
    setFolderDockExpanded(true);
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

  // ── Folder dock timer cleanup ─────────────────────────────────────────────
  // The 15s auto-collapse was removed with the board_control_bar restructure
  // (hiding the bar is now an explicit user action via Hide). The clear
  // helper stays so any legacy timer is cancelled on board changes.
  const clearFolderTimer = useCallback(() => {
    if (folderCollapseTimerRef.current) {
      clearTimeout(folderCollapseTimerRef.current);
      folderCollapseTimerRef.current = null;
    }
  }, []);

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
    // Created from the Quick Manage bar → Quick-tagged from birth, and
    // Done becomes visible (a pending change now exists).
    if (quickManageOpen) {
      setQuickTaggedIds(prev => new Set(prev).add(tileId));
      setManageCreatedTag(true);
      AccessibilityInfo.announceForAccessibility?.(`${result.label} added and pinned to Quick`);
    }
    hapticIfEnabled();
  }, [activeMode, hapticIfEnabled, quickManageOpen]);

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
        { id: `back-${result.boardKey}`, label: 'Home', kind: 'folder', target: 'home', color: '#1DCDFF', mulberrySymbolId: 'mulberry_house_1ice1xp' },
      ];
    }
    setLayoutDirty(true);
    hapticIfEnabled();
  }, [activeMode, hapticIfEnabled]);

  // Collapse handlers were removed with the board_control_bar restructure —
  // the expanded bar (Add + | Sort | Fullscreen | Hide) is now the default,
  // and hiding is an explicit user action via the Hide control.
  const handleFolderExpand = useCallback(() => {
    hapticIfEnabled();
    setFolderDockExpanded(true);
  }, [hapticIfEnabled]);

  const handleHomeDockExpand = useCallback(() => {
    hapticIfEnabled();
    setHomeDockExpanded(true);
  }, [hapticIfEnabled]);

  const handleOpenBoardSettings = useCallback(() => {
    hapticIfEnabled();
    router.push('/board/settings' as Href);
  }, [hapticIfEnabled, router]);

  // ── Edit Control Bar handlers ───────────────────────────────────────────
  // Open the new Edit Control Bar from the home/folder dock's Edit button.
  // This does NOT trigger the old top-nav EDIT tab and does NOT open board
  // settings — see to_do/board_control_bar.md.
  const handleOpenEditControls = useCallback(() => {
    hapticIfEnabled();
    setEditControlsOpen(true);
    setActiveEditTool('none');
    setSelectedTileIds(new Set());
    setUndoStack([]); // fresh session, fresh history
    setHomeDockExpanded(false);
    setFolderDockExpanded(false);
    setAddFlowExpanded(false);
    // Exiting resize-mode outline as well — Edit Control Bar entry starts calm.
    setEditMode(false);
  }, [hapticIfEnabled]);

  // Done closes everything: tool state, selection, resize outline, controls.
  const handleEditControlsDone = useCallback(() => {
    hapticIfEnabled();
    setEditControlsOpen(false);
    setActiveEditTool('none');
    setSelectedTileIds(new Set());
    setEditMode(false);
    // Land back on the full default_control_bar rather than the collapsed ">".
    setHomeDockExpanded(true);
    setFolderDockExpanded(true);
  }, [hapticIfEnabled]);

  const handleEditToolMove = useCallback(() => {
    hapticIfEnabled();
    if (selectedTileIds.size === 0) {
      // Nothing to move — announce for VoiceOver and stay on Select.
      AccessibilityInfo.announceForAccessibility?.(
        'Select items first, then choose Move',
      );
      return;
    }
    setActiveEditTool('move');
    setEditMode(false);
    AccessibilityInfo.announceForAccessibility?.(
      'Choose a destination folder',
    );
  }, [hapticIfEnabled, selectedTileIds.size]);

  const handleEditToolResize = useCallback(() => {
    hapticIfEnabled();
    setActiveEditTool('resize');
    // Turn on the existing resize mode (grid overlay + handles + jiggle).
    // The Bottom Control Bar keeps the Edit toolbar visible; the tile-level
    // affordances come from `editMode`.
    const current: BoardLayout = layouts[activeMode]
      ?? BOARD_TILES[activeMode].map((t, i) => ({ id: t.id, slot: i, fw: 2, fh: 2 }));
    layoutSnapshotRef.current = current.map(p => ({ ...p }));
    setLayoutDirty(false);
    setEditMode(true);
    setSelectedTileIds(new Set());
  }, [activeMode, hapticIfEnabled, layouts]);

  // Helper: resolve tile metadata by id without leaning on `tileMapForMode`
  // (which is declared later in the render). Uses the static BOARD_TILES
  // data for the active board plus the runtime user-added tiles map so
  // user-created symbols/folders resolve correctly.
  const resolveTileById = useCallback((tileId: string): BoardTile | undefined => {
    const staticTiles = BOARD_TILES[activeMode] ?? [];
    const hit = staticTiles.find(tt => tt.id === tileId);
    if (hit) return hit;
    const userTile = userTilesRef.current.get(tileId);
    if (userTile) return userTile;
    // Cross-board fallback (tiles Moved / Grouped in from another board).
    return Object.values(BOARD_TILES).flat().find(tt => tt.id === tileId);
  }, [activeMode]);

  // ── Undo (Phase 2) ──────────────────────────────────────────────────────
  // Snapshot BEFORE a mutating edit. Deep-copies each board's placement
  // array (tiny data) so later mutations can't bleed into history.
  const pushUndo = useCallback((label: string, restoreTileIds?: string[]) => {
    setUndoStack(prev => {
      const snapshot: Partial<Record<BoardMode, BoardLayout>> = {};
      (Object.keys(layouts) as BoardMode[]).forEach(k => {
        const l = layouts[k];
        if (l) snapshot[k] = l.map(p => ({ ...p }));
      });
      const entry: BoardUndoEntry = {
        label,
        layouts: snapshot,
        favourites: [...(favouritesByMode[activeMode] ?? [])],
        board: activeMode,
        restoreTileIds,
      };
      // Keep the last 20 — calm, predictable, and enough for a session.
      return [...prev.slice(-19), entry];
    });
  }, [activeMode, favouritesByMode, layouts]);

  const handleUndoEdit = useCallback(() => {
    const entry = undoStack[undoStack.length - 1];
    if (!entry) return;
    hapticIfEnabled();
    setUndoStack(prev => prev.slice(0, -1));
    setLayouts(entry.layouts);
    setFavouritesByMode(prev => ({ ...prev, [entry.board]: entry.favourites }));
    // Deletes also hid tiles persistently — bring them back.
    entry.restoreTileIds?.forEach(id => dispatch({ type: 'RESTORE_TILE', payload: id }));
    setSelectedTileIds(new Set());
    setLayoutDirty(true);
    AccessibilityInfo.announceForAccessibility?.(`Undid ${entry.label}`);
  }, [dispatch, hapticIfEnabled, undoStack]);

  // Delete every selected symbol/folder. Reuses the existing HIDE_TILE
  // dispatch + boardPlacements filter so persistence stays intact. Skips
  // protected tiles (emergency phrases). Prompts once with a calm summary.
  const handleEditToolDelete = useCallback(() => {
    if (selectedTileIds.size === 0) {
      AccessibilityInfo.announceForAccessibility?.(
        'Select items first, then choose Delete',
      );
      return;
    }
    hapticIfEnabled();
    const ids = Array.from(selectedTileIds);
    const removable = ids.filter(id => !resolveTileById(id)?.isProtected);
    const protectedCount = ids.length - removable.length;
    if (removable.length === 0) {
      Alert.alert('Protected', 'The selected items cannot be removed.', [{ text: 'OK' }]);
      return;
    }
    const firstId = removable[0];
    const firstLabel = firstId ? (resolveTileById(firstId)?.label ?? 'this item') : 'this item';
    const summary = removable.length === 1
      ? `Remove "${firstLabel}" from this board?`
      : `Remove ${removable.length} selected items from this board?`;
    const detail = protectedCount > 0
      ? `${protectedCount} protected item${protectedCount === 1 ? '' : 's'} will be kept.`
      : 'This can be undone.';
    Alert.alert(summary, detail, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => {
          pushUndo('delete', removable);
          setLayouts(prev => {
            const curr: BoardLayout = prev[activeMode]
              ?? BOARD_TILES[activeMode].map((tt, i) => ({ id: tt.id, slot: i, fw: 2, fh: 2 }));
            return { ...prev, [activeMode]: curr.filter(p => !removable.includes(p.id)) };
          });
          setLayoutDirty(true);
          // Persist per tile via existing HIDE_TILE dispatch — the reducer
          // already ignores duplicates so bulk delete is safe.
          removable.forEach(id => dispatch({ type: 'HIDE_TILE', payload: id }));
          setSelectedTileIds(new Set());
          AccessibilityInfo.announceForAccessibility?.(
            removable.length === 1 ? 'Item removed' : `${removable.length} items removed`,
          );
        },
      },
    ]);
  }, [activeMode, dispatch, hapticIfEnabled, pushUndo, resolveTileById, selectedTileIds]);

  // In Select Mode, a tap toggles selection. Speech / folder navigation
  // are gated in `handleTilePress` so those side-effects never fire while
  // Select is active.
  const toggleTileSelection = useCallback((tileId: string) => {
    hapticIfEnabled();
    setSelectedTileIds(prev => {
      const next = new Set(prev);
      if (next.has(tileId)) next.delete(tileId); else next.add(tileId);
      return next;
    });
  }, [hapticIfEnabled]);

  // Move selected tiles into a destination folder. Safety:
  //   • can't move a folder into itself
  //   • can't move a folder into one of its own descendants
  //   • protected tiles are left alone
  //   • only same-board moves are attempted — cross-board membership is
  //     not persisted today, so we take the *safe* path: reject the move
  //     and tell the user rather than silently losing tiles on relaunch.
  // See board_control_bar.md and Step 8 of the refactor spec for the
  // persistence caveats logged in the final report.
  const isDescendantFolder = useCallback((childBoard: BoardMode, parentBoard: BoardMode): boolean => {
    if (childBoard === parentBoard) return true;
    const seen = new Set<BoardMode>();
    const walk = (b: BoardMode): boolean => {
      if (seen.has(b)) return false;
      seen.add(b);
      const tiles = BOARD_TILES[b] ?? [];
      for (const t of tiles) {
        if (t.kind !== 'folder' || !t.target) continue;
        if (t.target === parentBoard) return true;
        if (walk(t.target)) return true;
      }
      return false;
    };
    return walk(childBoard);
  }, []);

  const handleMoveToDestination = useCallback((destinationBoard: BoardMode) => {
    if (selectedTileIds.size === 0) return;
    const ids = Array.from(selectedTileIds);
    const invalid: string[] = [];
    for (const id of ids) {
      const tile = resolveTileById(id);
      if (!tile) { invalid.push(id); continue; }
      if (tile.isProtected) { invalid.push(id); continue; }
      // Folder-into-itself / -into-child guard.
      if (tile.kind === 'folder' && tile.target) {
        if (isDescendantFolder(destinationBoard, tile.target)) {
          invalid.push(id);
        }
      }
    }
    const moveable = ids.filter(id => !invalid.includes(id));
    if (moveable.length === 0) {
      Alert.alert(
        'Move not allowed',
        'The selected items can\'t be moved into that folder.',
        [{ text: 'OK' }],
      );
      return;
    }
    hapticIfEnabled();
    pushUndo('move');
    // Persistence-safe move: pull placements out of source board and
    // append them at the end of the destination board layout.
    setLayouts(prev => {
      const source = prev[activeMode]
        ?? BOARD_TILES[activeMode].map((tt, i) => ({ id: tt.id, slot: i, fw: 2, fh: 2 }));
      const destSeed = prev[destinationBoard]
        ?? (BOARD_TILES[destinationBoard]
          ? BOARD_TILES[destinationBoard].map((tt, i) => ({ id: tt.id, slot: i, fw: 2, fh: 2 }))
          : []);
      const moving = source.filter(p => moveable.includes(p.id));
      const nextSource = source.filter(p => !moveable.includes(p.id));
      const maxSlot = destSeed.reduce((m, p) => Math.max(m, p.slot + 1), 0);
      const nextDest = [
        ...destSeed,
        ...moving.map((p, i) => ({ ...p, slot: maxSlot + i })),
      ];
      return { ...prev, [activeMode]: nextSource, [destinationBoard]: nextDest };
    });
    setLayoutDirty(true);
    setSelectedTileIds(new Set());
    setActiveEditTool('select');
    // Moved tiles leave this board — they can't stay pinned here.
    setFavouritesByMode(prev => ({
      ...prev,
      [activeMode]: (prev[activeMode] ?? []).filter(id => !moveable.includes(id)),
    }));
    AccessibilityInfo.announceForAccessibility?.(
      moveable.length === 1
        ? 'Item moved'
        : `${moveable.length} items moved`,
    );
    if (invalid.length > 0) {
      Alert.alert(
        'Some items were not moved',
        `${invalid.length} item${invalid.length === 1 ? '' : 's'} were protected or would have created a folder loop.`,
        [{ text: 'OK' }],
      );
    }
  }, [activeMode, hapticIfEnabled, isDescendantFolder, pushUndo, resolveTileById, selectedTileIds]);

  // ── Duplicate (Phase 2) ────────────────────────────────────────────────
  // Copies every selected symbol onto the same board at the next available
  // positions (predictable: appended after everything, in selection order).
  // Folders and protected tiles are skipped — duplicating a folder would
  // alias its contents, which is confusing rather than helpful.
  const handleEditToolDuplicate = useCallback(() => {
    if (selectedTileIds.size === 0) return;
    hapticIfEnabled();
    const current: BoardLayout = layouts[activeMode]
      ?? BOARD_TILES[activeMode].map((tt, i) => ({ id: tt.id, slot: i, fw: 2, fh: 2 }));
    const ordered = [...current]
      .sort((a, b) => a.slot - b.slot)
      .filter(p => selectedTileIds.has(p.id));
    const copyable = ordered.filter(p => {
      const tile = resolveTileById(p.id);
      return tile && tile.kind !== 'folder' && !tile.isProtected;
    });
    if (copyable.length === 0) {
      AccessibilityInfo.announceForAccessibility?.('Folders can\'t be duplicated');
      return;
    }
    pushUndo('duplicate');
    let nextSlot = current.reduce((m, p) => Math.max(m, p.slot + 1), 0);
    const additions: TilePlacement[] = [];
    copyable.forEach(p => {
      const tile = resolveTileById(p.id);
      if (!tile) return;
      const copyId = `copy_${tile.id}_${Date.now()}_${additions.length}`;
      userTilesRef.current.set(copyId, { ...tile, id: copyId, isProtected: false });
      additions.push({ id: copyId, slot: nextSlot, fw: p.fw, fh: p.fh });
      nextSlot += 1;
    });
    setLayouts(prev => {
      const curr: BoardLayout = prev[activeMode]
        ?? BOARD_TILES[activeMode].map((tt, i) => ({ id: tt.id, slot: i, fw: 2, fh: 2 }));
      return { ...prev, [activeMode]: [...curr, ...additions] };
    });
    setLayoutDirty(true);
    setSelectedTileIds(new Set());
    AccessibilityInfo.announceForAccessibility?.(
      additions.length === 1 ? 'Item duplicated' : `${additions.length} items duplicated`,
    );
  }, [activeMode, hapticIfEnabled, layouts, pushUndo, resolveTileById, selectedTileIds]);

  // ── Group (Phase 2) ────────────────────────────────────────────────────
  // Different from Move: takes ALL selected symbols and places them
  // together into ONE brand-new folder on this board. The folder lands at
  // the first selected tile's position. Reuses the persistence-safe move.
  const handleEditToolGroup = useCallback(() => {
    if (selectedTileIds.size === 0) return;
    hapticIfEnabled();
    const ids = Array.from(selectedTileIds);
    const groupable = ids.filter(id => {
      const tile = resolveTileById(id);
      return tile && !tile.isProtected;
    });
    if (groupable.length === 0) {
      Alert.alert('Protected', 'The selected items can\'t be grouped.', [{ text: 'OK' }]);
      return;
    }
    pushUndo('group');
    const boardKey = `group_${Date.now()}` as BoardMode;
    // Register the new child board (Home/back tile first, like Add Folder).
    (BOARD_TILES as Record<string, BoardTile[]>)[boardKey] = [
      { id: `back-${boardKey}`, label: 'Home', kind: 'folder', target: 'home', color: '#1DCDFF', mulberrySymbolId: 'mulberry_house_1ice1xp' },
    ];
    const folderId = `folder_${boardKey}`;
    const folderTile: BoardTile = {
      id: folderId,
      label: `Group (${groupable.length})`,
      kind: 'folder',
      color: '#1DCDFF',
      target: boardKey,
      mulberrySymbolId: 'mulberry_group_work_14prpc8',
    };
    userTilesRef.current.set(folderId, folderTile);
    setLayouts(prev => {
      const source: BoardLayout = prev[activeMode]
        ?? BOARD_TILES[activeMode].map((tt, i) => ({ id: tt.id, slot: i, fw: 2, fh: 2 }));
      const moving = [...source]
        .sort((a, b) => a.slot - b.slot)
        .filter(p => groupable.includes(p.id));
      const anchorSlot = moving[0]?.slot ?? source.length;
      const rest = source.filter(p => !groupable.includes(p.id));
      // Folder takes the first selected tile's place; the board reflows.
      const withFolder = [...rest, { id: folderId, slot: anchorSlot, fw: 2, fh: 2 }]
        .sort((a, b) => a.slot - b.slot)
        .map((p, i) => ({ ...p, slot: i }));
      const childSeed: BoardLayout = [
        { id: `back-${boardKey}`, slot: 0, fw: 2, fh: 2 },
        ...moving.map((p, i) => ({ ...p, slot: i + 1 })),
      ];
      return { ...prev, [activeMode]: withFolder, [boardKey]: childSeed };
    });
    setLayoutDirty(true);
    setSelectedTileIds(new Set());
    setActiveEditTool('select');
    // Grouped tiles leave this board — they can't stay pinned here.
    setFavouritesByMode(prev => ({
      ...prev,
      [activeMode]: (prev[activeMode] ?? []).filter(id => !groupable.includes(id)),
    }));
    AccessibilityInfo.announceForAccessibility?.(
      `${groupable.length} item${groupable.length === 1 ? '' : 's'} grouped into a new folder`,
    );
  }, [activeMode, hapticIfEnabled, pushUndo, resolveTileById, selectedTileIds]);

  // ── Favourite / Unfavourite (Phase 3) ──────────────────────────────────
  // Favourites pin to the top of the board (first slots) until toggled
  // off. Unfavouriting returns a tile to its remembered position in the
  // board's natural order, as if it was never favourited. Sort ignores
  // favourites — they stay pinned.
  const favouriteIds = favouritesByMode[activeMode] ?? [];
  const selectedAllFavourites = useMemo(
    () =>
      selectedTileIds.size > 0 &&
      Array.from(selectedTileIds).every(id => favouriteIds.includes(id)),
    [favouriteIds, selectedTileIds],
  );

  const rebuildWithFavourites = useCallback(
    (layout: BoardLayout, favIds: string[]): BoardLayout => {
      const ordered = [...layout].sort((a, b) => a.slot - b.slot);
      const favs = favIds
        .map(id => ordered.find(p => p.id === id))
        .filter((p): p is TilePlacement => Boolean(p));
      const rest = ordered.filter(p => !favIds.includes(p.id));
      return [...favs, ...rest].map((p, i) => ({ ...p, slot: i }));
    },
    [],
  );

  const handleEditToolFavourite = useCallback(() => {
    if (selectedTileIds.size === 0) return;
    hapticIfEnabled();
    pushUndo(selectedAllFavourites ? 'unfavourite' : 'favourite');
    const current: BoardLayout = layouts[activeMode]
      ?? BOARD_TILES[activeMode].map((tt, i) => ({ id: tt.id, slot: i, fw: 2, fh: 2 }));
    const ordered = [...current].sort((a, b) => a.slot - b.slot);
    const favs = [...favouriteIds];
    const selected = ordered.filter(p => selectedTileIds.has(p.id)).map(p => p.id);

    let nextFavs: string[];
    let nextLayout: BoardLayout;
    if (selectedAllFavourites) {
      // Unfavourite — remove from the pinned list and reinsert each tile
      // at its remembered index within the non-favourite order.
      nextFavs = favs.filter(id => !selected.includes(id));
      const rest = ordered.filter(p => !favs.includes(p.id));
      const returning = ordered.filter(p => selected.includes(p.id));
      const merged = [...rest];
      returning.forEach(p => {
        const at = favouriteReturnIndexRef.current.get(p.id);
        const idx = at === undefined ? merged.length : Math.min(at, merged.length);
        merged.splice(idx, 0, p);
        favouriteReturnIndexRef.current.delete(p.id);
      });
      const pinned = nextFavs
        .map(id => ordered.find(p => p.id === id))
        .filter((p): p is TilePlacement => Boolean(p));
      nextLayout = [...pinned, ...merged].map((p, i) => ({ ...p, slot: i }));
      AccessibilityInfo.announceForAccessibility?.(
        selected.length === 1 ? 'Removed from favourites' : `${selected.length} items removed from favourites`,
      );
    } else {
      // Favourite — remember each tile's index among non-favourites so it
      // can go home later, then pin (new favourites go in front).
      const rest = ordered.filter(p => !favs.includes(p.id));
      selected.forEach(id => {
        if (favs.includes(id)) return;
        const idx = rest.findIndex(p => p.id === id);
        if (idx >= 0) favouriteReturnIndexRef.current.set(id, idx);
      });
      nextFavs = [...selected.filter(id => !favs.includes(id)), ...favs];
      nextLayout = rebuildWithFavourites(current, nextFavs);
      AccessibilityInfo.announceForAccessibility?.(
        selected.length === 1 ? 'Added to favourites' : `${selected.length} items added to favourites`,
      );
    }
    setFavouritesByMode(prev => ({ ...prev, [activeMode]: nextFavs }));
    setLayouts(prev => ({ ...prev, [activeMode]: nextLayout }));
    setLayoutDirty(true);
    setSelectedTileIds(new Set());
  }, [activeMode, favouriteIds, hapticIfEnabled, layouts, pushUndo, rebuildWithFavourites, selectedAllFavourites, selectedTileIds]);

  // ── Select / Unselect toggle (Phase 2) ─────────────────────────────────
  // With a selection: clears it (button reads "Unselect"). Without one:
  // toggles selection mode on/off.
  const handleEditToolSelectToggle = useCallback(() => {
    hapticIfEnabled();
    if (selectedTileIds.size > 0) {
      setSelectedTileIds(new Set());
      AccessibilityInfo.announceForAccessibility?.('Selection cleared');
      return;
    }
    setActiveEditTool(prev => (prev === 'select' ? 'none' : 'select'));
    setEditMode(false);
  }, [hapticIfEnabled, selectedTileIds.size]);

  // ── Save (Phase 2) ─────────────────────────────────────────────────────
  // Persists the current board layout and closes the edit bar. Calm and
  // final — the undo history belongs to the session, so it clears too.
  const handleEditControlsSave = useCallback(() => {
    hapticIfEnabled();
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
    setLayoutDirty(false);
    setUndoStack([]);
    setEditControlsOpen(false);
    setActiveEditTool('none');
    setSelectedTileIds(new Set());
    setEditMode(false);
    setHomeDockExpanded(true);
    setFolderDockExpanded(true);
    AccessibilityInfo.announceForAccessibility?.('Changes saved');
  }, [activeMode, dispatch, hapticIfEnabled, layouts]);

  const handleSelectAnchorLayout = useCallback((e: LayoutChangeEvent) => {
    const { x, width: w } = e.nativeEvent.layout;
    setSelectAnchor({ x, width: w });
  }, []);

  const handleMoveAnchorLayout = useCallback((e: LayoutChangeEvent) => {
    const { x, width: w } = e.nativeEvent.layout;
    setMoveAnchor({ x, width: w });
  }, []);

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
    // Edit Control Bar wins over the folder/home docks (but not over the
    // dirty edit-mode dock, which is a stronger commitment gate).
    if (editControlsOpen) return 'editControls';
    // Quick Manage replaces the default dock row until Back/Done.
    if (quickManageOpen) return 'quickManage';
    if (addFlowExpanded) return 'addExpanded';
    if (activeMode === 'home') {
      return homeDockExpanded ? 'homeExpanded' : 'homeCollapsed';
    }
    return folderDockExpanded ? 'folderExpanded' : 'folderCollapsed';
  }, [activeMode, addFlowExpanded, editControlsOpen, editMode, folderDockExpanded, homeDockExpanded, layoutDirty, quickManageOpen]);

  // On board change: reset add flow and popovers; the default_control_bar
  // (Add + | Sort | Fullscreen | Hide) is always expanded now, so home and
  // folders both land with the full bar. Sort state is per-board — clear it.
  useEffect(() => {
    setAddFlowExpanded(false);
    setHomeDockExpanded(true);
    setSortMenuVisible(false);
    setHideMenuVisible(false);
    setActiveSort(null);
    sortSnapshotRef.current = null;
    setUndoStack([]); // undo history is per board
    // Quick Manage is per-visit — leaving the board discards pending
    // selection intents. The Quick view itself (and tags) carry across.
    setQuickManageOpen(false);
    setManageSelectedIds(new Set());
    setManageCreatedTag(false);
    setQuickDockMode('hidden');
    if (activeMode === 'home') {
      setFolderDockExpanded(false);
      clearFolderTimer();
    } else {
      setFolderDockExpanded(true);
      // No auto-collapse — hiding the bar is now an explicit user action
      // (the Hide control), so the bar never disappears on its own.
      clearFolderTimer();
    }
    return clearFolderTimer;
  }, [activeMode, clearFolderTimer]);

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

  // Popovers only make sense while their anchor buttons are on screen;
  // entering the add flow or edit tools also brings a hidden dock back so
  // the user always sees the controls they just asked for.
  useEffect(() => {
    if (dockMode !== 'homeExpanded' && dockMode !== 'folderExpanded') {
      setSortMenuVisible(false);
      setHideMenuVisible(false);
    }
    if (
      dockMode === 'addExpanded' ||
      dockMode === 'editControls' ||
      dockMode === 'editClean' ||
      dockMode === 'editDirty'
    ) {
      setDockHidden(false);
    }
  }, [dockMode]);

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
  // Width fit: the largest square that lets BOARD_COLUMNS columns sit inside the
  // 16pt side padding with 8pt gaps between them (the binding constraint here).
  const widthTile = Math.floor(
    (boardWidth - TILE_LEFT_PADDING * 2 - TILE_GAP * (BOARD_COLUMNS - 1)) / BOARD_COLUMNS,
  );
  // Height fit: the largest square that lets VISIBLE_ROWS rows fit the measured
  // board viewport (board area minus top gap and the pinned dock) with 8pt row
  // gaps. Falls back to a screen-based estimate before onLayout measures.
  const dockContentH = DOCK_ACTION_SIZE + spacing.sm + DOCK_BOTTOM_GAP;
  const boardViewportH = boardAreaHeight > 0
    ? boardAreaHeight - BOARD_TOP_GAP - 10 - dockContentH
    : screenHeight - MESSAGE_HEIGHT - BOARD_TOP_GAP - 100 - 50;
  const heightTile = Math.floor(
    (boardViewportH - TILE_V_GAP * (VISIBLE_ROWS - 1)) / VISIBLE_ROWS,
  );
  // Use the smaller so both constraints hold: the columns never overflow the
  // width, and ~VISIBLE_ROWS rows fit the height. Clamped to a sane range.
  const tileSize = Math.max(72, Math.min(TILE_SIZE, widthTile, heightTile));
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
    // Cross-board fallback: tiles Moved or Grouped into this board keep
    // their original definitions from their home board (active board and
    // user tiles win on id collisions).
    Object.values(BOARD_TILES).flat().forEach(t => {
      if (!map.has(t.id)) map.set(t.id, t);
    });
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

  // ── Quick view derived layout ────────────────────────────────────────
  // While the Quick view (or the Manage bar) is active, Quick-tagged tiles
  // float to the top of the grid. DERIVED-ONLY: a render-time reorder in
  // the style of rebuildWithFavourites — it never calls setLayouts and
  // never touches the persisted board layout. Suspended during editing so
  // drag/resize slot math always matches what's on screen.
  const quickOrderActive =
    (quickViewActive || quickManageOpen) &&
    quickTaggedIds.size > 0 &&
    !editMode &&
    !editControlsOpen;
  const displayLayout = useMemo<BoardLayout>(() => {
    if (!quickOrderActive) return activeLayout;
    const ordered = [...activeLayout].sort((a, b) => a.slot - b.slot);
    const quick = ordered.filter(p => quickTaggedIds.has(p.id));
    if (quick.length === 0) return activeLayout;
    const rest = ordered.filter(p => !quickTaggedIds.has(p.id));
    return [...quick, ...rest].map((p, i) => ({ ...p, slot: i }));
  }, [activeLayout, quickOrderActive, quickTaggedIds]);

  // Fast lookup: slot index → placement (for collision checks + swap).
  const layoutBySlot = useMemo(() => {
    const m = new Map<number, TilePlacement>();
    activeLayout.forEach(p => m.set(p.slot, p));
    return m;
  }, [activeLayout]);

  // ── Sort mode ────────────────────────────────────────────────────────────
  // Reorders the current board's tiles by Type (word type), Name (label), or
  // Category (folders first, then by word type). Reassigns slots row-major so
  // the sorted order lands cleanly on the grid.
  const applySort = useCallback(
    (mode: 'type' | 'name' | 'category') => {
      // Type sort groups tiles by their COLOUR (the word-type colour the user
      // actually sees), so every same-coloured tile sits next to its matches.
      // Known palette colours order first (red→orange→yellow→green→blue→purple→
      // cyan); any other colour groups together after, by hex.
      const colorOrder = ['#FF3B30', '#FF9500', '#FF9F0A', '#FFD60A', '#34C759', '#0A84FF', '#1DCDFF', '#BF5AF2'];
      const colorRank = (c?: string) => {
        const i = colorOrder.indexOf((c ?? '').toUpperCase());
        return i < 0 ? colorOrder.length : i;
      };
      // Navigation folders that go Home ("back" tiles) always stay last, in
      // every sort mode, so Home never jumps to the top of the board.
      const isBackHome = (tile: BoardTile) => tile.kind === 'folder' && tile.target === 'home';
      // Favourites are pinned — Sort never moves them (Phase 3 rule).
      const pinned = favouriteIds
        .map(id => activeLayout.find(p => p.id === id))
        .filter((p): p is TilePlacement => Boolean(p));
      const sortable = activeLayout.filter(p => !favouriteIds.includes(p.id));
      const sorted = [...sortable].sort((a, b) => {
        const ta = tileMapForMode.get(a.id);
        const tb = tileMapForMode.get(b.id);
        if (!ta || !tb) return 0;
        const backA = isBackHome(ta) ? 1 : 0;
        const backB = isBackHome(tb) ? 1 : 0;
        if (backA !== backB) return backA - backB;
        // Name: A–Z by label (A at top).
        if (mode === 'name') return ta.label.localeCompare(tb.label);
        // Type: cluster identical colours together, then A–Z within a colour.
        if (mode === 'type') {
          const ca = (ta.color ?? '').toUpperCase();
          const cb = (tb.color ?? '').toUpperCase();
          const ra = colorRank(ca);
          const rb = colorRank(cb);
          if (ra !== rb) return ra - rb;
          if (ca !== cb) return ca.localeCompare(cb);
          return ta.label.localeCompare(tb.label);
        }
        // Category: Folders first, then Symbols — each group A–Z by name.
        const catA = ta.kind === 'folder' ? 0 : 1;
        const catB = tb.kind === 'folder' ? 0 : 1;
        return catA - catB || ta.label.localeCompare(tb.label);
      });
      const next = [...pinned, ...sorted].map((p, i) => ({ ...p, slot: i }));
      setLayouts(prev => ({ ...prev, [activeMode]: next }));
      hapticSelection();
      AccessibilityInfo.announceForAccessibility?.(`Sorted by ${mode}`);
    },
    [activeLayout, activeMode, favouriteIds, tileMapForMode],
  );

  // ── Sort popover handlers (item 2) ────────────────────────────────────
  // The popover sits just above the Sort action and is PERSISTENT — tapping
  // an option applies (or removes) that sort and keeps the menu open so the
  // user can keep toggling. Dismissed by tapping Sort again, opening Hide,
  // or leaving the board.
  const toggleSortMenu = useCallback(() => {
    hapticIfEnabled();
    setHideMenuVisible(false);
    setSortMenuVisible(v => !v);
  }, [hapticIfEnabled]);

  const handleSortOption = useCallback((mode: BoardSortMode) => {
    hapticIfEnabled();
    if (activeSort === mode) {
      // Unsort — restore the layout captured before the first sort.
      if (sortSnapshotRef.current) {
        const snapshot = sortSnapshotRef.current;
        setLayouts(prev => ({ ...prev, [activeMode]: snapshot }));
      }
      sortSnapshotRef.current = null;
      setActiveSort(null);
      AccessibilityInfo.announceForAccessibility?.('Sort removed');
      return;
    }
    if (activeSort === null) {
      // First sort in this session — remember how the board looked.
      sortSnapshotRef.current = activeLayout.map(p => ({ ...p }));
    }
    applySort(mode);
    setActiveSort(mode);
  }, [activeLayout, activeMode, activeSort, applySort, hapticIfEnabled]);

  const handleSortAnchorLayout = useCallback((e: LayoutChangeEvent) => {
    const { x, width: w } = e.nativeEvent.layout;
    setSortAnchor({ x, width: w });
  }, []);

  // ── Hide / Fullscreen handlers (item 4) ───────────────────────────────
  const toggleHideMenu = useCallback(() => {
    hapticIfEnabled();
    setSortMenuVisible(false);
    setHideMenuVisible(v => !v);
  }, [hapticIfEnabled]);

  const handleHideAnchorLayout = useCallback((e: LayoutChangeEvent) => {
    const { x, width: w } = e.nativeEvent.layout;
    setHideAnchor({ x, width: w });
  }, []);

  // Nav Bar option — TOGGLES the bottom tab bar (slide down/up via
  // LayoutAnimation; instant under Reduce Motion). Menu stays open.
  const handleHideNavBar = useCallback(() => {
    hapticIfEnabled();
    const next = !navHidden;
    if (!reduceMotion) LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setNavHidden(next);
    setTabBarHidden(next);
    AccessibilityInfo.announceForAccessibility?.(
      next ? 'Navigation bar hidden' : 'Navigation bar shown',
    );
  }, [hapticIfEnabled, navHidden, reduceMotion]);

  // Control Bar option — slides the dock right-to-left until only a
  // the peek pill takes over on the left edge (tap it to bring it back).
  const handleHideDock = useCallback(() => {
    hapticIfEnabled();
    setHideMenuVisible(false);
    setSortMenuVisible(false);
    setDockHidden(true);
    AccessibilityInfo.announceForAccessibility?.(
      'Controls hidden, tap left edge to restore',
    );
  }, [hapticIfEnabled]);

  // All — nav bar and control bar together. Also what Fullscreen does.
  const handleHideAll = useCallback(() => {
    hapticIfEnabled();
    setHideMenuVisible(false);
    setSortMenuVisible(false);
    if (!reduceMotion) LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setNavHidden(true);
    setTabBarHidden(true);
    setDockHidden(true);
    AccessibilityInfo.announceForAccessibility?.(
      'Controls hidden, tap left edge to restore',
    );
  }, [hapticIfEnabled, reduceMotion]);

  // Tap on the peek pill restores everything at once.
  const handleChromeRestore = useCallback(() => {
    hapticIfEnabled();
    if (!reduceMotion) LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setPeekMenuVisible(false);
    setNavHidden(false);
    setTabBarHidden(false);
    setDockHidden(false);
    AccessibilityInfo.announceForAccessibility?.('Controls shown');
  }, [hapticIfEnabled, reduceMotion]);

  // Long-press on the peek pill — small popover with partial hide toggles
  // ("Hide control bar" / "Hide nav bar") so users can choose partial vs
  // full hiding instead of always restoring both at once.
  const handlePeekLongPress = useCallback(() => {
    hapticIfEnabled();
    setPeekMenuVisible(v => !v);
  }, [hapticIfEnabled]);

  // Peek popover: toggle just the control bar back (nav stays as-is).
  const handlePeekToggleDock = useCallback(() => {
    hapticIfEnabled();
    setPeekMenuVisible(false);
    setDockHidden(false);
    AccessibilityInfo.announceForAccessibility?.('Control bar shown');
  }, [hapticIfEnabled]);

  // ── Quick feature handlers ──────────────────────────────────────────────
  const handleQuickAnchorLayout = useCallback((e: LayoutChangeEvent) => {
    const { x, width: w } = e.nativeEvent.layout;
    setQuickAnchor({ x, width: w });
  }, []);

  const handleQuickPress = useCallback(() => {
    hapticIfEnabled();
    setSortMenuVisible(false);
    setHideMenuVisible(false);

    // NEWCOMER PATH: no Quick symbols tagged yet — subtle error shake +
    // faint red tint on the Quick button, then surface the Manage pill
    // above the dock with a one-shot green attention pulse.
    if (quickTaggedIds.size === 0) {
      if (!reduceMotion) {
        quickButtonShake.value = withSequence(
          withTiming(-4, { duration: 50 }),
          withTiming(4, { duration: 50 }),
          withTiming(-3, { duration: 40 }),
          withTiming(3, { duration: 40 }),
          withTiming(0, { duration: 35 }),
        );
        quickButtonErrorTint.value = withSequence(
          withTiming(1, { duration: 80 }),
          withTiming(0, { duration: 400 }),
        );
      }
      hapticError();
      setQuickDockMode('manage');
      if (!reduceMotion) {
        manageAttentionPulse.value = withSequence(
          withTiming(1, { duration: 150 }),
          withTiming(0, { duration: 300 }),
        );
      }
      AccessibilityInfo.announceForAccessibility?.(
        'No Quick symbols yet. Tap Manage above the controls to pin symbols first.',
      );
      return;
    }

    // EXPERIENCED USER PATH — toggle the Quick view.
    if (quickViewActive) {
      if (!reduceMotion) LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setQuickViewActive(false);
      setQuickDockMode('hidden');
      hasAutoScrolledRef.current = false;
      AccessibilityInfo.announceForAccessibility?.('Quick view off');
      return;
    }

    if (!reduceMotion) LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setQuickViewActive(true);
    // Auto-scroll to top — one-time per activation; skipped if already there.
    if (!hasAutoScrolledRef.current) {
      if ((scrollPositions.current[activeMode] ?? 0) > 1) {
        scrollRef.current?.scrollTo({ y: 0, animated: true });
      }
      hasAutoScrolledRef.current = true;
    }
    AccessibilityInfo.announceForAccessibility?.(
      `Quick view on. ${quickTaggedIds.size} Quick symbol${quickTaggedIds.size !== 1 ? 's' : ''} at the top.`,
    );
  }, [activeMode, hapticIfEnabled, manageAttentionPulse, quickButtonErrorTint, quickButtonShake, quickTaggedIds.size, quickViewActive, reduceMotion]);

  // Manage pill → open the Manage Control Bar (replaces the dock row).
  const handleManagePress = useCallback(() => {
    hapticIfEnabled();
    setSortMenuVisible(false);
    setHideMenuVisible(false);
    setQuickDockMode('hidden');
    setManageSelectedIds(new Set());
    setManageCreatedTag(false);
    setQuickManageOpen(true);
    AccessibilityInfo.announceForAccessibility?.(
      quickTaggedIds.size > 0
        ? 'Manage Quick. Tap symbols to add or remove them, then Done.'
        : 'Manage Quick. Tap symbols to pin them, or Create a new one, then Done.',
    );
  }, [hapticIfEnabled, quickTaggedIds.size]);

  const closeQuickManage = useCallback(() => {
    setManageSelectedIds(new Set());
    setManageCreatedTag(false);
    setQuickManageOpen(false);
    setQuickDockMode('hidden');
  }, []);

  // Back — prompt when there are unsaved selection changes.
  const handleQuickManageBack = useCallback(() => {
    hapticIfEnabled();
    if (manageSelectedIds.size > 0 || manageCreatedTag) {
      Alert.alert('Discard changes?', undefined, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Discard', style: 'destructive', onPress: closeQuickManage },
      ]);
      return;
    }
    closeQuickManage();
  }, [closeQuickManage, hapticIfEnabled, manageCreatedTag, manageSelectedIds.size]);

  // Select / Unselect — with a selection: clears it (button reads
  // "Unselect", red). Without one: reminds how selection works.
  const handleQuickSelectToggle = useCallback(() => {
    hapticIfEnabled();
    if (manageSelectedIds.size > 0) {
      setManageSelectedIds(new Set());
      AccessibilityInfo.announceForAccessibility?.('Selection cleared');
      return;
    }
    AccessibilityInfo.announceForAccessibility?.('Tap symbols on the board to select them');
  }, [hapticIfEnabled, manageSelectedIds.size]);

  // Create + — same AddSymbolModal; the confirm handler auto-tags the new
  // tile as Quick while the Manage bar is open (tagged from birth).
  const handleQuickCreate = useCallback(() => {
    hapticIfEnabled();
    setAddSymbolModalVisible(true);
  }, [hapticIfEnabled]);

  // Done — reconcile intents: selected non-Quick tiles become Quick,
  // selected Quick tiles are removed. Then jump straight into Quick view.
  const handleQuickManageDone = useCallback(() => {
    hapticIfEnabled();
    const next = new Set(quickTaggedIds);
    manageSelectedIds.forEach(id => {
      if (next.has(id)) next.delete(id);
      else next.add(id);
    });
    setQuickTaggedIds(next);
    closeQuickManage();
    if (!reduceMotion) LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    if (next.size > 0) {
      setQuickViewActive(true);
      hasAutoScrolledRef.current = true; // Done already lands you at the list
      scrollRef.current?.scrollTo({ y: 0, animated: true });
      AccessibilityInfo.announceForAccessibility?.(
        `Quick updated. ${next.size} Quick symbol${next.size !== 1 ? 's' : ''}.`,
      );
    } else {
      setQuickViewActive(false);
      AccessibilityInfo.announceForAccessibility?.('All Quick symbols removed');
    }
  }, [closeQuickManage, hapticIfEnabled, manageSelectedIds, quickTaggedIds, reduceMotion]);

  // Done is conditional — only when there are pending changes to save
  // (selection intents, or a symbol just created via Create +). This is
  // the same dirty-state gating pattern as editDirty vs editClean.
  const manageDoneVisible = quickManageOpen && (manageSelectedIds.size > 0 || manageCreatedTag);

  // The green Manage pill floats above the dock while the Quick view is
  // active (experienced users' path into editing) or right after the
  // newcomer nudge — never while the Manage bar itself is open.
  const manageVisible =
    !quickManageOpen &&
    (quickDockMode === 'manage' || quickViewActive) &&
    (dockMode === 'homeExpanded' || dockMode === 'folderExpanded');

  // ── Quick animated styles + entrance effects ────────────────────────────
  const quickShakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: quickButtonShake.value }],
  }));
  // Faint red overlay only (opacity 0 → 0.25) — never a hard colour switch.
  const quickTintStyle = useAnimatedStyle(() => ({
    opacity: quickButtonErrorTint.value * 0.25,
  }));
  const manageAnimStyle = useAnimatedStyle(() => ({
    opacity: manageEntrance.value,
    transform: [
      { translateY: (1 - manageEntrance.value) * 14 },
      { scale: 1 + manageAttentionPulse.value * 0.06 },
    ],
  }));
  const manageDoneStyle = useAnimatedStyle(() => ({
    opacity: manageDoneEntrance.value,
    transform: [{ scale: 0.7 + manageDoneEntrance.value * 0.3 }],
  }));
  const unselectBlinkStyle = useAnimatedStyle(() => ({
    opacity: unselectBlink.value,
  }));

  // Manage pill springs in from below and settles gently.
  useEffect(() => {
    if (manageVisible) {
      manageEntrance.value = reduceMotion
        ? 1
        : withSpring(1, { damping: 16, stiffness: 190 });
    } else {
      manageEntrance.value = 0;
    }
  }, [manageEntrance, manageVisible, reduceMotion]);

  // Done springs in when it first appears; disappears instantly.
  useEffect(() => {
    manageDoneEntrance.value = manageDoneVisible
      ? (reduceMotion ? 1 : withSpring(1, { damping: 14, stiffness: 240 }))
      : 0;
  }, [manageDoneEntrance, manageDoneVisible, reduceMotion]);

  // Select ↔ Unselect switch — a brief 150ms blink stands in for the
  // colour tween (BoardDockAction handles the blue → red tint itself).
  const hasManageSelection = manageSelectedIds.size > 0;
  useEffect(() => {
    if (!quickManageOpen || reduceMotion) return;
    unselectBlink.value = withSequence(
      withTiming(0.55, { duration: 75 }),
      withTiming(1, { duration: 75 }),
    );
  }, [hasManageSelection, quickManageOpen, reduceMotion, unselectBlink]);

  // Dock slide animation — right-to-left "cuddle" leaving a half-visible
  // sliver. Native-driver transform; instant under Reduce Motion.
  useEffect(() => {
    RNAnimated.timing(dockSlide, {
      toValue: dockHidden ? 1 : 0,
      duration: reduceMotion ? 0 : 280,
      easing: RNEasing.out(RNEasing.cubic),
      useNativeDriver: true,
    }).start();
  }, [dockHidden, dockSlide, reduceMotion]);

  // Never leave the app without its tab bar if the user navigates away.
  useEffect(() => () => setTabBarHidden(false), []);

  // Keep `tiles` for the Mulberry prewarm effect (all tiles in active mode).
  const tiles = useMemo(() => BOARD_TILES[activeMode], [activeMode]);

  useEffect(() => {
    const y = scrollPositions.current[activeMode] ?? 0;
    scrollRef.current?.scrollTo({ y, animated: false });
  }, [activeMode]);

  // ── Auto-scroll while dragging a lifted tile ─────────────────────────────
  // When the finger enters the 32/52pt zones near the safe-area top or
  // bottom edge, nudge the ScrollView so the user can drop a lifted tile
  // beyond the current viewport. Respect Reduce Motion (skip the loop —
  // dragging still works, but the board doesn't animate away under the
  // finger). See Step 10 of the refactor spec.
  useEffect(() => {
    if (reduceMotion) return;
    let raf: ReturnType<typeof setInterval> | null = null;
    // The Reanimated shared value can be sampled from JS via `.value`.
    raf = setInterval(() => {
      const y = dragFingerAbsY.value;
      if (y < 0) return; // no active drag
      // Safe-area-aware zones. `insets.top` accounts for the notch;
      // `screenHeight - insets.bottom` for the home indicator.
      const topEdge = insets.top;
      const bottomEdge = screenHeight - insets.bottom;
      const topDist = y - topEdge;
      const bottomDist = bottomEdge - y;
      let delta = 0;
      // Top edge — scroll UP (negative delta).
      if (topDist >= 0 && topDist <= 32) delta = -18;
      else if (topDist > 32 && topDist <= 52) delta = -8;
      // Bottom edge — scroll DOWN (positive delta).
      else if (bottomDist >= 0 && bottomDist <= 32) delta = 18;
      else if (bottomDist > 32 && bottomDist <= 52) delta = 8;
      if (delta === 0) return;
      const currentY = scrollPositions.current[activeMode] ?? 0;
      const nextY = Math.max(0, currentY + delta);
      scrollPositions.current[activeMode] = nextY;
      scrollRef.current?.scrollTo({ y: nextY, animated: false });
    }, 32);
    return () => {
      if (raf) clearInterval(raf);
    };
  }, [activeMode, dragFingerAbsY, insets.bottom, insets.top, reduceMotion, screenHeight]);

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

  const handleStripBackspace = useCallback((hasWords: boolean) => {
    hapticIfEnabled();
    if (hasWords) {
      dispatch({ type: 'REMOVE_LAST_WORD' });
      return;
    }
    setActiveMode('home');
    setPreviousMode(null);
    setActiveTab(null);
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
    // ── Quick Manage gate ─────────────────────────────────────────────────
    // While the Manage bar is open, taps toggle a tile's Quick intent
    // instead of speaking / opening folders. Nav tiles (back/home) still
    // work. Accidental-selection guard: a tap that lands while a scroll
    // gesture is in flight is a scroll, not a choice — skip it.
    if (quickManageOpen) {
      if (tile.id === 'back' || tile.id === 'home') {
        // Fall through to normal nav — allows leaving a folder mid-manage.
      } else {
        if (isScrollingRef.current) return;
        hapticIfEnabled();
        const wasSelected = manageSelectedIds.has(tile.id);
        setManageSelectedIds(prev => {
          const next = new Set(prev);
          if (next.has(tile.id)) next.delete(tile.id);
          else next.add(tile.id);
          return next;
        });
        const isTagged = quickTaggedIds.has(tile.id);
        AccessibilityInfo.announceForAccessibility?.(
          wasSelected
            ? `${tile.label} deselected`
            : isTagged
              ? `${tile.label} will be removed from Quick`
              : `${tile.label} will be added to Quick`,
        );
        return;
      }
    }
    // ── Edit tool gates (Select / Move) ───────────────────────────────────
    // In Select Mode, taps toggle selection instead of speaking / opening
    // folders. In Move Mode, tapping a folder chooses it as the destination
    // for the currently selected tiles. Nav tiles (back/home) still work
    // so the user can leave the folder they're in without exiting the tool.
    if (editControlsOpen && activeEditTool === 'select') {
      if (tile.id === 'back' || tile.id === 'home') {
        // Fall through to normal nav — allows leaving a folder mid-select.
      } else {
        toggleTileSelection(tile.id);
        return;
      }
    }
    if (editControlsOpen && activeEditTool === 'move') {
      if (tile.id === 'back' || tile.id === 'home') {
        // Fall through to normal nav — allows changing destination view.
      } else if (tile.kind === 'folder' && tile.target) {
        handleMoveToDestination(tile.target);
        return;
      } else {
        AccessibilityInfo.announceForAccessibility?.(
          'Tap a folder to choose it as the destination',
        );
        return;
      }
    }
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
      setActiveTab(null);
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
        setActiveTab(null);
        dispatch({ type: 'SET_BOARD', payload: 'home' });
      }
      return;
    }
    startGhostToMessage(tile, rect);
  }, [activeEditTool, announce, clearMessage, dispatch, editControlsOpen, handleMoveToDestination, hapticIfEnabled, manageSelectedIds, navigateTo, previousMode, quickManageOpen, quickTaggedIds, repeatMessage, startGhostToMessage, toggleTileSelection]);

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
    // EDIT (moved up from the bottom dock) opens the Edit Control Bar.
    // LAYOUT is the old Resize tool (grid + handles). SAVED opens saved
    // sentences (old Quick — the merged TapTalk+Saved page comes in a
    // later phase). SETTINGS opens board settings (old "Board" action).
    if (tab === 'edit') {
      // Toggle: a second tap on EDIT closes the edit bar calmly.
      if (editControlsOpen) {
        handleEditControlsDone();
        announce('Edit closed');
      } else {
        handleOpenEditControls();
        announce('Edit board');
      }
      return;
    }
    if (tab === 'layout') {
      handleEditToolResize();
      announce('Layout mode. Drag handles to resize tiles.');
      return;
    }
    if (tab === 'saved') {
      router.push('/board/quick-talk' as Href);
      announce('Saved sentences');
      return;
    }
    // SETTINGS
    handleOpenBoardSettings();
    announce('Board settings');
  }, [announce, editControlsOpen, handleEditControlsDone, handleEditToolResize, handleOpenBoardSettings, handleOpenEditControls, hapticIfEnabled, router]);

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
                // Clear the floating (absolute) dock so the last tiles aren't hidden behind it.
                paddingBottom: DOCK_ACTION_SIZE + spacing.sm + DOCK_BOTTOM_GAP * 2,
              },
            ]}
          showsVerticalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={50}
          // Accidental-selection guard for Quick Manage: while a scroll
          // gesture is moving, tile taps must not toggle selection.
          onScrollBeginDrag={() => { isScrollingRef.current = true; }}
          onScrollEndDrag={() => { isScrollingRef.current = false; }}
          onMomentumScrollEnd={() => { isScrollingRef.current = false; }}
          bounces
          alwaysBounceVertical
        >
            {(() => {
              const colStep = tileSize + TILE_GAP;
              const rowStep = tileSize + TILE_V_GAP;
              const fineUnit = tileSize / 2;
              // Rows must count each tile's full footprint (anchor row +
              // coarse height), not just anchor slots — otherwise growing a
              // bottom-row tile taller doesn't extend the grid and the
              // background never refreshes under it.
              const tileRows = displayLayout.reduce(
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
                  {displayLayout.map((placement) => {
                    const tile = tileMapForMode.get(placement.id);
                    if (!tile) return null;
                    const col = placement.slot % BOARD_COLUMNS;
                    const row = Math.floor(placement.slot / BOARD_COLUMNS);
                    const w = placement.fw * fineUnit;
                    const h = placement.fh * fineUnit;
                    // ── Quick view / Manage visual treatment ────────────
                    const isQuick = quickTaggedIds.has(tile.id);
                    const manageSel = quickManageOpen && manageSelectedIds.has(tile.id);
                    const removalIntent = manageSel && isQuick;
                    const additionIntent = manageSel && !isQuick;
                    // Quick view chrome only outside Manage/editing.
                    const quickChrome =
                      quickViewActive && !quickManageOpen && !editMode && !editControlsOpen;
                    const dimmed = quickChrome && quickTaggedIds.size > 0 && !isQuick;
                    return (
                      <View
                        key={tile.id}
                        style={{
                          position: 'absolute',
                          left: col * colStep,
                          top: row * rowStep,
                          width: w,
                          height: h,
                          // Clear-but-not-harsh dimming of non-Quick tiles.
                          opacity: dimmed ? 0.38 : 1,
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
                          dragFingerAbsY={dragFingerAbsY}
                          jiggle={jiggle}
                          onEditTap={motorAccessEnabled ? handleMotorAccessMenu : undefined}
                          selectable={editControlsOpen && activeEditTool === 'select'}
                          isSelected={selectedTileIds.has(tile.id)}
                          moveDestinationMode={editControlsOpen && activeEditTool === 'move'}
                          isFavourite={favouriteIds.includes(tile.id)}
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
                        {/* Quick view — dashed blue outline + light tint on
                            each Quick tile (per tile, not a group box). */}
                        {quickChrome && isQuick ? (
                          <View
                            pointerEvents="none"
                            style={[styles.quickTileOverlay, {
                              borderStyle: 'dashed',
                              borderWidth: 2,
                              borderColor: 'rgba(10, 132, 255, 0.75)',
                              backgroundColor: 'rgba(10, 132, 255, 0.10)',
                            }]}
                          />
                        ) : null}
                        {/* Manage — already-tagged tiles wear a calm solid
                            border ("selected for Quick, editable"). */}
                        {quickManageOpen && isQuick && !manageSel ? (
                          <View
                            pointerEvents="none"
                            style={[styles.quickTileOverlay, {
                              borderStyle: 'solid',
                              borderWidth: 1.5,
                              borderColor: 'rgba(10, 132, 255, 0.9)',
                            }]}
                          />
                        ) : null}
                        {/* Manage — removal intent: red tint + strike. */}
                        {removalIntent ? (
                          <View
                            pointerEvents="none"
                            style={[styles.quickTileOverlay, {
                              borderStyle: 'dashed',
                              borderWidth: 2,
                              borderColor: '#FF3B30',
                              backgroundColor: 'rgba(255, 59, 48, 0.12)',
                            }]}
                          >
                            <View style={styles.quickRemoveStrike} />
                          </View>
                        ) : null}
                        {/* Manage — addition intent: blue selection tint. */}
                        {additionIntent ? (
                          <View
                            pointerEvents="none"
                            style={[styles.quickTileOverlay, {
                              borderStyle: 'solid',
                              borderWidth: 2,
                              borderColor: '#0A84FF',
                              backgroundColor: 'rgba(10, 132, 255, 0.14)',
                            }]}
                          />
                        ) : null}
                        {/* Quick tag badge — visible at ALL times on tagged
                            tiles; 0.4 opacity while Manage is editing. */}
                        {isQuick ? <QuickTagBadge dimmed={quickManageOpen} /> : null}
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

          {/* ── Top Sub Control (item 5) ─────────────────────────────────
              Secondary control layer near the top of the board area with
              even spacing left / right / top. Only appears in edit mode so
              the Bottom Control Bar stays uncrowded. Calm and light: soft
              surface, existing tokens, no harsh colour or heavy shadow. */}
          {editControlsOpen ? (
            <View
              pointerEvents="none"
              accessibilityLiveRegion="polite"
              style={[
                styles.topSubControl,
                {
                  backgroundColor: t.isDark ? t.colors.navBackground : '#FFFFFF',
                  borderColor: t.colors.symbolOutline,
                },
              ]}
            >
              <Text
                style={[styles.topSubControlText, { color: t.colors.text }]}
                numberOfLines={1}
                maxFontSizeMultiplier={1.4}
              >
                {selectedTileIds.size > 0
                  ? `${selectedTileIds.size} selected`
                  : activeEditTool === 'move'
                    ? 'Tap a folder to move items into it'
                    : activeEditTool === 'select'
                      ? 'Tap symbols to select them'
                      : 'Editing — choose Select to begin'}
              </Text>
            </View>
          ) : null}

          {/* ── Unified contextual dock (fixed, outside the ScrollView) ── */}
          <RNAnimated.View
            accessibilityRole="toolbar"
            accessibilityLabel="Board actions"
            // While slid away, keep the offscreen buttons out of the
            // VoiceOver order — the restore handle is the only target.
            accessibilityElementsHidden={dockHidden}
            importantForAccessibility={dockHidden ? 'no-hide-descendants' : 'auto'}
            pointerEvents={dockHidden ? 'none' : 'auto'}
            style={[
              styles.boardDock,
              {
                paddingBottom: DOCK_BOTTOM_GAP,
                opacity: dockFade,
                transform: [
                  {
                    translateX:
                      !reduceMotion &&
                      (dockMode === 'homeExpanded' || dockMode === 'homeCollapsed')
                        ? dockFade.interpolate({ inputRange: [0, 1], outputRange: [-12, 0] })
                        : 0,
                  },
                  {
                    // "Hide" slide — fully offscreen; the DockPeekPill takes
                    // over as the persistent, visible way back (item 4 v2).
                    translateX: dockSlide.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, -(width + spacing.lg)],
                    }),
                  },
                ],
              },
            ]}
          >
            {/* Sort popover — persistent, anchored just above the Sort action. */}
            <DockPopover
              visible={
                sortMenuVisible &&
                (dockMode === 'homeExpanded' || dockMode === 'folderExpanded')
              }
              anchorX={sortAnchor.x}
              anchorWidth={sortAnchor.width}
              a11yLabel="Sort options"
              options={[
                {
                  key: 'type',
                  label: 'Type',
                  a11yLabel: activeSort === 'type' ? 'Remove sort by type' : 'Sort by type',
                  selected: activeSort === 'type',
                  onPress: () => handleSortOption('type'),
                },
                {
                  key: 'name',
                  label: 'Name',
                  a11yLabel: activeSort === 'name' ? 'Remove sort by name' : 'Sort by name',
                  selected: activeSort === 'name',
                  onPress: () => handleSortOption('name'),
                },
                {
                  key: 'category',
                  label: 'Category',
                  a11yLabel: activeSort === 'category' ? 'Remove sort by category' : 'Sort by category',
                  selected: activeSort === 'category',
                  onPress: () => handleSortOption('category'),
                },
              ]}
            />
            {/* Hide popover — vertical options above the Hide action. */}
            <DockPopover
              visible={
                hideMenuVisible &&
                (dockMode === 'homeExpanded' || dockMode === 'folderExpanded')
              }
              anchorX={hideAnchor.x}
              anchorWidth={hideAnchor.width}
              a11yLabel="Hide options"
              options={[
                {
                  key: 'nav',
                  label: 'Nav Bar',
                  a11yLabel: navHidden ? 'Show navigation bar' : 'Hide navigation bar',
                  selected: navHidden,
                  onPress: handleHideNavBar,
                },
                {
                  key: 'dock',
                  label: 'Control Bar',
                  a11yLabel: 'Hide control bar',
                  onPress: handleHideDock,
                },
                {
                  key: 'all',
                  label: 'All',
                  a11yLabel: 'Hide all controls',
                  onPress: handleHideAll,
                },
              ]}
            />
            {/* Select pop-up — appears from Select/Unselect when items are
                selected. Bottom-to-top: (button) → Delete → Duplicate →
                Favourite, so the array below is top-to-bottom. */}
            <DockPopover
              visible={
                dockMode === 'editControls' &&
                selectedTileIds.size > 0 &&
                activeEditTool !== 'move'
              }
              anchorX={selectAnchor.x}
              anchorWidth={selectAnchor.width}
              a11yLabel="Selection actions"
              options={[
                {
                  key: 'favourite',
                  label: selectedAllFavourites ? 'Unfavourite' : 'Favourite',
                  a11yLabel: selectedAllFavourites
                    ? 'Remove selected from favourites'
                    : 'Add selected to favourites',
                  selected: selectedAllFavourites,
                  onPress: handleEditToolFavourite,
                },
                {
                  key: 'duplicate',
                  label: 'Duplicate',
                  a11yLabel: 'Duplicate selected symbols',
                  onPress: handleEditToolDuplicate,
                },
                {
                  key: 'delete',
                  label: 'Delete',
                  a11yLabel: 'Delete selected symbols',
                  onPress: handleEditToolDelete,
                },
              ]}
            />
            {/* Move pop-up — Group places all selected into one new folder. */}
            <DockPopover
              visible={
                dockMode === 'editControls' &&
                activeEditTool === 'move' &&
                selectedTileIds.size > 0
              }
              anchorX={moveAnchor.x}
              anchorWidth={moveAnchor.width}
              a11yLabel="Move actions"
              options={[
                {
                  key: 'group',
                  label: 'Group',
                  a11yLabel: 'Group selected symbols into one folder',
                  onPress: handleEditToolGroup,
                },
              ]}
            />
            {/* Quick "Manage" sub-option — green pill floating directly
                above the Quick button. Springs in from below; pulses once
                (scale 1 → 1.06) on the newcomer nudge to draw the eye. */}
            {manageVisible ? (
              <Reanimated.View
                style={[
                  styles.manageSubOption,
                  {
                    left: Math.min(
                      Math.max(quickAnchor.x + quickAnchor.width / 2 - 50, spacing.sm),
                      width - 100 - spacing.sm,
                    ),
                  },
                  manageAnimStyle,
                ]}
              >
                <Pressable
                  onPress={handleManagePress}
                  accessibilityRole="button"
                  accessibilityLabel="Manage Quick symbols"
                  accessibilityHint="Choose which symbols appear in Quick"
                  style={({ pressed }) => [
                    styles.managePill,
                    {
                      backgroundColor: pressed ? '#27AE60' : '#2ECC71',
                      opacity: pressed ? 0.9 : 1,
                    },
                  ]}
                >
                  <Text style={styles.managePillLabel} maxFontSizeMultiplier={1.4}>
                    Manage
                  </Text>
                </Pressable>
              </Reanimated.View>
            ) : null}
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
                  a11yHint="Expand board controls"
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
                  <View onLayout={handleSortAnchorLayout}>
                    <BoardDockAction
                      icon="sort" label="Sort"
                      a11yLabel="Sort tiles"
                      a11yHint="Opens sort options above this button"
                      onPress={toggleSortMenu}
                      kind="neutral"
                      isToggle
                      isActive={sortMenuVisible}
                    />
                  </View>
                  <View onLayout={handleQuickAnchorLayout}>
                    <Reanimated.View style={quickShakeStyle}>
                      <BoardDockAction
                        icon="quick" label="Quick"
                        a11yLabel="Quick — jump to your pinned symbols"
                        a11yHint={quickTaggedIds.size === 0
                          ? 'Tap Manage to pin symbols first'
                          : 'Scrolls to top and highlights your Quick symbols'}
                        onPress={handleQuickPress}
                        kind="neutral"
                        isToggle
                        isActive={quickViewActive}
                      />
                      {/* Faint red error tint (newcomer nudge) — an overlay
                          blend, never a hard switch to red. */}
                      <Reanimated.View
                        pointerEvents="none"
                        style={[styles.quickErrorTint, quickTintStyle]}
                      />
                    </Reanimated.View>
                  </View>
                  <View onLayout={handleHideAnchorLayout}>
                    <BoardDockAction
                      icon="hide" label="Hide"
                      a11yLabel="Hide controls"
                      a11yHint="Choose to hide the nav bar, the control bar, or all"
                      onPress={toggleHideMenu}
                      kind="neutral"
                      isToggle
                      isActive={hideMenuVisible || navHidden}
                    />
                  </View>
                </>
              ) : dockMode === 'quickManage' ? (
                <>
                  <BoardDockAction
                    icon="back-out" label="Back"
                    a11yLabel="Back"
                    a11yHint="Close Quick manage"
                    onPress={handleQuickManageBack}
                    kind="neutral"
                  />
                  <Reanimated.View style={unselectBlinkStyle}>
                    <BoardDockAction
                      icon="select"
                      label={manageSelectedIds.size > 0 ? 'Unselect' : 'Select'}
                      a11yLabel={manageSelectedIds.size > 0
                        ? `Unselect ${manageSelectedIds.size} selected symbols`
                        : 'Select symbols'}
                      a11yHint={manageSelectedIds.size > 0
                        ? 'Clears the current selection'
                        : 'Tap symbols on the board to add or remove them from Quick'}
                      onPress={handleQuickSelectToggle}
                      kind="neutral"
                      tint={manageSelectedIds.size > 0 ? '#FF3B30' : undefined}
                      isToggle
                    />
                  </Reanimated.View>
                  <BoardDockAction
                    icon="add" label="Create +"
                    a11yLabel="Create a new Quick symbol"
                    a11yHint="Opens the add symbol form. The new symbol is pinned to Quick automatically"
                    onPress={handleQuickCreate}
                    kind="neutral"
                    wide
                  />
                  {manageDoneVisible ? (
                    <Reanimated.View style={manageDoneStyle}>
                      <BoardDockAction
                        icon="checkmark" label="Done"
                        a11yLabel="Done — save Quick changes"
                        a11yHint="Saves your Quick symbols and shows the Quick view"
                        onPress={handleQuickManageDone}
                        kind="primary"
                      />
                    </Reanimated.View>
                  ) : null}
                </>
              ) : dockMode === 'addExpanded' ? (
                <>
                  <BoardDockAction
                    icon="back-out" label="Back"
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
                </>
              ) : dockMode === 'folderExpanded' ? (
                <>
                  <BoardDockAction
                    icon="back-out" label="Back"
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
                  <View onLayout={handleSortAnchorLayout}>
                    <BoardDockAction
                      icon="sort" label="Sort"
                      a11yLabel="Sort tiles"
                      a11yHint="Opens sort options above this button"
                      onPress={toggleSortMenu}
                      kind="neutral"
                      isToggle
                      isActive={sortMenuVisible}
                    />
                  </View>
                  <View onLayout={handleQuickAnchorLayout}>
                    <Reanimated.View style={quickShakeStyle}>
                      <BoardDockAction
                        icon="quick" label="Quick"
                        a11yLabel="Quick — jump to your pinned symbols"
                        a11yHint={quickTaggedIds.size === 0
                          ? 'Tap Manage to pin symbols first'
                          : 'Scrolls to top and highlights your Quick symbols'}
                        onPress={handleQuickPress}
                        kind="neutral"
                        isToggle
                        isActive={quickViewActive}
                      />
                      <Reanimated.View
                        pointerEvents="none"
                        style={[styles.quickErrorTint, quickTintStyle]}
                      />
                    </Reanimated.View>
                  </View>
                  <View onLayout={handleHideAnchorLayout}>
                    <BoardDockAction
                      icon="hide" label="Hide"
                      a11yLabel="Hide controls"
                      a11yHint="Choose to hide the nav bar, the control bar, or all"
                      onPress={toggleHideMenu}
                      kind="neutral"
                      isToggle
                      isActive={hideMenuVisible || navHidden}
                    />
                  </View>
                </>
              ) : dockMode === 'folderCollapsed' ? (
                <BoardDockAction
                  icon="chevron-right" label="More"
                  a11yLabel="More"
                  a11yHint="Expand board controls"
                  onPress={handleFolderExpand} isToggle
                />
              ) : dockMode === 'editControls' ? (
                <>
                  {/* Undo — safest recovery action, always first (left). */}
                  <BoardDockAction
                    icon="undo" label="Undo"
                    a11yLabel="Undo"
                    a11yHint="Reverses the last board edit"
                    onPress={handleUndoEdit}
                    kind="neutral"
                    disabled={undoStack.length === 0}
                  />
                  {/* Select / Unselect — controls the edit state. */}
                  <View onLayout={handleSelectAnchorLayout}>
                    <BoardDockAction
                      icon="select"
                      label={selectedTileIds.size > 0 ? 'Unselect' : 'Select'}
                      a11yLabel={
                        selectedTileIds.size > 0
                          ? `Unselect ${selectedTileIds.size} selected tiles`
                          : 'Select tiles'
                      }
                      a11yHint={
                        selectedTileIds.size > 0
                          ? 'Clears the current selection'
                          : 'Tap tiles to select them'
                      }
                      onPress={handleEditToolSelectToggle}
                      kind="neutral"
                      isToggle
                      isActive={activeEditTool === 'select'}
                    />
                  </View>
                  {/* Move — acts on the selection, after Select. */}
                  <View onLayout={handleMoveAnchorLayout}>
                    <BoardDockAction
                      icon="move" label="Move"
                      a11yLabel="Move selected tiles"
                      a11yHint="Then tap a folder as the destination"
                      onPress={handleEditToolMove}
                      kind="neutral"
                      disabled={selectedTileIds.size === 0}
                      isToggle
                      isActive={activeEditTool === 'move'}
                    />
                  </View>
                  <BoardDockAction
                    icon="checkmark" label="Save"
                    a11yLabel="Save changes"
                    a11yHint="Saves the board and closes editing"
                    onPress={handleEditControlsSave} kind="primary"
                  />
                </>
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

          {/* ── Hidden-dock peek pill (item 4 v2) ─────────────────────────
              While the control bar is slid away, a soft visible pill hugs
              the lower-left edge so the user always has an obvious way
              back — no fine motor precision needed (hitSlop widens it).
              Tap restores everything; long-press offers partial toggles. */}
          {dockHidden ? (
            <>
              <DockPeekPill
                onPress={peekMenuVisible ? () => setPeekMenuVisible(false) : handleChromeRestore}
                onLongPress={handlePeekLongPress}
              />
              <DockPopover
                visible={peekMenuVisible}
                anchorX={0}
                anchorWidth={120}
                a11yLabel="Hide options"
                options={[
                  {
                    key: 'dock',
                    label: 'Control Bar',
                    a11yLabel: 'Show control bar',
                    selected: dockHidden,
                    onPress: handlePeekToggleDock,
                  },
                  {
                    key: 'nav',
                    label: 'Nav Bar',
                    a11yLabel: navHidden ? 'Show navigation bar' : 'Hide navigation bar',
                    selected: navHidden,
                    onPress: handleHideNavBar,
                  },
                ]}
              />
            </>
          ) : null}
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
  // ── Select Mode: circular indicator centered on the tile. Draws a
  // soft outlined circle when unselected and a filled primary-blue
  // circle with a large tick when selected. Sizing keeps the label
  // and symbol readable while the state is obvious at a glance.
  selectIndicator: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 44,
    height: 44,
    marginLeft: -22,
    marginTop: -22,
    borderRadius: 22,
    borderWidth: 2.5,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 8,
  },
  // ── Move Mode: dashed primary outline that appears on folder tiles
  // while the user is choosing a destination.
  moveDestinationOutline: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 2.5,
    borderStyle: 'dashed',
    borderRadius: TILE_CORNER_RADIUS,
    zIndex: 4,
  },
  tileEditOutline: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: TILE_CORNER_RADIUS,
  },
  tileShell: {
    position: 'relative',
  },
  folderTab: {
    position: 'absolute',
    left: 0,
    top: 0,
    borderTopLeftRadius: TILE_CORNER_RADIUS,
    borderTopRightRadius: TILE_CORNER_RADIUS,
    // Folder outline intentionally 20% lighter than word tiles (1.5 → 1.2).
    borderWidth: 1.2,
    borderBottomWidth: 0,
  },
  folderFace: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: TILE_CORNER_RADIUS,
    borderWidth: 1.2,
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
    borderRadius: TILE_CORNER_RADIUS,
    borderWidth: 1.5,
    borderStyle: 'dashed',
  },
  wordTileFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    borderRadius: TILE_CORNER_RADIUS,
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
    // Float over the board with no fill — the grey board shows through so the
    // control bar reads as floating rather than sitting on a solid strip.
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
  },
  dockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'nowrap',
    gap: DOCK_GAP,
  },
  // ── DockPopover (Sort / Hide options) ───────────────────────────────────
  // Sits just above the control bar, aligned with its anchor button.
  // Calm: soft border, no heavy shadow, generous 48pt rows.
  dockPopover: {
    position: 'absolute',
    bottom: DOCK_BOTTOM_GAP + DOCK_ACTION_SIZE + spacing.sm,
    borderRadius: 14,
    borderWidth: 1.6,
    paddingVertical: 4,
    paddingHorizontal: 4,
    overflow: 'hidden',
  },
  dockPopoverItem: {
    minHeight: 48,
    borderRadius: 10,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dockPopoverItemLabel: {
    fontSize: 16,
    fontWeight: '700',
  },
  dockPopoverCheck: {
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Favourite star — small calm badge, top-left of pinned tiles.
  favouriteBadge: {
    position: 'absolute',
    top: 4,
    left: 4,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9,
  },
  // ── Top Sub Control (item 5) ─────────────────────────────────────────────
  // Even spacing from left, right, and top of the board area. Light pill —
  // soft border, no shadow — so it reads as guidance, not another toolbar.
  topSubControl: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.md,
    right: spacing.md,
    minHeight: 44,
    borderRadius: 14,
    borderWidth: 1.6,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  topSubControlText: {
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
  },
  // ── DockPeekPill (item 4 v2) ─────────────────────────────────────────
  // Soft blob hugging the left edge, vertically centred in the dock's
  // former position. Flat left side (flush with the edge), 20pt rounded
  // right side, subtle floating shadow. 44×56pt ≥ minimum touch target.
  dockPeekPillMount: {
    position: 'absolute',
    left: 0,
    bottom: DOCK_BOTTOM_GAP + Math.max(0, (DOCK_ACTION_SIZE - 56) / 2),
  },
  dockPeekPill: {
    width: 44,
    height: 56,
    borderTopRightRadius: 20,
    borderBottomRightRadius: 20,
    borderWidth: 1.6,
    borderLeftWidth: 0,
    alignItems: 'center',
    justifyContent: 'center',
    // Subtle drop shadow so it reads as floating above the board.
    shadowColor: '#000000',
    shadowOpacity: 0.12,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  dockPeekGrip: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  dockPeekGripBar: {
    width: 14,
    height: 2.5,
    borderRadius: 1.25,
  },
  // ── Quick feature ────────────────────────────────────────────────────
  // Lightning badge — top-right of Quick-tagged tiles, always visible.
  quickBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 16,
    height: 16,
    zIndex: 10,
  },
  // Per-tile Quick view highlight (absolute fill, above tile content but
  // pointerEvents:none so interaction is untouched).
  quickTileOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: TILE_CORNER_RADIUS,
    zIndex: 8,
  },
  quickRemoveStrike: {
    position: 'absolute',
    left: '6%',
    right: '6%',
    top: '50%',
    height: 2.5,
    borderRadius: 1.25,
    backgroundColor: '#FF3B30',
    opacity: 0.8,
    transform: [{ rotate: '-24deg' }],
  },
  // Green Manage pill — floats directly above the Quick button's slot.
  manageSubOption: {
    position: 'absolute',
    bottom: DOCK_BOTTOM_GAP + DOCK_ACTION_SIZE + spacing.sm,
  },
  managePill: {
    minHeight: 44,
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  managePillLabel: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  // Faint red blend over the Quick button on the newcomer error shake
  // (animated opacity 0 → 0.25 — never a hard colour switch).
  quickErrorTint: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 14,
    backgroundColor: '#FF3B30',
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
