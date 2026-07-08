/**
 * Virtualized 4-column board grid.
 *
 * Replaces the ScrollView + manual layout in talk.tsx with a FlashList of
 * row-batched tiles. Row cells are memoized so re-renders only affect the
 * tile whose data actually changed — critical for users with 500+ custom
 * tiles who would otherwise drop frames on every message-strip append.
 *
 * Install: npx expo install @shopify/flash-list
 */
import React, { useMemo } from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import type { BoardTile } from '../types';
import { tileA11yProps } from '../tileA11y';
import { useMotor } from '../../accessibility/motor';

export type BoardGridProps = {
  tiles: BoardTile[];
  columns?: number;
  onTap: (tileId: string) => void;
  onPressIn?: (tileId: string) => void;
  onPressOut?: () => void;
  renderTile: (tile: BoardTile, size: number) => React.ReactNode;
};

export function BoardGrid({
  tiles,
  columns = 4,
  onTap,
  onPressIn,
  onPressOut,
  renderTile,
}: BoardGridProps) {
  const motor = useMotor();
  const rows = useMemo(() => chunk(tiles, columns), [tiles, columns]);

  return (
    <FlashList
      data={rows}
      keyExtractor={(_, i) => `row-${i}`}
      renderItem={({ item }) => (
        <View style={[styles.row, { gap: motor.tileGap, marginBottom: motor.tileGap }]}>
          {item.map((tile) => (
            <TileCell
              key={tile.id}
              tile={tile}
              size={motor.minTile}
              onTap={onTap}
              onPressIn={onPressIn}
              onPressOut={onPressOut}
              renderTile={renderTile}
            />
          ))}
        </View>
      )}
      drawDistance={(motor.minTile + motor.tileGap) * 4}
      contentContainerStyle={{ paddingHorizontal: motor.tileGap, paddingTop: motor.tileGap }}
    />
  );
}

type CellProps = {
  tile: BoardTile;
  size: number;
  onTap: (id: string) => void;
  onPressIn?: (id: string) => void;
  onPressOut?: () => void;
  renderTile: (tile: BoardTile, size: number) => React.ReactNode;
};

const TileCell = React.memo(
  ({ tile, size, onTap, onPressIn, onPressOut, renderTile }: CellProps) => (
    <Pressable
      onPress={() => onTap(tile.id)}
      onPressIn={onPressIn ? () => onPressIn(tile.id) : undefined}
      onPressOut={onPressOut}
      style={({ pressed }) => [{ width: size, height: size }, pressed && { opacity: 0.75 }]}
      hitSlop={4}
      {...tileA11yProps(tile)}
    >
      {renderTile(tile, size)}
    </Pressable>
  ),
  (a, b) =>
    a.tile.id === b.tile.id &&
    a.tile.label === b.tile.label &&
    a.tile.color === b.tile.color &&
    a.tile.mulberrySymbolId === b.tile.mulberrySymbolId &&
    a.tile.customImageUri === b.tile.customImageUri &&
    a.tile.wordType === b.tile.wordType &&
    a.size === b.size,
);

TileCell.displayName = 'TileCell';

function chunk<T>(arr: T[], n: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n));
  return out;
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row' },
});
