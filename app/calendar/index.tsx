/**
 * Calendar — month grid + Today's Plan.
 *
 * Layout (top to bottom):
 *   • Header: back chevron, "Today" title, "+ New Plan" pill.
 *   • Month strip: Month YYYY (tappable for year picker — TODO), arrows.
 *   • Monthly grid: 7 cols, 6 rows. Today highlighted; selected outlined.
 *     Days from adjacent months render muted. A dot under a date means
 *     plans exist on that date.
 *   • Today's Plan card: tap → opens the day timeline for that date.
 *
 * Tapping a date in the grid selects it; the lower card always reflects
 * the selected date (defaults to today). The "+ New Plan" pill opens
 * the Plan creator pre-filled with the selected date.
 */

import React, { useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Href, Stack, useRouter } from 'expo-router';
import { Card } from '../../src/components/native/Card';
import { colors, radii, spacing, typography } from '../../src/theme/tokens';
import { fonts } from '../../src/theme/fonts';
import { hapticSelection } from '../../src/utils/haptics';
import {
  Plan,
  formatDateKey,
  parseDateKey,
  usePlanCountsByDate,
  usePlansForDate,
} from '../../src/features/calendar/store';

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'] as const;
const MONTHS_LONG = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
] as const;

const todayKey = formatDateKey(new Date());

// ─── Calendar maths ─────────────────────────────────────────────────────────

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function addMonths(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth() + n, 1);
}

function buildMonthGrid(anchor: Date): Date[] {
  // 6 rows × 7 cols = 42 cells starting on Sunday.
  const start = startOfMonth(anchor);
  const startDay = start.getDay(); // 0 = Sun
  const gridStart = new Date(start);
  gridStart.setDate(start.getDate() - startDay);
  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(gridStart);
    d.setDate(gridStart.getDate() + i);
    return d;
  });
}

// ─── Monthly grid ──────────────────────────────────────────────────────────

function MonthGrid({
  anchor,
  selectedKey,
  countsByDate,
  onSelect,
  onShiftMonth,
}: {
  anchor: Date;
  selectedKey: string;
  countsByDate: Map<string, number>;
  onSelect: (date: Date) => void;
  onShiftMonth: (delta: number) => void;
}) {
  const cells = useMemo(() => buildMonthGrid(anchor), [anchor]);
  const monthIdx = anchor.getMonth();

  return (
    <Card style={styles.gridCard}>
      <View style={styles.monthHead}>
        <Pressable
          onPress={() => onShiftMonth(-1)}
          hitSlop={12}
          accessibilityLabel="Previous month"
          accessibilityRole="button"
          style={styles.monthNavBtn}
        >
          <Ionicons name="chevron-back" size={22} color={colors.primary} />
        </Pressable>
        <Text style={styles.monthLabel}>
          {MONTHS_LONG[monthIdx]} {anchor.getFullYear()}
        </Text>
        <Pressable
          onPress={() => onShiftMonth(1)}
          hitSlop={12}
          accessibilityLabel="Next month"
          accessibilityRole="button"
          style={styles.monthNavBtn}
        >
          <Ionicons name="chevron-forward" size={22} color={colors.primary} />
        </Pressable>
      </View>

      <View style={styles.weekdayRow}>
        {WEEKDAYS.map((d, i) => (
          <Text key={`${d}-${i}`} style={styles.weekdayLabel}>{d}</Text>
        ))}
      </View>

      <View style={styles.gridRows}>
        {Array.from({ length: 6 }).map((_, row) => (
          <View key={row} style={styles.gridRow}>
            {cells.slice(row * 7, row * 7 + 7).map(d => {
              const key = formatDateKey(d);
              const inMonth = d.getMonth() === monthIdx;
              const isToday = key === todayKey;
              const isSelected = key === selectedKey;
              const hasPlans = (countsByDate.get(key) ?? 0) > 0;
              return (
                <Pressable
                  key={key}
                  onPress={() => {
                    hapticSelection();
                    onSelect(d);
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={`${MONTHS_LONG[d.getMonth()]} ${d.getDate()}`}
                  accessibilityState={{ selected: isSelected }}
                  style={styles.cellHit}
                >
                  <View
                    style={[
                      styles.cellInner,
                      isSelected && styles.cellSelected,
                      isToday && !isSelected && styles.cellToday,
                    ]}
                  >
                    <Text
                      style={[
                        styles.cellText,
                        !inMonth && styles.cellTextMuted,
                        isToday && !isSelected && styles.cellTextToday,
                        isSelected && styles.cellTextSelected,
                      ]}
                    >
                      {d.getDate()}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.cellDot,
                      hasPlans && styles.cellDotActive,
                      hasPlans && isSelected && { backgroundColor: '#FFFFFF' },
                    ]}
                  />
                </Pressable>
              );
            })}
          </View>
        ))}
      </View>
    </Card>
  );
}

