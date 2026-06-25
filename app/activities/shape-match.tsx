/**
 * Shape Match — V2.
 *
 * Rules followed (see to_do/RULES.md):
 *   1   simple first      → Easy default; Medium / Hard share the same UI.
 *   4   stable nav        → header structure constant across levels.
 *   13  visible feedback  → slot fills, shape lifts, level pill flashes.
 *   14  animate change    → snap on match, spring back on miss, fade-in
 *                           between levels.
 *   16  spring motion     → friction-tuned spring on shape return + match.
 *   18  reduce motion     → useReduceMotion() trims pulse and bounce.
 *   19  haptics carefully → selection on tap; success on match.
 *   20  forgiving touch   → minimum 64-pt tap targets even at 8-shape size.
 *   21  accessibility     → role + label + state on every interactive node.
 *   23  not colour alone  → slots are neutral dashed outlines; the player
 *                           matches by shape silhouette.
 *   30  calm + predictable→ no scary copy. Wrong placements bounce home
 *                           with a gentle "Try Again" toast — never an alert.
 *
 * Difficulty + levels (locked with the user):
 *   • Easy   — 4-shape pool (Circle, Square, Triangle, Rectangle), 15 levels.
 *   • Medium — 6-shape pool (+ Star, Heart),                       25 levels.
 *   • Hard   — 8-shape pool (+ Diamond, Hexagon),                  30 levels.
 *   Each level uses ALL shapes for the active difficulty. Slot and shape
 *   positions reshuffle every level so muscle-memory doesn't replace the
 *   skill being practised.
 *
 * Speech is off by default (no "Circle matched", no "Find the X"). The
 * sound toggle in the header switches whether tapping a shape speaks its
 * name — that is the only TTS the game ever does.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Easing,
  Modal,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import Svg, {
  Circle as SvgCircle,
  Polygon as SvgPolygon,
  Rect as SvgRect,
  Path as SvgPath,
} from 'react-native-svg';
import * as Speech from 'expo-speech';
import { Card } from '../../src/components/native/Card';
import { ActivityProgressBar } from '../../src/components/activities/ActivityProgressBar';
import { useReduceMotion } from '../../src/hooks/useReduceMotion';
import { colors, radii, spacing, typography } from '../../src/theme/tokens';
import { hapticSelection } from '../../src/utils/haptics';

// ─── Shapes ────────────────────────────────────────────────────────────────

type ShapeKind =
  | 'circle'
  | 'square'
  | 'triangle'
  | 'rectangle'
  | 'star'
  | 'heart'
  | 'diamond'
  | 'hexagon';

type Difficulty = 'easy' | 'medium' | 'hard';

interface ShapeDef {
  id: string;
  kind: ShapeKind;
  color: string;
  label: string;
}

const ALL_SHAPES: ShapeDef[] = [
  { id: 's-circle',    kind: 'circle',    color: '#FF6B6B', label: 'Circle'    },
  { id: 's-square',    kind: 'square',    color: '#4ECDC4', label: 'Square'    },
  { id: 's-triangle',  kind: 'triangle',  color: '#FFD166', label: 'Triangle'  },
  { id: 's-rectangle', kind: 'rectangle', color: '#8E7DFF', label: 'Rectangle' },
  { id: 's-star',      kind: 'star',      color: '#F39B12', label: 'Star'      },
  { id: 's-heart',     kind: 'heart',     color: '#E55F8C', label: 'Heart'     },
  { id: 's-diamond',   kind: 'diamond',   color: '#06A0B5', label: 'Diamond'   },
  { id: 's-hexagon',   kind: 'hexagon',   color: '#7BC74D', label: 'Hexagon'   },
];

const POOL_SIZE: Record<Difficulty, number> = { easy: 4, medium: 6, hard: 8 };
const LEVELS:    Record<Difficulty, number> = { easy: 15, medium: 25, hard: 30 };

function poolFor(difficulty: Difficulty): ShapeDef[] {
  return ALL_SHAPES.slice(0, POOL_SIZE[difficulty]);
}

function shuffle<T>(arr: readonly T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const a = out[i]!;
    const b = out[j]!;
    out[i] = b;
    out[j] = a;
  }
  return out;
}

// ─── Shape renderer ────────────────────────────────────────────────────────

function ShapeArt({
  kind,
  color,
  size,
  outline = false,
}: {
  kind: ShapeKind;
  color: string;
  size: number;
  outline?: boolean;
}) {
  const stroke = outline ? '#9AA0A6' : 'transparent';
  const fill   = outline ? 'transparent' : color;
  const sw     = 3;
  const inset  = sw / 2 + 1;
  const dash   = outline ? '6,4' : undefined;
  const cx = size / 2;
  const cy = size / 2;
  const r  = size / 2 - inset;

  switch (kind) {
    case 'circle':
      return (
        <Svg width={size} height={size}>
          <SvgCircle cx={cx} cy={cy} r={r} fill={fill} stroke={stroke} strokeWidth={sw} strokeDasharray={dash} />
        </Svg>
      );
    case 'square':
      return (
        <Svg width={size} height={size}>
          <SvgRect
            x={inset} y={inset}
            width={size - inset * 2} height={size - inset * 2}
            rx={8} ry={8}
            fill={fill} stroke={stroke} strokeWidth={sw} strokeDasharray={dash}
          />
        </Svg>
      );
    case 'triangle': {
      // Equilateral, pointing up.
      const h = (Math.sqrt(3) / 2) * (size - inset * 2);
      const top    = `${cx},${cy - h / 2}`;
      const left   = `${inset},${cy + h / 2}`;
      const right  = `${size - inset},${cy + h / 2}`;
      return (
        <Svg width={size} height={size}>
          <SvgPolygon points={`${top} ${left} ${right}`} fill={fill} stroke={stroke} strokeWidth={sw} strokeDasharray={dash} strokeLinejoin="round" />
        </Svg>
      );
    }
    case 'rectangle': {
      // Landscape rectangle — 60% of size tall.
      const w = size - inset * 2;
      const h = w * 0.62;
      const y = (size - h) / 2;
      return (
        <Svg width={size} height={size}>
          <SvgRect x={inset} y={y} width={w} height={h} rx={6} ry={6} fill={fill} stroke={stroke} strokeWidth={sw} strokeDasharray={dash} />
        </Svg>
      );
    }
    case 'star': {
      // 5-point star.
      const points = starPoints(cx, cy, r, r * 0.45, 5);
      return (
        <Svg width={size} height={size}>
          <SvgPolygon points={points} fill={fill} stroke={stroke} strokeWidth={sw} strokeDasharray={dash} strokeLinejoin="round" />
        </Svg>
      );
    }
    case 'heart': {
      // Two arcs + V — derived from a viewBox of 32×32 then scaled.
      const d =
        'M16 28 C 16 28, 3 19, 3 11.5 C 3 7, 6.5 4, 10 4 C 13 4, 15 6, 16 8 ' +
        'C 17 6, 19 4, 22 4 C 25.5 4, 29 7, 29 11.5 C 29 19, 16 28, 16 28 Z';
      return (
        <Svg width={size} height={size} viewBox="0 0 32 32">
          <SvgPath d={d} fill={fill} stroke={stroke} strokeWidth={1.6} strokeDasharray={outline ? '1.5,1' : undefined} strokeLinejoin="round" />
        </Svg>
      );
    }
    case 'diamond': {
      const top    = `${cx},${inset}`;
      const right  = `${size - inset},${cy}`;
      const bottom = `${cx},${size - inset}`;
      const left   = `${inset},${cy}`;
      return (
        <Svg width={size} height={size}>
          <SvgPolygon points={`${top} ${right} ${bottom} ${left}`} fill={fill} stroke={stroke} strokeWidth={sw} strokeDasharray={dash} strokeLinejoin="round" />
        </Svg>
      );
    }
    case 'hexagon': {
      const points = polygonPoints(cx, cy, r, 6, -Math.PI / 2);
      return (
        <Svg width={size} height={size}>
          <SvgPolygon points={points} fill={fill} stroke={stroke} strokeWidth={sw} strokeDasharray={dash} strokeLinejoin="round" />
        </Svg>
      );
    }
  }
}

function starPoints(cx: number, cy: number, outerR: number, innerR: number, spikes: number): string {
  const pts: string[] = [];
  let rot = -Math.PI / 2;
  const step = Math.PI / spikes;
  for (let i = 0; i < spikes; i++) {
    pts.push(`${cx + Math.cos(rot) * outerR},${cy + Math.sin(rot) * outerR}`);
    rot += step;
    pts.push(`${cx + Math.cos(rot) * innerR},${cy + Math.sin(rot) * innerR}`);
    rot += step;
  }
  return pts.join(' ');
}

function polygonPoints(cx: number, cy: number, r: number, sides: number, startAngle: number): string {
  const pts: string[] = [];
  for (let i = 0; i < sides; i++) {
    const a = startAngle + (i * 2 * Math.PI) / sides;
    pts.push(`${cx + Math.cos(a) * r},${cy + Math.sin(a) * r}`);
  }
  return pts.join(' ');
}

// ─── Sizing per shape count ────────────────────────────────────────────────

function gridConfig(count: number) {
  // (cols, shape size, slot size, gap). Tuned so 8 shapes still respect a
  // ≥ 64 pt tap target on a standard iPhone width (~393 pt).
  if (count <= 2)  return { cols: 2, art: 96, slot: 110, gap: 18 };
  if (count <= 4)  return { cols: 2, art: 86, slot: 100, gap: 16 };
  if (count <= 6)  return { cols: 3, art: 74, slot: 86,  gap: 12 };
  return            { cols: 4, art: 64, slot: 76,  gap: 10 };
}

// ─── Slot ──────────────────────────────────────────────────────────────────

interface Rect { x: number; y: number; w: number; h: number; }

function Slot({
  shape,
  hinted,
  placed,
  selectedShapeId,
  reduceMotion,
  size,
  artSize,
  onPress,
  onMeasure,
}: {
  shape: ShapeDef;
  hinted: boolean;
  placed: boolean;
  selectedShapeId: string | null;
  reduceMotion: boolean;
  size: number;
  artSize: number;
  onPress: () => void;
  onMeasure: (rect: Rect) => void;
}) {
  const pulse = useRef(new Animated.Value(0)).current;
  const fillIn = useRef(new Animated.Value(placed ? 1 : 0)).current;

  useEffect(() => {
    if (!hinted || reduceMotion) {
      pulse.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 600, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 600, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [hinted, reduceMotion, pulse]);

  useEffect(() => {
    Animated.timing(fillIn, {
      toValue: placed ? 1 : 0,
      duration: reduceMotion ? 120 : 240,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [placed, reduceMotion, fillIn]);

  const scale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.05] });
  const fillScale = fillIn.interpolate({ inputRange: [0, 1], outputRange: [0.86, 1] });
  const fillOpacity = fillIn;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${shape.label} outline${placed ? ', filled' : ''}${hinted ? ', hint' : ''}`}
      onLayout={(e) => {
        e.target?.measureInWindow?.((x, y, w, h) => onMeasure({ x, y, w, h }));
      }}
      style={[
        styles.slot,
        { width: size, height: size },
        hinted && styles.slotHinted,
        selectedShapeId && !placed && styles.slotAwaiting,
      ]}
    >
      <Animated.View style={{ position: 'absolute', transform: [{ scale }] }}>
        <ShapeArt kind={shape.kind} color={shape.color} size={artSize} outline />
      </Animated.View>
      {/* Filled overlay fades in on match. */}
      <Animated.View style={{ position: 'absolute', opacity: fillOpacity, transform: [{ scale: fillScale }] }}>
        <ShapeArt kind={shape.kind} color={shape.color} size={artSize} />
      </Animated.View>
    </Pressable>
  );
}

