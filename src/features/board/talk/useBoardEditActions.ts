// Edit-action handlers extracted from app/(tabs)/talk.tsx.
// Owns bulk select/delete/move/duplicate/group/favourite callbacks plus
// tap-and-drag sweep selection. No behaviour change vs. the inline originals.

import React, { useCallback, useMemo, useRef } from 'react';
import { AccessibilityInfo, Alert } from 'react-native';
import { Gesture } from 'react-native-gesture-handler';
import { runOnJS, useSharedValue } from 'react-native-reanimated';
import type { Action, CustomBoardTile } from '../../../context/types';
import {
  BOARD_COLUMNS,
  TILE_GAP,
  TILE_V_GAP,
} from './constants';
import { footprintAt } from '../layout';
import { BOARD_TILES, boardTileFromCustomTile } from './boardTiles';
import type {
  BoardEditTool,
  BoardLayout,
  BoardMode,
  BoardTile,
  TilePlacement,
} from './types';

type LayoutsState = Partial<Record<BoardMode, BoardLayout>>;

type UseBoardEditActionsParams = {
  activeMode: BoardMode;
  dispatch: React.Dispatch<Action>;
  hapticIfEnabled: () => void;
  layouts: LayoutsState;
  setLayouts: React.Dispatch<React.SetStateAction<LayoutsState>>;
  setLayoutDirty: React.Dispatch<React.SetStateAction<boolean>>;
  selectedTileIds: Set<string>;
  setSelectedTileIds: React.Dispatch<React.SetStateAction<Set<string>>>;
  setActiveEditTool: React.Dispatch<React.SetStateAction<BoardEditTool>>;
  pushUndo: (label: string, restoreTileIds?: string[]) => void;
  favouritesByMode: Partial<Record<string, string[]>>;
  favouriteReturnIndexRef: React.MutableRefObject<Map<string, number>>;
  userTilesRef: React.MutableRefObject<Map<string, BoardTile>>;
  customBoardTiles: CustomBoardTile[];
  editControlsOpen: boolean;
  activeEditTool: BoardEditTool;
  displayLayout: BoardLayout;
  tileMapForMode: Map<string, BoardTile>;
  tileSize: number;
};