// ─── Plan card ─────────────────────────────────────────────────────────────

function PlanRowCard({ plan, onOpen }: { plan: Plan; onOpen: () => void }) {
  const total = plan.steps.length;
  const done = plan.steps.filter(s => s.done).length;
  const pct = total ? done / total : 0;
  return (
    <Pressable
      onPress={onOpen}
      accessibilityRole="button"
      accessibilityLabel={`${plan.name}. ${done} of ${total} steps done.`}
      style={({ pressed }) => [styles.planCard, pressed && { opacity: 0.94 }]}
    >
      <View style={styles.planHead}>
        <View style={[styles.planIconChip, { backgroundColor: hexAlpha(plan.symbolColor, 0.18) }]}>
          <Ionicons
            name={plan.symbol as React.ComponentProps<typeof Ionicons>['name']}
            size={26}
            color={plan.symbolColor}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.planName}>{plan.name}</Text>
          <Text style={styles.planMeta}>
            {total} step{total === 1 ? '' : 's'}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={22} color={colors.textTertiary} />
      </View>
      <View style={styles.progressTrack}>
        <View
          style={[
            styles.progressFill,
            { width: `${Math.round(pct * 100)}%`, backgroundColor: plan.symbolColor },
          ]}
        />
      </View>
      <Text style={styles.progressText}>{done}/{total} done</Text>
    </Pressable>
  );
}

function hexAlpha(hex: string, a: number): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

// ─── Empty plan card ───────────────────────────────────────────────────────

function CreatePlanCard({ onCreate, isToday }: { onCreate: () => void; isToday: boolean }) {
  return (
    <View style={styles.emptyCard}>
      <Text style={styles.emptyHeading}>
        {isToday ? 'Create a Plan' : 'No plans for this day'}
      </Text>
      <Pressable
        onPress={onCreate}
        accessibilityRole="button"
        accessibilityLabel="Create a new plan"
        style={({ pressed }) => [styles.createBubble, pressed && { opacity: 0.85 }]}
      >
        <Ionicons name="add" size={36} color={colors.surface} />
      </Pressable>
      <Text style={styles.emptySub}>
        Plan steps with pictures and timers — start with a name, then add steps in order.
      </Text>
    </View>
  );
}

// ─── Screen ────────────────────────────────────────────────────────────────