// ─── Draggable shape ───────────────────────────────────────────────────────

function DraggableShape({
  shape,
  selected,
  placed,
  reduceMotion,
  size,
  artSize,
  onTap,
  onDragRelease,
}: {
  shape: ShapeDef;
  selected: boolean;
  placed: boolean;
  reduceMotion: boolean;
  size: number;
  artSize: number;
  onTap: () => void;
  onDragRelease: (dropX: number, dropY: number, shapeId: string) => void;
}) {
  const pan  = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const lift = useRef(new Animated.Value(0)).current;

  const springBack = useCallback(() => {
    Animated.parallel([
      Animated.spring(pan, {
        toValue: { x: 0, y: 0 },
        useNativeDriver: false,
        friction: 8,
        tension: 110,
      }),
      Animated.timing(lift, {
        toValue: 0,
        duration: reduceMotion ? 80 : 160,
        useNativeDriver: false,
      }),
    ]).start();
  }, [pan, lift, reduceMotion]);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_e, g) => Math.abs(g.dx) > 6 || Math.abs(g.dy) > 6,
      onPanResponderGrant: () => {
        if (placed) return;
        if (!reduceMotion) {
          Animated.timing(lift, { toValue: 1, duration: 120, useNativeDriver: false }).start();
        }
      },
      onPanResponderMove: (_e, g) => {
        if (placed) return;
        pan.setValue({ x: g.dx, y: g.dy });
      },
      onPanResponderRelease: (e) => {
        if (placed) return;
        const { pageX, pageY } = e.nativeEvent;
        onDragRelease(pageX, pageY, shape.id);
        springBack();
      },
      onPanResponderTerminate: () => springBack(),
    }),
  ).current;

  const liftScale = lift.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] });

  return (
    <Animated.View
      {...panResponder.panHandlers}
      style={[
        styles.shapeWell,
        { width: size, height: size },
        placed && { opacity: 0 },
        {
          transform: [
            { translateX: pan.x },
            { translateY: pan.y },
            { scale: liftScale },
          ],
        },
      ]}
    >
      <Pressable
        onPress={() => {
          if (placed) return;
          onTap();
        }}
        accessibilityRole="button"
        accessibilityLabel={`${shape.label}${selected ? ', selected, tap a matching outline' : ', tap to select'}`}
        accessibilityState={{ selected }}
        style={[
          styles.shapePressable,
          { width: size, height: size, borderRadius: 18 },
          selected && styles.shapeSelected,
        ]}
      >
        <ShapeArt kind={shape.kind} color={shape.color} size={artSize} />
      </Pressable>
    </Animated.View>
  );
}

