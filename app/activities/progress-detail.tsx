/**
 * Activity Progress Detail — recent runs for ONE activity.
 *
 * Reached only by tapping an activity card on the Progress overview
 * (Rule 2/5 — deeper detail only when selected). Shows a calm summary
 * band (runs, time practised, highest difficulty, retry trend) and the
 * most recent runs, newest first. Retries appear in muted observation
 * tone — never red, never a penalty. A per-activity plain-text share
 * reuses the same therapist summary builder as the overview.
 */

import React, { useCallback, useMemo } from 'react';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { radii, spacing, typography } from '../../src/theme/tokens';
import { fonts } from '../../src/theme/fonts';
import { useTheme } from '../../src/theme/useTheme';
import { usePullRefresh } from '../../src/hooks/usePullRefresh';
import { useReduceSensoryLoad } from '../../src/hooks/useReduceSensoryLoad';
import { hapticSelection } from '../../src/utils/haptics';
import { useActivitySessions } from '../../src/features/activities/progress-store';
import { ACTIVITY_META, activityTitles } from '../../src/features/activities/activity-meta';
import {
  buildTherapistSummary,
  difficultyLabel,
  formatDuration,
  recentRuns,
  relativeDay,
  summariseActivities,
} from '../../src/features/activities/progress-selectors';