export default function CalendarScreen() {
  const router = useRouter();
  const [anchor, setAnchor] = useState<Date>(() => startOfMonth(new Date()));
  const [selectedKey, setSelectedKey] = useState<string>(todayKey);
  const countsByDate = usePlanCountsByDate();
  const plansForSelected = usePlansForDate(selectedKey);
  const isSelectedToday = selectedKey === todayKey;
  const selectedDate = useMemo(() => parseDateKey(selectedKey), [selectedKey]);

  const openDay = (key: string) => {
    hapticSelection();
    router.push({ pathname: '/calendar/day/[date]', params: { date: key } } as Href);
  };

  const openCreate = () => {
    hapticSelection();
    router.push({ pathname: '/calendar/new-plan', params: { date: selectedKey } } as Href);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={16}
          style={styles.headerIconBtn}
          accessibilityLabel="Back to Tools"
          accessibilityRole="button"
        >
          <Ionicons name="chevron-back" size={28} color={colors.primary} />
        </Pressable>
        <Text style={styles.title} accessibilityRole="header">Today</Text>
        <Pressable
          onPress={openCreate}
          accessibilityRole="button"
          accessibilityLabel="Create a new plan"
          style={({ pressed }) => [styles.newPlanPill, pressed && { opacity: 0.85 }]}
        >
          <Ionicons name="add" size={18} color={colors.surface} />
          <Text style={styles.newPlanText}>New Plan</Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        bounces
        alwaysBounceVertical
        overScrollMode="always"
      >
        <MonthGrid
          anchor={anchor}
          selectedKey={selectedKey}
          countsByDate={countsByDate}
          onSelect={(d) => {
            setSelectedKey(formatDateKey(d));
            // If the user taps a date in an adjacent month, jump the
            // grid anchor to that month so the dot lands cleanly.
            const monthDelta = (d.getFullYear() - anchor.getFullYear()) * 12
              + (d.getMonth() - anchor.getMonth());
            if (monthDelta !== 0) setAnchor(startOfMonth(d));
          }}
          onShiftMonth={(delta) => setAnchor(prev => addMonths(prev, delta))}
        />

        <Text style={styles.sectionTitle}>
          {isSelectedToday
            ? "Today's Plan"
            : `${MONTHS_LONG[selectedDate.getMonth()]} ${selectedDate.getDate()} Plan`}
        </Text>

        {plansForSelected.length === 0 ? (
          <CreatePlanCard onCreate={openCreate} isToday={isSelectedToday} />
        ) : (
          <View style={styles.plansList}>
            {plansForSelected.map(p => (
              <PlanRowCard key={p.id} plan={p} onOpen={() => openDay(selectedKey)} />
            ))}
            <Pressable
              onPress={openCreate}
              accessibilityRole="button"
              accessibilityLabel="Add another plan to this day"
              style={({ pressed }) => [styles.addMore, pressed && { opacity: 0.85 }]}
            >
              <Ionicons name="add" size={20} color={colors.primary} />
              <Text style={styles.addMoreText}>Add another plan</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    gap: spacing.md,
  },
  headerIconBtn: { width: 36, height: 44, alignItems: 'center', justifyContent: 'center' },
  title: {
    fontFamily: fonts.displayBlack,
    flex: 1,
    fontSize: typography.title,
    color: colors.text,
    letterSpacing: typography.trackTitle,
  },
  newPlanPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: 9,
    borderRadius: radii.pill,
  },
  newPlanText: {
    fontFamily: fonts.displayHeavy,
    color: colors.surface,
    fontSize: typography.callout,
  },

  scroll: {
    padding: spacing.lg,
    paddingBottom: 60,
    gap: spacing.lg,
  },

  // Month grid
  gridCard: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
  },
  monthHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  monthNavBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthLabel: {
    fontFamily: fonts.displayHeavy,
    fontSize: typography.subheading,
    color: colors.text,
    letterSpacing: typography.trackSubhead,
  },
  weekdayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
    marginBottom: spacing.xs,
  },
  weekdayLabel: {
    fontFamily: fonts.displayBold,
    flex: 1,
    textAlign: 'center',
    fontSize: typography.caption,
    color: colors.textMuted,
    letterSpacing: 0.6,
  },
  gridRows: { gap: 2 },
  gridRow: { flexDirection: 'row' },
  cellHit: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 4,
    gap: 4,
  },
  cellInner: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellSelected: {
    backgroundColor: colors.primary,
  },
  cellToday: {
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  cellText: {
    fontFamily: fonts.displayBold,
    fontSize: typography.callout,
    color: colors.text,
  },
  cellTextMuted: { color: colors.textTertiary },
  cellTextToday: { fontFamily: fonts.displayBlack, color: colors.primary },
  cellTextSelected: { fontFamily: fonts.displayBlack, color: '#FFFFFF' },
  cellDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'transparent',
  },
  cellDotActive: { backgroundColor: colors.primary },

  // Day plans
  sectionTitle: {
    fontFamily: fonts.displayHeavy,
    fontSize: typography.subheading,
    color: colors.text,
    letterSpacing: typography.trackSubhead,
  },
  plansList: {
    gap: spacing.md,
  },
  planCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    padding: spacing.lg,
    gap: spacing.md,
  },
  planHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  planIconChip: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  planName: {
    fontFamily: fonts.displayHeavy,
    fontSize: typography.subheading,
    color: colors.text,
    letterSpacing: typography.trackSubhead,
  },
  planMeta: {
    fontFamily: fonts.body,
    fontSize: typography.caption,
    color: colors.textMuted,
    marginTop: 2,
  },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.progressTrack,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: 4 },
  progressText: {
    fontFamily: fonts.displayBold,
    alignSelf: 'flex-end',
    fontSize: typography.caption,
    color: colors.textMuted,
  },
  addMore: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    borderRadius: radii.pill,
    backgroundColor: '#E6F4FD',
  },
  addMoreText: {
    fontFamily: fonts.displayBold,
    fontSize: typography.callout,
    color: colors.primary,
  },

  // Empty / create card
  emptyCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    gap: spacing.md,
  },
  emptyHeading: {
    fontFamily: fonts.displayBlack,
    fontSize: typography.heading,
    color: colors.text,
    letterSpacing: typography.trackHeading,
  },
  createBubble: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptySub: {
    fontFamily: fonts.body,
    fontSize: typography.callout,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: spacing.lg,
  },
});
