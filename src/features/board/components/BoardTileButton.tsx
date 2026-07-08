import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { AccessibilityActionEvent, Animated as RNAnimated, Pressable, View, type LayoutRectangle } from 'react-native';
import Reanimated, {
  Easing as ReanimatedEasing,
  runOnJS,
  SharedValue,
  useAnimatedReaction,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { Icon } from '../../../components/native/Icon';
import { useReduceMotion } from '../../../hooks/useReduceMotion';
import { animation } from '../../../theme/tokens';
import { useTheme } from '../../../theme/useTheme';
import { hapticSelection } from '../../../utils/haptics';
import { ScanHighlight, useScanning, useScanTarget } from '../../scanning';
import type { ResolvedSymbol } from '../../symbol-brain/resolveSymbolForKeyword';
import { tileA11yProps, type TileA11yMode } from '../tileA11y';
import { BOARD_COLUMNS, TILE_GAP, TILE_V_GAP } from '../talk/constants';
import { styles } from '../talk/styles';
import type { BoardTile, WindowRect } from '../talk/types';
import { BoardNavTile } from './BoardNavTile';
import { BoardFolderTile, BoardWordTile } from './TileRenderer';
import { ResizeHandles } from './ResizeHandles';

interface BoardTileButtonProps {
  tile: BoardTile;
  /** Coarse slot size (88) — used for drag-snap grid math. */
  size: number;
  /** Actual visual width (default = size). Enables non-square resized tiles. */
  width?: number;
  /** Actual visual height (default = size). */
  height?: number;
  /** Width in FINE units (44px each). Default 2 = 88px. */
  fw?: number;
  /** Height in FINE units (44px each). Default 2 = 88px. */
  fh?: number;
  onPress: (rect: WindowRect | null) => void;
  onMeasuredPress?: () => void;
  resolved?: ResolvedSymbol;
  // ── Drag + edit-mode plumbing ──
  editMode?: boolean;
  onLongPressEnterEdit?: (tileId: string) => void;
  /** Slot index of this tile in the grid (0-based, row-major). */
  slot?: number;
  /** Total tile count for clamping the snap target. */
  totalSlots?: number;
  /** Called on the JS thread after the tile springs to its new slot. */
  onMoveToSlot?: (tileId: string, targetSlot: number) => void;
  /** Shared value written on every drag frame so DragPlaceholder tracks snap target. */
  snapSlot?: SharedValue<number>;
  /** Shared value set to this tile's slot when it starts dragging, cleared on drop. */
  dragSourceSlot?: SharedValue<number>;
  /** Written to on drag start: the dragged tile's fw/fh so DragPlaceholder highlights match its footprint. */
  dragFw?: SharedValue<number>;
  dragFh?: SharedValue<number>;
  /** Written on each pan frame — used by TalkScreen's auto-scroll loop. */
  dragFingerAbsY?: SharedValue<number>;
  onHide?: (tile: BoardTile) => void;
  onAccessibilityReorder?: (tileId: string, direction: 'forward' | 'back') => void;
  /** Called when the user commits a resize via the corner/edge handles. */
  onResize?: (tileId: string, newFw: number, newFh: number, dCols: number, dRows: number) => void;
  /** Layout Mode: show handles only after this tile is selected. */
  resizeHandlesVisible?: boolean;
  /** Layout Mode: tap selects which tile owns the resize handles. */
  onLayoutSelect?: (tileId: string) => void;
  jiggle?: SharedValue<number>;
  /** Motor Access Mode: called on tile tap in edit mode for action sheet (Priority 5). */
  onEditTap?: (tileId: string) => void;
  /** Select Mode: draws the circular outline + tick overlay. */
  selectable?: boolean;
  /** Whether this tile is currently selected (drives the blue tick). */
  isSelected?: boolean;
  /** Move Mode: highlight folder tiles as tappable destinations. */
  moveDestinationMode?: boolean;
  /** Favourite: draws a small star badge (pinned to the top of the board). */
  isFavourite?: boolean;
  /** Whether activating a word tile also starts app speech immediately. */
  speaksOnPress?: boolean;
}

function BoardTileButton({
  tile,
  size,
  width,
  height,
  fw = 2,
  fh = 2,
  onPress,
  onMeasuredPress,
  resolved,
  editMode = false,
  onLongPressEnterEdit,
  slot = 0,
  totalSlots = 1,
  onMoveToSlot,
  snapSlot,
  dragSourceSlot,
  dragFw,
  dragFh,
  dragFingerAbsY,
  onHide,
  onAccessibilityReorder,
  onResize,
  resizeHandlesVisible = false,
  onLayoutSelect,
  jiggle,
  onEditTap,
  selectable = false,
  isSelected = false,
  moveDestinationMode = false,
  isFavourite = false,
  speaksOnPress = false,
}: BoardTileButtonProps) {
  // Actual visual dimensions default to a square of `size` for backwards
  // compatibility with existing single-slot tiles.
  const tileWidth = width ?? size;
  const tileHeightPx = height ?? size;
  const t = useTheme();
  const pressableRef = useRef<View>(null);
  const scale = useRef(new RNAnimated.Value(1)).current;
  const tileOpacity = useRef(new RNAnimated.Value(1)).current;
  const reduceMotion = useReduceMotion();
  const scan = useScanning();

  // ── Drag state (Reanimated SVs so the gesture runs on the UI thread)
  const dragX = useSharedValue(0);
  const dragY = useSharedValue(0);
  const lifted = useSharedValue(0);
  // ── Live-displacement state ────────────────────────────────────────────
  // Non-dragging tiles spring to the dragger's source slot when they are
  // the hover target. This is the iOS app-rearrange "shuffle" behaviour:
  // tile B moves into tile A's spot while A hovers over B. Release commits
  // the data swap; leaving the hover springs B back to its home slot.
  const displaceX = useSharedValue(0);
  const displaceY = useSharedValue(0);

  // ── Live-swap slot tracking ────────────────────────────────────────────
  // currentSlotSV mirrors the `slot` prop on the UI thread so the pan
  // gesture can always read the latest slot without being recreated on
  // every live swap (which would drop the gesture mid-drag).
  const currentSlotSV = useSharedValue(slot);
  // lastSwapSlotSV gates runOnJS calls — only fires when the hover target
  // genuinely crosses a new slot boundary.
  const lastSwapSlotSV = useSharedValue(-1);

  // Keep currentSlotSV in sync with the prop (runs on JS thread, fast).
  useEffect(() => {
    currentSlotSV.value = slot;
  }, [slot, currentSlotSV]);

  // After a swap commits and the `slot` prop changes, the absolutely-
  // positioned container moves to the new slot's coords. We must snap
  // dragX/dragY back to 0 so the tile renders AT the new slot, not
  // offset from it. Otherwise the leftover gesture translation stacks
  // on top of the new slot position — a 2-row drag visually looks like
  // a 4-row drag.
  const prevSlotRef = useRef(slot);
  useLayoutEffect(() => {
    const prev = prevSlotRef.current;
    prevSlotRef.current = slot;
    if (prev !== slot) {
      dragX.value = 0;
      dragY.value = 0;
      // Also snap displacement to 0 — after a commit the displaced tile
      // is now AT the source slot for real, no offset needed.
      displaceX.value = 0;
      displaceY.value = 0;
    }
  });

  // ── Live shuffle reaction ─────────────────────────────────────────────
  // Watches snapSlot + dragSourceSlot. When this tile is the hover target
  // and is NOT the one being dragged, spring it to the dragger's source
  // slot. When the hover leaves, spring back to home.
  //
  // CRITICAL: reaction dependencies are ENCODED AS PRIMITIVES (a packed
  // integer for X, one for Y), not objects. Returning `{ snap, src, ... }`
  // creates a new object every read, and Reanimated's default equality
  // check (Object.is) treats every new reference as a change — that
  // restarts withSpring on every frame and the tile never converges to
  // its displaced position until the drag ends. Primitives fire the
  // reaction ONLY on genuine transitions.
  const SHUFFLE_SPRING = { damping: 18, stiffness: 220, mass: 0.6 } as const;

  // Encode "where should I visually sit right now?" as a single number.
  // Any tile-relevant state change (snap crosses into or out of this
  // tile, drag source changes, dragger status flips) produces a distinct
  // packed value. `useDerivedValue` runs on the UI thread and only
  // notifies dependents when the value changes.
  const targetDX = useDerivedValue(() => {
    if (lifted.value > 0.1) return 0; // I'm the dragger — no displacement
    const snap = snapSlot ? snapSlot.value : -1;
    const src = dragSourceSlot ? dragSourceSlot.value : -1;
    const mine = currentSlotSV.value;
    if (snap < 0 || src < 0) return 0;
    if (snap !== mine) return 0;    // hover is on a different tile
    if (src === mine) return 0;     // dragger hovering its own home
    const myCol = mine % BOARD_COLUMNS;
    const srcCol = src % BOARD_COLUMNS;
    return (srcCol - myCol) * (size + TILE_GAP);
  });
  const targetDY = useDerivedValue(() => {
    if (lifted.value > 0.1) return 0;
    const snap = snapSlot ? snapSlot.value : -1;
    const src = dragSourceSlot ? dragSourceSlot.value : -1;
    const mine = currentSlotSV.value;
    if (snap < 0 || src < 0) return 0;
    if (snap !== mine) return 0;
    if (src === mine) return 0;
    const myRow = Math.floor(mine / BOARD_COLUMNS);
    const srcRow = Math.floor(src / BOARD_COLUMNS);
    return (srcRow - myRow) * (size + TILE_V_GAP);
  });

  useAnimatedReaction(
    () => targetDX.value,
    (target, prev) => {
      if (target !== prev) {
        displaceX.value = withSpring(target, SHUFFLE_SPRING);
      }
    },
  );
  useAnimatedReaction(
    () => targetDY.value,
    (target, prev) => {
      if (target !== prev) {
        displaceY.value = withSpring(target, SHUFFLE_SPRING);
      }
    },
  );

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
  // Split the "can this tile show edit visuals?" concern from the "is the
  // Pan gesture allowed to activate?" concern. Resize Mode (editMode)
  // enables the outline, handles, and jiggle. The Pan gesture below is
  // ALSO enabled in this mode, but it uses `activateAfterLongPress` so it
  // only picks up the tile after a *second* long press — normal finger
  // drags in Resize Mode fall through to the ScrollView so the board can
  // still scroll. See board_control_bar.md and Step 2 of the refactor.
  const canShowEditAffordance = editMode && !isNav;
  const canStartDrag = editMode && !isNav;
  // All tiles are perfectly square: the gesture area, wrapper, and content
  // all match `size`. This prevents the old 1.25× height wrapper from
  // overflowing into the row below and misaligning the grid.
  const tileHeight = tileHeightPx;

  const handlePress = useCallback(() => {
    // Select Mode / Move Mode: forward the press up (the parent's
    // handleTilePress decides whether to toggle selection or route to a
    // destination folder). Speech / folder navigation are already gated
    // upstream, so this is safe to call unconditionally.
    if (selectable || moveDestinationMode) {
      onPress(null);
      return;
    }
    if (editMode) {
      onLayoutSelect?.(tile.id);
      // Motor Access Mode: tile taps show context menu instead of doing nothing
      if (onEditTap) { onEditTap(tile.id); return; }
      return;
    }
    onMeasuredPress?.();
    pressableRef.current?.measureInWindow((x, y, width, height) => {
      onPress({ x, y, width, height });
    });
  }, [editMode, moveDestinationMode, onEditTap, onLayoutSelect, onMeasuredPress, onPress, selectable, tile.id]);

  const scanTarget = useMemo(() => ({
    id: tile.id,
    rowIndex: Math.floor(slot / BOARD_COLUMNS),
    columnIndex: slot % BOARD_COLUMNS,
    onSelect: handlePress,
    accessibilityLabel: tile.kind === 'folder' && !isNav ? `Open ${tile.label}` : tile.label,
    group: 'talk-board',
  }), [handlePress, isNav, slot, tile.id, tile.kind, tile.label]);
  useScanTarget(scanTarget, [scanTarget]);

  const scanHighlightRect = useMemo<LayoutRectangle>(() => ({
    x: 0,
    y: 0,
    width: tileWidth,
    height: tileHeight,
  }), [tileHeight, tileWidth]);
  const isScanActive = !!scan?.enabled && scan.phase === 'column' && scan.activeTargetId === tile.id;

  // ── Drag gesture — swap on release, no spring/rubber-band ────────────────
  // Uses currentSlotSV so the gesture closure is never recreated mid-drag.
  // Swap is committed only on release for precise, intentional placement.
  const SNAP_TIMING = { duration: 160, easing: ReanimatedEasing.out(ReanimatedEasing.quad) } as const;

  // Single JS callback fired from the timing-end worklet. Commits the
  // swap, then defers clearing snapSlot / dragSourceSlot to the next
  // animation frame — by then React has committed the new slot props
  // and each tile's useLayoutEffect has hard-reset displaceX/Y to 0.
  // Clearing earlier would let the shuffle reaction fire a redundant
  // spring-back animation on the displaced tile, causing a visual jitter.
  const finalizeSwap = useCallback((tileId: string, target: number) => {
    onMoveToSlot?.(tileId, target);
    requestAnimationFrame(() => {
      if (snapSlot) snapSlot.value = -1;
      if (dragSourceSlot) dragSourceSlot.value = -1;
    });
  }, [onMoveToSlot, snapSlot, dragSourceSlot]);

  const pan = useMemo(() => Gesture.Pan()
    .enabled(canStartDrag)
    // Second long press picks up the tile. Without this, ANY finger drag
    // in Resize Mode moves the tile — which blocks the user from scrolling
    // the board while editing. `activateAfterLongPress` makes the pan wait
    // for a 280ms hold before it activates, so short/normal drags fall
    // through to the enclosing ScrollView and the board scrolls normally.
    // See board_control_bar.md and Step 2/3 of the refactor spec.
    .activateAfterLongPress(280)
    .onStart(() => {
      lifted.value = withTiming(1, { duration: 100 });
      // Record source slot — drives both the SourceGhost outline AND
      // the live-shuffle reaction in sibling tiles.
      if (dragSourceSlot) dragSourceSlot.value = currentSlotSV.value;
      // Publish the dragged tile's size so DragPlaceholder highlights match.
      if (dragFw) dragFw.value = fw;
      if (dragFh) dragFh.value = fh;
      // Start "hovering own slot" so the first slot crossing is detected
      // cleanly and no stale snapSlot from a previous drag bleeds in.
      if (snapSlot) snapSlot.value = currentSlotSV.value;
      // Haptic on pickup — matches iOS app-rearrange "lift" feedback.
      runOnJS(hapticSelection)();
    })
    .onUpdate((e) => {
      dragX.value = e.translationX;
      dragY.value = e.translationY;
      // Publish absolute finger Y for the parent's auto-scroll loop.
      if (dragFingerAbsY) dragFingerAbsY.value = e.absoluteY;

      // Compute snap target and update DragPlaceholder + hover-dim effect.
      // Multi-slot tiles (fw>2 or fh>2) can't go past the right edge or
      // bottom edge — their coarse footprint (cCols × cRows) must fit.
      const mySlot = currentSlotSV.value;
      const myCol = mySlot % BOARD_COLUMNS;
      const myRow = Math.floor(mySlot / BOARD_COLUMNS);
      const maxRow = Math.floor((totalSlots - 1) / BOARD_COLUMNS);
      const colStep = size + TILE_GAP;
      const rowStep = size + TILE_V_GAP;
      const cCols = Math.max(1, Math.ceil(fw / 2));
      const cRows = Math.max(1, Math.ceil(fh / 2));
      const tCol = Math.max(0, Math.min(BOARD_COLUMNS - cCols,
        Math.round(myCol + e.translationX / colStep)));
      const tRow = Math.max(0, Math.min(maxRow - (cRows - 1),
        Math.round(myRow + e.translationY / rowStep)));
      const hoverSlot = Math.min(totalSlots - 1, tRow * BOARD_COLUMNS + tCol);
      if (snapSlot) {
        // Fire a selection-style haptic each time the hover crosses a
        // new slot boundary (excluding our own home slot). lastSwapSlotSV
        // gates duplicates so we don't fire on every frame.
        if (hoverSlot !== snapSlot.value && hoverSlot !== mySlot) {
          runOnJS(hapticSelection)();
        }
        snapSlot.value = hoverSlot;
      }
    })
    .onEnd((_e) => {
      const mySlot = currentSlotSV.value;
      const myCol = mySlot % BOARD_COLUMNS;
      const myRow = Math.floor(mySlot / BOARD_COLUMNS);
      const colStep = size + TILE_GAP;
      const rowStep = size + TILE_V_GAP;

      // Use the LAST highlighted snapSlot (computed fresh each onUpdate frame)
      // rather than re-deriving from e.translationX/Y — finger-lift drift
      // can shift the translation by a few px, putting the target one slot off.
      const snapped = snapSlot && snapSlot.value >= 0 ? snapSlot.value : mySlot;
      const target = snapped;
      const tCol = target % BOARD_COLUMNS;
      const tRow = Math.floor(target / BOARD_COLUMNS);

      lifted.value = withTiming(0, { duration: 120 });

      if (target !== mySlot && onMoveToSlot) {
        // Glide to target slot, then commit swap. snapSlot/dragSourceSlot
        // are KEPT until the commit lands so the displaced tile stays at
        // the source position. Once slot props update, each tile's
        // useLayoutEffect resets its own displacement to 0 cleanly.
        const dX = (tCol - myCol) * colStep;
        const dY = (tRow - myRow) * rowStep;
        dragX.value = withTiming(dX, SNAP_TIMING);
        dragY.value = withTiming(dY, SNAP_TIMING, (finished) => {
          if (!finished) return;
          runOnJS(finalizeSwap)(tile.id, target);
        });
      } else {
        // Return cleanly to home slot.
        if (snapSlot) snapSlot.value = -1;
        if (dragSourceSlot) dragSourceSlot.value = -1;
        dragX.value = withTiming(0, SNAP_TIMING);
        dragY.value = withTiming(0, SNAP_TIMING);
      }
      // Auto-scroll loop should stop the moment the finger is up.
      if (dragFingerAbsY) dragFingerAbsY.value = -1;
    })
    // fw/fh MUST be deps — without them a resized tile publishes stale
    // dragFw/dragFh on its next drag and the highlight stays one cell.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    , [currentSlotSV, dragSourceSlot, dragX, dragY, finalizeSwap, canStartDrag, lifted, onMoveToSlot, size, snapSlot, tile.id, totalSlots, fw, fh, dragFw, dragFh]);

  const animatedDragStyle = useAnimatedStyle(() => {
    // Jiggle drives a continuous gentle wobble during edit mode.
    // We only rotate when NOT dragging so the dragged tile stays visually stable.
    const rotateDeg = (!canShowEditAffordance || lifted.value < 0.1) && jiggle
      ? jiggle.value
      : 0;
    return {
      transform: [
        // Drag offset (only set on the dragger) + shuffle displacement
        // (only set on hovered-over tiles). They never both apply.
        { translateX: dragX.value + displaceX.value },
        { translateY: dragY.value + displaceY.value },
        { scale: 1 + lifted.value * 0.06 },
        { rotate: `${rotateDeg}deg` },
      ],
      zIndex: lifted.value > 0 ? 100 : 1,
    };
  });

  const handleAccessibilityAction = useCallback((event: AccessibilityActionEvent) => {
    if (event.nativeEvent.actionName === 'increment') {
      onAccessibilityReorder?.(tile.id, 'forward');
    } else if (event.nativeEvent.actionName === 'decrement') {
      onAccessibilityReorder?.(tile.id, 'back');
    } else if (event.nativeEvent.actionName === 'longpress') {
      onLongPressEnterEdit?.(tile.id);
    } else if (event.nativeEvent.actionName === 'remove') {
      onHide?.(tile);
    }
  }, [onAccessibilityReorder, onHide, onLongPressEnterEdit, tile]);

  const tileA11yMode: TileA11yMode = selectable
    ? 'select'
    : moveDestinationMode
      ? 'move'
      : editMode
        ? 'layout'
        : 'normal';
  const tileA11y = useMemo(() => tileA11yProps(tile, {
    mode: tileA11yMode,
    isSelected: selectable ? isSelected : resizeHandlesVisible,
    isNav,
    speaksOnPress,
    canOpenEditMenu: !editMode && !selectable && !moveDestinationMode && Boolean(onLongPressEnterEdit),
    canReorder: canShowEditAffordance && Boolean(onAccessibilityReorder),
    canRemove: canShowEditAffordance && Boolean(onHide) && !tile.isProtected,
  }), [
    canShowEditAffordance,
    editMode,
    isNav,
    isSelected,
    moveDestinationMode,
    onAccessibilityReorder,
    onHide,
    onLongPressEnterEdit,
    resizeHandlesVisible,
    selectable,
    speaksOnPress,
    tile,
    tileA11yMode,
  ]);

  const tileContent = (
    <>
      {isNav ? (
        <BoardNavTile tile={tile} size={size} />
      ) : tile.kind === 'folder' ? (
        <BoardFolderTile tile={tile} width={tileWidth} height={tileHeightPx} resolved={resolved} />
      ) : (
        <BoardWordTile tile={tile} width={tileWidth} height={tileHeightPx} resolved={resolved} />
      )}
      {canShowEditAffordance && onHide && !tile.isProtected ? (
        <Pressable
          accessible={false}
          accessibilityRole="button"
          accessibilityLabel={`Remove ${tile.label}`}
          accessibilityElementsHidden
          importantForAccessibility="no"
          onPress={() => onHide(tile)}
          hitSlop={10}
          style={[styles.deleteBadge, { backgroundColor: t.colors.danger }]}
        >
          <Icon name="close" size={16} color={t.colors.surface} />
        </Pressable>
      ) : null}
      {/* ── Favourite badge ─────────────────────────────────────────────
          Small calm star, top-left, so pinned tiles are recognisable at a
          glance without relying on their board position alone. */}
      {isFavourite && !isNav ? (
        <View
          pointerEvents="none"
          style={[styles.favouriteBadge, { backgroundColor: 'rgba(255,255,255,0.9)' }]}
        >
          <Icon name="star" size={14} color={t.colors.primary} strokeWidth={2.4} />
        </View>
      ) : null}
      {/* ── Select Mode overlay ─────────────────────────────────────────
          Unselected: soft circular outline (calm dark neutral). Selected:
          filled blue circle with a large tick. The overlay is
          pointerEvents="none" so the underlying Pressable stays the tap
          target. Positioned to overlap tile content enough to be obvious
          without hiding the label (principle 23: not colour alone —
          shape + icon carry the state too). */}
      {selectable && !isNav ? (
        <View
          pointerEvents="none"
          style={[
            styles.selectIndicator,
            {
              borderColor: isSelected ? t.colors.primary : t.colors.textMuted,
              backgroundColor: isSelected ? t.colors.primary : 'rgba(255,255,255,0.85)',
            },
          ]}
        >
          {isSelected ? (
            <Icon name="checkmark" size={20} color="#FFFFFF" strokeWidth={4} />
          ) : null}
        </View>
      ) : null}
      {/* ── Move Mode destination hint ──────────────────────────────────
          Only folder tiles are valid destinations. A soft dashed blue
          outline nudges the user without changing the folder's own art. */}
      {moveDestinationMode && tile.kind === 'folder' && !isNav ? (
        <View
          pointerEvents="none"
          style={[
            styles.moveDestinationOutline,
            { borderColor: t.colors.primary },
          ]}
        />
      ) : null}
    </>
  );

  const inner = (
    <Reanimated.View
      style={[
        { width: tileWidth, height: tileHeight, position: 'relative' },
        animatedDragStyle,
      ]}
    >
      <RNAnimated.View style={{ flex: 1, transform: [{ scale }], opacity: tileOpacity }}>
        <Pressable
          ref={pressableRef}
          {...tileA11y}
          onAccessibilityAction={handleAccessibilityAction}
          onPress={handlePress}
          onLongPress={!editMode && !isNav && !selectable && !moveDestinationMode ? () => onLongPressEnterEdit?.(tile.id) : undefined}
          delayLongPress={450}
          onPressIn={() => !editMode && animateTo(0.94)}
          onPressOut={() => !editMode && animateTo(1)}
          style={({ pressed: _pressed }) => [
            styles.tilePressable,
            canShowEditAffordance && [styles.tileEditOutline, { borderColor: t.colors.primary }],
          ]}
        >
          {tileContent}
        </Pressable>
      </RNAnimated.View>
      <ScanHighlight rect={isScanActive ? scanHighlightRect : null} variant="column" />
      {/* Resize handles — visible in edit mode, absolute-positioned around
          the tile edges. All 4 edges + 4 corners are functional; left/top
          shift the anchor slot in whole cells. Nav tiles skip handles. */}
      {editMode && resizeHandlesVisible && !isNav && onResize ? (
        <ResizeHandles
          editMode={editMode}
          width={tileWidth}
          height={tileHeight}
          fw={fw}
          fh={fh}
          fineUnit={size / 2}
          isDragging={lifted}
          tileLabel={tile.label}
          onResize={(newFw, newFh, dCols, dRows) => onResize(tile.id, newFw, newFh, dCols, dRows)}
        />
      ) : null}
    </Reanimated.View>
  );

  if (canStartDrag) {
    return <GestureDetector gesture={pan}>{inner}</GestureDetector>;
  }
  return inner;
}

const MemoBoardTileButton = React.memo(BoardTileButton);

export const BoardTileCell = React.memo(function BoardTileCell({
  tile,
  size,
  width,
  height,
  fw,
  fh,
  slot,
  totalSlots,
  resolved,
  onTilePress,
  editMode,
  onLongPressEnterEdit,
  onMoveToSlot,
  onHide,
  onResize,
  snapSlot,
  dragSourceSlot,
  dragFw,
  dragFh,
  dragFingerAbsY,
  jiggle,
  onEditTap,
  resizeHandlesVisible,
  onLayoutSelect,
  selectable,
  isSelected,
  moveDestinationMode,
  isFavourite,
  speaksOnPress,
  onAccessibilityReorder,
}: {
  tile: BoardTile;
  size: number;
  width?: number;
  height?: number;
  fw?: number;
  fh?: number;
  slot?: number;
  totalSlots?: number;
  resolved?: ResolvedSymbol;
  onTilePress: (tile: BoardTile, rect: WindowRect | null) => void;
  editMode?: boolean;
  onLongPressEnterEdit?: (tileId: string) => void;
  onMoveToSlot?: (tileId: string, targetSlot: number) => void;
  onHide?: (tile: BoardTile) => void;
  onResize?: (tileId: string, newFw: number, newFh: number, dCols: number, dRows: number) => void;
  snapSlot?: SharedValue<number>;
  dragSourceSlot?: SharedValue<number>;
  dragFw?: SharedValue<number>;
  dragFh?: SharedValue<number>;
  dragFingerAbsY?: SharedValue<number>;
  jiggle?: SharedValue<number>;
  onEditTap?: (tileId: string) => void;
  resizeHandlesVisible?: boolean;
  onLayoutSelect?: (tileId: string) => void;
  selectable?: boolean;
  isSelected?: boolean;
  moveDestinationMode?: boolean;
  isFavourite?: boolean;
  speaksOnPress?: boolean;
  onAccessibilityReorder?: (tileId: string, direction: 'forward' | 'back') => void;
}) {
  const handlePress = useCallback(
    (rect: WindowRect | null) => onTilePress(tile, rect),
    [onTilePress, tile],
  );
  return (
    <MemoBoardTileButton
      tile={tile}
      size={size}
      width={width}
      height={height}
      fw={fw}
      fh={fh}
      slot={slot}
      totalSlots={totalSlots}
      onPress={handlePress}
      resolved={resolved}
      editMode={editMode}
      onLongPressEnterEdit={onLongPressEnterEdit}
      onMoveToSlot={onMoveToSlot}
      onHide={onHide}
      onResize={onResize}
      snapSlot={snapSlot}
      dragSourceSlot={dragSourceSlot}
      dragFw={dragFw}
      dragFh={dragFh}
      dragFingerAbsY={dragFingerAbsY}
      jiggle={jiggle}
      onEditTap={onEditTap}
      resizeHandlesVisible={resizeHandlesVisible}
      onLayoutSelect={onLayoutSelect}
      selectable={selectable}
      isSelected={isSelected}
      moveDestinationMode={moveDestinationMode}
      isFavourite={isFavourite}
      speaksOnPress={speaksOnPress}
      onAccessibilityReorder={onAccessibilityReorder}
    />
  );
});