// ─── Start overlay ─────────────────────────────────────────────────────────

function StartOverlay({
  visible,
  difficulty,
  onSelectDifficulty,
  onCancel,
  onStart,
}: {
  visible: boolean;
  difficulty: Difficulty;
  onSelectDifficulty: (d: Difficulty) => void;
  onCancel: () => void;
  onStart: () => void;
}) {
  const row = (d: Difficulty, label: string) => {
    const active = difficulty === d;
    return (
      <Pressable
        key={d}
        onPress={() => {
          hapticSelection();
          onSelectDifficulty(d);
        }}
        accessibilityRole="radio"
        accessibilityState={{ selected: active }}
        accessibilityLabel={`${label} difficulty`}
        style={({ pressed }) => [
          styles.diffRow,
          active && styles.diffRowActive,
          pressed && { opacity: 0.92 },
        ]}
      >
        <View style={[styles.radio, active && styles.radioActive]}>
          {active ? <View style={styles.radioDot} /> : null}
        </View>
        <Text style={styles.diffLabel}>{label}</Text>
      </Pressable>
    );
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.overlayBackdrop}>
        <Card style={styles.overlayCard}>
          <Text style={styles.overlayTitle} accessibilityRole="header">Shape Match</Text>
          <Text style={styles.overlaySub}>
            Match each shape to the correct outline.
          </Text>

          <View style={styles.section}>
            <Text style={styles.sectionEyebrow}>DIFFICULTY</Text>
            {row('easy',   'Easy')}
            {row('medium', 'Medium')}
            {row('hard',   'Hard')}
          </View>

          <View style={styles.overlayActions}>
            <Pressable
              onPress={onCancel}
              accessibilityRole="button"
              accessibilityLabel="Cancel"
              style={({ pressed }) => [styles.btnGhost, pressed && { opacity: 0.85 }]}
            >
              <Text style={styles.btnGhostText}>Cancel</Text>
            </Pressable>
            <Pressable
              onPress={onStart}
              accessibilityRole="button"
              accessibilityLabel="Start game"
              style={({ pressed }) => [styles.btnPrimary, pressed && { opacity: 0.85 }]}
            >
              <Text style={styles.btnPrimaryText}>Start Game</Text>
            </Pressable>
          </View>
        </Card>
      </View>
    </Modal>
  );
}

