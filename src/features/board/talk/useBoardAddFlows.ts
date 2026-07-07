// Add-flow handlers extracted from app/(tabs)/talk.tsx.
// Owns the six Add / Custom / Folder / Symbol-Pack callbacks that
// mutate the current board's layout and persist through AppContext.
//
// No behaviour change vs. the inline originals.

import React, { useCallback } from 'react';
import { AccessibilityInfo } from 'react-native';
import type { Action, CustomBoardTile } from '../../../context/types';
import type { CustomSymbolEditorResult } from '../../../components/talk/CustomSymbolEditor';
import type { SymbolPackFolder, SymbolPackNode } from '../../../data/symbolPacks';
import { parseAvatar } from '../../profile/avatar';
import { wordTypeColour } from '../components/TileRenderer';
import { BOARD_TILES, boardTileFromCustomTile, labelForBoardTile } from './boardTiles';
import type { BoardLayout, BoardMode, BoardTile } from './types';

type LayoutsState = Partial<Record<BoardMode, BoardLayout>>;

type UseBoardAddFlowsParams = {
  activeMode: BoardMode;
  dispatch: React.Dispatch<Action>;
  layouts: LayoutsState;
  setLayouts: React.Dispatch<React.SetStateAction<LayoutsState>>;
  setLayoutDirty: React.Dispatch<React.SetStateAction<boolean>>;
  userTilesRef: React.MutableRefObject<Map<string, BoardTile>>;
  hapticIfEnabled: () => void;
  setAddSymbolModalVisible: React.Dispatch<React.SetStateAction<boolean>>;
  setAddFolderModalVisible: React.Dispatch<React.SetStateAction<boolean>>;
  setCustomSymbolEditorVisible: React.Dispatch<React.SetStateAction<boolean>>;
  quickManageOpen: boolean;
  setQuickTaggedIds: React.Dispatch<React.SetStateAction<Set<string>>>;
  setManageSelectedIds: React.Dispatch<React.SetStateAction<Set<string>>>;
  setManageCreatedTag: React.Dispatch<React.SetStateAction<boolean>>;
  boardPlacements: Record<string, { id: string; slot: number; fw: number; fh: number }[]>;
  customBoardTiles: CustomBoardTile[];
};

