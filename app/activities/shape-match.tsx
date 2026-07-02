/**
 * Shape Match — V3.
 *
 * V3 polish over V2:
 *   • Mint play field (#F4FAF6) with white card backing on every slot + shape
 *   • Spring-pop slot fill: 0 → overshoot → settle, + MatchParticles colour burst
 *   • Animated shape exit: scale-down + fade when placed (not instant opacity:0)
 *   • Wrong-match shake: oscillating translateX on the tapped shape
 *   • Level cross-fade: content fades out, new layout loads, fades back in
 *   • Calm level-complete cue (sound + pill flash — celebration saved for the end)
 *   • Reset confirm + Help use the platform Alert.alert (§2.4 / §10)
 *   • Removed unused dims / useWindowDimensions hack
 *   • Zone eyebrow labels: OUTLINES / SHAPES
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
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
import { Card } from '../../src/components/native/Card';
import { ActivityProgressBar } from '../../src/components/activities/ActivityProgressBar';
import {
  ActivityCompletionOverlay,
  ACTIVITY_THEMES,
} from '../../src/components/activities/ActivityCompletionOverlay';
import { useReduceMotion } from '../../src/hooks/useReduceMotion';
import { colors, radii, spacing, typography } from '../../src/theme/tokens';
import { hapticLight, hapticSelection } from '../../src/utils/haptics';
import { playSound } from '../../src/utils/sounds';
import { setActivitySfxEnabled, useActivitySfx } from '../../src/features/activities/sound-settings';
import { recordActivitySession } from '../../src/features/activities/progress-store';
import { useTheme } from '../../src/theme/useTheme';

// ─── Shapes ────────────────────────────────────────────────────────────────────

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

// ─── Shape renderer ────────────────────────────────────────────────────────────

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
      const h   = (Math.sqrt(3) / 2) * (size - inset * 2);
      const top   = `${cx},${cy - h / 2}`;
      const left  = `${inset},${cy + h / 2}`;
      const right = `${size - inset},${cy + h / 2}`;
      return (
        <Svg width={size} height={size}>
          <SvgPolygon points={`${top} ${left} ${right}`} fill={fill} stroke={stroke} strokeWidth={sw} strokeDasharray={dash} strokeLinejoin="round" />
        </Svg>
      );
    }
    case 'rectangle': {
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
      const points = starPoints(cx, cy, r, r * 0.45, 5);
      return (
        <Svg width={size} height={size}>
          <SvgPolygon points={points} fill={fill} stroke={stroke} strokeWidth={sw} strokeDasharray={dash} strokeLinejoin="round" />
        </Svg>
      );
    }
    case 'heart': {
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

// ─── Sizing per shape count ────────────────────────────────────────────────────

function gridConfig(count: number) {
  if (count <= 2)  return { cols: 2, art: 96, slot: 110, gap: 18 };
  if (count <= 4)  return { cols: 2, art: 86, slot: 100, gap: 16 };
  if (count <= 6)  return { cols: 3, art: 74, slot: 86,  gap: 12 };
  return            { cols: 4, art: 64, slot: 76,  gap: 10 };
}

// ─── MatchParticles — coloured burst when a shape snaps into its slot ─────────

const MATCH_ANGLES = [0, 45, 90, 135, 180, 225, 270, 315] as const;

function MatchParticles({ trigger, color }: { trigger: number; color: string }) {
  const particles = useRef(
    MATCH_ANGLES.map(() => ({
      opacity:  new Animated.Value(0),
      progress: new Animated.Value(0),
    }))
  ).current;

  const lastTrigger = useRef(0);

  useEffect(() => {
    if (trigger === 0 || trigger === lastTrigger.current) return;
    lastTrigger.current = trigger;

    particles.forEach(p => { p.opacity.setValue(0); p.progress.setValue(0); });

    Animated.stagger(
      14,
      particles.map(p =>
        Animated.parallel([
          Animated.timing(p.progress, {
            toValue: 1, duration: 300,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.sequence([
            Animated.timing(p.opacity, { toValue: 1, duration: 40, useNativeDriver: true }),
            Animated.timing(p.opacity, {
              toValue: 0, duration: 230, delay: 30,
              easing: Easing.out(Easing.quad),
              useNativeDriver: true,
            }),
          ]),
        ])
      )
    ).start();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trigger]);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {MATCH_ANGLES.map((angle, i) => {
        const rad    = (angle * Math.PI) / 180;
        const radius = 28;
        const p      = particles[i];
        if (!p) return null;
        return (
          <Animated.View
            key={angle}
            style={{
              position: 'absolute',
              top: '50%', left: '50%',
              width: 7, height: 7,
              marginTop: -3.5, marginLeft: -3.5,
              borderRadius: 3.5,
              backgroundColor: color,
              opacity: p.opacity,
              transform: [
                {
                  translateX: p.progress.interpolate({
                    inputRange: [0, 1], outputRange: [0, Math.cos(rad) * radius],
                  }),
                },
                {
                  translateY: p.progress.interpolate({
                    inputRange: [0, 1], outputRange: [0, Math.sin(rad) * radius],
                  }),
                },
                {
                  scale: p.progress.interpolate({
                    inputRange: [0, 0.25, 1], outputRange: [0.3, 1.3, 0.4],
                  }),
                },
              ],
            }}
          />
        );
      })}
    </View>
  );
}

// Per-level confetti removed — celebration is saved for the
// end-of-difficulty completion overlay (activity rules §5.5, Rule 15).

// ─── Slot ──────────────────────────────────────────────────────────────────────

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
  // Pulse hint animation
  const pulse = useRef(new Animated.Value(0)).current;

  // Spring-pop fill: separate scale + opacity so we can spring the scale
  const fillScale   = useRef(new Animated.Value(placed ? 1 : 0)).current;
  const fillOpacity = useRef(new Animated.Value(placed ? 1 : 0)).current;
  const prevPlaced  = useRef(placed);

  // Particle trigger — increments when shape first matches
  const [matchTrigger, setMatchTrigger] = useState(0);

  useEffect(() => {
    if (placed && !prevPlaced.current) {
      // Just matched — spring pop + fire particles
      setMatchTrigger(t => t + 1);
      Animated.parallel([
        Animated.spring(fillScale, {
          toValue: 1,
          useNativeDriver: true,
          friction: 3.8,
          tension: 460,
        }),
        Animated.timing(fillOpacity, {
          toValue: 1,
          duration: reduceMotion ? 80 : 100,
          useNativeDriver: true,
        }),
      ]).start();
    } else if (!placed) {
      fillScale.setValue(0);
      fillOpacity.setValue(0);
    }
    prevPlaced.current = placed;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [placed]);

  useEffect(() => {
    if (!hinted || reduceMotion) { pulse.setValue(0); return; }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 600, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 600, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [hinted, reduceMotion, pulse]);

  const hintScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.05] });

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
      {/* Outline (always visible, pulses on hint) */}
      <Animated.View style={{ position: 'absolute', transform: [{ scale: hintScale }] }}>
        <ShapeArt kind={shape.kind} color={shape.color} size={artSize} outline />
      </Animated.View>

      {/* Filled overlay — springs in on correct match */}
      <Animated.View
        style={{
          position: 'absolute',
          opacity: fillOpacity,
          transform: [{ scale: fillScale }],
        }}
      >
        <ShapeArt kind={shape.kind} color={shape.color} size={artSize} />
      </Animated.View>

      {/* Particle burst at match moment */}
      <MatchParticles trigger={matchTrigger} color={shape.color} />
    </Pressable>
  );
}

