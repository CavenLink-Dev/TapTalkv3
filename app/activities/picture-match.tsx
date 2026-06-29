/**
 * Picture Match — phase-based structure matching ShapeMatch.
 *   select → StartOverlay (pick difficulty)
 *   play   → game (ActivityProgressBar + level pill + toasts)
 *   won    → SuccessOverlay
 *
 * Difficulty:
 *   Easy   — pool of 4 word pairs, 8 levels
 *   Medium — pool of 6 word pairs, 12 levels
 *   Hard   — pool of 8 word pairs, 16 levels
 */

import React, { useCallback, useRef, useState } from 'react';
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
import * as Speech from 'expo-speech';
import { Card } from '../../src/components/native/Card';
import { ActivityProgressBar } from '../../src/components/activities/ActivityProgressBar';
import { useAppContext } from '../../src/hooks/useAppContext';
import { hapticSelection } from '../../src/utils/haptics';
import { playSound, playSelectThenConfirm, playStreakSound } from '../../src/utils/sounds';
import { colors, radii, spacing, symbolColors, typography } from '../../src/theme/tokens';

// ─── Types ───────────────────────────────────────────────────────────────────

type Difficulty = 'easy' | 'medium' | 'hard';
type Phase = 'select' | 'play' | 'won';

interface WordPair {
  target: string;
  distractors: string[];
  color: string;
}

interface Round {
  pair: WordPair;
  choices: string[];
}

// ─── Config ──────────────────────────────────────────────────────────────────

const POOL_SIZE: Record<Difficulty, number> = { easy: 4, medium: 6, hard: 8 };
const TOTAL_LEVELS: Record<Difficulty, number> = { easy: 8, medium: 12, hard: 16 };
const DIFF_LABEL: Record<Difficulty, string> = { easy: 'Easy', medium: 'Medium', hard: 'Hard' };

const WORD_PAIRS: WordPair[] = [
  { target: 'Dog',    distractors: ['Tree',   'Water'],  color: symbolColors.noun      },
  { target: 'Apple',  distractors: ['Chair',  'Sun'],    color: symbolColors.noun      },
  { target: 'Run',    distractors: ['Sleep',  'Eat'],    color: symbolColors.verb      },
  { target: 'Happy',  distractors: ['Tired',  'Scared'], color: symbolColors.adjective },
  { target: 'Big',    distractors: ['Little', 'Hot'],    color: symbolColors.adjective },
  { target: 'Water',  distractors: ['Bread',  'Juice'],  color: symbolColors.noun      },
  { target: 'Go',     distractors: ['See',    'Help'],   color: symbolColors.verb      },
  { target: 'Yes',    distractors: ['No',     'Please'], color: symbolColors.social    },
];

const CORRECT_MESSAGES = [
  'Great work!', 'Great job!', 'Nice one!', 'Well done!', 'Awesome!',
  'Perfect!', 'Brilliant!', 'Keep it up!', 'You got it!', 'Spot on!',
  'Fantastic!', 'Amazing!', 'Superb!', 'Nailed it!',
];
function randomCorrectMessage(): string {
  return CORRECT_MESSAGES[Math.floor(Math.random() * CORRECT_MESSAGES.length)]!;
}

function shuffled<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

