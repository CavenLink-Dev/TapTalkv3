/**
 * Memory Match game screen.
 * A shape is shown briefly, then hidden. The user picks the matching shape
 * from three options. No emojis, no timers that create pressure.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAppContext } from '../../src/hooks/useAppContext';
import { hapticSelection } from '../../src/utils/haptics';
import { colors, radii, spacing, typography } from '../../src/theme/tokens';

// Each round has a target shape index and three choice shapes
interface Round {
  target: number;
  choices: number[];
}

const SHAPES: { color: string; radius: number; label: string }[] = [
  { color: '#199AEE', radius: 50,  label: 'Blue circle'   },
  { color: '#5CD65C', radius: 8,   label: 'Green square'  },
  { color: '#BD73FF', radius: 28,  label: 'Purple rounded'},
  { color: '#F58625', radius: 50,  label: 'Orange circle' },
  { color: '#FA838E', radius: 8,   label: 'Pink square'   },
];

function randomRound(): Round {
  const target = Math.floor(Math.random() * SHAPES.length);
  const pool = SHAPES.map((_, i) => i).filter(i => i !== target);
  const shuffled = pool.sort(() => Math.random() - 0.5).slice(0, 2);
  const choices = [target, ...shuffled].sort(() => Math.random() - 0.5);
  return { target, choices };
}

function Shape({ index, size = 64 }: { index: number; size?: number }) {
  const s = SHAPES[index];
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: s.radius,
        backgroundColor: s.color,
      }}
      accessibilityLabel={s.label}
    />
  );
}

export default function MemoryMatchScreen() {
  const router = useRouter();
  const { dispatch } = useAppContext();

  const [round, setRound] = useState<Round>(randomRound);
  const [phase, setPhase] = useState<'show' | 'choose' | 'result'>('show');
  const [chosen, setChosen] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [total, setTotal] = useState(0);

  const shapeOpacity = useRef(new Animated.Value(1)).current;
  const resultScale = useRef(new Animated.Value(0)).current;

  // Hide the target shape after 1.4 s
  useEffect(() => {
    if (phase !== 'show') return;
    shapeOpacity.setValue(1);
    const t = setTimeout(() => {
      Animated.timing(shapeOpacity, {
        toValue: 0,
        duration: 340,
        useNativeDriver: true,
      }).start(() => setPhase('choose'));
    }, 1400);
    return () => clearTimeout(t);
  }, [phase, round, shapeOpacity]);

  const handleChoice = useCallback((shapeIndex: number) => {
    if (phase !== 'choose') return;
    hapticSelection();
    const correct = shapeIndex === round.target;
    setChosen(shapeIndex);
    setTotal(t => t + 1);
    if (correct) {
      setScore(s => s + 1);
      dispatch({ type: 'INCREMENT_ACTIVITY_STATS', payload: { minutes: 1 } });
    }
    resultScale.setValue(0);
    Animated.spring(resultScale, {
      toValue: 1,
      speed: 18,
      bounciness: 10,
      useNativeDriver: true,
    }).start();
    setPhase('result');
  }, [dispatch, phase, resultScale, round.target]);

  const nextRound = useCallback(() => {
    setRound(randomRound());
    setChosen(null);
    setPhase('show');
    resultScale.setValue(0);
  }, [resultScale]);

  const isCorrect = chosen !== null && chosen === round.target;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          style={styles.backBtn}
        >
          <Ionicons name="chevron-back" size={26} color={colors.primary} />
        </Pressable>
        <Text style={styles.headerTitle}>Memory Match</Text>
        <View style={styles.scorePill}>
          <Text style={styles.scoreText}>{score}/{total}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        <Text style={styles.instruction}>
          {phase === 'show'  ? 'Look at the shape.' : null}
          {phase === 'choose' ? 'Which shape did you see?' : null}
          {phase === 'result' ? (isCorrect ? 'Correct. Well done.' : 'Not quite. Try the next one.') : null}
        </Text>

        {/* Target shape display */}
        <View style={styles.targetBox}>
          <Animated.View style={{ opacity: shapeOpacity }}>
            <Shape index={round.target} size={80} />
          </Animated.View>
          {phase === 'choose' && (
            <View style={styles.hiddenLabel}>
              <Text style={styles.hiddenText}>Hidden</Text>
            </View>
          )}
        </View>

        {/* Result feedback */}
        {phase === 'result' && (
          <Animated.View style={[styles.resultBanner, { transform: [{ scale: resultScale }] }]}>
            <Text style={[styles.resultText, { color: isCorrect ? colors.success : colors.danger }]}>
              {isCorrect ? 'You got it.' : 'Keep going.'}
            </Text>
          </Animated.View>
        )}

        {/* Choice grid */}
        {phase !== 'show' && (
          <View style={styles.choiceGrid}>
            {round.choices.map((shapeIndex) => {
              const isSelected = chosen === shapeIndex;
              const isTarget = shapeIndex === round.target;
              let borderColor = colors.border;
              if (phase === 'result' && isSelected && isCorrect) borderColor = colors.success;
              if (phase === 'result' && isSelected && !isCorrect) borderColor = colors.danger;
              if (phase === 'result' && isTarget) borderColor = colors.success;

              return (
                <Pressable
                  key={shapeIndex}
                  onPress={() => handleChoice(shapeIndex)}
                  disabled={phase === 'result'}
                  accessibilityRole="button"
                  accessibilityLabel={`Choose ${SHAPES[shapeIndex].label}`}
                  style={({ pressed }) => [
                    styles.choiceCard,
                    { borderColor },
                    pressed && styles.choicePressed,
                  ]}
                >
                  <Shape index={shapeIndex} size={56} />
                </Pressable>
              );
            })}
          </View>
        )}

        {phase === 'result' && (
          <Pressable
            onPress={nextRound}
            accessibilityRole="button"
            accessibilityLabel="Next round"
            style={styles.nextBtn}
          >
            <Text style={styles.nextBtnText}>Next</Text>
          </Pressable>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: { width: 40, height: 40, alignItems: 'flex-start', justifyContent: 'center' },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: typography.body,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.2,
  },
  scorePill: {
    width: 48,
    alignItems: 'flex-end',
  },
  scoreText: {
    fontSize: typography.caption,
    fontWeight: '800',
    color: colors.primary,
  },
  content: {
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.xl,
    paddingBottom: 48,
  },
  instruction: {
    fontSize: typography.subheading,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
    letterSpacing: -0.2,
    minHeight: 32,
  },
  targetBox: {
    width: 140,
    height: 140,
    borderRadius: radii.card,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hiddenLabel: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hiddenText: {
    fontSize: typography.caption,
    fontWeight: '700',
    color: colors.textTertiary,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  resultBanner: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.border,
  },
  resultText: {
    fontSize: typography.body,
    fontWeight: '800',
    textAlign: 'center',
  },
  choiceGrid: {
    flexDirection: 'row',
    gap: spacing.lg,
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  choiceCard: {
    width: 100,
    height: 100,
    borderRadius: radii.card,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2.5,
  },
  choicePressed: {
    backgroundColor: colors.background,
    transform: [{ scale: 0.96 }],
  },
  nextBtn: {
    backgroundColor: colors.primary,
    borderRadius: radii.button,
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  nextBtnText: {
    color: colors.surface,
    fontSize: typography.body,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
});
