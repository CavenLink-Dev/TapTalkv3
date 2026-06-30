import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AccessibilityActionEvent,
  AccessibilityInfo,
  Alert,
  Animated as RNAnimated,
  Easing as RNEasing,
  Image,
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
import Svg, { Polyline } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { Href, useRouter } from 'expo-router';
import { BackspaceIcon, BoardBackIcon, BoardHomeIcon } from '../../src/components/icons/FigmaIcons';
import { MulberrySymbol } from '../../src/components/symbols/MulberrySymbol';
import { useAppContext } from '../../src/hooks/useAppContext';
import { useSpeech } from '../../src/hooks/useSpeech';
import { animation, colors, spacing } from '../../src/theme/tokens';
import { hapticError, hapticSelection } from '../../src/utils/haptics';
import { useReduceMotion } from '../../src/hooks/useReduceMotion';

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
const COLLAPSED_TOGGLE_HEIGHT = 17;
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
const BOARD_TOP_GAP = 18;
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
const TILE_HEIGHT_RATIO = 1;
const MESSAGE_CHIP_SIZE = 40;
const MESSAGE_SLOT_COUNT = 6;
const MESSAGE_SLOT_GAP = 5;

const TILE_ASSETS = {
  folder: require('../../assets/aac/board_tiles/folder-cyan.png'),
  folderExample: require('../../assets/aac/board_tiles/folder-example.png'),
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

// Idle / active colours, kept inline so the tint animation has explicit
// endpoints to interpolate between.
const TOP_TAB_IDLE_COLOR   = '#8A8F95';
// Active state mirrors the bottom-nav outline weight — a deep neutral
// rather than brand blue, so the press feedback reads as "selected" without
// shouting. Was `colors.primary` (#199AEE); the blue felt disconnected from
// the rest of the chrome.
const TOP_TAB_ACTIVE_COLOR = colors.symbolOutline;

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
  // 'people' / 'places' / 'actions' don't have a clean 1:1 Mulberry asset
  // — we keep the folder image and let the label carry the meaning until
  // the user picks a curated symbol. 'foods' has a clean match.
  { id: 'people', label: 'People', kind: 'folder', target: 'quick',   color: '#1DCDFF', background: 'folderExample' },
  { id: 'foods',  label: 'Foods',  kind: 'folder', target: 'foods',   color: '#1DCDFF', background: 'folderExample', mulberrySymbolId: 'mulberry_food_atkyaz' },
  { id: 'places', label: 'Places', kind: 'folder', target: 'animals', color: '#1DCDFF', background: 'folderExample' },
  { id: 'actions',label: 'Actions',kind: 'folder', target: 'tools',   color: '#1DCDFF', background: 'folderExample' },
];