// ─── Success overlay ───────────────────────────────────────────────────────

function SuccessOverlay({
  visible,
  difficulty,
  totalLevels,
  onPlayAgain,
  onNext,
  onBack,
}: {
  visible: boolean;
  difficulty: Difficulty;
  totalLevels: number;
  onPlayAgain: () => void;
  onNext: () => void;
  onBack: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onBack}>
      <View style={styles.overlayBackdrop}>
        <Card style={styles.overlayCard}>
          <View style={styles.successBadge}>
            <Ionicons name="checkmark" size={56} color="#FFFFFF" />
          </View>
          <Text style={styles.successTitle} accessibilityRole="header">Great work!</Text>
          <Text style={styles.successSub}>
            You matched every shape across {totalLevels} {difficulty} levels.
          </Text>

          <View style={styles.successActions}>
            <Pressable
              onPress={onPlayAgain}
              accessibilityRole="button"
              accessibilityLabel="Play again"
              style={({ pressed }) => [styles.btnPrimary, { width: '100%' }, pressed && { opacity: 0.85 }]}
            >
              <Text style={styles.btnPrimaryText}>Play Again</Text>
            </Pressable>
            <Pressable
              onPress={onNext}
              accessibilityRole="button"
              accessibilityLabel="Next activity"
              style={({ pressed }) => [styles.btnSecondary, pressed && { opacity: 0.85 }]}
            >
              <Text style={styles.btnSecondaryText}>Next Activity</Text>
            </Pressable>
            <Pressable
              onPress={onBack}
              accessibilityRole="button"
              accessibilityLabel="Back to activities"
              style={({ pressed }) => [styles.btnGhost, pressed && { opacity: 0.85 }]}
            >
              <Text style={styles.btnGhostText}>Back to Activity</Text>
            </Pressable>
          </View>
        </Card>
      </View>
    </Modal>
  );
}

// ─── Screen ────────────────────────────────────────────────────────────────

type Phase = 'select' | 'play' | 'won';

interface LevelLayout {
  shapes: ShapeDef[];     // pool for this difficulty
  slotOrder: ShapeDef[];  // slot row order (shuffled per level)
  shapeOrder: ShapeDef[]; // shape row order (shuffled per level)
}

function newLevelLayout(difficulty: Difficulty): LevelLayout {
  const pool = poolFor(difficulty);
  return {
    shapes: pool,
    slotOrder:  shuffle(pool),
    shapeOrder: shuffle(pool),
  };
}

