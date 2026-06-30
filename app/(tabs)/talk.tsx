import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AccessibilityActionEvent,
  AccessibilityInfo,
  Alert,
  Animated as RNAnimated,
  Easing as RNEasing,
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
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  SharedValue,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Href, useRouter } from 'expo-router';
import { BoardBackIcon, BoardHomeIcon } from '../../src/components/icons/FigmaIcons';
import { TalkMessageStrip, type MessageStripTile } from '../../src/components/talk/TalkMessageStrip';
import { MulberrySymbol, prewarmMulberryAssets } from '../../src/components/symbols/MulberrySymbol';
import { useAppContext } from '../../src/hooks/useAppContext';
import { useSpeech } from '../../src/hooks/useSpeech';
import { animation, spacing } from '../../src/theme/tokens';
import { useTheme } from '../../src/theme/useTheme';
import { hapticError, hapticSelection } from '../../src/utils/haptics';
import { useReduceMotion } from '../../src/hooks/useReduceMotion';
import {
  resolveSymbolForKeyword,
  ResolvedSymbol,
} from '../../src/features/symbol-brain/resolveSymbolForKeyword';

type TileKind = 'folder' | 'word' | 'action';
type BoardMode = 'home' | 'foods' | 'animals' | 'tools' | 'quick' | 'settings';
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
};

type WindowRect = LayoutRectangle;

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
// +1pt of breathing room between every tile — picks up the request to
// loosen the grid without dropping a column. Drives both the horizontal
// `columnGap` and vertical `rowGap` on `boardContent`, and is factored
// into `tileSize` so the right column still lands inside the safe-area
// gutter.
const TILE_GAP = 4;
// 4pt gutter on top of the safe-area inset. Halved from 8pt because the
// side margin was still reading as wasted space — the freed width below
// goes straight into the tiles via the `tileSize` row maths.
const TILE_LEFT_PADDING = 4;
const BOARD_TOP_GAP = 36;
// Soft cap on tile size. Actual size is `min(TILE_SIZE, fit-to-row)`, so
// on a standard 390-393pt iPhone the row maths drives the tile to ~94pt
// (up from 91 at 8pt gutter). On wider devices (Plus / Pro Max / iPad)
// tiles cap here — raised from 96 so the recovered gutter space actually
// produces bigger folders/symbols instead of leftover whitespace.
const TILE_SIZE = 104;
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
  taptalk: { icon: 'keypad-outline',         label: 'TAPTALK' },
  quick:   { icon: 'flash-outline',          label: 'QUICK'   },
  edit:    { icon: 'create-outline',         label: 'EDIT'    },
  clear:   { icon: 'close-circle-outline',   label: 'CLEAR'   },
};

// Active state mirrors the bottom-nav outline weight — a deep neutral
// rather than brand blue, so the press feedback reads as "selected" without
// shouting. Was `colors.primary` (#199AEE); the blue felt disconnected from
// the rest of the chrome.
const TOP_TAB_IDLE_COLOR = '#8A8F95';

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
];

const BOARD_TILES: Record<BoardMode, BoardTile[]> = {
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
};

const BACK_TILE: BoardTile = { id: 'back', label: 'Back', kind: 'action', color: '#6B7580' };
const HOME_TILE: BoardTile = { id: 'home', label: 'Home', kind: 'action', color: '#6B7580' };

const BoardNavTile = React.memo(function BoardNavTile({ tile, size }: { tile: BoardTile; size: number }) {
  const t = useTheme();
  return (
    <View
      style={[
        styles.navTileShell,
        { width: size, height: size, backgroundColor: t.isDark ? t.colors.input : '#E8EBED' },
      ]}
    >
      <View style={styles.navTileIconMount}>
        {tile.id === 'back' ? <BoardBackIcon size={40} /> : <BoardHomeIcon size={40} />}
      </View>
      <Text
        style={[styles.navTileLabel, { color: t.isDark ? t.colors.textMuted : '#4B555C' }]}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {tile.label}
      </Text>
    </View>
  );
});

