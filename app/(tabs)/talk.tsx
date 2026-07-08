import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  ActionSheetIOS,
  Alert,
  Animated as RNAnimated,
  FlatList,
  LayoutAnimation,
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
  useAnimatedReaction,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { GestureDetector } from 'react-native-gesture-handler';
import Svg, { Path as SvgPath } from 'react-native-svg';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Href, useRouter } from 'expo-router';
import { TalkMessageStrip, type MessageStripTile } from '../../src/components/talk/TalkMessageStrip';
import { AddSymbolModal } from '../../src/components/talk/AddSymbolModal';
import { AddFolderModal, type FolderPlacementOption } from '../../src/components/talk/AddFolderModal';
import {
  CustomSymbolEditor,
  type CustomSymbolEditorResult,
} from '../../src/components/talk/CustomSymbolEditor';
import { MulberrySymbol, prewarmMulberryAssets } from '../../src/components/symbols/MulberrySymbol';
import { AvatarView } from '../../src/features/profile/AvatarView';
import { parseAvatar } from '../../src/features/profile/avatar';
import { useAppContext } from '../../src/hooks/useAppContext';
import { useSpeech } from '../../src/hooks/useSpeech';
import { buildMessageUtterances, isKnownVocabWord } from '../../src/utils/speechRules';
import { animation, boardSizes, colors, spacing } from '../../src/theme/tokens';
import { useTheme } from '../../src/theme/useTheme';
import { hapticError, hapticSelection } from '../../src/utils/haptics';
import { useReduceMotion } from '../../src/hooks/useReduceMotion';
import {
  resolveSymbolForKeyword,
  ResolvedSymbol,
} from '../../src/features/symbol-brain/resolveSymbolForKeyword';
// N-gram next-word suggestions were removed in Phase 3 — the suggestion
// chip row is no longer rendered and no dispatches update the model.
// The underlying schema (`state.ngramModel`) is kept @deprecated so
// persisted user data still hydrates without a migration.
import { SymbolPackFolder, SymbolPackNode } from '../../src/data/symbolPacks';
// Extracted tile leaves — presentational, memoisable, testable in isolation.
import {
  GhostTileClone,
  wordTypeColour,
} from '../../src/features/board/components/TileRenderer';
// Extracted edit-mode overlays — Reanimated leaves, no context reads.
import {
  GridOverlay,
  DragPlaceholder,
  MultiCell,
  SourceGhost,
} from '../../src/features/board/components/EditModeOverlay';
// Extracted floating "way back" pill.
import { DockPeekPill } from '../../src/features/board/components/DockPeekPill';
import { BoardDockAction } from '../../src/features/board/components/BoardDockAction';
import { DockPopover } from '../../src/features/board/components/DockPopover';
import { DockSubControls } from '../../src/features/board/components/DockSubControls';
import { BoardTileCell } from '../../src/features/board/components/BoardTileButton';
import { TopNav } from '../../src/features/board/components/TopNav';
import { ScanHighlight, useScanning } from '../../src/features/scanning';
// Pure layout math — the God-screen originals were byte-identical duplicates.
import {
  reflowLayoutSlots,
  reflowAroundPinned,
  footprintAt,
  footprintsOverlap,
  coarseCols,
  coarseRows,
  type CellFootprint,
} from '../../src/features/board/layout';

// ─── TODO: Board Chrome Overcrowding (Phase 4) ─────────────────────────────
// Documented, NOT yet redesigned. The Talk screen currently competes with the
// four-column board across six overlapping chrome surfaces:
//   1. TalkMessageStrip (top) — sentence buffer + speech controls
//   2. Backspace / clear controls anchored to the strip
//   3. TopNav (toggled) — EDIT / LAYOUT / SAVED / SETTINGS
//   4. Bottom tab bar (see `_layout.tsx`, Phase 1 reduced to 80pt)
//   5. Contextual dock — one row per DockMode (see `dockRenderers`)
//   6. DockSubControls — square sub-buttons above dock anchors (Phase 2)
// Combined, these five stacked layers can consume 240–300pt of the viewport
// on a 393×852 iPhone, leaving under 55% of the screen for the tile grid
// itself. Phase 3 clawed back some of that (tab bar 100→80pt, tile gap 8→4pt,
// n-gram row removed, tile hierarchy tightened), but the chrome is still
// heavier than an ideal AAC board should feel. Future work — merge redundant
// affordances (e.g. fold Hide + Collapse into a single peek pill), consider
// gesture-driven chrome hiding on scroll, and reconsider whether TopNav is
// worth its permanent vertical cost when three of its actions overlap the
// dock. Do NOT redesign inline — capture as a follow-up ticket.

// Types, constants, and default tile data moved to
// src/features/board/talk/{types,constants,boardTiles}.ts. Imported below.
import type {
  TileKind,
  BoardMode,
  TopTab,
  BoardTile,
  WindowRect,
  TilePlacement,
  BoardLayout,
  GhostTile,
  DockActionKind,
  DockMode,
  BoardSortMode,
  DockPopoverOption,
  DockSubControlSpec,
  SlotRect,
  TileRectsRef,
} from '../../src/features/board/talk/types';
import {
  FIGMA_WIDTH,
  MESSAGE_HEIGHT,
  BOARD_COLUMNS,
  VISIBLE_ROWS,
  TILE_GAP,
  TILE_V_GAP,
  TILE_LEFT_PADDING,
  BOARD_TOP_GAP,
  TILE_SIZE,
  MAX_FW,
  DOCK_BOTTOM_GAP,
  DOCK_ACTION_SIZE,
  DOCK_TOGGLE_SIZE,
  DOCK_GAP,
  MESSAGE_SLOT_COUNT,
} from '../../src/features/board/talk/constants';
import {
  HOME_TILES,
  EMERGENCY_TILES,
  BOARD_TILES,
  BACK_TILE,
  boardTileFromCustomTile,
  labelForBoardTile,
} from '../../src/features/board/talk/boardTiles';
import { styles } from '../../src/features/board/talk/styles';
import { useBoardLayoutState } from '../../src/features/board/talk/useBoardLayoutState';
import { useEditMode } from '../../src/features/board/talk/useEditMode';
import { useQuickManage } from '../../src/features/board/talk/useQuickManage';
import { useSpeechQueue } from '../../src/features/board/talk/useSpeechQueue';
import { useDockVisibility } from '../../src/features/board/talk/useDockVisibility';
import { useBoardAddFlows } from '../../src/features/board/talk/useBoardAddFlows';
import { useBoardEditActions } from '../../src/features/board/talk/useBoardEditActions';

// Re-export BOARD_TILES so existing importers (app/board/health.tsx,
// app/board/hidden-tiles.tsx) keep working during the refactor.
export { BOARD_TILES };

// Board mode → Symbol Brain domain hint. Passed as `context.domain` to
// `resolveSymbolForKeyword` so the scorer can boost candidates whose
// category overlaps the active board's semantic area (e.g. "food" on the
// Foods board, "healthcare" on the Emergency board). Only modes with a
// clear semantic bias are mapped — mixed boards (home, quick, settings)
// omit a domain so the resolver falls back to keyword-only scoring.
const BOARD_DOMAIN: Partial<Record<string, string>> = {
  foods: 'food',
  feelings: 'feelings',
  emergency: 'healthcare',
};

// reflowLayoutSlots / reflowAroundPinned / footprintAt / footprintsOverlap /
// coarseCols / coarseRows moved to src/features/board/layout.ts (pure,
// unit-tested — see src/features/board/layout.test.ts). Imported at the top
// of this file with the other feature imports.

// ── ResizeHandles ──────────────────────────────────────────────────────────
// Renders 4 edge pills + 4 corner circles around a tile in edit mode.

// N-gram suggestion chips REMOVED (Phase 3 — Suggested Next Word Removal).
// The horizontal chip row previously rendered next-word predictions from
// `state.ngramModel`. Sentence history (`PUSH_SENTENCE_HISTORY`) remains
// active; only the suggestion UI and its dispatches were pulled.

