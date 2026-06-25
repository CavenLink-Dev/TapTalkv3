/**
 * Day timeline — vertical 24-hour strip with plan steps positioned by time.
 *
 * Layout:
 *   • Each hour is 96 px tall (48 px per 30 min, principle 14 — proportional
 *     to time so the eye reads "how long" at a glance).
 *   • Left rail: hour labels every hour, faint half-hour tick lines.
 *   • Cards float at their start time, height = duration × (96 / 60).
 *   • Tick (or tap the card) marks the step done → card dims to 30 % and
 *     the timeline auto-scrolls to the next not-done step (principle 14
 *     animation, principle 24 helpful empty when no more steps remain).
 *
 * Header has a Back chevron and the day label (Sunday, Jun 25).
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { colors, radii, spacing, typography } from '../../../src/theme/tokens';
import { hapticSelection } from '../../../src/utils/haptics';
import {
  PlanStep,
  endMin,
  fmtClock,
  parseDateKey,
  toggleStepDone,
  usePlansForDate,
} from '../../../src/features/calendar/store';

const HOUR_HEIGHT = 96;
const TIMELINE_HEIGHT = HOUR_HEIGHT * 24;
const TIME_RAIL_WIDTH = 64;

const DOW_LONG = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function hexAlpha(hex: string, a: number): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

interface PositionedStep extends PlanStep {
  planId: string;
  planName: string;
  planSymbolColor: string;
}

function StepCard({
  step,
  onToggle,
}: {
  step: PositionedStep;
  onToggle: () => void;
}) {
  // Dim animation on done-toggle for visual feedback (principle 14).
  const dim = useRef(new Animated.Value(step.done ? 1 : 0)).current;
  useEffect(() => {
    Animated.timing(dim, {
      toValue: step.done ? 1 : 0,
      duration: 220,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [step.done, dim]);

  const opacity = dim.interpolate({ inputRange: [0, 1], outputRange: [1, 0.3] });

  const top = step.startMin * (HOUR_HEIGHT / 60);
  const height = Math.max(56, step.durationMin * (HOUR_HEIGHT / 60) - 4);

  return (
    <Animated.View
      style={[
        styles.card,
        {
          top,
          height,
          backgroundColor: hexAlpha(step.symbolColor, 0.14),
          borderLeftColor: step.symbolColor,
          opacity,
        },
      ]}
      accessibilityRole="button"
      accessibilityLabel={`${step.name}. ${fmtClock(step.startMin)} to ${fmtClock(endMin(step))}. ${step.done ? 'Done' : 'Not done'}.`}
    >
      <Pressable
        onPress={onToggle}
        style={styles.cardInner}
        accessibilityLabel={step.done ? `Mark ${step.name} not done` : `Mark ${step.name} done`}
      >
        <View style={[styles.cardChip, { backgroundColor: hexAlpha(step.symbolColor, 0.25) }]}>
          <Ionicons
            name={step.symbol as React.ComponentProps<typeof Ionicons>['name']}
            size={22}
            color={step.symbolColor}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardName} numberOfLines={1}>{step.name}</Text>
          <Text style={styles.cardTime}>
            {fmtClock(step.startMin)} – {fmtClock(endMin(step))}
          </Text>
          {step.description ? (
            <Text style={styles.cardDesc} numberOfLines={2}>{step.description}</Text>
          ) : null}
        </View>
        <View style={[styles.tick, step.done && { backgroundColor: step.symbolColor, borderColor: step.symbolColor }]}>
          {step.done ? <Ionicons name="checkmark" size={16} color="#FFFFFF" /> : null}
        </View>
      </Pressable>
    </Animated.View>
  );
}

export default function DayTimelineScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ date?: string }>();
  const dateKey = params.date ?? '';
  const dayDate = dateKey ? parseDateKey(dateKey) : new Date();
  const plans = usePlansForDate(dateKey);
  const [autoScrolled, setAutoScrolled] = useState(false);

  const allSteps: PositionedStep[] = plans.flatMap(p =>
    p.steps.map(s => ({
      ...s,
      planId: p.id,
      planName: p.name,
      planSymbolColor: p.symbolColor,
    })),
  );

  const scrollRef = useRef<ScrollView>(null);

  // Auto-scroll on first paint to the first not-done step (or now-ish).
  useEffect(() => {
    if (autoScrolled || !scrollRef.current) return;
    const next = allSteps.find(s => !s.done);
    const offset = Math.max(0, (next?.startMin ?? new Date().getHours() * 60) * (HOUR_HEIGHT / 60) - HOUR_HEIGHT);
    scrollRef.current.scrollTo({ y: offset, animated: false });
    setAutoScrolled(true);
  }, [allSteps, autoScrolled]);

  const handleToggle = useCallback((planId: string, stepId: string) => {
    hapticSelection();
    toggleStepDone(planId, stepId);
  }, []);

  const dayLabel = `${DOW_LONG[dayDate.getDay()]}, ${MONTHS[dayDate.getMonth()]} ${dayDate.getDate()}`;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={16}
          style={styles.headerIconBtn}
          accessibilityLabel="Back to calendar"
          accessibilityRole="button"
        >
          <Ionicons name="chevron-back" size={28} color={colors.primary} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.title} accessibilityRole="header">{dayLabel}</Text>
          {plans.length > 0 ? (
            <Text style={styles.subtitle}>
              {plans.length} plan{plans.length === 1 ? '' : 's'} · {allSteps.length} step{allSteps.length === 1 ? '' : 's'}
            </Text>
          ) : null}
        </View>
        <View style={styles.headerSpacer} />
      </View>

      {plans.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Ionicons name="calendar-outline" size={64} color={colors.textTertiary} />
          <Text style={styles.emptyTitle}>No plans for this day</Text>
          <Text style={styles.emptySub}>
            Tap “+ New Plan” on the Calendar to add one.
          </Text>
        </View>
      ) : (
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.timelineWrap}
          showsVerticalScrollIndicator={false}
          bounces
          alwaysBounceVertical
          overScrollMode="always"
        >
          <View style={styles.timeline}>
            {/* Hour rail */}
            <View style={styles.rail}>
              {Array.from({ length: 24 }).map((_, h) => (
                <View key={h} style={styles.railHour}>
                  <Text style={styles.railLabel}>{fmtClock(h * 60).replace(' ', '\n')}</Text>
                </View>
              ))}
            </View>

            {/* Body */}
            <View style={styles.body}>
              {/* Hour + half-hour rules */}
              {Array.from({ length: 24 }).map((_, h) => (
                <React.Fragment key={`rule-${h}`}>
                  <View style={[styles.rule, { top: h * HOUR_HEIGHT }]} />
                  <View style={[styles.halfRule, { top: h * HOUR_HEIGHT + HOUR_HEIGHT / 2 }]} />
                </React.Fragment>
              ))}

              {/* Step cards */}
              {allSteps.map(step => (
                <StepCard
                  key={`${step.planId}-${step.id}`}
                  step={step}
                  onToggle={() => handleToggle(step.planId, step.id)}
                />
              ))}
            </View>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

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
    fontSize: typography.heading,
    fontWeight: '900',
    color: colors.text,
    letterSpacing: typography.trackHeading,
  },
  subtitle: {
    marginTop: 2,
    fontSize: typography.caption,
    color: colors.textMuted,
  },
  headerSpacer: { width: 36 },

  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
  },
  emptyTitle: {
    fontSize: typography.subheading,
    fontWeight: '800',
    color: colors.text,
  },
  emptySub: {
    fontSize: typography.body,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 24,
  },

  timelineWrap: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  timeline: {
    flexDirection: 'row',
    minHeight: TIMELINE_HEIGHT,
  },
  rail: {
    width: TIME_RAIL_WIDTH,
  },
  railHour: {
    height: HOUR_HEIGHT,
    justifyContent: 'flex-start',
  },
  railLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.4,
    textAlign: 'right',
    paddingRight: spacing.sm,
    lineHeight: 13,
  },

  body: {
    flex: 1,
    position: 'relative',
  },
  rule: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: '#E0E5EA',
  },
  halfRule: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: '#F2F5F8',
  },

  card: {
    position: 'absolute',
    left: spacing.sm,
    right: 0,
    borderLeftWidth: 4,
    borderRadius: radii.card,
    overflow: 'hidden',
  },
  cardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    flex: 1,
  },
  cardChip: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardName: {
    fontSize: typography.body,
    fontWeight: '800',
    color: colors.text,
  },
  cardTime: {
    marginTop: 1,
    fontSize: typography.caption,
    color: colors.textMuted,
    fontWeight: '600',
  },
  cardDesc: {
    marginTop: 3,
    fontSize: typography.caption,
    color: colors.textMuted,
    lineHeight: 16,
  },
  tick: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: colors.textTertiary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