// ─── DraggableShape ────────────────────────────────────────────────────────────

function DraggableShape({
  shape,
  selected,
  placed,
  isWrong,
  reduceMotion,
  size,
  artSize,
  onTap,
  onDragRelease,
}: {
  shape: ShapeDef;
  selected: boolean;
  placed: boolean;
  isWrong: boolean;
  reduceMotion: boolean;
  size: number;
  artSize: number;
  onTap: () => void;
  onDragRelease: (dropX: number, dropY: number, shapeId: string) => void;
}) {
  // Pan + shake live on the JS thread (pan requires useNativeDriver:false)
  const pan    = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const shakeX = useRef(new Animated.Value(0)).current;

  // Lift + exit live on native thread (scale + opacity only)
  const lift     = useRef(new Animated.Value(0)).current;
  const exitAnim = useRef(new Animated.Value(1)).current; // 1=visible, 0=placed

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
        useNativeDriver: true,
      }),
    ]).start();
  }, [pan, lift, reduceMotion]);

  // Animate exit when placed
  useEffect(() => {
    if (placed) {
      if (reduceMotion) { exitAnim.setValue(0); return; }
      Animated.timing(exitAnim, {
        toValue: 0,
        duration: 200,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }).start();
    } else {
      exitAnim.setValue(1);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [placed]);

  // Shake on wrong match
  useEffect(() => {
    if (!isWrong || reduceMotion) return;
    shakeX.setValue(0);
    Animated.sequence([
      Animated.timing(shakeX, { toValue: -11, duration: 55, useNativeDriver: false }),
      Animated.timing(shakeX, { toValue:  11, duration: 55, useNativeDriver: false }),
      Animated.timing(shakeX, { toValue:  -8, duration: 50, useNativeDriver: false }),
      Animated.timing(shakeX, { toValue:   8, duration: 50, useNativeDriver: false }),
      Animated.timing(shakeX, { toValue:   0, duration: 45, useNativeDriver: false }),
    ]).start();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isWrong]);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_e, g) => Math.abs(g.dx) > 6 || Math.abs(g.dy) > 6,
      onPanResponderGrant: () => {
        if (placed) return;
        Animated.timing(lift, { toValue: 1, duration: 120, useNativeDriver: true }).start();
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
    // Outer view: handles pan translation + shake (JS thread)
    <Animated.View
      {...panResponder.panHandlers}
      style={[
        styles.shapeWell,
        { width: size, height: size },
        {
          transform: [
            { translateX: Animated.add(pan.x, shakeX) },
            { translateY: pan.y },
          ],
        },
      ]}
    >
      {/* Inner view: handles lift scale + exit fade (native thread) */}
      <Animated.View
        style={{
          width: size,
          height: size,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: exitAnim,
          transform: [
            { scale: liftScale },
            { scale: exitAnim },
          ],
        }}
      >
        <Pressable
          onPress={() => { if (placed) return; onTap(); }}
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
    </Animated.View>
  );
}