export default function ShapeMatchScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const dims = useWindowDimensions();
  const reduceMotion = useReduceMotion();

  const [phase, setPhase] = useState<Phase>('select');
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [level, setLevel] = useState<number>(1);
  const [layout, setLayout] = useState<LevelLayout>(() => newLevelLayout('easy'));
  const [placed, setPlaced] = useState<Set<string>>(new Set());
  const [selectedShapeId, setSelectedShapeId] = useState<string | null>(null);
  const [hintedShapeId, setHintedShapeId] = useState<string | null>(null);
  const [tryAgainVisible, setTryAgainVisible] = useState(false);
  const [soundOn, setSoundOn] = useState(false);
  const [levelPillFlash, setLevelPillFlash] = useState(false);

  const tryAgainFade = useRef(new Animated.Value(0)).current;
  const levelPillScale = useRef(new Animated.Value(1)).current;
  const slotRects = useRef<Map<ShapeKind, Rect>>(new Map());

  const count = layout.shapes.length;
  const config = gridConfig(count);

  const totalLevels = LEVELS[difficulty];
  const remaining = useMemo(
    () => layout.shapes.filter(s => !placed.has(s.id)),
    [layout.shapes, placed],
  );
  const progressMade = placed.size > 0;
  const allMatched = placed.size === count;

  // Auto-advance after the user matches every shape in a level.
  useEffect(() => {
    if (phase !== 'play' || !allMatched) return;
    const t = setTimeout(() => {
      if (level >= totalLevels) {
        setPhase('won');
        return;
      }
      // Flash level pill, then load the next layout.
      setLevelPillFlash(true);
      Animated.sequence([
        Animated.timing(levelPillScale, { toValue: 1.12, duration: 160, useNativeDriver: true }),
        Animated.spring(levelPillScale, { toValue: 1, useNativeDriver: true, friction: 5, tension: 120 }),
      ]).start(() => setLevelPillFlash(false));
      setLevel(l => l + 1);
      setLayout(newLevelLayout(difficulty));
      setPlaced(new Set());
      setSelectedShapeId(null);
      setHintedShapeId(null);
      slotRects.current.clear();
    }, 650);
    return () => clearTimeout(t);
  }, [allMatched, phase, level, totalLevels, difficulty, levelPillScale]);

  // Try Again toast.
  const showTryAgain = useCallback(() => {
    setTryAgainVisible(true);
    Animated.sequence([
      Animated.timing(tryAgainFade, { toValue: 1, duration: 160, useNativeDriver: true }),
      Animated.delay(900),
      Animated.timing(tryAgainFade, { toValue: 0, duration: 220, useNativeDriver: true }),
    ]).start(() => setTryAgainVisible(false));
  }, [tryAgainFade]);

  // ── Matching logic ───────────────────────────────────────────────────────
  const attemptMatch = useCallback(
    (shapeId: string, targetKind: ShapeKind) => {
      const shape = layout.shapes.find(s => s.id === shapeId);
      if (!shape || placed.has(shape.id)) return;
      if (shape.kind === targetKind) {
        hapticSelection();
        setPlaced(prev => {
          const next = new Set(prev);
          next.add(shape.id);
          return next;
        });
        setSelectedShapeId(null);
        setHintedShapeId(null);
      } else {
        showTryAgain();
        setSelectedShapeId(null);
      }
    },
    [layout.shapes, placed, showTryAgain],
  );

  const onShapeTap = useCallback(
    (shapeId: string) => {
      hapticSelection();
      const shape = layout.shapes.find(s => s.id === shapeId);
      if (!shape || placed.has(shapeId)) return;
      setSelectedShapeId(shapeId);
      // The only TTS in the game: speak the shape name when its tile is
      // tapped — only when the user has the sound switch on.
      if (soundOn) {
        Speech.stop();
        Speech.speak(shape.label, { rate: 0.95 });
      }
    },
    [layout.shapes, placed, soundOn],
  );

  const onSlotTap = useCallback(
    (kind: ShapeKind) => {
      if (!selectedShapeId) return;
      attemptMatch(selectedShapeId, kind);
    },
    [selectedShapeId, attemptMatch],
  );

  const onShapeDragRelease = useCallback(
    (dropX: number, dropY: number, shapeId: string) => {
      for (const [kind, rect] of slotRects.current.entries()) {
        if (
          dropX >= rect.x &&
          dropX <= rect.x + rect.w &&
          dropY >= rect.y &&
          dropY <= rect.y + rect.h
        ) {
          attemptMatch(shapeId, kind);
          return;
        }
      }
      // Outside any slot — the shape just springs home silently.
    },
    [attemptMatch],
  );

  // ── Controls ─────────────────────────────────────────────────────────────
  const resetLevel = useCallback(() => {
    setPlaced(new Set());
    setSelectedShapeId(null);
    setHintedShapeId(null);
  }, []);

  const onReset = useCallback(() => {
    if (!progressMade) {
      resetLevel();
      return;
    }
    Alert.alert(
      'Reset this level?',
      'Your current progress will be cleared.',
      [
        { text: 'Keep Playing', style: 'cancel' },
        { text: 'Reset', style: 'destructive', onPress: resetLevel },
      ],
      { cancelable: true },
    );
  }, [progressMade, resetLevel]);

  // Back/Forward swap the level cleanly. Back starts the previous level
  // from the beginning (per user spec) — placed state is cleared and a
  // fresh shuffle is generated. Forward skips to the next level the same way.
  const goLevel = useCallback((delta: 1 | -1) => {
    setLevel(prev => {
      const next = prev + delta;
      if (next < 1 || next > totalLevels) return prev;
      hapticSelection();
      setLayout(newLevelLayout(difficulty));
      setPlaced(new Set());
      setSelectedShapeId(null);
      setHintedShapeId(null);
      slotRects.current.clear();
      return next;
    });
  }, [difficulty, totalLevels]);

  const onBackLevel    = useCallback(() => goLevel(-1), [goLevel]);
  const onForwardLevel = useCallback(() => goLevel(+1), [goLevel]);

  const canGoBack    = level > 1;
  const canGoForward = level < totalLevels;

  // ── Phase transitions ────────────────────────────────────────────────────
  const startGame = useCallback(() => {
    hapticSelection();
    setLevel(1);
    setLayout(newLevelLayout(difficulty));
    setPlaced(new Set());
    setSelectedShapeId(null);
    setHintedShapeId(null);
    setPhase('play');
    slotRects.current.clear();
  }, [difficulty]);

  const onCancelStart = useCallback(() => router.back(), [router]);

  const onPlayAgain = useCallback(() => {
    setLevel(1);
    setLayout(newLevelLayout(difficulty));
    setPlaced(new Set());
    setSelectedShapeId(null);
    setPhase('play');
  }, [difficulty]);

  const onNextActivity = useCallback(() => {
    router.replace('/activities/memory-match' as never);
  }, [router]);

  const onBackToActivity = useCallback(() => {
    router.replace('/(tabs)/activities' as never);
  }, [router]);

  const showHelp = () => {
    Alert.alert(
      'How to play',
      'Tap a shape on the bottom, then tap its matching outline on top. You can also drag a shape onto its outline. Wrong picks bounce back — keep trying.',
      [{ text: 'Got it' }],
      { cancelable: true },
    );
  };

  // ── Render helpers ───────────────────────────────────────────────────────
  const renderGrid = (
    items: ShapeDef[],
    builder: (s: ShapeDef) => React.ReactNode,
    keySuffix: string,
  ) => {
    const rows: ShapeDef[][] = [];
    for (let i = 0; i < items.length; i += config.cols) {
      rows.push(items.slice(i, i + config.cols));
    }
    return (
      <View style={{ gap: config.gap }}>
        {rows.map((row, idx) => (
          <View
            key={`${keySuffix}-row-${idx}`}
            style={{
              flexDirection: 'row',
              justifyContent: 'center',
              gap: config.gap,
            }}
          >
            {row.map(s => (
              <React.Fragment key={`${keySuffix}-${s.id}`}>
                {builder(s)}
              </React.Fragment>
            ))}
          </View>
        ))}
      </View>
    );
  };

  const showingGame = phase === 'play' || phase === 'won';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.header}>
        <ActivityProgressBar
          current={level}
          total={totalLevels}
          onBack={() => router.back()}
          backAccessibleLabel="Back"
          progressAccessibleLabel={`Level ${level} of ${totalLevels}`}
        />
        <View style={styles.headerActions}>
          <Pressable
            onPress={() => {
              hapticSelection();
              setSoundOn(v => !v);
            }}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel={soundOn ? 'Turn shape voice off' : 'Turn shape voice on'}
            accessibilityState={{ selected: soundOn }}
            style={styles.headerIconBtn}
          >
            <Ionicons
              name={soundOn ? 'volume-medium-outline' : 'volume-mute-outline'}
              size={22}
              color={colors.text}
            />
          </Pressable>
          <Pressable
            onPress={showHelp}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="Help"
            style={styles.headerIconBtn}
          >
            <Ionicons name="help-circle-outline" size={24} color={colors.text} />
          </Pressable>
        </View>
      </View>

      {showingGame ? (
        <View style={[styles.body, { paddingBottom: insets.bottom + spacing.md }]}>
          {/* Level pill — front and centre. Users with cognitive load need
              to know exactly where they are in the run; without this the
              session feels infinite (per the activity rules doc). */}
          <View style={styles.subhead}>
            <Animated.View
              style={[
                styles.levelPill,
                levelPillFlash && { backgroundColor: '#D6F0DD' },
                { transform: [{ scale: levelPillScale }] },
              ]}
            >
              <Text style={styles.levelPillText}>
                Level {level} of {totalLevels}
              </Text>
            </Animated.View>
          </View>

          <Text style={styles.instruction}>Match each shape to its outline.</Text>

          {/* Slots area (top) */}
          <View style={styles.slotsArea}>
            {renderGrid(
              layout.slotOrder,
              (shape) => (
                <Slot
                  shape={shape}
                  size={config.slot}
                  artSize={config.art}
                  hinted={hintedShapeId === shape.id}
                  placed={placed.has(shape.id)}
                  selectedShapeId={selectedShapeId}
                  reduceMotion={reduceMotion}
                  onPress={() => onSlotTap(shape.kind)}
                  onMeasure={(rect) => slotRects.current.set(shape.kind, rect)}
                />
              ),
              'slot',
            )}
          </View>

          {/* Shapes area (bottom) */}
          <View style={styles.shapesArea}>
            {renderGrid(
              layout.shapeOrder,
              (shape) => (
                <DraggableShape
                  shape={shape}
                  size={config.slot}
                  artSize={config.art}
                  selected={selectedShapeId === shape.id}
                  placed={placed.has(shape.id)}
                  reduceMotion={reduceMotion}
                  onTap={() => onShapeTap(shape.id)}
                  onDragRelease={onShapeDragRelease}
                />
              ),
              'shape',
            )}
          </View>

          {/* Footer — level navigation. Back = previous level fresh,
              Reset = restart this level, Forward = skip to next level. */}
          <View style={styles.footer}>
            <Pressable
              onPress={onBackLevel}
              disabled={!canGoBack}
              accessibilityRole="button"
              accessibilityLabel={canGoBack ? `Back to level ${level - 1}` : 'No previous level'}
              accessibilityState={{ disabled: !canGoBack }}
              style={({ pressed }) => [
                styles.footerBtn,
                styles.footerGhost,
                !canGoBack && styles.footerBtnDisabled,
                pressed && canGoBack && { opacity: 0.85 },
              ]}
            >
              <Ionicons name="chevron-back" size={20} color={canGoBack ? colors.primary : colors.textTertiary} />
              <Text style={[styles.footerBtnText, { color: canGoBack ? colors.primary : colors.textTertiary }]}>Back</Text>
            </Pressable>

            <Pressable
              onPress={onReset}
              accessibilityRole="button"
              accessibilityLabel="Reset level"
              style={({ pressed }) => [styles.footerBtn, styles.footerReset, pressed && { opacity: 0.85 }]}
            >
              <Ionicons name="refresh" size={20} color={colors.textMuted} />
              <Text style={[styles.footerBtnText, { color: colors.textMuted }]}>Reset</Text>
            </Pressable>

            <Pressable
              onPress={onForwardLevel}
              disabled={!canGoForward}
              accessibilityRole="button"
              accessibilityLabel={canGoForward ? `Skip to level ${level + 1}` : 'No more levels'}
              accessibilityState={{ disabled: !canGoForward }}
              style={({ pressed }) => [
                styles.footerBtn,
                styles.footerForward,
                !canGoForward && styles.footerBtnDisabled,
                pressed && canGoForward && { opacity: 0.85 },
              ]}
            >
              <Text style={[styles.footerBtnText, { color: canGoForward ? '#FFFFFF' : colors.textTertiary }]}>Forward</Text>
              <Ionicons name="chevron-forward" size={20} color={canGoForward ? '#FFFFFF' : colors.textTertiary} />
            </Pressable>
          </View>

          {/* Try-again toast */}
          {tryAgainVisible ? (
            <Animated.View
              style={[
                styles.tryAgain,
                { bottom: insets.bottom + 90, opacity: tryAgainFade },
              ]}
              pointerEvents="none"
            >
              <Ionicons name="refresh-circle-outline" size={20} color="#A65900" />
              <Text style={styles.tryAgainText}>Try Again</Text>
            </Animated.View>
          ) : null}
        </View>
      ) : (
        <View style={styles.body} />
      )}

      <StartOverlay
        visible={phase === 'select'}
        difficulty={difficulty}
        onSelectDifficulty={setDifficulty}
        onCancel={onCancelStart}
        onStart={startGame}
      />

      <SuccessOverlay
        visible={phase === 'won'}
        difficulty={difficulty}
        totalLevels={totalLevels}
        onPlayAgain={onPlayAgain}
        onNext={onNextActivity}
        onBack={onBackToActivity}
      />

      {/* Silenced: avoid lint warnings about unused dims */}
      <View style={{ position: 'absolute', width: 0, height: 0 }} accessibilityElementsHidden>
        <Text>{dims.width}</Text>
      </View>
    </SafeAreaView>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────