// Mulberry pictograms render inside the `symbolMount` region at ~52% of
// the tile size, which keeps them comfortably below the label without
// crowding. Returns null when the tile has no symbol assigned so existing
// tiles (e.g. People, Places) stay clean until we curate one for them.
function TileSymbol({ tile, size, resolved }: { tile: BoardTile; size: number; resolved?: ResolvedSymbol }) {
  const symbolId = tile.mulberrySymbolId ?? resolved?.symbol.id;
  const symbolName = tile.mulberryName;
  if (!symbolId && !symbolName) return null;
  const symbolSize = Math.round(size * 0.52);
  return (
    <View style={styles.symbolMount} pointerEvents="none">
      <MulberrySymbol symbolId={symbolId} name={symbolName} size={symbolSize} />
    </View>
  );
}

function BoardFolderTile({ tile, size, resolved }: { tile: BoardTile; size: number; resolved?: ResolvedSymbol }) {
  const t = useTheme();
  const edgeColor = t.isDark ? t.colors.border : t.colors.primary;
  const tabWidth = Math.round(size * 0.48);
  const tabHeight = Math.round(size * 0.17);
  const faceTop = Math.round(size * 0.08);
  // Folder tiles render at the same square footprint as word tiles so the
  // grid reads as one rhythm regardless of `kind`.
  return (
    <View style={[styles.tileShell, { width: size, height: size }]}>
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
        style={[styles.folderLabel, { color: t.colors.text }]}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {tile.label}
      </Text>
      <TileSymbol tile={tile} size={size} resolved={resolved} />
    </View>
  );
}

function BoardWordTile({ tile, size, resolved }: { tile: BoardTile; size: number; resolved?: ResolvedSymbol }) {
  const t = useTheme();
  const isFallback =
    resolved != null &&
    !tile.mulberrySymbolId &&
    !tile.mulberryName &&
    (resolved.tier === 'fuzzy' || resolved.tier === 'semantic' ||
      resolved.tier === 'category' || resolved.tier === 'unknown');
  // Flat coloured fill at 30% opacity — replaces the previous baked PNG
  // backgrounds so the tile reads as a clean tinted chip. The label sits
  // above at full opacity for legibility; the Mulberry symbol sits below
  // in the `symbolMount` region.
  return (
    <View style={[styles.wordTile, { width: size, height: size }]}>
      <View
        style={[
          styles.wordTileFill,
          { width: size, height: size, backgroundColor: tile.color, opacity: 0.3 },
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
        style={[styles.wordLabel, { color: t.colors.text }]}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {isFallback ? '≈ ' : ''}{tile.label}
      </Text>
      <TileSymbol tile={tile} size={size} resolved={resolved} />
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
        <BoardFolderTile tile={ghost.tile} size={ghost.size} />
      ) : (
        <BoardWordTile tile={ghost.tile} size={ghost.size} />
      )}
    </Reanimated.View>
  );
}

// Rect in board-content coordinate space (relative to the ScrollView's
// content container). Used purely for drag hit-testing inside the same
// coordinate space — never crosses screens.
type SlotRect = { x: number; y: number; width: number; height: number };
type TileRectsRef = React.MutableRefObject<Record<string, SlotRect>>;

interface BoardTileButtonProps {
  tile: BoardTile;
  size: number;
  onPress: (rect: WindowRect | null) => void;
  onMeasuredPress?: () => void;
  resolved?: ResolvedSymbol;
  // ── Drag + edit-mode plumbing ──
  editMode?: boolean;
  onLongPressEnterEdit?: () => void;
  onSwap?: (fromId: string, toId: string) => void;
  onHide?: (tile: BoardTile) => void;
  onAccessibilityReorder?: (tileId: string, direction: 'forward' | 'back') => void;
  tileRects?: TileRectsRef;
  jiggle?: SharedValue<number>;
}

