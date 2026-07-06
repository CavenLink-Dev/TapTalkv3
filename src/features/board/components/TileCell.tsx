/**
 * TileCell — a single AAC board tile.
 *
 * Extracted from app/(tabs)/talk.tsx (God-screen split). Deliberately small
 * and memoised: the board can render hundreds of these, so re-renders must be
 * cheap. The memo comparator only re-renders when a visually-significant field
 * changes.
 *
 * Responsibilities:
 *  • Render the Mulberry symbol / custom image + label.
 *  • Full VoiceOver labelling via tileA11y (Item 8).
 *  • Motor-aware minimum touch target (Item 5) + dwell/debounce handlers
 *    supplied by the parent's useTileTap (Item 6).
 */
import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { MulberrySymbol } from '../../../components/symbols/MulberrySymbol';
import { tileA11yProps } from '../tileA11y';
import { TILE_CORNER_RADIUS } from '../constants';
import type { BoardTile } from '../types';

export type TileCellProps = {
  tile: BoardTile;
  size: number;
  onPress: (tileId: string) => void;
  onPressIn?: (tileId: string) => void;
  onPressOut?: () => void;
  /** Learn mode shows a word-type badge (Item 18). */
  showBadge?: boolean;
  disabled?: boolean;
};

function TileCellBase({
  tile,
  size,
  onPress,
  onPressIn,
  onPressOut,
  showBadge,
  disabled,
}: TileCellProps) {
  const symbolSize = Math.round(size * 0.62);
  return (
    <Pressable
      {...tileA11yProps(tile)}
      disabled={disabled}
      onPress={() => onPress(tile.id)}
      onPressIn={() => onPressIn?.(tile.id)}
      onPressOut={() => onPressOut?.()}
      style={({ pressed }) => [
        styles.tile,
        {
          width: size,
          height: size,
          backgroundColor: tile.color,
          opacity: pressed ? 0.85 : 1,
        },
        tile.outlineColor
          ? { borderWidth: 2, borderColor: tile.outlineColor }
          : null,
      ]}
    >
      <View style={styles.symbolWrap} pointerEvents="none">
        {tile.customImageUri ? (
          <Image
            source={{ uri: tile.customImageUri }}
            style={{ width: symbolSize, height: symbolSize }}
            resizeMode="contain"
          />
        ) : (
          <MulberrySymbol
            symbolId={tile.mulberrySymbolId}
            name={tile.mulberryName}
            size={symbolSize}
          />
        )}
      </View>
      <Text numberOfLines={1} style={styles.label} pointerEvents="none">
        {tile.label}
      </Text>
      {showBadge && tile.wordType ? (
        <View style={styles.badge} pointerEvents="none">
          <Text style={styles.badgeText}>{tile.wordType}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

/**
 * Re-render only when a visually-significant field changes. Identity of
 * callbacks is intentionally NOT compared — parents should pass stable
 * (useCallback) handlers.
 */
export const TileCell = React.memo(
  TileCellBase,
  (a, b) =>
    a.tile.id === b.tile.id &&
    a.tile.label === b.tile.label &&
    a.tile.color === b.tile.color &&
    a.tile.mulberrySymbolId === b.tile.mulberrySymbolId &&
    a.tile.customImageUri === b.tile.customImageUri &&
    a.tile.outlineColor === b.tile.outlineColor &&
    a.size === b.size &&
    a.showBadge === b.showBadge &&
    a.disabled === b.disabled,
);

const styles = StyleSheet.create({
  tile: {
    borderRadius: TILE_CORNER_RADIUS,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 6,
  },
  symbolWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1c1c1e',
    textAlign: 'center',
  },
  badge: {
    position: 'absolute',
    top: 4,
    right: 4,
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: 'rgba(255,255,255,0.85)',
  },
  badgeText: { fontSize: 10, fontWeight: '700', color: '#3a3a3c' },
});
