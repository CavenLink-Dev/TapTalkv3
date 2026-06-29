/**
 * Colour Pop
 *
 * A calm colour recognition and reaction tapping activity. The player reads a
 * target colour word, scans solid shapes, and taps matching colours.
 *
 * Structure follows Shape Match: shared progress bar, start overlay, difficulty
 * rows, sound toggle, help, footer level controls, try-again toast, completion
 * overlay, and Reduce Motion support.
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
  useWindowDimensions,
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
import { hapticSelection } from '../../src/utils/haptics';
import { playSound, playStreakSound } from '../../src/utils/sounds';

type Difficulty = 'easy' | 'medium' | 'hard';
type Phase = 'select' | 'play' | 'won';

type ShapeKind =
  | 'circle'
  | 'square'
  | 'triangle'
  | 'rectangle'
  | 'star'
  | 'diamond'
  | 'hexagon';

interface ColourDef {
  key: string;
  label: string;
  hex: string;
}

interface PopItem {
  id: string;
  colour: ColourDef;
  shape: ShapeKind;
  xPct: number;
  yPct: number;
  size: number;
  entrySide: 'left' | 'right' | 'top' | 'bottom';
}

interface LevelLayout {
  target: ColourDef;
  items: PopItem[];
}

interface FieldSize {
  width: number;
  height: number;
}

const COLOURS: ColourDef[] = [
  { key: 'red',    label: 'Red',    hex: '#E53935' },
  { key: 'blue',   label: 'Blue',   hex: '#1E88E5' },
  { key: 'yellow', label: 'Yellow', hex: '#FDD835' },
  { key: 'green',  label: 'Green',  hex: '#43A047' },
  { key: 'orange', label: 'Orange', hex: '#FB8C00' },
  { key: 'purple', label: 'Purple', hex: '#8E24AA' },
  { key: 'pink',   label: 'Pink',   hex: '#D81B60' },
  { key: 'teal',   label: 'Teal',   hex: '#00897B' },
];

const SHAPES_BY_DIFFICULTY: Record<Difficulty, ShapeKind[]> = {
  easy: ['circle', 'square', 'triangle'],
  medium: ['circle', 'square', 'triangle', 'rectangle', 'star'],
  hard: ['circle', 'square', 'triangle', 'rectangle', 'star', 'diamond', 'hexagon'],
};

const LEVELS: Record<Difficulty, number> = { easy: 15, medium: 25, hard: 30 };

const DIFFICULTY_CONFIG: Record<Difficulty, {
  colourCount: number;
  itemCount: number;
  correctGoal: number;
  correctExtra: number;
  shapeSize: number;
  hintAfterMs: number;
}> = {
  easy:   { colourCount: 4, itemCount: 8,  correctGoal: 3, correctExtra: 2, shapeSize: 70, hintAfterMs: 4000 },
  medium: { colourCount: 6, itemCount: 10, correctGoal: 4, correctExtra: 2, shapeSize: 64, hintAfterMs: 5000 },
  hard:   { colourCount: 8, itemCount: 12, correctGoal: 5, correctExtra: 2, shapeSize: 58, hintAfterMs: 6500 },
};

const POSITIONS = [
  { x: 0.14, y: 0.22 },
  { x: 0.38, y: 0.22 },
  { x: 0.62, y: 0.22 },
  { x: 0.86, y: 0.22 },
  { x: 0.14, y: 0.50 },
  { x: 0.38, y: 0.50 },
  { x: 0.62, y: 0.50 },
  { x: 0.86, y: 0.50 },
  { x: 0.14, y: 0.78 },
  { x: 0.38, y: 0.78 },
  { x: 0.62, y: 0.78 },
  { x: 0.86, y: 0.78 },
];

const CORRECT_MESSAGES = [
  'Great work!',
  'Nice pop!',
  'You got it!',
  'Well done!',
  'Spot on!',
  'Fantastic!',
  'Brilliant!',
  'Keep it up!',
];

function randomCorrectMessage(): string {
  const message = CORRECT_MESSAGES[Math.floor(Math.random() * CORRECT_MESSAGES.length)];
  return message ?? 'Great work!';
}

function randomItem<T>(items: readonly T[]): T {
  const item = items[Math.floor(Math.random() * items.length)];
  if (!item) throw new Error('Cannot choose from an empty list.');
  return item;
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

function newLevelLayout(difficulty: Difficulty, level: number): LevelLayout {
  const config = DIFFICULTY_CONFIG[difficulty];
  const colourPool = COLOURS.slice(0, config.colourCount);
  const target = randomItem(colourPool);
  const distractors = colourPool.filter(c => c.key !== target.key);
  const shapePool = SHAPES_BY_DIFFICULTY[difficulty];
  const items: Omit<PopItem, 'xPct' | 'yPct' | 'entrySide'>[] = [];
  const correctTotal = config.correctGoal + config.correctExtra;

  for (let i = 0; i < correctTotal; i++) {
    items.push({
      id: `${level}-target-${i}-${Math.random().toString(36).slice(2, 8)}`,
      colour: target,
      shape: shapePool[i % shapePool.length]!,
      size: config.shapeSize,
    });
  }

  while (items.length < config.itemCount) {
    const colour = randomItem(distractors);
    items.push({
      id: `${level}-distractor-${items.length}-${Math.random().toString(36).slice(2, 8)}`,
      colour,
      shape: randomItem(shapePool),
      size: config.shapeSize,
    });
  }

  const entrySides: PopItem['entrySide'][] = ['left', 'right', 'top', 'bottom'];

  return {
    target,
    items: shuffle(items).map((item, index) => {
      const position = POSITIONS[index % POSITIONS.length]!;
      return {
        ...item,
        xPct: position.x,
        yPct: position.y,
        entrySide: entrySides[index % entrySides.length]!,
      };
    }),
  };
}

function ShapeArt({
  kind,
  colour,
  size,
  highContrast,
}: {
  kind: ShapeKind;
  colour: ColourDef;
  size: number;
  highContrast: boolean;
}) {
  const stroke = highContrast ? '#111827' : '#263238';
  const strokeWidth = highContrast ? 4 : 2;

  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {renderShape(kind, size, colour.hex, stroke, strokeWidth)}
    </Svg>
  );
}

function renderShape(
  kind: ShapeKind,
  size: number,
  fill: string,
  stroke: string,
  strokeWidth: number,
) {
  const inset = Math.max(3, strokeWidth + 2);
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - inset;

  switch (kind) {
    case 'circle':
      return <SvgCircle cx={cx} cy={cy} r={r} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />;
    case 'square':
      return (
        <SvgRect
          x={inset}
          y={inset}
          width={size - inset * 2}
          height={size - inset * 2}
          rx={10}
          ry={10}
          fill={fill}
          stroke={stroke}
          strokeWidth={strokeWidth}
        />
      );
    case 'triangle': {
      const h = (Math.sqrt(3) / 2) * (size - inset * 2);
      const top = `${cx},${cy - h / 2}`;
      const left = `${inset},${cy + h / 2}`;
      const right = `${size - inset},${cy + h / 2}`;
      return (
        <SvgPolygon
          points={`${top} ${left} ${right}`}
          fill={fill}
          stroke={stroke}
          strokeWidth={strokeWidth}
          strokeLinejoin="round"
        />
      );
    }
    case 'rectangle': {
      const w = size - inset * 2;
      const h = w * 0.62;
      const y = (size - h) / 2;
      return (
        <SvgRect
          x={inset}
          y={y}
          width={w}
          height={h}
          rx={9}
          ry={9}
          fill={fill}
          stroke={stroke}
          strokeWidth={strokeWidth}
        />
      );
    }
    case 'star':
      return (
        <SvgPolygon
          points={starPoints(cx, cy, r, r * 0.45, 5)}
          fill={fill}
          stroke={stroke}
          strokeWidth={strokeWidth}
          strokeLinejoin="round"
        />
      );
    case 'diamond': {
      const top = `${cx},${inset}`;
      const right = `${size - inset},${cy}`;
      const bottom = `${cx},${size - inset}`;
      const left = `${inset},${cy}`;
      return (
        <SvgPolygon
          points={`${top} ${right} ${bottom} ${left}`}
          fill={fill}
          stroke={stroke}
          strokeWidth={strokeWidth}
          strokeLinejoin="round"
        />
      );
    }
    case 'hexagon':
      return (
        <SvgPolygon
          points={polygonPoints(cx, cy, r, 6, -Math.PI / 2)}
          fill={fill}
          stroke={stroke}
          strokeWidth={strokeWidth}
          strokeLinejoin="round"
        />
      );
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

function FloatingShape({
  item,
  target,
  fieldSize,
  popped,
  hinted,
  wrongFlash,
  reduceMotion,
  highContrast,
  disabled,
  onPress,
  onPopped,
}: {
  item: PopItem;
  target: ColourDef;
  fieldSize: FieldSize;
  popped: boolean;
  hinted: boolean;
  wrongFlash: boolean;
  reduceMotion: boolean;
  highContrast: boolean;
  disabled: boolean;
  onPress: () => void;
  onPopped: (id: string) => void;
}) {
  const entry = useRef(new Animated.Value(0)).current;
  const bob = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const hint = useRef(new Animated.Value(0)).current;
  const wrong = useRef(new Animated.Value(0)).current;
  const poppedRef = useRef(false);

  useEffect(() => {
    poppedRef.current = false;
    entry.setValue(0);
    bob.setValue(0);
    scale.setValue(1);
    opacity.setValue(1);
    Animated.timing(entry, {
      toValue: 1,
      duration: reduceMotion ? 120 : 640,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();

    if (reduceMotion) return undefined;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(bob, {
          toValue: 1,
          duration: 1300 + Math.round(item.xPct * 400),
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(bob, {
          toValue: 0,
          duration: 1300 + Math.round(item.yPct * 400),
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [bob, entry, item.id, item.xPct, item.yPct, opacity, reduceMotion, scale]);

  useEffect(() => {
    if (!hinted || reduceMotion) {
      hint.setValue(0);
      return undefined;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(hint, {
          toValue: 1,
          duration: 520,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(hint, {
          toValue: 0,
          duration: 520,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [hint, hinted, reduceMotion]);

  useEffect(() => {
    if (!wrongFlash) return;
    wrong.setValue(0);
    Animated.sequence([
      Animated.timing(wrong, { toValue: 1, duration: 70, useNativeDriver: true }),
      Animated.timing(wrong, { toValue: -1, duration: 90, useNativeDriver: true }),
      Animated.timing(wrong, { toValue: 0, duration: 70, useNativeDriver: true }),
    ]).start();
  }, [wrong, wrongFlash]);

  useEffect(() => {
    if (!popped || poppedRef.current) return;
    poppedRef.current = true;
    Animated.sequence([
      Animated.timing(opacity, { toValue: 0.18, duration: 70, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 70, useNativeDriver: true }),
      Animated.parallel([
        Animated.timing(scale, {
          toValue: 1.34,
          duration: reduceMotion ? 120 : 210,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: reduceMotion ? 120 : 210,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
    ]).start(({ finished }) => {
      if (finished) onPopped(item.id);
    });
  }, [item.id, onPopped, opacity, popped, reduceMotion, scale]);

  const targetLeft = clamp(item.xPct * fieldSize.width - item.size / 2, 0, fieldSize.width - item.size);
  const targetTop = clamp(item.yPct * fieldSize.height - item.size / 2, 0, fieldSize.height - item.size);
  const entryFrom = getEntryStart(item.entrySide, item.size, targetLeft, targetTop, fieldSize);
  const entryX = entry.interpolate({ inputRange: [0, 1], outputRange: [entryFrom.left - targetLeft, 0] });
  const entryY = entry.interpolate({ inputRange: [0, 1], outputRange: [entryFrom.top - targetTop, 0] });
  const bobY = bob.interpolate({ inputRange: [0, 1], outputRange: [0, item.size * 0.025] });
  const wrongX = wrong.interpolate({ inputRange: [-1, 0, 1], outputRange: [-8, 0, 8] });
  const hintScale = hint.interpolate({ inputRange: [0, 1], outputRange: [1, 1.12] });
  const hintOpacity = hint.interpolate({ inputRange: [0, 1], outputRange: [0.48, 0.9] });
  const translateX = Animated.add(entryX, wrongX);
  const translateY = Animated.add(entryY, reduceMotion ? 0 : bobY);

  return (
    <Animated.View
      style={[
        styles.floatingShape,
        {
          width: item.size,
          height: item.size,
          left: targetLeft,
          top: targetTop,
          opacity,
          transform: [
            { translateX },
            { translateY },
            { scale: hintScale },
            { scale },
          ],
        },
      ]}
    >
      {hinted ? (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.hintRing,
            {
              width: item.size + 14,
              height: item.size + 14,
              borderRadius: (item.size + 14) / 2,
              opacity: hintOpacity,
            },
          ]}
        />
      ) : null}
      <Pressable
        onPress={onPress}
        disabled={disabled || popped}
        accessibilityRole="button"
        accessibilityLabel={`${item.colour.label}${item.colour.key === target.key ? ', matches target' : ''}`}
        style={({ pressed }) => [
          styles.shapeTapTarget,
          highContrast && styles.shapeTapTargetContrast,
          pressed && !disabled && !popped && { opacity: 0.82 },
        ]}
      >
        <ShapeArt
          kind={item.shape}
          colour={item.colour}
          size={item.size}
          highContrast={highContrast}
        />
      </Pressable>
    </Animated.View>
  );
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(value, max));
}

function getEntryStart(
  side: PopItem['entrySide'],
  size: number,
  left: number,
  top: number,
  fieldSize: FieldSize,
) {
  switch (side) {
    case 'left':
      return { left: -size, top };
    case 'right':
      return { left: fieldSize.width + size, top };
    case 'top':
      return { left, top: -size };
    case 'bottom':
      return { left, top: fieldSize.height + size };
  }
}

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
          <Text style={styles.overlayTitle} accessibilityRole="header">Colour Pop</Text>
          <Text style={styles.overlaySub}>
            Tap the shapes that match the colour word.
          </Text>

          <View style={styles.section}>
            <Text style={styles.sectionEyebrow}>DIFFICULTY</Text>
            {row('easy', 'Easy')}
            {row('medium', 'Medium')}
            {row('hard', 'Hard')}
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

export default function ColourPopScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const dims = useWindowDimensions();
  const reduceMotion = useReduceMotion();

  const [phase, setPhase] = useState<Phase>('select');
  const [gameStartedAt, setGameStartedAt] = useState<number | null>(null);
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [level, setLevel] = useState(1);
  const [layout, setLayout] = useState<LevelLayout>(() => newLevelLayout('easy', 1));
  const [correctCount, setCorrectCount] = useState(0);
  const [poppedIds, setPoppedIds] = useState<Set<string>>(new Set());
  const [goneIds, setGoneIds] = useState<Set<string>>(new Set());
  const [hintedShapeId, setHintedShapeId] = useState<string | null>(null);
  const [wrongShapeId, setWrongShapeId] = useState<string | null>(null);
  const [tryAgainVisible, setTryAgainVisible] = useState(false);
  const [correctToastVisible, setCorrectToastVisible] = useState(false);
  const [correctMessage, setCorrectMessage] = useState('');
  const [soundOn, setSoundOn] = useState(true);
  const [highContrast, setHighContrast] = useState(false);
  const [levelPillFlash, setLevelPillFlash] = useState(false);
  const [fieldSize, setFieldSize] = useState<FieldSize>({ width: 0, height: 0 });

  const tryAgainFade = useRef(new Animated.Value(0)).current;
  const correctToastFade = useRef(new Animated.Value(0)).current;
  const levelPillScale = useRef(new Animated.Value(1)).current;
  const roundCompleteRef = useRef(false);

  const totalLevels = LEVELS[difficulty];
  const config = DIFFICULTY_CONFIG[difficulty];
  const progressMade = correctCount > 0;
  const fieldHeight = Math.max(290, Math.min(430, dims.height * 0.42));
  const showingGame = phase === 'play' || phase === 'won';

  const visibleItems = useMemo(
    () => layout.items.filter(item => !goneIds.has(item.id)),
    [goneIds, layout.items],
  );

  useEffect(() => {
    if (phase !== 'play' || roundCompleteRef.current) return;
    setHintedShapeId(null);
    const t = setTimeout(() => {
      const nextHint = layout.items.find(
        item => item.colour.key === layout.target.key &&
          !poppedIds.has(item.id) &&
          !goneIds.has(item.id),
      );
      setHintedShapeId(nextHint?.id ?? null);
    }, config.hintAfterMs);
    return () => clearTimeout(t);
  }, [config.hintAfterMs, correctCount, goneIds, layout.items, layout.target.key, phase, poppedIds]);

  const showTryAgain = useCallback(() => {
    setTryAgainVisible(true);
    tryAgainFade.setValue(0);
    Animated.sequence([
      Animated.timing(tryAgainFade, { toValue: 1, duration: 160, useNativeDriver: true }),
      Animated.delay(900),
      Animated.timing(tryAgainFade, { toValue: 0, duration: 220, useNativeDriver: true }),
    ]).start(() => setTryAgainVisible(false));
  }, [tryAgainFade]);

  const resetRoundState = useCallback((nextLayout: LevelLayout) => {
    roundCompleteRef.current = false;
    setLayout(nextLayout);
    setCorrectCount(0);
    setPoppedIds(new Set());
    setGoneIds(new Set());
    setHintedShapeId(null);
    setWrongShapeId(null);
    setTryAgainVisible(false);
    setCorrectToastVisible(false);
  }, []);

  const advanceAfterRound = useCallback(() => {
    playSound('level_complete', soundOn);
    playStreakSound(level, soundOn);

    setCorrectMessage(randomCorrectMessage());
    setCorrectToastVisible(true);
    correctToastFade.setValue(0);
    Animated.sequence([
      Animated.timing(correctToastFade, { toValue: 1, duration: 160, useNativeDriver: true }),
      Animated.delay(800),
      Animated.timing(correctToastFade, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(() => setCorrectToastVisible(false));

    const t = setTimeout(() => {
      if (level >= totalLevels) {
        setPhase('won');
        return;
      }
      setLevelPillFlash(true);
      Animated.sequence([
        Animated.timing(levelPillScale, { toValue: 1.12, duration: 160, useNativeDriver: true }),
        Animated.spring(levelPillScale, { toValue: 1, useNativeDriver: true, friction: 5, tension: 120 }),
      ]).start(() => setLevelPillFlash(false));
      setLevel(current => {
        const next = current + 1;
        resetRoundState(newLevelLayout(difficulty, next));
        return next;
      });
    }, 1300);

    return () => clearTimeout(t);
  }, [correctToastFade, difficulty, level, levelPillScale, resetRoundState, soundOn, totalLevels]);

  const onShapePopped = useCallback((id: string) => {
    setGoneIds(prev => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  }, []);

  const onShapePress = useCallback((item: PopItem) => {
    if (phase !== 'play' || roundCompleteRef.current || poppedIds.has(item.id)) return;
    hapticSelection();
    setHintedShapeId(null);

    if (item.colour.key === layout.target.key) {
      playSound('correct', soundOn);
      setPoppedIds(prev => {
        const next = new Set(prev);
        next.add(item.id);
        return next;
      });
      setCorrectCount(prev => {
        const next = prev + 1;
        if (next >= config.correctGoal && !roundCompleteRef.current) {
          roundCompleteRef.current = true;
          setTimeout(advanceAfterRound, 230);
        }
        return next;
      });
      return;
    }

    playSound('incorrect', soundOn);
    setWrongShapeId(item.id);
    showTryAgain();
    setTimeout(() => {
      setWrongShapeId(current => (current === item.id ? null : current));
    }, 360);
  }, [advanceAfterRound, config.correctGoal, layout.target.key, phase, poppedIds, showTryAgain, soundOn]);

  const resetCurrentLevel = useCallback(() => {
    resetRoundState(newLevelLayout(difficulty, level));
  }, [difficulty, level, resetRoundState]);

  const onReset = useCallback(() => {
    if (!progressMade) {
      resetCurrentLevel();
      return;
    }
    Alert.alert(
      'Reset this level?',
      'Your current progress will be cleared.',
      [
        { text: 'Keep Playing', style: 'cancel' },
        { text: 'Reset', style: 'destructive', onPress: resetCurrentLevel },
      ],
      { cancelable: true },
    );
  }, [progressMade, resetCurrentLevel]);

  const goLevel = useCallback((delta: 1 | -1) => {
    setLevel(prev => {
      const next = prev + delta;
      if (next < 1 || next > totalLevels) return prev;
      hapticSelection();
      resetRoundState(newLevelLayout(difficulty, next));
      return next;
    });
  }, [difficulty, resetRoundState, totalLevels]);

  const startGame = useCallback(() => {
    hapticSelection();
    setLevel(1);
    resetRoundState(newLevelLayout(difficulty, 1));
    setPhase('play');
    setGameStartedAt(Date.now());
  }, [difficulty, resetRoundState]);

  const onPlayAgain = useCallback(() => {
    setLevel(1);
    resetRoundState(newLevelLayout(difficulty, 1));
    setPhase('play');
    setGameStartedAt(Date.now());
  }, [difficulty, resetRoundState]);

  const onNextActivity = useCallback(() => {
    router.replace('/activities/memory-match' as never);
  }, [router]);

  const onCancelActivity = useCallback(() => {
    router.replace('/(tabs)/activities' as never);
  }, [router]);

  const onCancelStart = useCallback(() => router.back(), [router]);

  const showHelp = useCallback(() => {
    Alert.alert(
      'How to play',
      'Look at the colour word. Tap shapes with the same colour. Wrong taps are okay - just try again.',
      [{ text: 'Got it' }],
      { cancelable: true },
    );
  }, []);

  const onFieldLayout = useCallback((event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setFieldSize({ width, height });
  }, []);

  const canGoBack = level > 1;
  const canGoForward = level < totalLevels;

  return (
    <SafeAreaView style={[styles.safe, highContrast && styles.safeContrast]} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={[styles.header, highContrast && styles.headerContrast]}>
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
            accessibilityLabel={soundOn ? 'Turn sound off' : 'Turn sound on'}
            accessibilityState={{ selected: soundOn }}
            style={styles.headerIconBtn}
          >
            <Ionicons
              name={soundOn ? 'volume-medium-outline' : 'volume-mute-outline'}
              size={22}
              color={highContrast ? '#000000' : colors.text}
            />
          </Pressable>
          <Pressable
            onPress={() => {
              hapticSelection();
              setHighContrast(v => !v);
            }}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel={highContrast ? 'Turn high contrast off' : 'Turn high contrast on'}
            accessibilityState={{ selected: highContrast }}
            style={styles.headerIconBtn}
          >
            <Ionicons
              name="contrast-outline"
              size={23}
              color={highContrast ? '#000000' : colors.text}
            />
          </Pressable>
          <Pressable
            onPress={showHelp}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="Help"
            style={styles.headerIconBtn}
          >
            <Ionicons name="help-circle-outline" size={24} color={highContrast ? '#000000' : colors.text} />
          </Pressable>
        </View>
      </View>

      {showingGame ? (
        <View style={[styles.body, { paddingBottom: insets.bottom + spacing.md }]}>
          <View style={styles.subhead}>
            <Animated.View
              style={[
                styles.levelPill,
                highContrast && styles.levelPillContrast,
                levelPillFlash && styles.levelPillFlash,
                { transform: [{ scale: levelPillScale }] },
              ]}
            >
              <Text style={[styles.levelPillText, highContrast && styles.levelPillTextContrast]}>
                Level {level} of {totalLevels}
              </Text>
            </Animated.View>
          </View>

          <View style={[styles.targetCard, highContrast && styles.targetCardContrast]}>
            <View style={styles.targetRow}>
              <Text
                style={[
                  styles.targetWord,
                  { color: highContrast ? '#FFFFFF' : layout.target.hex },
                ]}
                accessibilityRole="header"
              >
                {layout.target.label.toUpperCase()}
              </Text>
            </View>
          </View>

          <View
            onLayout={onFieldLayout}
            style={[
              styles.playField,
              { height: fieldHeight },
              highContrast && styles.playFieldContrast,
            ]}
          >
            {fieldSize.width > 0 && fieldSize.height > 0 ? (
              visibleItems.map(item => (
                <FloatingShape
                  key={item.id}
                  item={item}
                  target={layout.target}
                  fieldSize={fieldSize}
                  popped={poppedIds.has(item.id)}
                  hinted={hintedShapeId === item.id}
                  wrongFlash={wrongShapeId === item.id}
                  reduceMotion={reduceMotion}
                  highContrast={highContrast}
                  disabled={phase !== 'play' || roundCompleteRef.current}
                  onPress={() => onShapePress(item)}
                  onPopped={onShapePopped}
                />
              ))
            ) : null}
          </View>

          <View style={styles.footer}>
            <Pressable
              onPress={() => goLevel(-1)}
              disabled={!canGoBack}
              accessibilityRole="button"
              accessibilityLabel={canGoBack ? `Back to level ${level - 1}` : 'No previous level'}
              accessibilityState={{ disabled: !canGoBack }}
              style={({ pressed }) => [
                styles.footerBtn,
                styles.footerGhost,
                highContrast && styles.footerGhostContrast,
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
              style={({ pressed }) => [
                styles.footerBtn,
                styles.footerReset,
                highContrast && styles.footerResetContrast,
                pressed && { opacity: 0.85 },
              ]}
            >
              <Ionicons name="refresh" size={20} color={highContrast ? '#000000' : colors.textMuted} />
              <Text style={[styles.footerBtnText, { color: highContrast ? '#000000' : colors.textMuted }]}>Reset</Text>
            </Pressable>

            <Pressable
              onPress={() => goLevel(1)}
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

          {tryAgainVisible ? (
            <Animated.View
              style={[
                styles.tryAgain,
                highContrast && styles.tryAgainContrast,
                { bottom: insets.bottom + 90, opacity: tryAgainFade },
              ]}
              pointerEvents="none"
            >
              <Ionicons name="refresh-circle-outline" size={20} color={highContrast ? '#000000' : colors.primary} />
              <Text style={[styles.tryAgainText, highContrast && styles.tryAgainTextContrast]}>Try Again</Text>
            </Animated.View>
          ) : null}

          {correctToastVisible ? (
            <Animated.View
              style={[
                styles.correctToast,
                { bottom: insets.bottom + 90, opacity: correctToastFade },
              ]}
              pointerEvents="none"
            >
              <Ionicons name="checkmark-circle-outline" size={20} color="#1A7A3A" />
              <Text style={styles.correctToastText}>{correctMessage}</Text>
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
        theme={ACTIVITY_THEMES.colourPop}
      />
    </SafeAreaView>
  );
}

const BG = '#FFFFFF';
const FIELD_BG = '#F8FBFF';
const SLOT_BG = '#F1F5F9';

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: BG,
  },
  safeContrast: {
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    gap: spacing.md,
    backgroundColor: BG,
  },
  headerContrast: {
    borderBottomWidth: 2,
    borderBottomColor: '#000000',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 2,
  },
  headerIconBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    gap: spacing.md,
    justifyContent: 'space-between',
  },
  subhead: {
    alignItems: 'center',
  },
  levelPill: {
    paddingHorizontal: spacing.lg,
    paddingVertical: 8,
    backgroundColor: '#E6F4FD',
    borderRadius: radii.pill,
  },
  levelPillContrast: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#000000',
  },
  levelPillFlash: {
    backgroundColor: '#D6F0DD',
  },
  levelPillText: {
    fontSize: typography.body,
    fontWeight: '900',
    color: colors.primary,
  },
  levelPillTextContrast: {
    color: '#000000',
  },
  targetCard: {
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: '#EAF6FF',
    borderRadius: 24,
  },
  targetCardContrast: {
    backgroundColor: '#000000',
    borderWidth: 2,
    borderColor: '#000000',
  },
  targetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    minHeight: 58,
  },
  targetWord: {
    fontSize: 36,
    lineHeight: 42,
    fontWeight: '900',
    color: colors.text,
    letterSpacing: 0,
  },
  playField: {
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 26,
    backgroundColor: FIELD_BG,
    borderWidth: 2,
    borderColor: '#E1EEF8',
  },
  playFieldContrast: {
    backgroundColor: '#FFFFFF',
    borderColor: '#000000',
  },
  floatingShape: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shapeTapTarget: {
    minWidth: 64,
    minHeight: 64,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shapeTapTargetContrast: {
    borderRadius: 20,
  },
  hintRing: {
    position: 'absolute',
    borderWidth: 4,
    borderColor: '#FFD54F',
    backgroundColor: 'rgba(255, 213, 79, 0.18)',
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
  footerGhost: {
    backgroundColor: '#E6F4FD',
  },
  footerGhostContrast: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#000000',
  },
  footerReset: {
    backgroundColor: SLOT_BG,
  },
  footerResetContrast: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#000000',
  },
  footerForward: {
    backgroundColor: colors.primary,
  },
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
    backgroundColor: '#E6F4FD',
    borderRadius: radii.pill,
  },
  tryAgainContrast: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#000000',
  },
  tryAgainText: {
    fontSize: typography.body,
    fontWeight: '800',
    color: colors.primary,
  },
  tryAgainTextContrast: {
    color: '#000000',
  },
  correctToast: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: '#D6F0DD',
    borderRadius: radii.pill,
  },
  correctToastText: {
    fontSize: typography.body,
    fontWeight: '800',
    color: '#1A7A3A',
  },
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
  section: {
    gap: spacing.sm,
  },
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
  radioActive: {
    borderColor: colors.primary,
  },
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
});