export default function TalkScreen() {
  const { width, height: screenHeight } = useWindowDimensions();
  const rootRef = useRef<View>(null);
  const messageSlotRefs = useRef<Array<View | null>>([]);
  const ghostsRef = useRef<GhostTile[]>([]);
  const { state, dispatch } = useAppContext();
  const { speak, stop: stopSpeech, lastError, clearError } = useSpeech();
  const router = useRouter();
  const t = useTheme();
  const scan = useScanning();
  const motorAccessEnabled = state.accessibility.motorAccessMode;
  // Default to closed — board is the hero, top nav stays out of the way
  // until the user explicitly taps the chevron to open it.
  const [showTopNav, setShowTopNav] = useState(false);
  const [activeMode, setActiveMode] = useState<BoardMode>('home');
  const [previousMode, setPreviousMode] = useState<BoardMode | null>(null);
  // No tab is "current" by default — the new top-nav items are actions
  // (Edit / Layout) and destinations (Saved / Settings), not modes.
  const [activeTab, setActiveTab] = useState<TopTab | null>(null);
  const [ghosts, setGhosts] = useState<GhostTile[]>([]);
  const [resolvedSymbols, setResolvedSymbols] = useState<Map<string, ResolvedSymbol>>(new Map());
  const {
    layouts,
    setLayouts,
    boardAreaHeight,
    setBoardAreaHeight,
    layoutDirty,
    setLayoutDirty,
    selectedLayoutTileId,
    setSelectedLayoutTileId,
    layoutSnapshotRef,
  } = useBoardLayoutState({ boardPlacements: state.boardPlacements });
  // Shared values live on the UI thread so drag updates never cross the bridge.
  const snapSlot = useSharedValue(-1);
  // Tracks the grid slot where the current drag started — used to render
  // the "source ghost" outline (the empty-slot shadow the tile left behind).
  const dragSourceSlot = useSharedValue(-1);
  // Size of the current dragged tile in FINE units — drives multi-cell
  // DragPlaceholder highlights. Coarse cell count = ceil(fw/2) × ceil(fh/2).
  const dragFw = useSharedValue(2);
  const dragFh = useSharedValue(2);
  // Finger's absolute Y position on screen — published by the tile's Pan
  // onUpdate. -1 means "no drag active". A JS-side interval reads this and
  // auto-scrolls the board when the finger enters the top/bottom edge zone.
  const dragFingerAbsY = useSharedValue(-1);
  const gridOverlayOpacity = useSharedValue(0);
  const jiggle = useSharedValue(0);
  const scrollRef = useRef<ScrollView>(null);
  const scrollPositions = useRef<Partial<Record<BoardMode, number>>>({});
  const reduceMotion = useReduceMotion();
  // ── Contextual dock state ────────────────────────────────────────────────
  // addFlowExpanded: Add + sub-menu open (Back / Symbol / Folder / <)
  // folderDockExpanded: folder nav shows Back/Home/< (true) or collapsed > (false)
  // editFocusTileId: the tile long-pressed to enter edit mode → Delete target
  const [addFlowExpanded, setAddFlowExpanded] = useState(false);
  const [folderDockExpanded, setFolderDockExpanded] = useState(false);
  // Main board dock: expanded is the default (board_control_bar restructure:
  // Add + | Sort | Fullscreen | Hide is the default_control_bar).
  const [homeDockExpanded, setHomeDockExpanded] = useState(true);
  // ── Sort popover state (item 2) ─────────────────────────────────────────
  // Persistent popover above the Sort action — options toggle sort/unsort
  // without dismissing. Snapshot holds the pre-sort layout for "unsort".
  const [sortMenuVisible, setSortMenuVisible] = useState(false);
  const [activeSort, setActiveSort] = useState<BoardSortMode | null>(null);
  const sortSnapshotRef = useRef<BoardLayout | null>(null);
  const [sortAnchor, setSortAnchor] = useState({ x: 0, width: 0 });
  // ── Favourites — lifted into AppContext (persisted to hot AsyncStorage) ──
  // Per-board ordered list of favourited tile ids — favourites are pinned
  // to the top of the board (first slots) until unfavourited. Sort keeps
  // them pinned. Unfavouriting returns a tile to its remembered position.
  const favouritesByMode = state.favouritesByMode;
  const favouriteReturnIndexRef = useRef<Map<string, number>>(new Map());
  // Anchors for the Select / Move vertical pop-ups in the edit bar.
  const [selectAnchor, setSelectAnchor] = useState({ x: 0, width: 0 });
  const [moveAnchor, setMoveAnchor] = useState({ x: 0, width: 0 });
  // ── Add Symbol / Add Folder modals (Priority 2) ────────────────────────
  const [addSymbolModalVisible, setAddSymbolModalVisible] = useState(false);
  const [addFolderModalVisible, setAddFolderModalVisible] = useState(false);
  const [customSymbolEditorVisible, setCustomSymbolEditorVisible] = useState(false);
  const folderCollapseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const messageWordsRef = useRef(state.messageWords);
  messageWordsRef.current = state.messageWords;
  // User-added tiles (symbols/folders) that don't exist in the static BOARD_TILES data.
  const userTilesRef = useRef<Map<string, BoardTile>>(new Map());

  useEffect(() => {
    state.customBoardTiles.forEach(tile => {
      userTilesRef.current.set(tile.id, boardTileFromCustomTile(tile));
    });
  }, [state.customBoardTiles]);

  // Hydration filter — runs once after customBoardTiles are loaded.
  // Scrubs stale tile IDs from favouritesByMode that no longer exist in any
  // board (e.g. tiles deleted after being favourited). Stale IDs cause silent
  // broken favourites; scrubbing on load is safer than scrubbing on delete.
  const favouritesScrubDoneRef = useRef(false);
  useEffect(() => {
    if (favouritesScrubDoneRef.current) return;
    if (Object.keys(state.favouritesByMode).length === 0) return; // nothing to scrub
    favouritesScrubDoneRef.current = true;
    const allValidIds = new Set<string>([
      ...Object.values(BOARD_TILES).flat().map(t => t.id),
      ...state.customBoardTiles.map(t => t.id),
    ]);
    const cleaned: Partial<Record<string, string[]>> = {};
    let dirty = false;
    for (const [board, ids] of Object.entries(state.favouritesByMode)) {
      if (!ids) continue;
      const valid = ids.filter(id => allValidIds.has(id));
      if (valid.length !== ids.length) dirty = true;
      if (valid.length > 0) cleaned[board] = valid;
    }
    if (dirty) dispatch({ type: 'SET_ALL_FAVOURITES', payload: cleaned });
  }, [state.customBoardTiles, state.favouritesByMode, dispatch]);

  // ── Folder salvage migration ─────────────────────────────────────────────
  // Pre-Phase-3 builds stored folder/group tiles only in `userTilesRef` (a
  // module-level mutable map) and mutated `BOARD_TILES` — both ephemeral.
  // On the first launch after this update, `boardPlacements` may reference
  // `folder_*` tile IDs that aren't yet in `customBoardTiles`. Scan for
  // orphans and create minimal CustomBoardTile salvage entries so existing
  // boards render rather than showing blank placeholders.
  const folderSalvageDoneRef = useRef(false);
  useEffect(() => {
    if (folderSalvageDoneRef.current) return;
    folderSalvageDoneRef.current = true;
    const existingIds = new Set(state.customBoardTiles.map(t => t.id));
    const salvage: import('../../src/context/types').CustomBoardTile[] = [];
    for (const [boardKey, placements] of Object.entries(state.boardPlacements)) {
      if (!placements) continue;
      for (const p of placements) {
        // Folder tile IDs follow the pattern folder_<boardKey>
        if (!p.id.startsWith('folder_') && !p.id.startsWith('back-')) continue;
        if (existingIds.has(p.id)) continue;
        const isBackTile = p.id.startsWith('back-');
        const targetBoard = isBackTile ? 'home' : p.id.replace(/^folder_/, '');
        // Synthesize a minimal CustomBoardTile. Label/color/symbol are lost —
        // the user can rename from settings. Structure (navigation) is restored.
        salvage.push({
          id: p.id,
          board: boardKey,
          label: isBackTile ? 'Home' : 'Folder',
          color: '#1DCDFF',
          kind: 'folder',
          target: targetBoard,
          mulberrySymbolId: isBackTile ? 'mulberry_house_1ice1xp' : undefined,
        });
        existingIds.add(p.id);
      }
    }
    salvage.forEach(tile => dispatch({ type: 'UPSERT_CUSTOM_BOARD_TILE', payload: tile }));
  }, [state.customBoardTiles, state.boardPlacements, dispatch]);

  // Pre-built set of all known vocabulary labels (lowercase). Passed to
  // buildMessageUtterances so known AAC words always speak directly —
  // never letter-spelled — regardless of the spellingModeEnabled preference.
  const knownVocabSet = useMemo<Set<string>>(() => {
    const set = new Set<string>();
    Object.values(BOARD_TILES).flat().forEach(t => {
      set.add(t.label.toLowerCase());
      if (t.speech) set.add(t.speech.toLowerCase());
    });
    state.customBoardTiles.forEach(t => {
      set.add(t.label.toLowerCase());
      if (t.speech) set.add(t.speech.toLowerCase());
    });
    return set;
  }, [state.customBoardTiles]);

  // Expose knownVocabSet to the speakChained callback via ref so the
  // callback dep array stays stable across board-state changes.
  const knownVocabSetRef = useRef(knownVocabSet);
  knownVocabSetRef.current = knownVocabSet;

  // N-gram next-word suggestions removed (Phase 3). See notes at import
  // site above; sentence history dispatch below is unaffected.

  const folderPlacementOptions = useMemo<FolderPlacementOption[]>(() => {
    const options = new Map<string, string>();
    options.set(activeMode, activeMode === 'home' ? 'Current board' : 'Current folder');

    const addFolderTarget = (tile: BoardTile) => {
      if (tile.kind !== 'folder' || !tile.target) return;
      if (!options.has(tile.target)) {
        options.set(tile.target, `${tile.label} folder`);
      }
    };

    Object.values(BOARD_TILES).forEach(tiles => tiles.forEach(addFolderTarget));
    userTilesRef.current.forEach(addFolderTarget);

    return Array.from(options.entries())
      .sort(([boardKeyA, labelA], [boardKeyB, labelB]) => {
        if (boardKeyA === activeMode) return -1;
        if (boardKeyB === activeMode) return 1;
        return labelA.localeCompare(labelB);
      })
      .map(([boardKey, label]) => ({ boardKey, label }));
  }, [activeMode, layouts]);

  const {
    speakRunIdRef,
    speakGapTimerRef,
    enqueueSpeech,
    flushSpeechQueue,
  } = useSpeechQueue({
    speak,
    stopSpeech,
    speechRate: state.accessibility.speechRate,
    speechPitch: state.accessibility.speechPitch,
  });
  const hapticIfEnabled = useCallback(() => {
    if (state.accessibility.hapticsEnabled !== false) hapticSelection();
  }, [state.accessibility.hapticsEnabled]);
  const announce = useCallback((message: string) => {
    AccessibilityInfo.announceForAccessibility(message);
  }, []);

  const {
    hideMenuVisible,
    setHideMenuVisible,
    navHidden,
    setNavHidden,
    dockHidden,
    setDockHidden,
    hideAnchor,
    dockSlide,
    dockFade,
    peekMenuVisible,
    setPeekMenuVisible,
    toggleHideMenu,
    handleHideAnchorLayout,
    handleHideNavBar,
    handleHideDock,
    handleHideAll,
    handleChromeRestore,
    handlePeekLongPress,
    handlePeekToggleDock,
  } = useDockVisibility({
    hapticIfEnabled,
    reduceMotion,
    setSortMenuVisible,
  });

  const {
    quickTaggedIds,
    setQuickTaggedIds,
    quickViewActive,
    setQuickViewActive,
    quickDockMode,
    setQuickDockMode,
    quickManageOpen,
    setQuickManageOpen,
    manageSelectedIds,
    setManageSelectedIds,
    manageCreatedTag,
    setManageCreatedTag,
    isScrollingRef,
    quickAnchor,
    handleQuickAnchorLayout,
    handleQuickPress,
    handleManagePress,
    closeQuickManage,
    handleQuickManageBack,
    handleQuickSelectToggle,
    handleQuickManageDone,
    manageDoneVisible,
    quickShakeStyle,
    quickTintStyle,
    manageDoneStyle,
    unselectBlinkStyle,
  } = useQuickManage({
    activeMode,
    hapticIfEnabled,
    reduceMotion,
    scrollRef,
    scrollPositions,
    setSortMenuVisible,
    setHideMenuVisible,
  });

  const {
    editMode,
    setEditMode,
    editControlsOpen,
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
    handleSaveEdit,
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
  } = useEditMode({
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
    reduceSensoryLoad: state.accessibility.reduceSensoryLoad,
    favouritesByMode,
  });

  // ── Folder dock timer cleanup ─────────────────────────────────────────────
  // The 15s auto-collapse was removed with the board_control_bar restructure
  // (hiding the bar is now an explicit user action via Hide). The clear
  // helper stays so any legacy timer is cancelled on board changes.
  const clearFolderTimer = useCallback(() => {
    if (folderCollapseTimerRef.current) {
      clearTimeout(folderCollapseTimerRef.current);
      folderCollapseTimerRef.current = null;
    }
  }, []);

  // ── Dock action handlers ──────────────────────────────────────────────────
  const handleDockAddToggle = useCallback(() => {
    hapticIfEnabled();
    setAddFlowExpanded(v => !v);
  }, [hapticIfEnabled]);

  const handleDockAddPlus = useCallback(() => {
    hapticIfEnabled();
    setAddFlowExpanded(true);
  }, [hapticIfEnabled]);

  const handleAddFlowClose = useCallback(() => {
    hapticIfEnabled();
    setAddFlowExpanded(false);
  }, [hapticIfEnabled]);

  const handleDockSymbol = useCallback(() => {
    hapticIfEnabled();
    setAddSymbolModalVisible(true);
  }, [hapticIfEnabled]);

  const handleDockAddFolder = useCallback(() => {
    hapticIfEnabled();
    setAddFolderModalVisible(true);
  }, [hapticIfEnabled]);

  // Add-flow handlers extracted to src/features/board/talk/useBoardAddFlows.ts.
  const {
    addTileToCurrentBoard,
    handleAddSymbolConfirm,
    handleOpenCustomSymbolEditor,
    handleCustomSymbolDone,
    handleAddFolderConfirm,
    handleAddSymbolPack,
  } = useBoardAddFlows({
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
    boardPlacements: state.boardPlacements,
    customBoardTiles: state.customBoardTiles,
  });

  // Collapse handlers were removed with the board_control_bar restructure —
  // the expanded bar (Add + | Sort | Fullscreen | Hide) is now the default,
  // and hiding is an explicit user action via the Hide control.
  const handleFolderExpand = useCallback(() => {
    hapticIfEnabled();
    setFolderDockExpanded(true);
  }, [hapticIfEnabled]);

  const handleHomeDockExpand = useCallback(() => {
    hapticIfEnabled();
    setHomeDockExpanded(true);
  }, [hapticIfEnabled]);

  const handleOpenBoardSettings = useCallback(() => {
    hapticIfEnabled();
    router.push('/board/settings' as Href);
  }, [hapticIfEnabled, router]);

  const handleSelectAnchorLayout = useCallback((e: LayoutChangeEvent) => {
    const { x, width: w } = e.nativeEvent.layout;
    setSelectAnchor({ x, width: w });
  }, []);

  const handleMoveAnchorLayout = useCallback((e: LayoutChangeEvent) => {
    const { x, width: w } = e.nativeEvent.layout;
    setMoveAnchor({ x, width: w });
  }, []);

  // ── Dock mode resolver (priority: dirty edit > add > edit > folder) ────────
  const dockMode = useMemo<DockMode>(() => {
    if (editMode) {
      if (layoutDirty) return 'editDirty';
      if (addFlowExpanded) return 'addExpanded';
      return 'editClean';
    }
    // Edit Control Bar wins over the folder/home docks (but not over the
    // dirty edit-mode dock, which is a stronger commitment gate).
    if (editControlsOpen) return 'editControls';
    // Quick Manage replaces the default dock row until Back/Done.
    if (quickManageOpen) return 'quickManage';
    if (addFlowExpanded) return 'addExpanded';
    if (activeMode === 'home') {
      return homeDockExpanded ? 'homeExpanded' : 'homeCollapsed';
    }
    return folderDockExpanded ? 'folderExpanded' : 'folderCollapsed';
  }, [activeMode, addFlowExpanded, editControlsOpen, editMode, folderDockExpanded, homeDockExpanded, layoutDirty, quickManageOpen]);

  // On board change: reset add flow and popovers; the default_control_bar
  // (Add + | Sort | Fullscreen | Hide) is always expanded now, so home and
  // folders both land with the full bar. Sort state is per-board — clear it.
  useEffect(() => {
    setAddFlowExpanded(false);
    setHomeDockExpanded(true);
    setSortMenuVisible(false);
    setHideMenuVisible(false);
    setActiveSort(null);
    sortSnapshotRef.current = null;
    setUndoStack([]); // undo history is per board
    // Quick Manage is per-visit — leaving the board discards pending
    // selection intents. The Quick view itself (and tags) carry across.
    setQuickManageOpen(false);
    setManageSelectedIds(new Set());
    setManageCreatedTag(false);
    setQuickDockMode('hidden');
    if (activeMode === 'home') {
      setFolderDockExpanded(false);
      clearFolderTimer();
    } else {
      setFolderDockExpanded(true);
      // No auto-collapse — hiding the bar is now an explicit user action
      // (the Hide control), so the bar never disappears on its own.
      clearFolderTimer();
    }
    return clearFolderTimer;
  }, [activeMode, clearFolderTimer]);

  // Entering edit mode hides folder nav + any open add flow.
  useEffect(() => {
    if (editMode) {
      setFolderDockExpanded(false);
      setAddFlowExpanded(false);
      clearFolderTimer();
    }
  }, [editMode, clearFolderTimer]);

  // A layout change (dirty) closes the add sub-flow so Cancel/Save can take over.
  useEffect(() => {
    if (layoutDirty) setAddFlowExpanded(false);
  }, [layoutDirty]);

  // Popovers only make sense while their anchor buttons are on screen;
  // entering the add flow or edit tools also brings a hidden dock back so
  // the user always sees the controls they just asked for.
  useEffect(() => {
    if (dockMode !== 'homeExpanded' && dockMode !== 'folderExpanded') {
      setSortMenuVisible(false);
      setHideMenuVisible(false);
    }
    if (
      dockMode === 'addExpanded' ||
      dockMode === 'editControls' ||
      dockMode === 'editClean' ||
      dockMode === 'editDirty'
    ) {
      setDockHidden(false);
    }
  }, [dockMode]);

  // Calm crossfade whenever the dock content changes; instant under Reduce Motion.
  useEffect(() => {
    if (reduceMotion) { dockFade.setValue(1); return; }
    dockFade.setValue(0);
    RNAnimated.timing(dockFade, {
      toValue: 1,
      duration: 150,
      useNativeDriver: true,
    }).start();
  }, [dockMode, reduceMotion, dockFade]);

  const handleMoveToSlot = useCallback((tileId: string, targetSlot: number) => {
    setLayouts(prev => {
      const current: BoardLayout = prev[activeMode]
        ?? BOARD_TILES[activeMode].map((t, i) => ({
          id: t.id, slot: i, fw: 2, fh: 2,
        }));
      const draggedIdx = current.findIndex(p => p.id === tileId);
      const dragged = draggedIdx >= 0 ? current[draggedIdx] : undefined;
      if (!dragged) return prev;
      if (dragged.slot === targetSlot) return prev;

      // Reject drops whose footprint would hang past the right edge —
      // the tile springs back.
      const movedFp = footprintAt(targetSlot, dragged.fw, dragged.fh);
      if (movedFp.endCol >= BOARD_COLUMNS) return prev;

      // Same-size tile anchored exactly at the target → classic swap.
      const targetIdx = current.findIndex(
        (p, i) => i !== draggedIdx && p.slot === targetSlot,
      );
      const target = targetIdx >= 0 ? current[targetIdx] : undefined;
      if (target && target.fw === dragged.fw && target.fh === dragged.fh) {
        const next = [...current];
        next[draggedIdx] = { ...dragged, slot: targetSlot };
        next[targetIdx]  = { ...target,  slot: dragged.slot };
        setLayoutDirty(true);
        return { ...prev, [activeMode]: next };
      }

      // Footprint-aware drop: pin the dragged tile at the target and
      // push-aside any neighbours whose cells it now covers, so a 2×2
      // dropped between tiles can never overlap them.
      const moved: TilePlacement = { ...dragged, slot: targetSlot };
      const others = current.filter((_, i) => i !== draggedIdx);
      const next = reflowAroundPinned(others, moved);
      setLayoutDirty(true);
      return { ...prev, [activeMode]: next };
    });
  }, [activeMode]);

  const handleHide = useCallback((tile: BoardTile) => {
    hapticIfEnabled();
    // Protected tiles cannot be deleted (Priority 4 — emergency phrases)
    if (tile.isProtected) {
      Alert.alert('Protected', 'This tile cannot be removed.', [{ text: 'OK' }]);
      return;
    }
    // Rule 12: destructive action requires confirmation
    Alert.alert(
      `Remove "${tile.label}"?`,
      'The tile will be hidden from this board.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            // Capture current placement for undo (Rule 26)
            const currentLayout: BoardLayout = layouts[activeMode]
              ?? BOARD_TILES[activeMode].map((t, i) => ({ id: t.id, slot: i, fw: 2, fh: 2 }));
            const removedPlacement = currentLayout.find(p => p.id === tile.id);

            // Remove from local placements
            setLayouts(prev => {
              const curr: BoardLayout = prev[activeMode]
                ?? BOARD_TILES[activeMode].map((t, i) => ({ id: t.id, slot: i, fw: 2, fh: 2 }));
              return { ...prev, [activeMode]: curr.filter(p => p.id !== tile.id) };
            });
            setLayoutDirty(true);

            // Persist hide across relaunch
            dispatch({ type: 'HIDE_TILE', payload: tile.id });

            // Show undo toast
            if (removedPlacement) {
              if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
              setUndoToast({ tileId: tile.id, placement: removedPlacement, board: activeMode });
              undoTimerRef.current = setTimeout(() => setUndoToast(null), 5000);
            }
          },
        },
      ],
      { cancelable: true },
    );
  }, [activeMode, dispatch, hapticIfEnabled, layouts]);

  const handleUndoHide = useCallback(() => {
    if (!undoToast) return;
    hapticIfEnabled();
    // Restore the tile placement
    setLayouts(prev => {
      const curr: BoardLayout = prev[undoToast.board] ?? [];
      return { ...prev, [undoToast.board]: [...curr, undoToast.placement] };
    });
    // Unpersist the hide
    dispatch({ type: 'RESTORE_TILE', payload: undoToast.tileId });
    setUndoToast(null);
    if (undoTimerRef.current) { clearTimeout(undoTimerRef.current); undoTimerRef.current = null; }
  }, [dispatch, hapticIfEnabled, undoToast]);

  // ── Push-aside resize handler ─────────────────────────────────────────
  // When a tile is resized, cascade-shift any tiles whose footprint now
  // overlaps the new one (shared reflowAroundPinned helper — same walk the
  // drag-drop commit uses). dCols/dRows are coarse cells the anchor moves
  // LEFT/UP when the resize came from the left/top edge; they are clamped
  // at the grid edges so a blocked shift never grows the tile rightwards.
  const handleResize = useCallback((
    tileId: string,
    newFw: number,
    newFh: number,
    dCols: number = 0,
    dRows: number = 0,
  ) => {
    hapticIfEnabled();
    setSelectedLayoutTileId(tileId);
    setLayouts(prev => {
      const current: BoardLayout = prev[activeMode]
        ?? BOARD_TILES[activeMode].map((t, i) => ({
          id: t.id, slot: i, fw: 2, fh: 2,
        }));
      const idx = current.findIndex(p => p.id === tileId);
      const original = idx >= 0 ? current[idx] : undefined;
      if (!original) return prev;

      const startCol = original.slot % BOARD_COLUMNS;
      const startRow = Math.floor(original.slot / BOARD_COLUMNS);

      // Clamp anchor shifts at column/row 0. If the shift was clamped,
      // trim the matching growth so the tile doesn't jump sideways.
      const appliedCols = Math.min(dCols, startCol);
      const appliedRows = Math.min(dRows, startRow);
      const fwNext = Math.max(2, Math.min(MAX_FW, newFw - (dCols - appliedCols) * 2));
      const fhNext = Math.max(2, Math.min(MAX_FW, newFh - (dRows - appliedRows) * 2));
      const slotNext =
        (startRow - appliedRows) * BOARD_COLUMNS + (startCol - appliedCols);

      if (
        fwNext === original.fw &&
        fhNext === original.fh &&
        slotNext === original.slot
      ) return prev;

      const resized: TilePlacement = {
        ...original, slot: slotNext, fw: fwNext, fh: fhNext,
      };

      // Reject if the resized tile would extend past the right edge.
      if (footprintAt(slotNext, fwNext, fhNext).endCol >= BOARD_COLUMNS) return prev;

      const others = current.filter((_, i) => i !== idx);
      const next = reflowAroundPinned(others, resized);
      setLayoutDirty(true);
      return { ...prev, [activeMode]: next };
    });
  }, [activeMode, hapticIfEnabled]);

  const handleLayoutSelect = useCallback((tileId: string) => {
    hapticIfEnabled();
    setSelectedLayoutTileId(tileId);
    AccessibilityInfo.announceForAccessibility?.('Resize handles shown');
  }, [hapticIfEnabled]);

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
  // Width fit: the largest square that lets BOARD_COLUMNS columns sit inside the
  // 16pt side padding with 8pt gaps between them (the binding constraint here).
  const widthTile = Math.floor(
    (boardWidth - TILE_LEFT_PADDING * 2 - TILE_GAP * (BOARD_COLUMNS - 1)) / BOARD_COLUMNS,
  );
  // Height fit: the largest square that lets VISIBLE_ROWS rows fit the measured
  // board viewport (board area minus top gap and the pinned dock) with 8pt row
  // gaps. Falls back to a screen-based estimate before onLayout measures.
  const dockContentH = DOCK_ACTION_SIZE + spacing.sm + DOCK_BOTTOM_GAP;
  const boardViewportH = boardAreaHeight > 0
    ? boardAreaHeight - BOARD_TOP_GAP - 10 - dockContentH
    : screenHeight - MESSAGE_HEIGHT - BOARD_TOP_GAP - 100 - 50;
  const heightTile = Math.floor(
    (boardViewportH - TILE_V_GAP * (VISIBLE_ROWS - 1)) / VISIBLE_ROWS,
  );
  // Use the smaller so both constraints hold: the columns never overflow the
  // width, and ~VISIBLE_ROWS rows fit the height. Clamped to a sane range —
  // the floor keeps symbols comfortably above the 50pt touch minimum while
  // letting the board sit closer to the 64pt density target on small screens.
  const tileSize = Math.max(boardSizes.tileMin, Math.min(TILE_SIZE, widthTile, heightTile));
  // Dock actions are fixed 60pt squares; toggles (< >) are 50pt.
  const dockPadLeft = insets.left + TILE_LEFT_PADDING + Math.max(0, (availableWidth - boardWidth) / 2);
  const dockPadRight = insets.right + TILE_LEFT_PADDING + Math.max(0, (availableWidth - boardWidth) / 2);

  // Lookup map: tileId → BoardTile for the active mode (includes user-added tiles).
  const tileMapForMode = useMemo(() => {
    const map = new Map(BOARD_TILES[activeMode]?.map(t => [t.id, t]) ?? []);
    state.customBoardTiles.forEach(tile => {
      map.set(tile.id, boardTileFromCustomTile(tile));
    });
    // Merge user-added tiles so they resolve in the board renderer
    for (const [id, tile] of userTilesRef.current) {
      if (!map.has(id)) map.set(id, tile);
    }
    // Cross-board fallback: tiles Moved or Grouped into this board keep
    // their original definitions from their home board (active board and
    // user tiles win on id collisions).
    Object.values(BOARD_TILES).flat().forEach(t => {
      if (!map.has(t.id)) map.set(t.id, t);
    });
    return map;
  }, [activeMode, layouts, state.customBoardTiles]);

  // ── Motor Access Mode: tap-based context menu (Priority 5, Rule 20/25) ──
  const handleMotorAccessMenu = useCallback((tileId: string) => {
    const tile = tileMapForMode.get(tileId);
    if (!tile) return;
    hapticIfEnabled();
    const options = ['Move left', 'Move right', 'Resize larger', 'Resize smaller', 'Delete', 'Cancel'];
    const cancelButtonIndex = options.length - 1;
    const destructiveButtonIndex = 4;
    ActionSheetIOS.showActionSheetWithOptions(
      {
        options,
        cancelButtonIndex,
        destructiveButtonIndex,
        title: tile.label,
        message: 'Choose an action',
      },
      (buttonIndex) => {
        if (buttonIndex === 0) {
          const layout = layouts[activeMode]
            ?? BOARD_TILES[activeMode].map((tt, i) => ({ id: tt.id, slot: i, fw: 2, fh: 2 }));
          const p = layout.find(lp => lp.id === tileId);
          if (p && p.slot > 0) handleMoveToSlot(tileId, p.slot - 1);
        } else if (buttonIndex === 1) {
          const layout = layouts[activeMode]
            ?? BOARD_TILES[activeMode].map((tt, i) => ({ id: tt.id, slot: i, fw: 2, fh: 2 }));
          const p = layout.find(lp => lp.id === tileId);
          if (p) handleMoveToSlot(tileId, p.slot + 1);
        } else if (buttonIndex === 2) {
          const layout = layouts[activeMode]
            ?? BOARD_TILES[activeMode].map((tt, i) => ({ id: tt.id, slot: i, fw: 2, fh: 2 }));
          const p = layout.find(lp => lp.id === tileId);
          if (p) handleResize(tileId, Math.min(p.fw + 2, 8), Math.min(p.fh + 2, 8), 0, 0);
        } else if (buttonIndex === 3) {
          const layout = layouts[activeMode]
            ?? BOARD_TILES[activeMode].map((tt, i) => ({ id: tt.id, slot: i, fw: 2, fh: 2 }));
          const p = layout.find(lp => lp.id === tileId);
          if (p) handleResize(tileId, Math.max(p.fw - 2, 2), Math.max(p.fh - 2, 2), 0, 0);
        } else if (buttonIndex === 4) {
          if (tile.isProtected) {
            Alert.alert('Protected', 'This tile cannot be removed.', [{ text: 'OK' }]);
          } else {
            handleHide(tile);
          }
        }
      },
    );
  }, [activeMode, handleHide, handleMoveToSlot, handleResize, hapticIfEnabled, layouts, tileMapForMode]);

  // Active layout for the current mode. Falls back to a sequential
  // default (each tile at its own slot, 2×2 fine size = 88×88).
  const activeLayout = useMemo<BoardLayout>(() => {
    const custom = layouts[activeMode];
    if (custom) return custom;
    const base = (BOARD_TILES[activeMode] ?? []).map((t, i) => ({
      id: t.id, slot: i, fw: 2, fh: 2,
    }));
    const ids = new Set(base.map(p => p.id));
    const additions = state.customBoardTiles
      .filter(tile => tile.board === activeMode && !ids.has(tile.id))
      .map((tile, i) => ({ id: tile.id, slot: base.length + i, fw: 2, fh: 2 }));
    return [...base, ...additions];
  }, [activeMode, layouts, state.customBoardTiles]);

  // ── Quick view derived layout ────────────────────────────────────────
  // While the Quick view (or the Manage bar) is active, Quick-tagged tiles
  // float to the top of the grid. DERIVED-ONLY: a render-time reorder in
  // the style of rebuildWithFavourites — it never calls setLayouts and
  // never touches the persisted board layout. Suspended during editing so
  // drag/resize slot math always matches what's on screen.
  const quickOrderActive =
    (quickViewActive || quickManageOpen) &&
    quickTaggedIds.size > 0 &&
    !editMode &&
    !editControlsOpen;
  const displayLayout = useMemo<BoardLayout>(() => {
    if (!quickOrderActive) return activeLayout;
    const ordered = [...activeLayout].sort((a, b) => a.slot - b.slot);
    const quick = ordered.filter(p => quickTaggedIds.has(p.id));
    if (quick.length === 0) return activeLayout;
    // Within the Quick section: symbols first, folders below (stable
    // within each group so the user's slot order is preserved).
    const isFolder = (id: string) => tileMapForMode.get(id)?.kind === 'folder';
    const quickSymbols = quick.filter(p => !isFolder(p.id));
    const quickFolders = quick.filter(p => isFolder(p.id));
    const rest = ordered.filter(p => !quickTaggedIds.has(p.id));
    return [...quickSymbols, ...quickFolders, ...rest].map((p, i) => ({ ...p, slot: i }));
  }, [activeLayout, quickOrderActive, quickTaggedIds, tileMapForMode]);
  const scanRowSlots = useMemo(() => {
    const rows = new Set<number>();
    displayLayout.forEach((placement) => rows.add(Math.floor(placement.slot / BOARD_COLUMNS)));
    return [...rows].sort((a, b) => a - b);
  }, [displayLayout]);

  const handleAccessibilityReorder = useCallback((tileId: string, direction: 'forward' | 'back') => {
    const placement = activeLayout.find(p => p.id === tileId);
    const tile = tileMapForMode.get(tileId);
    if (!placement || !tile) return;

    const targetSlot = direction === 'forward' ? placement.slot + 1 : placement.slot - 1;
    const maxSlot = Math.max(...activeLayout.map(p => p.slot));
    if (targetSlot < 0 || targetSlot > maxSlot) {
      announce(direction === 'forward' ? 'Already at the end' : 'Already at the start');
      return;
    }

    const targetFootprint = footprintAt(targetSlot, placement.fw, placement.fh);
    if (targetFootprint.endCol >= BOARD_COLUMNS) {
      announce('This tile cannot move there');
      return;
    }

    hapticIfEnabled();
    handleMoveToSlot(tileId, targetSlot);
    announce(`${tile.label} moved ${direction === 'forward' ? 'forward' : 'back'}`);
  }, [activeLayout, announce, handleMoveToSlot, hapticIfEnabled, tileMapForMode]);

  // Fast lookup: slot index → placement (for collision checks + swap).
  const layoutBySlot = useMemo(() => {
    const m = new Map<number, TilePlacement>();
    activeLayout.forEach(p => m.set(p.slot, p));
    return m;
  }, [activeLayout]);

  const {
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
  } = useBoardEditActions({
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
    customBoardTiles: state.customBoardTiles,
    editControlsOpen,
    activeEditTool,
    displayLayout,
    tileMapForMode,
    tileSize,
  });

  // ── Sort mode ────────────────────────────────────────────────────────────
  // Reorders the current board's tiles by Type (word type), Name (label), or
  // Category (folders first, then by word type). Reassigns slots row-major so
  // the sorted order lands cleanly on the grid.
  const applySort = useCallback(
    (mode: 'type' | 'name' | 'category') => {
      // Type sort groups tiles by their COLOUR (the word-type colour the user
      // actually sees), so every same-coloured tile sits next to its matches.
      // Known palette colours order first (red→orange→yellow→green→blue→purple→
      // cyan); any other colour groups together after, by hex.
      const colorOrder = ['#FF3B30', '#FF9500', '#FF9F0A', '#FFD60A', '#34C759', '#0A84FF', '#1DCDFF', '#BF5AF2'];
      const colorRank = (c?: string) => {
        const i = colorOrder.indexOf((c ?? '').toUpperCase());
        return i < 0 ? colorOrder.length : i;
      };
      // Navigation folders that go Home ("back" tiles) always stay last, in
      // every sort mode, so Home never jumps to the top of the board.
      const isBackHome = (tile: BoardTile) => tile.kind === 'folder' && tile.target === 'home';
      // Favourites are pinned — Sort never moves them (Phase 3 rule).
      const pinned = favouriteIds
        .map(id => activeLayout.find(p => p.id === id))
        .filter((p): p is TilePlacement => Boolean(p));
      const sortable = activeLayout.filter(p => !favouriteIds.includes(p.id));
      const sorted = [...sortable].sort((a, b) => {
        const ta = tileMapForMode.get(a.id);
        const tb = tileMapForMode.get(b.id);
        if (!ta || !tb) return 0;
        const backA = isBackHome(ta) ? 1 : 0;
        const backB = isBackHome(tb) ? 1 : 0;
        if (backA !== backB) return backA - backB;
        // Name: A–Z by label (A at top).
        if (mode === 'name') return ta.label.localeCompare(tb.label);
        // Type: cluster identical colours together, then A–Z within a colour.
        if (mode === 'type') {
          const ca = (ta.color ?? '').toUpperCase();
          const cb = (tb.color ?? '').toUpperCase();
          const ra = colorRank(ca);
          const rb = colorRank(cb);
          if (ra !== rb) return ra - rb;
          if (ca !== cb) return ca.localeCompare(cb);
          return ta.label.localeCompare(tb.label);
        }
        // Category: Folders first, then Symbols — each group A–Z by name.
        const catA = ta.kind === 'folder' ? 0 : 1;
        const catB = tb.kind === 'folder' ? 0 : 1;
        return catA - catB || ta.label.localeCompare(tb.label);
      });
      const next = [...pinned, ...sorted].map((p, i) => ({ ...p, slot: i }));
      setLayouts(prev => ({ ...prev, [activeMode]: next }));
      hapticSelection();
      AccessibilityInfo.announceForAccessibility?.(`Sorted by ${mode}`);
    },
    [activeLayout, activeMode, favouriteIds, tileMapForMode],
  );

  // ── Sort popover handlers (item 2) ────────────────────────────────────
  // The popover sits just above the Sort action and is PERSISTENT — tapping
  // an option applies (or removes) that sort and keeps the menu open so the
  // user can keep toggling. Dismissed by tapping Sort again, opening Hide,
  // or leaving the board.
  const toggleSortMenu = useCallback(() => {
    hapticIfEnabled();
    setHideMenuVisible(false);
    setSortMenuVisible(v => !v);
  }, [hapticIfEnabled]);

  const handleSortOption = useCallback((mode: BoardSortMode) => {
    hapticIfEnabled();
    if (activeSort === mode) {
      // Unsort — restore the layout captured before the first sort.
      if (sortSnapshotRef.current) {
        const snapshot = sortSnapshotRef.current;
        setLayouts(prev => ({ ...prev, [activeMode]: snapshot }));
      }
      sortSnapshotRef.current = null;
      setActiveSort(null);
      AccessibilityInfo.announceForAccessibility?.('Sort removed');
      return;
    }
    if (activeSort === null) {
      // First sort in this session — remember how the board looked.
      sortSnapshotRef.current = activeLayout.map(p => ({ ...p }));
    }
    applySort(mode);
    setActiveSort(mode);
  }, [activeLayout, activeMode, activeSort, applySort, hapticIfEnabled]);

  const handleSortAnchorLayout = useCallback((e: LayoutChangeEvent) => {
    const { x, width: w } = e.nativeEvent.layout;
    setSortAnchor({ x, width: w });
  }, []);

  // Create — shared custom symbol editor; the confirm handler auto-tags the
  // new tile as Quick while the Manage bar is open.
  const handleQuickCreate = useCallback(() => {
    handleOpenCustomSymbolEditor();
  }, [handleOpenCustomSymbolEditor]);

  // Manage sub-control visibility (Phase 2 — Quick Manage Entry). Manage
  // now surfaces ONLY as a square sub-control anchored directly above the
  // Quick dock button, and only while Quick is on / has just been armed.
  // The old floating pill and the dock-row Manage button both went away
  // with the sub-control layer — this is the single source of truth.
  const manageSubControlVisible =
    !quickManageOpen &&
    (quickDockMode === 'manage' || quickViewActive) &&
    (dockMode === 'homeExpanded' || dockMode === 'folderExpanded');

  // Keep `tiles` for the Mulberry prewarm effect (all tiles in active mode).
  // Includes custom user tiles so they also get Symbol Brain resolution.
  const tiles = useMemo(() => {
    const base = BOARD_TILES[activeMode] ?? [];
    const custom = state.customBoardTiles
      .filter(t => t.board === activeMode)
      .map(t => boardTileFromCustomTile(t));
    return [...base, ...custom];
  }, [activeMode, state.customBoardTiles]);

  useEffect(() => {
    const y = scrollPositions.current[activeMode] ?? 0;
    scrollRef.current?.scrollTo({ y, animated: false });
  }, [activeMode]);

  // ── Auto-scroll while dragging a lifted tile ─────────────────────────────
  // When the finger enters the 32/52pt zones near the safe-area top or
  // bottom edge, nudge the ScrollView so the user can drop a lifted tile
  // beyond the current viewport. Respect Reduce Motion (skip the loop —
  // dragging still works, but the board doesn't animate away under the
  // finger). See Step 10 of the refactor spec.
  useEffect(() => {
    if (reduceMotion) return;
    let raf: ReturnType<typeof setInterval> | null = null;
    // The Reanimated shared value can be sampled from JS via `.value`.
    raf = setInterval(() => {
      const y = dragFingerAbsY.value;
      if (y < 0) return; // no active drag
      // Safe-area-aware zones. `insets.top` accounts for the notch;
      // `screenHeight - insets.bottom` for the home indicator.
      const topEdge = insets.top;
      const bottomEdge = screenHeight - insets.bottom;
      const topDist = y - topEdge;
      const bottomDist = bottomEdge - y;
      let delta = 0;
      // Top edge — scroll UP (negative delta).
      if (topDist >= 0 && topDist <= 32) delta = -18;
      else if (topDist > 32 && topDist <= 52) delta = -8;
      // Bottom edge — scroll DOWN (positive delta).
      else if (bottomDist >= 0 && bottomDist <= 32) delta = 18;
      else if (bottomDist > 32 && bottomDist <= 52) delta = 8;
      if (delta === 0) return;
      const currentY = scrollPositions.current[activeMode] ?? 0;
      const nextY = Math.max(0, currentY + delta);
      scrollPositions.current[activeMode] = nextY;
      scrollRef.current?.scrollTo({ y: nextY, animated: false });
    }, 32);
    return () => {
      if (raf) clearInterval(raf);
    };
  }, [activeMode, dragFingerAbsY, insets.bottom, insets.top, reduceMotion, screenHeight]);

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
    const domain = BOARD_DOMAIN[activeMode];
    Promise.all(
      toResolve.map(t =>
        resolveSymbolForKeyword(t.speech ?? t.label, 'local-user', { domain }).then(r => ({ id: t.id, r })),
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
  }, [tiles, activeMode]);
  const chipTileLookup = useMemo(() => {
    const lookup = new Map<string, BoardTile>();
    Object.values(BOARD_TILES).flat().forEach(tile => {
      lookup.set((tile.speech ?? tile.label).toLowerCase(), tile);
      lookup.set(tile.label.toLowerCase(), tile);
    });
    return lookup;
  }, []);

  // Chained clause runner — cancels any in-flight run, then walks the
  // utterance list, chaining each via `onDone` with a punctuation-aware
  // gap between clauses (board_speech_rules.md).
  const speakChained = useCallback((text: string) => {
    speakRunIdRef.current += 1;
    if (speakGapTimerRef.current) {
      clearTimeout(speakGapTimerRef.current);
      speakGapTimerRef.current = null;
    }
    stopSpeech();

    const utterances = buildMessageUtterances(
      text,
      state.accessibility.speechRate,
      state.accessibility.speechPitch,
      {
        spellingModeEnabled: state.accessibility.spellingModeEnabled,
        knownVocabSet: knownVocabSetRef.current,
      },
    );
    if (utterances.length === 0) return;
    const run = speakRunIdRef.current;

    const speakNext = (i: number) => {
      if (run !== speakRunIdRef.current) return;
      const u = utterances[i];
      if (!u) return;
      speak(u.text, {
        rate: u.rate,
        pitch: u.pitch,
        onDone: () => {
          if (run !== speakRunIdRef.current) return;
          if (i + 1 < utterances.length) {
            speakGapTimerRef.current = setTimeout(() => speakNext(i + 1), u.gapAfter);
          }
        },
      });
    };

    speakNext(0);
  }, [speak, stopSpeech, state.accessibility.speechRate, state.accessibility.speechPitch, state.accessibility.spellingModeEnabled]);

  // Never leave a chain running when the screen unmounts.
  useEffect(() => () => {
    speakRunIdRef.current += 1;
    if (speakGapTimerRef.current) {
      clearTimeout(speakGapTimerRef.current);
      speakGapTimerRef.current = null;
    }
  }, []);

  const handleStripSpeak = useCallback((messageText: string, hasWords: boolean) => {
    if (!messageText.trim() || !hasWords) {
      announce('No message to speak');
      return;
    }
    if (messageWordsRef.current.length > 0) {
      dispatch({ type: 'PUSH_SENTENCE_HISTORY', payload: { words: messageWordsRef.current } });
      // UPDATE_NGRAM_MODEL dispatch removed (Phase 3 — Suggested Next
      // Word Removal). Sentence history push above is preserved.
    }
    speakChained(messageText);
    announce(`Speaking: ${messageText}`);
  }, [announce, speakChained, dispatch]);

  const handleStripBackspace = useCallback((hasWords: boolean) => {
    hapticIfEnabled();
    if (hasWords) {
      dispatch({ type: 'REMOVE_LAST_WORD' });
      return;
    }
    setActiveMode('home');
    setPreviousMode(null);
    setActiveTab(null);
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
    // When silent=true the caller handles speech (via enqueueSpeech in
    // startGhostToMessage). When false — e.g. direct appendWord call — enqueue
    // so the word joins the FIFO queue rather than cancelling what's playing.
    if (!silent && state.accessibility.wordSpeechMode !== 'sentence') {
      enqueueSpeech(label);
    }
    announce(`Added ${label}`);
  }, [announce, dispatch, enqueueSpeech, state.accessibility.wordSpeechMode]);

  // handleNgramSelect removed (Phase 3). The suggestion chip row is gone;
  // there is no path left in the UI that would fire this handler.

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
    speakChained(messageText);
    announce(`Speaking: ${messageText}`);
  }, [announce, speakChained]);

  const clearMessage = useCallback(() => {
    // Cancel any in-flight chained clause run before wiping the message.
    speakRunIdRef.current += 1;
    if (speakGapTimerRef.current) {
      clearTimeout(speakGapTimerRef.current);
      speakGapTimerRef.current = null;
    }
    // Flush the word-by-word FIFO queue as well (Bug #7).
    flushSpeechQueue();
    ghostsRef.current = [];
    setGhosts([]);
    if (messageWordsRef.current.length > 0) {
      dispatch({ type: 'PUSH_SENTENCE_HISTORY', payload: { words: messageWordsRef.current } });
      // UPDATE_NGRAM_MODEL dispatch removed (Phase 3).
    }
    dispatch({ type: 'CLEAR_WORDS' });
    announce('Message cleared');
  }, [announce, dispatch, flushSpeechQueue]);

  const startGhostToMessage = useCallback((tile: BoardTile, fromRect: WindowRect | null) => {
    const label = tile.speech ?? tile.label;
    // word-by-word: enqueue for FIFO playback so rapid taps are heard in order.
    // sentence: tile taps are silent — full message speaks on Send.
    if (state.accessibility.wordSpeechMode !== 'sentence') {
      enqueueSpeech(label);
    }

    if (!fromRect) {
      appendWord(tile, true); // silent — speech handled above
      return;
    }

    const targetIndex = Math.min(
      messageWordsRef.current.length + ghostsRef.current.length,
      MESSAGE_SLOT_COUNT - 1,
    );
    const targetRef = messageSlotRefs.current[targetIndex];

    if (!targetRef || !rootRef.current) {
      appendWord(tile, true); // silent — speech handled above
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
  }, [addGhost, appendWord, enqueueSpeech, state.accessibility.wordSpeechMode, tileSize]);

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
    // ── Quick Manage gate ─────────────────────────────────────────────────
    // While the Manage bar is open, taps toggle a tile's Quick intent
    // instead of speaking / opening folders. Nav tiles (back/home) still
    // work. Accidental-selection guard: a tap that lands while a scroll
    // gesture is in flight is a scroll, not a choice — skip it.
    if (quickManageOpen) {
      if (tile.id === 'back' || tile.id === 'home') {
        // Fall through to normal nav — allows leaving a folder mid-manage.
      } else {
        if (isScrollingRef.current) return;
        hapticIfEnabled();
        // Selection = desired final Quick set (tagged symbols enter
        // Manage preselected). Toggling off a tagged symbol marks it
        // for removal; toggling on an untagged one marks it to add.
        const wasSelected = manageSelectedIds.has(tile.id);
        setManageSelectedIds(prev => {
          const next = new Set(prev);
          if (next.has(tile.id)) next.delete(tile.id);
          else next.add(tile.id);
          return next;
        });
        AccessibilityInfo.announceForAccessibility?.(
          wasSelected ? `${tile.label} deselected` : `${tile.label} selected`,
        );
        return;
      }
    }
    // ── Edit tool gates (Select / Move) ───────────────────────────────────
    // In Select Mode, taps toggle selection instead of speaking / opening
    // folders. In Move Mode, tapping a folder chooses it as the destination
    // for the currently selected tiles. Nav tiles (back/home) still work
    // so the user can leave the folder they're in without exiting the tool.
    if (editControlsOpen && activeEditTool === 'select') {
      if (tile.id === 'back' || tile.id === 'home') {
        // Fall through to normal nav — allows leaving a folder mid-select.
      } else {
        toggleTileSelection(tile.id);
        return;
      }
    }
    if (editControlsOpen && activeEditTool === 'move') {
      if (tile.id === 'back' || tile.id === 'home') {
        // Fall through to normal nav — allows changing destination view.
      } else if (tile.kind === 'folder' && tile.target) {
        handleMoveToDestination(tile.target);
        return;
      } else {
        AccessibilityInfo.announceForAccessibility?.(
          'Tap a folder to choose it as the destination',
        );
        return;
      }
    }
    hapticIfEnabled();
    dispatch({ type: 'INCREMENT_TILE_TAP', payload: { tileId: tile.id } });
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
      setActiveTab(null);
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
        setActiveTab(null);
        dispatch({ type: 'SET_BOARD', payload: 'home' });
      }
      return;
    }
    startGhostToMessage(tile, rect);
  }, [activeEditTool, announce, clearMessage, dispatch, editControlsOpen, handleMoveToDestination, hapticIfEnabled, manageSelectedIds, navigateTo, previousMode, quickManageOpen, repeatMessage, startGhostToMessage, toggleTileSelection]);

  // Folder dock Back reuses the tile-press navigation logic.
  const handleDockBack = useCallback(() => handleTilePress(BACK_TILE, null), [handleTilePress]);

  // Delete removes the focused tile's placement from the in-memory layout for
  // the current board only. Marks the session dirty so Cancel/Save appear.
  const handleDockDelete = useCallback(() => {
    if (!editFocusTileId) return;
    hapticIfEnabled();
    // Check if the focused tile is protected (Priority 4)
    const focusedTile = tileMapForMode.get(editFocusTileId);
    if (focusedTile?.isProtected) {
      Alert.alert('Protected', 'This tile cannot be removed.', [{ text: 'OK' }]);
      return;
    }
    const target = editFocusTileId;
    setLayouts(prev => {
      const current: BoardLayout = prev[activeMode]
        ?? BOARD_TILES[activeMode].map((tt, i) => ({ id: tt.id, slot: i, fw: 2, fh: 2 }));
      const next = current.filter(p => p.id !== target);
      return { ...prev, [activeMode]: next };
    });
    setLayoutDirty(true);
    setEditFocusTileId(null);
    announce('Tile deleted');
  }, [activeMode, announce, editFocusTileId, hapticIfEnabled, tileMapForMode]);

  const handleTopTab = useCallback((tab: TopTab) => {
    hapticIfEnabled();
    // EDIT (moved up from the bottom dock) opens the Edit Control Bar.
    // LAYOUT is the old Resize tool (grid + handles). SAVED opens saved
    // sentences (old Quick — the merged TapTalk+Saved page comes in a
    // later phase). SETTINGS opens board settings (old "Board" action).
    if (tab === 'edit') {
      // Toggle: a second tap on EDIT closes the edit bar calmly.
      if (editControlsOpen) {
        handleEditControlsDone();
        announce('Edit closed');
      } else {
        handleOpenEditControls();
        announce('Edit board');
      }
      return;
    }
    if (tab === 'layout') {
      handleEditToolResize();
      announce('Layout mode. Drag handles to resize tiles.');
      return;
    }
    if (tab === 'saved') {
      router.push('/board/quick-talk' as Href);
      announce('Saved sentences');
      return;
    }
    // SETTINGS
    handleOpenBoardSettings();
    announce('Board settings');
  }, [announce, editControlsOpen, handleEditControlsDone, handleEditToolResize, handleOpenBoardSettings, handleOpenEditControls, hapticIfEnabled, router]);

  const handleScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      scrollPositions.current[activeMode] = e.nativeEvent.contentOffset.y;
    },
    [activeMode],
  );

  // ── Default Bottom Control Bar configuration (Phase 2 — Default Dock
  // Configuration Isolation) ─────────────────────────────────────────────
  // Every dock mode's control list lives inside its own renderer entry.
  // Renaming a button, adding a control, or reordering a mode NEVER
  // requires editing any of the other modes — the render tree below is a
  // single dispatch call `dockRenderers[dockMode]?.()`. Exhaustiveness is
  // enforced by the Record<DockMode, ...> type — adding a new DockMode
  // union member will fail the type-check until its renderer is defined
  // here. Anchor refs (Sort/Quick/Hide/Select/Move) stay next to their
  // owning BoardDockAction so measurement wiring lives with the button.
  const dockRenderers: Record<DockMode, () => React.ReactNode> = {
    homeCollapsed: () => (
      <View style={styles.collapsedDockMount}>
        <View style={styles.collapsedDockPeek}>
          <BoardDockAction
            icon="toggle-bar"
            iconOnly
            size={DOCK_TOGGLE_SIZE}
            a11yLabel="Expand controls"
            a11yHint="Shows the board controls"
            onPress={handleHomeDockExpand}
            isToggle
          />
        </View>
      </View>
    ),
    homeExpanded: () => (
      <>
        <BoardDockAction
          icon="dock-add" label="Add"
          a11yLabel="Add"
          a11yHint="Opens add options for the board"
          onPress={handleDockAddPlus}
          kind="neutral"
        />
        <View onLayout={handleSortAnchorLayout}>
          <BoardDockAction
            icon="sort" label="Sort"
            a11yLabel="Sort tiles"
            a11yHint="Opens sort options above this button"
            onPress={toggleSortMenu}
            kind="neutral"
            isToggle
            isActive={sortMenuVisible}
          />
        </View>
        <View onLayout={handleQuickAnchorLayout}>
          <Reanimated.View style={quickShakeStyle}>
            <BoardDockAction
              icon="quick" label="Quick"
              a11yLabel="Quick view"
              a11yHint="Scrolls to top and shows your Quick symbols. Manage appears above this button once Quick is on."
              onPress={handleQuickPress}
              kind="neutral"
              isToggle
              isActive={quickViewActive}
            />
            <Reanimated.View
              pointerEvents="none"
              style={[styles.quickErrorTint, quickTintStyle]}
            />
          </Reanimated.View>
        </View>
        {/* Manage moved to DockSubControls above Quick (Phase 2). */}
        <View onLayout={handleHideAnchorLayout}>
          <BoardDockAction
            icon="hide" label="Hide"
            a11yLabel="Hide controls"
            a11yHint="Choose to hide the nav bar, the control bar, or all"
            onPress={toggleHideMenu}
            kind="neutral"
            isToggle
            isActive={hideMenuVisible || navHidden}
          />
        </View>
        <BoardDockAction
          icon="untoggle-bar"
          iconOnly
          size={boardSizes.touchTargetMin}
          a11yLabel="Collapse controls"
          a11yHint="Leaves a small expand control on the left edge"
          onPress={() => {
            hapticIfEnabled();
            setHomeDockExpanded(false);
          }}
          kind="neutral"
        />
      </>
    ),
    quickManage: () => (
      <>
        <BoardDockAction
          icon="back-out" label="Back"
          a11yLabel="Back"
          a11yHint="Close Quick manage"
          onPress={handleQuickManageBack}
          kind="neutral"
        />
        <Reanimated.View style={unselectBlinkStyle}>
          <BoardDockAction
            icon="select"
            label={manageSelectedIds.size > 0 ? 'Unselect' : 'Select'}
            a11yLabel={manageSelectedIds.size > 0
              ? `Unselect all ${manageSelectedIds.size} selected`
              : 'Select symbols'}
            a11yHint={manageSelectedIds.size > 0
              ? 'Clears all selected symbols'
              : 'Tap symbols on the board to select them'}
            onPress={handleQuickSelectToggle}
            kind="neutral"
            tint={manageSelectedIds.size > 0 ? t.colors.danger : undefined}
            isToggle
            isActive={manageSelectedIds.size > 0}
          />
        </Reanimated.View>
        <BoardDockAction
          icon="symbol-add" label="Create"
          a11yLabel="Create a new Quick symbol"
          a11yHint="Opens the custom symbol editor. The new symbol is pinned to Quick automatically"
          onPress={handleQuickCreate}
          kind="neutral"
        />
        {manageDoneVisible ? (
          <Reanimated.View style={manageDoneStyle}>
            <BoardDockAction
              icon="checkmark" label="Done"
              a11yLabel="Done — save Quick changes"
              a11yHint="Saves your Quick symbols and shows the Quick view"
              onPress={handleQuickManageDone}
              kind="primary"
            />
          </Reanimated.View>
        ) : null}
      </>
    ),
    addExpanded: () => (
      <>
        <BoardDockAction
          icon="back-out" label="Back"
          a11yLabel="Back" a11yHint="Close add options"
          onPress={handleAddFlowClose} kind="neutral"
        />
        <BoardDockAction
          icon="symbol-add" label="Symbol" a11yLabel="Add symbol"
          onPress={handleDockSymbol} kind="neutral"
        />
        <BoardDockAction
          icon="folder-add" label="Folder" a11yLabel="Add folder"
          onPress={handleDockAddFolder} kind="neutral"
        />
      </>
    ),
    folderExpanded: () => (
      <>
        <BoardDockAction
          icon="back-out" label="Back"
          a11yLabel="Back"
          a11yHint="Go back one board"
          onPress={handleDockBack} kind="neutral"
        />
        <BoardDockAction
          icon="dock-add" label="Add"
          a11yLabel="Add item"
          a11yHint="Opens add options"
          onPress={handleDockAddToggle}
          isToggle
        />
        <View onLayout={handleSortAnchorLayout}>
          <BoardDockAction
            icon="sort" label="Sort"
            a11yLabel="Sort tiles"
            a11yHint="Opens sort options above this button"
            onPress={toggleSortMenu}
            kind="neutral"
            isToggle
            isActive={sortMenuVisible}
          />
        </View>
        <View onLayout={handleQuickAnchorLayout}>
          <Reanimated.View style={quickShakeStyle}>
            <BoardDockAction
              icon="quick" label="Quick"
              a11yLabel="Quick view"
              a11yHint="Scrolls to top and shows your Quick symbols. Manage appears above this button once Quick is on."
              onPress={handleQuickPress}
              kind="neutral"
              isToggle
              isActive={quickViewActive}
            />
            <Reanimated.View
              pointerEvents="none"
              style={[styles.quickErrorTint, quickTintStyle]}
            />
          </Reanimated.View>
        </View>
        {/* Manage moved to DockSubControls above Quick (Phase 2). */}
        <View onLayout={handleHideAnchorLayout}>
          <BoardDockAction
            icon="hide" label="Hide"
            a11yLabel="Hide controls"
            a11yHint="Choose to hide the nav bar, the control bar, or all"
            onPress={toggleHideMenu}
            kind="neutral"
            isToggle
            isActive={hideMenuVisible || navHidden}
          />
        </View>
      </>
    ),
    folderCollapsed: () => (
      <View style={styles.collapsedDockMount}>
        <View style={styles.collapsedDockPeek}>
          <BoardDockAction
            icon="toggle-bar"
            iconOnly
            size={DOCK_TOGGLE_SIZE}
            a11yLabel="Expand controls"
            a11yHint="Shows the board controls"
            onPress={handleFolderExpand}
            isToggle
          />
        </View>
      </View>
    ),
    editControls: () => (
      <>
        {/* Back — far left, only inside a folder. Returns to the previous
            board level WITHOUT exiting edit mode. */}
        {activeMode !== 'home' ? (
          <BoardDockAction
            icon="back-out" label="Back"
            a11yLabel="Back"
            a11yHint="Goes back one board without leaving edit mode"
            onPress={handleDockBack}
            kind="neutral"
          />
        ) : null}
        {/* Undo — safest recovery action, next (left). */}
        <BoardDockAction
          icon="undo" label="Undo"
          a11yLabel="Undo"
          a11yHint="Reverses the last board edit"
          onPress={handleUndoEdit}
          kind="neutral"
          disabled={undoStack.length === 0}
        />
        {/* Select / Unselect — controls the edit state. */}
        <View onLayout={handleSelectAnchorLayout}>
          <BoardDockAction
            icon="select"
            label={selectedTileIds.size > 0 ? 'Unselect' : 'Select'}
            a11yLabel={
              selectedTileIds.size > 0
                ? `Unselect ${selectedTileIds.size} selected tiles`
                : 'Select tiles'
            }
            a11yHint={
              selectedTileIds.size > 0
                ? 'Clears the current selection'
                : 'Tap tiles to select them'
            }
            onPress={handleEditToolSelectToggle}
            kind="neutral"
            isToggle
            isActive={activeEditTool === 'select'}
          />
        </View>
        {/* All / None — one tap to select or clear every tile on this
            board view. Only offered while Select is active. */}
        {activeEditTool === 'select' ? (
          <BoardDockAction
            icon="select"
            label={allTilesSelected ? 'None' : 'All'}
            a11yLabel={allTilesSelected ? 'Deselect all' : 'Select all'}
            a11yHint={
              allTilesSelected
                ? 'Clears the whole selection'
                : 'Selects every tile on this board'
            }
            onPress={handleSelectAllToggle}
            kind="neutral"
            isToggle
            isActive={allTilesSelected}
          />
        ) : null}
        {/* Move — acts on the selection, after Select. */}
        <View onLayout={handleMoveAnchorLayout}>
          <BoardDockAction
            icon="move" label="Move"
            a11yLabel="Move selected tiles"
            a11yHint="Then tap a folder as the destination"
            onPress={handleEditToolMove}
            kind="neutral"
            disabled={selectedTileIds.size === 0}
            isToggle
            isActive={activeEditTool === 'move'}
          />
        </View>
        {/* State-aware commit: Save only when there is something to save;
            otherwise a calm Cancel that just closes. */}
        {undoStack.length > 0 || layoutDirty ? (
          <BoardDockAction
            icon="checkmark" label="Save"
            a11yLabel="Save changes"
            a11yHint="Saves the board and closes editing"
            onPress={handleEditControlsSave} kind="primary"
          />
        ) : (
          <BoardDockAction
            icon="close" label="Cancel"
            a11yLabel="Close editing"
            a11yHint="Closes editing. No changes were made"
            onPress={handleEditControlsDone} kind="muted"
          />
        )}
      </>
    ),
    editDirty: () => (
      <>
        <BoardDockAction
          icon="close" label="Cancel"
          a11yLabel="Cancel changes"
          onPress={handleDockCancel} kind="muted"
        />
        <BoardDockAction
          icon="checkmark" label="Save"
          a11yLabel="Save changes"
          onPress={handleSaveEdit} kind="primary"
        />
      </>
    ),
    editClean: () => (
      <>
        {editFocusTileId ? (
          <BoardDockAction
            icon="remove" label="Delete"
            a11yLabel="Delete selected tile"
            onPress={handleDockDelete} kind="muted"
          />
        ) : null}
        <BoardDockAction
          icon="dock-add" label="Add"
          a11yLabel="Add item" a11yHint="Opens add options"
          onPress={handleDockAddPlus} kind="neutral"
        />
        {/* No changes yet in this resize session → Cancel, not Done/Save
            (state-aware commit labels). */}
        <BoardDockAction
          icon="close" label="Cancel"
          a11yLabel="Close layout editing"
          a11yHint="Closes layout editing. No changes were made"
          onPress={handleDockDone} kind="muted"
        />
      </>
    ),
  };

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
          onSpeak={handleStripSpeak}
          onBackspace={handleStripBackspace}
          onClearAll={clearMessage}
          onRemoveWord={handleStripRemoveWord}
          hapticsEnabled={state.accessibility.hapticsEnabled !== false}
          navVisible={showTopNav}
          onToggleNav={() => {
            hapticIfEnabled();
            // One native layout transition instead of a JS-driven height
            // animation — fixes the top-nav toggle lag (whole-board
            // re-layout no longer happens on every frame).
            if (!reduceMotion) {
              LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
            }
            setShowTopNav(value => !value);
          }}
        />

        <TopNav
          visible={showTopNav}
          activeTab={activeTab}
          onTabPress={handleTopTab}
        />

        {/* N-gram suggestion chip row REMOVED (Phase 3 — Suggested Next
            Word Removal). Board space is reclaimed for the tile grid. */}

        {/* Tap-outside overlay exits a clean edit session; when dirty it is a
            no-op so changes are never silently discarded (use Cancel/Save). */}
        {editMode ? (
          <Pressable
            style={StyleSheet.absoluteFillObject}
            onPress={handleOverlayPress}
            accessible={false}
            importantForAccessibility="no"
          />
        ) : null}

        {/* Board area: ScrollView (flex:1) + pinned bottom dock */}
        <View
          style={styles.boardArea}
          onLayout={e => setBoardAreaHeight(e.nativeEvent.layout.height)}
        >
          <ScrollView
            ref={scrollRef}
            style={[styles.board, { backgroundColor: t.colors.background }]}
            contentContainerStyle={[
              styles.boardContent,
              {
                paddingLeft:  insets.left  + TILE_LEFT_PADDING + Math.max(0, (availableWidth - boardWidth) / 2),
                paddingRight: insets.right + TILE_LEFT_PADDING + Math.max(0, (availableWidth - boardWidth) / 2),
                // Clear the floating (absolute) dock so the last tiles aren't hidden behind it.
                paddingBottom: DOCK_ACTION_SIZE + spacing.sm + DOCK_BOTTOM_GAP * 2,
              },
            ]}
          showsVerticalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={50}
          // Accidental-selection guard for Quick Manage: while a scroll
          // gesture is moving, tile taps must not toggle selection.
          onScrollBeginDrag={() => { isScrollingRef.current = true; }}
          onScrollEndDrag={() => { isScrollingRef.current = false; }}
          onMomentumScrollEnd={() => { isScrollingRef.current = false; }}
          bounces
          alwaysBounceVertical
        >
            {(() => {
              const colStep = tileSize + TILE_GAP;
              const rowStep = tileSize + TILE_V_GAP;
              const fineUnit = tileSize / 2;
              // Rows must count each tile's full footprint (anchor row +
              // coarse height), not just anchor slots — otherwise growing a
              // bottom-row tile taller doesn't extend the grid and the
              // background never refreshes under it.
              const tileRows = displayLayout.reduce(
                (m, p) =>
                  Math.max(m, Math.floor(p.slot / BOARD_COLUMNS) + coarseRows(p.fh)),
                0,
              );
              // Measured board area minus fixed chrome. The dock is always
              // visible (home shows the ">" toggle), so its height is
              // constant: one action row + top padding + bottom gap. Falls
              // back to an estimate before onLayout fires.
              const dockContentH = DOCK_ACTION_SIZE + spacing.sm + DOCK_BOTTOM_GAP;
              const measuredViewH = boardAreaHeight > 0
                ? boardAreaHeight - BOARD_TOP_GAP - 10 - dockContentH
                : screenHeight - MESSAGE_HEIGHT - BOARD_TOP_GAP - 100 - 50;
              const viewportRows = Math.max(1, Math.ceil(measuredViewH / rowStep));
              const gridRows = Math.max(tileRows, viewportRows);
              const totalGridSlots = gridRows * BOARD_COLUMNS;
              const gridH = gridRows * rowStep - TILE_V_GAP;
              const activeScanRow = scan?.activeRow == null ? null : scanRowSlots[scan.activeRow] ?? null;
              const scanRowRect: LayoutRectangle | null =
                scan?.enabled && scan.phase === 'row' && activeScanRow != null
                  ? {
                      x: 0,
                      y: activeScanRow * rowStep,
                      width: boardWidth - TILE_LEFT_PADDING * 2,
                      height: tileSize,
                    }
                  : null;
              return (
                <GestureDetector gesture={sweepPan}>
                <View style={{ width: boardWidth - TILE_LEFT_PADDING * 2, height: gridH, position: 'relative' }}>
                  <GridOverlay
                    cols={BOARD_COLUMNS}
                    totalSlots={totalGridSlots}
                    tileSize={tileSize}
                    gap={TILE_GAP}
                    rowGap={TILE_V_GAP}
                    opacity={gridOverlayOpacity}
                  />
                  {displayLayout.map((placement) => {
                    const tile = tileMapForMode.get(placement.id);
                    if (!tile) return null;
                    const col = placement.slot % BOARD_COLUMNS;
                    const row = Math.floor(placement.slot / BOARD_COLUMNS);
                    const w = placement.fw * fineUnit;
                    const h = placement.fh * fineUnit;
                    // ── Manage visual treatment ──────────────────────────
                    const manageSel = quickManageOpen && manageSelectedIds.has(tile.id);
                    return (
                      <View
                        key={tile.id}
                        style={{
                          position: 'absolute',
                          left: col * colStep,
                          top: row * rowStep,
                          width: w,
                          height: h,
                        }}
                      >
                        <BoardTileCell
                          tile={tile}
                          size={tileSize}
                          width={w}
                          height={h}
                          fw={placement.fw}
                          fh={placement.fh}
                          slot={placement.slot}
                          totalSlots={totalGridSlots}
                          onTilePress={handleTilePress}
                          resolved={resolvedSymbols.get(tile.id)}
                          editMode={editMode}
                          onLongPressEnterEdit={handleTileLongPress}
                          onMoveToSlot={handleMoveToSlot}
                          onAccessibilityReorder={handleAccessibilityReorder}
                          onHide={handleHide}
                          onResize={handleResize}
                          snapSlot={snapSlot}
                          dragSourceSlot={dragSourceSlot}
                          dragFw={dragFw}
                          dragFh={dragFh}
                          dragFingerAbsY={dragFingerAbsY}
                          jiggle={jiggle}
                          onEditTap={motorAccessEnabled ? handleMotorAccessMenu : undefined}
                          resizeHandlesVisible={selectedLayoutTileId === tile.id}
                          onLayoutSelect={handleLayoutSelect}
                          selectable={quickManageOpen || (editControlsOpen && activeEditTool === 'select')}
                          isSelected={quickManageOpen ? manageSelectedIds.has(tile.id) : selectedTileIds.has(tile.id)}
                          moveDestinationMode={editControlsOpen && activeEditTool === 'move'}
                          isFavourite={favouriteIds.includes(tile.id)}
                          speaksOnPress={state.accessibility.wordSpeechMode !== 'sentence'}
                        />
                        {editMode && state.showUsageHeatmap && (state.tileTapCounts[tile.id] ?? 0) > 0 && (
                          <View
                            style={{
                              position: 'absolute',
                              top: 4,
                              right: 4,
                              minWidth: 20,
                              height: 20,
                              borderRadius: 10,
                              backgroundColor: t.colors.primary,
                              alignItems: 'center',
                              justifyContent: 'center',
                              paddingHorizontal: 4,
                              pointerEvents: 'none',
                              zIndex: 10,
                            }}
                            accessibilityLabel={`${state.tileTapCounts[tile.id]} taps`}
                          >
                            <Text style={{ color: '#FFFFFF', fontSize: 10, fontWeight: '700' }}>
                              {state.tileTapCounts[tile.id]}
                            </Text>
                          </View>
                        )}
                        {/* Manage — selected tiles wear a blue selection tint. */}
                        {manageSel ? (
                          <View
                            pointerEvents="none"
                            style={[styles.quickTileOverlay, {
                              borderStyle: 'solid',
                              borderWidth: 2,
                              borderColor: '#0A84FF',
                              backgroundColor: 'rgba(10, 132, 255, 0.14)',
                            }]}
                          />
                        ) : null}
                      </View>
                    );
                  })}
                  <ScanHighlight rect={scanRowRect} variant="row" />
                  {editMode ? (
                    <>
                      <DragPlaceholder
                        snapSlot={snapSlot}
                        dragFw={dragFw}
                        dragFh={dragFh}
                        tileSize={tileSize}
                        gap={TILE_GAP}
                        rowGap={TILE_V_GAP}
                        cols={BOARD_COLUMNS}
                      />
                      <SourceGhost
                        dragSourceSlot={dragSourceSlot}
                        tileSize={tileSize}
                        gap={TILE_GAP}
                        rowGap={TILE_V_GAP}
                        cols={BOARD_COLUMNS}
                      />
                    </>
                  ) : null}
                </View>
                </GestureDetector>
              );
            })()}
          </ScrollView>

          {/* ── Top Sub Control (item 5) ─────────────────────────────────
              Secondary control layer near the top of the board area with
              even spacing left / right / top. Only appears in edit mode so
              the Bottom Control Bar stays uncrowded. Calm and light: soft
              surface, existing tokens, no harsh colour or heavy shadow. */}
          {editControlsOpen ? (
            <View
              pointerEvents="none"
              accessibilityLiveRegion="polite"
              style={[
                styles.topSubControl,
                {
                  backgroundColor: t.isDark ? t.colors.navBackground : '#FFFFFF',
                  borderColor: t.colors.symbolOutline,
                },
              ]}
            >
              <Text
                style={[styles.topSubControlText, { color: t.colors.text }]}
                numberOfLines={1}
                maxFontSizeMultiplier={1.4}
              >
                {selectedTileIds.size > 0
                  ? `${selectedTileIds.size} selected`
                  : activeEditTool === 'move'
                    ? 'Tap a folder to move items into it'
                    : activeEditTool === 'select'
                      ? 'Tap symbols to select them'
                      : 'Editing — choose Select to begin'}
              </Text>
            </View>
          ) : null}

          {/* ── Unified contextual dock (fixed, outside the ScrollView) ── */}
          <RNAnimated.View
            accessibilityRole="toolbar"
            accessibilityLabel="Board actions"
            // While slid away, keep the offscreen buttons out of the
            // VoiceOver order — the restore handle is the only target.
            accessibilityElementsHidden={dockHidden}
            importantForAccessibility={dockHidden ? 'no-hide-descendants' : 'auto'}
            pointerEvents={dockHidden ? 'none' : 'auto'}
            style={[
              styles.boardDock,
              {
                paddingBottom: DOCK_BOTTOM_GAP,
                opacity: dockFade,
                transform: [
                  {
                    translateX:
                      !reduceMotion &&
                      (dockMode === 'homeExpanded' || dockMode === 'homeCollapsed')
                        ? dockFade.interpolate({ inputRange: [0, 1], outputRange: [-12, 0] })
                        : 0,
                  },
                  {
                    // "Hide" slide — fully offscreen; the DockPeekPill takes
                    // over as the persistent, visible way back (item 4 v2).
                    translateX: dockSlide.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, -(width + spacing.lg)],
                    }),
                  },
                ],
              },
            ]}
          >
            {/* Sort popover — persistent, anchored just above the Sort action. */}
            <DockPopover
              visible={
                sortMenuVisible &&
                (dockMode === 'homeExpanded' || dockMode === 'folderExpanded')
              }
              anchorX={sortAnchor.x}
              anchorWidth={sortAnchor.width}
              a11yLabel="Sort options"
              options={[
                {
                  key: 'type',
                  label: 'Type',
                  a11yLabel: activeSort === 'type' ? 'Remove sort by type' : 'Sort by type',
                  selected: activeSort === 'type',
                  onPress: () => handleSortOption('type'),
                },
                {
                  key: 'name',
                  label: 'Name',
                  a11yLabel: activeSort === 'name' ? 'Remove sort by name' : 'Sort by name',
                  selected: activeSort === 'name',
                  onPress: () => handleSortOption('name'),
                },
                {
                  key: 'category',
                  label: 'Category',
                  a11yLabel: activeSort === 'category' ? 'Remove sort by category' : 'Sort by category',
                  selected: activeSort === 'category',
                  onPress: () => handleSortOption('category'),
                },
              ]}
            />
            {/* Hide popover — vertical options above the Hide action. */}
            <DockPopover
              visible={
                hideMenuVisible &&
                (dockMode === 'homeExpanded' || dockMode === 'folderExpanded')
              }
              anchorX={hideAnchor.x}
              anchorWidth={hideAnchor.width}
              a11yLabel="Hide options"
              options={[
                {
                  key: 'nav',
                  label: 'Nav Bar',
                  a11yLabel: navHidden ? 'Show navigation bar' : 'Hide navigation bar',
                  selected: navHidden,
                  onPress: handleHideNavBar,
                },
                {
                  key: 'dock',
                  label: 'Control Bar',
                  a11yLabel: 'Hide control bar',
                  onPress: handleHideDock,
                },
                {
                  key: 'all',
                  label: 'All',
                  a11yLabel: 'Hide all controls',
                  onPress: handleHideAll,
                },
              ]}
            />
            {/* Select pop-up — appears from Select/Unselect when items are
                selected. Bottom-to-top: (button) → Delete → Duplicate →
                Favourite, so the array below is top-to-bottom. */}
            <DockPopover
              visible={
                dockMode === 'editControls' &&
                selectedTileIds.size > 0 &&
                activeEditTool !== 'move'
              }
              anchorX={selectAnchor.x}
              anchorWidth={selectAnchor.width}
              a11yLabel="Selection actions"
              options={[
                {
                  key: 'favourite',
                  label: selectedAllFavourites ? 'Unfavourite' : 'Favourite',
                  a11yLabel: selectedAllFavourites
                    ? 'Remove selected from favourites'
                    : 'Add selected to favourites',
                  selected: selectedAllFavourites,
                  onPress: handleEditToolFavourite,
                },
                {
                  key: 'duplicate',
                  label: 'Duplicate',
                  a11yLabel: 'Duplicate selected symbols',
                  onPress: handleEditToolDuplicate,
                },
                {
                  key: 'delete',
                  label: 'Delete',
                  a11yLabel: 'Delete selected symbols',
                  onPress: handleEditToolDelete,
                },
              ]}
            />
            {/* Move pop-up — Group places all selected into one new folder. */}
            <DockPopover
              visible={
                dockMode === 'editControls' &&
                activeEditTool === 'move' &&
                selectedTileIds.size > 0
              }
              anchorX={moveAnchor.x}
              anchorWidth={moveAnchor.width}
              a11yLabel="Move actions"
              options={[
                {
                  key: 'group',
                  label: 'Group',
                  a11yLabel: 'Group selected symbols into one folder',
                  onPress: handleEditToolGroup,
                },
              ]}
            />
            {/* Quick → Manage sub-control (Phase 2). Square control that
                sits directly above the Quick dock button after Quick is
                pressed. Replaces both the old floating green pill and the
                dock-row Manage button. Uses the reusable DockSubControls
                layer so any future dock control can adopt the same
                anchor-and-stack pattern without new plumbing. */}
            <DockSubControls
              visible={manageSubControlVisible}
              anchorX={quickAnchor.x}
              anchorWidth={quickAnchor.width}
              a11yLabel="Quick options"
              controls={[
                {
                  key: 'manage',
                  icon: 'select',
                  label: 'Manage',
                  a11yLabel: 'Manage Quick symbols',
                  a11yHint: 'Choose which symbols appear in Quick, then tap Done',
                  onPress: handleManagePress,
                  kind: 'primary',
                },
              ]}
            />
            <View
              style={[
                styles.dockRow,
                { paddingLeft: dockPadLeft, paddingRight: dockPadRight },
              ]}
            >
              {/* Single dispatch — the concrete JSX for every dock mode
                  lives in `dockRenderers` declared above (Phase 2 —
                  Default Dock Configuration Isolation). */}
              {dockRenderers[dockMode]?.() ?? null}
            </View>
          </RNAnimated.View>

          {/* ── Hidden-dock peek pill (item 4 v2) ─────────────────────────
              While the control bar is slid away, a soft visible pill hugs
              the lower-left edge so the user always has an obvious way
              back — no fine motor precision needed (hitSlop widens it).
              Tap restores everything; long-press offers partial toggles. */}
          {dockHidden ? (
            <>
              <DockPeekPill
                onPress={peekMenuVisible ? () => setPeekMenuVisible(false) : handleChromeRestore}
                onLongPress={handlePeekLongPress}
              />
              <DockPopover
                visible={peekMenuVisible}
                anchorX={0}
                anchorWidth={120}
                a11yLabel="Hide options"
                options={[
                  {
                    key: 'dock',
                    label: 'Control Bar',
                    a11yLabel: 'Show control bar',
                    selected: dockHidden,
                    onPress: handlePeekToggleDock,
                  },
                  {
                    key: 'nav',
                    label: 'Nav Bar',
                    a11yLabel: navHidden ? 'Show navigation bar' : 'Hide navigation bar',
                    selected: navHidden,
                    onPress: handleHideNavBar,
                  },
                ]}
              />
            </>
          ) : null}
        </View>

        {/* ── Undo toast (Rule 26) ─────────────────────────────────────── */}
        {undoToast ? (
          <View style={styles.undoToast} accessibilityRole="alert" accessibilityLiveRegion="polite">
            <Text style={styles.undoToastText}>Tile removed</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Undo remove tile"
              onPress={handleUndoHide}
              hitSlop={12}
              style={styles.undoToastButton}
            >
              <Text style={styles.undoToastButtonText}>Undo</Text>
            </Pressable>
          </View>
        ) : null}

        <View pointerEvents="none" style={styles.ghostOverlay}>
          {ghosts.map(ghost => (
            <GhostTileClone key={ghost.id} ghost={ghost} onDone={finishGhost} />
          ))}
        </View>
      </View>

      {/* ── Add Symbol / Folder modals (Priority 2) ───────────────────── */}
      <AddSymbolModal
        visible={addSymbolModalVisible}
        onDismiss={() => setAddSymbolModalVisible(false)}
        onAdd={handleAddSymbolConfirm}
        onCreateCustom={handleOpenCustomSymbolEditor}
        onAddPack={handleAddSymbolPack}
      />
      <CustomSymbolEditor
        visible={customSymbolEditorVisible}
        onDismiss={() => setCustomSymbolEditorVisible(false)}
        onDone={handleCustomSymbolDone}
        canAddToFolder={activeMode !== 'home'}
        onAddToFolder={handleCustomSymbolDone}
      />
      <AddFolderModal
        visible={addFolderModalVisible}
        onDismiss={() => setAddFolderModalVisible(false)}
        onAdd={handleAddFolderConfirm}
        placementOptions={folderPlacementOptions}
        initialParentBoardKey={activeMode}
      />
    </SafeAreaView>
  );
}