function randomRound(difficulty: Difficulty): Round {
  const pool = WORD_PAIRS.slice(0, POOL_SIZE[difficulty]);
  const pair = pool[Math.floor(Math.random() * pool.length)]!;
  const choices = shuffled([pair.target, ...pair.distractors.slice(0, 2)]);
  return { pair, choices };
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
          <Text style={styles.overlayTitle} accessibilityRole="header">Picture Match</Text>
          <Text style={styles.overlaySub}>
            A word is shown. Find the matching card from three choices.
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

// ─── SuccessOverlay ──────────────────────────────────────────────────────────

function SuccessOverlay({
  visible, difficulty, totalLevels, onPlayAgain, onNext, onBack,
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
            You matched words across {totalLevels} {DIFF_LABEL[difficulty].toLowerCase()} levels.
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
              <Text style={styles.btnGhostText}>Back to Activities</Text>
            </Pressable>
          </View>
        </Card>
      </View>
    </Modal>
  );
}

// ─── Screen ──────────────────────────────────────────────────────────────────

export default function PictureMatchScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { dispatch } = useAppContext();

  const [phase, setPhase] = useState<Phase>('select');
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [level, setLevel] = useState(1);
  const [round, setRound] = useState<Round>(() => randomRound('easy'));
  const [chosen, setChosen] = useState<string | null>(null);
  const [soundOn, setSoundOn] = useState(true);
  const [levelPillFlash, setLevelPillFlash] = useState(false);
  const [tryAgainVisible, setTryAgainVisible] = useState(false);
  const [correctToastVisible, setCorrectToastVisible] = useState(false);
  const [correctMessage, setCorrectMessage] = useState('');

  const tryAgainFade     = useRef(new Animated.Value(0)).current;
  const correctToastFade = useRef(new Animated.Value(0)).current;
  const levelPillScale   = useRef(new Animated.Value(1)).current;

  const totalLevels = TOTAL_LEVELS[difficulty];

  const startGame = useCallback(() => {
    hapticSelection();
    const newRound = randomRound(difficulty);
    setLevel(1);
    setRound(newRound);
    setChosen(null);
    setPhase('play');
    if (soundOn) {
      Speech.stop();
      Speech.speak(newRound.pair.target, { rate: 0.9 });
    }
  }, [difficulty, soundOn]);

  const showTryAgain = useCallback(() => {
    setTryAgainVisible(true);
    Animated.sequence([
      Animated.timing(tryAgainFade, { toValue: 1, duration: 160, useNativeDriver: true }),
      Animated.delay(900),
      Animated.timing(tryAgainFade, { toValue: 0, duration: 220, useNativeDriver: true }),
    ]).start(() => setTryAgainVisible(false));
  }, [tryAgainFade]);

  const showCorrectToast = useCallback(() => {
    setCorrectMessage(randomCorrectMessage());
    setCorrectToastVisible(true);
    correctToastFade.setValue(0);
    Animated.sequence([
      Animated.timing(correctToastFade, { toValue: 1, duration: 160, useNativeDriver: true }),
      Animated.delay(700),
      Animated.timing(correctToastFade, { toValue: 0, duration: 220, useNativeDriver: true }),
    ]).start(() => setCorrectToastVisible(false));
  }, [correctToastFade]);

  const handleChoice = useCallback((word: string) => {
    if (chosen !== null) return;
    hapticSelection();
    playSelectThenConfirm(soundOn);
    const correct = word === round.pair.target;
    setChosen(word);
    setTimeout(() => {
      if (correct) {
        dispatch({ type: 'INCREMENT_ACTIVITY_STATS', payload: { minutes: 1 } });
        playSound('correct', soundOn);
        showCorrectToast();
      } else {
        playSound('incorrect', soundOn);
        showTryAgain();
      }
    }, 180);
  }, [chosen, dispatch, round.pair.target, showCorrectToast, showTryAgain, soundOn]);

  const nextRound = useCallback(() => {
    // Flash level pill
    setLevelPillFlash(true);
    Animated.sequence([
      Animated.timing(levelPillScale, { toValue: 1.12, duration: 160, useNativeDriver: true }),
      Animated.spring(levelPillScale, { toValue: 1, useNativeDriver: true, friction: 5, tension: 120 }),
    ]).start(() => setLevelPillFlash(false));

    if (level >= totalLevels) {
      playSound('level_complete', soundOn);
      playStreakSound(level, soundOn);
      setPhase('won');
      return;
    }

    const newRound = randomRound(difficulty);
    setLevel(l => l + 1);
    setRound(newRound);
    setChosen(null);

    if (soundOn) {
      Speech.stop();
      Speech.speak(newRound.pair.target, { rate: 0.9 });
    }
  }, [difficulty, level, levelPillScale, soundOn, totalLevels]);

  const onPlayAgain = useCallback(() => {
    const newRound = randomRound(difficulty);
    setLevel(1);
    setRound(newRound);
    setChosen(null);
    setPhase('play');
  }, [difficulty]);

  const onNextActivity = useCallback(() => {
    router.replace('/activities/count-along' as never);
  }, [router]);

  const onBackToActivities = useCallback(() => {
    router.replace('/(tabs)/activities' as never);
  }, [router]);

  const showHelp = () => {
    Alert.alert(
      'How to play',
      'Look at the word shown in the coloured tile, then tap the matching word from the three choices below.',
      [{ text: 'Got it' }],
      { cancelable: true },
    );
  };

  const isCorrect = chosen !== null && chosen === round.pair.target;
  const isLastLevel = level >= totalLevels;

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
            onPress={() => { hapticSelection(); setSoundOn(v => !v); }}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel={soundOn ? 'Turn voice off' : 'Turn voice on'}
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
              <Text style={styles.levelPillText}>
                Level {level} of {totalLevels}
              </Text>
            </Animated.View>
          </View>

          <Text style={styles.instruction}>Find the matching word.</Text>

          {/* Target word tile */}
          <View style={[styles.targetCard, { backgroundColor: round.pair.color }]}>
            <View style={styles.gloss} />
            <Text style={styles.targetWord}>{round.pair.target}</Text>
          </View>

          {/* Result banner */}
          {chosen !== null && (
            <View style={[styles.resultBanner, { backgroundColor: isCorrect ? '#D6F0DD' : '#E6F4FD' }]}>
              <Text style={[styles.resultText, { color: isCorrect ? '#1A7A3A' : colors.primary }]}>
                {isCorrect ? 'Correct. Well done.' : 'Not quite. Keep going.'}
              </Text>
            </View>
          )}

          {/* Choice cards */}
          <View style={styles.choiceGrid}>
            {round.choices.map((word) => {
              const isSelected = chosen === word;
              const isTarget   = word === round.pair.target;
              let borderColor: string = colors.border;
              if (chosen !== null && isSelected && isCorrect) borderColor = colors.success;
              if (chosen !== null && isTarget)                borderColor = colors.success;
              return (
                <Pressable
                  key={word}
                  onPress={() => handleChoice(word)}
                  disabled={chosen !== null}
                  accessibilityRole="button"
                  accessibilityLabel={`Choose ${word}`}
                  style={({ pressed }) => [
                    styles.choiceCard,
                    { borderColor },
                    pressed && styles.choicePressed,
                  ]}
                >
                  <Text style={styles.choiceWord}>{word}</Text>
                </Pressable>
              );
            })}
          </View>

          {chosen !== null && (
            <Pressable
              onPress={nextRound}
              accessibilityRole="button"
              accessibilityLabel={isLastLevel ? 'Finish' : 'Next round'}
              style={({ pressed }) => [styles.nextBtn, pressed && { opacity: 0.85 }]}
            >
              <Text style={styles.nextBtnText}>{isLastLevel ? 'Finish' : 'Next'}</Text>
            </Pressable>
          )}
        </ScrollView>
      ) : (
        <View style={{ flex: 1 }} />
      )}

      {/* ── Toasts ───────────────────────────────────────────────────── */}
      {tryAgainVisible ? (
        <Animated.View
          style={[styles.tryAgain, { bottom: insets.bottom + 90, opacity: tryAgainFade }]}
          pointerEvents="none"
        >
          <Ionicons name="refresh-circle-outline" size={20} color={colors.primary} />
          <Text style={styles.tryAgainText}>Try Again</Text>
        </Animated.View>
      ) : null}

      {correctToastVisible ? (
        <Animated.View
          style={[styles.correctToast, { bottom: insets.bottom + 90, opacity: correctToastFade }]}
          pointerEvents="none"
        >
          <Ionicons name="checkmark-circle-outline" size={20} color="#1A7A3A" />
          <Text style={styles.correctToastText}>{correctMessage}</Text>
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
      <SuccessOverlay
        visible={phase === 'won'}
        difficulty={difficulty}
        totalLevels={totalLevels}
        onPlayAgain={onPlayAgain}
        onNext={onNextActivity}
        onBack={onBackToActivities}
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
    backgroundColor: BG,
  },
  headerActions: { flexDirection: 'row', gap: 4 },
  headerIconBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },

  content: {
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.xl,
  },

  subhead: { alignItems: 'center', width: '100%' },
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
    fontSize: typography.subheading,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
    letterSpacing: -0.2,
  },

  targetCard: {
    width: 180,
    height: 100,
    borderRadius: radii.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.symbolOutline,
    overflow: 'hidden',
    position: 'relative',
  },
  gloss: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '45%',
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderTopLeftRadius: radii.card - 2,
    borderTopRightRadius: radii.card - 2,
  },
  targetWord: {
    fontSize: typography.heading,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.4,
  },

  resultBanner: {
    width: '100%',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radii.pill,
    alignItems: 'center',
  },
  resultText: { fontSize: typography.body, fontWeight: '800', textAlign: 'center' },

  choiceGrid: { gap: spacing.md, width: '100%' },
  choiceCard: {
    width: '100%',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    borderRadius: radii.card,
    backgroundColor: colors.surface,
    alignItems: 'center',
    borderWidth: 2.5,
  },
  choicePressed: { backgroundColor: colors.background, transform: [{ scale: 0.97 }] },
  choiceWord: { fontSize: typography.body, fontWeight: '800', color: colors.text, letterSpacing: -0.2 },

  nextBtn: {
    backgroundColor: colors.primary,
    borderRadius: radii.button,
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.md,
    alignItems: 'center',
    minWidth: 160,
  },
  nextBtnText: { color: BG, fontSize: typography.body, fontWeight: '800', letterSpacing: -0.2 },

  // ── Toasts ──────────────────────────────────────────────────────────
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
  tryAgainText: { fontSize: typography.body, fontWeight: '800', color: colors.primary },

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
  correctToastText: { fontSize: typography.body, fontWeight: '800', color: '#1A7A3A' },

  // ── Overlays ────────────────────────────────────────────────────────
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
    letterSpacing: -0.5,
  },
  overlaySub: { fontSize: typography.body, color: colors.textMuted, textAlign: 'center', lineHeight: 22 },
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
    minHeight: 52,
  },
  diffRowActive: { backgroundColor: '#E6F4FD' },
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
  radioDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: colors.primary },
  diffLabel: { fontSize: typography.body, fontWeight: '800', color: colors.text },
  diffSub: { fontSize: typography.caption, color: colors.textMuted, marginTop: 2, fontWeight: '600' },

  overlayActions: { flexDirection: 'row', gap: spacing.sm },
  btnGhost: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: radii.pill,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
  },
  btnGhostText: { fontSize: typography.body, fontWeight: '700', color: colors.text },
  btnPrimary: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: radii.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
  },
  btnPrimaryText: { fontSize: typography.body, fontWeight: '800', color: '#FFFFFF' },
  btnSecondary: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: radii.pill,
    backgroundColor: '#E6F4FD',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
  },
  btnSecondaryText: { fontSize: typography.body, fontWeight: '800', color: colors.primary },

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
    letterSpacing: -0.5,
  },
  successSub: { fontSize: typography.body, color: colors.textMuted, textAlign: 'center', lineHeight: 22 },
  successActions: { gap: spacing.sm },
});