export function useBoardAddFlows({
  activeMode,
  dispatch,
  layouts,
  setLayouts,
  setLayoutDirty,
  userTilesRef,
  hapticIfEnabled,
  setAddSymbolModalVisible,
  setAddFolderModalVisible,
  setCustomSymbolEditorVisible,
  quickManageOpen,
  setQuickTaggedIds,
  setManageSelectedIds,
  setManageCreatedTag,
  boardPlacements,
  customBoardTiles,
}: UseBoardAddFlowsParams) {
  const addTileToCurrentBoard = useCallback((tile: BoardTile, persistedTile?: CustomBoardTile) => {
    const current: BoardLayout = layouts[activeMode]
      ?? (BOARD_TILES[activeMode] ?? []).map((tt, i) => ({ id: tt.id, slot: i, fw: 2, fh: 2 }));
    const maxSlot = current.reduce((max, p) => Math.max(max, p.slot + 1), 0);
    const nextLayout = [...current, { id: tile.id, slot: maxSlot, fw: 2, fh: 2 }];
    userTilesRef.current.set(tile.id, tile);
    setLayouts(prev => ({ ...prev, [activeMode]: nextLayout }));
    dispatch({
      type: 'SET_BOARD_PLACEMENTS',
      payload: {
        board: activeMode,
        placements: nextLayout.map(p => ({ id: p.id, slot: p.slot, fw: p.fw, fh: p.fh })),
      },
    });
    if (persistedTile) {
      dispatch({ type: 'UPSERT_CUSTOM_BOARD_TILE', payload: persistedTile });
    }
    setLayoutDirty(true);
  }, [activeMode, dispatch, layouts, setLayoutDirty, setLayouts, userTilesRef]);

  // ── Add Symbol confirm: insert tile at first free slot ──────────────
  const handleAddSymbolConfirm = useCallback((result: { symbolId: string; label: string; color: string; wordType: string }) => {
    setAddSymbolModalVisible(false);
    const label = result.label.trim().replace(/\s+/g, ' ');
    const tileLabel = labelForBoardTile(label);
    const tileId = `user_${tileLabel.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}`;
    const persistedTile: CustomBoardTile = {
      id: tileId,
      board: activeMode,
      label: tileLabel,
      speech: label || tileLabel,
      color: result.color,
      wordType: result.wordType,
      mulberrySymbolId: result.symbolId,
      backgroundOpacity: 0.3,
      outlineOpacity: 0,
    };
    const newTile = boardTileFromCustomTile(persistedTile);
    addTileToCurrentBoard(newTile, persistedTile);
    // Created from the Quick Manage bar → Quick-tagged from birth, and
    // Done becomes visible (a pending change now exists). Also selected in
    // the Manage view so it isn't marked for removal on Done.
    if (quickManageOpen) {
      setQuickTaggedIds(prev => new Set(prev).add(tileId));
      setManageSelectedIds(prev => new Set(prev).add(tileId));
      setManageCreatedTag(true);
      AccessibilityInfo.announceForAccessibility?.(`${tileLabel} added and pinned to Quick`);
    }
    hapticIfEnabled();
  }, [
    activeMode,
    addTileToCurrentBoard,
    hapticIfEnabled,
    quickManageOpen,
    setAddSymbolModalVisible,
    setManageCreatedTag,
    setManageSelectedIds,
    setQuickTaggedIds,
  ]);

  const handleOpenCustomSymbolEditor = useCallback(() => {
    hapticIfEnabled();
    setAddSymbolModalVisible(false);
    setCustomSymbolEditorVisible(true);
  }, [hapticIfEnabled, setAddSymbolModalVisible, setCustomSymbolEditorVisible]);

  const handleCustomSymbolDone = useCallback((result: CustomSymbolEditorResult) => {
    setCustomSymbolEditorVisible(false);
    setAddSymbolModalVisible(false);
    const fullLabel = result.label.trim().replace(/\s+/g, ' ');
    const tileLabel = labelForBoardTile(fullLabel);
    const speech = result.speech.trim().replace(/\s+/g, ' ') || fullLabel || tileLabel;
    const tileId = `custom_${tileLabel.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}`;
    const avatar = parseAvatar(result.picture);
    const persistedTile: CustomBoardTile = {
      id: tileId,
      board: activeMode,
      label: tileLabel,
      speech,
      color: result.backgroundColor,
      wordType: 'custom',
      mulberrySymbolId: avatar.kind === 'symbol' ? avatar.symbolId : undefined,
      customImageUri: result.picture ?? undefined,
      backgroundOpacity: result.backgroundOpacity,
      outlineColor: result.outlineColor,
      outlineOpacity: result.outlineOpacity,
    };
    const newTile = boardTileFromCustomTile(persistedTile);
    addTileToCurrentBoard(newTile, persistedTile);
    if (quickManageOpen) {
      setQuickTaggedIds(prev => new Set(prev).add(tileId));
      setManageSelectedIds(prev => new Set(prev).add(tileId));
      setManageCreatedTag(true);
      AccessibilityInfo.announceForAccessibility?.(`${tileLabel} added and pinned to Quick`);
    } else {
      AccessibilityInfo.announceForAccessibility?.(`${tileLabel} added`);
    }
    hapticIfEnabled();
  }, [
    activeMode,
    addTileToCurrentBoard,
    hapticIfEnabled,
    quickManageOpen,
    setAddSymbolModalVisible,
    setCustomSymbolEditorVisible,
    setManageCreatedTag,
    setManageSelectedIds,
    setQuickTaggedIds,
  ]);

  // ── Add Folder confirm: insert folder tile ──────────────────────────
  const handleAddFolderConfirm = useCallback((result: {
    label: string;
    boardKey: string;
    color: string;
    mulberrySymbolId?: string;
    customImageUri?: string;
    parentBoardKey?: string;
  }) => {
    setAddFolderModalVisible(false);
    const tileId = `folder_${result.boardKey}`;
    const backId = `back-${result.boardKey}`;
    const parentBoard = (result.parentBoardKey ?? activeMode) as BoardMode;

    // Compute the updated parent layout synchronously so we can persist it now
    // without waiting for the user to open edit mode and hit Save.
    const parentBase: BoardLayout = layouts[parentBoard]
      ?? (BOARD_TILES[parentBoard] ?? []).map((tt, i) => ({ id: tt.id, slot: i, fw: 2, fh: 2 }));
    const maxParentSlot = parentBase.reduce((max, p) => Math.max(max, p.slot + 1), 0);
    const newParentLayout: BoardLayout = [...parentBase, { id: tileId, slot: maxParentSlot, fw: 2, fh: 2 }];

    // Initial child board layout — just the back-navigation tile.
    const childLayout: BoardLayout = [{ id: backId, slot: 0, fw: 2, fh: 2 }];

    setLayouts(prev => ({
      ...prev,
      [parentBoard]: newParentLayout,
      [result.boardKey]: childLayout,
    }));

    // Folder tile on the parent board.
    const folderCustomTile: CustomBoardTile = {
      id: tileId,
      board: parentBoard,
      label: result.label,
      color: result.color,
      kind: 'folder',
      target: result.boardKey,
      mulberrySymbolId: result.mulberrySymbolId,
      customImageUri: result.customImageUri,
    };
    // Back-navigation tile on the child board.
    const backCustomTile: CustomBoardTile = {
      id: backId,
      board: result.boardKey,
      label: 'Home',
      color: '#1DCDFF',
      kind: 'folder',
      target: 'home',
      mulberrySymbolId: 'mulberry_house_1ice1xp',
    };

    // Keep userTilesRef in sync for immediate rendering this session.
    userTilesRef.current.set(tileId, boardTileFromCustomTile(folderCustomTile));
    userTilesRef.current.set(backId, boardTileFromCustomTile(backCustomTile));

    // Persist folder definitions through AppContext → AsyncStorage.
    dispatch({ type: 'UPSERT_CUSTOM_BOARD_TILE', payload: folderCustomTile });
    dispatch({ type: 'UPSERT_CUSTOM_BOARD_TILE', payload: backCustomTile });

    // Persist layouts immediately — don't wait for an edit-mode Save.
    dispatch({
      type: 'SET_BOARD_PLACEMENTS',
      payload: { board: parentBoard, placements: newParentLayout },
    });
    dispatch({
      type: 'SET_BOARD_PLACEMENTS',
      payload: { board: result.boardKey, placements: childLayout },
    });

    setLayoutDirty(true);
    hapticIfEnabled();
  }, [
    activeMode,
    dispatch,
    hapticIfEnabled,
    layouts,
    setAddFolderModalVisible,
    setLayoutDirty,
    setLayouts,
    userTilesRef,
  ]);

  // ── Bulk Symbol Pack import (Phase 1 — Symbol Pack Bulk Add Pipeline) ──
  // Recursively materialises a curated SymbolPackFolder into real boards,
  // folder tiles, back tiles, and symbol tiles. Preserves the nested
  // structure, assigns Fitzgerald word-type colours, and guarantees
  // collision-free board & tile IDs even against existing user tiles.
  // Single-symbol flow (handleAddSymbolConfirm) is unaffected.
  const handleAddSymbolPack = useCallback((root: SymbolPackFolder) => {
    hapticIfEnabled();

    // Union of every key that could collide with a freshly minted board or
    // tile ID — static board modes, current boardPlacements keys, and every
    // existing custom board tile ID.
    const usedKeys = new Set<string>([
      ...Object.keys(BOARD_TILES),
      ...Object.keys(boardPlacements),
      ...Object.keys(layouts),
      ...customBoardTiles.map(t => t.id),
    ]);

    let seq = 0;
    const stamp = Date.now();
    const sanitize = (s: string) =>
      s.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 40) || 'pack';
    const mint = (prefix: string, hint: string) => {
      let key = `${prefix}_${sanitize(hint)}_${stamp}_${seq++}`;
      while (usedKeys.has(key)) key = `${prefix}_${sanitize(hint)}_${stamp}_${seq++}`;
      usedKeys.add(key);
      return key;
    };

    const tilesToUpsert: CustomBoardTile[] = [];
    const layoutBatch: Record<string, BoardLayout> = {};
    let folderCount = 0;
    let symbolCount = 0;

    // Walks a pack folder → returns the parent-side folder-tile shape and
    // the child board key it navigates into. All tiles/layouts for the
    // subtree are pushed into the outer batches.
    const buildFolder = (
      folder: SymbolPackFolder,
      parentBoardKey: string,
    ): { folderTile: CustomBoardTile } => {
      const childBoardKey = mint('pack', folder.id);
      const folderTileId  = mint('packfolder', folder.id);
      const backId        = mint('back', childBoardKey);
      folderCount += 1;

      const folderTile: CustomBoardTile = {
        id: folderTileId,
        board: parentBoardKey,
        label: folder.label,
        color: '#1DCDFF',
        kind: 'folder',
        target: childBoardKey,
        mulberrySymbolId: folder.iconId,
      };
      const backTile: CustomBoardTile = {
        id: backId,
        board: childBoardKey,
        label: 'Home',
        color: '#1DCDFF',
        kind: 'folder',
        target: 'home',
        mulberrySymbolId: 'mulberry_house_1ice1xp',
      };
      tilesToUpsert.push(folderTile, backTile);

      const placements: BoardLayout = [{ id: backId, slot: 0, fw: 2, fh: 2 }];
      let slot = 1;

      for (const child of folder.children as SymbolPackNode[]) {
        if (child.type === 'folder') {
          const built = buildFolder(child, childBoardKey);
          placements.push({ id: built.folderTile.id, slot: slot++, fw: 2, fh: 2 });
        } else {
          const symId = mint('packsym', child.label);
          const label = labelForBoardTile(child.label);
          const wt = child.wordType ?? 'noun';
          const symTile: CustomBoardTile = {
            id: symId,
            board: childBoardKey,
            label,
            speech: child.speech ?? child.label,
            color: wordTypeColour(wt),
            wordType: wt,
            mulberrySymbolId: child.symbolId,
            backgroundOpacity: 0.3,
            outlineOpacity: 0,
          };
          tilesToUpsert.push(symTile);
          placements.push({ id: symId, slot: slot++, fw: 2, fh: 2 });
          symbolCount += 1;
        }
      }
      layoutBatch[childBoardKey] = placements;
      return { folderTile };
    };

    // Place the root pack folder onto the currently viewed board.
    const parentBoard = activeMode;
    const parentBase: BoardLayout = layouts[parentBoard]
      ?? (BOARD_TILES[parentBoard] ?? []).map((tt, i) => ({ id: tt.id, slot: i, fw: 2, fh: 2 }));
    const maxParentSlot = parentBase.reduce((max, p) => Math.max(max, p.slot + 1), 0);
    const built = buildFolder(root, parentBoard);
    const newParentLayout: BoardLayout = [
      ...parentBase,
      { id: built.folderTile.id, slot: maxParentSlot, fw: 2, fh: 2 },
    ];
    layoutBatch[parentBoard] = newParentLayout;

    // Local render state — commit all boards in one setState so we don't
    // paint intermediate half-built boards.
    setLayouts(prev => ({ ...prev, ...layoutBatch }));
    tilesToUpsert.forEach(t => userTilesRef.current.set(t.id, boardTileFromCustomTile(t)));

    // Persist through AppContext → AsyncStorage. Batch order: tiles first
    // (definitions), then layouts (references), so a reload never sees a
    // placement pointing at an undefined tile.
    tilesToUpsert.forEach(t => dispatch({ type: 'UPSERT_CUSTOM_BOARD_TILE', payload: t }));
    Object.entries(layoutBatch).forEach(([board, placements]) => {
      dispatch({ type: 'SET_BOARD_PLACEMENTS', payload: { board, placements } });
    });

    setLayoutDirty(true);
    AccessibilityInfo.announceForAccessibility?.(
      `Imported ${root.label}: ${folderCount} folder${folderCount === 1 ? '' : 's'} and ${symbolCount} symbol${symbolCount === 1 ? '' : 's'} added`,
    );
  }, [
    activeMode,
    boardPlacements,
    customBoardTiles,
    dispatch,
    hapticIfEnabled,
    layouts,
    setLayoutDirty,
    setLayouts,
    userTilesRef,
  ]);

  return {
    addTileToCurrentBoard,
    handleAddSymbolConfirm,
    handleOpenCustomSymbolEditor,
    handleCustomSymbolDone,
    handleAddFolderConfirm,
    handleAddSymbolPack,
  };
}
