/**
 * Activity Progress — a therapist-friendly view of learning over time.
 *
 * Layered "simple first, detail on demand": the overview shows practice
 * consistency, time practised, an 8-week practice strip, and tappable
 * per-activity cards; run-level detail lives one tap deeper on
 * `progress-detail`. A calm plain-text summary can be shared with a
 * therapist via the system share sheet — never scores, ranks, streaks,
 * or pressure (Rule 30, locked tone).
 *
 * Data: one record per completed difficulty run, from
 * `src/features/activities/progress-store.ts`. All aggregation lives in
 * `src/features/activities/progress-selectors.ts` (pure + unit-tested).
 */

import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import {
  AccessibilityInfo,
  Animated,
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
import { Href, Stack, useRouter } from 'expo-router';
import { animation, radii, spacing, typography } from '../../src/theme/tokens';
import { fonts } from '../../src/theme/fonts';
import { useTheme } from '../../src/theme/useTheme';
import { usePullRefresh } from '../../src/hooks/usePullRefresh';
import { useReduceMotion } from '../../src/hooks/useReduceMotion';
import { useReduceSensoryLoad } from '../../src/hooks/useReduceSensoryLoad';
import { hapticSelection } from '../../src/utils/haptics';
import { useActivitySessions } from '../../src/features/activities/progress-store';
import { ACTIVITY_META, activityTitles } from '../../src/features/activities/activity-meta';
import {
  buildTherapistSummary,
  difficultyLabel,
  formatDuration,
  practiceWindows,
  relativeDay,
  summariseActivities,
  weeklyBuckets,
} from '../../src/features/activities/progress-selectors';

// ─── Entrance wrapper ───────────────────────────────────────────────────────
// Gentle staggered fade (+ small rise when motion is allowed). Under Reduce
// Motion the rise is dropped; under Reduce Sensory Load the stagger is
// dropped too so everything appears together, calmly.

function EnterCard({
  index,
  reduceMotion,
  reduceSensory,
  children,
}: {
  index: number;
  reduceMotion: boolean;
  reduceSensory: boolean;
  children: React.ReactNode;
}) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const delay = reduceSensory ? 0 : index * (reduceMotion ? animation.stagRowRM : animation.stagRow);
    Animated.sequence([
      Animated.delay(delay),
      Animated.timing(progress, {
        toValue: 1,
        duration: reduceMotion ? animation.durReduced : 260,
        useNativeDriver: true,
      }),
    ]).start();
  }, [index, progress, reduceMotion, reduceSensory]);

  return (
    <Animated.View
      style={{
        opacity: progress,
        transform: [{
          translateY: reduceMotion
            ? 0
            : progress.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }),
        }],
      }}
    >
      {children}
    </Animated.View>
  );
}

// ─── Weekly practice strip ──────────────────────────────────────────────────
// Eight slim bars drawn with plain Views (no chart lib). Heights are static
// (no grow animation) so the strip is inherently Reduce-Motion safe; the
// surrounding card still gets the shared entrance fade. Not colour-only:
// bars carry a caption, and the whole strip has a spoken summary.

const STRIP_MAX_HEIGHT = 56;
const STRIP_MIN_HEIGHT = 4;

function WeeklyStrip({ counts }: { counts: number[] }) {
  const t = useTheme();
  const max = Math.max(1, ...counts);
  const total = counts.reduce((a, b) => a + b, 0);
  const busiest = Math.max(...counts);
  const busiestIdx = counts.lastIndexOf(busiest);
  const weeksAgo = counts.length - 1 - busiestIdx;
  const caption =
    total === 0
      ? 'No runs in the last 8 weeks.'
      : busiest === 0
        ? ''
        : `Busiest: ${weeksAgo === 0 ? 'this week' : weeksAgo === 1 ? 'last week' : `${weeksAgo} weeks ago`}.`;

  return (
    <View
      accessible
      accessibilityLabel={
        `Practice over the last 8 weeks: ${total} run${total === 1 ? '' : 's'} in total. ${caption}`
      }
    >
      <View style={styles.stripRow}>
        {counts.map((c, i) => (
          <View key={i} style={styles.stripBarSlot}>
            <View
              style={[
                styles.stripBar,
                {
                  height: STRIP_MIN_HEIGHT + (STRIP_MAX_HEIGHT - STRIP_MIN_HEIGHT) * (c / max),
                  backgroundColor: c > 0 ? t.colors.primary : t.colors.selectionBg,
                },
              ]}
            />
          </View>
        ))}
      </View>
      <View style={styles.stripLabels}>
        <Text style={[styles.stripLabel, { color: t.colors.textTertiary }]}>8 weeks ago</Text>
        <Text style={[styles.stripLabel, { color: t.colors.textTertiary }]}>Now</Text>
      </View>
      {caption !== '' ? (
        <Text style={[styles.stripCaption, { color: t.colors.textMuted }]}>{caption}</Text>
      ) : null}
    </View>
  );
}

// ─── Screen ────────────────────────────────────────────────────────────────

