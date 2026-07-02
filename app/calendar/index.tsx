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
  ActionSheetIOS,
  Alert,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Href, Stack, useRouter } from 'expo-router';
import { Card } from '../../src/components/native/Card';
import { radii, spacing, typography } from '../../src/theme/tokens';
import { fonts } from '../../src/theme/fonts';
import { hapticSelection, hapticSuccess, hapticWarning } from '../../src/utils/haptics';
import {
  Plan,
  formatDateKey,
  movePlan,
  parseDateKey,
  removePlan,
  toggleFavoritePlan,
  updatePlan,
  usePlanColorsByDate,
  usePlanCountsByDate,
  usePlansForDate,
} from '../../src/features/calendar/store';
import { useTheme } from '../../src/theme/useTheme';
import { usePullRefresh } from '../../src/hooks/usePullRefresh';

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
  colorsByDate,
  onSelect,
  onShiftMonth,
}: {
  anchor: Date;
  selectedKey: string;
  countsByDate: Map<string, number>;
  colorsByDate: Map<string, string[]>;
  onSelect: (date: Date) => void;
  onShiftMonth: (delta: number) => void;
}) {
  const t = useTheme();
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
          <Ionicons name="chevron-back" size={22} color={t.colors.primary} />
        </Pressable>
        <Text style={[styles.monthLabel, { color: t.colors.text }]}>
          {MONTHS_LONG[monthIdx]} {anchor.getFullYear()}
        </Text>
        <Pressable
          onPress={() => onShiftMonth(1)}
          hitSlop={12}
          accessibilityLabel="Next month"
          accessibilityRole="button"
          style={styles.monthNavBtn}
        >
          <Ionicons name="chevron-forward" size={22} color={t.colors.primary} />
        </Pressable>
      </View>

      <View style={styles.weekdayRow}>
        {WEEKDAYS.map((d, i) => (
          <Text key={`${d}-${i}`} style={[styles.weekdayLabel, { color: t.colors.textMuted }]}>{d}</Text>
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
              const planCount = countsByDate.get(key) ?? 0;
              // Up to three coloured marks (one per plan, plan's own colour)
              // so a day with plans reads at a glance. 4+ plans keep three
              // marks — the count lives in the accessibility label.
              const planColors = (colorsByDate.get(key) ?? []).slice(0, 3);
              return (
                <Pressable
                  key={key}
                  onPress={() => {
                    hapticSelection();
                    onSelect(d);
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={
                    `${MONTHS_LONG[d.getMonth()]} ${d.getDate()}` +
                    (planCount > 0 ? `. ${planCount} plan${planCount === 1 ? '' : 's'}` : '')
                  }
                  accessibilityState={{ selected: isSelected }}
                  style={styles.cellHit}
                >
                  <View
                    style={[
                      styles.cellInner,
                      isSelected && { backgroundColor: t.colors.primary },
                      isToday && !isSelected && [styles.cellToday, { borderColor: t.colors.primary }],
                    ]}
                  >
                    <Text
                      style={[
                        styles.cellText,
                        { color: t.colors.text },
                        !inMonth && { color: t.colors.textTertiary },
                        isToday && !isSelected && [styles.cellTextToday, { color: t.colors.primary }],
                        isSelected && styles.cellTextSelected,
                      ]}
                    >
                      {d.getDate()}
                    </Text>
                  </View>
                  <View style={styles.cellMarks}>
                    {planCount === 0 ? (
                      <View style={styles.cellMarkSpacer} />
                    ) : (
                      planColors.map((c, i) => (
                        <View
                          key={i}
                          style={[styles.cellMark, { backgroundColor: c }]}
                        />
                      ))
                    )}
                  </View>
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

function PlanRowCard({
  plan,
  onOpen,
  onMenu,
}: {
  plan: Plan;
  onOpen: () => void;
  onMenu: () => void;
}) {
  const t = useTheme();
  const total = plan.steps.length;
  const done = plan.steps.filter(s => s.done).length;
  const pct = total ? done / total : 0;
  return (
    <Pressable
      onPress={onOpen}
      onLongPress={onMenu}
      delayLongPress={350}
      accessibilityRole="button"
      accessibilityLabel={
        `${plan.name}${plan.favorite ? ', favourite' : ''}. ${done} of ${total} steps done.`
      }
      accessibilityHint="Opens the day timeline. Long press for plan options."
      style={({ pressed }) => [
        styles.planCard,
        // Left accent stripe ties the card to the plan's colour identity —
        // the same colour used by this plan's mark on the month grid.
        { backgroundColor: t.colors.surface, borderLeftWidth: 5, borderLeftColor: plan.symbolColor },
        pressed && { opacity: 0.94 },
      ]}
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
          <View style={styles.planNameRow}>
            <Text style={[styles.planName, { color: t.colors.text }]} numberOfLines={1}>
              {plan.name}
            </Text>
            {plan.favorite ? (
              <Ionicons
                name="heart"
                size={16}
                color={t.colors.danger}
                accessibilityElementsHidden
                importantForAccessibility="no"
              />
            ) : null}
          </View>
          <Text style={[styles.planMeta, { color: t.colors.textMuted }]}>
            {total} step{total === 1 ? '' : 's'}
          </Text>
        </View>
        <Pressable
          onPress={onMenu}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={`Options for ${plan.name}`}
          style={({ pressed }) => [styles.planMenuBtn, pressed && { opacity: 0.6 }]}
        >
          <Ionicons name="ellipsis-horizontal" size={22} color={t.colors.textTertiary} />
        </Pressable>
      </View>
      <View style={[styles.progressTrack, { backgroundColor: t.colors.progressTrack }]}>
        <View
          style={[
            styles.progressFill,
            { width: `${Math.round(pct * 100)}%`, backgroundColor: plan.symbolColor },
          ]}
        />
      </View>
      <Text style={[styles.progressText, { color: t.colors.textMuted }]}>{done}/{total} done</Text>
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
  const t = useTheme();
  return (
    <View style={[styles.emptyCard, { backgroundColor: t.colors.surface }]}>
      <Text style={[styles.emptyHeading, { color: t.colors.text }]}>
        {isToday ? 'Create a Plan' : 'No plans for this day'}
      </Text>
      <Pressable
        onPress={onCreate}
        accessibilityRole="button"
        accessibilityLabel="Create a new plan"
        style={({ pressed }) => [
          styles.createBubble,
          { backgroundColor: t.colors.primary },
          pressed && { backgroundColor: t.colors.primaryPressed },
        ]}
      >
        <Ionicons name="add" size={36} color={t.colors.surface} />
      </Pressable>
      <Text style={[styles.emptySub, { color: t.colors.textMuted }]}>
        Plan steps with pictures and timers — start with a name, then add steps in order.
      </Text>
    </View>
  );
}

// ─── Screen ────────────────────────────────────────────────────────────────

export default function CalendarScreen() {
  const t = useTheme();
  const router = useRouter();
  const [anchor, setAnchor] = useState<Date>(() => startOfMonth(new Date()));
  const [selectedKey, setSelectedKey] = useState<string>(todayKey);
  const countsByDate = usePlanCountsByDate();
  const colorsByDate = usePlanColorsByDate();
  const plansForSelected = usePlansForDate(selectedKey);
  const isSelectedToday = selectedKey === todayKey;
  const selectedDate = useMemo(() => parseDateKey(selectedKey), [selectedKey]);
  const { refreshing, onRefresh } = usePullRefresh();

  const openDay = (key: string) => {
    hapticSelection();
    router.push({ pathname: '/calendar/day/[date]', params: { date: key } } as Href);
  };

  const openCreate = () => {
    hapticSelection();
    router.push({ pathname: '/calendar/new-plan', params: { date: selectedKey } } as Href);
  };

  const renamePlan = (plan: Plan) => {
    if (Platform.OS === 'ios' && typeof Alert.prompt === 'function') {
      Alert.prompt(
        'Rename Plan',
        'Give this plan a new name.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Save',
            onPress: (text?: string) => {
              const trimmed = (text ?? '').trim();
              if (!trimmed) return;
              updatePlan(plan.id, { name: trimmed });
              hapticSuccess();
            },
          },
        ],
        'plain-text',
        plan.name,
      );
    }
  };

  const confirmRemove = (plan: Plan) => {
    hapticWarning();
    Alert.alert(
      'Remove Plan?',
      `"${plan.name}" and its ${plan.steps.length} step${plan.steps.length === 1 ? '' : 's'} will be removed from this day.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            removePlan(plan.id);
            hapticSuccess();
          },
        },
      ],
    );
  };

  // Item options — long press on the card or tap the ⋯ button. Every action
  // here is reachable without drag gestures (motor access), and Remove is
  // separated + confirmed (principle 12).
  const openPlanMenu = (plan: Plan, index: number, count: number) => {
    hapticSelection();
    const entries: { label: string; act: () => void; destructive?: boolean }[] = [
      {
        label: plan.favorite ? 'Remove from Favourites' : 'Add to Favourites',
        act: () => { toggleFavoritePlan(plan.id); hapticSuccess(); },
      },
      { label: 'Rename', act: () => renamePlan(plan) },
    ];
    if (index > 0) entries.push({ label: 'Move Up', act: () => { movePlan(plan.id, -1); hapticSelection(); } });
    if (index < count - 1) entries.push({ label: 'Move Down', act: () => { movePlan(plan.id, 1); hapticSelection(); } });
    entries.push({ label: 'Remove Plan', act: () => confirmRemove(plan), destructive: true });

    const options = [...entries.map(e => e.label), 'Cancel'];
    const cancelButtonIndex = options.length - 1;
    const destructiveButtonIndex = entries.findIndex(e => e.destructive);
    const handle = (i: number) => {
      if (i === cancelButtonIndex) return;
      entries[i]?.act();
    };
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { title: plan.name, options, cancelButtonIndex, destructiveButtonIndex },
        handle,
      );
    } else {
      Alert.alert(plan.name, undefined, [
        ...entries.map((e, i) => ({
          text: e.label,
          style: (e.destructive ? 'destructive' : 'default') as 'destructive' | 'default',
          onPress: () => handle(i),
        })),
        { text: 'Cancel', style: 'cancel' },
      ]);
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: t.colors.background }]} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={16}
          style={styles.headerIconBtn}
          accessibilityLabel="Back to Tools"
          accessibilityRole="button"
        >
          <Ionicons name="chevron-back" size={28} color={t.colors.primary} />
        </Pressable>
        <Text style={[styles.title, { color: t.colors.text }]} accessibilityRole="header">Today</Text>
        <Pressable
          onPress={openCreate}
          accessibilityRole="button"
          accessibilityLabel="Create a new plan"
          style={({ pressed }) => [
            styles.newPlanPill,
            { backgroundColor: t.colors.primary },
            pressed && { backgroundColor: t.colors.primaryPressed },
          ]}
        >
          <Ionicons name="add" size={18} color={t.colors.surface} />
          <Text style={[styles.newPlanText, { color: t.colors.surface }]}>New Plan</Text>
        </Pressable>
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
        <MonthGrid
          anchor={anchor}
          selectedKey={selectedKey}
          countsByDate={countsByDate}
          colorsByDate={colorsByDate}
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

        <Text style={[styles.sectionTitle, { color: t.colors.text }]}>
          {isSelectedToday
            ? "Today's Plan"
            : `${MONTHS_LONG[selectedDate.getMonth()]} ${selectedDate.getDate()} Plan`}
        </Text>

        {plansForSelected.length === 0 ? (
          <CreatePlanCard onCreate={openCreate} isToday={isSelectedToday} />
        ) : (
          <View style={styles.plansList}>
            {plansForSelected.map((p, i) => (
              <PlanRowCard
                key={p.id}
                plan={p}
                onOpen={() => openDay(selectedKey)}
                onMenu={() => openPlanMenu(p, i, plansForSelected.length)}
              />
            ))}
            <Pressable
              onPress={openCreate}
              accessibilityRole="button"
              accessibilityLabel="Add another plan to this day"
              style={({ pressed }) => [
                styles.addMore,
                { backgroundColor: t.colors.selectionBg },
                pressed && { opacity: 0.85 },
              ]}
            >
              <Ionicons name="add" size={20} color={t.colors.primary} />
              <Text style={[styles.addMoreText, { color: t.colors.primary }]}>Add another plan</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1},

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    gap: spacing.md},
  headerIconBtn: { minWidth: 44, width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  title: {
    fontFamily: fonts.displayBlack,
    flex: 1,
    fontSize: typography.title,

    letterSpacing: typography.trackTitle},
  newPlanPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,

    paddingHorizontal: spacing.lg,
    paddingVertical: 9,
    borderRadius: radii.pill},
  newPlanText: {
    fontFamily: fonts.displayHeavy,

    fontSize: typography.callout},

  scroll: {
    padding: spacing.lg,
    paddingBottom: 60,
    gap: spacing.lg},

  // Month grid
  gridCard: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.md},
  monthHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm},
  monthNavBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center'},
  monthLabel: {
    fontFamily: fonts.displayHeavy,
    fontSize: typography.subheading,

    letterSpacing: typography.trackSubhead},
  weekdayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
    marginBottom: spacing.xs},
  weekdayLabel: {
    fontFamily: fonts.displayBold,
    flex: 1,
    textAlign: 'center',
    fontSize: typography.caption,

    letterSpacing: 0.6},
  gridRows: { gap: 2 },
  gridRow: { flexDirection: 'row' },
  cellHit: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 4,
    gap: 4},
  cellInner: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center'},
  cellToday: {
    borderWidth: 1.5},
  cellText: {
    fontFamily: fonts.displayBold,
    fontSize: typography.callout},
  cellTextToday: { fontFamily: fonts.displayBlack},
  cellTextSelected: { fontFamily: fonts.displayBlack, color: '#FFFFFF' },
  cellMarks: {
    flexDirection: 'row',
    gap: 3,
    height: 5,
    alignItems: 'center'},
  cellMark: {
    width: 5,
    height: 5,
    borderRadius: 2.5},
  cellMarkSpacer: { width: 5, height: 5 },

  // Day plans
  sectionTitle: {
    fontFamily: fonts.displayHeavy,
    fontSize: typography.subheading,

    letterSpacing: typography.trackSubhead},
  plansList: {
    gap: spacing.md},
  planCard: {

    borderRadius: radii.card,
    padding: spacing.lg,
    gap: spacing.md},
  planHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md},
  planIconChip: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center'},
  planNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm},
  planMenuBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center'},
  planName: {
    fontFamily: fonts.displayHeavy,
    fontSize: typography.subheading,
    flexShrink: 1,
    letterSpacing: typography.trackSubhead},
  planMeta: {
    fontFamily: fonts.body,
    fontSize: typography.caption,

    marginTop: 2},
  progressTrack: {
    height: 8,
    borderRadius: 4,

    overflow: 'hidden'},
  progressFill: { height: '100%', borderRadius: 4 },
  progressText: {
    fontFamily: fonts.displayBold,
    alignSelf: 'flex-end',
    fontSize: typography.caption},
  addMore: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minHeight: 48,
    paddingVertical: 14,
    borderRadius: radii.pill},
  addMoreText: {
    fontFamily: fonts.displayBold,
    fontSize: typography.callout},

  // Empty / create card
  emptyCard: {

    borderRadius: radii.card,
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    gap: spacing.md},
  emptyHeading: {
    fontFamily: fonts.displayBlack,
    fontSize: typography.heading,

    letterSpacing: typography.trackHeading},
  createBubble: {
    width: 80,
    height: 80,
    borderRadius: 40,

    alignItems: 'center',
    justifyContent: 'center'},
  emptySub: {
    fontFamily: fonts.body,
    fontSize: typography.callout,

    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: spacing.lg},
});
