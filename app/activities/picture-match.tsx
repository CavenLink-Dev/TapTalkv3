/**
 * Picture Match game screen.
 * A word is shown. The user selects the matching word card from three options.
 * Builds vocabulary and reading recognition.
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
import { colors, radii, spacing, symbolColors, typography } from '../../src/theme/tokens';

interface WordPair {
  target: string;
  distractors: string[];
  color: string;
}

const WORD_PAIRS: WordPair[] = [
  { target: 'Dog',    distractors: ['Tree',  'Water'],  color: symbolColors.noun     },
  { target: 'Apple',  distractors: ['Chair', 'Sun'],    color: symbolColors.noun     },
  { target: 'Run',    distractors: ['Sleep', 'Eat'],    color: symbolColors.verb     },
  { target: 'Happy',  distractors: ['Tired', 'Scared'], color: symbolColors.adjective},
  { target: 'Big',    distractors: ['Little','Hot'],    color: symbolColors.adjective},
  { target: 'Water',  distractors: ['Bread', 'Juice'],  color: symbolColors.noun     },
  { target: 'Go',     distractors: ['See',   'Help'],   color: symbolColors.verb     },
  { target: 'Yes',    distractors: ['No',    'Please'], color: symbolColors.social   },
];

function shuffled<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

function randomRound(): { pair: WordPair; choices: string[] } {
  const pair = WORD_PAIRS[Math.floor(Math.random() * WORD_PAIRS.length)];
  const choices = shuffled([pair.target, ...pair.distractors.slice(0, 2)]);
  return { pair, choices };
}

export default function PictureMatchScreen() {
  const router = useRouter();
  const { dispatch } = useAppContext();

  const [round, setRound] = useState(randomRound);
  const [chosen, setChosen] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [total, setTotal] = useState(0);

  const resultScale = useRef(new Animated.Value(0)).current;

  const handleChoice = useCallback((word: string) => {
    if (chosen !== null) return;
    hapticSelection();
    const correct = word === round.pair.target;
    setChosen(word);
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
  }, [chosen, dispatch, resultScale, round.pair.target]);

  const nextRound = useCallback(() => {
    setRound(randomRound());
    setChosen(null);
    resultScale.setValue(0);
  }, [resultScale]);

  const isCorrect = chosen !== null && chosen === round.pair.target;

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
        <Text style={styles.headerTitle}>Picture Match</Text>
        <View style={styles.scorePill}>
          <Text style={styles.scoreText}>{score}/{total}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        <Text style={styles.instruction}>Find the matching word.</Text>

        {/* Target word tile */}
        <View style={[styles.targetCard, { backgroundColor: round.pair.color }]}>
          <View style={styles.gloss} />
          <Text style={styles.targetWord}>{round.pair.target}</Text>
        </View>

        {/* Result banner */}
        {chosen !== null && (
          <Animated.View style={[styles.resultBanner, { transform: [{ scale: resultScale }] }]}>
            <Text style={[styles.resultText, { color: isCorrect ? colors.success : colors.danger }]}>
              {isCorrect ? 'Correct. Well done.' : 'Not quite. Keep going.'}
            </Text>
          </Animated.View>
        )}

        {/* Choice cards */}
        <View style={styles.choiceGrid}>
          {round.choices.map((word) => {
            const isSelected = chosen === word;
            const isTarget = word === round.pair.target;
            let borderColor = colors.border;
            if (chosen !== null && isSelected && isCorrect) borderColor = colors.success;
            if (chosen !== null && isSelected && !isCorrect) borderColor = colors.danger;
            if (chosen !== null && isTarget) borderColor = colors.success;

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
    gap: spacing.md,
    width: '100%',
  },
  choiceCard: {
    width: '100%',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    borderRadius: radii.card,
    backgroundColor: colors.surface,
    alignItems: 'center',
    borderWidth: 2.5,
  },
  choicePressed: {
    backgroundColor: colors.background,
    transform: [{ scale: 0.97 }],
  },
  choiceWord: {
    fontSize: typography.body,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.2,
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
