// ─── EditModeOverlay — edit-mode visual layers ───────────────────────────────
// Extracted from app/(tabs)/talk.tsx (God-screen split, problem #1).
//
// These are the four Reanimated-driven overlays that render behind, over, and
// around tiles while the board is in Edit / Move mode. All animation runs on
// the UI thread via SharedValue reads — no component here dispatches or reads
// context, so re-renders don't touch the tile grid.
//
// Exports:
//   • GridOverlay      — dashed slot outlines behind all tiles.
//   • DragPlaceholder  — highlighted target slot (multi-cell aware).
//   • MultiCell        — one highlight cell inside DragPlaceholder (memoised).
//   • SourceGhost      — low-opacity outline at the slot the drag left behind.
//
// The parent (talk.tsx) owns the SharedValues (snapSlot, dragFw/Fh,
// dragSourceSlot, opacity) and threads them in as props. Keep it that way —
// these leaves must remain pure so a resize/drag doesn't remount the grid.

import React from 'react';
import { StyleSheet, View } from 'react-native';
import Reanimated, {
  SharedValue,
  useAnimatedStyle,
} from 'react-native-reanimated';

import { MAX_FW, TILE_CORNER_RADIUS } from '../constants';

// ── GridOverlay ──────────────────────────────────────────────────────────────

/** Dashed slot outlines behind tiles. Opacity fades on the UI thread. */
export function GridOverlay({
  cols,
  totalSlots,
  tileSize,
  gap,
  rowGap,
  opacity,
  alwaysVisible = false,
}: {
  cols: number;
  totalSlots: number;
  tileSize: number;
  gap: number;
  rowGap?: number;
  opacity: SharedValue<number>;
  alwaysVisible?: boolean;
}) {
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: alwaysVisible ? 1 : opacity.value,
  }));
  const colStep = tileSize + gap;
  const rowStep = tileSize + (rowGap ?? gap);

  return (
    <Reanimated.View
      pointerEvents="none"
      style={[StyleSheet.absoluteFillObject, animatedStyle]}
    >
      {Array.from({ length: totalSlots }).map((_, slot) => {
        const col = slot % cols;
        const row = Math.floor(slot / cols);
        return (
          <View
            key={slot}
            style={{
              position: 'absolute',
              left: col * colStep,
              top: row * rowStep,
              width: tileSize,
              height: tileSize,
              borderWidth: 1.5,
              borderStyle: 'dashed',
              borderRadius: TILE_CORNER_RADIUS,
              borderColor: alwaysVisible
                ? 'rgba(120, 140, 200, 0.38)'
                : 'rgba(100, 130, 255, 0.55)',
              backgroundColor: alwaysVisible
                ? 'rgba(120, 140, 200, 0.06)'
                : 'rgba(100, 130, 255, 0.08)',
            }}
          />
        );
      })}
    </Reanimated.View>
  );
}

// ── MultiCell ────────────────────────────────────────────────────────────────

/** One highlight cell inside DragPlaceholder — visible only when inside the
 *  dragged tile's coarse footprint. Driven by dragFw/dragFh so cell count
 *  matches the tile's size on drag start. */
export function MultiCell({
  c, r, dragFw, dragFh, tileSize, colStep, rowStep,
}: {
  c: number;
  r: number;
  dragFw: SharedValue<number>;
  dragFh: SharedValue<number>;
  tileSize: number;
  colStep: number;
  rowStep: number;
}) {
  const style = useAnimatedStyle(() => {
    const cCols = Math.max(1, Math.ceil(dragFw.value / 2));
    const cRows = Math.max(1, Math.ceil(dragFh.value / 2));
    const active = c < cCols && r < cRows;
    return { opacity: active ? 1 : 0 };
  });
  return (
    <Reanimated.View
      pointerEvents="none"
      style={[
        {
          position: 'absolute',
          left: c * colStep,
          top: r * rowStep,
          width: tileSize,
          height: tileSize,
          borderRadius: TILE_CORNER_RADIUS,
          borderWidth: 2.5,
          borderStyle: 'dashed',
          borderColor: 'rgba(60, 120, 255, 0.65)',
          backgroundColor: 'rgba(60, 120, 255, 0.10)',
        },
        style,
      ]}
    />
  );
}

// ── DragPlaceholder ──────────────────────────────────────────────────────────

/** Highlighted target slot tracking the drag snap. Multi-cell aware. */
export function DragPlaceholder({
  snapSlot,
  dragFw,
  dragFh,
  tileSize,
  gap,
  rowGap,
  cols,
}: {
  snapSlot: SharedValue<number>;
  dragFw: SharedValue<number>;
  dragFh: SharedValue<number>;
  tileSize: number;
  gap: number;
  rowGap?: number;
  cols: number;
}) {
  const colStep = tileSize + gap;
  const rowStep = tileSize + (rowGap ?? gap);

  const wrapperStyle = useAnimatedStyle(() => {
    if (snapSlot.value < 0) return { opacity: 0, transform: [] };
    const col = snapSlot.value % cols;
    const row = Math.floor(snapSlot.value / cols);
    return {
      opacity: 1,
      transform: [
        { translateX: col * colStep },
        { translateY: row * rowStep },
      ],
    };
  });

  const cellsStyle = useAnimatedStyle(() => {
    const cCols = Math.max(1, Math.ceil(dragFw.value / 2));
    const cRows = Math.max(1, Math.ceil(dragFh.value / 2));
    return {
      width: cCols * colStep - gap,
      height: cRows * rowStep - (rowGap ?? gap),
    };
  });

  const maxC = Math.ceil(MAX_FW / 2);

  return (
    <Reanimated.View
      pointerEvents="none"
      style={[
        { position: 'absolute', left: 0, top: 0 },
        wrapperStyle,
        cellsStyle,
      ]}
    >
      {Array.from({ length: maxC * maxC }).map((_, i) => {
        const c = i % maxC;
        const r = Math.floor(i / maxC);
        return (
          <MultiCell
            key={i}
            c={c}
            r={r}
            dragFw={dragFw}
            dragFh={dragFh}
            tileSize={tileSize}
            colStep={colStep}
            rowStep={rowStep}
          />
        );
      })}
    </Reanimated.View>
  );
}

// ── SourceGhost ──────────────────────────────────────────────────────────────

/** Low-opacity outline at the slot the drag left behind. */
export function SourceGhost({
  dragSourceSlot: sourceSlot,
  tileSize,
  gap,
  rowGap,
  cols,
}: {
  dragSourceSlot: SharedValue<number>;
  tileSize: number;
  gap: number;
  rowGap?: number;
  cols: number;
}) {
  const colStep = tileSize + gap;
  const rowStep = tileSize + (rowGap ?? gap);

  const animatedStyle = useAnimatedStyle(() => {
    if (sourceSlot.value < 0) return { opacity: 0, transform: [] };
    const col = sourceSlot.value % cols;
    const row = Math.floor(sourceSlot.value / cols);
    return {
      opacity: 1,
      transform: [
        { translateX: col * colStep },
        { translateY: row * rowStep },
      ],
    };
  });

  return (
    <Reanimated.View
      pointerEvents="none"
      style={[
        {
          position: 'absolute',
          left: 0,
          top: 0,
          width: tileSize,
          height: tileSize,
          borderRadius: TILE_CORNER_RADIUS,
          borderWidth: 1.5,
          borderStyle: 'dashed',
          borderColor: 'rgba(180, 180, 200, 0.45)',
          backgroundColor: 'rgba(180, 180, 200, 0.08)',
        },
        animatedStyle,
      ]}
    />
  );
}
