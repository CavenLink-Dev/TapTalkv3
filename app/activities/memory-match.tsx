/**
 * Memory Match — phase-based structure matching ShapeMatch.
 *   select → StartOverlay (pick difficulty)
 *   play   → game (ActivityProgressBar + level pill + toasts)
 *   won    → SuccessOverlay
 *
 * Within each level the round has its own inner phase:
 *   show → choose → result
 *
 * Difficulty:
 *   Easy   — shape visible for 2.0 s, 8 levels
 *   Medium — shape visible for 1.4 s, 12 levels
 *   Hard   — shape visible for 0.8 s, 16 levels
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../../src/components/native/Card';
import { useReduceMotion } from '../../src/hooks/useReduceMotion';
import { useSpeech } from '../../src/hooks/useSpeech';
import { ActivityProgressBar } from '../../src/components/activities/ActivityProgressBar';
import {
  ActivityCompletionOverlay,
  ACTIVITY_THEMES,
} from '../../src/components/activities/ActivityCompletionOverlay';
import { useAppContext } from '../../src/hooks/useAppContext';
import { hapticLight, hapticSelection } from '../../src/utils/haptics';
import { playSound, playSelectThenConfirm } from '../../src/utils/sounds';
import { setActivitySfxEnabled, useActivitySfx } from '../../src/features/activities/sound-settings';
import { recordActivitySession } from '../../src/features/activities/progress-store';
import { colors, radii, spacing, typography } from '../../src/theme/tokens';
import { useTheme } from '../../src/theme/useTheme';

// ─── Types ───────────────────────────────────────────────────────────────────

type Difficulty = 'easy' | 'medium' | 'hard';
type Phase = 'select' | 'play' | 'won';
type RoundPhase = 'show' | 'choose' | 'result';

interface Round {
  target: number;
  choices: number[];
}

// ─── Config ──────────────────────────────────────────────────────────────────

const SHOW_DURATION: Record<Difficulty, number> = { easy: 2000, medium: 1400, hard: 800 };
const TOTAL_LEVELS: Record<Difficulty, number> = { easy: 8, medium: 12, hard: 16 };
const DIFF_LABEL: Record<Difficulty, string> = { easy: 'Easy', medium: 'Medium', hard: 'Hard' };

const SHAPES: { color: string; radius: number; label: string }[] = [
  { color: '#199AEE', radius: 50,  label: 'Blue circle'    },
  { color: '#5CD65C', radius: 8,   label: 'Green square'   },
  { color: '#BD73FF', radius: 28,  label: 'Purple rounded' },
  { color: '#F58625', radius: 50,  label: 'Orange circle'  },
  { color: '#FA838E', radius: 8,   label: 'Pink square'    },
];

function randomRound(): Round {
  const target = Math.floor(Math.random() * SHAPES.length);
  const pool = SHAPES.map((_, i) => i).filter(i => i !== target);
  const shuffled = pool.sort(() => Math.random() - 0.5).slice(0, 2);
  const choices = [target, ...shuffled].sort(() => Math.random() - 0.5);
  return { target, choices };
}

// ─── Shape ───────────────────────────────────────────────────────────────────

function Shape({ index, size = 64 }: { index: number; size?: number }) {
  const s = SHAPES[index]!;
  return (
    <View
      style={{ width: size, height: size, borderRadius: s.radius, backgroundColor: s.color }}
      accessibilityLabel={s.label}
    />
  );
}

// ─── StartOverlay ────────────────────────────────────────────────────────────

function StartOverlay({
  visible, difficulty, onSelectDifficulty, onCancel, onStart,
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
        style={({ pressed }) => [styles.diffRow, active && styles.diffRowActive, pressed && { opacity: 0.92 }]}
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
          <Text style={[styles.overlayTitle, { color: t.colors.text }]} accessibilityRole="header">Memory Match</Text>
          <Text style={[styles.overlaySub, { color: t.colors.textMuted }]}>
            A shape appears then hides. Pick the one you saw.
          </Text>

          <View style={styles.section}>
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

// SuccessOverlay replaced by shared ActivityCompletionOverlay — see import above.

// ─── Screen ──────────────────────────────────────────────────────────────────

export default function MemoryMatchScreen() {
  const t = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const reduceMotion = useReduceMotion();
  const { state, dispatch } = useAppContext();
  const { speak, stop: stopSpeech } = useSpeech();

  const [phase, setPhase] = useState<Phase>('select');
  const [gameStartedAt, setGameStartedAt] = useState<number | null>(null);
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [level, setLevel] = useState(1);
  const [round, setRound] = useState<Round>(randomRound);
  const [roundPhase, setRoundPhase] = useState<RoundPhase>('show');
  const [chosen, setChosen] = useState<number | null>(null);
  // Sound effects (MP3 cues) default ON — shared across activities, persisted.
  const soundOn = useActivitySfx();
  // Voice (spoken symbol names) stays opt-in, default OFF (§3).
  const [voiceOn, setVoiceOn] = useState(false);
  const [levelPillFlash, setLevelPillFlash] = useState(false);
  const [tryAgainVisible, setTryAgainVisible] = useState(false);

  const shapeOpacity    = useRef(new Animated.Value(1)).current;
  const tryAgainFade    = useRef(new Animated.Value(0)).current;
  const levelPillScale  = useRef(new Animated.Value(1)).current;
  // Pending auto-advance — cleared by footer nav, reset, and unmount.
  const advanceTimer    = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Progress logging (one record per completed difficulty run)
  const runStartRef     = useRef<number>(Date.now());
  const incorrectRef    = useRef(0);

  const totalLevels = TOTAL_LEVELS[difficulty];

  const clearAdvanceTimer = useCallback(() => {
    if (advanceTimer.current) {
      clearTimeout(advanceTimer.current);
      advanceTimer.current = null;
    }
  }, []);

  useEffect(() => clearAdvanceTimer, [clearAdvanceTimer]);

  // One cue per game (§3): speak the shape name when it is revealed,
  // through useSpeech and on top of the user's voice preferences.
  const speakTarget = useCallback((targetIndex: number) => {
    if (!voiceOn) return;
    stopSpeech();
    speak(SHAPES[targetIndex]!.label, {
      rate: state.accessibility.speechRate,
      pitch: state.accessibility.speechPitch,
    });
  }, [voiceOn, speak, stopSpeech, state.accessibility.speechRate, state.accessibility.speechPitch]);

  const startGame = useCallback(() => {
    hapticSelection();
    clearAdvanceTimer();
    const newRound = randomRound();
    setLevel(1);
    setRound(newRound);
    setRoundPhase('show');
    setChosen(null);
    shapeOpacity.setValue(1);
    setPhase('play');
    setGameStartedAt(Date.now());
    runStartRef.current = Date.now();
    incorrectRef.current = 0;
    speakTarget(newRound.target);
  }, [clearAdvanceTimer, shapeOpacity, speakTarget]);

  // Auto-hide shape after SHOW_DURATION then enter choose phase.
  useEffect(() => {
    if (phase !== 'play' || roundPhase !== 'show') return;
    shapeOpacity.setValue(1);

    const timer = setTimeout(() => {
      Animated.timing(shapeOpacity, {
        toValue: 0,
        // Reduce Motion: shorter fade, same behaviour (Rule 18 / §8)
        duration: reduceMotion ? 120 : 340,
        useNativeDriver: true,
      }).start(() => setRoundPhase('choose'));
    }, SHOW_DURATION[difficulty]);

    return () => clearTimeout(timer);
  }, [phase, roundPhase, round, shapeOpacity, difficulty, reduceMotion]);

  const showTryAgain = useCallback(() => {
    setTryAgainVisible(true);
    Animated.sequence([
      Animated.timing(tryAgainFade, { toValue: 1, duration: reduceMotion ? 80 : 160, useNativeDriver: true }),
      Animated.delay(900),
      Animated.timing(tryAgainFade, { toValue: 0, duration: reduceMotion ? 80 : 220, useNativeDriver: true }),
    ]).start(() => setTryAgainVisible(false));
  }, [reduceMotion, tryAgainFade]);

  const nextRound = useCallback(() => {
    // Flash level pill — colour-only under Reduce Motion (Rule 18)
    setLevelPillFlash(true);
    if (reduceMotion) {
      setTimeout(() => setLevelPillFlash(false), 600);
    } else {
      Animated.sequence([
        Animated.timing(levelPillScale, { toValue: 1.12, duration: 160, useNativeDriver: true }),
        Animated.spring(levelPillScale, { toValue: 1, useNativeDriver: true, friction: 5, tension: 120 }),
      ]).start(() => setLevelPillFlash(false));
    }

    if (level >= totalLevels) {
      playSound('level_complete', soundOn);
      recordActivitySession({
        activityId: 'memory-match',
        difficulty,
        totalLevels,
        incorrectCount: incorrectRef.current,
        durationMs: Date.now() - runStartRef.current,
      });
      setPhase('won');
      return;
    }

    const newRound = randomRound();
    setLevel(l => l + 1);
    setRound(newRound);
    setRoundPhase('show');
    setChosen(null);
    shapeOpacity.setValue(1);
    speakTarget(newRound.target);
  }, [level, levelPillScale, reduceMotion, shapeOpacity, soundOn, speakTarget, totalLevels]);

  const handleChoice = useCallback((shapeIndex: number) => {
    if (roundPhase !== 'choose') return;
    hapticSelection();
    playSelectThenConfirm(soundOn);
    const correct = shapeIndex === round.target;
    setChosen(shapeIndex);
    setTimeout(() => {
      if (correct) {
        dispatch({ type: 'INCREMENT_ACTIVITY_STATS', payload: { minutes: 1 } });
        hapticLight(); // light impact for the outcome commit (Rule 19)
        playSound('correct', soundOn);
      } else {
        incorrectRef.current += 1;
        playSound('incorrect', soundOn);
        showTryAgain();
      }
    }, 180);
    setRoundPhase('result');
    // Auto-advance — no "Next" tap required (§2.3 / §5.6).
    clearAdvanceTimer();
    advanceTimer.current = setTimeout(() => {
      advanceTimer.current = null;
      nextRound();
    }, 1400);
  }, [clearAdvanceTimer, dispatch, nextRound, round.target, roundPhase, showTryAgain, soundOn]);

  // Footer nav — fresh start at the destination level (§2.4).
  const goLevel = useCallback((delta: 1 | -1) => {
    clearAdvanceTimer();
    setLevel(prev => {
      const next = prev + delta;
      if (next < 1 || next > totalLevels) return prev;
      hapticSelection();
      const newRound = randomRound();
      setRound(newRound);
      setRoundPhase('show');
      setChosen(null);
      shapeOpacity.setValue(1);
      speakTarget(newRound.target);
      return next;
    });
  }, [clearAdvanceTimer, shapeOpacity, speakTarget, totalLevels]);

  const resetLevel = useCallback(() => {
    clearAdvanceTimer();
    const newRound = randomRound();
    setRound(newRound);
    setRoundPhase('show');
    setChosen(null);
    shapeOpacity.setValue(1);
    speakTarget(newRound.target);
  }, [clearAdvanceTimer, shapeOpacity, speakTarget]);

  const onReset = useCallback(() => {
    if (chosen === null) { resetLevel(); return; }
    // Platform confirm, only when progress has been made (§2.4).
    Alert.alert(
      'Reset this level?',
      'This round will start again.',
      [
        { text: 'Keep playing', style: 'cancel' },
        { text: 'Reset', style: 'destructive', onPress: resetLevel },
      ],
      { cancelable: true },
    );
  }, [chosen, resetLevel]);

  const canGoBack    = level > 1;
  const canGoForward = level < totalLevels;

  const onPlayAgain = useCallback(() => {
    clearAdvanceTimer();
    const newRound = randomRound();
    setLevel(1);
    setRound(newRound);
    setRoundPhase('show');
    setChosen(null);
    shapeOpacity.setValue(1);
    setPhase('play');
    setGameStartedAt(Date.now());
    runStartRef.current = Date.now();
    incorrectRef.current = 0;
  }, [clearAdvanceTimer, shapeOpacity]);

  const onNextActivity = useCallback(() => {
    router.replace('/activities/shape-match' as never);
  }, [router]);

  const onCancelActivity = useCallback(() => {
    router.replace('/(tabs)/activities' as never);
  }, [router]);

  const showHelp = () => {
    Alert.alert(
      'How to play',
      'A shape will appear briefly, then hide. Choose the shape you saw from the three options below.',
      [{ text: 'Got it' }],
      { cancelable: true },
    );
  };

  const isCorrect = chosen !== null && chosen === round.target;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* ── Header — always visible ─────────────────────────────────── */}
      <View style={styles.header}>
        <ActivityProgressBar
          current={phase === 'play' ? level : 1}
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
            accessibilityLabel={soundOn ? 'Turn sound effects off' : 'Turn sound effects on'}
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
            onPress={() => { hapticSelection(); setVoiceOn(v => !v); }}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel={voiceOn ? 'Turn voice off' : 'Turn voice on'}
            accessibilityState={{ selected: voiceOn }}
            style={styles.headerIconBtn}
          >
            <Ionicons
              name={voiceOn ? 'chatbubble-ellipses-outline' : 'chatbubble-outline'}
              size={22}
              color={voiceOn ? t.colors.primary : t.colors.text}
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

      {/* ── Game body ────────────────────────────────────────────────── */}
      {phase === 'play' ? (
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 48 }]}
          showsVerticalScrollIndicator={false}
          bounces
          alwaysBounceVertical
        >
          {/* Level pill */}
          <View style={styles.subhead}>
            <Animated.View
              style={[
                styles.levelPill,
                levelPillFlash && { backgroundColor: '#D6F0DD' },
                { transform: [{ scale: levelPillScale }] },
              ]}
            >
              <Text style={[styles.levelPillText, { color: t.colors.primary }]}>
                Level {level} of {totalLevels}
              </Text>
            </Animated.View>
          </View>

          <Text style={[styles.instruction, { color: t.colors.text }]}>
            {roundPhase === 'show'   ? 'Look at the shape.' : null}
            {roundPhase === 'choose' ? 'Which shape did you see?' : null}
            {roundPhase === 'result'
              ? (isCorrect ? 'You got it.' : 'Keep going.')
              : null}
          </Text>

          {/* Target shape */}
          <View style={[styles.targetBox, { backgroundColor: t.colors.surface }]}>
            <Animated.View style={{ opacity: shapeOpacity }}>
              <Shape index={round.target} size={80} />
            </Animated.View>
            {roundPhase === 'choose' && (
              <View style={styles.hiddenLabel}>
                <Text style={[styles.hiddenText, { color: t.colors.textTertiary }]}>Hidden</Text>
              </View>
            )}
          </View>

          {/* Choice grid */}
          {roundPhase !== 'show' && (
            <View style={styles.choiceGrid}>
              {round.choices.map((shapeIndex) => {
                const isSelected = chosen === shapeIndex;
                const isTarget   = shapeIndex === round.target;
                let borderColor: string = t.colors.border;
                if (roundPhase === 'result' && isSelected && isCorrect) borderColor = t.colors.success;
                if (roundPhase === 'result' && isTarget)                borderColor = t.colors.success;
                return (
                  <Pressable
                    key={shapeIndex}
                    onPress={() => handleChoice(shapeIndex)}
                    disabled={roundPhase === 'result'}
                    accessibilityRole="button"
                    accessibilityLabel={`Choose ${SHAPES[shapeIndex]!.label}`}
                    style={({ pressed }) => [
                      styles.choiceCard,
                      { backgroundColor: '#FFFFFF', borderColor },
                      pressed && styles.choicePressed,
                    ]}
                  >
                    <Shape index={shapeIndex} size={56} />
                  </Pressable>
                );
              })}
            </View>
          )}

        </ScrollView>
      ) : (
        <View style={{ flex: 1 }} />
      )}

      {/* ── Footer — Back / Reset / Forward (§2.4) ───────────────────── */}
      {phase === 'play' ? (
        <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}>
          <Pressable
            onPress={() => goLevel(-1)}
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
            onPress={() => goLevel(+1)}
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
      ) : null}

      {/* ── Try Again toast — soft amber, auto-dismiss (§4.2) ─────────── */}
      {tryAgainVisible ? (
        <Animated.View
          style={[styles.tryAgain, { bottom: insets.bottom + 90, opacity: tryAgainFade }]}
          pointerEvents="none"
        >
          <Ionicons name="refresh-circle-outline" size={20} color="#A65900" />
          <Text style={styles.tryAgainText}>Try Again</Text>
        </Animated.View>
      ) : null}

      {/* ── Overlays ─────────────────────────────────────────────────── */}
      <StartOverlay
        visible={phase === 'select'}
        difficulty={difficulty}
        onSelectDifficulty={setDifficulty}
        onCancel={() => router.back()}
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
        theme={ACTIVITY_THEMES.memoryMatch}
      />
    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const BG = '#FFFFFF';

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    gap: spacing.md,
    backgroundColor: BG},
  headerActions: { flexDirection: 'row', gap: 4 },
  headerIconBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },

  content: {
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.xl},

  subhead: { alignItems: 'center', width: '100%' },
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
    fontSize: typography.subheading,
    fontWeight: '800',

    textAlign: 'center',
    letterSpacing: -0.2,
    minHeight: 32},

  targetBox: {
    width: 140,
    height: 140,
    borderRadius: radii.card,

    alignItems: 'center',
    justifyContent: 'center'},
  hiddenLabel: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  hiddenText: {
    fontSize: typography.caption,
    fontWeight: '700',

    letterSpacing: 0.8,
    textTransform: 'uppercase'},

  choiceGrid: {
    flexDirection: 'row',
    gap: spacing.lg,
    justifyContent: 'center',
    flexWrap: 'wrap'},
  choiceCard: {
    width: 100,
    height: 100,
    borderRadius: radii.card,

    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2.5},
  choicePressed: {  transform: [{ scale: 0.96 }] },

  // ── Footer — Back / Reset / Forward (§2.4) ──────────────────────────
  footer: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: spacing.lg},
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

  // ── Try Again toast — soft amber (§4.2) ─────────────────────────────
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
    borderRadius: radii.pill},
  tryAgainText: { fontSize: typography.body, fontWeight: '800', color: '#A65900' },

  // ── Overlays ────────────────────────────────────────────────────────
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
    letterSpacing: -0.5},
  overlaySub: { fontSize: typography.body,  textAlign: 'center', lineHeight: 22 },
  section: { gap: spacing.sm },
  sectionEyebrow: {
    fontSize: typography.caption,
    fontWeight: '800',

    letterSpacing: 1.1,
    textTransform: 'uppercase'},
  diffRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,

    borderRadius: radii.card,
    minHeight: 52},
  diffRowActive: { backgroundColor: '#E6F4FD' },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,

    alignItems: 'center',
    justifyContent: 'center'},
  radioActive: { },
  radioDot: { width: 12, height: 12, borderRadius: 6},
  diffLabel: { fontSize: typography.body, fontWeight: '800'},
  diffSub: { fontSize: typography.caption,  marginTop: 2, fontWeight: '600' },

  overlayActions: { flexDirection: 'row', gap: spacing.sm },
  btnGhost: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: radii.pill,

    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50},
  btnGhostText: { fontSize: typography.body, fontWeight: '700'},
  btnPrimary: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: radii.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50},
  btnPrimaryText: { fontSize: typography.body, fontWeight: '800', color: '#FFFFFF' },
  btnSecondary: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: radii.pill,
    backgroundColor: '#E6F4FD',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50},
  btnSecondaryText: { fontSize: typography.body, fontWeight: '800'},

  // Success styles removed — completion UI now lives in ActivityCompletionOverlay.
});
