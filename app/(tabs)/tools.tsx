/**
 * Daily Planner — replaces the former Settings tab (which was already iconed
 * with the calendar glyph). Designed around the four pillars the team asked
 * for: visual timers, visual cues, tick boxes, and First/Then structure.
 *
 * Visual language stays consistent with the rest of the app — same Card,
 * tokens, Ionicons, SafeAreaView pattern as activities.tsx so nothing here
 * feels grafted on. Settings is preserved at /settings/index.tsx.
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Href, useRouter } from 'expo-router';
import Svg, { Circle } from 'react-native-svg';
import { Card } from '../../src/components/native/Card';
import { colors, radii, shadows, spacing, typography } from '../../src/theme/tokens';
import { hapticSelection } from '../../src/utils/haptics';

const firstThenRoute = '/first-then' as Href;

// ─── Types & sample data ────────────────────────────────────────────────────
// Local state for now — the data model below is intentionally simple and
// self-contained so it can be lifted into useAppContext later without
// reshaping the UI.

type StepCue = React.ComponentProps<typeof Ionicons>['name'];

interface PlanStep {
  id: string;
  name: string;
  cue: StepCue;      // visual cue
  cueColor: string;
  durationSec: number;
  instructions?: string;
  done: boolean;
}

interface Plan {
  id: string;
  name: string;
  icon: StepCue;
  accent: string;    // colored side bar + icon tint
  accentBg: string;  // pastel chip behind the icon
  startTime: string; // display only — "07:00 AM"
  steps: PlanStep[];
  dateKey: string;   // YYYY-MM-DD
}

const todayKey = formatDateKey(new Date());
const tomorrowKey = formatDateKey(new Date(Date.now() + 86400000));

const SAMPLE_PLANS: Plan[] = [
  {
    id: 'morning-routine',
    name: 'Morning Routine',
    icon: 'sunny-outline',
    accent: colors.primary,
    accentBg: '#E6F4FD',
    startTime: '07:00 AM',
    dateKey: todayKey,
    steps: [
      { id: 's1', name: 'Brush Teeth', cue: 'water-outline', cueColor: '#FFB020', durationSec: 120, instructions: 'Use toothbrush and paste for 2 minutes. Focus on back teeth!', done: true },
      { id: 's2', name: 'Get Dressed', cue: 'shirt-outline', cueColor: '#7B61FF', durationSec: 300, instructions: 'Pick clothes from the drawer.', done: true },
      { id: 's3', name: 'Eat Breakfast', cue: 'restaurant-outline', cueColor: '#FF8A3C', durationSec: 900, instructions: 'Sit at the table. Take small bites.', done: false },
      { id: 's4', name: 'Pack Bag', cue: 'bag-handle-outline', cueColor: '#5CD65C', durationSec: 180, instructions: 'Books, lunch, water bottle.', done: false },
      { id: 's5', name: 'Shoes On', cue: 'footsteps-outline', cueColor: '#199AEE', durationSec: 120, instructions: 'Left foot first.', done: false },
    ],
  },
  {
    id: 'afternoon-exercise',
    name: 'Afternoon Exercise',
    icon: 'pulse-outline',
    accent: '#34C759',
    accentBg: '#E8FAE8',
    startTime: '02:00 PM',
    dateKey: todayKey,
    steps: [
      { id: 'e1', name: 'Stretch', cue: 'body-outline', cueColor: '#34C759', durationSec: 180, done: false },
      { id: 'e2', name: 'Walk', cue: 'walk-outline', cueColor: '#199AEE', durationSec: 600, done: false },
      { id: 'e3', name: 'Drink Water', cue: 'water-outline', cueColor: '#5CC9E8', durationSec: 60, done: false },
      { id: 'e4', name: 'Cool Down', cue: 'leaf-outline', cueColor: '#5CD65C', durationSec: 180, done: false },
    ],
  },
];

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function startOfWeek(d: Date): Date {
  // Week starts Monday — matches the sketch (M T W T F S S).
  const date = new Date(d);
  const day = date.getDay();           // 0 = Sun
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

function weekdayShort(d: Date): string {
  return ['S', 'M', 'T', 'W', 'T', 'F', 'S'][d.getDay()] ?? '';
}

function longWeekday(d: Date): string {
  return (
    ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][d.getDay()] ?? ''
  );
}

function monthShort(d: Date): string {
  return (
    ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][
      d.getMonth()
    ] ?? ''
  );
}

function fmtMMSS(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

// ─── Week strip ─────────────────────────────────────────────────────────────

function WeekStrip({
  weekStart,
  selectedKey,
  onSelect,
  onShift,
  plansByDate,
}: {
  weekStart: Date;
  selectedKey: string;
  onSelect: (key: string) => void;
  onShift: (delta: number) => void;
  plansByDate: Map<string, Plan[]>;
}) {
  const end = addDays(weekStart, 6);
  const rangeLabel = `${monthShort(weekStart)} ${weekStart.getDate()} – ${monthShort(end)} ${end.getDate()}`;

  return (
    <View>
      <View style={styles.weekHeader}>
        <Pressable onPress={() => onShift(-7)} hitSlop={12} accessibilityLabel="Previous week">
          <Ionicons name="chevron-back" size={22} color={colors.primary} />
        </Pressable>
        <Text style={styles.weekRangeLabel}>{rangeLabel}</Text>
        <Pressable onPress={() => onShift(7)} hitSlop={12} accessibilityLabel="Next week">
          <Ionicons name="chevron-forward" size={22} color={colors.primary} />
        </Pressable>
      </View>
      <View style={styles.weekDays}>
        {Array.from({ length: 7 }).map((_, i) => {
          const d = addDays(weekStart, i);
          const key = formatDateKey(d);
          const isSelected = key === selectedKey;
          const isToday = key === todayKey;
          const hasPlans = (plansByDate.get(key)?.length ?? 0) > 0;
          return (
            <Pressable
              key={key}
              onPress={() => {
                hapticSelection();
                onSelect(key);
              }}
              style={styles.weekDayCell}
              accessibilityRole="button"
              accessibilityLabel={`${longWeekday(d)} ${d.getDate()}`}
            >
              <Text style={[styles.weekDayLabel, isToday && !isSelected && styles.weekDayLabelToday]}>
                {weekdayShort(d)}
              </Text>
              <View style={[styles.weekDayNum, isSelected && styles.weekDayNumSelected]}>
                <Text style={[styles.weekDayNumText, isSelected && styles.weekDayNumTextSelected]}>
                  {d.getDate()}
                </Text>
              </View>
              <View style={[styles.weekDayDot, hasPlans && styles.weekDayDotActive]} />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

// ─── Plan card ──────────────────────────────────────────────────────────────

function PlanCard({ plan, onOpen }: { plan: Plan; onOpen: () => void }) {
  const total = plan.steps.length;
  const done = plan.steps.filter(s => s.done).length;
  const pct = total === 0 ? 0 : done / total;

  return (
    <Pressable
      onPress={onOpen}
      accessibilityRole="button"
      accessibilityLabel={`Open ${plan.name}`}
      style={({ pressed }) => [styles.planRow, pressed && styles.planRowPressed]}
    >
      <View style={[styles.planAccentBar, { backgroundColor: plan.accent }]} />
      <View style={styles.planCard}>
        <View style={styles.planHeader}>
          <View style={[styles.planIconChip, { backgroundColor: plan.accentBg }]}>
            <Ionicons name={plan.icon} size={22} color={plan.accent} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.planName}>{plan.name}</Text>
            <Text style={styles.planMeta}>
              {plan.startTime} {'·'} {total} step{total === 1 ? '' : 's'}
            </Text>
          </View>
        </View>
        <View style={styles.progressRow}>
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                { width: `${Math.round(pct * 100)}%`, backgroundColor: plan.accent },
              ]}
            />
          </View>
          <Text style={styles.progressText}>{done}/{total} done</Text>
        </View>
      </View>
    </Pressable>
  );
}

// ─── Visual timer (circular SVG progress) ───────────────────────────────────

const TIMER_SIZE = 220;
const TIMER_STROKE = 14;
const TIMER_RADIUS = (TIMER_SIZE - TIMER_STROKE) / 2;
const TIMER_CIRC = 2 * Math.PI * TIMER_RADIUS;
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

function VisualTimer({
  seconds,
  total,
  accent,
  running,
}: {
  seconds: number;
  total: number;
  accent: string;
  running: boolean;
}) {
  const progress = useRef(new Animated.Value(0)).current;
  const remaining = Math.max(0, seconds);
  const pct = total === 0 ? 0 : 1 - remaining / total;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: pct,
      duration: 600,
      easing: Easing.out(Easing.quad),
      useNativeDriver: false,
    }).start();
  }, [pct, progress]);

  const strokeDashoffset = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [TIMER_CIRC, 0],
  });

  return (
    <View style={styles.timerWrap}>
      <Svg width={TIMER_SIZE} height={TIMER_SIZE}>
        <Circle
          cx={TIMER_SIZE / 2}
          cy={TIMER_SIZE / 2}
          r={TIMER_RADIUS}
          stroke="#E6F1FB"
          strokeWidth={TIMER_STROKE}
          fill="none"
        />
        <AnimatedCircle
          cx={TIMER_SIZE / 2}
          cy={TIMER_SIZE / 2}
          r={TIMER_RADIUS}
          stroke={accent}
          strokeWidth={TIMER_STROKE}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={`${TIMER_CIRC}, ${TIMER_CIRC}`}
          strokeDashoffset={strokeDashoffset}
          // Start at 12 o'clock and sweep clockwise — feels natural.
          transform={`rotate(-90, ${TIMER_SIZE / 2}, ${TIMER_SIZE / 2})`}
        />
      </Svg>
      <View style={styles.timerCenter} pointerEvents="none">
        <Text style={styles.timerTime}>{fmtMMSS(remaining)}</Text>
        <Text style={[styles.timerLabel, !running && styles.timerLabelPaused]}>
          {running ? 'STEP TIME' : 'Paused'}
        </Text>
      </View>
    </View>
  );
}

// ─── Routine runner (modal) ────────────────────────────────────────────────

function RoutineRunner({
  visible,
  plan,
  onClose,
  onMarkStep,
}: {
  visible: boolean;
  plan: Plan | null;
  onClose: () => void;
  onMarkStep: (planId: string, stepId: string, done: boolean) => void;
}) {
  // Find the first not-done step as the current one.
  const currentIndex = useMemo(() => {
    if (!plan) return 0;
    const idx = plan.steps.findIndex(s => !s.done);
    return idx === -1 ? plan.steps.length - 1 : idx;
  }, [plan]);

  const current = plan?.steps[currentIndex] ?? null;
  const [seconds, setSeconds] = useState(current?.durationSec ?? 0);
  const [running, setRunning] = useState(true);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Reset timer whenever the current step changes.
  useEffect(() => {
    if (!current) return;
    setSeconds(current.durationSec);
    setRunning(true);
  }, [current?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!visible || !running) return;
    tickRef.current = setInterval(() => {
      setSeconds(s => Math.max(0, s - 1));
    }, 1000);
    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
    };
  }, [visible, running, current?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!plan || !current) return null;

  const completedCount = plan.steps.filter(s => s.done).length;
  const upcoming = plan.steps.slice(currentIndex + 1, currentIndex + 3);
  const allDone = plan.steps.every(s => s.done);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.runnerHeader}>
          <Pressable
            onPress={onClose}
            hitSlop={12}
            accessibilityLabel="Close routine"
            style={styles.runnerBack}
          >
            <Ionicons name="chevron-back" size={26} color={colors.primary} />
          </Pressable>
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text style={styles.runnerTitle}>{plan.name}</Text>
            <Text style={styles.runnerSubtitle}>
              {completedCount} of {plan.steps.length} completed
            </Text>
          </View>
          <View style={{ width: 26 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.runnerScroll}
          showsVerticalScrollIndicator={false}
          bounces
          alwaysBounceVertical
          overScrollMode="always"
        >
          {allDone ? (
            <RoutineComplete plan={plan} onClose={onClose} onRestart={() => {
              plan.steps.forEach(s => onMarkStep(plan.id, s.id, false));
            }} />
          ) : (
            <>
              <Card style={styles.timerCard}>
                <VisualTimer
                  seconds={seconds}
                  total={current.durationSec}
                  accent={plan.accent}
                  running={running}
                />
                <View style={styles.timerControls}>
                  <Pressable
                    onPress={() => {
                      hapticSelection();
                      setRunning(r => !r);
                    }}
                    style={({ pressed }) => [
                      styles.timerBtnPrimary,
                      { backgroundColor: plan.accent },
                      pressed && { opacity: 0.85 },
                    ]}
                    accessibilityLabel={running ? 'Pause timer' : 'Resume timer'}
                  >
                    <Ionicons name={running ? 'pause' : 'play'} size={18} color={colors.surface} />
                    <Text style={styles.timerBtnPrimaryText}>{running ? 'Pause' : 'Resume'}</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => {
                      hapticSelection();
                      onMarkStep(plan.id, current.id, true);
                    }}
                    style={({ pressed }) => [
                      styles.timerBtnSecondary,
                      { borderColor: plan.accent },
                      pressed && { opacity: 0.7 },
                    ]}
                    accessibilityLabel="Skip step"
                  >
                    <Text style={[styles.timerBtnSecondaryText, { color: plan.accent }]}>Skip </Text>
                    <Ionicons name="arrow-forward" size={16} color={plan.accent} />
                  </Pressable>
                </View>
              </Card>

              {/* Current step — visual cue, instructions, tickbox via Done button. */}
              <View style={styles.stepRow}>
                <View style={[styles.planAccentBar, { backgroundColor: plan.accent }]} />
                <View style={styles.stepCard}>
                  <View style={styles.stepHead}>
                    <View style={[styles.cueChip, { backgroundColor: hexWithAlpha(current.cueColor, 0.15) }]}>
                      <Ionicons name={current.cue} size={22} color={current.cueColor} />
                    </View>
                    <Text style={styles.stepName}>{current.name}</Text>
                  </View>
                  {current.instructions ? (
                    <Text style={styles.stepInstructions}>{current.instructions}</Text>
                  ) : null}
                  <Pressable
                    onPress={() => {
                      hapticSelection();
                      onMarkStep(plan.id, current.id, true);
                    }}
                    style={({ pressed }) => [
                      styles.stepDoneBtn,
                      { backgroundColor: plan.accent },
                      pressed && { opacity: 0.85 },
                    ]}
                    accessibilityLabel={`Mark ${current.name} done`}
                  >
                    <Text style={styles.stepDoneText}>Done</Text>
                    <Ionicons name="checkmark" size={20} color={colors.surface} />
                  </Pressable>
                </View>
              </View>

              {upcoming.length > 0 && (
                <View>
                  <Text style={styles.upcomingHeading}>Upcoming Steps</Text>
                  <Card style={styles.upcomingCard}>
                    {upcoming.map((s, i) => (
                      <View key={s.id}>
                        <View style={styles.upcomingRow}>
                          <View style={[styles.cueChipSm, { backgroundColor: hexWithAlpha(s.cueColor, 0.15) }]}>
                            <Ionicons name={s.cue} size={16} color={s.cueColor} />
                          </View>
                          <Text style={styles.upcomingName}>{s.name}</Text>
                          <Text style={styles.upcomingTime}>{Math.round(s.durationSec / 60)} min</Text>
                        </View>
                        {i < upcoming.length - 1 && <View style={styles.upcomingDivider} />}
                      </View>
                    ))}
                  </Card>
                </View>
              )}

              {/* First / Then */}
              {plan.steps.length >= 2 && (
                <View>
                  <Text style={styles.upcomingHeading}>First / Then</Text>
                  <Card style={styles.firstThenCard}>
                    <FirstThenCell label="FIRST" step={current} />
                    <Ionicons name="arrow-forward" size={18} color={colors.textTertiary} />
                    <FirstThenCell label="THEN" step={plan.steps[currentIndex + 1] ?? current} />
                  </Card>
                </View>
              )}
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

