/**
 * Activity Progress — a therapist-friendly view of learning over time.
 *
 * Purpose: show whether practice is happening, whether it is consistent,
 * and whether the user is needing fewer retries — never scores, ranks,
 * streaks, or pressure. Copy stays calm and non-judgmental (Rule 30,
 * Future Implementation Plan support-profile tone).
 *
 * Data: one record per completed difficulty run, from
 * `src/features/activities/progress-store.ts`.
 */

import React, { useMemo } from 'react';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import { radii, spacing, typography } from '../../src/theme/tokens';
import { fonts } from '../../src/theme/fonts';
import { useTheme } from '../../src/theme/useTheme';
import { usePullRefresh } from '../../src/hooks/usePullRefresh';
import {
  ActivitySession,
  useActivitySessions,
} from '../../src/features/activities/progress-store';

// Mirrors the Activities tab list — title + accent per game.
const ACTIVITY_META: Record<string, { title: string; accent: string; icon: React.ComponentProps<typeof Ionicons>['name'] }> = {
  'shape-match':  { title: 'Shape Match',  accent: '#1B8A4A', icon: 'shapes-outline' },
  'colour-pop':   { title: 'Colour Pop',   accent: '#7C3AED', icon: 'color-palette-outline' },
  'memory-match': { title: 'Memory Match', accent: '#0A6ED1', icon: 'albums-outline' },
};

const DAY_MS = 24 * 60 * 60 * 1000;

function relativeDay(ts: number): string {
  const days = Math.floor((Date.now() - ts) / DAY_MS);
  if (days <= 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  const weeks = Math.floor(days / 7);
  return weeks === 1 ? '1 week ago' : `${weeks} weeks ago`;
}

function difficultyLabel(d: ActivitySession['difficulty']): string {
  return d.charAt(0).toUpperCase() + d.slice(1);
}

interface ActivitySummary {
  activityId: string;
  sessions: ActivitySession[];
  lastAt: number;
  difficulties: Set<ActivitySession['difficulty']>;
  /** Retries per level, recent half vs earlier half. Null when too few runs. */
  independenceTrend: 'steadier' | null;
}

function summarise(sessions: ActivitySession[]): ActivitySummary[] {
  const byActivity = new Map<string, ActivitySession[]>();
  sessions.forEach(s => {
    const list = byActivity.get(s.activityId) ?? [];
    list.push(s);
    byActivity.set(s.activityId, list);
  });
  return [...byActivity.entries()]
    .map(([activityId, list]) => {
      const sorted = [...list].sort((a, b) => a.completedAt - b.completedAt);
      let independenceTrend: ActivitySummary['independenceTrend'] = null;
      if (sorted.length >= 4) {
        const mid = Math.floor(sorted.length / 2);
        const rate = (xs: ActivitySession[]) =>
          xs.reduce((sum, s) => sum + s.incorrectCount / Math.max(1, s.totalLevels), 0) / xs.length;
        const early = rate(sorted.slice(0, mid));
        const recent = rate(sorted.slice(mid));
        // Only surface a clearly positive signal; say nothing otherwise.
        if (recent < early * 0.75) independenceTrend = 'steadier';
      }
      return {
        activityId,
        sessions: sorted,
        lastAt: sorted[sorted.length - 1]!.completedAt,
        difficulties: new Set(sorted.map(s => s.difficulty)),
        independenceTrend,
      };
    })
    .sort((a, b) => b.lastAt - a.lastAt);
}

// ─── Screen ────────────────────────────────────────────────────────────────

export default function ActivityProgressScreen() {
  const t = useTheme();
  const router = useRouter();
  const sessions = useActivitySessions();
  const { refreshing, onRefresh } = usePullRefresh();

  const summaries = useMemo(() => summarise(sessions), [sessions]);
  const last7 = sessions.filter(s => Date.now() - s.completedAt < 7 * DAY_MS).length;
  const prev7 = sessions.filter(s => {
    const age = Date.now() - s.completedAt;
    return age >= 7 * DAY_MS && age < 14 * DAY_MS;
  }).length;

  const consistencyLine =
    last7 === 0
      ? 'No sessions in the last 7 days.'
      : `${last7} session${last7 === 1 ? '' : 's'} in the last 7 days` +
        (prev7 > 0 && last7 >= prev7 ? ' — practice is staying consistent.' : '.');

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
          Completed activity runs, for you and the people who support you.
          This is a picture of practice over time — not a score.
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
            {/* Consistency summary */}
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
                  {sessions.length} completed run{sessions.length === 1 ? '' : 's'} overall.
                </Text>
              </View>
            </View>

            {/* Per-activity cards */}
            <Text style={[styles.sectionTitle, { color: t.colors.text }]}>By activity</Text>
            <View style={styles.list}>
              {summaries.map(sum => {
                const meta = ACTIVITY_META[sum.activityId] ?? {
                  title: sum.activityId,
                  accent: t.colors.primary,
                  icon: 'sparkles-outline' as const,
                };
                const diffs = (['easy', 'medium', 'hard'] as const).filter(d =>
                  sum.difficulties.has(d),
                );
                return (
                  <View
                    key={sum.activityId}
                    style={[
                      styles.activityCard,
                      { backgroundColor: t.colors.surface, borderLeftColor: meta.accent },
                    ]}
                    accessibilityLabel={
                      `${meta.title}. ${sum.sessions.length} completed run${sum.sessions.length === 1 ? '' : 's'}. ` +
                      `Last practised ${relativeDay(sum.lastAt)}.`
                    }
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
                          {sum.sessions.length} run{sum.sessions.length === 1 ? '' : 's'} · last {relativeDay(sum.lastAt).toLowerCase()}
                        </Text>
                      </View>
                    </View>

                    {/* Difficulty coverage — label + shape, not colour alone */}
                    <View style={styles.chipRow}>
                      {diffs.map(d => (
                        <View key={d} style={[styles.chip, { backgroundColor: t.colors.selectionBg }]}>
                          <Ionicons name="checkmark" size={12} color={t.colors.primaryDark} />
                          <Text style={[styles.chipText, { color: t.colors.primaryDark }]}>
                            {difficultyLabel(d)}
                          </Text>
                        </View>
                      ))}
                    </View>

                    {sum.independenceTrend === 'steadier' ? (
                      <View style={styles.trendRow}>
                        <Ionicons name="trending-up-outline" size={16} color={t.colors.success} />
                        <Text style={[styles.trendText, { color: t.colors.textMuted }]}>
                          Fewer retries in recent runs — answers are getting steadier.
                        </Text>
                      </View>
                    ) : null}
                  </View>
                );
              })}
            </View>

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
