import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Card } from '../../src/components/native/Card';
import { PrimaryButton } from '../../src/components/native/PrimaryButton';
import { Screen } from '../../src/components/native/Screen';
import { TextField } from '../../src/components/native/TextField';
import { TapTalkMascot } from '../../src/components/TapTalkMascot';
import { useAppContext } from '../../src/hooks/useAppContext';
import { colors, radii, spacing, typography } from '../../src/theme/tokens';

export default function ProgressScreen() {
  const { state, dispatch } = useAppContext();
  const [goalName, setGoalName] = useState('');
  const [stepName, setStepName] = useState('');

  const addGoal = () => {
    const name = goalName.trim();
    if (!name) return;
    dispatch({
      type: 'ADD_GOAL',
      payload: {
        id: `${Date.now()}`,
        name,
        description: '',
        why: '',
        deadline: null,
        reminder: null,
        encouragementMessage: "You've got this!",
        steps: [],
      },
    });
    setGoalName('');
  };

  const firstGoal = state.goals[0];

  const addStep = () => {
    if (!firstGoal || !stepName.trim()) return;
    dispatch({
      type: 'ADD_STEP',
      payload: {
        goalId: firstGoal.id,
        step: {
          id: `${Date.now()}`,
          name: stepName.trim(),
          howToAchieve: '',
          achieveBy: null,
          completed: false,
        },
      },
    });
    setStepName('');
  };

  return (
    <Screen title="Progress" subtitle="Celebrate effort, not competition.">
      <View style={styles.statRow}>
        <Card style={styles.statCard}>
          <Text style={styles.statIcon}>💬</Text>
          <Text style={styles.statValue}>{state.talkStats.totalWords}</Text>
          <Text style={styles.statLabel}>words spoken</Text>
        </Card>
        <Card style={styles.statCard}>
          <Text style={styles.statIcon}>✦</Text>
          <Text style={[styles.statValue, styles.greenText]}>{state.activityStats.gamesPlayed}</Text>
          <Text style={styles.statLabel}>activities tried</Text>
        </Card>
      </View>

      <Card style={styles.encouragement}>
        <TapTalkMascot variant="head" style={styles.mascot} />
        <View style={styles.encouragementText}>
          <Text style={styles.sectionTitle}>Keep it up!</Text>
          <Text style={styles.helper}>
            Every word and every activity is a step forward.
          </Text>
        </View>
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>What's Your Goal?</Text>
        <Text style={styles.helper}>
          To find a treasure we need a map, so let's make our map so our trail becomes clear.
        </Text>
        <View style={styles.inputRow}>
          <TextField
            accessibilityLabel="New goal"
            placeholder="e.g. Ask for help"
            value={goalName}
            onChangeText={setGoalName}
            style={styles.input}
          />
          <PrimaryButton
            accessibilityLabel="Create goal"
            label="+"
            onPress={addGoal}
            style={styles.addButton}
          />
        </View>

        {state.goals.length === 0 ? (
          <View style={styles.emptyGoal}>
            <Text style={styles.emptyIcon}>🎯</Text>
            <Text style={styles.helper}>Create your first goal when you are ready.</Text>
          </View>
        ) : (
          state.goals.map((goal) => (
            <View key={goal.id} style={styles.goalBlock}>
              <Text style={styles.goalName}>{goal.name}</Text>
              <Text style={styles.encouragementMessage}>{goal.encouragementMessage}</Text>
              {goal.steps.map((step) => (
                <Pressable
                  key={step.id}
                  accessibilityRole="checkbox"
                  accessibilityLabel={`Toggle step ${step.name}`}
                  accessibilityState={{ checked: step.completed }}
                  onPress={() => dispatch({ type: 'TOGGLE_STEP', payload: { goalId: goal.id, stepId: step.id } })}
                  style={styles.stepRow}
                >
                  <View style={[styles.stepCircle, step.completed && styles.stepCircleDone]}>
                    {step.completed ? <Text style={styles.checkMark}>✓</Text> : null}
                  </View>
                  <Text style={[styles.stepText, step.completed && styles.stepTextDone]}>{step.name}</Text>
                </Pressable>
              ))}
            </View>
          ))
        )}

        {firstGoal ? (
          <View style={styles.inputRow}>
            <TextField
              accessibilityLabel="New goal step"
              placeholder="Add a step..."
              value={stepName}
              onChangeText={setStepName}
              style={styles.input}
            />
            <PrimaryButton
              accessibilityLabel="Add step"
              label="+"
              onPress={addStep}
              style={styles.addButton}
            />
          </View>
        ) : null}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  addButton: {
    width: 50,
  },
  checkMark: {
    color: colors.surface,
    fontWeight: '900',
  },
  emptyGoal: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  emptyIcon: {
    fontSize: 40,
  },
  encouragement: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  encouragementMessage: {
    marginTop: 2,
    color: colors.primary,
    fontSize: typography.caption,
    fontStyle: 'italic',
    fontWeight: '700',
  },
  encouragementText: {
    flex: 1,
  },
  goalBlock: {
    marginTop: spacing.lg,
    borderRadius: radii.card,
    backgroundColor: colors.input,
    padding: spacing.md,
  },
  goalName: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: '800',
  },
  greenText: {
    color: colors.success,
  },
  helper: {
    marginTop: 4,
    color: colors.textMuted,
    fontSize: typography.caption,
    lineHeight: 18,
  },
  input: {
    flex: 1,
  },
  inputRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  mascot: {
    width: 72,
    height: 72,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: '800',
  },
  statCard: {
    flex: 1,
  },
  statIcon: {
    fontSize: 22,
  },
  statLabel: {
    color: colors.textMuted,
    fontSize: typography.caption,
    fontWeight: '700',
  },
  statRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  statValue: {
    marginTop: 2,
    color: colors.primary,
    fontSize: 26,
    fontWeight: '900',
  },
  stepCircle: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.disabled,
    borderRadius: 12,
  },
  stepCircleDone: {
    borderColor: colors.success,
    backgroundColor: colors.success,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  stepText: {
    flex: 1,
    color: colors.text,
    fontSize: typography.callout,
    fontWeight: '700',
  },
  stepTextDone: {
    color: colors.textTertiary,
    textDecorationLine: 'line-through',
  },
});