export default function ActivityProgressScreen() {
  const t = useTheme();
  const router = useRouter();
  const sessions = useActivitySessions();
  const { refreshing, onRefresh } = usePullRefresh();
  const reduceMotion = useReduceMotion();
  const reduceSensory = useReduceSensoryLoad();

  const summaries = useMemo(() => summariseActivities(sessions), [sessions]);
  const windows = useMemo(() => practiceWindows(sessions), [sessions]);
  const weekCounts = useMemo(() => weeklyBuckets(sessions, 8).map(b => b.count), [sessions]);

  const consistencyLine =
    windows.last7 === 0
      ? 'No sessions in the last 7 days.'
      : `${windows.last7} session${windows.last7 === 1 ? '' : 's'} in the last 7 days` +
        (windows.prev7 > 0 && windows.last7 >= windows.prev7
          ? ' — practice is staying consistent.'
          : '.');

  const handleShareSummary = useCallback(async () => {
    if (!reduceSensory) hapticSelection();
    const message = buildTherapistSummary(sessions, { titles: activityTitles() });
    try {
      await Share.share({ message });
    } catch {
      // Dismissed or unavailable — calmly do nothing.
    }
  }, [reduceSensory, sessions]);

  const openDetail = useCallback((activityId: string) => {
    if (!reduceSensory) hapticSelection();
    router.push(`/activities/progress-detail?activityId=${activityId}` as Href);
    const title = ACTIVITY_META[activityId]?.title ?? activityId;
    AccessibilityInfo.announceForAccessibility?.(`${title} progress`);
  }, [reduceSensory, router]);

  let cardIndex = 0;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: t.colors.background }]} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={16}
          style={styles.headerIconBtn}
          accessibilityLabel="Back to Activities"
          accessibilityRole="button"
        >
          <Ionicons name="chevron-back" size={28} color={t.colors.primary} />
        </Pressable>
        <Text style={[styles.title, { color: t.colors.text }]} accessibilityRole="header">
          Progress
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
        <Text style={[styles.lede, { color: t.colors.textMuted }]}>
          A calm picture of practice over time — for you and the people who
          support you. Never a score.
        </Text>

        {sessions.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: t.colors.surface }]}>
            <Ionicons name="leaf-outline" size={44} color={t.colors.textTertiary} />
            <Text style={[styles.emptyTitle, { color: t.colors.text }]}>Nothing here yet</Text>
            <Text style={[styles.emptySub, { color: t.colors.textMuted }]}>
              Finish any activity and it will appear here. There is no hurry.
            </Text>
          </View>
        ) : (
          <>
            {/* Practice summary */}
            <EnterCard index={cardIndex++} reduceMotion={reduceMotion} reduceSensory={reduceSensory}>
              <View style={[styles.summaryCard, { backgroundColor: t.colors.surface }]}>
                <View style={[styles.summaryIcon, { backgroundColor: t.colors.selectionBg }]}>
                  <Ionicons name="calendar-clear-outline" size={22} color={t.colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.summaryHeading, { color: t.colors.text }]}>Practice</Text>
                  <Text style={[styles.summaryLine, { color: t.colors.textMuted }]}>
                    {consistencyLine}
                  </Text>
                  <Text style={[styles.summaryLine, { color: t.colors.textMuted }]}>
                    {windows.total} completed run{windows.total === 1 ? '' : 's'} overall
                    {windows.totalMinutes > 0
                      ? ` — about ${formatDuration(windows.totalMinutes * 60000)} practised.`
                      : '.'}
                  </Text>
                </View>
              </View>
            </EnterCard>

            {/* Weekly practice strip */}
            <EnterCard index={cardIndex++} reduceMotion={reduceMotion} reduceSensory={reduceSensory}>
              <View style={[styles.stripCard, { backgroundColor: t.colors.surface }]}>
                <Text style={[styles.summaryHeading, { color: t.colors.text }]}>Recent weeks</Text>
                <WeeklyStrip counts={weekCounts} />
              </View>
            </EnterCard>

            {/* Per-activity cards — tap for run-level detail */}
            <Text style={[styles.sectionTitle, { color: t.colors.text }]}>By activity</Text>
            <View style={styles.list}>
              {summaries.map(sum => {
                const meta = ACTIVITY_META[sum.activityId] ?? {
                  title: sum.activityId,
                  accent: t.colors.primary,
                  icon: 'sparkles-outline' as const,
                };
                // At most ONE positive trend line — retries first, then
                // difficulty progression. Say nothing when unclear.
                const trendLine =
                  sum.retryTrend === 'steadier'
                    ? 'Fewer retries in recent runs — answers are getting steadier.'
                    : sum.advancedDifficulty
                      ? `Now practising ${difficultyLabel(sum.highestDifficulty)}.`
                      : null;
                return (
                  <EnterCard
                    key={sum.activityId}
                    index={cardIndex++}
                    reduceMotion={reduceMotion}
                    reduceSensory={reduceSensory}
                  >
                    <Pressable
                      onPress={() => openDetail(sum.activityId)}
                      accessibilityRole="button"
                      accessibilityLabel={
                        `${meta.title}. ${sum.runCount} completed run${sum.runCount === 1 ? '' : 's'}. ` +
                        `Last practised ${relativeDay(sum.lastAt)}.`
                      }
                      accessibilityHint="Shows recent runs for this activity"
                      style={({ pressed }) => [
                        styles.activityCard,
                        {
                          backgroundColor: t.colors.surface,
                          borderLeftColor: meta.accent,
                          opacity: pressed ? 0.85 : 1,
                        },
                      ]}
                    >
                      <View style={styles.activityHead}>
                        <View style={[styles.activityIcon, { backgroundColor: `${meta.accent}1F` }]}>
                          <Ionicons name={meta.icon} size={22} color={meta.accent} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.activityName, { color: t.colors.text }]}>
                            {meta.title}
                          </Text>
                          <Text style={[styles.activityMeta, { color: t.colors.textMuted }]}>
                            {sum.runCount} run{sum.runCount === 1 ? '' : 's'} · last {relativeDay(sum.lastAt).toLowerCase()}
                          </Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color={t.colors.textTertiary} />
                      </View>

                      {/* Difficulty coverage — label + shape, not colour alone */}
                      <View style={styles.chipRow}>
                        {sum.difficulties.map(d => (
                          <View key={d} style={[styles.chip, { backgroundColor: t.colors.selectionBg }]}>
                            <Ionicons name="checkmark" size={12} color={t.colors.primaryDark} />
                            <Text style={[styles.chipText, { color: t.colors.primaryDark }]}>
                              {difficultyLabel(d)}
                            </Text>
                          </View>
                        ))}
                      </View>

                      {trendLine ? (
                        <View style={styles.trendRow}>
                          <Ionicons name="trending-up-outline" size={16} color={t.colors.success} />
                          <Text style={[styles.trendText, { color: t.colors.textMuted }]}>
                            {trendLine}
                          </Text>
                        </View>
                      ) : null}
                    </Pressable>
                  </EnterCard>
                );
              })}
            </View>

            {/* Therapist export — one clear action (Rule 7/29) */}
            <EnterCard index={cardIndex++} reduceMotion={reduceMotion} reduceSensory={reduceSensory}>
              <Pressable
                onPress={handleShareSummary}
                accessibilityRole="button"
                accessibilityLabel="Share a summary"
                accessibilityHint="Opens the share sheet with a plain-text practice summary"
                style={({ pressed }) => [
                  styles.shareRow,
                  {
                    backgroundColor: t.colors.surface,
                    opacity: pressed ? 0.85 : 1,
                  },
                ]}
              >
                <View style={[styles.summaryIcon, { backgroundColor: t.colors.selectionBg }]}>
                  <Ionicons name="share-outline" size={22} color={t.colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.shareTitle, { color: t.colors.text }]}>Share a summary</Text>
                  <Text style={[styles.shareSub, { color: t.colors.textMuted }]}>
                    A plain-text picture of practice, ready for a therapist.
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={t.colors.textTertiary} />
              </Pressable>
            </EnterCard>

            <Text style={[styles.footnote, { color: t.colors.textTertiary }]}>
              A run is one full difficulty completed, start to finish. Retries are
              part of learning — they are counted only to show growing independence,
              never as a penalty.
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
  lede: {
    fontFamily: fonts.body,
    fontSize: typography.callout,
    lineHeight: 21},

  // Summary
  summaryCard: {
    flexDirection: 'row',
    gap: spacing.md,
    borderRadius: radii.card,
    padding: spacing.lg},
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

  // Weekly strip
  stripCard: {
    borderRadius: radii.card,
    padding: spacing.lg,
    gap: spacing.md},
  stripRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
    height: STRIP_MAX_HEIGHT},
  stripBarSlot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end'},
  stripBar: {
    width: '100%',
    maxWidth: 26,
    borderRadius: 4},
  stripLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.xs},
  stripLabel: {
    fontFamily: fonts.body,
    fontSize: typography.caption},
  stripCaption: {
    fontFamily: fonts.body,
    fontSize: typography.caption,
    marginTop: spacing.xs},

  sectionTitle: {
    fontFamily: fonts.displayHeavy,
    fontSize: typography.subheading,
    letterSpacing: typography.trackSubhead},
  list: { gap: spacing.md },

  // Activity cards
  activityCard: {
    borderRadius: radii.card,
    borderLeftWidth: 5,
    padding: spacing.lg,
    gap: spacing.md},
  activityHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md},
  activityIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center'},
  activityName: {
    fontFamily: fonts.displayHeavy,
    fontSize: typography.subheading,
    letterSpacing: typography.trackSubhead},
  activityMeta: {
    fontFamily: fonts.body,
    fontSize: typography.caption,
    marginTop: 2},
  chipRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    flexWrap: 'wrap'},
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
  trendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6},
  trendText: {
    fontFamily: fonts.body,
    fontSize: typography.caption,
    flex: 1,
    lineHeight: 18},

  // Share row
  shareRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderRadius: radii.card,
    padding: spacing.lg,
    minHeight: 44},
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

  // Empty state
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
});