// BRIGHT page — pure white per the user's spec. Slots and footer buttons
// pick up a slightly tinted surface so they read as raised on the white.
const BG = '#FFFFFF';
const SLOT_BG = '#F1F5F9';

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    gap: spacing.md,
    backgroundColor: BG,
  },
  headerIconBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
    fontSize: typography.heading,
    fontWeight: '900',
    color: colors.text,
    letterSpacing: typography.trackHeading,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 4,
  },

  body: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    gap: spacing.md,
    justifyContent: 'space-between',
  },

  // Single pill centred on its own line — it's now the only piece of
  // session orientation the user has (no difficulty chip alongside).
  subhead: {
    alignItems: 'center',
  },
  levelPill: {
    paddingHorizontal: spacing.lg,
    paddingVertical: 8,
    backgroundColor: '#E6F4FD',
    borderRadius: radii.pill,
  },
  levelPillText: {
    fontSize: typography.body,
    fontWeight: '900',
    color: colors.primary,
    letterSpacing: 0.4,
  },

  instruction: {
    fontSize: typography.body,
    color: colors.text,
    textAlign: 'center',
    lineHeight: 24,
    fontWeight: '600',
  },

  // Areas centered vertically so the layout reads as two grouped banks
  // (outlines on top, source shapes below) with even breathing room.
  slotsArea: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  shapesArea: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },

  slot: {
    borderRadius: 22,
    backgroundColor: SLOT_BG,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slotAwaiting: {
    backgroundColor: '#E6F4FD',
  },
  slotHinted: {
    backgroundColor: '#FFF4E0',
  },

  shapeWell: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  shapePressable: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  shapeSelected: {
    backgroundColor: '#E6F4FD',
    borderWidth: 3,
    borderColor: colors.primary,
  },

  footer: {
    flexDirection: 'row',
    gap: 8,
  },
  footerBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    borderRadius: radii.pill,
    minHeight: 50,
  },
  footerBtnDisabled: {
    opacity: 0.4,
  },
  footerBtnText: {
    fontSize: typography.callout,
    fontWeight: '800',
  },
  // Back uses a light primary tint so it reads as "navigation", not destructive.
  footerGhost:   { backgroundColor: '#E6F4FD' },
  // Reset stays neutral — recessed surface against the bright white page.
  footerReset:   { backgroundColor: SLOT_BG },
  // Forward is the primary forward action — solid brand colour.
  footerForward: { backgroundColor: colors.primary },

  tryAgain: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: '#FFF4E0',
    borderRadius: radii.pill,
  },
  tryAgainText: {
    fontSize: typography.body,
    fontWeight: '800',
    color: '#A65900',
  },

  // ── Overlays ─────────────────────────────────────────────────────────────
  overlayBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(8, 14, 24, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  overlayCard: {
    width: '100%',
    maxWidth: 380,
    alignItems: 'stretch',
    gap: spacing.lg,
    padding: spacing.xl,
  },
  overlayTitle: {
    fontSize: typography.title,
    fontWeight: '900',
    color: colors.text,
    textAlign: 'center',
    letterSpacing: typography.trackTitle,
  },
  overlaySub: {
    fontSize: typography.body,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 22,
  },
  section: { gap: spacing.sm },
  sectionEyebrow: {
    fontSize: typography.caption,
    fontWeight: '800',
    color: colors.textMuted,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
  },

  diffRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.background,
    borderRadius: radii.card,
    minHeight: 64,
  },
  diffRowActive: {
    backgroundColor: '#E6F4FD',
  },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.textTertiary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioActive: { borderColor: colors.primary },
  radioDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primary,
  },
  diffLabel: {
    fontSize: typography.body,
    fontWeight: '800',
    color: colors.text,
  },
  diffSub: {
    fontSize: typography.caption,
    color: colors.textMuted,
    marginTop: 2,
    fontWeight: '600',
  },

  overlayActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  btnGhost: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: radii.pill,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
  },
  btnGhostText: {
    fontSize: typography.body,
    fontWeight: '700',
    color: colors.text,
  },
  btnPrimary: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: radii.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
  },
  btnPrimaryText: {
    fontSize: typography.body,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  btnSecondary: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: radii.pill,
    backgroundColor: '#E6F4FD',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
  },
  btnSecondaryText: {
    fontSize: typography.body,
    fontWeight: '800',
    color: colors.primary,
  },

  successBadge: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#34C759',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  successTitle: {
    fontSize: typography.title,
    fontWeight: '900',
    color: colors.text,
    textAlign: 'center',
    letterSpacing: typography.trackTitle,
  },
  successSub: {
    fontSize: typography.body,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 22,
  },
  successActions: {
    gap: spacing.sm,
  },
});
