import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card } from '../../src/components/native/Card';
import { PrimaryButton } from '../../src/components/native/PrimaryButton';
import { useAppContext } from '../../src/hooks/useAppContext';
import { colors, radii, spacing, typography } from '../../src/theme/tokens';

const DAY_LETTERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function getTodayLabel(): string {
  const d = new Date();
  return `${WEEKDAYS[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

function buildWeekDays(): { letter: string; date: number; isToday: boolean }[] {
  const today = new Date();
  const dow = today.getDay();
  return DAY_LETTERS.map((letter, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - dow + i);
    return { letter, date: d.getDate(), isToday: i === dow };
  });
}

export default function ToolsScreen() {
  const { state, dispatch } = useAppContext();

  const [editFirst, setEditFirst] = useState(false);
  const [editThen, setEditThen] = useState(false);
  const [firstDraft, setFirstDraft] = useState('');
  const [thenDraft, setThenDraft] = useState('');
  const [newTask, setNewTask] = useState('');

  const weekDays = buildWeekDays();
  const doneTasks = state.tasks.filter(t => t.completed).length;

  const commitFirst = () => {
    dispatch({
      type: 'SET_FIRST_THEN',
      payload: { first: firstDraft.trim() || null, then: state.firstThen.then },
    });
    setEditFirst(false);
  };

  const commitThen = () => {
    dispatch({
      type: 'SET_FIRST_THEN',
      payload: { first: state.firstThen.first, then: thenDraft.trim() || null },
    });
    setEditThen(false);
  };

  const addTask = () => {
    const name = newTask.trim();
    if (!name) return;
    dispatch({
      type: 'ADD_TASK',
      payload: {
        id: `task-${Date.now()}`,
        name,
        description: '',
        tags: [],
        dueDate: null,
        startDate: null,
        reminders: [],
        completed: false,
        completedAt: null,
      },
    });
    setNewTask('');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── Header ──────────────────────────────────────────────── */}
          <View style={styles.headerRow}>
            <Text style={styles.title}>Today</Text>
            <Text style={styles.dateLabel}>{getTodayLabel()}</Text>
          </View>

          {/* ── Week strip ──────────────────────────────────────────── */}
          <View style={styles.weekStrip}>
            {weekDays.map((wd, i) => (
              <View key={i} style={styles.weekDay}>
                <Text style={styles.weekDayLetter}>{wd.letter}</Text>
                <View style={[styles.weekDateBox, wd.isToday && styles.weekDateBoxToday]}>
                  <Text style={[styles.weekDateText, wd.isToday && styles.weekDateTextToday]}>
                    {wd.date}
                  </Text>
                </View>
              </View>
            ))}
          </View>

          {/* ── First → Then ────────────────────────────────────────── */}
          <Card>
            <Text style={styles.sectionLabel}>FIRST · THEN</Text>
            <View style={styles.firstThenRow}>
              {/* FIRST cell */}
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Set First task"
                style={styles.ftCell}
                onPress={() => {
                  setFirstDraft(state.firstThen.first ?? '');
                  setEditFirst(true);
                }}
              >
                <Text style={styles.ftTag}>FIRST</Text>
                {editFirst ? (
                  <TextInput
                    style={styles.ftInput}
                    value={firstDraft}
                    onChangeText={setFirstDraft}
                    autoFocus
                    onBlur={commitFirst}
                    onSubmitEditing={commitFirst}
                    placeholder="e.g. Brush teeth"
                    placeholderTextColor={colors.textTertiary}
                    returnKeyType="done"
                  />
                ) : (
                  <Text style={styles.ftValue} numberOfLines={2}>
                    {state.firstThen.first || 'Tap to set'}
                  </Text>
                )}
              </Pressable>

              <Text style={styles.ftArrow}>→</Text>

              {/* THEN cell */}
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Set Then reward"
                style={styles.ftCell}
                onPress={() => {
                  setThenDraft(state.firstThen.then ?? '');
                  setEditThen(true);
                }}
              >
                <Text style={styles.ftTag}>THEN</Text>
                {editThen ? (
                  <TextInput
                    style={styles.ftInput}
                    value={thenDraft}
                    onChangeText={setThenDraft}
                    autoFocus
                    onBlur={commitThen}
                    onSubmitEditing={commitThen}
                    placeholder="e.g. Play time"
                    placeholderTextColor={colors.textTertiary}
                    returnKeyType="done"
                  />
                ) : (
                  <Text style={styles.ftValue} numberOfLines={2}>
                    {state.firstThen.then || 'Tap to set'}
                  </Text>
                )}
              </Pressable>
            </View>
          </Card>

          {/* ── Tasks header ────────────────────────────────────────── */}
          <View style={styles.tasksHeader}>
            <Text style={styles.tasksTitle}>Tasks</Text>
            {state.tasks.length > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {doneTasks}/{state.tasks.length} done
                </Text>
              </View>
            )}
          </View>

          {/* ── Task list ────────────────────────────────────────────── */}
          {state.tasks.length > 0 && (
            <Card style={styles.taskListCard}>
              {state.tasks.map((task, i) => (
                <Pressable
                  key={task.id}
                  accessibilityRole="checkbox"
                  accessibilityLabel={task.name}
                  accessibilityState={{ checked: task.completed }}
                  onPress={() => dispatch({ type: 'TOGGLE_TASK', payload: task.id })}
                  style={[
                    styles.taskRow,
                    i < state.tasks.length - 1 && styles.taskRowBorder,
                  ]}
                >
                  <View style={[styles.checkbox, task.completed && styles.checkboxDone]}>
                    {task.completed && <Text style={styles.checkmark}>✓</Text>}
                  </View>
                  <Text
                    style={[styles.taskName, task.completed && styles.taskNameDone]}
                    numberOfLines={2}
                  >
                    {task.name}
                  </Text>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Delete ${task.name}`}
                    onPress={() => dispatch({ type: 'DELETE_TASK', payload: task.id })}
                    style={styles.deleteBtn}
                    hitSlop={8}
                  >
                    <Text style={styles.deleteBtnText}>✕</Text>
                  </Pressable>
                </Pressable>
              ))}
            </Card>
          )}

          {/* ── Add task ─────────────────────────────────────────────── */}
          <Card style={styles.addRow}>
            <TextInput
              style={styles.addInput}
              placeholder="Add a task..."
              placeholderTextColor={colors.textTertiary}
              value={newTask}
              onChangeText={setNewTask}
              onSubmitEditing={addTask}
              returnKeyType="done"
            />
            <PrimaryButton
              accessibilityLabel="Add task"
              label="ADD"
              onPress={addTask}
              style={styles.addBtn}
            />
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  content: { padding: spacing.lg, paddingBottom: 32, gap: spacing.lg },

  // ── Header
  headerRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: typography.title,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.4,
  },
  dateLabel: {
    fontSize: typography.caption,
    color: colors.textMuted,
  },

  // ── Week strip
  weekStrip: {
    flexDirection: 'row',
    gap: 6,
  },
  weekDay: { flex: 1, alignItems: 'center' },
  weekDayLetter: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textTertiary,
    marginBottom: 6,
  },
  weekDateBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekDateBoxToday: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  weekDateText: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textMuted,
  },
  weekDateTextToday: {
    color: colors.surface,
  },

  // ── First-Then
  sectionLabel: {
    fontSize: typography.caption,
    fontWeight: '800',
    color: colors.textTertiary,
    letterSpacing: 0.6,
    marginBottom: spacing.md,
  },
  firstThenRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  ftCell: {
    flex: 1,
    backgroundColor: colors.inputBg,
    borderRadius: radii.card,
    padding: spacing.md,
    alignItems: 'center',
    minHeight: 82,
    justifyContent: 'center',
  },
  ftTag: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 0.4,
    marginBottom: spacing.xs,
  },
  ftValue: {
    fontSize: typography.callout,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
  },
  ftInput: {
    fontSize: typography.callout,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
    padding: 0,
    width: '100%',
  },
  ftArrow: {
    fontSize: 24,
    color: colors.textTertiary,
    fontWeight: '300',
  },

  // ── Tasks
  tasksHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  tasksTitle: {
    fontSize: typography.subheading,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.3,
  },
  badge: {
    backgroundColor: colors.softBlue,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  badgeText: {
    fontSize: typography.caption,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  taskListCard: {
    padding: 0,
    overflow: 'hidden',
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  taskRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#EEF2F6',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  checkboxDone: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  checkmark: {
    color: colors.surface,
    fontSize: 13,
    fontWeight: '900',
    lineHeight: 16,
  },
  taskName: {
    flex: 1,
    fontSize: typography.callout,
    fontWeight: '600',
    color: colors.text,
    lineHeight: 20,
  },
  taskNameDone: {
    textDecorationLine: 'line-through',
    color: colors.textTertiary,
  },
  deleteBtn: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtnText: {
    fontSize: 14,
    color: colors.textTertiary,
    fontWeight: '700',
  },

  // ── Add task row
  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
  },
  addInput: {
    flex: 1,
    fontSize: typography.callout,
    color: colors.text,
    padding: 0,
    minHeight: 40,
  },
  addBtn: {
    paddingHorizontal: spacing.lg,
    minHeight: 40,
  },
});
