/**
 * Colour Pop — Launch & Catch
 *
 * Shapes fly through the play field in many directions with real gravity feel.
 * Tap the matching colour — one colour stays for 30 s (resets on each correct tap).
 * Fill the goal → sparkle → next colour. 30 s no tap → calm fade → next colour.
 * Feedback is quiet: a soft pop on correct, an amber Try Again toast on
 * incorrect (activity rules §4/§5 — no red flash, no shake, no confetti).
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Easing,
  LayoutChangeEvent,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import Svg, {
  Circle as SvgCircle,
  Polygon as SvgPolygon,
  Rect as SvgRect,
} from 'react-native-svg';
import { ActivityProgressBar } from '../../src/components/activities/ActivityProgressBar';
import {
  ActivityCompletionOverlay,
  ACTIVITY_THEMES,
} from '../../src/components/activities/ActivityCompletionOverlay';
import { Card } from '../../src/components/native/Card';
import { useReduceMotion } from '../../src/hooks/useReduceMotion';
import { colors, radii, spacing, typography } from '../../src/theme/tokens';
import { hapticLight, hapticSelection } from '../../src/utils/haptics';
import { playSound } from '../../src/utils/sounds';
import { setActivitySfxEnabled, useActivitySfx } from '../../src/features/activities/sound-settings';
import { recordActivitySession } from '../../src/features/activities/progress-store';
import { useTheme } from '../../src/theme/useTheme';

// ─── Types ────────────────────────────────────────────────────────────────────

type Difficulty = 'easy' | 'medium' | 'hard';
type Speed = 'slow' | 'fast' | 'fastest';
type Phase = 'select' | 'play' | 'won';
type ShapeKind =
  | 'circle' | 'square' | 'triangle'
  | 'rectangle' | 'star' | 'diamond' | 'hexagon';

interface ColourDef { key: string; label: string; hex: string; }

interface FlyingItem {
  id: string;
  colour: ColourDef;
  shape: ShapeKind;
  sx: number; sy: number;
  px: number; py: number;
  ex: number; ey: number;
  size: number;
  upDuration: number;
  downDuration: number;
  rotFrom: string;
  rotMid: string;
  rotTo: string;
  isCorrect: boolean;
}

interface FieldSize { width: number; height: number; }

// ─── Constants ────────────────────────────────────────────────────────────────

/** Rainbow colours only — no teal or grey-adjacent. */
const COLOURS: ColourDef[] = [
  { key: 'red',    label: 'Red',    hex: '#E53935' },
  { key: 'orange', label: 'Orange', hex: '#FB8C00' },
  { key: 'yellow', label: 'Yellow', hex: '#FDD835' },
  { key: 'green',  label: 'Green',  hex: '#43A047' },
  { key: 'blue',   label: 'Blue',   hex: '#1E88E5' },
  { key: 'purple', label: 'Purple', hex: '#8E24AA' },
  { key: 'pink',   label: 'Pink',   hex: '#D81B60' },
];

const SHAPES_BY_DIFFICULTY: Record<Difficulty, ShapeKind[]> = {
  easy:   ['circle', 'square', 'triangle'],
  medium: ['circle', 'square', 'triangle', 'rectangle', 'star'],
  hard:   ['circle', 'square', 'triangle', 'rectangle', 'star', 'diamond', 'hexagon'],
};

const TOTAL_COLOURS = 10;

/** Correct taps to trigger sparkle → next colour. */
const GOAL: Record<Difficulty, number> = { easy: 3, medium: 4, hard: 5 };

/** Easy = big, Hard = small. */
const SHAPE_SIZE: Record<Difficulty, number> = { easy: 90, medium: 70, hard: 54 };

/**
 * Speed controls how fast shapes move (arc up/down), how fast they
 * return/hide (arcDownMs), and how often the launcher checks for room
 * (launchCheckMs). `extraCorrect` lets the top speed field one more
 * target-colour shape after the early window — total stays ≤ MAX_TOTAL_ACTIVE
 * so the game never gets overwhelming.
 */
const SPEED_CONFIG = {
  slow:    { arcUpMs: 1350, arcDownMs: 1700, launchCheckMs: 1200, extraCorrect: 0 },
  fast:    { arcUpMs: 880,  arcDownMs: 1100, launchCheckMs: 800,  extraCorrect: 0 },
  fastest: { arcUpMs: 580,  arcDownMs: 720,  launchCheckMs: 520,  extraCorrect: 1 },
} as const;

// ── Spawn balance quotas ──
// First 10 s of each colour: at most 1 correct + 1 incorrect shape active.
// After 10 s: at most 2 correct + 1 incorrect (plus speed's extraCorrect).
// Random-looking but bounded and fair — never a field full of the target.
const SPAWN_EARLY_MS     = 10_000;
const EARLY_CORRECT_CAP  = 1;
const LATE_CORRECT_CAP   = 2;
const WRONG_CAP          = 1;
const MAX_TOTAL_ACTIVE   = 5;

const COLOUR_TIMER_MS = 30_000;

// ─── Utilities ────────────────────────────────────────────────────────────────

