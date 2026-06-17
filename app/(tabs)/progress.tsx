import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Card } from '../../src/components/native/Card';
import { PrimaryButton } from '../../src/components/native/PrimaryButton';
import { Screen } from '../../src/components/native/Screen';
import { TextField } from '../../src/components/native/TextField';
import { TapTalkMascot } from '../../src/components/TapTalkMascot';
import { useAppContext } from '../../src/hooks/useAppContext';
import { listStyles } from '../../src/styles/listStyles';
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
          <Text style={listStyles.sectionTitle}>Keep it up!</Text>
          <Text style={styles.helper}>
            Every word and every activity is a step forward.
          </Text>
        </View>
      </Card>

      <Card>
        <Text style={listStyles.sectionTitle}>What's Your Goal?</Text>
        <Text style={styles.helper}>
          To find a treasure we need a map, so let's make our map so our trail becomes clear.
        </Text>
        <View style={listStyles.inputRow}>
          <TextField
            accessibilityLabel="New goal"
            placeholder="e.g. Ask for help"
            value={goalName}
            onChangeText={setGoalName}
            style={listStyles.input}
          />
          <PrimaryButton
            accessibilityLabel="Create goal"
            label="+"
            onPress={addGoal}
            style={listStyles.addButton}
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
                  style={listStyles.itemRow}
                >
                  <View style={[listStyles.checkCircle, step.completed && listStyles.checkCircleDone]}>
                    {step.completed ? <Text style={listStyles.checkMark}>✓</Text> : null}
                  </View>
                  <Text style={[listStyles.itemText, step.completed && listStyles.itemTextDone]}>{step.name}</Text>
                </Pressable>
              ))}
            </View>
          ))
        )}

        {firstGoal ? (
          <View style={listStyles.inputRow}>
            <TextField
              accessibilityLabel="New goal step"
              placeholder="Add a step..."
              value={stepName}
              onChangeText={setStepName}
              style={listStyles.input}
            />
            <PrimaryButton
              accessibilityLabel="Add step"
              label="+"
              onPress={addStep}
              style={listStyles.addButton}
            />
          </View>
        ) : null}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
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
  mascot: {
    width: 72,
    height: 72,
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
});