function FirstThenCell({ label, step }: { label: string; step: PlanStep }) {
  return (
    <View style={styles.ftCell}>
      <Text style={styles.ftLabel}>{label}</Text>
      <View style={[styles.ftIcon, { backgroundColor: hexWithAlpha(step.cueColor, 0.15) }]}>
        <Ionicons name={step.cue} size={26} color={step.cueColor} />
      </View>
      <Text style={styles.ftName} numberOfLines={1}>{step.name}</Text>
    </View>
  );
}

function RoutineComplete({ plan, onClose, onRestart }: { plan: Plan; onClose: () => void; onRestart: () => void }) {
  return (
    <View style={styles.completeWrap}>
      <View style={styles.completeBadge}>
        <Ionicons name="checkmark" size={56} color={colors.surface} />
      </View>
      <Text style={styles.completeTitle}>Routine Complete!</Text>
      <Text style={styles.completeSubtitle}>You finished {plan.name}</Text>

      <Text style={styles.completeSection}>Completed Today</Text>
      <Card style={styles.completeList}>
        {plan.steps.map((s, i) => (
          <View key={s.id}>
            <View style={styles.completeRow}>
              <View style={styles.completeTick}>
                <Ionicons name="checkmark" size={16} color={colors.surface} />
              </View>
              <Text style={styles.completeName}>{s.name}</Text>
            </View>
            {i < plan.steps.length - 1 && <View style={styles.upcomingDivider} />}
          </View>
        ))}
      </Card>

      <Pressable
        onPress={onClose}
        style={({ pressed }) => [styles.completeBtn, pressed && { opacity: 0.85 }]}
      >
        <Text style={styles.completeBtnText}>Back to Planner</Text>
      </Pressable>
      <Pressable
        onPress={onRestart}
        style={({ pressed }) => [styles.completeBtnGhost, pressed && { opacity: 0.7 }]}
      >
        <Text style={styles.completeBtnGhostText}>Start Again</Text>
      </Pressable>
    </View>
  );
}