function BoardTileButton({
  tile,
  size,
  onPress,
  onMeasuredPress,
  resolved,
  editMode = false,
  onLongPressEnterEdit,
  onSwap,
  onHide,
  onAccessibilityReorder,
  tileRects,
  jiggle,
}: BoardTileButtonProps) {
  const t = useTheme();
  const pressableRef = useRef<View>(null);
  const scale = useRef(new RNAnimated.Value(1)).current;
  // Item 2 — RM: swap spring scale for an opacity dip so the tile
  // still acknowledges the press without moving (principle 18).
  const tileOpacity = useRef(new RNAnimated.Value(1)).current;
  const reduceMotion = useReduceMotion();

  // ── Drag state (Reanimated SVs so the gesture runs on the UI thread)
  const dragX = useSharedValue(0);
  const dragY = useSharedValue(0);
  const lifted = useSharedValue(0);

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
  // Every kind — folder, word, action, nav — renders as a square so the
  // grid is visually consistent. `size` is already clamped against the
  // available board width up the tree, so this also satisfies the 44pt
  // minimum touch-target rule.
  const tileHeight = Math.round(size * TILE_HEIGHT_RATIO);

  const handlePress = useCallback(() => {
    if (editMode) return; // taps do nothing in edit mode — long-press exits
    onMeasuredPress?.();
    pressableRef.current?.measureInWindow((x, y, width, height) => {
      onPress({ x, y, width, height });
    });
  }, [editMode, onMeasuredPress, onPress]);

  // Item 7 — word-type hint for VoiceOver (principle 23: don't rely on
  // colour alone). Folder tiles already say "Open …" in the label.
  const a11yHint = tile.kind === 'word' && tile.wordType
    ? `Word type: ${tile.wordType}`
    : undefined;

  // ── Drag gesture — runs only when editMode is on and the tile isn't nav.
  // Hit-tests against other tile rects on release and swaps the two IDs.
  const pan = useMemo(() => Gesture.Pan()
    .enabled(isDraggable)
    .onStart(() => {
      lifted.value = withTiming(1, { duration: 120 });
    })
    .onUpdate((e) => {
      dragX.value = e.translationX;
      dragY.value = e.translationY;
    })
    .onEnd((e) => {
      const myRect = tileRects?.current?.[tile.id];
      const settle = () => {
        dragX.value = withTiming(0, { duration: reduceMotion ? 0 : 220 });
        dragY.value = withTiming(0, { duration: reduceMotion ? 0 : 220 });
        lifted.value = withTiming(0, { duration: reduceMotion ? 0 : 120 });
      };
      if (!myRect || !tileRects) {
        settle();
        return;
      }
      const dropX = myRect.x + myRect.width / 2 + e.translationX;
      const dropY = myRect.y + myRect.height / 2 + e.translationY;
      let nearestId: string | null = null;
      let nearestDist = Infinity;
      const rects = tileRects.current;
      for (const otherId in rects) {
        if (otherId === tile.id) continue;
        const r = rects[otherId];
        if (!r) continue;
        const cx = r.x + r.width / 2;
        const cy = r.y + r.height / 2;
        const d = Math.hypot(cx - dropX, cy - dropY);
        if (d < nearestDist) {
          nearestDist = d;
          nearestId = otherId;
        }
      }
      // Only commit a swap if the drop is well inside another slot's bounds
      // (within ~70% of a tile width). Prevents accidental swaps on tiny
      // pan-ends.
      if (nearestId && nearestDist < myRect.width * 0.7 && onSwap) {
        runOnJS(onSwap)(tile.id, nearestId);
      }
      settle();
    }), [dragX, dragY, isDraggable, lifted, onSwap, reduceMotion, tile.id, tileRects]);

  const animatedDragStyle = useAnimatedStyle(() => {
    const jiggleDeg = isDraggable && jiggle && !reduceMotion ? jiggle.value : 0;
    return {
      transform: [
        { translateX: dragX.value },
        { translateY: dragY.value },
        { scale: 1 + lifted.value * 0.06 },
        { rotate: `${jiggleDeg}deg` },
      ],
      zIndex: lifted.value > 0 ? 100 : 1,
    };
  });

  const handleLayout = useCallback((e: LayoutChangeEvent) => {
    if (!tileRects) return;
    const { x, y, width, height } = e.nativeEvent.layout;
    tileRects.current[tile.id] = { x, y, width, height };
  }, [tile.id, tileRects]);

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
      {tile.id === 'back' || tile.id === 'home' ? (
        <BoardNavTile tile={tile} size={size} />
      ) : tile.kind === 'folder' ? (
        <BoardFolderTile tile={tile} size={size} resolved={resolved} />
      ) : (
        <BoardWordTile tile={tile} size={size} resolved={resolved} />
      )}
      {isDraggable && onHide ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Remove ${tile.label}`}
          onPress={() => onHide(tile)}
          hitSlop={10}
          style={[styles.deleteBadge, { backgroundColor: t.colors.danger }]}
        >
          <Ionicons name="close" size={16} color={t.colors.surface} />
        </Pressable>
      ) : null}
    </>
  );

  const inner = (
    <Reanimated.View
      onLayout={handleLayout}
      style={[
        { width: size, height: tileHeight },
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
          onLongPress={!editMode && !isNav ? onLongPressEnterEdit : undefined}
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
  resolved,
  onTilePress,
}: {
  tile: BoardTile;
  size: number;
  resolved?: ResolvedSymbol;
  onTilePress: (tile: BoardTile, rect: WindowRect | null) => void;
}) {
  const handlePress = useCallback(
    (rect: WindowRect | null) => onTilePress(tile, rect),
    [onTilePress, tile],
  );
  return (
    <MemoBoardTileButton
      tile={tile}
      size={size}
      onPress={handlePress}
      resolved={resolved}
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
  const idleColor = t.isDark ? t.colors.textTertiary : TOP_TAB_IDLE_COLOR;
  const activeColor = t.colors.symbolOutline;

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
        <Ionicons
          name={meta.icon}
          size={28}
          color={active ? activeColor : idleColor}
        />
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
  const { width } = useWindowDimensions();
  const rootRef = useRef<View>(null);
  const messageSlotRefs = useRef<Array<View | null>>([]);
  const ghostsRef = useRef<GhostTile[]>([]);
  const { state, dispatch } = useAppContext();
  const { speak, lastError, clearError } = useSpeech();
  const router = useRouter();
  const t = useTheme();
  // Default to closed — board is the hero, top nav stays out of the way
  // until the user explicitly taps the chevron to open it.
  const [showTopNav, setShowTopNav] = useState(false);
  const [activeMode, setActiveMode] = useState<BoardMode>('home');
  const [previousMode, setPreviousMode] = useState<BoardMode | null>(null);
  const [activeTab, setActiveTab] = useState<TopTab>('taptalk');
  const [ghosts, setGhosts] = useState<GhostTile[]>([]);
  const [resolvedSymbols, setResolvedSymbols] = useState<Map<string, ResolvedSymbol>>(new Map());
  const scrollRef = useRef<ScrollView>(null);
  const scrollPositions = useRef<Partial<Record<BoardMode, number>>>({});
  const reduceMotion = useReduceMotion();
  const messageWordsRef = useRef(state.messageWords);
  messageWordsRef.current = state.messageWords;
  const hapticIfEnabled = useCallback(() => {
    if (state.accessibility.hapticsEnabled !== false) hapticSelection();
  }, [state.accessibility.hapticsEnabled]);

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
  const tiles = BOARD_TILES[activeMode];

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

  const handleStripSpeak = useCallback((messageText: string, hasWords: boolean) => {
    if (!messageText.trim() || !hasWords) {
      announce('No message to speak');
      return;
    }
    speak(messageText, {
      rate: state.accessibility.speechRate,
      pitch: state.accessibility.speechPitch,
    });
    announce(`Speaking: ${messageText}`);
  }, [announce, speak, state.accessibility.speechPitch, state.accessibility.speechRate]);

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
    speak(messageText, { rate: state.accessibility.speechRate, pitch: state.accessibility.speechPitch });
    announce(`Speaking: ${messageText}`);
  }, [announce, speak, state.accessibility.speechPitch, state.accessibility.speechRate]);

  const clearMessage = useCallback(() => {
    ghostsRef.current = [];
    setGhosts([]);
    dispatch({ type: 'CLEAR_WORDS' });
    announce('Message cleared');
  }, [announce, dispatch]);

  const startGhostToMessage = useCallback((tile: BoardTile, fromRect: WindowRect | null) => {
    // Speak immediately on press — don't wait for the 430ms ghost animation
    // to complete. This eliminates the perceived delay between tapping and hearing.
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
  }, [addGhost, appendWord, speak, state.accessibility.speechPitch, state.accessibility.speechRate, tileSize]);

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

        <TopNav
          visible={showTopNav}
          activeTab={activeTab}
          onTabPress={handleTopTab}
        />

        <ScrollView
          ref={scrollRef}
          style={[styles.board, { backgroundColor: t.colors.background }]}
          contentContainerStyle={[
            styles.boardContent,
            {
              // Start from the safe-zone inset, then add TILE_LEFT_PADDING
              // (16pt) inside it. The extra `(availableWidth - boardWidth)/2`
              // term centres the board on wider devices (iPhone Plus / Pro
              // Max / iPad) once `availableWidth` exceeds the Figma cap.
              paddingLeft:  insets.left  + TILE_LEFT_PADDING + Math.max(0, (availableWidth - boardWidth) / 2),
              paddingRight: insets.right + TILE_LEFT_PADDING + Math.max(0, (availableWidth - boardWidth) / 2),
            },
          ]}
          showsVerticalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={50}
        >
          {tiles.map(tile => (
            <BoardTileCell
              key={tile.id}
              tile={tile}
              size={tileSize}
              onTilePress={handleTilePress}
              resolved={resolvedSymbols.get(tile.id)}
            />
          ))}
          {activeMode !== 'home' ? (
            <View
              style={[
                styles.navRow,
                {
                  paddingLeft: 0,
                  paddingRight: 0,
                  width: boardWidth - TILE_LEFT_PADDING * 2,
                },
              ]}
            >
              <BoardTileCell
                tile={BACK_TILE}
                size={tileSize}
                onTilePress={handleTilePress}
              />
              <BoardTileCell
                tile={HOME_TILE}
                size={tileSize}
                onTilePress={handleTilePress}
              />
            </View>
          ) : null}
        </ScrollView>

        <View pointerEvents="none" style={styles.ghostOverlay}>
          {ghosts.map(ghost => (
            <GhostTileClone key={ghost.id} ghost={ghost} onDone={finishGhost} />
          ))}
        </View>
      </View>
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
    justifyContent: 'space-around',
    paddingTop: 12,
    paddingBottom: 9,
    paddingHorizontal: 14,
  },
  // Full-width bottom border of the top nav. Rendered as a view rather than
  // a border so it isn't clipped by the animated slot's overflow:hidden.
  topNavBottomBorder: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 1.2,
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
    justifyContent: 'center',
    height: '100%',
  },
  topTabLabel: {
    marginTop: 4,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  board: {
    flex: 1,
  },
  boardContent: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: TILE_GAP,
    rowGap: TILE_GAP,
    paddingTop: BOARD_TOP_GAP,
    paddingBottom: 28,
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
    left: 16,
    right: 16,
    top: 16,
    fontSize: 20,
    lineHeight: 24,
    fontWeight: '600',
    textAlign: 'center',
  },
  // Symbol mount sits below the label and centers the Mulberry pictogram.
  // Top offset clears the label (16 + 24 line-height + a hair of breathing
  // room) so glyph + label never overlap on the smallest 88×88 tile.
  symbolMount: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 42,
    bottom: 4,
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
    left: 16,
    right: 16,
    top: 16,
    fontSize: 20,
    lineHeight: 24,
    fontWeight: '600',
    textAlign: 'center',
  },
  ghostOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 20,
  },
  ghostTile: {
    position: 'absolute',
  },
  navRow: {
    flexDirection: 'row',
    gap: TILE_GAP,
    marginTop: TILE_GAP,
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
});