export default function ActivityProgressDetailScreen() {
  const t = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ activityId?: string }>();
  const activityId = typeof params.activityId === 'string' ? params.activityId : '';
  const sessions = useActivitySessions();
  const { refreshing, onRefresh } = usePullRefresh();
  const reduceSensory = useReduceSensoryLoad();

  const meta = ACTIVITY_META[activityId] ?? {
    title: activityId || 'Activity',
    accent: t.colors.primary,
    icon: 'sparkles-outline' as const,
  };

  const summary = useMemo(
    () => summariseActivities(sessions).find(s => s.activityId === activityId) ?? null,
    [activityId, sessions],
  );
  const runs = useMemo(() => recentRuns(sessions, activityId, 10), [activityId, sessions]);

  const handleShare = useCallback(async () => {
    if (!reduceSensory) hapticSelection();
    const message = buildTherapistSummary(sessions, {
      titles: activityTitles(),
      activityId,
    });
    try {
      await Share.share({ message });
    } catch {
      // Dismissed or unavailable — calmly do nothing.
    }
  }, [activityId, reduceSensory, sessions]);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: t.colors.background }]} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={16}
          style={styles.headerIconBtn}
          accessibilityLabel="Back to Progress"
          accessibilityRole="button"
        >
          <Ionicons name="chevron-back" size={28} color={t.colors.primary} />
        </Pressable>
        <Text
          style={[styles.title, { color: t.colors.text }]}
          accessibilityRole="header"
          numberOfLines={1}
        >
          {meta.title}
        </Text>
        <View style={styles.headerIconBtn} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        bounces
        alwaysBounceVertical
        overScrollMode="always"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={t.colors.primary}
            colors={[t.colors.primary]}
          />
        }
      >
        {!summary || runs.length === 0 ? (
          /* Empty guard (Rule 24) — content unavailable + a way back. */
          <View style={[styles.emptyCard, { backgroundColor: t.colors.surface }]}>
            <Ionicons name="leaf-outline" size={44} color={t.colors.textTertiary} />
            <Text style={[styles.emptyTitle, { color: t.colors.text }]}>
              No runs recorded yet
            </Text>
            <Text style={[styles.emptySub, { color: t.colors.textMuted }]}>
              Finish this activity once and its runs will appear here.
            </Text>
            <Pressable
              onPress={() => router.back()}
              accessibilityRole="button"
              accessibilityLabel="Back to Progress"
              style={({ pressed }) => [
                styles.emptyBackBtn,
                { backgroundColor: t.colors.selectionBg, opacity: pressed ? 0.85 : 1 },
              ]}
            >
              <Text style={[styles.emptyBackText, { color: t.colors.primaryDark }]}>
                Back to Progress
              </Text>
            </Pressable>
          </View>
        ) : (
          <>
            {/* Summary band */}
            <View
              style={[
                styles.summaryBand,
                { backgroundColor: t.colors.surface, borderLeftColor: meta.accent },
              ]}
              accessibilityLabel={
                `${meta.title}. ${summary.runCount} completed run${summary.runCount === 1 ? '' : 's'}, ` +
                `${formatDuration(summary.totalDurationMs)} practised. ` +
                `Highest difficulty ${difficultyLabel(summary.highestDifficulty)}.`
              }
            >
              <View style={styles.summaryHead}>
                <View style={[styles.summaryIcon, { backgroundColor: `${meta.accent}1F` }]}>
                  <Ionicons name={meta.icon} size={22} color={meta.accent} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.summaryHeading, { color: t.colors.text }]}>
                    {summary.runCount} run{summary.runCount === 1 ? '' : 's'} · {formatDuration(summary.totalDurationMs)} practised
                  </Text>
                  <Text style={[styles.summaryLine, { color: t.colors.textMuted }]}>
                    Highest difficulty: {difficultyLabel(summary.highestDifficulty)}.
                  </Text>
                </View>
              </View>
              {summary.retryTrend === 'steadier' ? (
                <View style={styles.trendRow}>
                  <Ionicons name="trending-up-outline" size={16} color={t.colors.success} />
                  <Text style={[styles.trendText, { color: t.colors.textMuted }]}>
                    Fewer retries in recent runs — answers are getting steadier.
                  </Text>
                </View>
              ) : null}
            </View>

            {/* Recent runs (Rule 27) — newest first */}
            <Text style={[styles.sectionTitle, { color: t.colors.text }]}>Recent runs</Text>
            <View style={styles.list}>
              {runs.map((run, i) => (
                <View
                  key={`${run.completedAt}-${i}`}
                  style={[styles.runRow, { backgroundColor: t.colors.surface }]}
                  accessibilityLabel={
                    `${relativeDay(run.completedAt)}, ${difficultyLabel(run.difficulty)}, ` +
                    `${formatDuration(run.durationMs)}` +
                    (run.incorrectCount > 0
                      ? `, ${run.incorrectCount} retr${run.incorrectCount === 1 ? 'y' : 'ies'}.`
                      : ', no retries.')
                  }
                >
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.runDay, { color: t.colors.text }]}>
                      {relativeDay(run.completedAt)}
                    </Text>
                    <Text style={[styles.runMeta, { color: t.colors.textMuted }]}>
                      {formatDuration(run.durationMs)}
                      {run.incorrectCount > 0
                        ? ` · ${run.incorrectCount} retr${run.incorrectCount === 1 ? 'y' : 'ies'}`
                        : ' · no retries'}
                    </Text>
                  </View>
                  <View style={[styles.chip, { backgroundColor: t.colors.selectionBg }]}>
                    <Ionicons name="checkmark" size={12} color={t.colors.primaryDark} />
                    <Text style={[styles.chipText, { color: t.colors.primaryDark }]}>
                      {difficultyLabel(run.difficulty)}
                    </Text>
                  </View>
                </View>
              ))}
            </View>

            {/* Per-activity share */}
            <Pressable
              onPress={handleShare}
              accessibilityRole="button"
              accessibilityLabel={`Share ${meta.title} summary`}
              accessibilityHint="Opens the share sheet with a plain-text summary of this activity"
              style={({ pressed }) => [
                styles.shareRow,
                { backgroundColor: t.colors.surface, opacity: pressed ? 0.85 : 1 },
              ]}
            >
              <View style={[styles.shareIcon, { backgroundColor: t.colors.selectionBg }]}>
                <Ionicons name="share-outline" size={22} color={t.colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.shareTitle, { color: t.colors.text }]}>
                  Share this activity
                </Text>
                <Text style={[styles.shareSub, { color: t.colors.textMuted }]}>
                  A plain-text summary of {meta.title} practice.
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={t.colors.textTertiary} />
            </Pressable>

            <Text style={[styles.footnote, { color: t.colors.textTertiary }]}>
              Retries are part of learning — they are noted only to show growing
              independence, never as a penalty.
            </Text>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    gap: spacing.md},
  headerIconBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  title: {
    fontFamily: fonts.displayBlack,
    flex: 1,
    textAlign: 'center',
    fontSize: typography.title,
    letterSpacing: typography.trackTitle},

  scroll: {
    padding: spacing.lg,
    paddingBottom: 60,
    gap: spacing.lg},

  // Summary band
  summaryBand: {
    borderRadius: radii.card,
    borderLeftWidth: 5,
    padding: spacing.lg,
    gap: spacing.md},
  summaryHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md},
  summaryIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center'},
  summaryHeading: {
    fontFamily: fonts.displayHeavy,
    fontSize: typography.subheading,
    letterSpacing: typography.trackSubhead},
  summaryLine: {
    fontFamily: fonts.body,
    fontSize: typography.callout,
    marginTop: 2,
    lineHeight: 20},
  trendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6},
  trendText: {
    fontFamily: fonts.body,
    fontSize: typography.caption,
    flex: 1,
    lineHeight: 18},

  sectionTitle: {
    fontFamily: fonts.displayHeavy,
    fontSize: typography.subheading,
    letterSpacing: typography.trackSubhead},
  list: { gap: spacing.sm },

  // Run rows
  runRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderRadius: radii.card,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    minHeight: 44},
  runDay: {
    fontFamily: fonts.displayBold,
    fontSize: typography.callout},
  runMeta: {
    fontFamily: fonts.body,
    fontSize: typography.caption,
    marginTop: 2},
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radii.pill},
  chipText: {
    fontFamily: fonts.displayBold,
    fontSize: typography.caption},

  // Share row
  shareRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderRadius: radii.card,
    padding: spacing.lg,
    minHeight: 44},
  shareIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center'},
  shareTitle: {
    fontFamily: fonts.displayHeavy,
    fontSize: typography.subheading,
    letterSpacing: typography.trackSubhead},
  shareSub: {
    fontFamily: fonts.body,
    fontSize: typography.caption,
    marginTop: 2,
    lineHeight: 18},

  footnote: {
    fontFamily: fonts.body,
    fontSize: typography.caption,
    lineHeight: 18},

  // Empty guard
  emptyCard: {
    borderRadius: radii.card,
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    gap: spacing.md},
  emptyTitle: {
    fontFamily: fonts.displayHeavy,
    fontSize: typography.subheading,
    letterSpacing: typography.trackSubhead},
  emptySub: {
    fontFamily: fonts.body,
    fontSize: typography.callout,
    textAlign: 'center',
    lineHeight: 21},
  emptyBackBtn: {
    minHeight: 44,
    paddingHorizontal: spacing.xl,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sm},
  emptyBackText: {
    fontFamily: fonts.displayBold,
    fontSize: typography.callout},
});
