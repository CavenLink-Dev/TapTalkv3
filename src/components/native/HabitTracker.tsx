import * as Haptics from 'expo-haptics';
import React, { useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useAppContext } from '../../hooks/useAppContext';
import { Habit } from '../../context/types';
import { colors, radii, spacing, typography } from '../../theme/tokens';

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function getStreak(completedDates: string[]): number {
  if (!completedDates.length) return 0;
  const sorted = [...completedDates].sort().reverse();
  let streak = 0;
  let cursor = new Date();
  for (const date of sorted) {
    const expected = cursor.toISOString().slice(0, 10);
    if (date === expected) {
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}

function HabitRow({ habit }: { habit: Habit }) {
  const { dispatch } = useAppContext();
  const today = todayKey();
  const done = habit.completedDates.includes(today);
  const streak = getStreak(habit.completedDates);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const toggle = async () => {
    const reduceMotion = await AccessibilityInfo.isReduceMotionEnabled();
    dispatch({ type: 'TOGGLE_HABIT_TODAY', payload: { id: habit.id, date: today } });

    if (!done) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    if (!reduceMotion) {
      Animated.sequence([
        Animated.spring(scaleAnim, {
          toValue: 0.94,
          tension: 200,
          friction: 10,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 120,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    }
  };

  const deleteHabit = () => {
    dispatch({ type: 'DELETE_HABIT', payload: habit.id });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  return (
    <Animated.View style={[styles.habitRow, { transform: [{ scale: scaleAnim }] }]}>
      <Pressable
        accessibilityRole="checkbox"
        accessibilityLabel={`${habit.name}, ${done ? 'completed' : 'not done'}, ${streak} day streak`}
        accessibilityState={{ checked: done }}
        onPress={toggle}
        style={styles.habitMain}
        hitSlop={4}
      >
        <View style={[styles.checkCircle, done && styles.checkCircleDone]}>
          {done && <Text style={styles.checkMark}>✓</Text>}
        </View>
        <View style={styles.habitInfo}>
          <Text style={[styles.habitName, done && styles.habitNameDone]}>{habit.name}</Text>
          {streak > 0 && (
            <Text style={styles.streakText}>
              {streak} day streak
            </Text>
          )}
        </View>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Delete ${habit.name}`}
        onPress={deleteHabit}
        style={styles.deleteBtn}
        hitSlop={8}
      >
        <Text style={styles.deleteBtnText}>✕</Text>
      </Pressable>
    </Animated.View>
  );
}

export function HabitTracker() {
  const { state } = useAppContext();
  const [input, setInput] = useState('');
  const { dispatch } = useAppContext();

  const addHabit = () => {
    const name = input.trim();
    if (!name) return;
    const habit: Habit = {
      id: `${Date.now()}`,
      name,
      completedDates: [],
    };
    dispatch({ type: 'ADD_HABIT', payload: habit });
    setInput('');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const today = todayKey();
  const doneCount = state.habits.filter((h) => h.completedDates.includes(today)).length;
  const total = state.habits.length;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Daily Habits</Text>
        {total > 0 && (
          <Text style={styles.summary}>
            {doneCount}/{total} today
          </Text>
        )}
      </View>

      <View style={styles.inputRow}>
        <TextInput
          accessibilityLabel="New habit name"
          placeholder="Add a habit..."
          placeholderTextColor={colors.textTertiary}
          value={input}
          onChangeText={setInput}
          returnKeyType="done"
          onSubmitEditing={addHabit}
          style={styles.input}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Add habit"
          onPress={addHabit}
          style={styles.addBtn}
          hitSlop={4}
        >
          <Text style={styles.addBtnText}>+</Text>
        </Pressable>
      </View>

      {state.habits.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No habits yet. Add one above.</Text>
        </View>
      ) : (
        <View style={styles.list}>
          {state.habits.map((habit) => (
            <HabitRow key={habit.id} habit={habit} />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: radii.button,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnText: {
    color: colors.surface,
    fontSize: 22,
    fontWeight: '400',
    lineHeight: 26,
  },
  checkCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkCircleDone: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  checkMark: {
    color: colors.surface,
    fontSize: 13,
    fontWeight: '700',
  },
  container: {
    gap: spacing.md,
  },
  deleteBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtnText: {
    color: colors.textTertiary,
    fontSize: 14,
    fontWeight: '600',
  },
  empty: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  emptyText: {
    color: colors.textTertiary,
    fontSize: typography.caption,
  },
  habitInfo: {
    flex: 1,
    gap: 2,
  },
  habitMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: 44,
  },
  habitName: {
    fontSize: typography.callout,
    fontWeight: '500',
    color: colors.text,
  },
  habitNameDone: {
    color: colors.textMuted,
    textDecorationLine: 'line-through',
  },
  habitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xs,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  input: {
    flex: 1,
    height: 44,
    backgroundColor: colors.input,
    borderRadius: radii.input,
    paddingHorizontal: spacing.md,
    fontSize: typography.callout,
    color: colors.text,
  },
  inputRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
  },
  list: {
    gap: 2,
  },
  streakText: {
    fontSize: typography.caption,
    color: colors.warning,
    fontWeight: '600',
  },
  summary: {
    fontSize: typography.caption,
    color: colors.textMuted,
    fontWeight: '600',
  },
  title: {
    fontSize: typography.callout,
    fontWeight: '700',
    color: colors.text,
  },
});
