import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Reanimated, {
  runOnJS,
  SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useReduceMotion } from '../../../hooks/useReduceMotion';
import { useTheme } from '../../../theme/useTheme';
import { hapticSelection } from '../../../utils/haptics';
import {
  HANDLE_CORNER_SIZE,
  HANDLE_PILL_LEN,
  HANDLE_PILL_THICK,
  MAX_FW,
} from '../talk/constants';

export function ResizeHandles({
  editMode,
  width,
  height,
  fw,
  fh,
  fineUnit,
  onResize,
  isDragging: _isDragging,
  tileLabel,
}: {
  editMode: boolean;
  width: number;
  height: number;
  fw: number;
  fh: number;
  /** Half-tile snap unit — tileSize / 2 from the live board grid. */
  fineUnit: number;
  /**
   * dCols/dRows — coarse cells the tile's anchor moves LEFT/UP (positive
   * when growing from the left/top edge, negative when shrinking back).
   * The parent clamps against the grid edges and commits the slot shift.
   */
  onResize: (newFw: number, newFh: number, dCols: number, dRows: number) => void;
  isDragging: SharedValue<number>;
  tileLabel: string;
}) {
  const t = useTheme();
  const reduceMotion = useReduceMotion();
  const cellSize = fineUnit * 2;

  // Preview offsets — shared values that grow/shrink the tile visually
  // during drag before the resize is committed to state.
  const previewW = useSharedValue(0); // right edge (FINE steps)
  const previewH = useSharedValue(0); // bottom edge (FINE steps)
  const previewL = useSharedValue(0); // left edge (CELL steps, negative = grow)
  const previewT = useSharedValue(0); // top edge (CELL steps, negative = grow)
  // Track last-fired haptic step so we only pulse on step crossings.
  const lastHapticStepW = useSharedValue(0);
  const lastHapticStepH = useSharedValue(0);
  const lastHapticStepL = useSharedValue(0);
  const lastHapticStepT = useSharedValue(0);

  const rightPan = useMemo(() => Gesture.Pan()
    .onStart(() => { previewW.value = 0; lastHapticStepW.value = 0; })
    .onUpdate((e) => {
      const steps = Math.round(e.translationX / fineUnit);
      if (steps !== lastHapticStepW.value) {
        lastHapticStepW.value = steps;
        runOnJS(hapticSelection)();
      }
      previewW.value = steps * fineUnit;
    })
    .onEnd(() => {
      const deltaSteps = Math.round(previewW.value / fineUnit);
      const newFw = Math.max(2, Math.min(MAX_FW, fw + deltaSteps));
      previewW.value = reduceMotion ? 0 : withTiming(0, { duration: 120 });
      if (newFw !== fw) runOnJS(onResize)(newFw, fh, 0, 0);
    })
  , [fw, fh, onResize, previewW]);

  const bottomPan = useMemo(() => Gesture.Pan()
    .onStart(() => { previewH.value = 0; lastHapticStepH.value = 0; })
    .onUpdate((e) => {
      const steps = Math.round(e.translationY / fineUnit);
      if (steps !== lastHapticStepH.value) {
        lastHapticStepH.value = steps;
        runOnJS(hapticSelection)();
      }
      previewH.value = steps * fineUnit;
    })
    .onEnd(() => {
      const deltaSteps = Math.round(previewH.value / fineUnit);
      const newFh = Math.max(2, Math.min(MAX_FW, fh + deltaSteps));
      previewH.value = reduceMotion ? 0 : withTiming(0, { duration: 120 });
      if (newFh !== fh) runOnJS(onResize)(fw, newFh, 0, 0);
    })
  , [fw, fh, onResize, previewH]);

  const cornerPan = useMemo(() => Gesture.Pan()
    .onStart(() => {
      previewW.value = 0; previewH.value = 0;
      lastHapticStepW.value = 0; lastHapticStepH.value = 0;
    })
    .onUpdate((e) => {
      const sw = Math.round(e.translationX / fineUnit);
      const sh = Math.round(e.translationY / fineUnit);
      if (sw !== lastHapticStepW.value || sh !== lastHapticStepH.value) {
        lastHapticStepW.value = sw;
        lastHapticStepH.value = sh;
        runOnJS(hapticSelection)();
      }
      previewW.value = sw * fineUnit;
      previewH.value = sh * fineUnit;
    })
    .onEnd(() => {
      const dw = Math.round(previewW.value / fineUnit);
      const dh = Math.round(previewH.value / fineUnit);
      const newFw = Math.max(2, Math.min(MAX_FW, fw + dw));
      const newFh = Math.max(2, Math.min(MAX_FW, fh + dh));
      previewW.value = withTiming(0, { duration: 120 });
      previewH.value = withTiming(0, { duration: 120 });
      if (newFw !== fw || newFh !== fh) runOnJS(onResize)(newFw, newFh, 0, 0);
    })
  , [fw, fh, onResize, previewW, previewH]);

  // ── Left / top edges — anchor-shifting, whole-cell steps ──
  const leftPan = useMemo(() => Gesture.Pan()
    .onStart(() => { previewL.value = 0; lastHapticStepL.value = 0; })
    .onUpdate((e) => {
      const steps = Math.round(-e.translationX / cellSize); // + = grow leftwards
      if (steps !== lastHapticStepL.value) {
        lastHapticStepL.value = steps;
        runOnJS(hapticSelection)();
      }
      previewL.value = -steps * cellSize;
    })
    .onEnd(() => {
      const cells = Math.round(-previewL.value / cellSize);
      previewL.value = reduceMotion ? 0 : withTiming(0, { duration: 120 });
      const newFw = Math.max(2, Math.min(MAX_FW, fw + cells * 2));
      const applied = (newFw - fw) / 2;
      if (applied !== 0) runOnJS(onResize)(newFw, fh, applied, 0);
    })
  , [fw, fh, onResize, previewL, reduceMotion, lastHapticStepL]);

  const topPan = useMemo(() => Gesture.Pan()
    .onStart(() => { previewT.value = 0; lastHapticStepT.value = 0; })
    .onUpdate((e) => {
      const steps = Math.round(-e.translationY / cellSize); // + = grow upwards
      if (steps !== lastHapticStepT.value) {
        lastHapticStepT.value = steps;
        runOnJS(hapticSelection)();
      }
      previewT.value = -steps * cellSize;
    })
    .onEnd(() => {
      const cells = Math.round(-previewT.value / cellSize);
      previewT.value = reduceMotion ? 0 : withTiming(0, { duration: 120 });
      const newFh = Math.max(2, Math.min(MAX_FW, fh + cells * 2));
      const applied = (newFh - fh) / 2;
      if (applied !== 0) runOnJS(onResize)(fw, newFh, 0, applied);
    })
  , [fw, fh, onResize, previewT, reduceMotion, lastHapticStepT]);

  // ── Remaining corners — combine the two adjacent edge behaviours ──
  const tlCornerPan = useMemo(() => Gesture.Pan()
    .onStart(() => {
      previewL.value = 0; previewT.value = 0;
      lastHapticStepL.value = 0; lastHapticStepT.value = 0;
    })
    .onUpdate((e) => {
      const sc = Math.round(-e.translationX / cellSize);
      const sr = Math.round(-e.translationY / cellSize);
      if (sc !== lastHapticStepL.value || sr !== lastHapticStepT.value) {
        lastHapticStepL.value = sc;
        lastHapticStepT.value = sr;
        runOnJS(hapticSelection)();
      }
      previewL.value = -sc * cellSize;
      previewT.value = -sr * cellSize;
    })
    .onEnd(() => {
      const cCells = Math.round(-previewL.value / cellSize);
      const rCells = Math.round(-previewT.value / cellSize);
      previewL.value = reduceMotion ? 0 : withTiming(0, { duration: 120 });
      previewT.value = reduceMotion ? 0 : withTiming(0, { duration: 120 });
      const newFw = Math.max(2, Math.min(MAX_FW, fw + cCells * 2));
      const newFh = Math.max(2, Math.min(MAX_FW, fh + rCells * 2));
      const dCols = (newFw - fw) / 2;
      const dRows = (newFh - fh) / 2;
      if (dCols !== 0 || dRows !== 0) runOnJS(onResize)(newFw, newFh, dCols, dRows);
    })
  , [fw, fh, onResize, previewL, previewT, reduceMotion, lastHapticStepL, lastHapticStepT]);

  const trCornerPan = useMemo(() => Gesture.Pan()
    .onStart(() => {
      previewW.value = 0; previewT.value = 0;
      lastHapticStepW.value = 0; lastHapticStepT.value = 0;
    })
    .onUpdate((e) => {
      const sw = Math.round(e.translationX / fineUnit);
      const sr = Math.round(-e.translationY / cellSize);
      if (sw !== lastHapticStepW.value || sr !== lastHapticStepT.value) {
        lastHapticStepW.value = sw;
        lastHapticStepT.value = sr;
        runOnJS(hapticSelection)();
      }
      previewW.value = sw * fineUnit;
      previewT.value = -sr * cellSize;
    })
    .onEnd(() => {
      const dw = Math.round(previewW.value / fineUnit);
      const rCells = Math.round(-previewT.value / cellSize);
      previewW.value = reduceMotion ? 0 : withTiming(0, { duration: 120 });
      previewT.value = reduceMotion ? 0 : withTiming(0, { duration: 120 });
      const newFw = Math.max(2, Math.min(MAX_FW, fw + dw));
      const newFh = Math.max(2, Math.min(MAX_FW, fh + rCells * 2));
      const dRows = (newFh - fh) / 2;
      if (newFw !== fw || dRows !== 0) runOnJS(onResize)(newFw, newFh, 0, dRows);
    })
  , [fw, fh, onResize, previewW, previewT, reduceMotion, lastHapticStepW, lastHapticStepT]);

  const blCornerPan = useMemo(() => Gesture.Pan()
    .onStart(() => {
      previewL.value = 0; previewH.value = 0;
      lastHapticStepL.value = 0; lastHapticStepH.value = 0;
    })
    .onUpdate((e) => {
      const sc = Math.round(-e.translationX / cellSize);
      const sh = Math.round(e.translationY / fineUnit);
      if (sc !== lastHapticStepL.value || sh !== lastHapticStepH.value) {
        lastHapticStepL.value = sc;
        lastHapticStepH.value = sh;
        runOnJS(hapticSelection)();
      }
      previewL.value = -sc * cellSize;
      previewH.value = sh * fineUnit;
    })
    .onEnd(() => {
      const cCells = Math.round(-previewL.value / cellSize);
      const dh = Math.round(previewH.value / fineUnit);
      previewL.value = reduceMotion ? 0 : withTiming(0, { duration: 120 });
      previewH.value = reduceMotion ? 0 : withTiming(0, { duration: 120 });
      const newFw = Math.max(2, Math.min(MAX_FW, fw + cCells * 2));
      const newFh = Math.max(2, Math.min(MAX_FW, fh + dh));
      const dCols = (newFw - fw) / 2;
      if (dCols !== 0 || newFh !== fh) runOnJS(onResize)(newFw, newFh, dCols, 0);
    })
  , [fw, fh, onResize, previewL, previewH, reduceMotion, lastHapticStepL, lastHapticStepH]);

  // Style: right pill follows the tile's right edge + previewW growth
  const rightPillStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: previewW.value }],
  }));
  const bottomPillStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: previewH.value }],
  }));
  const brCornerStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: previewW.value },
      { translateY: previewH.value },
    ],
  }));
  const leftPillStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: previewL.value }],
  }));
  const topPillStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: previewT.value }],
  }));
  const tlCornerStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: previewL.value },
      { translateY: previewT.value },
    ],
  }));
  const trCornerStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: previewW.value },
      { translateY: previewT.value },
    ],
  }));
  const blCornerStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: previewL.value },
      { translateY: previewH.value },
    ],
  }));

  if (!editMode) return null;

  const handleColor = t.colors.primary;
  const handleBg = t.colors.surface;

  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="box-none">
      {/* Right edge pill — functional */}
      <GestureDetector gesture={rightPan}>
        <Reanimated.View
          hitSlop={12}
          accessible
          accessibilityRole="adjustable"
          accessibilityLabel={`Resize ${tileLabel} width`}
          style={[
            {
              position: 'absolute',
              right: -HANDLE_PILL_THICK / 2,
              top: height / 2 - HANDLE_PILL_LEN / 2,
              width: HANDLE_PILL_THICK,
              height: HANDLE_PILL_LEN,
              borderRadius: HANDLE_PILL_THICK / 2,
              backgroundColor: handleBg,
              borderWidth: 2,
              borderColor: handleColor,
            },
            rightPillStyle,
          ]}
        />
      </GestureDetector>

      {/* Bottom edge pill — functional */}
      <GestureDetector gesture={bottomPan}>
        <Reanimated.View
          hitSlop={12}
          accessible
          accessibilityRole="adjustable"
          accessibilityLabel={`Resize ${tileLabel} height`}
          style={[
            {
              position: 'absolute',
              bottom: -HANDLE_PILL_THICK / 2,
              left: width / 2 - HANDLE_PILL_LEN / 2,
              width: HANDLE_PILL_LEN,
              height: HANDLE_PILL_THICK,
              borderRadius: HANDLE_PILL_THICK / 2,
              backgroundColor: handleBg,
              borderWidth: 2,
              borderColor: handleColor,
            },
            bottomPillStyle,
          ]}
        />
      </GestureDetector>

      {/* Bottom-right corner — functional (grows both dimensions) */}
      <GestureDetector gesture={cornerPan}>
        <Reanimated.View
          hitSlop={10}
          accessible
          accessibilityRole="adjustable"
          accessibilityLabel={`Resize ${tileLabel}`}
          style={[
            {
              position: 'absolute',
              right: -HANDLE_CORNER_SIZE / 2,
              bottom: -HANDLE_CORNER_SIZE / 2,
              width: HANDLE_CORNER_SIZE,
              height: HANDLE_CORNER_SIZE,
              borderRadius: HANDLE_CORNER_SIZE / 2,
              backgroundColor: handleColor,
              borderWidth: 2,
              borderColor: handleBg,
            },
            brCornerStyle,
          ]}
        />
      </GestureDetector>

      {/* Left edge pill — functional (whole-cell steps, shifts anchor) */}
      <GestureDetector gesture={leftPan}>
        <Reanimated.View
          hitSlop={12}
          accessible
          accessibilityRole="adjustable"
          accessibilityLabel={`Resize ${tileLabel} from the left edge`}
          style={[
            {
              position: 'absolute',
              left: -HANDLE_PILL_THICK / 2,
              top: height / 2 - HANDLE_PILL_LEN / 2,
              width: HANDLE_PILL_THICK,
              height: HANDLE_PILL_LEN,
              borderRadius: HANDLE_PILL_THICK / 2,
              backgroundColor: handleBg,
              borderWidth: 2,
              borderColor: handleColor,
            },
            leftPillStyle,
          ]}
        />
      </GestureDetector>

      {/* Top edge pill — functional (whole-cell steps, shifts anchor) */}
      <GestureDetector gesture={topPan}>
        <Reanimated.View
          hitSlop={12}
          accessible
          accessibilityRole="adjustable"
          accessibilityLabel={`Resize ${tileLabel} from the top edge`}
          style={[
            {
              position: 'absolute',
              top: -HANDLE_PILL_THICK / 2,
              left: width / 2 - HANDLE_PILL_LEN / 2,
              width: HANDLE_PILL_LEN,
              height: HANDLE_PILL_THICK,
              borderRadius: HANDLE_PILL_THICK / 2,
              backgroundColor: handleBg,
              borderWidth: 2,
              borderColor: handleColor,
            },
            topPillStyle,
          ]}
        />
      </GestureDetector>

      {/* Top-left corner — functional */}
      <GestureDetector gesture={tlCornerPan}>
        <Reanimated.View
          hitSlop={10}
          accessible
          accessibilityRole="adjustable"
          accessibilityLabel={`Resize ${tileLabel} from the top left corner`}
          style={[
            {
              position: 'absolute',
              left: -HANDLE_CORNER_SIZE / 2,
              top: -HANDLE_CORNER_SIZE / 2,
              width: HANDLE_CORNER_SIZE,
              height: HANDLE_CORNER_SIZE,
              borderRadius: HANDLE_CORNER_SIZE / 2,
              backgroundColor: handleColor,
              borderWidth: 2,
              borderColor: handleBg,
            },
            tlCornerStyle,
          ]}
        />
      </GestureDetector>

      {/* Top-right corner — functional */}
      <GestureDetector gesture={trCornerPan}>
        <Reanimated.View
          hitSlop={10}
          accessible
          accessibilityRole="adjustable"
          accessibilityLabel={`Resize ${tileLabel} from the top right corner`}
          style={[
            {
              position: 'absolute',
              right: -HANDLE_CORNER_SIZE / 2,
              top: -HANDLE_CORNER_SIZE / 2,
              width: HANDLE_CORNER_SIZE,
              height: HANDLE_CORNER_SIZE,
              borderRadius: HANDLE_CORNER_SIZE / 2,
              backgroundColor: handleColor,
              borderWidth: 2,
              borderColor: handleBg,
            },
            trCornerStyle,
          ]}
        />
      </GestureDetector>

      {/* Bottom-left corner — functional */}
      <GestureDetector gesture={blCornerPan}>
        <Reanimated.View
          hitSlop={10}
          accessible
          accessibilityRole="adjustable"
          accessibilityLabel={`Resize ${tileLabel} from the bottom left corner`}
          style={[
            {
              position: 'absolute',
              left: -HANDLE_CORNER_SIZE / 2,
              bottom: -HANDLE_CORNER_SIZE / 2,
              width: HANDLE_CORNER_SIZE,
              height: HANDLE_CORNER_SIZE,
              borderRadius: HANDLE_CORNER_SIZE / 2,
              backgroundColor: handleColor,
              borderWidth: 2,
              borderColor: handleBg,
            },
            blCornerStyle,
          ]}
        />
      </GestureDetector>
    </View>
  );
}