// ─── StartOverlay ──────────────────────────────────────────────────────────────

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
  const t = useTheme();
  const row = (d: Difficulty, label: string) => {
    const active = difficulty === d;
    return (
      <Pressable
        key={d}
        onPress={() => { hapticSelection(); onSelectDifficulty(d); }}
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
          {active ? <View style={[styles.radioDot, { backgroundColor: t.colors.primary }]} /> : null}
        </View>
        <Text style={[styles.diffLabel, { color: t.colors.text }]}>{label}</Text>
      </Pressable>
    );
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.overlayBackdrop}>
        <Card style={styles.overlayCard}>
          <Text style={[styles.overlayTitle, { color: t.colors.text }]} accessibilityRole="header">Shape Match</Text>
          <Text style={[styles.overlaySub, { color: t.colors.textMuted }]}>Match each shape to the correct outline.</Text>

          <View style={styles.overlaySection}>
            <Text style={[styles.sectionEyebrow, { color: t.colors.textMuted }]}>DIFFICULTY</Text>
            {row('easy',   'Easy')}
            {row('medium', 'Medium')}
            {row('hard',   'Hard')}
          </View>

          <View style={styles.overlayActions}>
            <Pressable
              onPress={onCancel}
              accessibilityRole="button"
              accessibilityLabel="Cancel"
              style={({ pressed }) => [styles.btnGhost, { backgroundColor: '#F1F5F9' }, pressed && { opacity: 0.85 }]}
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

// Reset confirm + Help use the platform Alert.alert — iOS-native list in
// RULES.md and activity rules §2.4 / §10.

// ─── Screen ────────────────────────────────────────────────────────────────────

type Phase = 'select' | 'play' | 'won';

interface LevelLayout {
  shapes:     ShapeDef[];
  slotOrder:  ShapeDef[];
  shapeOrder: ShapeDef[];
}

function newLevelLayout(difficulty: Difficulty): LevelLayout {
  const pool = poolFor(difficulty);
  return { shapes: pool, slotOrder: shuffle(pool), shapeOrder: shuffle(pool) };
}