function hexToRgba(hex: string, a: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${a})`;
}

function randomItem<T>(arr: readonly T[]): T {
  const item = arr[Math.floor(Math.random() * arr.length)];
  if (!item) throw new Error('Empty array');
  return item;
}

function shuffle<T>(arr: readonly T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
}

function generateColourSequence(count: number): ColourDef[] {
  const result: ColourDef[] = [];
  while (result.length < count) result.push(...shuffle(COLOURS));
  return result.slice(0, count);
}

function randDeg(range: number): string {
  return `${Math.round((Math.random() - 0.5) * range)}deg`;
}

// ─── Trajectory ───────────────────────────────────────────────────────────────

type Traj = { sx: number; sy: number; px: number; py: number; ex: number; ey: number; };

/**
 * 8 trajectory types for visual variety.
 * Shapes start/end off-screen (clipped by field overflow:hidden).
 */
function makeTraj(size: number, fw: number, fh: number): Traj {
  const m = size + 6;
  const t = Math.floor(Math.random() * 8);

  switch (t) {
    case 0: { // straight up with drift
      const x = m + Math.random() * (fw - m * 2);
      const drift = (Math.random() - 0.5) * fw * 0.28;
      return { sx: x, sy: fh + m, px: x + drift * 0.45, py: fh * (0.06 + Math.random() * 0.2), ex: x + drift, ey: -m * 2 };
    }
    case 1: { // left to right, arc upward
      const y = m + Math.random() * (fh * 0.6);
      const arc = fh * (0.12 + Math.random() * 0.2);
      return { sx: -m, sy: y + fh * 0.12, px: fw * (0.38 + Math.random() * 0.1), py: y - arc, ex: fw + m, ey: y };
    }
    case 2: { // right to left, arc upward
      const y = m + Math.random() * (fh * 0.6);
      const arc = fh * (0.12 + Math.random() * 0.2);
      return { sx: fw + m, sy: y + fh * 0.12, px: fw * (0.52 + Math.random() * 0.1), py: y - arc, ex: -m, ey: y };
    }
    case 3: { // diagonal bottom-left → top-right
      const peakY = fh * (0.07 + Math.random() * 0.2);
      return { sx: fw * 0.04, sy: fh + m, px: fw * (0.38 + Math.random() * 0.14), py: peakY, ex: fw + m, ey: fh * (0.06 + Math.random() * 0.28) };
    }
    case 4: { // diagonal bottom-right → top-left
      const peakY = fh * (0.07 + Math.random() * 0.2);
      return { sx: fw * 0.96, sy: fh + m, px: fw * (0.48 + Math.random() * 0.14), py: peakY, ex: -m, ey: fh * (0.06 + Math.random() * 0.28) };
    }
    case 5: { // drop from top
      const x = m + Math.random() * (fw - m * 2);
      const mx = x + (Math.random() - 0.5) * fw * 0.18;
      return { sx: x, sy: -m, px: mx, py: fh * (0.15 + Math.random() * 0.25), ex: mx + (Math.random() - 0.5) * fw * 0.14, ey: fh + m * 2 };
    }
    case 6: { // top-right → bottom-left swoop
      const midX = fw * (0.55 + Math.random() * 0.1);
      const midY = fh * (0.2 + Math.random() * 0.2);
      return { sx: fw + m, sy: -m, px: midX, py: midY, ex: -m, ey: fh + m };
    }
    default: { // top-left → bottom-right swoop
      const midX = fw * (0.35 + Math.random() * 0.1);
      const midY = fh * (0.2 + Math.random() * 0.2);
      return { sx: -m, sy: -m, px: midX, py: midY, ex: fw + m, ey: fh + m };
    }
  }
}

// ─── Shape rendering ──────────────────────────────────────────────────────────

function ShapeArt({ kind, colour, size }: { kind: ShapeKind; colour: ColourDef; size: number }) {
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {renderShape(kind, size, colour.hex, '#263238', 2)}
    </Svg>
  );
}

function renderShape(kind: ShapeKind, size: number, fill: string, stroke: string, sw: number) {
  const inset = Math.max(3, sw + 2);
  const cx = size / 2, cy = size / 2, r = size / 2 - inset;
  switch (kind) {
    case 'circle':
      return <SvgCircle cx={cx} cy={cy} r={r} fill={fill} stroke={stroke} strokeWidth={sw} />;
    case 'square':
      return <SvgRect x={inset} y={inset} width={size - inset * 2} height={size - inset * 2} rx={12} ry={12} fill={fill} stroke={stroke} strokeWidth={sw} />;
    case 'triangle': {
      const h = (Math.sqrt(3) / 2) * (size - inset * 2);
      return <SvgPolygon points={`${cx},${cy - h / 2} ${inset},${cy + h / 2} ${size - inset},${cy + h / 2}`} fill={fill} stroke={stroke} strokeWidth={sw} strokeLinejoin="round" />;
    }
    case 'rectangle': {
      const w = size - inset * 2, h = w * 0.62;
      return <SvgRect x={inset} y={(size - h) / 2} width={w} height={h} rx={10} ry={10} fill={fill} stroke={stroke} strokeWidth={sw} />;
    }
    case 'star':
      return <SvgPolygon points={starPoints(cx, cy, r, r * 0.45, 5)} fill={fill} stroke={stroke} strokeWidth={sw} strokeLinejoin="round" />;
    case 'diamond':
      return <SvgPolygon points={`${cx},${inset} ${size - inset},${cy} ${cx},${size - inset} ${inset},${cy}`} fill={fill} stroke={stroke} strokeWidth={sw} strokeLinejoin="round" />;
    case 'hexagon':
      return <SvgPolygon points={polygonPoints(cx, cy, r, 6, -Math.PI / 2)} fill={fill} stroke={stroke} strokeWidth={sw} strokeLinejoin="round" />;
  }
}

function starPoints(cx: number, cy: number, oR: number, iR: number, spikes: number): string {
  const pts: string[] = [];
  let rot = -Math.PI / 2;
  const step = Math.PI / spikes;
  for (let i = 0; i < spikes; i++) {
    pts.push(`${cx + Math.cos(rot) * oR},${cy + Math.sin(rot) * oR}`); rot += step;
    pts.push(`${cx + Math.cos(rot) * iR},${cy + Math.sin(rot) * iR}`); rot += step;
  }
  return pts.join(' ');
}

function polygonPoints(cx: number, cy: number, r: number, sides: number, start: number): string {
  return Array.from({ length: sides }, (_, i) => {
    const a = start + (i * 2 * Math.PI) / sides;
    return `${cx + Math.cos(a) * r},${cy + Math.sin(a) * r}`;
  }).join(' ');
}

// ─── Flying shape ─────────────────────────────────────────────────────────────
// Per-tap confetti removed (§5.5 — celebration is saved for the completion
// overlay). Correct taps end in a soft scale + fade; under Reduce Motion the
// shape simply fades out. The traversal itself is functional motion (the
// game mechanic), so it keeps its duration under Reduce Motion — only the
// decorative rotation and bounce-in are dropped (§8).

function FlyingShapeView({
  item, tapped, reduceMotion, onPress, onGone,
}: {
  item: FlyingItem;
  tapped: boolean;
  reduceMotion: boolean;
  onPress: () => void;
  onGone: (id: string) => void;
}) {
  const tx       = useRef(new Animated.Value(item.sx)).current;
  const ty       = useRef(new Animated.Value(item.sy)).current;
  const scale    = useRef(new Animated.Value(reduceMotion ? 1 : 0.5)).current;
  const opacity  = useRef(new Animated.Value(0)).current;
  const rotAnim  = useRef(new Animated.Value(0)).current;
  const arcRef   = useRef<Animated.CompositeAnimation | null>(null);
  const goneRef  = useRef(false);
  const onGoneRef = useRef(onGone);
  onGoneRef.current = onGone;

  const rotInterp = useMemo(() => rotAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [item.rotFrom, item.rotMid, item.rotTo],
  }), [rotAnim, item.rotFrom, item.rotMid, item.rotTo]);

  // Arc on mount — decel up, accel down (cubic gravity)
  useEffect(() => {
    const up    = item.upDuration;
    const down  = item.downDuration;
    const total = up + down;

    const anims: Animated.CompositeAnimation[] = [
      Animated.sequence([
        Animated.timing(tx, { toValue: item.px, duration: up,   easing: Easing.out(Easing.quad),  useNativeDriver: true }),
        Animated.timing(tx, { toValue: item.ex, duration: down, easing: Easing.in(Easing.cubic),  useNativeDriver: true }),
      ]),
      Animated.sequence([
        Animated.timing(ty, { toValue: item.py, duration: up,   easing: Easing.out(Easing.quad),  useNativeDriver: true }),
        Animated.timing(ty, { toValue: item.ey, duration: down, easing: Easing.in(Easing.cubic),  useNativeDriver: true }),
      ]),
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: Math.min(160, up * 0.35), useNativeDriver: true }),
        Animated.delay(up + down * 0.42),
        Animated.timing(opacity, { toValue: 0, duration: down * 0.58, useNativeDriver: true }),
      ]),
    ];

    if (!reduceMotion) {
      anims.push(
        Animated.sequence([
          Animated.timing(scale, { toValue: 1,   duration: up,   easing: Easing.out(Easing.back(1.2)), useNativeDriver: true }),
          Animated.timing(scale, { toValue: 0.5, duration: down, easing: Easing.in(Easing.quad),        useNativeDriver: true }),
        ]),
        Animated.timing(rotAnim, { toValue: 1, duration: total, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      );
    }

    const arc = Animated.parallel(anims);
    arcRef.current = arc;
    arc.start(({ finished }) => {
      if (finished && !goneRef.current) { goneRef.current = true; onGoneRef.current(item.id); }
    });
    return () => arc.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Soft pop on correct tap — gentle scale + fade (fade only under Reduce Motion)
  useEffect(() => {
    if (!tapped) return;
    arcRef.current?.stop();

    if (reduceMotion) {
      Animated.timing(opacity, { toValue: 0, duration: 160, useNativeDriver: true })
        .start(({ finished }) => {
          if (finished && !goneRef.current) { goneRef.current = true; onGoneRef.current(item.id); }
        });
      return;
    }

    Animated.parallel([
      Animated.timing(scale, { toValue: 1.18, duration: 200, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 0, duration: 220, delay: 30, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start(({ finished }) => {
      if (finished && !goneRef.current) { goneRef.current = true; onGoneRef.current(item.id); }
    });
  }, [tapped]); // eslint-disable-line

  return (
    <Animated.View style={{
      position: 'absolute', top: 0, left: 0,
      width: item.size, height: item.size,
      opacity,
      transform: [
        { translateX: tx },
        { translateY: ty },
        { scale },
        { rotate: rotInterp },
      ],
    }}>
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`${item.colour.label} ${item.shape}`}
        style={({ pressed }) => [
          styles.shapeTapTarget,
          pressed && { opacity: 0.72 },
        ]}
      >
        <ShapeArt kind={item.shape} colour={item.colour} size={item.size} />
      </Pressable>
    </Animated.View>
  );
}

// ─── Sparkle overlay (goal completion) ───────────────────────────────────────

function SparkleOverlay({ visible, colour, reduceMotion, onDone }: {
  visible: boolean; colour: string; reduceMotion: boolean; onDone: () => void;
}) {
  const rings = useRef(
    Array.from({ length: 3 }, () => ({
      scale: new Animated.Value(0), opacity: new Animated.Value(0),
    }))
  ).current;

  useEffect(() => {
    if (!visible) return;
    // Reduce Motion: skip the ring animation, keep the flow (Rule 18 / §8).
    if (reduceMotion) {
      const timer = setTimeout(onDone, 350);
      return () => clearTimeout(timer);
    }
    rings.forEach(r => { r.scale.setValue(0); r.opacity.setValue(0); });
    const anims = rings.map((r, i) =>
      Animated.sequence([
        Animated.delay(i * 80),
        Animated.parallel([
          Animated.timing(r.scale,   { toValue: 5.5 + i, duration: 700, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
          Animated.sequence([
            Animated.timing(r.opacity, { toValue: 0.5 - i * 0.1, duration: 180, useNativeDriver: true }),
            Animated.timing(r.opacity, { toValue: 0,              duration: 520, useNativeDriver: true }),
          ]),
        ]),
      ])
    );
    Animated.parallel(anims).start(({ finished }) => { if (finished) onDone(); });
  }, [visible]); // eslint-disable-line

  if (!visible || reduceMotion) return null;
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {rings.map((r, i) => (
        <Animated.View key={i} style={{
          position: 'absolute', width: 70, height: 70, borderRadius: 35,
          backgroundColor: colour, alignSelf: 'center', top: '38%',
          opacity: r.opacity, transform: [{ scale: r.scale }],
        }} />
      ))}
      {Array.from({ length: 10 }, (_, i) => (
        <Animated.View key={`dot${i}`} pointerEvents="none" style={{
          position: 'absolute',
          width: 11, height: 11, borderRadius: 5.5,
          backgroundColor: i % 2 === 0 ? colour : '#FFFFFF',
          left: `${8 + (i * 9.1) % 84}%`,
          top:  `${12 + (i * 11.3) % 72}%`,
          opacity: rings[i % 3]!.opacity,
          transform: [{ scale: rings[i % 3]!.scale }],
        }} />
      ))}
    </View>
  );
}

// ─── Start overlay ────────────────────────────────────────────────────────────
// Difficulty + Speed radios only — no in-game settings panel (§1). Speed is
// a controlled pre-game choice (Rule 9 — pickers for choosing one option).

function StartOverlay({
  visible, difficulty, speed,
  onSelectDifficulty, onSelectSpeed, onCancel, onStart,
}: {
  visible: boolean; difficulty: Difficulty; speed: Speed;
  onSelectDifficulty: (d: Difficulty) => void;
  onSelectSpeed: (s: Speed) => void;
  onCancel: () => void; onStart: () => void;
}) {
  const t = useTheme();
  const Row = ({ label, a11ySuffix, active, onPress }: { label: string; a11ySuffix: string; active: boolean; onPress: () => void }) => (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityLabel={`${label} ${a11ySuffix}`}
      accessibilityState={{ selected: active }}
      style={({ pressed }) => [styles.diffRow, active && styles.diffRowActive, pressed && { opacity: 0.88 }]}
    >
      <View style={[styles.radio, active && styles.radioActive]}>
        {active ? <View style={[styles.radioDot, { backgroundColor: t.colors.primary }]} /> : null}
      </View>
      <Text style={[styles.diffLabel, { color: t.colors.text }]}>{label}</Text>
    </Pressable>
  );

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.overlayBackdrop}>
        <Card style={styles.overlayCard}>
          <Text style={[styles.overlayTitle, { color: t.colors.text }]} accessibilityRole="header">Colour Pop</Text>
          <Text style={[styles.overlaySub, { color: t.colors.textMuted }]}>
            Shapes fly through the field. Tap the ones that match the colour word.
          </Text>

          <View style={styles.section}>
            <Text style={[styles.eyebrow, { color: t.colors.textMuted }]}>DIFFICULTY</Text>
            <Row label="Easy"   a11ySuffix="difficulty" active={difficulty === 'easy'}   onPress={() => { hapticSelection(); onSelectDifficulty('easy'); }} />
            <Row label="Medium" a11ySuffix="difficulty" active={difficulty === 'medium'} onPress={() => { hapticSelection(); onSelectDifficulty('medium'); }} />
            <Row label="Hard"   a11ySuffix="difficulty" active={difficulty === 'hard'}   onPress={() => { hapticSelection(); onSelectDifficulty('hard'); }} />
          </View>

          <View style={styles.section}>
            <Text style={[styles.eyebrow, { color: t.colors.textMuted }]}>SPEED</Text>
            <Row label="Slow"    a11ySuffix="speed" active={speed === 'slow'}    onPress={() => { hapticSelection(); onSelectSpeed('slow'); }} />
            <Row label="Fast"    a11ySuffix="speed" active={speed === 'fast'}    onPress={() => { hapticSelection(); onSelectSpeed('fast'); }} />
            <Row label="Fastest" a11ySuffix="speed" active={speed === 'fastest'} onPress={() => { hapticSelection(); onSelectSpeed('fastest'); }} />
          </View>

          <View style={styles.overlayActions}>
            <Pressable
              onPress={onCancel}
              accessibilityRole="button"
              accessibilityLabel="Cancel"
              style={({ pressed }) => [styles.btnGhost, pressed && { opacity: 0.85 }]}
            >
              <Text style={[styles.btnGhostText, { color: t.colors.text }]}>Cancel</Text>
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

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function ColourPopScreen() {
  const t = useTheme();
  const router       = useRouter();
  const insets       = useSafeAreaInsets();
  const reduceMotion = useReduceMotion();

  // Settings — chosen once on the start overlay (§1, no in-game panels)
  const [difficulty,      setDifficulty]      = useState<Difficulty>('easy');
  // Progress logging (one record per completed run)
  const runStartRef  = useRef<number>(Date.now());
  const incorrectRef = useRef(0);
  const [speed,           setSpeed]           = useState<Speed>('slow');

  // Game state
  const [phase,        setPhase]        = useState<Phase>('select');
  const [colourIdx,    setColourIdx]    = useState(0);
  const [target,       setTarget]       = useState<ColourDef>(COLOURS[0]!);
  const [correctCount, setCorrectCount] = useState(0);
  const [activeItems,  setActiveItems]  = useState<FlyingItem[]>([]);
  const [tappedIds,    setTappedIds]    = useState<Set<string>>(new Set());
  const [sparkleOn,    setSparkleOn]    = useState(false);
  const [fieldSize,    setFieldSize]    = useState<FieldSize>({ width: 0, height: 0 });
  // Sound effects default ON (shared across all activities, persisted).
  const soundOn = useActivitySfx();
  const [gameStartedAt, setGameStartedAt] = useState<number | null>(null);
  const [tryAgainVisible, setTryAgainVisible] = useState(false);

  // Stable refs
  const colourSeqRef   = useRef<ColourDef[]>([]);
  const targetRef      = useRef(target);
  targetRef.current    = target;
  const fieldSizeRef   = useRef(fieldSize);
  fieldSizeRef.current = fieldSize;
  const advancingRef   = useRef(false);
  const launcherFrozen = useRef(false);
  // When the current colour started — drives the early/late spawn quotas.
  // Set on every fresh colour (init, advance, restart); NOT reset by the
  // 30 s timer refresh on correct taps.
  const colourStartedAtRef = useRef(Date.now());
  const timerTimeout   = useRef<ReturnType<typeof setTimeout> | null>(null);
  const timerBarAnim   = useRef<Animated.CompositeAnimation | null>(null);

  // Animated values
  const timerWidthPct = useRef(new Animated.Value(100)).current; // JS thread — layout
  const timerPulse    = useRef(new Animated.Value(1)).current;
  const colourFade    = useRef(new Animated.Value(1)).current;
  const pillScale     = useRef(new Animated.Value(1)).current;
  const tryAgainFade  = useRef(new Animated.Value(0)).current;

  // Derived
  const goal        = GOAL[difficulty];
  const shapeSize   = SHAPE_SIZE[difficulty];
  const speedCfg    = SPEED_CONFIG[speed];
  const distractors = useMemo(() => COLOURS.filter(c => c.key !== target.key), [target]);

  // Glitch shake + red flashes removed — wrong answers and timeouts get a
  // calm fade instead (hard DON'Ts: no red flash, no shake-cam; §4).

  // ── Colour advance ────────────────────────────────────────────────────
  const applyNextColour = useCallback((nextIdx: number) => {
    if (nextIdx >= TOTAL_COLOURS) {
      recordActivitySession({
        activityId: 'colour-pop',
        difficulty,
        totalLevels: TOTAL_COLOURS,
        incorrectCount: incorrectRef.current,
        durationMs: Date.now() - runStartRef.current,
      });
      setPhase('won');
      return;
    }

    Animated.timing(colourFade, { toValue: 0, duration: 160, useNativeDriver: true }).start(() => {
      setColourIdx(nextIdx);
      setTarget(colourSeqRef.current[nextIdx]!);
      setCorrectCount(0);
      setActiveItems([]);
      setTappedIds(new Set());
      setSparkleOn(false);
      advancingRef.current   = false;
      launcherFrozen.current = false;
      colourStartedAtRef.current = Date.now();

      // Pill bounce in — skipped under Reduce Motion (Rule 18)
      if (!reduceMotion) {
        pillScale.setValue(0.88);
        Animated.spring(pillScale, { toValue: 1, friction: 4, tension: 180, useNativeDriver: true }).start();
      }
      Animated.timing(colourFade, { toValue: 1, duration: reduceMotion ? 120 : 200, useNativeDriver: true }).start();
    });
  }, [colourFade, pillScale, reduceMotion, difficulty]);

  const advanceColour = useCallback((withSparkle: boolean) => {
    if (advancingRef.current) return;
    advancingRef.current   = true;
    launcherFrozen.current = true;
    if (timerTimeout.current) clearTimeout(timerTimeout.current);
    if (timerBarAnim.current) timerBarAnim.current.stop();

    const nextIdx = colourIdx + 1;

    if (withSparkle) {
      playSound('level_complete', soundOn);
      setSparkleOn(true);
    } else {
      // Timer ran out — advance with a calm fade. No sound, no shake:
      // running out of time is not an error the user made (§4).
      applyNextColour(nextIdx);
    }
  }, [applyNextColour, colourIdx, soundOn]);

  const onSparkleComplete = useCallback(() => {
    applyNextColour(colourIdx + 1);
  }, [applyNextColour, colourIdx]);

  // ── 30-second colour timer ────────────────────────────────────────────
  // Ref keeps the callback fresh without recreating the interval
  const advanceColourRef = useRef(advanceColour);
  advanceColourRef.current = advanceColour;

  const startColourTimer = useCallback(() => {
    if (timerTimeout.current) clearTimeout(timerTimeout.current);
    if (timerBarAnim.current) timerBarAnim.current.stop();

    timerWidthPct.setValue(100);
    const barAnim = Animated.timing(timerWidthPct, {
      toValue: 0, duration: COLOUR_TIMER_MS, easing: Easing.linear, useNativeDriver: false,
    });
    timerBarAnim.current = barAnim;
    barAnim.start();

    timerTimeout.current = setTimeout(() => {
      advanceColourRef.current(false);
    }, COLOUR_TIMER_MS);
  }, [timerWidthPct]);

  const resetColourTimer = useCallback(() => {
    startColourTimer();
    if (reduceMotion) return; // pulse is decorative (Rule 18)
    Animated.sequence([
      Animated.timing(timerPulse, { toValue: 1.3,  duration: 100, useNativeDriver: true }),
      Animated.spring(timerPulse, { toValue: 1, friction: 4, tension: 200, useNativeDriver: true }),
    ]).start();
  }, [reduceMotion, startColourTimer, timerPulse]);

  useEffect(() => {
    if (phase !== 'play') return;
    startColourTimer();
    return () => {
      if (timerTimeout.current) clearTimeout(timerTimeout.current);
      if (timerBarAnim.current) timerBarAnim.current.stop();
    };
  }, [phase, target, startColourTimer]);

  // ── Shape launcher ────────────────────────────────────────────────────
  // Quota-based spawning (bounded and fair): counts active correct vs
  // incorrect shapes and only spawns whichever quota has room. Timing
  // jitter on each arc keeps it random-looking.
  useEffect(() => {
    if (phase !== 'play' || fieldSize.width === 0) return;

    const interval = setInterval(() => {
      if (advancingRef.current || launcherFrozen.current) return;
      setActiveItems(prev => {
        if (prev.length >= MAX_TOTAL_ACTIVE) return prev;
        const early = Date.now() - colourStartedAtRef.current < SPAWN_EARLY_MS;
        const correctCap = early
          ? EARLY_CORRECT_CAP
          : LATE_CORRECT_CAP + speedCfg.extraCorrect;
        const activeCorrect = prev.reduce((n, i) => n + (i.isCorrect ? 1 : 0), 0);
        const activeWrong   = prev.length - activeCorrect;
        const canCorrect = activeCorrect < correctCap;
        const canWrong   = activeWrong < WRONG_CAP;
        if (!canCorrect && !canWrong) return prev;
        // When both quotas have room, lean toward the target colour so the
        // goal stays reachable, but keep the mix feeling organic.
        const makeWrong = canWrong && (!canCorrect || Math.random() < 0.4);
        const colour    = makeWrong ? randomItem(distractors) : targetRef.current;
        const { width, height } = fieldSizeRef.current;
        const traj  = makeTraj(shapeSize, width, height);
        const upMs  = speedCfg.arcUpMs   + Math.round((Math.random() - 0.5) * 200);
        const dnMs  = speedCfg.arcDownMs + Math.round((Math.random() - 0.5) * 200);
        const newItem: FlyingItem = {
          id:           `${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
          colour,
          shape:        randomItem(SHAPES_BY_DIFFICULTY[difficulty]),
          ...traj,
          size:         shapeSize,
          upDuration:   upMs,
          downDuration: dnMs,
          rotFrom:      randDeg(20),
          rotMid:       randDeg(32),
          rotTo:        randDeg(20),
          isCorrect:   !makeWrong,
        };
        return [...prev, newItem];
      });
    }, speedCfg.launchCheckMs);

    return () => clearInterval(interval);
  }, [phase, fieldSize.width, difficulty, shapeSize, speedCfg, distractors]);

  // ── Tap handler ───────────────────────────────────────────────────────
  const onShapePress = useCallback((item: FlyingItem) => {
    if (phase !== 'play' || advancingRef.current || launcherFrozen.current || tappedIds.has(item.id)) return;
    hapticSelection();

    if (item.isCorrect) {
      hapticLight(); // light impact for the commit (Rule 19)
      playSound('correct', soundOn);
      setTappedIds(prev => { const n = new Set(prev); n.add(item.id); return n; });
      resetColourTimer();
      setCorrectCount(prev => {
        const next = prev + 1;
        if (next >= goal) setTimeout(() => advanceColour(true), 320);
        return next;
      });

    } else {
      // Gentle response — soft cue + amber toast, no flash, no shake (§4).
      incorrectRef.current += 1;
      playSound('incorrect', soundOn);
      setTryAgainVisible(true);
      tryAgainFade.setValue(0);
      Animated.sequence([
        Animated.timing(tryAgainFade, { toValue: 1, duration: reduceMotion ? 80 : 140, useNativeDriver: true }),
        Animated.delay(700),
        Animated.timing(tryAgainFade, { toValue: 0, duration: reduceMotion ? 80 : 180, useNativeDriver: true }),
      ]).start(() => setTryAgainVisible(false));
    }
  }, [advanceColour, goal, phase, reduceMotion, resetColourTimer, soundOn, tappedIds, tryAgainFade]);

  const onShapeGone = useCallback((id: string) => {
    setActiveItems(prev => prev.filter(i => i.id !== id));
    setTappedIds(prev => { const n = new Set(prev); n.delete(id); return n; });
  }, []);

  // ── Game control ──────────────────────────────────────────────────────
  const initGame = useCallback(() => {
    colourSeqRef.current = generateColourSequence(TOTAL_COLOURS);
    const first = colourSeqRef.current[0]!;
    setTarget(first);
    setColourIdx(0);
    setCorrectCount(0);
    setActiveItems([]);
    setTappedIds(new Set());
    setSparkleOn(false);
    advancingRef.current   = false;
    launcherFrozen.current = false;
    colourStartedAtRef.current = Date.now();
    colourFade.setValue(1);
  }, [colourFade]);

  const startGame = useCallback(() => {
    hapticSelection();
    initGame();
    setPhase('play');
    setGameStartedAt(Date.now());
    runStartRef.current = Date.now();
    incorrectRef.current = 0;
  }, [initGame]);

  const onPlayAgain = useCallback(() => {
    initGame();
    setPhase('play');
    setGameStartedAt(Date.now());
    runStartRef.current = Date.now();
    incorrectRef.current = 0;
  }, [initGame]);

  const restartCurrentColour = useCallback(() => {
    if (timerTimeout.current) clearTimeout(timerTimeout.current);
    if (timerBarAnim.current) timerBarAnim.current.stop();
    setCorrectCount(0);
    setActiveItems([]);
    setTappedIds(new Set());
    advancingRef.current   = false;
    launcherFrozen.current = false;
    colourStartedAtRef.current = Date.now();
    startColourTimer();
  }, [startColourTimer]);

  const onReset = useCallback(() => {
    if (correctCount === 0) { restartCurrentColour(); return; }
    // Platform confirm, only when progress has been made (§2.4).
    Alert.alert(
      'Reset this colour?',
      'Your taps for this colour will start again.',
      [
        { text: 'Keep playing', style: 'cancel' },
        { text: 'Reset', style: 'destructive', onPress: restartCurrentColour },
      ],
      { cancelable: true },
    );
  }, [correctCount, restartCurrentColour]);

  // Footer nav — jump between colours, fresh start each time (§2.4).
  const goColour = useCallback((delta: 1 | -1) => {
    const next = colourIdx + delta;
    if (next < 0 || next >= TOTAL_COLOURS) return;
    hapticSelection();
    if (timerTimeout.current) clearTimeout(timerTimeout.current);
    if (timerBarAnim.current) timerBarAnim.current.stop();
    applyNextColour(next);
  }, [applyNextColour, colourIdx]);

  const canGoBack    = colourIdx > 0;
  const canGoForward = colourIdx < TOTAL_COLOURS - 1;

  const showHelp = useCallback(() => {
    Alert.alert(
      'How to play',
      'Watch the colour word — shapes fly across the field. Tap the shapes that match the colour. Enough right taps and the colour changes. Correct taps also reset the 30 second timer; when it runs out, the colour moves on by itself.',
      [{ text: 'Got it' }],
      { cancelable: true },
    );
  }, []);

  const onFieldLayout = useCallback((e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setFieldSize({ width, height });
  }, []);

  const showingGame = phase === 'play' || phase === 'won';

  // Derived colours — higher opacities for visibility
  const cardBg     = hexToRgba(target.hex, 0.22);
  const fieldBg    = hexToRgba(target.hex, 0.12);
  const pillBg     = hexToRgba(target.hex, 0.21);
  const pillBorder = hexToRgba(target.hex, 0.42);
  const dots       = Array.from({ length: goal }, (_, i) => i < correctCount);
  const timerBarColour = target.hex;
  const timerBarWidth  = timerWidthPct.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] });

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View style={styles.header}>
        <ActivityProgressBar
          current={colourIdx + 1}
          total={TOTAL_COLOURS}
          onBack={() => router.back()}
          backAccessibleLabel="Back"
          progressAccessibleLabel={`Colour ${colourIdx + 1} of ${TOTAL_COLOURS}`}
        />
        <View style={styles.headerActions}>
          <Pressable
            onPress={() => { hapticSelection(); setActivitySfxEnabled(!soundOn); }}
            hitSlop={10} accessibilityRole="button"
            accessibilityLabel={soundOn ? 'Turn sound off' : 'Turn sound on'}
            accessibilityState={{ selected: soundOn }}
            style={styles.headerIconBtn}
          >
            <Ionicons name={soundOn ? 'volume-medium-outline' : 'volume-mute-outline'} size={22} color={t.colors.text} />
          </Pressable>
          <Pressable onPress={showHelp} hitSlop={10} accessibilityRole="button" accessibilityLabel="Help" style={styles.headerIconBtn}>
            <Ionicons name="help-circle-outline" size={24} color={t.colors.text} />
          </Pressable>
        </View>
      </View>

      {showingGame ? (
        <View style={[styles.body, { paddingBottom: insets.bottom + spacing.md }]}>

          {/* Level pill + target card — calm cross-fade between colours */}
          <Animated.View style={{ opacity: colourFade }}>

            {/* Themed colour pill */}
            <View style={styles.centred}>
              <Animated.View style={[styles.levelPill, {
                backgroundColor: pillBg,
                borderColor: pillBorder,
                transform: [{ scale: pillScale }],
              }]}>
                <Text style={[styles.levelPillText, { color: target.hex }]}>
                  Level {colourIdx + 1} of {TOTAL_COLOURS}
                </Text>
              </Animated.View>
            </View>

            {/* Target colour card */}
            <View style={[styles.targetCard, { backgroundColor: cardBg }]}>
              <Text style={[styles.targetWord, { color: target.hex }]} accessibilityRole="header">
                {target.label.toUpperCase()}
              </Text>

              {/* Goal dots */}
              <View style={styles.goalDots}>
                {dots.map((filled, i) => (
                  <Animated.View key={i} style={[
                    styles.goalDot,
                    { backgroundColor: filled ? target.hex : hexToRgba(target.hex, 0.28) },
                    filled && { transform: [{ scale: timerPulse }] },
                  ]} />
                ))}
              </View>

              {/* 30 s timer bar */}
              <View style={styles.timerTrack}>
                <Animated.View style={[styles.timerFill, { backgroundColor: timerBarColour, width: timerBarWidth }]} />
              </View>
            </View>
          </Animated.View>

          {/* Play field */}
          <View
            onLayout={onFieldLayout}
            style={[styles.playField, { backgroundColor: fieldBg }]}
          >
            {/* Ambient colour blobs */}
            <View style={[styles.bgBlob1, { backgroundColor: hexToRgba(target.hex, 0.14) }]} />
            <View style={[styles.bgBlob2, { backgroundColor: hexToRgba(target.hex, 0.10) }]} />

            {/* Flying shapes */}
            {fieldSize.width > 0 && activeItems.map(item => (
              <FlyingShapeView
                key={item.id}
                item={item}
                tapped={tappedIds.has(item.id)}
                reduceMotion={reduceMotion}
                onPress={() => onShapePress(item)}
                onGone={onShapeGone}
              />
            ))}

            {/* Goal sparkle */}
            <SparkleOverlay visible={sparkleOn} colour={target.hex} reduceMotion={reduceMotion} onDone={onSparkleComplete} />
          </View>

          {/* Footer — Back / Reset / Forward (§2.4) */}
          <View style={styles.footer}>
            <Pressable
              onPress={() => goColour(-1)}
              disabled={!canGoBack}
              accessibilityRole="button"
              accessibilityLabel={canGoBack ? `Back to level ${colourIdx}` : 'No previous level'}
              accessibilityState={{ disabled: !canGoBack }}
              style={({ pressed }) => [
                styles.footerBtn, styles.footerGhost,
                !canGoBack && styles.footerBtnDisabled,
                pressed && canGoBack && { opacity: 0.85 },
              ]}
            >
              <Ionicons name="chevron-back" size={20} color={canGoBack ? t.colors.primary : t.colors.textTertiary} />
              <Text style={[styles.footerBtnText, { color: canGoBack ? t.colors.primary : t.colors.textTertiary }]}>Back</Text>
            </Pressable>

            <Pressable
              onPress={onReset}
              accessibilityRole="button"
              accessibilityLabel="Reset level"
              style={({ pressed }) => [styles.footerBtn, styles.footerReset, pressed && { opacity: 0.85 }]}
            >
              <Ionicons name="refresh" size={20} color={t.colors.textMuted} />
              <Text style={[styles.footerBtnText, { color: t.colors.textMuted }]}>Reset</Text>
            </Pressable>

            <Pressable
              onPress={() => goColour(+1)}
              disabled={!canGoForward}
              accessibilityRole="button"
              accessibilityLabel={canGoForward ? `Skip to level ${colourIdx + 2}` : 'No more levels'}
              accessibilityState={{ disabled: !canGoForward }}
              style={({ pressed }) => [
                styles.footerBtn, styles.footerForward,
                !canGoForward && styles.footerBtnDisabled,
                pressed && canGoForward && { opacity: 0.85 },
              ]}
            >
              <Text style={[styles.footerBtnText, { color: canGoForward ? '#FFFFFF' : t.colors.textTertiary }]}>Forward</Text>
              <Ionicons name="chevron-forward" size={20} color={canGoForward ? '#FFFFFF' : t.colors.textTertiary} />
            </Pressable>
          </View>

          {/* Try Again toast — soft amber, auto-dismiss (§4.2) */}
          {tryAgainVisible && (
            <Animated.View
              style={[styles.tryAgain, { bottom: insets.bottom + 80, opacity: tryAgainFade }]}
              pointerEvents="none"
            >
              <Ionicons name="refresh-circle-outline" size={20} color="#A65900" />
              <Text style={styles.tryAgainText}>Try Again</Text>
            </Animated.View>
          )}
        </View>
      ) : (
        <View style={styles.body} />
      )}

      <StartOverlay
        visible={phase === 'select'}
        difficulty={difficulty}
        speed={speed}
        onSelectDifficulty={setDifficulty}
        onSelectSpeed={setSpeed}
        onCancel={() => router.back()}
        onStart={startGame}
      />

      <ActivityCompletionOverlay
        visible={phase === 'won'}
        difficulty={difficulty}
        totalLevels={TOTAL_COLOURS}
        gameStartedAt={gameStartedAt}
        onPlayAgain={onPlayAgain}
        onNext={() => router.replace('/activities/memory-match' as never)}
        onCancel={() => router.replace('/(tabs)/activities' as never)}
        theme={ACTIVITY_THEMES.colourPop}
      />
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // Bright page per §2.1 — pure white
  safe: { flex: 1, backgroundColor: '#FFFFFF' },

  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing.lg, paddingVertical: spacing.sm,
    gap: spacing.md, backgroundColor: '#FFFFFF'},
  headerActions: { flexDirection: 'row', gap: 2 },
  headerIconBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },

  body: {
    flex: 1, paddingHorizontal: spacing.lg, paddingTop: 6,
    gap: spacing.sm, justifyContent: 'space-between'},
  centred: { alignItems: 'center', marginBottom: 4 },

  levelPill: {
    paddingHorizontal: spacing.lg, paddingVertical: 8,
    borderRadius: radii.pill, borderWidth: 1.5, alignSelf: 'center'},
  levelPillText: {
    fontSize: typography.callout, fontWeight: '900', letterSpacing: 0.4},

  targetCard: {
    alignItems: 'center', gap: 10,
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
    borderRadius: 22, overflow: 'hidden'},
  targetWord: {
    fontSize: 42, lineHeight: 48, fontWeight: '900', letterSpacing: 0.5},
  goalDots: { flexDirection: 'row', gap: 10 },
  goalDot:  { width: 15, height: 15, borderRadius: 7.5 },

  timerTrack: {
    width: '100%', height: 5,
    backgroundColor: 'rgba(0,0,0,0.15)', borderRadius: 2.5, overflow: 'hidden'},
  timerFill: { height: 5, borderRadius: 2.5 },

  playField: {
    flex: 1, position: 'relative', overflow: 'hidden',
    borderRadius: 26, minHeight: 260,
    borderWidth: 1.5, borderColor: 'rgba(0,0,0,0.07)'},
  bgBlob1: {
    position: 'absolute', width: 240, height: 240, borderRadius: 120,
    top: -55, left: -55},
  bgBlob2: {
    position: 'absolute', width: 200, height: 200, borderRadius: 100,
    bottom: -40, right: -40},
  shapeTapTarget: {
    minWidth: 60, minHeight: 60,
    alignItems: 'center', justifyContent: 'center'},

  // Footer — Back / Reset / Forward (§2.4)
  footer: { flexDirection: 'row', gap: 8 },
  footerBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    borderRadius: radii.pill,
    minHeight: 50},
  footerBtnDisabled: { opacity: 0.4 },
  footerBtnText: {
    fontSize: typography.callout,
    fontWeight: '800'},
  footerGhost:   { backgroundColor: '#E6F4FD' },
  footerReset:   { backgroundColor: '#F1F5F9' },
  footerForward: { backgroundColor: colors.primary },

  // Try Again toast — soft amber (§4.2)
  tryAgain: {
    position: 'absolute', left: spacing.lg, right: spacing.lg,
    flexDirection: 'row', gap: 8,
    alignItems: 'center', justifyContent: 'center',
    paddingVertical: spacing.md, paddingHorizontal: spacing.lg,
    backgroundColor: '#FFF4E0',
    borderRadius: radii.pill},
  tryAgainText: {
    fontSize: typography.body, fontWeight: '800', color: '#A65900'},

  // Modals
  overlayBackdrop: {
    flex: 1, backgroundColor: 'rgba(8,14,24,0.62)',
    alignItems: 'center', justifyContent: 'center', padding: spacing.lg},
  overlayCard: {
    width: '100%', maxWidth: 380,
    alignItems: 'stretch', gap: spacing.lg, padding: spacing.xl},
  overlayTitle: {
    fontSize: typography.title, fontWeight: '900', 
    textAlign: 'center', letterSpacing: typography.trackTitle},
  overlaySub: {
    fontSize: typography.body, 
    textAlign: 'center', lineHeight: 22},
  section: { gap: spacing.xs },
  eyebrow: {
    fontSize: typography.caption, fontWeight: '800', 
    letterSpacing: 1.1, textTransform: 'uppercase'},
  diffRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    padding: spacing.md, 
    borderRadius: radii.card, minHeight: 54},
  diffRowActive: { backgroundColor: '#E6F4FD' },
  radio: {
    width: 24, height: 24, borderRadius: 12,
    borderWidth: 2, 
    alignItems: 'center', justifyContent: 'center'},
  radioActive: { },
  radioDot:    { width: 12, height: 12, borderRadius: 6},
  diffLabel:   { fontSize: typography.body, fontWeight: '800'},
  overlayActions: { flexDirection: 'row', gap: spacing.sm },
  btnGhost: {
    flex: 1, paddingVertical: 14, borderRadius: radii.pill,
     alignItems: 'center', minHeight: 50},
  btnGhostText:   { fontSize: typography.body, fontWeight: '700'},
  btnPrimary: {
    flex: 1, paddingVertical: 14, borderRadius: radii.pill,
    backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center', minHeight: 50},
  btnPrimaryText: { fontSize: typography.body, fontWeight: '800', color: '#FFF' },
});
