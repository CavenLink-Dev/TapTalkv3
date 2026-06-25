/**
 * Step by Step — sequence builder + runner.
 *
 * Single screen with two visual states:
 *   • 'build' — list of steps with First/Then/Lastly labels, drag-edit
 *               handles, + button, Start button.
 *   • 'run'   — sequence runner Modal: large current step in centre,
 *               upcoming steps dimmed below, controls at the bottom,
 *               confetti + Done card on completion.
 *
 * Drag-to-reorder: in v1 the burger handle press-hold reveals up/down
 * arrows + delete on the row (an "iOS Edit Mode"-style affordance,
 * principle 25). Full drag-from-handle reorder is queued for Step 9
 * polish — arrow taps cover the same ground with one-finger ergonomics.
 *
 * Run mode honours `sequenceSettings.autoAdvance` (off by default).
 * When off, Skip is disabled if the current step has no timer set.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Easing,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Href, Stack, useRouter } from 'expo-router';
import { Card } from '../../src/components/native/Card';
import { DisclosureRow } from '../../src/components/native/DisclosureRow';
import { colors, radii, spacing, typography } from '../../src/theme/tokens';
import { hapticSelection } from '../../src/utils/haptics';
import {
  FirstThenItem,
  clearFirstThen,
  moveFirstThen,
  positionLabel,
  removeFirstThen,
  setSettings,
  totalDurationSec,
  useFirstThenItems,
  useSequenceSettings,
} from '../../src/features/first-then/store';

const addStepRoute = '/first-then/add-step' as Href;

function hexAlpha(hex: string, a: number): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

function formatHMS(item: FirstThenItem): string {
  const total = totalDurationSec(item);
  if (total === 0) return 'No timer';
  const parts: string[] = [];
  if (item.hours) parts.push(`${item.hours}h`);
  if (item.minutes) parts.push(`${item.minutes}m`);
  if (item.seconds) parts.push(`${item.seconds}s`);
  return parts.join(' ');
}

// ─── Step row (build mode) ──────────────────────────────────────────────────

function StepRow({
  item,
  positionWord,
  index,
  total,
  expanded,
  onTap,
  onLongPress,
  onMove,
  onDelete,
  onEdit,
}: {
  item: FirstThenItem;
  positionWord: string;
  index: number;
  total: number;
  expanded: boolean;
  onTap: () => void;
  onLongPress: () => void;
  onMove: (dir: 'up' | 'down') => void;
  onDelete: () => void;
  onEdit: () => void;
}) {
  return (
    <View>
      <View style={styles.row}>
        <View style={styles.wordPillCol}>
          <View style={styles.wordPill}>
            <Text style={styles.wordPillText}>{positionWord}</Text>
          </View>
        </View>

        <Pressable
          onPress={onTap}
          onLongPress={onLongPress}
          delayLongPress={350}
          accessibilityRole="button"
          accessibilityLabel={`${positionWord}. ${item.name}. ${formatHMS(item)}. Tap to edit, long-press for actions.`}
          style={({ pressed }) => [styles.stepCard, pressed && { opacity: 0.96 }]}
        >
          <View style={[styles.symbolChip, { backgroundColor: hexAlpha(item.symbolColor, 0.18) }]}>
            <Ionicons
              name={item.symbol as React.ComponentProps<typeof Ionicons>['name']}
              size={32}
              color={item.symbolColor}
            />
          </View>
          <View style={styles.stepInfo}>
            <Text style={styles.stepName} numberOfLines={2}>{item.name}</Text>
            <View style={styles.timerRow}>
              <Ionicons name="time-outline" size={14} color={colors.primary} />
              <Text style={styles.timerText}>{formatHMS(item)}</Text>
            </View>
          </View>
          <Pressable
            onPress={onLongPress}
            hitSlop={12}
            accessibilityLabel={`More actions for ${item.name}`}
            accessibilityRole="button"
            style={styles.burgerHit}
          >
            <Ionicons name="reorder-three" size={26} color={colors.textTertiary} />
          </Pressable>
        </Pressable>
      </View>

      {expanded ? (
        <View style={styles.editToolbar} accessibilityLabel="Edit actions">
          <Pressable
            onPress={() => onMove('up')}
            disabled={index === 0}
            accessibilityLabel="Move up"
            accessibilityRole="button"
            style={({ pressed }) => [
              styles.editBtn,
              index === 0 && styles.editBtnDisabled,
              pressed && index !== 0 && { opacity: 0.85 },
            ]}
          >
            <Ionicons name="arrow-up" size={18} color={index === 0 ? colors.textTertiary : colors.primary} />
            <Text style={[styles.editBtnText, index === 0 && { color: colors.textTertiary }]}>Up</Text>
          </Pressable>
          <Pressable
            onPress={() => onMove('down')}
            disabled={index === total - 1}
            accessibilityLabel="Move down"
            accessibilityRole="button"
            style={({ pressed }) => [
              styles.editBtn,
              index === total - 1 && styles.editBtnDisabled,
              pressed && index !== total - 1 && { opacity: 0.85 },
            ]}
          >
            <Ionicons name="arrow-down" size={18} color={index === total - 1 ? colors.textTertiary : colors.primary} />
            <Text style={[styles.editBtnText, index === total - 1 && { color: colors.textTertiary }]}>Down</Text>
          </Pressable>
          <Pressable
            onPress={onEdit}
            accessibilityLabel="Edit step"
            accessibilityRole="button"
            style={({ pressed }) => [styles.editBtn, pressed && { opacity: 0.85 }]}
          >
            <Ionicons name="create-outline" size={18} color={colors.primary} />
            <Text style={styles.editBtnText}>Edit</Text>
          </Pressable>
          <Pressable
            onPress={onDelete}
            accessibilityLabel="Delete step"
            accessibilityRole="button"
            style={({ pressed }) => [styles.editBtn, styles.editBtnDanger, pressed && { opacity: 0.85 }]}
          >
            <Ionicons name="trash-outline" size={18} color={colors.danger} />
            <Text style={[styles.editBtnText, { color: colors.danger }]}>Delete</Text>
          </Pressable>
        </View>
      ) : null}

      {index < total - 1 ? (
        <View style={styles.connector} accessibilityElementsHidden>
          <Ionicons name="arrow-down" size={22} color={colors.primary} />
        </View>
      ) : null}
    </View>
  );
}

// ─── Confetti burst ────────────────────────────────────────────────────────

const CONFETTI_COLORS = ['#FF3B30', '#FF9F0A', '#FFD60A', '#34C759', '#0A84FF', '#AF52DE'];
const CONFETTI_COUNT = 28;
const CONFETTI_DURATION = 1600;

function Confetti({ active }: { active: boolean }) {
  // Mount/unmount based on `active`; each particle re-runs on remount.
  if (!active) return null;
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFillObject}>
      {Array.from({ length: CONFETTI_COUNT }).map((_, i) => (
        <ConfettiParticle key={i} index={i} />
      ))}
    </View>
  );
}

function ConfettiParticle({ index }: { index: number }) {
  const rise = useRef(new Animated.Value(0)).current;
  const seed = useMemo(() => Math.random(), []);
  useEffect(() => {
    Animated.timing(rise, {
      toValue: 1,
      duration: CONFETTI_DURATION + index * 12,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [index, rise]);

  const translateY = rise.interpolate({
    inputRange: [0, 1],
    outputRange: [80, -700],
  });
  const driftX = (seed - 0.5) * 220;
  const rotate = rise.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', `${(seed - 0.5) * 720}deg`],
  });
  const opacity = rise.interpolate({
    inputRange: [0, 0.85, 1],
    outputRange: [1, 1, 0],
  });

  const left = `${5 + (index / CONFETTI_COUNT) * 90 + (seed - 0.5) * 6}%` as const;
  const color = CONFETTI_COLORS[index % CONFETTI_COLORS.length];

  return (
    <Animated.View
      style={{
        position: 'absolute',
        bottom: 0,
        left,
        width: 8,
        height: 14,
        backgroundColor: color,
        borderRadius: 2,
        transform: [{ translateY }, { translateX: driftX }, { rotate }],
        opacity,
      }}
    />
  );
}

// ─── Sequence runner ───────────────────────────────────────────────────────

function SequenceRunner({
  visible,
  items,
  autoAdvance,
  onClose,
}: {
  visible: boolean;
  items: FirstThenItem[];
  autoAdvance: boolean;
  onClose: () => void;
}) {
  const [index, setIndex] = useState(0);
  const [remaining, setRemaining] = useState(0);
  const [done, setDone] = useState(false);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const scrollRef = useRef<ScrollView>(null);

  const current = items[index];
  const total = items.length;

  // Reset when sequence opens.
  useEffect(() => {
    if (!visible) return;
    setIndex(0);
    setDone(false);
    setRemaining(items[0] ? totalDurationSec(items[0]) : 0);
  }, [visible, items]);

  // Tick.
  useEffect(() => {
    if (!visible || done) return;
    if (remaining === 0) return; // No-timer steps don't auto-advance unless toggle.
    tickRef.current = setInterval(() => {
      setRemaining(prev => {
        if (prev <= 1) {
          if (autoAdvance) advance();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, done, index, autoAdvance]);

  // When the current item changes, reset its remaining + auto-scroll.
  useEffect(() => {
    if (!visible || !current) return;
    setRemaining(totalDurationSec(current));
    scrollRef.current?.scrollTo({ y: index * 220, animated: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  const advance = () => {
    if (index >= total - 1) {
      setDone(true);
      return;
    }
    hapticSelection();
    setIndex(i => i + 1);
  };

  const back = () => {
    if (index === 0) return;
    hapticSelection();
    setIndex(i => i - 1);
  };

  const canSkip = autoAdvance || (current ? totalDurationSec(current) === 0 : true);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.runnerSafe} edges={['top']}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.runnerHeader}>
          <Pressable
            onPress={onClose}
            hitSlop={12}
            accessibilityLabel="Close sequence"
            style={styles.runnerBack}
          >
            <Ionicons name="chevron-back" size={26} color={colors.primary} />
          </Pressable>
          <Text style={styles.runnerTitle}>{done ? 'Done' : `Step ${index + 1} of ${total}`}</Text>
          <View style={{ width: 26 }} />
        </View>

        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.runnerScroll}
          showsVerticalScrollIndicator={false}
          bounces
          alwaysBounceVertical
          overScrollMode="always"
        >
          {items.map((it, i) => (
            <RunnerStepCard
              key={it.id}
              item={it}
              isCurrent={i === index && !done}
              isPast={i < index || done}
              positionWord={positionLabel(i, total)}
              remaining={i === index ? remaining : totalDurationSec(it)}
            />
          ))}
          {done ? (
            <View style={styles.runnerDoneCard}>
              <View style={styles.runnerDoneBadge}>
                <Ionicons name="checkmark" size={56} color="#FFFFFF" />
              </View>
              <Text style={styles.runnerDoneTitle}>Great job!</Text>
              <Text style={styles.runnerDoneSub}>You finished every step.</Text>
            </View>
          ) : null}
        </ScrollView>

        {!done ? (
          <View style={styles.runnerControls}>
            <Pressable
              onPress={back}
              disabled={index === 0}
              accessibilityRole="button"
              accessibilityLabel="Back to previous step"
              style={({ pressed }) => [
                styles.runnerBtn,
                styles.runnerBtnGhost,
                index === 0 && styles.runnerBtnDisabled,
                pressed && index !== 0 && { opacity: 0.85 },
              ]}
            >
              <Ionicons name="arrow-back" size={20} color={index === 0 ? colors.textTertiary : colors.primary} />
              <Text style={[styles.runnerBtnGhostText, index === 0 && { color: colors.textTertiary }]}>Back</Text>
            </Pressable>
            <Pressable
              onPress={advance}
              disabled={!canSkip}
              accessibilityRole="button"
              accessibilityLabel={index === total - 1 ? 'Finish sequence' : 'Next step'}
              style={({ pressed }) => [
                styles.runnerBtn,
                styles.runnerBtnPrimary,
                !canSkip && styles.runnerBtnDisabled,
                pressed && canSkip && { opacity: 0.85 },
              ]}
            >
              <Text style={styles.runnerBtnPrimaryText}>
                {index === total - 1 ? 'Finish' : 'Next'}
              </Text>
              <Ionicons name={index === total - 1 ? 'checkmark' : 'arrow-forward'} size={20} color="#FFFFFF" />
            </Pressable>
          </View>
        ) : (
          <View style={styles.runnerControls}>
            <Pressable
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Back to builder"
              style={({ pressed }) => [styles.runnerBtn, styles.runnerBtnPrimary, pressed && { opacity: 0.85 }]}
            >
              <Text style={styles.runnerBtnPrimaryText}>Done</Text>
              <Ionicons name="checkmark" size={20} color="#FFFFFF" />
            </Pressable>
          </View>
        )}

        <Confetti active={done} />
      </SafeAreaView>
    </Modal>
  );
}

function RunnerStepCard({
  item,
  isCurrent,
  isPast,
  positionWord,
  remaining,
}: {
  item: FirstThenItem;
  isCurrent: boolean;
  isPast: boolean;
  positionWord: string;
  remaining: number;
}) {
  const opacity = isCurrent ? 1 : isPast ? 0.4 : 0.55;
  return (
    <View style={[styles.runnerCard, { opacity }]}>
      <View style={[styles.runnerWordPill, !isCurrent && { backgroundColor: '#9AA0A6' }]}>
        <Text style={styles.runnerWordPillText}>{positionWord}</Text>
      </View>
      <View style={styles.runnerCardInner}>
        <View style={[styles.runnerSymbolChip, { backgroundColor: hexAlpha(item.symbolColor, 0.2) }]}>
          <Ionicons
            name={item.symbol as React.ComponentProps<typeof Ionicons>['name']}
            size={isCurrent ? 56 : 38}
            color={item.symbolColor}
          />
        </View>
        <Text style={[styles.runnerStepName, !isCurrent && { fontSize: typography.body }]} numberOfLines={2}>
          {item.name}
        </Text>
        {isCurrent && totalDurationSec(item) > 0 ? (
          <Text style={styles.runnerCountdown}>
            {Math.floor(remaining / 60)}:{String(remaining % 60).padStart(2, '0')}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

// ─── Builder screen ────────────────────────────────────────────────────────

export default function StepByStepScreen() {
  const router = useRouter();
  const items = useFirstThenItems();
  const settings = useSequenceSettings();

  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [runnerOpen, setRunnerOpen] = useState(false);

  const total = items.length;
  const isEmpty = total === 0;

  const onDelete = (id: string) => {
    Alert.alert(
      'Delete step?',
      'This step will be removed from the sequence.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            removeFirstThen(id);
            setExpandedRow(null);
          },
        },
      ],
      { cancelable: true },
    );
  };

  const onClearAll = useCallback(() => {
    Alert.alert(
      'Clear all steps?',
      'Every step in this sequence will be removed.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: () => {
            clearFirstThen();
            setExpandedRow(null);
          },
        },
      ],
      { cancelable: true },
    );
  }, []);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={16}
          style={styles.headerIconBtn}
          accessibilityLabel="Back"
          accessibilityRole="button"
        >
          <Ionicons name="chevron-back" size={28} color={colors.primary} />
        </Pressable>
        <Text style={styles.headerTitle} accessibilityRole="header">Step by Step</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        bounces
        alwaysBounceVertical
        overScrollMode="always"
      >
        <Text style={styles.subtitle}>
          Add steps in order. The first becomes “First”, the rest become “Then”, and the last becomes “Lastly”.
        </Text>

        {isEmpty ? (
          <Card style={styles.emptyCard}>
            <View style={styles.emptyBadge}>
              <Ionicons name="git-compare-outline" size={44} color={colors.primary} />
            </View>
            <Text style={styles.emptyTitle}>No steps yet</Text>
            <Text style={styles.emptyBody}>
              Tap the + below to add your first step — like “First, brush teeth”.
            </Text>
          </Card>
        ) : (
          <View style={styles.chain}>
            {items.map((item, i) => (
              <StepRow
                key={item.id}
                item={item}
                index={i}
                total={total}
                positionWord={positionLabel(i, total)}
                expanded={expandedRow === item.id}
                onTap={() => {
                  router.push({
                    pathname: '/first-then/add-step',
                    params: { id: item.id },
                  });
                }}
                onLongPress={() => {
                  hapticSelection();
                  setExpandedRow(prev => (prev === item.id ? null : item.id));
                }}
                onMove={(dir) => {
                  hapticSelection();
                  moveFirstThen(item.id, dir);
                }}
                onDelete={() => onDelete(item.id)}
                onEdit={() => {
                  router.push({
                    pathname: '/first-then/add-step',
                    params: { id: item.id },
                  });
                }}
              />
            ))}
          </View>
        )}

        <Pressable
          onPress={() => {
            hapticSelection();
            router.push(addStepRoute);
          }}
          style={({ pressed }) => [styles.addBtn, pressed && { opacity: 0.85 }]}
          accessibilityLabel="Add a step"
          accessibilityRole="button"
        >
          <View style={styles.addBtnIcon}>
            <Ionicons name="add" size={28} color={colors.surface} />
          </View>
          <Text style={styles.addBtnText}>
            {isEmpty ? 'Add First Step' : 'Add Another Step'}
          </Text>
        </Pressable>

        {!isEmpty ? (
          <Pressable
            onPress={() => {
              hapticSelection();
              setRunnerOpen(true);
            }}
            style={({ pressed }) => [styles.startBtn, pressed && { opacity: 0.85 }]}
            accessibilityLabel="Start sequence"
            accessibilityRole="button"
          >
            <Ionicons name="play" size={22} color={colors.surface} />
            <Text style={styles.startBtnText}>Start</Text>
          </Pressable>
        ) : null}

        <DisclosureRow
          title="Sequence settings"
          subtitle="Auto-advance, danger zone"
          icon="settings-outline"
          expanded={showSettings}
          onToggle={() => setShowSettings(v => !v)}
        >
          <View style={styles.settingRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.settingLabel}>Move on automatically</Text>
              <Text style={styles.settingSub}>
                When on, each step moves on by itself when its timer reaches zero.
              </Text>
            </View>
            <Switch
              value={settings.autoAdvance}
              onValueChange={(v) => {
                hapticSelection();
                setSettings({ autoAdvance: v });
              }}
              accessibilityLabel="Move on automatically when timer ends"
            />
          </View>

          {!isEmpty ? (
            <Pressable
              onPress={onClearAll}
              style={({ pressed }) => [styles.clearAllBtn, pressed && { opacity: 0.85 }]}
              accessibilityLabel="Clear all steps"
              accessibilityRole="button"
            >
              <Ionicons name="trash-outline" size={18} color={colors.danger} />
              <Text style={styles.clearAllText}>Clear all steps</Text>
            </Pressable>
          ) : null}
        </DisclosureRow>
      </ScrollView>

      <SequenceRunner
        visible={runnerOpen}
        items={items}
        autoAdvance={settings.autoAdvance}
        onClose={() => setRunnerOpen(false)}
      />
    </SafeAreaView>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  headerIconBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: typography.heading,
    fontWeight: '900',
    color: colors.text,
    letterSpacing: typography.trackHeading,
  },
  headerSpacer: { width: 44 },

  scroll: {
    padding: spacing.lg,
    paddingBottom: 60,
    gap: spacing.lg,
  },

  subtitle: {
    fontSize: typography.callout,
    color: colors.textMuted,
    lineHeight: 22,
  },

  emptyCard: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
    gap: spacing.md,
  },
  emptyBadge: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#E6F4FD',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: typography.subheading,
    fontWeight: '800',
    color: colors.text,
  },
  emptyBody: {
    fontSize: typography.body,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: spacing.lg,
  },

  chain: { gap: 0 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  wordPillCol: {
    width: 72,
  },
  wordPill: {
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
  },
  wordPillText: {
    color: colors.surface,
    fontSize: typography.callout,
    fontWeight: '900',
    letterSpacing: 0.4,
  },

  stepCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radii.card,
  },
  symbolChip: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepInfo: { flex: 1, gap: 6 },
  stepName: {
    fontSize: typography.subheading,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: typography.trackSubhead,
  },
  timerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E6F4FD',
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radii.pill,
  },
  timerText: {
    fontSize: typography.caption,
    fontWeight: '700',
    color: colors.primary,
  },
  burgerHit: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },

  editToolbar: {
    flexDirection: 'row',
    gap: 6,
    marginLeft: 72 + spacing.md,
    marginTop: spacing.sm,
    flexWrap: 'wrap',
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radii.pill,
    backgroundColor: '#E6F4FD',
  },
  editBtnDisabled: {
    backgroundColor: colors.background,
  },
  editBtnText: {
    color: colors.primary,
    fontWeight: '700',
    fontSize: typography.caption,
  },
  editBtnDanger: {
    backgroundColor: 'rgba(243, 49, 42, 0.12)',
  },

  connector: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 72 + spacing.md,
    paddingVertical: spacing.sm,
  },

  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    paddingVertical: 18,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.pill,
    minHeight: 60,
    marginTop: spacing.sm,
  },
  addBtnIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  addBtnText: {
    color: colors.surface,
    fontSize: typography.body,
    fontWeight: '800',
    letterSpacing: -0.2,
  },

  startBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#34C759',
    paddingVertical: 18,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.pill,
    minHeight: 60,
  },
  startBtnText: {
    color: colors.surface,
    fontSize: typography.body,
    fontWeight: '800',
  },

  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  settingLabel: {
    fontSize: typography.body,
    fontWeight: '700',
    color: colors.text,
  },
  settingSub: {
    fontSize: typography.caption,
    color: colors.textMuted,
    marginTop: 2,
  },
  clearAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(243, 49, 42, 0.10)',
    marginTop: spacing.sm,
  },
  clearAllText: {
    color: colors.danger,
    fontWeight: '700',
    fontSize: typography.callout,
  },

  // ── Sequence runner ──────────────────────────────────────────────────────
  runnerSafe: { flex: 1, backgroundColor: colors.background },
  runnerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  runnerBack: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  runnerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: typography.subheading,
    fontWeight: '800',
    color: colors.text,
  },
  runnerScroll: {
    padding: spacing.lg,
    paddingBottom: 160,
    gap: spacing.md,
  },
  runnerCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    padding: spacing.lg,
    minHeight: 180,
  },
  runnerWordPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radii.pill,
    backgroundColor: colors.primary,
    marginBottom: spacing.md,
  },
  runnerWordPillText: {
    color: '#FFFFFF',
    fontSize: typography.caption,
    fontWeight: '900',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  runnerCardInner: {
    alignItems: 'center',
    gap: spacing.md,
  },
  runnerSymbolChip: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  runnerStepName: {
    fontSize: typography.heading,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
  },
  runnerCountdown: {
    fontSize: 48,
    fontWeight: '900',
    color: colors.primary,
    letterSpacing: -0.5,
    fontVariant: ['tabular-nums'],
  },
  runnerDoneCard: {
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.xxl,
  },
  runnerDoneBadge: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: '#34C759',
    alignItems: 'center',
    justifyContent: 'center',
  },
  runnerDoneTitle: {
    fontSize: typography.title,
    fontWeight: '900',
    color: colors.text,
    letterSpacing: typography.trackTitle,
  },
  runnerDoneSub: {
    fontSize: typography.body,
    color: colors.textMuted,
  },
  runnerControls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.lg,
    flexDirection: 'row',
    gap: spacing.md,
    backgroundColor: colors.background,
  },
  runnerBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: radii.pill,
    minHeight: 56,
  },
  runnerBtnPrimary: {
    backgroundColor: colors.primary,
  },
  runnerBtnPrimaryText: {
    color: '#FFFFFF',
    fontSize: typography.body,
    fontWeight: '800',
  },
  runnerBtnGhost: {
    backgroundColor: 'rgba(25, 154, 238, 0.10)',
  },
  runnerBtnGhostText: {
    color: colors.primary,
    fontSize: typography.body,
    fontWeight: '800',
  },
  runnerBtnDisabled: {
    backgroundColor: colors.background,
  },
});
