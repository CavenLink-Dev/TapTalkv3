// ─── TileRenderer — presentational board-tile leaves ─────────────────────────
// Extracted from app/(tabs)/talk.tsx (God-screen split, problem #1).
//
// Every component here is a PURE, PROPS-ONLY leaf — no context reads, no
// dispatches, no navigation, no AsyncStorage. That lets the board grid /
// ghost-fly layers re-render one tile at a time without dragging the whole
// screen with them, and lets us snapshot-test each tile in isolation.
//
// Exports:
//   • TileSymbol        — Mulberry pictogram mount (horizontal | vertical).
//   • BoardFolderTile   — folder tile chrome (tab + face + label + symbol).
//   • CustomTilePicture — user-photo tile picture (custom symbols).
//   • BoardWordTile     — flat-colour word tile with optional custom photo.
//   • GhostTileClone    — Reanimated arc-fly clone used by tile-tap animation.
//   • TILE_ASSETS / WORD_TYPE_COLOR / wordTypeColour / wordBackgroundForTile
//     — Fitzgerald colour helpers shared with the Add Symbol flow.
//
// Style rule: the styles below are duplicated from talk.tsx by intent so the
// new leaves are self-contained. Never import styles across screen boundaries.

import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Reanimated, {
  Easing as ReanimatedEasing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { MulberrySymbol } from '../../../components/symbols/MulberrySymbol';
import { AvatarView } from '../../profile/AvatarView';
import type { ResolvedSymbol } from '../../symbol-brain/resolveSymbolForKeyword';
import { useTheme } from '../../../theme/useTheme';
import { animation } from '../../../theme/tokens';
import { useReduceMotion } from '../../../hooks/useReduceMotion';
import type { BoardTile, GhostTile } from '../types';
import { TILE_CORNER_RADIUS, TILE_HEIGHT_RATIO } from '../constants';

// ── Fitzgerald colour + background asset helpers ─────────────────────────────

export const TILE_ASSETS = {
  loud:   require('../../../../assets/aac/board_tiles/symbol-loud.png'),
  straw:  require('../../../../assets/aac/board_tiles/symbol-straw.png'),
  green:  require('../../../../assets/aac/board_tiles/symbol-green.png'),
  red:    require('../../../../assets/aac/board_tiles/symbol-red.png'),
  yellow: require('../../../../assets/aac/board_tiles/symbol-yellow.png'),
  cyan:   require('../../../../assets/aac/board_tiles/symbol-cyan.png'),
  blue:   require('../../../../assets/aac/board_tiles/symbol-blue.png'),
  coral:  require('../../../../assets/aac/board_tiles/symbol-coral.png'),
  purple: require('../../../../assets/aac/board_tiles/symbol-purple.png'),
} as const;

export function wordBackgroundForTile(tile: BoardTile) {
  return TILE_ASSETS[(tile.background ?? 'cyan') as keyof typeof TILE_ASSETS];
}

const SYMBOL_RED    = '#FF3B30';
const SYMBOL_ORANGE = '#FF9F0A';
const SYMBOL_YELLOW = '#FFD60A';
const SYMBOL_GREEN  = '#34C759';
const SYMBOL_BLUE   = '#0A84FF';
const SYMBOL_PURPLE = '#BF5AF2';

/** Fitzgerald word-type → tile colour. Mirrors AddSymbolModal. */
export const WORD_TYPE_COLOR: Record<string, string> = {
  person:       SYMBOL_YELLOW,
  verb:         SYMBOL_GREEN,
  noun:         SYMBOL_ORANGE,
  emotion:      SYMBOL_RED,
  adjective:    SYMBOL_BLUE,
  social:       SYMBOL_PURPLE,
  interjection: SYMBOL_PURPLE,
  question:     SYMBOL_PURPLE,
  adverb:       SYMBOL_BLUE,
  number:       SYMBOL_ORANGE,
  letter:       SYMBOL_ORANGE,
};

export const wordTypeColour = (wt?: string): string =>
  (wt && WORD_TYPE_COLOR[wt]) || WORD_TYPE_COLOR.noun!;

// ── TileSymbol ────────────────────────────────────────────────────────────────

/**
 * Mulberry pictogram mount. Returns null when the tile has no symbol assigned
 * so tiles without curated art stay clean until one is picked.
 *
 * Two layout modes:
 *  • horizontal — for wide (landscape) tiles: symbol on the LEFT half.
 *  • vertical  — label at bottom, symbol fills the top ~70%.
 */
export function TileSymbol({
  tile, width, height, resolved, horizontal,
}: {
  tile: BoardTile;
  width: number;
  height: number;
  resolved?: ResolvedSymbol;
  horizontal?: boolean;
}) {
  const symbolId = tile.mulberrySymbolId ?? resolved?.symbol.id;
  const symbolName = tile.mulberryName;
  if (!symbolId && !symbolName) return null;

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
  // Symbol dominates the tile (Phase 3 — Symbol/Label hierarchy).
  const size = Math.round(Math.min(width * 0.90, height * 0.70));
  return (
    <View style={styles.symbolMount} pointerEvents="none">
      <MulberrySymbol symbolId={symbolId} name={symbolName} size={size} />
    </View>
  );
}

// ── BoardFolderTile ───────────────────────────────────────────────────────────

export function BoardFolderTile({
  tile, width, height, resolved,
}: {
  tile: BoardTile;
  width: number;
  height: number;
  resolved?: ResolvedSymbol;
}) {
  const t = useTheme();
  const edgeColor = t.colors.border;
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
          { width: tabWidth, height: tabHeight, backgroundColor: tile.color, borderColor: edgeColor },
        ]}
      />
      <View
        pointerEvents="none"
        style={[
          styles.folderFace,
          { top: faceTop, backgroundColor: tile.color, borderColor: edgeColor },
        ]}
      />
      <Text
        style={[
          styles.folderLabel,
          horizontal
            ? {
                left: Math.round(width * 0.44), right: 8, textAlign: 'left' as const,
                bottom: 0, top: 0,
                ...({ textAlignVertical: 'center' } as any),
              }
            : { color: t.colors.text },
          { color: t.colors.text },
        ]}
        numberOfLines={horizontal ? 2 : 1}
        adjustsFontSizeToFit
      >
        {tile.label}
      </Text>
      <TileSymbol
        tile={tile}
        width={width}
        height={height}
        resolved={resolved}
        horizontal={horizontal}
      />
    </View>
  );
}

