/**
 * BoardGrid — virtualized AAC tile grid.
 *
 * Extracted from app/(tabs)/talk.tsx (God-screen split, Item 4). Replaces the
 * old ScrollView + 500-Pressable-per-render approach with a FlashList that
 * only mounts on-screen rows. Tiles are chunked into fixed rows of
 * BOARD_COLUMNS so each list item is one memoised row.
 *
 * Motor accessibility (Items 5/6): a single useTileTap instance owns the
 * dwell/debounce logic and its handlers are threaded to every TileCell.
 */
import React, { useMemo } from 'react';
import { View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { TileCell } from './TileCell';
import { useTileTap } from '../useTileTap';
import { BOARD_COLUMNS, TILE_GAP, TILE_V_GAP } from '../constants';
import type { BoardTile } from '../types';

export type BoardGridProps = {
  tiles: BoardTile[];
  tileSize: number;
  onTap: (tileId: string) => void;
  showBadges?: boolean;
  disabled?: boolean;
};

/** Split a flat tile list into rows of `columns`. */
export function chunkRows(tiles: BoardTile[], columns: number): BoardTile[][] {
  const rows: BoardTile[][] = [];
  for (let i = 0; i < tiles.length; i += columns) {
    rows.push(tiles.slice(i, i + columns));
  }
  return rows;
}

export function BoardGrid({
  tiles,
  tileSize,
  onTap,
  showBadges,
  disabled,
}: BoardGridProps) {
  const { onPress, onPressIn, onPressOut } = useTileTap(onTap);
  const rows = useMemo(() => chunkRows(tiles, BOARD_COLUMNS), [tiles]);

  return (
    <FlashList
      data={rows}
      estimatedItemSize={tileSize + TILE_V_GAP}
      keyExtractor={(_row, i) => `row-${i}`}
      drawDistance={tileSize * 4}
      showsVerticalScrollIndicator={false}
      renderItem={({ item }) => (
        <View style={{ flexDirection: 'row', gap: TILE_GAP, marginBottom: TILE_V_GAP }}>
          {item.map((tile) => (
            <TileCell
              key={tile.id}
              tile={tile}
              size={tileSize}
              onPress={onPress}
              onPressIn={onPressIn}
              onPressOut={onPressOut}
              showBadge={showBadges}
              disabled={disabled}
            />
          ))}
        </View>
      )}
    />
  );
}
