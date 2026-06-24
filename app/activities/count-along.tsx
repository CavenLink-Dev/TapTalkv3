/**
 * Count Along game screen.
 * A row of coloured dots is shown. The user picks the correct count.
 * Practises number recognition without time pressure.
 */

import React, { useCallback, useRef, useState } from 'react';
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

interface Round {
  count: number;
  dotColor: string;
  choices: number[];
}

const DOT_COLORS = [
  colors.primary,
  '#5CD65C',
  '#BD73FF',
  '#F58625',
  '#FA838E',
];

function randomRound(): Round {
  const count = Math.floor(Math.random() * 5) + 1; // 1 to 5
  const dotColor = DOT_COLORS[Math.floor(Math.random() * DOT_COLORS.length)];
  const wrongA = count === 1 ? 2 : count - 1;
  const wrongB = count >= 5 ? 4 : count + 1;
  const choices = [count, wrongA, wrongB].sort(() => Math.random() - 0.5);
  return { count, dotColor, choices };
}

function DotRow({ count, color }: { count: number; color: string }) {
  return (
    <View style={styles.dotRow}>
      {Array.from({ length: count }).map((_, i) => (
        <View key={i} style={[styles.dot, { backgroundColor: color }]} />
      ))}
    </View>
  );
}

export default function CountAlongScreen() {
  const router = useRouter();
  const { dispatch } = useAppContext();

  const [round, setRound] = useState<Round>(randomRound);
  const [chosen, setChosen] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [total, setTotal] = useState(0);

  const resultScale = useRef(new Animated.Value(0)).current;

  const handleChoice = useCallback((n: number) => {
    if (chosen !== null) return;
    hapticSelection();
    const correct = n === round.count;
    setChosen(n);
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
  }, [chosen, dispatch, resultScale, round.count]);

  const nextRound = useCallback(() => {
    setRound(randomRound());
    setChosen(null);
    resultScale.setValue(0);
  }, [resultScale]);

  const isCorrect = chosen !== null && chosen === round.count;

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
        <Text style={styles.headerTitle}>Count Along</Text>
        <View style={styles.scorePill}>
          <Text style={styles.scoreText}>{score}/{total}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        <Text style={styles.instruction}>How many shapes do you see?</Text>

        {/* Dot display */}
        <View style={styles.dotBox}>
          <DotRow count={round.count} color={round.dotColor} />
        </View>

        {/* Result banner */}
        {chosen !== null && (
          <Animated.View style={[styles.resultBanner, { transform: [{ scale: resultScale }] }]}>
            <Text style={[styles.resultText, { color: isCorrect ? colors.success : colors.danger }]}>
              {isCorrect
                ? `Yes. There ${round.count === 1 ? 'is' : 'are'} ${round.count}.`
                : `There ${round.count === 1 ? 'is' : 'are'} ${round.count}. Keep going.`}
            </Text>
          </Animated.View>
        )}

        {/* Number choices */}
        <View style={styles.choiceGrid}>
          {round.choices.map((n) => {
            const isSelected = chosen === n;
            const isTarget = n === round.count;
            let borderColor = colors.border;
            if (chosen !== null && isSelected && isCorrect) borderColor = colors.success;
            if (chosen !== null && isSelected && !isCorrect) borderColor = colors.danger;
            if (chosen !== null && isTarget) borderColor = colors.success;

            return (
              <Pressable
                key={n}
                onPress={() => handleChoice(n)}
                disabled={chosen !== null}
                accessibilityRole="button"
                accessibilityLabel={`Choose ${n}`}
                style={({ pressed }) => [
                  styles.choiceCard,
                  { borderColor },
                  pressed && styles.choicePressed,
                ]}
              >
                <Text style={styles.choiceNumber}>{n}</Text>
              </Pressable>
            );
          })}
        </View>

        {chosen !== null && (
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
  scorePill: { width: 48, alignItems: 'flex-end' },
  scoreText: { fontSize: typography.caption, fontWeight: '800', color: colors.primary },
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
  },
  dotBox: {
    minWidth: 180,
    minHeight: 100,
    borderRadius: radii.card,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.border,
    padding: spacing.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  dotRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    justifyContent: 'center',
  },
  dot: {
    width: 28,
    height: 28,
    borderRadius: 14,
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
  },
  choiceCard: {
    width: 88,
    height: 88,
    borderRadius: radii.card,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  choicePressed: {
    backgroundColor: colors.background,
    transform: [{ scale: 0.96 }],
  },
  choiceNumber: {
    fontSize: 34,
    fontWeight: '900',
    color: colors.text,
    letterSpacing: -1,
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
