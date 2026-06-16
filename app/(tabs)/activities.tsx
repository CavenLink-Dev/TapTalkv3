import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Card } from '../../src/components/native/Card';
import { PrimaryButton } from '../../src/components/native/PrimaryButton';
import { Screen } from '../../src/components/native/Screen';
import { useAppContext } from '../../src/hooks/useAppContext';
import { colors, radii, spacing, typography } from '../../src/theme/tokens';

interface Activity {
  id: string;
  name: string;
  task: string;
  description: string;
  choices: string[];
  answer: string;
}

const activities: Activity[] = [
  {
    id: 'memory-match',
    name: 'Memory Match',
    task: 'Remember the friendly symbol.',
    description: 'Build memory and visual scanning with one calm choice.',
    choices: ['★', '●', '◆'],
    answer: '★',
  },
  {
    id: 'picture-match',
    name: 'Picture Match',
    task: 'Match the word to the picture.',
    description: 'Connect symbols with language.',
    choices: ['Dog', 'Tree', 'Water'],
    answer: 'Dog',
  },
  {
    id: 'count-along',
    name: 'Count Along',
    task: 'Count the shapes.',
    description: 'Practise number recognition without pressure.',
    choices: ['2', '3', '4'],
    answer: '3',
  },
];

export default function ActivitiesScreen() {
  const { dispatch } = useAppContext();
  const [active, setActive] = useState<Activity | null>(null);
  const [result, setResult] = useState<string>('');

  const choose = (choice: string) => {
    if (!active) return;
    const correct = choice === active.answer;
    setResult(correct ? 'Great work. You got it!' : 'Good try. Take another look.');
    if (correct) {
      dispatch({ type: 'INCREMENT_ACTIVITY_STATS', payload: { minutes: 1 } });
    }
  };

  if (active) {
    return (
      <Screen title={active.name} subtitle="Clear exit, simple choices, no harsh scoring.">
        <Card style={styles.practiceCard}>
          <Text style={styles.task}>{active.task}</Text>
          <Text style={styles.practiceSymbol}>
            {active.id === 'picture-match' ? '🐕' : active.id === 'count-along' ? '● ● ●' : '★'}
          </Text>
          <View style={styles.choiceGrid}>
            {active.choices.map((choice) => (
              <Pressable
                key={choice}
                accessibilityRole="button"
                accessibilityLabel={`Choose ${choice}`}
                onPress={() => choose(choice)}
                style={styles.choice}
              >
                <Text style={styles.choiceText}>{choice}</Text>
              </Pressable>
            ))}
          </View>
          {result ? <Text style={styles.result}>{result}</Text> : null}
        </Card>
        <PrimaryButton
          accessibilityLabel="Exit activity"
          label="Back to Activities"
          onPress={() => {
            setActive(null);
            setResult('');
          }}
          variant="secondary"
        />
      </Screen>
    );
  }

  return (
    <Screen title="Activities" subtitle="Practice focus, memory, language, and numbers.">
      {activities.map((activity) => (
        <Card key={activity.id} style={styles.activityCard}>
          <View style={styles.activityHeader}>
            <View style={styles.activityIcon}>
              <Text style={styles.activityIconText}>✦</Text>
            </View>
            <View style={styles.activityCopy}>
              <Text style={styles.activityName}>{activity.name}</Text>
              <Text style={styles.activityTask}>Task: {activity.task}</Text>
            </View>
          </View>
          <Text style={styles.description}>{activity.description}</Text>
          <PrimaryButton
            accessibilityLabel={`Play ${activity.name}`}
            label="Play"
            onPress={() => setActive(activity)}
            style={styles.playButton}
          />
        </Card>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  activityCard: {
    marginBottom: spacing.md,
  },
  activityCopy: {
    flex: 1,
  },
  activityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  activityIcon: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.card,
    backgroundColor: colors.softBlue,
  },
  activityIconText: {
    color: colors.primary,
    fontSize: 24,
    fontWeight: '900',
  },
  activityName: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: '800',
  },
  activityTask: {
    marginTop: 2,
    color: colors.textMuted,
    fontSize: typography.caption,
  },
  choice: {
    minWidth: 82,
    minHeight: 64,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: radii.card,
    backgroundColor: colors.surface,
    padding: spacing.md,
  },
  choiceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.md,
    marginTop: spacing.xl,
  },
  choiceText: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: '800',
  },
  description: {
    marginTop: spacing.md,
    color: colors.textMuted,
    fontSize: typography.callout,
    lineHeight: 21,
  },
  playButton: {
    marginTop: spacing.lg,
  },
  practiceCard: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  practiceSymbol: {
    marginTop: spacing.lg,
    color: colors.primary,
    fontSize: 58,
    fontWeight: '900',
  },
  result: {
    marginTop: spacing.lg,
    color: colors.primary,
    fontSize: typography.body,
    fontWeight: '800',
    textAlign: 'center',
  },
  task: {
    color: colors.text,
    fontSize: typography.subheading,
    fontWeight: '800',
    textAlign: 'center',
  },
});