const BOARD_TILES: Record<BoardMode, BoardTile[]> = {
  home: HOME_TILES,
  foods: [
    { id: 'cheese', label: 'Cheese', kind: 'word',   color: SYMBOL_YELLOW, speech: 'cheese', mulberrySymbolId: 'mulberry_cheese_qsgfck', wordType: 'noun' },
    { id: 'apple',  label: 'Apple',  kind: 'word',   color: SYMBOL_RED,    speech: 'apple',  mulberrySymbolId: 'mulberry_apple_1ogqpa9',  wordType: 'noun' },
    { id: 'bread',  label: 'Bread',  kind: 'word',   color: SYMBOL_ORANGE, speech: 'bread',  mulberrySymbolId: 'mulberry_bread_t6g6ux',   wordType: 'noun' },
    { id: 'back-foods', label: 'Home', kind: 'folder', target: 'home', color: '#1DCDFF' },
  ],
  animals: [
    { id: 'cat',  label: 'Cat',  kind: 'word', color: SYMBOL_ORANGE, speech: 'cat',  mulberrySymbolId: 'mulberry_cat_1lz3nun',  wordType: 'noun' },
    { id: 'dog',  label: 'Dog',  kind: 'word', color: SYMBOL_GREEN,  speech: 'dog',  mulberrySymbolId: 'mulberry_dog_1bfmoh1',  wordType: 'noun' },
    { id: 'fish', label: 'Fish', kind: 'word', color: SYMBOL_BLUE,   speech: 'fish', mulberrySymbolId: 'mulberry_fish_1u95ovx', wordType: 'noun' },
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

function BoardNavTile({ tile, size }: { tile: BoardTile; size: number }) {
  return (
    <View style={[styles.navTileShell, { width: size, height: size }]}>
      <View style={styles.navTileIconMount}>
        {tile.id === 'back' ? <BoardBackIcon size={40} /> : <BoardHomeIcon size={40} />}
      </View>
      <Text style={styles.navTileLabel} numberOfLines={1} adjustsFontSizeToFit>
        {tile.label}
      </Text>
    </View>
  );
}

// Mulberry pictograms render inside the `symbolMount` region at ~52% of
// the tile size, which keeps them comfortably below the label without
// crowding. Returns null when the tile has no symbol assigned so existing
// tiles (e.g. People, Places) stay clean until we curate one for them.
function TileSymbol({ tile, size }: { tile: BoardTile; size: number }) {
  if (!tile.mulberrySymbolId && !tile.mulberryName) return null;
  const symbolSize = Math.round(size * 0.52);
  return (
    <View style={styles.symbolMount} pointerEvents="none">
      <MulberrySymbol
        symbolId={tile.mulberrySymbolId}
        name={tile.mulberryName}
        size={symbolSize}
      />
    </View>
  );
}

function BoardFolderTile({ tile, size }: { tile: BoardTile; size: number }) {
  // Folder tiles render at the same square footprint as word tiles so the
  // grid reads as one rhythm regardless of `kind`.
  return (
    <View style={[styles.tileShell, { width: size, height: size }]}>
      <Image
        source={TILE_ASSETS[tile.background ?? 'folder']}
        resizeMode="stretch"
        style={[styles.tileBackground, { width: size, height: size }]}
      />
      <Text style={styles.folderLabel} numberOfLines={1} adjustsFontSizeToFit>
        {tile.label}
      </Text>
      <TileSymbol tile={tile} size={size} />
    </View>
  );
}

function BoardWordTile({ tile, size }: { tile: BoardTile; size: number }) {
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
      <Text style={styles.wordLabel} numberOfLines={1} adjustsFontSizeToFit>
        {tile.label}
      </Text>
      <TileSymbol tile={tile} size={size} />
    </View>
  );
}

function MessageChip({
  tile,
  label,
  onRemove,
}: {
  tile?: BoardTile;
  label: string;
  onRemove?: () => void;
}) {
  const chipTile = tile ?? {
    id: label,
    label,
    kind: 'word' as const,
    color: '#5CC9E8',
    background: 'cyan' as const,
  };

  const inner = (
    <>
      <Image
        source={wordBackgroundForTile(chipTile)}
        resizeMode="stretch"
        style={styles.messageChipBackground}
      />
      <Text style={styles.messageChipLabel} numberOfLines={1} adjustsFontSizeToFit>
        {label}
      </Text>
    </>
  );

  // When removable (item 10): chips become Pressable so VoiceOver users and
  // sighted users can tap to remove individual words without backspacing
  // from the end. Principle 5 — deeper detail in-place; Principle 20 — hit
  // target kept at the full chip size.
  if (onRemove) {
    return (
      <Pressable
        onPress={onRemove}
        accessibilityRole="button"
        accessibilityLabel={`Remove ${label}`}
        style={({ pressed }) => [styles.messageChip, pressed && { opacity: 0.7 }]}
      >
        {inner}
      </Pressable>
    );
  }

  return <View style={styles.messageChip}>{inner}</View>;
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
  editMode = false,
  onLongPressEnterEdit,
  onSwap,
  onHide,
  onAccessibilityReorder,
  tileRects,
  jiggle,
}: BoardTileButtonProps) {
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
        <BoardFolderTile tile={tile} size={size} />
      ) : (
        <BoardWordTile tile={tile} size={size} />
      )}
      {isDraggable && onHide ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Remove ${tile.label}`}
          onPress={() => onHide(tile)}
          hitSlop={10}
          style={styles.deleteBadge}
        >
          <Ionicons name="close" size={16} color={colors.surface} />
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
          style={({ pressed }) => [
            styles.tilePressable,
            pressed && !editMode && styles.tilePressed,
            isDraggable && styles.tileEditOutline,
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
    outputRange: [TOP_TAB_IDLE_COLOR, TOP_TAB_ACTIVE_COLOR],
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
          // Animated.Color can't pass directly into Ionicons' color prop, so
          // we let the parent View tint via animated text-style trick.
          color={TOP_TAB_IDLE_COLOR}
          // Replace the static icon with an absolute-positioned overlay that
          // fades in the active tint on top.
        />
        {/* Active-coloured overlay icon — opacity tracks activeAnim. */}
        <RNAnimated.View style={[styles.topTabIconOverlay, { opacity: activeAnim }]}>
          <Ionicons name={meta.icon} size={28} color={TOP_TAB_ACTIVE_COLOR} />
        </RNAnimated.View>
        <RNAnimated.Text style={[styles.topTabLabel, { color: tintColor }]}>
          {meta.label}
        </RNAnimated.Text>
      </RNAnimated.View>
    </Pressable>
  );
}

function ToggleChevron({ open, active }: { open: boolean; active: boolean }) {
  // Arrow darkens (rather than lights blue) when the nav is open or pressed,
  // so the chevron lives in the same neutral family as the top-tab icons.
  const stroke = active ? colors.symbolOutline : '#9A9A9A';
  return (
    <Svg width={36} height={16} viewBox="0 0 36 16">
      <Polyline
        points={open ? '9,10 18,4 27,10' : '9,5 18,11 27,5'}
        fill="none"
        stroke={stroke}
        strokeWidth={3}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function TopNav({
  visible,
  activeTab,
  onTabPress,
  onToggle,
}: {
  visible: boolean;
  activeTab: TopTab;
  onTabPress: (tab: TopTab) => void;
  onToggle: () => void;
}) {
  // Item 3 — RM: collapse/expand at duration 0 (principle 18).
  const reduceMotion = useReduceMotion();
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
    outputRange: [COLLAPSED_TOGGLE_HEIGHT, TOP_NAV_HEIGHT],
  });
  const panelOpacity = anim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 0, 1],
  });

  return (
    <RNAnimated.View style={[styles.topNavSlot, { height: slotHeight }]}>
      <RNAnimated.View
        pointerEvents={visible ? 'auto' : 'none'}
        style={[styles.topNavPanel, { opacity: panelOpacity }]}
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
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={visible ? 'Hide top navigation' : 'Show top navigation'}
        onPress={onToggle}
        style={({ pressed }) => [
          styles.navToggle,
          visible ? styles.navToggleOpen : styles.navToggleClosed,
          !(visible || pressed) && styles.navToggleIdle,
        ]}
      >
        {({ pressed }) => <ToggleChevron open={visible} active={visible || pressed} />}
      </Pressable>
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
  // Default to closed — board is the hero, top nav stays out of the way
  // until the user explicitly taps the chevron to open it.
  const [showTopNav, setShowTopNav] = useState(false);
  const [activeMode, setActiveMode] = useState<BoardMode>('home');
  const [previousMode, setPreviousMode] = useState<BoardMode | null>(null);
  const [activeTab, setActiveTab] = useState<TopTab>('taptalk');
  const [ghosts, setGhosts] = useState<GhostTile[]>([]);
  const scrollRef = useRef<ScrollView>(null);
  const scrollPositions = useRef<Partial<Record<BoardMode, number>>>({});
  const reduceMotion = useReduceMotion();
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
  const chipTileLookup = useMemo(() => {
    const lookup = new Map<string, BoardTile>();
    Object.values(BOARD_TILES).flat().forEach(tile => {
      lookup.set((tile.speech ?? tile.label).toLowerCase(), tile);
      lookup.set(tile.label.toLowerCase(), tile);
    });
    return lookup;
  }, []);
  const messageText = useMemo(
    () => state.messageWords.map(word => word.label).join(' '),
    [state.messageWords],
  );
  const hasWords = state.messageWords.length > 0;
  const visibleMessageWords = state.messageWords.slice(0, MESSAGE_SLOT_COUNT);

  const announce = useCallback((message: string) => {
    AccessibilityInfo.announceForAccessibility(message);
  }, []);

  const appendWord = useCallback((tile: BoardTile) => {
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
    speak(label, { rate: state.accessibility.speechRate, pitch: state.accessibility.speechPitch });
    announce(`Added ${label}`);
  }, [announce, dispatch, speak]);

  const addGhost = useCallback((ghost: GhostTile) => {
    ghostsRef.current = [...ghostsRef.current, ghost];
    setGhosts(ghostsRef.current);
  }, []);

  const finishGhost = useCallback((ghostId: string) => {
    const ghost = ghostsRef.current.find(item => item.id === ghostId);
    ghostsRef.current = ghostsRef.current.filter(item => item.id !== ghostId);
    setGhosts(ghostsRef.current);

    if (!ghost) return;
    appendWord(ghost.tile);
    hapticIfEnabled();
  }, [appendWord, hapticIfEnabled]);

  const repeatMessage = useCallback(() => {
    if (!messageText.trim()) {
      announce('No message to speak');
      return;
    }
    speak(messageText, { rate: state.accessibility.speechRate, pitch: state.accessibility.speechPitch });
    announce(`Speaking: ${messageText}`);
  }, [announce, messageText, speak]);

  const clearMessage = useCallback(() => {
    ghostsRef.current = [];
    setGhosts([]);
    dispatch({ type: 'CLEAR_WORDS' });
    announce('Message cleared');
  }, [announce, dispatch]);

  const startGhostToMessage = useCallback((tile: BoardTile, fromRect: WindowRect | null) => {
    if (!fromRect) {
      appendWord(tile);
      return;
    }

    const targetIndex = Math.min(
      state.messageWords.length + ghostsRef.current.length,
      MESSAGE_SLOT_COUNT - 1,
    );
    const targetRef = messageSlotRefs.current[targetIndex];

    if (!targetRef || !rootRef.current) {
      appendWord(tile);
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
  }, [addGhost, appendWord, state.messageWords.length, tileSize]);

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

  const handleSpeak = useCallback(() => {
    repeatMessage();
  }, [repeatMessage]);

  const handleBackspace = useCallback(() => {
    hapticIfEnabled();
    if (hasWords) {
      dispatch({ type: 'REMOVE_LAST_WORD' });
      return;
    }
    setActiveMode('home');
    setPreviousMode(null);
    setActiveTab('taptalk');
  }, [dispatch, hapticIfEnabled, hasWords]);

  // Item 10 — tap individual chips to remove them (principle 25 / 26).
  const handleRemoveWord = useCallback((index: number) => {
    hapticIfEnabled();
    const label = state.messageWords[index]?.label ?? 'word';
    dispatch({ type: 'REMOVE_WORD_AT_INDEX', payload: index });
    announce(`Removed ${label}`);
  }, [announce, dispatch, hapticIfEnabled, state.messageWords]);

  // Item 9 — long-press backspace to clear all with a confirmation
  // alert (principles 12 + 6: destructive actions need confirmation;
  // Alert.alert for focused tasks).
  const handleBackspaceLongPress = useCallback(() => {
    if (!hasWords) return;
    hapticIfEnabled();
    Alert.alert(
      'Clear message?',
      'All words will be removed.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => {
            if (state.accessibility.hapticsEnabled !== false) hapticError();
            clearMessage();
          },
        },
      ],
      { cancelable: true },
    );
  }, [clearMessage, hapticIfEnabled, hasWords, state.accessibility.hapticsEnabled]);

  const handleScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      scrollPositions.current[activeMode] = e.nativeEvent.contentOffset.y;
    },
    [activeMode],
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View ref={rootRef} style={styles.screenRoot}>
        {/* Item 8 — shake wrapper lets the banner animate on error
            while the inner Pressable stays the dismiss hit target. */}
        {lastError ? (
          <Reanimated.View style={bannerAnimStyle}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Dismiss speech error"
              onPress={clearError}
              style={styles.errorBanner}
            >
              <Text style={styles.errorText}>Speech unavailable: {lastError.message}</Text>
            </Pressable>
          </Reanimated.View>
        ) : null}

        <View style={styles.messageArea}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={hasWords ? `Speak ${messageText}` : 'Tap symbols to build a sentence'}
            onPress={handleSpeak}
            style={styles.messageButton}
          >
            {!hasWords && ghosts.length === 0 ? (
              <Text style={[styles.messageText, styles.messagePlaceholder]} numberOfLines={1}>
                Tap to speak....
              </Text>
            ) : null}
            <View
              style={[
                styles.messageSlotRow,
                !hasWords && ghosts.length === 0 && styles.messageSlotRowHidden,
              ]}
            >
              {Array.from({ length: MESSAGE_SLOT_COUNT }).map((_, index) => {
                const word = visibleMessageWords[index];
                return (
                  <View
                    key={index}
                    ref={ref => {
                      messageSlotRefs.current[index] = ref;
                    }}
                    style={styles.messageSlot}
                  >
                    {word ? (
                      <MessageChip
                        label={word.label}
                        tile={chipTileLookup.get(word.label.toLowerCase())}
                        onRemove={() => handleRemoveWord(index)}
                      />
                    ) : null}
                  </View>
                );
              })}
            </View>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={hasWords ? 'Backspace' : 'Return to home board'}
            accessibilityHint={hasWords ? 'Hold to clear all words' : undefined}
            onPress={handleBackspace}
            onLongPress={handleBackspaceLongPress}
            delayLongPress={500}
            style={styles.backspace}
          >
            {/* Slightly heavier — bigger glyph reads stronger against
                the white message strip without changing the tap target. */}
            <BackspaceIcon size={56} />
          </Pressable>
        </View>

        <TopNav
          visible={showTopNav}
          activeTab={activeTab}
          onTabPress={handleTopTab}
          onToggle={() => {
            hapticIfEnabled();
            setShowTopNav(value => !value);
          }}
        />

        <ScrollView
          ref={scrollRef}
          style={styles.board}
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
            <BoardTileButton
              key={tile.id}
              tile={tile}
              size={tileSize}
              onPress={rect => handleTilePress(tile, rect)}
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
              <BoardTileButton
                tile={BACK_TILE}
                size={tileSize}
                onPress={rect => handleTilePress(BACK_TILE, rect)}
              />
              <BoardTileButton
                tile={HOME_TILE}
                size={tileSize}
                onPress={rect => handleTilePress(HOME_TILE, rect)}
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
    backgroundColor: colors.surface,
  },
  screenRoot: {
    flex: 1,
  },
  errorBanner: {
    marginHorizontal: spacing.md,
    marginTop: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.danger,
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
    backgroundColor: colors.surface,
    borderBottomWidth: 1.4,
    borderBottomColor: colors.border,
  },
  messageButton: {
    flex: 1,
    height: 48,
    justifyContent: 'center',
    position: 'relative',
  },
  messageText: {
    color: '#202020',
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '700',
  },
  messagePlaceholder: {
    color: '#A5A5A5',
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
    color: '#202020',
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
    backgroundColor: colors.background,
    zIndex: 2,
  },
  topNavPanel: {
    marginHorizontal: 9.5,
    height: TOP_NAV_HEIGHT,
    borderLeftWidth: 1.6,
    borderRightWidth: 1.6,
    borderBottomWidth: 1.6,
    borderTopWidth: 0,
    borderColor: '#9A9A9A',
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingTop: 10,
    paddingBottom: 9,
    paddingHorizontal: 10,
  },
  topTab: {
    width: 72,
    height: 57,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Slight opacity dip on touch — Pressable feedback while the scale/colour
  // animation handles the active state.
  topTabPressed: {
    opacity: 0.85,
  },
  topTabContent: {
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
  // Coloured icon overlay sits exactly on top of the idle icon so the
  // active tint can fade in without re-rendering layout. absoluteFillObject
  // + flex-centering pins it to the SAME rect as the idle icon (previously
  // `top: 0` left a vertical offset that made the active icon look like it
  // was hovering above the idle one during the cross-fade).
  topTabIconOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topTabLabel: {
    marginTop: 4,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  navToggle: {
    position: 'absolute',
    left: '50%',
    marginLeft: -31,
    width: 62,
    height: 18,
    borderWidth: 2,
    borderColor: colors.primaryDark,
    backgroundColor: colors.softBlue,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 4,
    // All four corners rounded so the toggle reads as a clean chip
    // instead of a square with notched bottom corners.
    borderRadius: 10,
  },
  navToggleOpen: {
    // Slide 1pt down so the toggle's bottom edge tucks UNDER the panel's
    // top edge rather than sitting beside it. Drop the bottom border in
    // the same state so the toggle merges visually into the panel and
    // there's no doubled stroke where they meet.
    top: 1,
    borderBottomWidth: 0,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  navToggleClosed: {
    top: 1,
  },
  // Neutral idle look when closed and not being pressed — keeps the blue
  // strictly tied to pressed/active states without changing the open visuals.
  navToggleIdle: {
    borderColor: '#9A9A9A',
    backgroundColor: '#FFFFFF',
  },
  board: {
    flex: 1,
    backgroundColor: colors.background,
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
  tilePressed: {
    opacity: 0.82,
  },
  tileShell: {
    position: 'relative',
  },
  tileBackground: {
    position: 'absolute',
    left: 0,
    top: 0,
  },
  folderLabel: {
    position: 'absolute',
    left: 16,
    right: 16,
    top: 16,
    color: '#202020',
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
    color: '#202020',
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
    backgroundColor: '#E8EBED',
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
    color: '#4B555C',
    textAlign: 'center',
    paddingBottom: 6,
  },
});
