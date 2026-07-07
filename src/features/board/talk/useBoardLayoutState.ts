import { useEffect, useRef, useState } from 'react';
import type { AppState } from '../../../context/types';
import { coarseCols, reflowLayoutSlots } from '../layout';
import { BOARD_TILES } from './boardTiles';
import type { BoardLayout, BoardMode } from './types';

export function useBoardLayoutState({
  boardPlacements,
}: {
  boardPlacements: AppState['boardPlacements'];
}) {
  // Sparse slot map: { slotIndex -> tileId } per board mode.
  // Supports moving tiles to any grid slot and variable-size placements.
  const [layouts, setLayouts] = useState<Partial<Record<BoardMode, BoardLayout>>>({});
  const [boardAreaHeight, setBoardAreaHeight] = useState(0);
  const [layoutDirty, setLayoutDirty] = useState(false);
  const [selectedLayoutTileId, setSelectedLayoutTileId] = useState<string | null>(null);
  const layoutSnapshotRef = useRef<BoardLayout | null>(null);

  // ── Hydrate local layouts from persisted boardPlacements on mount ─────────
  // Seeds the in-memory layouts state with any previously saved variable-size
  // placements so custom arrangements survive relaunch. Tiles added in future
  // code releases that aren't in stored placements get appended with default
  // fw=fh=2 at the next free slot.
  useEffect(() => {
    const persisted = boardPlacements;
    if (!persisted || Object.keys(persisted).length === 0) return;
    const seeded: Partial<Record<BoardMode, BoardLayout>> = {};
    for (const rawKey of Object.keys(persisted)) {
      // Migration: the Places board was internally (incorrectly) keyed
      // animals in earlier builds. Re-home stored placements to places.
      const key = (rawKey === 'animals' ? 'places' : rawKey) as BoardMode;
      const stored = persisted[rawKey];
      if (!stored || stored.length === 0) continue;
      const boardTiles = BOARD_TILES[key];
      // Custom boards (folders/groups created at runtime) have no entry in the
      // static BOARD_TILES constant — restore their layout directly from the
      // stored placements without trying to append new static tiles.
      if (!boardTiles) {
        seeded[key] = reflowLayoutSlots(
          stored.map(p => ({ id: p.id, slot: p.slot, fw: p.fw, fh: p.fh })),
        );
        continue;
      }
      // Start from stored placements (id migration: back-animals -> back-places)
      const layout: BoardLayout = reflowLayoutSlots(
        stored.map(p => ({
          id: p.id === 'back-animals' ? 'back-places' : p.id,
          slot: p.slot, fw: p.fw, fh: p.fh,
        })),
      );
      // Append any new tiles from code that aren't in stored placements.
      const storedIds = new Set(layout.map(p => p.id));
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

  return {
    layouts,
    setLayouts,
    boardAreaHeight,
    setBoardAreaHeight,
    layoutDirty,
    setLayoutDirty,
    selectedLayoutTileId,
    setSelectedLayoutTileId,
    layoutSnapshotRef,
  };
}
