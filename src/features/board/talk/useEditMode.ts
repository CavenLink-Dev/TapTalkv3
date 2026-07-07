import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Alert } from 'react-native';
import {
  cancelAnimation,
  SharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import type { Action } from '../../../context/types';
import { BOARD_TILES } from './boardTiles';
import type {
  BoardEditTool,
  BoardLayout,
  BoardMode,
  BoardUndoEntry,
  TilePlacement,
} from './types';

type LayoutsState = Partial<Record<BoardMode, BoardLayout>>;

type UseEditModeParams = {
  activeMode: BoardMode;
  dispatch: React.Dispatch<Action>;
  hapticIfEnabled: () => void;
  layouts: LayoutsState;
  setLayouts: React.Dispatch<React.SetStateAction<LayoutsState>>;
  layoutDirty: boolean;
  setLayoutDirty: React.Dispatch<React.SetStateAction<boolean>>;
  layoutSnapshotRef: React.MutableRefObject<BoardLayout | null>;
  setSelectedLayoutTileId: React.Dispatch<React.SetStateAction<string | null>>;
  setAddFlowExpanded: React.Dispatch<React.SetStateAction<boolean>>;
  setHomeDockExpanded: React.Dispatch<React.SetStateAction<boolean>>;
  setFolderDockExpanded: React.Dispatch<React.SetStateAction<boolean>>;
  snapSlot: SharedValue<number>;
  gridOverlayOpacity: SharedValue<number>;
  jiggle: SharedValue<number>;
  reduceMotion: boolean;
  reduceSensoryLoad: boolean;
  favouritesByMode: Partial<Record<string, string[]>>;
};

export function useEditMode({
  activeMode,
  dispatch,
  hapticIfEnabled,
  layouts,
  setLayouts,
  layoutDirty,
  setLayoutDirty,
  layoutSnapshotRef,
  setSelectedLayoutTileId,
  setAddFlowExpanded,
  setHomeDockExpanded,
  setFolderDockExpanded,
  snapSlot,
  gridOverlayOpacity,
  jiggle,
  reduceMotion,
  reduceSensoryLoad,
  favouritesByMode,
}: UseEditModeParams) {
  const [editMode, setEditMode] = useState(false);
  const [undoStack, setUndoStack] = useState<BoardUndoEntry[]>([]);
  const [editFocusTileId, setEditFocusTileId] = useState<string | null>(null);
  const [editControlsOpen, setEditControlsOpen] = useState(false);
  const [activeEditTool, setActiveEditTool] = useState<BoardEditTool>('none');
  const [selectedTileIds, setSelectedTileIds] = useState<Set<string>>(new Set());
  const [undoToast, setUndoToast] = useState<{ tileId: string; placement: TilePlacement; board: BoardMode } | null>(null);
  const undoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Edit mode effects ────────────────────────────────────────────────────
  // Fade the grid overlay in/out and start/stop the jiggle animation when
  // edit mode toggles. Both run without touching the JS thread during the
  // transition (pure Reanimated shared value writes).
  useEffect(() => {
    gridOverlayOpacity.value = withTiming(editMode ? 1 : 0, { duration: 200 });
    if (editMode && !reduceMotion && !reduceSensoryLoad) {
      // Gentle continuous wobble while in edit mode — subtle enough to stay calm.
      // half-cycle. Subtle enough to not be annoying, clear enough to signal
      // "you're in rearrange mode." Stops the moment edit mode exits.
      jiggle.value = withRepeat(
        withSequence(
          withTiming(-0.35, { duration: 110 }),
          withTiming(0.35, { duration: 110 }),
        ),
        -1,
        true,
      );
    } else {
      cancelAnimation(jiggle);
      jiggle.value = withTiming(0, { duration: 80 });
    }
  }, [editMode, gridOverlayOpacity, jiggle, reduceMotion, reduceSensoryLoad]);

  const enterEditFromTile = useCallback((tileId: string) => {
    hapticIfEnabled();
    const current: BoardLayout = layouts[activeMode]
      ?? BOARD_TILES[activeMode].map((t, i) => ({ id: t.id, slot: i, fw: 2, fh: 2 }));
    layoutSnapshotRef.current = current.map(p => ({ ...p }));
    setLayoutDirty(false);
    setEditFocusTileId(tileId);
    setSelectedLayoutTileId(tileId);
    setAddFlowExpanded(false);
    setEditMode(true);
  }, [activeMode, hapticIfEnabled, layoutSnapshotRef, layouts, setAddFlowExpanded, setLayoutDirty, setSelectedLayoutTileId]);

  const exitEditClean = useCallback(() => {
    hapticIfEnabled();
    setEditMode(false);
    setLayoutDirty(false);
    setEditFocusTileId(null);
    setSelectedLayoutTileId(null);
    setAddFlowExpanded(false);
    // Land back on the full default_control_bar (Add + | Sort | Fullscreen | Hide).
    setHomeDockExpanded(true);
    setFolderDockExpanded(true);
    layoutSnapshotRef.current = null;
    snapSlot.value = -1;
  }, [hapticIfEnabled, layoutSnapshotRef, setAddFlowExpanded, setFolderDockExpanded, setHomeDockExpanded, setLayoutDirty, setSelectedLayoutTileId, snapSlot]);

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
  }, [activeMode, exitEditClean, layoutDirty, layoutSnapshotRef, setLayouts]);

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

  const handleOpenEditControls = useCallback(() => {
    hapticIfEnabled();
    setEditControlsOpen(true);
    setActiveEditTool('none');
    setSelectedTileIds(new Set());
    setUndoStack([]);
    setHomeDockExpanded(false);
    setFolderDockExpanded(false);
    setAddFlowExpanded(false);
    setEditMode(false);
    setSelectedLayoutTileId(null);
  }, [hapticIfEnabled, setAddFlowExpanded, setFolderDockExpanded, setHomeDockExpanded, setSelectedLayoutTileId]);

  const handleEditControlsDone = useCallback(() => {
    hapticIfEnabled();
    setEditControlsOpen(false);
    setActiveEditTool('none');
    setSelectedTileIds(new Set());
    setEditMode(false);
    setSelectedLayoutTileId(null);
    setHomeDockExpanded(true);
    setFolderDockExpanded(true);
  }, [hapticIfEnabled, setFolderDockExpanded, setHomeDockExpanded, setSelectedLayoutTileId]);

  const handleEditToolMove = useCallback(() => {
    hapticIfEnabled();
    if (selectedTileIds.size === 0) {
      AccessibilityInfo.announceForAccessibility?.(
        'Select items first, then choose Move',
      );
      return;
    }
    setActiveEditTool('move');
    setEditMode(false);
    setSelectedLayoutTileId(null);
    AccessibilityInfo.announceForAccessibility?.(
      'Choose a destination folder',
    );
  }, [hapticIfEnabled, selectedTileIds.size, setSelectedLayoutTileId]);

  const handleEditToolResize = useCallback(() => {
    hapticIfEnabled();
    setActiveEditTool('resize');
    const current: BoardLayout = layouts[activeMode]
      ?? BOARD_TILES[activeMode].map((t, i) => ({ id: t.id, slot: i, fw: 2, fh: 2 }));
    layoutSnapshotRef.current = current.map(p => ({ ...p }));
    setLayoutDirty(false);
    setEditMode(true);
    setSelectedLayoutTileId(null);
    setSelectedTileIds(new Set());
  }, [activeMode, hapticIfEnabled, layoutSnapshotRef, layouts, setLayoutDirty, setSelectedLayoutTileId]);

  // Snapshot BEFORE a mutating edit. Deep-copies each board's placement
  // array (tiny data) so later mutations can't bleed into history.
  const pushUndo = useCallback((label: string, restoreTileIds?: string[]) => {
    setUndoStack(prev => {
      const snapshot: LayoutsState = {};
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
      return [...prev.slice(-19), entry];
    });
  }, [activeMode, favouritesByMode, layouts]);

  const handleUndoEdit = useCallback(() => {
    const entry = undoStack[undoStack.length - 1];
    if (!entry) return;
    hapticIfEnabled();
    setUndoStack(prev => prev.slice(0, -1));
    setLayouts(entry.layouts);
    dispatch({ type: 'SET_FAVOURITES_BY_MODE', payload: { board: entry.board, ids: entry.favourites } });
    entry.restoreTileIds?.forEach(id => dispatch({ type: 'RESTORE_TILE', payload: id }));
    setSelectedTileIds(new Set());
    setLayoutDirty(true);
    AccessibilityInfo.announceForAccessibility?.(`Undid ${entry.label}`);
  }, [dispatch, hapticIfEnabled, setLayoutDirty, setLayouts, undoStack]);

  const handleEditToolSelectToggle = useCallback(() => {
    hapticIfEnabled();
    if (selectedTileIds.size > 0) {
      setSelectedTileIds(new Set());
      AccessibilityInfo.announceForAccessibility?.('Selection cleared');
      return;
    }
    setActiveEditTool(prev => (prev === 'select' ? 'none' : 'select'));
    setEditMode(false);
    setSelectedLayoutTileId(null);
  }, [hapticIfEnabled, selectedTileIds.size, setSelectedLayoutTileId]);

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
    setSelectedLayoutTileId(null);
    setHomeDockExpanded(true);
    setFolderDockExpanded(true);
    AccessibilityInfo.announceForAccessibility?.('Changes saved');
  }, [activeMode, dispatch, hapticIfEnabled, layouts, setFolderDockExpanded, setHomeDockExpanded, setLayoutDirty, setSelectedLayoutTileId]);

  const handleDockDone = useCallback(() => {
    exitEditClean();
  }, [exitEditClean]);

  const handleDockCancel = useCallback(() => {
    hapticIfEnabled();
    if (layoutSnapshotRef.current) {
      setLayouts(prev => ({ ...prev, [activeMode]: layoutSnapshotRef.current! }));
    }
    exitEditClean();
  }, [activeMode, exitEditClean, hapticIfEnabled, layoutSnapshotRef, setLayouts]);

  return {
    editMode,
    setEditMode,
    editControlsOpen,
    setEditControlsOpen,
    activeEditTool,
    setActiveEditTool,
    selectedTileIds,
    setSelectedTileIds,
    editFocusTileId,
    setEditFocusTileId,
    undoStack,
    setUndoStack,
    undoToast,
    setUndoToast,
    undoTimerRef,
    enterEditFromTile,
    exitEditClean,
    handleSaveEdit,
    handleCancelEdit,
    handleExitEdit,
    handleTileLongPress,
    handleOverlayPress,
    handleOpenEditControls,
    handleEditControlsDone,
    handleEditToolMove,
    handleEditToolResize,
    pushUndo,
    handleUndoEdit,
    handleEditToolSelectToggle,
    handleEditControlsSave,
    handleDockDone,
    handleDockCancel,
  };
}
