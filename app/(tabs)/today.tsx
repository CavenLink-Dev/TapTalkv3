import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Card } from '../../src/components/native/Card';
import { PrimaryButton } from '../../src/components/native/PrimaryButton';
import { Screen } from '../../src/components/native/Screen';
import { TextField } from '../../src/components/native/TextField';
import { useAppContext } from '../../src/hooks/useAppContext';
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
      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>Today Tasks</Text>
        <View style={styles.inputRow}>
          <TextField
            accessibilityLabel="New task name"
            placeholder="Add a task..."
            value={taskName}
            onChangeText={setTaskName}
            returnKeyType="done"
            onSubmitEditing={addTask}
            style={styles.input}
          />
          <PrimaryButton
            accessibilityLabel="Add task"
            label="+"
            onPress={addTask}
            style={styles.addButton}
          />
        </View>
        {state.tasks.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📭</Text>
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
              style={styles.taskRow}
            >
              <View style={[styles.checkCircle, task.completed && styles.checkCircleDone]}>
                {task.completed ? <Text style={styles.checkMark}>✓</Text> : null}
              </View>
              <Text style={[styles.taskText, task.completed && styles.taskTextDone]}>
                {task.name}
              </Text>
            </Pressable>
          ))
        )}
      </Card>

      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>First — Then</Text>
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
    </Screen>
  );
}

const styles = StyleSheet.create({
  addButton: {
    width: 50,
  },
  checkCircle: {
    width: 26,
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.disabled,
    borderRadius: 13,
  },
  checkCircleDone: {
    borderColor: colors.success,
    backgroundColor: colors.success,
  },
  checkMark: {
    color: colors.surface,
    fontWeight: '900',
  },
  emptyIcon: {
    fontSize: 38,
  },
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
  input: {
    flex: 1,
  },
  inputRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: typography.subheading,
    fontWeight: '800',
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
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.md,
    borderRadius: radii.card,
    backgroundColor: colors.input,
    padding: spacing.md,
  },
  taskText: {
    flex: 1,
    color: colors.text,
    fontSize: typography.callout,
    fontWeight: '700',
  },
  taskTextDone: {
    color: colors.textTertiary,
    textDecorationLine: 'line-through',
  },
  thenLabel: {
    color: '#15803D',
    backgroundColor: '#F0FDF4',
  },
});