export default function ShapeMatchScreen() {
  const t = useTheme();
  const router       = useRouter();
  const insets       = useSafeAreaInsets();
  const reduceMotion = useReduceMotion();

  const [phase,          setPhase]          = useState<Phase>('select');
  const [gameStartedAt,  setGameStartedAt]  = useState<number | null>(null);
  const [difficulty,     setDifficulty]     = useState<Difficulty>('easy');
  const [level,          setLevel]          = useState<number>(1);
  const [layout,         setLayout]         = useState<LevelLayout>(() => newLevelLayout('easy'));
  const [placed,         setPlaced]         = useState<Set<string>>(new Set());
  const [selectedShapeId,setSelectedShapeId]= useState<string | null>(null);
  const [hintedShapeId,  setHintedShapeId]  = useState<string | null>(null);
  const [tryAgainVisible,setTryAgainVisible]= useState(false);
  // Sound effects default ON (shared across all activities, persisted).
  // Turning them off in any game turns them off everywhere.
  const soundOn = useActivitySfx();
  const [levelPillFlash, setLevelPillFlash] = useState(false);

  // V3 additions
  const [wrongShapeId,      setWrongShapeId]      = useState<string | null>(null);

  const tryAgainFade     = useRef(new Animated.Value(0)).current;
  const levelPillScale   = useRef(new Animated.Value(1)).current;
  const contentOpacity   = useRef(new Animated.Value(1)).current; // level cross-fade
  const slotRects        = useRef<Map<ShapeKind, Rect>>(new Map());
  const wrongShapeTimer  = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Progress logging (one record per completed difficulty run)
  const runStartRef      = useRef<number>(Date.now());
  const incorrectRef     = useRef(0);

  const count      = layout.shapes.length;
  const config     = gridConfig(count);
  const totalLevels = LEVELS[difficulty];
  const allMatched  = placed.size === count;
  const progressMade = placed.size > 0;

  // Auto-advance after all shapes matched
  useEffect(() => {
    if (phase !== 'play' || !allMatched) return;

    // One calm cue per level end — no praise toast, no per-level confetti
    // (activity rules §3.1 "do not stack sounds", §5.5 confetti is saved for
    // the end-of-difficulty overlay, copy rules ban praise messages).
    playSound('level_complete', soundOn);

    // Advance level with cross-fade
    const t = setTimeout(() => {
      if (level >= totalLevels) {
        recordActivitySession({
          activityId: 'shape-match',
          difficulty,
          totalLevels,
          incorrectCount: incorrectRef.current,
          durationMs: Date.now() - runStartRef.current,
        });
        setPhase('won');
        return;
      }

      // Fade out content
      Animated.timing(contentOpacity, {
        toValue: 0,
        duration: reduceMotion ? 0 : 170,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start(() => {
        // Flash level pill — colour-only flash under Reduce Motion (Rule 18)
        setLevelPillFlash(true);
        if (reduceMotion) {
          setTimeout(() => setLevelPillFlash(false), 600);
        } else {
          Animated.sequence([
            Animated.timing(levelPillScale, { toValue: 1.12, duration: 160, useNativeDriver: true }),
            Animated.spring(levelPillScale, { toValue: 1, useNativeDriver: true, friction: 5, tension: 120 }),
          ]).start(() => setLevelPillFlash(false));
        }

        // Load new level
        setLevel(l => l + 1);
        setLayout(newLevelLayout(difficulty));
        setPlaced(new Set());
        setSelectedShapeId(null);
        setHintedShapeId(null);
        slotRects.current.clear();

        // Fade back in after React re-renders
        setTimeout(() => {
          Animated.timing(contentOpacity, {
            toValue: 1,
            duration: reduceMotion ? 0 : 220,
            useNativeDriver: true,
          }).start();
        }, 60);
      });
    }, 1300);

    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allMatched, phase]);

  // Try Again toast
  const showTryAgain = useCallback(() => {
    setTryAgainVisible(true);
    Animated.sequence([
      Animated.timing(tryAgainFade, { toValue: 1, duration: 160, useNativeDriver: true }),
      Animated.delay(900),
      Animated.timing(tryAgainFade, { toValue: 0, duration: 220, useNativeDriver: true }),
    ]).start(() => setTryAgainVisible(false));
  }, [tryAgainFade]);

  // ── Matching logic ──────────────────────────────────────────────────────────
  const attemptMatch = useCallback(
    (shapeId: string, targetKind: ShapeKind) => {
      const shape = layout.shapes.find(s => s.id === shapeId);
      if (!shape || placed.has(shape.id)) return;

      if (shape.kind === targetKind) {
        hapticLight(); // light impact for a commit (Rule 19 / design language)
        playSound('correct', soundOn);
        setPlaced(prev => { const n = new Set(prev); n.add(shape.id); return n; });
        setSelectedShapeId(null);
        setHintedShapeId(null);
      } else {
        incorrectRef.current += 1;
        playSound('incorrect', soundOn);
        showTryAgain();
        setSelectedShapeId(null);
        // Trigger shake on the wrong shape
        if (wrongShapeTimer.current) clearTimeout(wrongShapeTimer.current);
        setWrongShapeId(shapeId);
        wrongShapeTimer.current = setTimeout(() => setWrongShapeId(null), 420);
      }
    },
    [layout.shapes, placed, showTryAgain, soundOn],
  );

  const onShapeTap = useCallback(
    (shapeId: string) => {
      hapticSelection();
      const shape = layout.shapes.find(s => s.id === shapeId);
      if (!shape || placed.has(shapeId)) return;
      if (selectedShapeId) {
        playSound('change_select_selection', soundOn);
      } else {
        playSound('select_selection', soundOn);
      }
      setSelectedShapeId(prev => prev === shapeId ? null : shapeId);
    },
    [layout.shapes, placed, selectedShapeId, soundOn],
  );

  const onSlotTap = useCallback(
    (kind: ShapeKind) => {
      if (!selectedShapeId) return;
      playSound('confirm_selection', soundOn);
      attemptMatch(selectedShapeId, kind);
    },
    [selectedShapeId, attemptMatch, soundOn],
  );

  const onShapeDragRelease = useCallback(
    (dropX: number, dropY: number, shapeId: string) => {
      for (const [kind, rect] of slotRects.current.entries()) {
        if (dropX >= rect.x && dropX <= rect.x + rect.w &&
            dropY >= rect.y && dropY <= rect.y + rect.h) {
          playSound('confirm_selection', soundOn);
          attemptMatch(shapeId, kind);
          return;
        }
      }
    },
    [attemptMatch, soundOn],
  );

  // ── Controls ─────────────────────────────────────────────────────────────────
  const resetLevel = useCallback(() => {
    setPlaced(new Set());
    setSelectedShapeId(null);
    setHintedShapeId(null);
  }, []);

  const onReset = useCallback(() => {
    if (!progressMade) { resetLevel(); return; }
    // Platform confirm — §2.4 (Alert.alert only when progress has been made).
    Alert.alert(
      'Reset this level?',
      'Your progress will be cleared.',
      [
        { text: 'Keep playing', style: 'cancel' },
        { text: 'Reset', style: 'destructive', onPress: resetLevel },
      ],
      { cancelable: true },
    );
  }, [progressMade, resetLevel]);

  const showHelp = useCallback(() => {
    // Platform alert — §10 (one paragraph, "Got it").
    Alert.alert(
      'How to play',
      'Tap a shape below, then tap its matching outline above. You can also drag a shape onto its outline. If a shape does not fit, it slides back — keep trying.',
      [{ text: 'Got it' }],
      { cancelable: true },
    );
  }, []);

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

  // ── Phase transitions ─────────────────────────────────────────────────────────
  const startGame = useCallback(() => {
    hapticSelection();
    contentOpacity.setValue(1);
    setLevel(1);
    setLayout(newLevelLayout(difficulty));
    setPlaced(new Set());
    setSelectedShapeId(null);
    setHintedShapeId(null);
    setPhase('play');
    setGameStartedAt(Date.now());
    runStartRef.current = Date.now();
    incorrectRef.current = 0;
    slotRects.current.clear();
  }, [difficulty, contentOpacity]);

  const onCancelStart  = useCallback(() => router.back(), [router]);

  const onPlayAgain = useCallback(() => {
    contentOpacity.setValue(1);
    setLevel(1);
    setLayout(newLevelLayout(difficulty));
    setPlaced(new Set());
    setSelectedShapeId(null);
    setPhase('play');
    setGameStartedAt(Date.now());
    runStartRef.current = Date.now();
    incorrectRef.current = 0;
  }, [difficulty, contentOpacity]);

  const onNextActivity  = useCallback(() => router.replace('/activities/colour-pop' as never), [router]);
  const onCancelActivity = useCallback(() => router.replace('/(tabs)/activities' as never), [router]);

  // ── Render helpers ────────────────────────────────────────────────────────────
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
            style={{ flexDirection: 'row', justifyContent: 'center', gap: config.gap }}
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
            onPress={() => { hapticSelection(); setActivitySfxEnabled(!soundOn); }}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel={soundOn ? 'Turn sound off' : 'Turn sound on'}
            accessibilityState={{ selected: soundOn }}
            style={styles.headerIconBtn}
          >
            <Ionicons
              name={soundOn ? 'volume-medium-outline' : 'volume-mute-outline'}
              size={22}
              color={t.colors.text}
            />
          </Pressable>
          <Pressable
            onPress={showHelp}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="Help"
            style={styles.headerIconBtn}
          >
            <Ionicons name="help-circle-outline" size={24} color={t.colors.text} />
          </Pressable>
        </View>
      </View>

      {showingGame ? (
        <View style={[styles.body, { paddingBottom: insets.bottom + spacing.md }]}>

          {/* Level pill */}
          <View style={styles.subhead}>
            <Animated.View
              style={[
                styles.levelPill,
                levelPillFlash && { backgroundColor: '#D6F0DD' },
                { transform: [{ scale: levelPillScale }] },
              ]}
            >
              <Text style={[styles.levelPillText, { color: t.colors.primary }]}>Level {level} of {totalLevels}</Text>
            </Animated.View>
          </View>

          <Text style={[styles.instruction, { color: t.colors.text }]}>Match each shape to its outline.</Text>

          {/* Cross-fade wrapper — fades between levels */}
          <Animated.View style={{ flex: 1, gap: spacing.md, opacity: contentOpacity }}>

            {/* ── Slots zone ── */}
            <View style={styles.zone}>
              <Text style={[styles.zoneLabel, { color: t.colors.textTertiary }]}>OUTLINES</Text>
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
            </View>

            {/* Zone divider */}
            <View style={styles.zoneDivider} />

            {/* ── Shapes zone ── */}
            <View style={styles.zone}>
              <Text style={[styles.zoneLabel, { color: t.colors.textTertiary }]}>SHAPES</Text>
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
                      isWrong={wrongShapeId === shape.id}
                      reduceMotion={reduceMotion}
                      onTap={() => onShapeTap(shape.id)}
                      onDragRelease={onShapeDragRelease}
                    />
                  ),
                  'shape',
                )}
              </View>
            </View>

          </Animated.View>

          {/* Footer */}
          <View style={styles.footer}>
            <Pressable
              onPress={onBackLevel}
              disabled={!canGoBack}
              accessibilityRole="button"
              accessibilityLabel={canGoBack ? `Back to level ${level - 1}` : 'No previous level'}
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
              onPress={onForwardLevel}
              disabled={!canGoForward}
              accessibilityRole="button"
              accessibilityLabel={canGoForward ? `Skip to level ${level + 1}` : 'No more levels'}
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

          {/* Try-again toast */}
          {tryAgainVisible ? (
            <Animated.View
              style={[styles.tryAgain, { bottom: insets.bottom + 90, opacity: tryAgainFade }]}
              pointerEvents="none"
            >
              <Ionicons name="refresh-circle-outline" size={20} color="#A65900" />
              <Text style={[styles.tryAgainText, { color: '#A65900' }]}>Try Again</Text>
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

      <ActivityCompletionOverlay
        visible={phase === 'won'}
        difficulty={difficulty}
        totalLevels={totalLevels}
        gameStartedAt={gameStartedAt}
        onPlayAgain={onPlayAgain}
        onNext={onNextActivity}
        onCancel={onCancelActivity}
        theme={ACTIVITY_THEMES.shapeMatch}
      />
    </SafeAreaView>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────

// Bright page per activity rules §2.1 — pure white page, surfaces lift
// with the standard recessed grey so slots read as raised wells.
const BG      = '#FFFFFF';
const SLOT_BG = '#F1F5F9';

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    gap: spacing.md,
    backgroundColor: BG},
  headerIconBtn: {
    width: 40, height: 40,
    alignItems: 'center', justifyContent: 'center'},
  headerActions: {
    flexDirection: 'row',
    gap: 4},

  body: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    gap: spacing.sm,
    justifyContent: 'space-between'},

  subhead: { alignItems: 'center' },

  levelPill: {
    paddingHorizontal: spacing.lg,
    paddingVertical: 8,
    backgroundColor: '#E6F4FD',
    borderRadius: radii.pill},
  levelPillText: {
    fontSize: typography.body,
    fontWeight: '900',

    letterSpacing: 0.4},

  instruction: {
    fontSize: typography.body,

    textAlign: 'center',
    lineHeight: 24,
    fontWeight: '600'},

  // Zone containers — visual separation between outlines and shapes
  zone: {
    gap: spacing.xs},
  zoneLabel: {
    fontSize: typography.eyebrow ?? 11,
    fontWeight: '800',

    letterSpacing: 1.2,
    textTransform: 'uppercase',
    textAlign: 'center'},
  zoneDivider: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.07)',
    marginHorizontal: spacing.lg},

  slotsArea:  { alignItems: 'center', paddingVertical: spacing.sm },
  shapesArea: { alignItems: 'center', paddingVertical: spacing.sm },

  // Slots — recessed grey wells against the white page (§2.1, flat surfaces)
  slot: {
    borderRadius: 22,
    backgroundColor: SLOT_BG,
    alignItems: 'center',
    justifyContent: 'center'},
  slotAwaiting: { backgroundColor: '#E6F4FD' },
  slotHinted:   { backgroundColor: '#FFF4E0' },

  // Shape wells — white card so each draggable shape feels like a pickable tile
  shapeWell: {
    alignItems: 'center',
    justifyContent: 'center'},
  shapePressable: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: SLOT_BG},
  shapeSelected: {
    backgroundColor: '#E6F4FD',
    borderWidth: 3},

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
  footerReset:   { backgroundColor: SLOT_BG },
  footerForward: { backgroundColor: colors.primary },

  tryAgain: {
    position: 'absolute',
    left: spacing.lg, right: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    // Soft amber toast — activity rules §4.2
    backgroundColor: '#FFF4E0',
    borderRadius: radii.pill},
  tryAgainText: {
    fontSize: typography.body,
    fontWeight: '800'},

  // ── Modals ──────────────────────────────────────────────────────────────────
  overlayBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(8, 14, 24, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg},
  overlayCard: {
    width: '100%',
    maxWidth: 380,
    alignItems: 'stretch',
    gap: spacing.lg,
    padding: spacing.xl},
  overlayTitle: {
    fontSize: typography.title,
    fontWeight: '900',

    textAlign: 'center',
    letterSpacing: typography.trackTitle},
  overlaySub: {
    fontSize: typography.body,

    textAlign: 'center',
    lineHeight: 22},
  overlaySection: { gap: spacing.sm },
  sectionEyebrow: {
    fontSize: typography.caption,
    fontWeight: '800',

    letterSpacing: 1.1,
    textTransform: 'uppercase'},
  overlayActions: {
    flexDirection: 'row',
    gap: spacing.sm},

  diffRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,

    borderRadius: radii.card,
    minHeight: 64},
  diffRowActive: { backgroundColor: '#E6F4FD' },
  radio: {
    width: 24, height: 24,
    borderRadius: 12,
    borderWidth: 2,

    alignItems: 'center', justifyContent: 'center'},
  radioActive: { },
  radioDot: {
    width: 12, height: 12,
    borderRadius: 6},
  diffLabel: {
    fontSize: typography.body,
    fontWeight: '800'},

  btnGhost: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: radii.pill,

    alignItems: 'center', justifyContent: 'center',
    minHeight: 50},
  btnGhostText: {
    fontSize: typography.body,
    fontWeight: '700'},
  btnPrimary: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: radii.pill,
    backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
    minHeight: 50},
  btnPrimaryText: {
    fontSize: typography.body,
    fontWeight: '800',
    color: '#FFFFFF'},
});
