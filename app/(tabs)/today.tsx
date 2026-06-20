import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Card } from '../../src/components/native/Card';
import { FocusTimer } from '../../src/components/native/FocusTimer';
import { HabitTracker } from '../../src/components/native/HabitTracker';
import { PrimaryButton } from '../../src/components/native/PrimaryButton';
import { Screen } from '../../src/components/native/Screen';
import { TextField } from '../../src/components/native/TextField';
import { useAppContext } from '../../src/hooks/useAppContext';
import { listStyles } from '../../src/styles/listStyles';
import { colors, radii, spacing, typography } from '../../src/theme/tokens';

const suggestions = ['Brush teeth', 'Eat breakfast', 'Get dressed', 'Read a book'];

function todayId() {
  return new Date().toISOString().slice(0, 10);
}

export default function TodayScreen() {
  const { state, dispatch } = useAppContext();
  const [taskName, setTaskName] = useState('');
  const [first, setFirst] = useState(state.firstThen.first ?? '');
  const [then, setThen] = useState(state.firstThen.then ?? '');

  const addTask = () => {
    const name = taskName.trim();
    if (!name) return;
    dispatch({
      type: 'ADD_TASK',
      payload: {
        id: `${Date.now()}`,
        name,
        description: '',
        tags: [{ id: 'today', color: colors.primary }],
        dueDate: todayId(),
        startDate: null,
        reminders: [],
        completed: false,
        completedAt: null,
      },
    });
    setTaskName('');
  };

  const saveFirstThen = () => {
    dispatch({
      type: 'SET_FIRST_THEN',
      payload: { first: first.trim() || null, then: then.trim() || null },
    });
  };

  return (
    <Screen title="Today" subtitle="Plan the day in small, clear steps.">
      <Card style={listStyles.section}>
        <Text style={listStyles.sectionTitle}>Today Tasks</Text>
        <View style={listStyles.inputRow}>
          <TextField
            accessibilityLabel="New task name"
            placeholder="Add a task..."
            value={taskName}
            onChangeText={setTaskName}
            returnKeyType="done"
            onSubmitEditing={addTask}
            style={listStyles.input}
          />
          <PrimaryButton
            accessibilityLabel="Add task"
            label="+"
            onPress={addTask}
            style={listStyles.addButton}
          />
        </View>
        {state.tasks.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={listStyles.emptyIcon}>📭</Text>
            <Text style={styles.emptyTitle}>No tasks yet</Text>
            <Text style={styles.emptyText}>Add one simple task to start.</Text>
          </View>
        ) : (
          state.tasks.map((task) => (
            <Pressable
              key={task.id}
              accessibilityRole="checkbox"
              accessibilityLabel={`Mark ${task.name} ${task.completed ? 'incomplete' : 'complete'}`}
              accessibilityState={{ checked: task.completed }}
              onPress={() => dispatch({ type: 'TOGGLE_TASK', payload: task.id })}
              style={listStyles.itemRow}
            >
              <View style={[listStyles.checkCircle, task.completed && listStyles.checkCircleDone]}>
                {task.completed ? <Text style={listStyles.checkMark}>✓</Text> : null}
              </View>
              <Text style={[listStyles.itemText, task.completed && listStyles.itemTextDone]}>
                {task.name}
              </Text>
            </Pressable>
          ))
        )}
      </Card>

      <Card style={listStyles.section}>
        <Text style={listStyles.sectionTitle}>First — Then</Text>
        <Text style={styles.helper}>Use this as a calm visual sequence.</Text>
        <View style={styles.firstThenRow}>
          <View style={styles.slot}>
            <Text style={styles.slotLabel}>FIRST</Text>
            <TextField
              accessibilityLabel="First activity"
              placeholder="First..."
              value={first}
              onChangeText={setFirst}
              style={styles.slotInput}
            />
          </View>
          <View style={styles.slot}>
            <Text style={[styles.slotLabel, styles.thenLabel]}>THEN</Text>
            <TextField
              accessibilityLabel="Then activity"
              placeholder="Then..."
              value={then}
              onChangeText={setThen}
              style={styles.slotInput}
            />
          </View>
        </View>
        <View style={styles.suggestions}>
          {suggestions.map((item) => (
            <Pressable
              key={item}
              accessibilityRole="button"
              accessibilityLabel={`Use ${item} as first activity`}
              onPress={() => setFirst(item)}
              style={styles.suggestion}
            >
              <Text style={styles.suggestionText}>{item}</Text>
            </Pressable>
          ))}
        </View>
        <PrimaryButton
          accessibilityLabel="Save first then board"
          label="Save First — Then"
          onPress={saveFirstThen}
        />
      </Card>

      <Card style={listStyles.section}>
        <FocusTimer />
      </Card>

      <Card style={listStyles.section}>
        <HabitTracker />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  emptyText: {
    color: colors.textTertiary,
    fontSize: typography.caption,
  },
  emptyTitle: {
    marginTop: spacing.sm,
    color: colors.textMuted,
    fontSize: typography.callout,
    fontWeight: '700',
  },
  firstThenRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  helper: {
    color: colors.textMuted,
    fontSize: typography.caption,
  },
  slot: {
    flex: 1,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: radii.card,
    overflow: 'hidden',
  },
  slotInput: {
    borderWidth: 0,
    borderRadius: 0,
    backgroundColor: colors.surface,
    textAlign: 'center',
  },
  slotLabel: {
    paddingVertical: 7,
    textAlign: 'center',
    color: colors.primary,
    backgroundColor: colors.softBlue,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
  },
  suggestion: {
    borderRadius: radii.pill,
    backgroundColor: colors.input,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  suggestions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginVertical: spacing.md,
  },
  suggestionText: {
    color: colors.textMuted,
    fontSize: typography.caption,
    fontWeight: '700',
  },
  thenLabel: {
    color: '#15803D',
    backgroundColor: '#F0FDF4',
  },
});