// ─── Hex → rgba (used for tinted cue backgrounds) ───────────────────────────

function hexWithAlpha(hex: string, alpha: number): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// ─── Screen ─────────────────────────────────────────────────────────────────

export default function PlannerScreen() {
  const router = useRouter();
  const [plans, setPlans] = useState<Plan[]>(SAMPLE_PLANS);
  const [weekStart, setWeekStart] = useState<Date>(startOfWeek(new Date()));
  const [selectedKey, setSelectedKey] = useState<string>(todayKey);
  const [runnerPlan, setRunnerPlan] = useState<Plan | null>(null);
  const [showNewPlanStub, setShowNewPlanStub] = useState(false);

  // Keep runnerPlan in sync with plans state (so timer step counts update).
  useEffect(() => {
    if (!runnerPlan) return;
    const fresh = plans.find(p => p.id === runnerPlan.id);
    if (fresh) setRunnerPlan(fresh);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plans]);

  const plansByDate = useMemo(() => {
    const m = new Map<string, Plan[]>();
    plans.forEach(p => {
      const arr = m.get(p.dateKey) ?? [];
      arr.push(p);
      m.set(p.dateKey, arr);
    });
    return m;
  }, [plans]);

  const selectedDate = useMemo(() => new Date(selectedKey + 'T00:00:00'), [selectedKey]);
  const nextDate = useMemo(() => addDays(selectedDate, 1), [selectedDate]);
  const nextKey = formatDateKey(nextDate);

  const plansForSelected = plansByDate.get(selectedKey) ?? [];
  const plansForNext = plansByDate.get(nextKey) ?? [];

  const markStep = (planId: string, stepId: string, done: boolean) => {
    setPlans(prev =>
      prev.map(p =>
        p.id !== planId
          ? p
          : { ...p, steps: p.steps.map(s => (s.id === stepId ? { ...s, done } : s)) },
      ),
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        bounces
        alwaysBounceVertical
        overScrollMode="always"
      >
        <View style={styles.headerRow}>
          <Text style={styles.title}>Planner</Text>
          <Pressable
            onPress={() => {
              hapticSelection();
              setShowNewPlanStub(true);
            }}
            style={({ pressed }) => [styles.newPlanBtn, pressed && { opacity: 0.85 }]}
            accessibilityLabel="Open plan builder demo"
          >
            <Ionicons name="eye-outline" size={18} color={colors.surface} />
            <Text style={styles.newPlanText}>Demo</Text>
          </Pressable>
        </View>

        <WeekStrip
          weekStart={weekStart}
          selectedKey={selectedKey}
          onSelect={setSelectedKey}
          onShift={delta => {
            const next = addDays(weekStart, delta);
            setWeekStart(next);
            setSelectedKey(formatDateKey(next));
          }}
          plansByDate={plansByDate}
        />

        {/* First / Then quick entry — own page so users with disabilities
            aren't trying to learn it inside a busy planner view. */}
        <Pressable
          onPress={() => {
            hapticSelection();
            router.push(firstThenRoute);
          }}
          style={({ pressed }) => [styles.ftEntry, pressed && { opacity: 0.92 }]}
          accessibilityLabel="Open First and Then sequence"
          accessibilityRole="button"
        >
          <View style={styles.ftEntryIcon}>
            <Ionicons name="git-compare-outline" size={26} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.ftEntryTitle}>First / Then</Text>
            <Text style={styles.ftEntrySub}>Build a step-by-step visual sequence</Text>
          </View>
          <Ionicons name="chevron-forward" size={22} color={colors.textTertiary} />
        </Pressable>

        <DaySection
          isFirst
          heading={`${longWeekday(selectedDate)}, ${monthShort(selectedDate)} ${selectedDate.getDate()}`}
          plans={plansForSelected}
          onOpen={p => setRunnerPlan(p)}
          onAdd={() => setShowNewPlanStub(true)}
        />

        <DaySection
          heading={`${longWeekday(nextDate)}, ${monthShort(nextDate)} ${nextDate.getDate()}`}
          plans={plansForNext}
          onOpen={p => setRunnerPlan(p)}
          onAdd={() => setShowNewPlanStub(true)}
        />
      </ScrollView>

      <RoutineRunner
        visible={!!runnerPlan}
        plan={runnerPlan}
        onClose={() => setRunnerPlan(null)}
        onMarkStep={markStep}
      />

      <Modal visible={showNewPlanStub} transparent animationType="fade" onRequestClose={() => setShowNewPlanStub(false)}>
        <Pressable style={styles.stubBackdrop} onPress={() => setShowNewPlanStub(false)}>
          <Card style={styles.stubCard}>
            <Ionicons name="calendar-outline" size={28} color={colors.primary} />
            <Text style={styles.stubTitle}>New Plan</Text>
            <Text style={styles.stubBody}>
              Full plan builder with steps, visual cues, and First / Then is coming next. The runner already works — tap an existing plan to try the visual timer.
            </Text>
            <Pressable
              onPress={() => setShowNewPlanStub(false)}
              style={({ pressed }) => [styles.stubBtn, pressed && { opacity: 0.85 }]}
            >
              <Text style={styles.stubBtnText}>Got it</Text>
            </Pressable>
          </Card>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

function DaySection({
  heading,
  plans,
  onOpen,
  onAdd,
  isFirst = false,
}: {
  heading: string;
  plans: Plan[];
  onOpen: (p: Plan) => void;
  onAdd: () => void;
  /** First section flush to the strip above; later sections get extra top space. */
  isFirst?: boolean;
}) {
  return (
    <View style={[styles.daySection, !isFirst && styles.daySectionSpaced]}>
      <Text style={styles.dayHeading}>{heading}</Text>
      {plans.length === 0 ? (
        <Card style={styles.emptyCard}>
          <Pressable onPress={onAdd} accessibilityLabel="Add plan" style={styles.emptyTap}>
            <View style={styles.emptyPlus}>
              <Ionicons name="add" size={22} color={colors.primary} />
            </View>
            <Text style={styles.emptyText}>No plans for this day</Text>
            <Text style={styles.emptyAddLink}>Add Plan</Text>
          </Pressable>
        </Card>
      ) : (
        plans.map(p => <PlanCard key={p.id} plan={p} onOpen={() => onOpen(p)} />)
      )}
    </View>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: 40, gap: spacing.lg },

  // Header
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: typography.title,
    fontWeight: '900',
    color: colors.text,
    letterSpacing: typography.trackTitle,
  },
  newPlanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: 9,
    borderRadius: radii.pill,
  },
  newPlanText: {
    color: colors.surface,
    fontSize: typography.callout,
    fontWeight: '800',
  },

  // First/Then entry card
  ftEntry: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    ...shadows.card,
  },
  ftEntryIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E6F4FD',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ftEntryTitle: {
    fontSize: typography.subheading,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: typography.trackSubhead,
  },
  ftEntrySub: {
    fontSize: typography.caption,
    color: colors.textMuted,
    marginTop: 2,
  },

  // Week strip
  weekHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.sm,
  },
  weekRangeLabel: {
    fontSize: typography.body,
    fontWeight: '700',
    color: colors.text,
  },
  weekDays: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.md,
  },
  weekDayCell: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
    paddingVertical: spacing.xs,
  },
  weekDayLabel: {
    fontSize: typography.caption,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.4,
  },
  weekDayLabelToday: {
    color: colors.primary,
  },
  weekDayNum: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekDayNumSelected: {
    backgroundColor: colors.primary,
  },
  weekDayNumText: {
    fontSize: typography.callout,
    fontWeight: '700',
    color: colors.text,
  },
  weekDayNumTextSelected: {
    color: colors.surface,
    fontWeight: '900',
  },
  weekDayDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'transparent',
  },
  weekDayDotActive: {
    backgroundColor: colors.primary,
  },

  // Day section
  daySection: {
    gap: spacing.md,
  },
  // Extra top margin for any day section after the first, so consecutive
  // days don't read as one continuous list.
  daySectionSpaced: {
    marginTop: spacing.lg,
  },
  dayHeading: {
    fontSize: typography.heading,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: typography.trackHeading,
  },

  // Plan row + accent
  planRow: {
    flexDirection: 'row',
    borderRadius: radii.card,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    ...shadows.card,
  },
  planRowPressed: {
    opacity: 0.92,
  },
  planAccentBar: {
    width: 5,
  },
  planCard: {
    flex: 1,
    padding: spacing.lg,
    gap: spacing.md,
  },
  planHeader: {
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
    fontSize: typography.subheading,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: typography.trackSubhead,
  },
  planMeta: {
    fontSize: typography.caption,
    color: colors.textMuted,
    marginTop: 2,
  },
  progressRow: {
    gap: 6,
  },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.progressTrack,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    alignSelf: 'flex-end',
    fontSize: typography.caption,
    fontWeight: '700',
    color: colors.textMuted,
  },

  // Empty day
  emptyCard: {
    padding: spacing.lg,
    alignItems: 'flex-start',
  },
  emptyTap: {
    gap: 8,
  },
  emptyPlus: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E6F4FD',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: typography.body,
    fontWeight: '700',
    color: colors.text,
  },
  emptyAddLink: {
    fontSize: typography.callout,
    color: colors.primary,
    fontWeight: '700',
  },

  // Runner
  runnerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  runnerBack: {
    padding: 4,
  },
  runnerTitle: {
    fontSize: typography.subheading,
    fontWeight: '800',
    color: colors.text,
  },
  runnerSubtitle: {
    fontSize: typography.caption,
    color: colors.textMuted,
    marginTop: 2,
  },
  runnerScroll: {
    padding: spacing.lg,
    paddingBottom: 40,
    gap: spacing.lg,
  },

  // Visual timer
  timerCard: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    gap: spacing.lg,
  },
  timerWrap: {
    width: TIMER_SIZE,
    height: TIMER_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerCenter: {
    position: 'absolute',
    alignItems: 'center',
  },
  timerTime: {
    fontSize: 52,
    fontWeight: '900',
    color: colors.text,
    letterSpacing: -1.5,
  },
  timerLabel: {
    fontSize: typography.caption,
    fontWeight: '700',
    color: colors.textTertiary,
    letterSpacing: 1.2,
    marginTop: 2,
  },
  // Paused state — sentence-case, slightly larger, no caps tracking. Calmer.
  timerLabelPaused: {
    textTransform: 'none',
    letterSpacing: 0,
    fontSize: typography.callout,
    fontWeight: '600',
  },
  timerControls: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  timerBtnPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.xl,
    paddingVertical: 12,
    borderRadius: radii.pill,
  },
  timerBtnPrimaryText: {
    color: colors.surface,
    fontWeight: '800',
    fontSize: typography.callout,
  },
  timerBtnSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: 12,
    borderRadius: radii.pill,
    borderWidth: 1.5,
    backgroundColor: 'transparent',
  },
  timerBtnSecondaryText: {
    fontWeight: '800',
    fontSize: typography.callout,
  },

  // Step / cue
  stepRow: {
    flexDirection: 'row',
    borderRadius: radii.card,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    ...shadows.card,
  },
  stepCard: {
    flex: 1,
    padding: spacing.lg,
    gap: spacing.md,
  },
  stepHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  cueChip: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cueChipSm: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepName: {
    fontSize: typography.subheading,
    fontWeight: '800',
    color: colors.text,
  },
  stepInstructions: {
    fontSize: typography.callout,
    color: colors.textMuted,
    lineHeight: 22,
  },
  stepDoneBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    borderRadius: radii.pill,
  },
  stepDoneText: {
    color: colors.surface,
    fontWeight: '800',
    fontSize: typography.body,
  },

  // Upcoming
  upcomingHeading: {
    fontSize: typography.heading,
    fontWeight: '800',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  upcomingCard: {
    padding: 0,
  },
  upcomingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
  },
  upcomingName: {
    flex: 1,
    fontSize: typography.body,
    fontWeight: '700',
    color: colors.text,
  },
  upcomingTime: {
    fontSize: typography.callout,
    color: colors.textMuted,
    fontWeight: '600',
  },
  upcomingDivider: {
    height: 1,
    backgroundColor: '#EEF2F6',
    marginLeft: spacing.lg + 30 + spacing.md,
  },

  // First / Then
  firstThenCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.lg,
    gap: spacing.sm,
  },
  ftCell: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  ftLabel: {
    fontSize: typography.eyebrow,
    fontWeight: '800',
    color: colors.textTertiary,
    letterSpacing: 1.2,
  },
  ftIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ftName: {
    fontSize: typography.callout,
    fontWeight: '700',
    color: colors.text,
    maxWidth: 100,
    textAlign: 'center',
  },

  // Routine complete
  completeWrap: {
    alignItems: 'center',
    gap: spacing.md,
    paddingTop: spacing.xl,
  },
  completeBadge: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  completeTitle: {
    fontSize: typography.heading,
    fontWeight: '900',
    color: colors.text,
  },
  completeSubtitle: {
    fontSize: typography.callout,
    color: colors.textMuted,
    marginBottom: spacing.lg,
  },
  completeSection: {
    alignSelf: 'flex-start',
    fontSize: typography.caption,
    fontWeight: '700',
    color: colors.textMuted,
    marginTop: spacing.md,
  },
  completeList: {
    padding: 0,
    width: '100%',
  },
  completeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
  },
  completeTick: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  completeName: {
    flex: 1,
    fontSize: typography.body,
    fontWeight: '700',
    color: colors.text,
  },
  completeBtn: {
    width: '100%',
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: radii.pill,
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  completeBtnText: {
    color: colors.surface,
    fontWeight: '800',
    fontSize: typography.body,
  },
  completeBtnGhost: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: radii.pill,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.primary,
    backgroundColor: colors.surface,
  },
  completeBtnGhostText: {
    color: colors.primary,
    fontWeight: '800',
    fontSize: typography.body,
  },

  // Stub modal
  stubBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  stubCard: {
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.xl,
  },
  stubTitle: {
    fontSize: typography.subheading,
    fontWeight: '800',
    color: colors.text,
  },
  stubBody: {
    fontSize: typography.callout,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 22,
  },
  stubBtn: {
    marginTop: spacing.sm,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: 12,
    borderRadius: radii.pill,
  },
  stubBtnText: {
    color: colors.surface,
    fontWeight: '800',
    fontSize: typography.callout,
  },
});