// ── CustomTilePicture ─────────────────────────────────────────────────────────

export function CustomTilePicture({
  tile, width, height, horizontal,
}: {
  tile: BoardTile;
  width: number;
  height: number;
  horizontal: boolean;
}) {
  if (!tile.customImageUri) return null;
  const size = Math.round(
    horizontal
      ? Math.min(height * 0.58, width * 0.28)
      : Math.min(width, height) * 0.44,
  );
  const top = horizontal ? Math.round((height - size) / 2) : Math.round(height * 0.17);
  const left = horizontal ? Math.round(width * 0.09) : Math.round((width - size) / 2);
  const initial = tile.label.trim().charAt(0).toUpperCase() || '+';

  return (
    <View
      pointerEvents="none"
      style={[styles.customTilePicture, { width: size, height: size, top, left }]}
    >
      <AvatarView
        value={tile.customImageUri}
        size={size}
        initial={initial}
        borderRadius={TILE_CORNER_RADIUS}
      />
    </View>
  );
}

// ── BoardWordTile ─────────────────────────────────────────────────────────────

export function BoardWordTile({
  tile, width, height, resolved,
}: {
  tile: BoardTile;
  width: number;
  height: number;
  resolved?: ResolvedSymbol;
}) {
  const t = useTheme();
  const isFallback =
    resolved != null &&
    !tile.mulberrySymbolId &&
    !tile.mulberryName &&
    (resolved.tier === 'fuzzy' ||
      resolved.tier === 'semantic' ||
      resolved.tier === 'category' ||
      resolved.tier === 'unknown');
  const horizontal = width > height * 1.5;
  const fillColor = tile.color;
  const fillOpacity = tile.backgroundOpacity ?? 0.3;
  const outlineOpacity = tile.outlineOpacity ?? 0;

  return (
    <View style={[styles.wordTile, { width, height }]}>
      <View
        style={[
          styles.wordTileFill,
          { width, height, backgroundColor: fillColor, opacity: fillOpacity },
        ]}
      />
      {outlineOpacity > 0 ? (
        <View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFillObject,
            styles.wordTileCustomOutline,
            { borderColor: tile.outlineColor ?? t.colors.primary, opacity: outlineOpacity },
          ]}
        />
      ) : null}
      {isFallback ? (
        <View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFillObject,
            styles.wordTileFallbackBorder,
            { borderColor: t.isDark ? t.colors.textTertiary : '#8A8F95' },
          ]}
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
      {tile.customImageUri ? (
        <CustomTilePicture tile={tile} width={width} height={height} horizontal={horizontal} />
      ) : (
        <TileSymbol
          tile={tile}
          width={width}
          height={height}
          resolved={resolved}
          horizontal={horizontal}
        />
      )}
    </View>
  );
}

// ── GhostTileClone ────────────────────────────────────────────────────────────

/**
 * The tile-flying-into-the-message-strip animation clone. Reduce Motion fades
 * in-place at the source; full motion arcs to `to` and shrinks.
 */
export function GhostTileClone({
  ghost, onDone,
}: {
  ghost: GhostTile;
  onDone: (id: string) => void;
}) {
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

  const cloneHeight = Math.round(ghost.size * TILE_HEIGHT_RATIO);

  return (
    <Reanimated.View
      pointerEvents="none"
      style={[
        styles.ghostTile,
        {
          width: ghost.size,
          height: cloneHeight,
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

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  tileShell: {
    position: 'relative',
  },
  customTilePicture: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  folderTab: {
    position: 'absolute',
    left: 0,
    top: 0,
    borderTopLeftRadius: TILE_CORNER_RADIUS,
    borderTopRightRadius: TILE_CORNER_RADIUS,
    borderWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: 0,
  },
  folderFace: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: TILE_CORNER_RADIUS,
    borderWidth: StyleSheet.hairlineWidth,
  },
  folderLabel: {
    position: 'absolute',
    left: 6,
    right: 6,
    bottom: 4,
    fontSize: 14,
    lineHeight: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  symbolMount: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 4,
    bottom: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wordTile: {
    position: 'relative',
  },
  wordTileFallbackBorder: {
    borderRadius: TILE_CORNER_RADIUS,
    borderWidth: 1.5,
    borderStyle: 'dashed',
  },
  wordTileCustomOutline: {
    borderRadius: TILE_CORNER_RADIUS,
    borderWidth: 2,
  },
  wordTileFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    borderRadius: TILE_CORNER_RADIUS,
  },
  wordLabel: {
    position: 'absolute',
    left: 6,
    right: 6,
    bottom: 4,
    fontSize: 14,
    lineHeight: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  ghostTile: {
    position: 'absolute',
  },
});