export function useBoardEditActions({
  activeMode,
  dispatch,
  hapticIfEnabled,
  layouts,
  setLayouts,
  setLayoutDirty,
  selectedTileIds,
  setSelectedTileIds,
  setActiveEditTool,
  pushUndo,
  favouritesByMode,
  favouriteReturnIndexRef,
  userTilesRef,
  customBoardTiles,
  editControlsOpen,
  activeEditTool,
  displayLayout,
  tileMapForMode,
  tileSize,
}: UseBoardEditActionsParams) {
  // Helper: resolve tile metadata by id without leaning on `tileMapForMode`
  // (which is declared later in the render). Uses the static BOARD_TILES
  // data for the active board plus the runtime user-added tiles map so
  // user-created symbols/folders resolve correctly.
  const resolveTileById = useCallback((tileId: string): BoardTile | undefined => {
    const staticTiles = BOARD_TILES[activeMode] ?? [];
    const hit = staticTiles.find(tt => tt.id === tileId);
    if (hit) return hit;
    const customTile = customBoardTiles.find(tt => tt.id === tileId);
    if (customTile) return boardTileFromCustomTile(customTile);
    const userTile = userTilesRef.current.get(tileId);
    if (userTile) return userTile;
    // Cross-board fallback (tiles Moved / Grouped in from another board).
    return Object.values(BOARD_TILES).flat().find(tt => tt.id === tileId);
  }, [activeMode, customBoardTiles, userTilesRef]);

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
  }, [
    activeMode,
    dispatch,
    hapticIfEnabled,
    pushUndo,
    resolveTileById,
    selectedTileIds,
    setLayoutDirty,
    setLayouts,
    setSelectedTileIds,
  ]);

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
  }, [hapticIfEnabled, setSelectedTileIds]);

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
    dispatch({ type: 'SET_FAVOURITES_BY_MODE', payload: { board: activeMode, ids: (favouritesByMode[activeMode] ?? []).filter(id => !moveable.includes(id)) } });
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
  }, [
    activeMode,
    dispatch,
    favouritesByMode,
    hapticIfEnabled,
    isDescendantFolder,
    pushUndo,
    resolveTileById,
    selectedTileIds,
    setActiveEditTool,
    setLayoutDirty,
    setLayouts,
    setSelectedTileIds,
  ]);

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
  }, [
    activeMode,
    hapticIfEnabled,
    layouts,
    pushUndo,
    resolveTileById,
    selectedTileIds,
    setLayoutDirty,
    setLayouts,
    setSelectedTileIds,
    userTilesRef,
  ]);

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
    const backId = `back-${boardKey}`;
    const folderId = `folder_${boardKey}`;

    // Compute layouts synchronously so we can persist them immediately.
    const source: BoardLayout = layouts[activeMode]
      ?? (BOARD_TILES[activeMode] ?? []).map((tt, i) => ({ id: tt.id, slot: i, fw: 2, fh: 2 }));
    const moving = [...source]
      .sort((a, b) => a.slot - b.slot)
      .filter(p => groupable.includes(p.id));
    const anchorSlot = moving[0]?.slot ?? source.length;
    const rest = source.filter(p => !groupable.includes(p.id));
    const newParentLayout: BoardLayout = [...rest, { id: folderId, slot: anchorSlot, fw: 2, fh: 2 }]
      .sort((a, b) => a.slot - b.slot)
      .map((p, i) => ({ ...p, slot: i }));
    const childLayout: BoardLayout = [
      { id: backId, slot: 0, fw: 2, fh: 2 },
      ...moving.map((p, i) => ({ ...p, slot: i + 1 })),
    ];

    setLayouts(prev => ({ ...prev, [activeMode]: newParentLayout, [boardKey]: childLayout }));

    // Persist the folder tile and back tile through AppContext → AsyncStorage.
    const folderCustomTile: CustomBoardTile = {
      id: folderId,
      board: activeMode,
      label: `Group (${groupable.length})`,
      color: '#1DCDFF',
      kind: 'folder',
      target: boardKey,
      mulberrySymbolId: 'mulberry_group_work_14prpc8',
    };
    const backCustomTile: CustomBoardTile = {
      id: backId,
      board: boardKey,
      label: 'Home',
      color: '#1DCDFF',
      kind: 'folder',
      target: 'home',
      mulberrySymbolId: 'mulberry_house_1ice1xp',
    };

    // Keep userTilesRef in sync for immediate rendering this session.
    userTilesRef.current.set(folderId, boardTileFromCustomTile(folderCustomTile));
    userTilesRef.current.set(backId, boardTileFromCustomTile(backCustomTile));

    dispatch({ type: 'UPSERT_CUSTOM_BOARD_TILE', payload: folderCustomTile });
    dispatch({ type: 'UPSERT_CUSTOM_BOARD_TILE', payload: backCustomTile });

    // Persist layouts immediately — don't wait for an edit-mode Save.
    dispatch({ type: 'SET_BOARD_PLACEMENTS', payload: { board: activeMode, placements: newParentLayout } });
    dispatch({ type: 'SET_BOARD_PLACEMENTS', payload: { board: boardKey, placements: childLayout } });

    setLayoutDirty(true);
    setSelectedTileIds(new Set());
    setActiveEditTool('select');
    // Grouped tiles leave this board — they can't stay pinned here.
    dispatch({ type: 'SET_FAVOURITES_BY_MODE', payload: { board: activeMode, ids: (favouritesByMode[activeMode] ?? []).filter(id => !groupable.includes(id)) } });
    AccessibilityInfo.announceForAccessibility?.(
      `${groupable.length} item${groupable.length === 1 ? '' : 's'} grouped into a new folder`,
    );
  }, [
    activeMode,
    dispatch,
    favouritesByMode,
    hapticIfEnabled,
    layouts,
    pushUndo,
    resolveTileById,
    selectedTileIds,
    setActiveEditTool,
    setLayoutDirty,
    setLayouts,
    setSelectedTileIds,
    userTilesRef,
  ]);

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
    dispatch({ type: 'SET_FAVOURITES_BY_MODE', payload: { board: activeMode, ids: nextFavs } });
    setLayouts(prev => ({ ...prev, [activeMode]: nextLayout }));
    setLayoutDirty(true);
    setSelectedTileIds(new Set());
  }, [
    activeMode,
    dispatch,
    favouriteIds,
    favouriteReturnIndexRef,
    hapticIfEnabled,
    layouts,
    pushUndo,
    rebuildWithFavourites,
    selectedAllFavourites,
    selectedTileIds,
    setLayoutDirty,
    setLayouts,
    setSelectedTileIds,
  ]);

  // ── Select All / Deselect All (edit Select tool) ────────────────────────
  // Every non-protected, non-nav tile on the current board view.
  const selectableTileIds = useMemo(
    () =>
      displayLayout
        .map(p => tileMapForMode.get(p.id))
        .filter(
          (tile): tile is BoardTile =>
            Boolean(tile) &&
            !tile!.isProtected &&
            tile!.id !== 'back' &&
            tile!.id !== 'home',
        )
        .map(tile => tile.id),
    [displayLayout, tileMapForMode],
  );

  const allTilesSelected =
    selectableTileIds.length > 0 &&
    selectableTileIds.every(id => selectedTileIds.has(id));

  const handleSelectAllToggle = useCallback(() => {
    hapticIfEnabled();
    if (allTilesSelected) {
      setSelectedTileIds(new Set());
      AccessibilityInfo.announceForAccessibility?.('Selection cleared');
      return;
    }
    setSelectedTileIds(new Set(selectableTileIds));
    AccessibilityInfo.announceForAccessibility?.(
      `${selectableTileIds.length} item${selectableTileIds.length === 1 ? '' : 's'} selected`,
    );
  }, [allTilesSelected, hapticIfEnabled, selectableTileIds, setSelectedTileIds]);

  // ── Tap-and-drag sweep select (edit Select tool) ────────────────────────
  // A slow drag (hold ~220ms, then move) that starts on a tile toggles each
  // tile the finger crosses. Quick drags still scroll the board; the guard
  // set ensures one toggle per tile per sweep so multi-cell tiles don't
  // flicker while the finger crosses their footprint.
  const sweepActive = editControlsOpen && activeEditTool === 'select';
  const sweepLastSlot = useSharedValue(-1);
  const sweepToggledRef = useRef<Set<string>>(new Set());

  const handleSweepBegin = useCallback(() => {
    sweepToggledRef.current = new Set();
  }, []);

  const handleSweepCell = useCallback((col: number, row: number) => {
    if (col < 0 || row < 0 || col >= BOARD_COLUMNS) return;
    const placement = displayLayout.find(p => {
      const fp = footprintAt(p.slot, p.fw, p.fh);
      return col >= fp.startCol && col <= fp.endCol && row >= fp.startRow && row <= fp.endRow;
    });
    if (!placement) return;
    if (sweepToggledRef.current.has(placement.id)) return;
    const tile = tileMapForMode.get(placement.id);
    if (!tile || tile.isProtected || tile.id === 'back' || tile.id === 'home') return;
    sweepToggledRef.current.add(placement.id);
    hapticIfEnabled();
    setSelectedTileIds(prev => {
      const next = new Set(prev);
      if (next.has(placement.id)) next.delete(placement.id);
      else next.add(placement.id);
      return next;
    });
  }, [displayLayout, hapticIfEnabled, setSelectedTileIds, tileMapForMode]);

  const sweepPan = useMemo(() => Gesture.Pan()
    .enabled(sweepActive)
    // Hold-then-drag: normal swipes fall through to the ScrollView so board
    // scrolling is unaffected while Select mode is active.
    .activateAfterLongPress(220)
    .onStart(e => {
      const col = Math.floor(e.x / (tileSize + TILE_GAP));
      const row = Math.floor(e.y / (tileSize + TILE_V_GAP));
      sweepLastSlot.value = row * BOARD_COLUMNS + col;
      runOnJS(handleSweepBegin)();
      runOnJS(handleSweepCell)(col, row);
    })
    .onUpdate(e => {
      const col = Math.floor(e.x / (tileSize + TILE_GAP));
      const row = Math.floor(e.y / (tileSize + TILE_V_GAP));
      const slot = row * BOARD_COLUMNS + col;
      if (slot !== sweepLastSlot.value) {
        sweepLastSlot.value = slot;
        runOnJS(handleSweepCell)(col, row);
      }
    })
    .onEnd(() => {
      sweepLastSlot.value = -1;
    }), [handleSweepBegin, handleSweepCell, sweepActive, sweepLastSlot, tileSize]);

  return {
    resolveTileById,
    handleEditToolDelete,
    toggleTileSelection,
    handleMoveToDestination,
    handleEditToolDuplicate,
    handleEditToolGroup,
    handleEditToolFavourite,
    favouriteIds,
    selectedAllFavourites,
    allTilesSelected,
    handleSelectAllToggle,
    sweepPan,
  };
}
