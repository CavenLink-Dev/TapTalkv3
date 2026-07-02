/**
 * Board Health — audit screen for contrast, duplicates, missing labels, and density.
 *
 * Tapping an issue row navigates back to the Talk board with the relevant board
 * mode active (when possible). All checks are pure functions over the static
 * BOARD_TILES data and the user's hiddenTileIds state.
 */

import React, { useCallback, useMemo, useState } from 'react';
import {
  LayoutAnimation,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { BOARD_TILES } from '../(tabs)/talk';
import { useAppContext } from '../../src/hooks/useAppContext';
import { useTheme } from '../../src/theme/useTheme';
import { radii, spacing, typography } from '../../src/theme/tokens';
import { hapticSelection } from '../../src/utils/haptics';
import { useReduceMotion } from '../../src/hooks/useReduceMotion';
import { checkAllBoards } from '../../src/utils/boardHealth';
import type { BoardIssue } from '../../src/utils/boardHealth';

function IssueRow({ issue, index }: { issue: BoardIssue; index: number }) {
  const t = useTheme();
  const isWarning = issue.severity === 'warning';
  return (
    <View
      style={[
        styles.issueRow,
        {
          backgroundColor: t.colors.surface,
          borderLeftColor: isWarning ? t.colors.danger : t.colors.primary,
          borderLeftWidth: 4,
        },
      ]}
    >
      <View style={styles.issueHeader}>
        <Ionicons
          name={isWarning ? 'warning' : 'information-circle'}
          size={20}
          color={isWarning ? t.colors.danger : t.colors.primary}
        />
        <Text style={[styles.issueBoard, { color: t.colors.textMuted }]}>
          {issue.boardMode}
        </Text>
      </View>
      <Text style={[styles.issueMessage, { color: t.colors.text }]}>
        {issue.message}
      </Text>
    </View>
  );
}

export default function BoardHealthScreen() {
  const router = useRouter();
  const t = useTheme();
  const reduceMotion = useReduceMotion();
  const { state } = useAppContext();
  const [hasRun, setHasRun] = useState(false);

  const issues = useMemo(() => {
    if (!hasRun) return [];
    const boards: Record<string, { id: string; label: string; color: string }[]> = {};
    Object.entries(BOARD_TILES).forEach(([mode, tiles]) => {
      boards[mode] = tiles.map(tile => ({
        id: tile.id,
        label: tile.label,
        color: tile.color,
      }));
    });
    return checkAllBoards(boards, state.hiddenTileIds, t.colors.text);
  }, [hasRun, state.hiddenTileIds, t.colors.text]);

  const warningCount = issues.filter(i => i.severity === 'warning').length;
  const suggestionCount = issues.filter(i => i.severity === 'suggestion').length;

  const runCheck = useCallback(() => {
    hapticSelection();
    if (!reduceMotion) {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    }
    setHasRun(true);
  }, [reduceMotion]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: t.colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back"
          onPress={() => router.back()}
          hitSlop={12}
          style={styles.headerButton}
        >
          <Ionicons name="chevron-back" size={28} color={t.colors.primary} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: t.colors.text }]}>Board Health</Text>
        <View style={styles.headerButton} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        alwaysBounceVertical
      >
        {/* Run Check button */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Run board health check"
          onPress={runCheck}
          style={({ pressed }) => [
            styles.runButton,
            { backgroundColor: pressed ? t.colors.primaryPressed : t.colors.primary },
          ]}
        >
          <Text style={styles.runButtonText}>Run Check</Text>
        </Pressable>

        {/* Summary */}
        {hasRun && (
          <View style={styles.summaryRow}>
            <View style={[styles.summaryBadge, { backgroundColor: t.colors.danger + '15' }]}>
              <Text style={[styles.summaryNumber, { color: t.colors.danger }]}>{warningCount}</Text>
              <Text style={[styles.summaryLabel, { color: t.colors.danger }]}>Warnings</Text>
            </View>
            <View style={[styles.summaryBadge, { backgroundColor: t.colors.primary + '15' }]}>
              <Text style={[styles.summaryNumber, { color: t.colors.primary }]}>{suggestionCount}</Text>
              <Text style={[styles.summaryLabel, { color: t.colors.primary }]}>Suggestions</Text>
            </View>
          </View>
        )}

        {/* Issues list */}
        {hasRun && issues.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="checkmark-circle" size={48} color={t.colors.success} />
            <Text style={[styles.emptyTitle, { color: t.colors.text }]}>All Clear</Text>
            <Text style={[styles.emptySubtitle, { color: t.colors.textMuted }]}>
              No issues found on your boards.
            </Text>
          </View>
        )}

        {hasRun && issues.map((issue, index) => (
          <IssueRow key={issue.id} issue={issue} index={index} />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    minHeight: 60,
  },
  headerButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: typography.heading,
    fontWeight: '800',
  },
  content: {
    padding: spacing.lg,
    gap: spacing.md,
    paddingBottom: 40,
  },
  runButton: {
    height: 52,
    borderRadius: radii.button,
    alignItems: 'center',
    justifyContent: 'center',
  },
  runButtonText: {
    color: '#FFFFFF',
    fontSize: typography.body,
    fontWeight: '700',
  },
  summaryRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  summaryBadge: {
    flex: 1,
    borderRadius: radii.card,
    padding: spacing.md,
    alignItems: 'center',
  },
  summaryNumber: {
    fontSize: 28,
    fontWeight: '800',
  },
  summaryLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 2,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    gap: spacing.md,
  },
  emptyTitle: {
    fontSize: typography.subheading,
    fontWeight: '700',
  },
  emptySubtitle: {
    fontSize: typography.callout,
    textAlign: 'center',
  },
  issueRow: {
    borderRadius: radii.card,
    padding: spacing.md,
    gap: spacing.xs,
  },
  issueHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  issueBoard: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  issueMessage: {
    fontSize: 15,
    fontWeight: '500',
    lineHeight: 20,
  },
});
