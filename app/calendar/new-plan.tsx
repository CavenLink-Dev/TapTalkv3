/**
 * New Plan — create a plan for a specific date.
 *
 * Linear flow, top to bottom (principle 1 simple-first, principle 5 deeper
 * pages — each step's wheel detail is hidden until tapped):
 *   1. Symbol + Plan name
 *   2. Date (pre-filled with the route param)
 *   3. Description (optional, in a disclosure)
 *   4. Steps — list of step rows. Each row taps open a sub-sheet that
 *      lets the user pick symbol, name, start time and duration. End
 *      time is computed and shown read-only.
 *   5. Save Plan button (disabled until name and ≥1 step exist).
 *
 * No drag-to-reorder yet (matches Step by Step pattern — arrows in edit
 * mode, drag in the polish pass).
 */

import React, { useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Card } from '../../src/components/native/Card';
import { DisclosureRow } from '../../src/components/native/DisclosureRow';
import { WheelPicker } from '../../src/components/native/WheelPicker';
import { radii, spacing, typography } from '../../src/theme/tokens';
import { hapticSelection } from '../../src/utils/haptics';
import {
  PlanStep,
  addPlan,
  fmtClock,
  formatDateKey,
  parseDateKey,
} from '../../src/features/calendar/store';
import { useTheme } from '../../src/theme/useTheme';

const SYMBOLS: { name: React.ComponentProps<typeof Ionicons>['name']; color: string; label: string }[] = [
  { name: 'sunny-outline',         color: '#FFB020', label: 'Morning'  },
  { name: 'moon-outline',          color: '#7B61FF', label: 'Night'    },
  { name: 'pulse-outline',         color: '#34C759', label: 'Exercise' },
  { name: 'restaurant-outline',    color: '#FF8A3C', label: 'Meal'     },
  { name: 'school-outline',        color: '#199AEE', label: 'School'   },
  { name: 'briefcase-outline',     color: '#5856D6', label: 'Work'     },
  { name: 'book-outline',          color: '#BD73FF', label: 'Study'    },
  { name: 'medkit-outline',        color: '#FF453A', label: 'Health'   },
  { name: 'happy-outline',         color: '#FFD60A', label: 'Play'     },
  { name: 'musical-notes-outline', color: '#AF52DE', label: 'Music'    },
  { name: 'car-outline',           color: '#5856D6', label: 'Travel'   },
  { name: 'sparkles-outline',      color: '#FFD700', label: 'Reward'   },
];

const STEP_SYMBOLS: { name: React.ComponentProps<typeof Ionicons>['name']; color: string; label: string }[] = [
  { name: 'water-outline',         color: '#3DC1F2', label: 'Wash'   },
  { name: 'shirt-outline',         color: '#FF6B81', label: 'Dress'  },
  { name: 'restaurant-outline',    color: '#FF8A3C', label: 'Eat'    },
  { name: 'walk-outline',          color: '#34C759', label: 'Walk'   },
  { name: 'book-outline',          color: '#BD73FF', label: 'Read'   },
  { name: 'school-outline',        color: '#199AEE', label: 'School' },
  { name: 'pulse-outline',         color: '#34C759', label: 'Move'   },
  { name: 'time-outline',          color: '#5856D6', label: 'Wait'   },
  { name: 'happy-outline',         color: '#FFB020', label: 'Play'   },
  { name: 'bed-outline',           color: '#7B61FF', label: 'Sleep'  },
  { name: 'medical-outline',       color: '#FF453A', label: 'Meds'   },
  { name: 'sparkles-outline',      color: '#FFD700', label: 'Reward' },
];

const HOURS    = Array.from({ length: 24 }, (_, i) => i);
const MINUTES  = Array.from({ length: 12 }, (_, i) => i * 5); // 5-minute steps
const DURATIONS = [5, 10, 15, 20, 30, 45, 60, 90, 120];

function hexAlpha(hex: string, a: number): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function dayLabel(d: Date): string {
  return `${DOW[d.getDay()]}, ${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

interface DraftStep {
  id: string;
  name: string;
  symbolIndex: number;
  hour: number;
  minute: number;
  duration: number;
}

function defaultDraft(prevEndMin: number): DraftStep {
  return {
    id: `draft-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name: '',
    symbolIndex: 0,
    hour: Math.floor(prevEndMin / 60) % 24,
    minute: prevEndMin % 60,
    duration: 30,
  };
}

// ─── Step editor sheet ─────────────────────────────────────────────────────

function StepEditor({
  visible,
  draft,
  index,
  onSave,
  onCancel,
}: {
  visible: boolean;
  draft: DraftStep;
  index: number;
  onSave: (next: DraftStep) => void;
  onCancel: () => void;
}) {
  const t = useTheme();
  const [local, setLocal] = useState<DraftStep>(draft);

  React.useEffect(() => {
    if (visible) setLocal(draft);
  }, [visible, draft]);

  const sym = STEP_SYMBOLS[local.symbolIndex] ?? STEP_SYMBOLS[0]!;
  const startMin = local.hour * 60 + local.minute;
  const endMin = startMin + local.duration;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="formSheet" onRequestClose={onCancel}>
      <SafeAreaView style={[styles.sheet, { backgroundColor: t.colors.background }]} edges={['top']}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.sheetHeader}>
          <Pressable onPress={onCancel} accessibilityLabel="Cancel" style={styles.sheetTextBtn}>
            <Text style={[styles.sheetCancelText, { color: t.colors.textMuted }]}>Cancel</Text>
          </Pressable>
          <Text style={[styles.sheetTitle, { color: t.colors.text }]}>Step {index + 1}</Text>
          <Pressable
            onPress={() => {
              if (!local.name.trim()) return;
              hapticSelection();
              onSave({ ...local, name: local.name.trim() });
            }}
            accessibilityLabel="Save step"
            style={styles.sheetTextBtn}
          >
            <Text style={[styles.sheetSaveText, !local.name.trim() && styles.sheetSaveDisabled]}>Save</Text>
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={styles.sheetBody}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          bounces
          alwaysBounceVertical
          overScrollMode="always"
        >
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <Text style={[styles.fieldEyebrow, { color: t.colors.textMuted }]}>SYMBOL</Text>
            <View style={styles.symGrid}>
              {STEP_SYMBOLS.map((s, idx) => {
                const active = idx === local.symbolIndex;
                return (
                  <Pressable
                    key={s.name + idx}
                    onPress={() => {
                      hapticSelection();
                      setLocal(d => ({ ...d, symbolIndex: idx }));
                    }}
                    style={({ pressed }) => [
                      styles.symTile,
                      active && { borderColor: s.color, borderWidth: 3 },
                      pressed && { opacity: 0.86 },
                    ]}
                    accessibilityLabel={s.label}
                    accessibilityState={{ selected: active }}
                    accessibilityRole="button"
                  >
                    <View style={[styles.symBg, { backgroundColor: hexAlpha(s.color, 0.18) }]}>
                      <Ionicons name={s.name} size={26} color={s.color} />
                    </View>
                    <Text style={[styles.symLabel, { color: t.colors.text }]}>{s.label}</Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={[styles.fieldEyebrow, { color: t.colors.textMuted }]}>STEP NAME</Text>
            <TextInput
              value={local.name}
              onChangeText={(t) => setLocal(d => ({ ...d, name: t }))}
              placeholder="e.g. Brush teeth"
              placeholderTextColor={t.colors.textTertiary}
              style={[styles.input, { color: t.colors.text, backgroundColor: t.colors.surface }]}
              maxLength={40}
              returnKeyType="done"
              accessibilityLabel="Step name"
            />

            <Text style={[styles.fieldEyebrow, { color: t.colors.textMuted }]}>START TIME</Text>
            <View style={[styles.wheelRow, { backgroundColor: t.colors.surface }]}>
              <WheelPicker
                values={HOURS}
                selectedValue={local.hour}
                onChange={(v) => setLocal(d => ({ ...d, hour: v }))}
                label="Hour"
                format={(v) => String(v).padStart(2, '0')}
                accessibilityLabel="Start hour"
              />
              <Text style={[styles.wheelSeparator, { color: t.colors.textTertiary }]}>:</Text>
              <WheelPicker
                values={MINUTES}
                selectedValue={local.minute}
                onChange={(v) => setLocal(d => ({ ...d, minute: v }))}
                label="Min"
                format={(v) => String(v).padStart(2, '0')}
                accessibilityLabel="Start minute"
              />
            </View>

            <Text style={[styles.fieldEyebrow, { color: t.colors.textMuted }]}>DURATION</Text>
            <View style={styles.durRow}>
              {DURATIONS.map(d => {
                const active = local.duration === d;
                return (
                  <Pressable
                    key={d}
                    onPress={() => {
                      hapticSelection();
                      setLocal(prev => ({ ...prev, duration: d }));
                    }}
                    style={({ pressed }) => [
                      styles.durChip,
                      active && styles.durChipActive,
                      pressed && { opacity: 0.86 },
                    ]}
                    accessibilityLabel={`${d} minutes`}
                    accessibilityState={{ selected: active }}
                    accessibilityRole="button"
                  >
                    <Text style={[styles.durChipText, active && styles.durChipTextActive]}>
                      {d} min
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.endsAtRow}>
              <Text style={[styles.endsAtLabel, { color: t.colors.textMuted }]}>Ends at</Text>
              <Text style={[styles.endsAtValue, { color: t.colors.text }]}>
                {fmtClock(endMin)}
              </Text>
            </View>

            <View style={[styles.previewBox, { backgroundColor: t.colors.surface }]}>
              <View style={[styles.previewChip, { backgroundColor: hexAlpha(sym.color, 0.18) }]}>
                <Ionicons name={sym.name} size={28} color={sym.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.previewName, { color: t.colors.text }]} numberOfLines={1}>
                  {local.name.trim() || 'Your step'}
                </Text>
                <Text style={[styles.previewTime, { color: t.colors.textMuted }]}>
                  {fmtClock(startMin)} – {fmtClock(endMin)}
                </Text>
              </View>
            </View>
          </KeyboardAvoidingView>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

// ─── Date picker mini-modal ────────────────────────────────────────────────

function DateSheet({
  visible,
  current,
  onSave,
  onCancel,
}: {
  visible: boolean;
  current: Date;
  onSave: (next: Date) => void;
  onCancel: () => void;
}) {
  const t = useTheme();
  const [year, setYear] = useState(current.getFullYear());
  const [month, setMonth] = useState(current.getMonth());
  const [day, setDay] = useState(current.getDate());

  React.useEffect(() => {
    if (!visible) return;
    setYear(current.getFullYear());
    setMonth(current.getMonth());
    setDay(current.getDate());
  }, [visible, current]);

  const yearOptions = useMemo(
    () => Array.from({ length: 21 }, (_, i) => current.getFullYear() - 5 + i),
    [current],
  );
  const monthOptions = useMemo(() => Array.from({ length: 12 }, (_, i) => i), []);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const dayOptions = useMemo(
    () => Array.from({ length: daysInMonth }, (_, i) => i + 1),
    [daysInMonth],
  );

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="formSheet" onRequestClose={onCancel}>
      <SafeAreaView style={[styles.sheet, { backgroundColor: t.colors.background }]} edges={['top']}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.sheetHeader}>
          <Pressable onPress={onCancel} accessibilityLabel="Cancel" style={styles.sheetTextBtn}>
            <Text style={[styles.sheetCancelText, { color: t.colors.textMuted }]}>Cancel</Text>
          </Pressable>
          <Text style={[styles.sheetTitle, { color: t.colors.text }]}>Choose Date</Text>
          <Pressable
            onPress={() => {
              hapticSelection();
              onSave(new Date(year, month, Math.min(day, daysInMonth)));
            }}
            accessibilityLabel="Save date"
            style={styles.sheetTextBtn}
          >
            <Text style={[styles.sheetSaveText, { color: t.colors.primary }]}>Save</Text>
          </Pressable>
        </View>
        <View style={styles.dateBody}>
          <View style={[styles.wheelRow, { backgroundColor: t.colors.surface }]}>
            <WheelPicker
              values={monthOptions}
              selectedValue={month}
              onChange={setMonth}
              label="Month"
              format={(v) => MONTHS[v as number] ?? ''}
              width={90}
              accessibilityLabel="Month"
            />
            <WheelPicker
              values={dayOptions}
              selectedValue={Math.min(day, daysInMonth)}
              onChange={setDay}
              label="Day"
              format={(v) => String(v).padStart(2, '0')}
              accessibilityLabel="Day"
            />
            <WheelPicker
              values={yearOptions}
              selectedValue={year}
              onChange={setYear}
              label="Year"
              width={90}
              accessibilityLabel="Year"
            />
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

// ─── Screen ────────────────────────────────────────────────────────────────

export default function NewPlanScreen() {
  const t = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ date?: string }>();
  const initialDate = params.date ? parseDateKey(params.date) : new Date();

  const [planName, setPlanName] = useState('');
  const [planSymbolIndex, setPlanSymbolIndex] = useState<number>(0);
  const [date, setDate] = useState<Date>(initialDate);
  const [description, setDescription] = useState('');
  const [steps, setSteps] = useState<DraftStep[]>([]);

  const [descExpanded, setDescExpanded] = useState(false);
  const [dateSheetOpen, setDateSheetOpen] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editIndex, setEditIndex] = useState<number | null>(null);

  const planSym = SYMBOLS[planSymbolIndex] ?? SYMBOLS[0]!;

  const lastEnd = steps.length
    ? (() => {
        const last = steps[steps.length - 1]!;
        return last.hour * 60 + last.minute + last.duration;
      })()
    : 9 * 60;

  const openAddStep = () => {
    hapticSelection();
    setEditIndex(null);
    setEditorOpen(true);
  };

  const openEditStep = (idx: number) => {
    hapticSelection();
    setEditIndex(idx);
    setEditorOpen(true);
  };

  const saveStep = (draft: DraftStep) => {
    if (editIndex == null) {
      setSteps(prev => [...prev, { ...draft, id: `draft-${Date.now()}` }]);
    } else {
      setSteps(prev => prev.map((s, i) => (i === editIndex ? draft : s)));
    }
    setEditorOpen(false);
    setEditIndex(null);
  };

  const removeStep = (idx: number) => {
    Alert.alert(
      'Delete step?',
      'This step will be removed from the plan.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => setSteps(prev => prev.filter((_, i) => i !== idx)),
        },
      ],
      { cancelable: true },
    );
  };

  const canSave = planName.trim().length > 0 && steps.length > 0;

  const onSavePlan = () => {
    if (!canSave) return;
    const planSteps: PlanStep[] = steps.map(s => {
      const sym = STEP_SYMBOLS[s.symbolIndex] ?? STEP_SYMBOLS[0]!;
      return {
        id: s.id,
        name: s.name,
        symbol: sym.name,
        symbolColor: sym.color,
        startMin: s.hour * 60 + s.minute,
        durationMin: s.duration,
        done: false,
      };
    });
    addPlan({
      id: `plan-${Date.now()}`,
      name: planName.trim(),
      symbol: planSym.name,
      symbolColor: planSym.color,
      date: formatDateKey(date),
      description: description.trim() || undefined,
      steps: planSteps,
    });
    hapticSelection();
    router.back();
  };

  const currentDraft = editIndex != null
    ? steps[editIndex] ?? defaultDraft(lastEnd)
    : defaultDraft(lastEnd);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: t.colors.background }]} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={16}
          style={styles.headerIconBtn}
          accessibilityLabel="Cancel"
          accessibilityRole="button"
        >
          <Ionicons name="chevron-back" size={28} color={t.colors.primary} />
        </Pressable>
        <Text style={[styles.title, { color: t.colors.text }]} accessibilityRole="header">New Plan</Text>
        <View style={styles.headerSpacer} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          bounces
          alwaysBounceVertical
          overScrollMode="always"
        >
          {/* Symbol + name */}
          <Card style={styles.section}>
            <Text style={[styles.fieldEyebrow, { color: t.colors.textMuted }]}>SYMBOL</Text>
            <View style={styles.symGrid}>
              {SYMBOLS.map((s, idx) => {
                const active = idx === planSymbolIndex;
                return (
                  <Pressable
                    key={s.name + idx}
                    onPress={() => {
                      hapticSelection();
                      setPlanSymbolIndex(idx);
                    }}
                    style={({ pressed }) => [
                      styles.symTile,
                      active && { borderColor: s.color, borderWidth: 3 },
                      pressed && { opacity: 0.86 },
                    ]}
                    accessibilityLabel={s.label}
                    accessibilityState={{ selected: active }}
                    accessibilityRole="button"
                  >
                    <View style={[styles.symBg, { backgroundColor: hexAlpha(s.color, 0.18) }]}>
                      <Ionicons name={s.name} size={26} color={s.color} />
                    </View>
                    <Text style={[styles.symLabel, { color: t.colors.text }]}>{s.label}</Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={[styles.fieldEyebrow, { color: t.colors.textMuted }]}>PLAN NAME</Text>
            <TextInput
              value={planName}
              onChangeText={setPlanName}
              placeholder="e.g. Morning Routine"
              placeholderTextColor={t.colors.textTertiary}
              style={[styles.input, { color: t.colors.text, backgroundColor: t.colors.surface }]}
              maxLength={40}
              returnKeyType="done"
              accessibilityLabel="Plan name"
            />
          </Card>

          {/* Date */}
          <Pressable
            onPress={() => setDateSheetOpen(true)}
            accessibilityRole="button"
            accessibilityLabel="Change plan date"
            style={({ pressed }) => [styles.dateRow, pressed && { opacity: 0.94 }]}
          >
            <View style={styles.dateIconChip}>
              <Ionicons name="calendar-outline" size={20} color={t.colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.dateLabel, { color: t.colors.textMuted }]}>Date</Text>
              <Text style={[styles.dateValue, { color: t.colors.text }]}>{dayLabel(date)}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={t.colors.textTertiary} />
          </Pressable>

          {/* Description (optional) */}
          <DisclosureRow
            title="Description"
            subtitle="Optional notes"
            icon="document-text-outline"
            summary={description ? `${description.length} chars` : 'None'}
            expanded={descExpanded}
            onToggle={() => setDescExpanded(v => !v)}
          >
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="e.g. Calm start to the day."
              placeholderTextColor={t.colors.textTertiary}
              style={[styles.input, { minHeight: 80, textAlignVertical: 'top' }]}
              multiline
              maxLength={140}
              accessibilityLabel="Description"
            />
          </DisclosureRow>

          {/* Steps */}
          <View style={styles.section}>
            <View style={styles.stepsHeader}>
              <Text style={[styles.stepsTitle, { color: t.colors.text }]}>Steps</Text>
              <Text style={[styles.stepsCount, { color: t.colors.textMuted }]}>{steps.length} step{steps.length === 1 ? '' : 's'}</Text>
            </View>

            {steps.length === 0 ? (
              <View style={[styles.stepsEmpty, { backgroundColor: t.colors.surface }]}>
                <Text style={[styles.stepsEmptyText, { color: t.colors.textMuted }]}>
                  Add steps in order. They start from Step 1 and run top to bottom.
                </Text>
              </View>
            ) : (
              <View style={{ gap: spacing.sm }}>
                {steps.map((s, idx) => {
                  const sym = STEP_SYMBOLS[s.symbolIndex] ?? STEP_SYMBOLS[0]!;
                  const startMin = s.hour * 60 + s.minute;
                  const endMin = startMin + s.duration;
                  return (
                    <View key={s.id} style={styles.stepRow}>
                      <Text style={[styles.stepNumber, { color: t.colors.textMuted }]}>{idx + 1}</Text>
                      <Pressable
                        onPress={() => openEditStep(idx)}
                        accessibilityRole="button"
                        accessibilityLabel={`Edit step ${idx + 1}, ${s.name || 'Unnamed'}`}
                        style={({ pressed }) => [styles.stepCard, pressed && { opacity: 0.94 }]}
                      >
                        <View style={[styles.stepChip, { backgroundColor: hexAlpha(sym.color, 0.18) }]}>
                          <Ionicons name={sym.name} size={22} color={sym.color} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.stepName, { color: t.colors.text }]} numberOfLines={1}>
                            {s.name || 'Untitled step'}
                          </Text>
                          <Text style={[styles.stepTime, { color: t.colors.textMuted }]}>
                            {fmtClock(startMin)} – {fmtClock(endMin)} · {s.duration} min
                          </Text>
                        </View>
                        <Pressable
                          onPress={() => removeStep(idx)}
                          hitSlop={12}
                          accessibilityLabel={`Delete step ${idx + 1}`}
                          style={styles.deleteHit}
                        >
                          <Ionicons name="close-circle" size={22} color={t.colors.textTertiary} />
                        </Pressable>
                      </Pressable>
                    </View>
                  );
                })}
              </View>
            )}

            <Pressable
              onPress={openAddStep}
              accessibilityRole="button"
              accessibilityLabel="Add a step"
              style={({ pressed }) => [styles.addStepBtn, pressed && { opacity: 0.85 }]}
            >
              <View style={[styles.addStepBubble, { backgroundColor: t.colors.primary }]}>
                <Ionicons name="add" size={26} color={t.colors.surface} />
              </View>
              <Text style={[styles.addStepLabel, { color: t.colors.primary }]}>
                {steps.length === 0 ? 'Add first step' : 'Add another step'}
              </Text>
            </Pressable>
          </View>

          <Pressable
            onPress={onSavePlan}
            disabled={!canSave}
            accessibilityRole="button"
            accessibilityLabel="Save plan"
            accessibilityState={{ disabled: !canSave }}
            style={({ pressed }) => [
              styles.saveBtn,
              !canSave && styles.saveBtnDisabled,
              canSave && pressed && { opacity: 0.85 },
            ]}
          >
            <Ionicons
              name="checkmark"
              size={22}
              color={canSave ? t.colors.surface : t.colors.textTertiary}
            />
            <Text style={[styles.saveBtnText, !canSave && { color: t.colors.textTertiary }]}>
              Save Plan
            </Text>
          </Pressable>
          {!canSave ? (
            <Text style={[styles.saveHint, { color: t.colors.textMuted }]}>
              Add a name and at least one step to save.
            </Text>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>

      <StepEditor
        visible={editorOpen}
        draft={currentDraft}
        index={editIndex ?? steps.length}
        onSave={saveStep}
        onCancel={() => {
          setEditorOpen(false);
          setEditIndex(null);
        }}
      />
      <DateSheet
        visible={dateSheetOpen}
        current={date}
        onSave={(d) => {
          setDate(d);
          setDateSheetOpen(false);
        }}
        onCancel={() => setDateSheetOpen(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1},

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm},
  headerIconBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  title: {
    flex: 1,
    textAlign: 'center',
    fontSize: typography.heading,
    fontWeight: '900',

    letterSpacing: typography.trackHeading},
  headerSpacer: { width: 44 },

  scroll: {
    padding: spacing.lg,
    paddingBottom: 60,
    gap: spacing.lg},

  section: {
    gap: spacing.md},

  fieldEyebrow: {
    fontSize: typography.caption,
    fontWeight: '800',

    letterSpacing: 1.1,
    textTransform: 'uppercase',
    marginTop: spacing.sm},

  input: {

    borderRadius: radii.card,
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
    fontSize: typography.body,

    minHeight: 52},

  symGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8},
  symTile: {
    width: '30%',
    aspectRatio: 0.95,
    padding: 6,
    borderRadius: radii.card,

    alignItems: 'center',
    justifyContent: 'center',
    gap: 4},
  symBg: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center'},
  symLabel: {
    fontSize: typography.caption,
    fontWeight: '700'},

  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,

    borderRadius: radii.card,
    minHeight: 60},
  dateIconChip: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E6F4FD',
    alignItems: 'center',
    justifyContent: 'center'},
  dateLabel: {
    fontSize: typography.caption,
    fontWeight: '700',

    letterSpacing: 0.4,
    textTransform: 'uppercase'},
  dateValue: {
    marginTop: 2,
    fontSize: typography.body,
    fontWeight: '700'},

  stepsHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between'},
  stepsTitle: {
    fontSize: typography.subheading,
    fontWeight: '800'},
  stepsCount: {
    fontSize: typography.caption,

    fontWeight: '700'},
  stepsEmpty: {

    borderRadius: radii.card,
    padding: spacing.lg,
    alignItems: 'center'},
  stepsEmptyText: {
    fontSize: typography.callout,

    textAlign: 'center',
    lineHeight: 22},

  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm},
  stepNumber: {
    width: 24,
    textAlign: 'center',
    fontSize: typography.callout,
    fontWeight: '800'},
  stepCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,

    borderRadius: radii.card},
  stepChip: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center'},
  stepName: {
    fontSize: typography.body,
    fontWeight: '700'},
  stepTime: {
    marginTop: 2,
    fontSize: typography.caption},
  deleteHit: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center'},

  addStepBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: 14,
    paddingHorizontal: spacing.lg,
    backgroundColor: '#E6F4FD',
    borderRadius: radii.card,
    marginTop: spacing.sm},
  addStepBubble: {
    width: 44,
    height: 44,
    borderRadius: 22,

    alignItems: 'center',
    justifyContent: 'center'},
  addStepLabel: {
    fontSize: typography.body,
    fontWeight: '800'},

  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,

    paddingVertical: 18,
    borderRadius: radii.pill,
    minHeight: 60,
    marginTop: spacing.md},
  saveBtnDisabled: {

  },
  saveBtnText: {

    fontSize: typography.body,
    fontWeight: '800'},
  saveHint: {
    textAlign: 'center',
    fontSize: typography.caption,

    marginTop: spacing.xs},

  // ── Sheets ─────────────────────────────────────────────────────────────
  sheet: { flex: 1},
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderBottomColor: '#E0E5EA',
    borderBottomWidth: StyleSheet.hairlineWidth},
  sheetTextBtn: { paddingHorizontal: 4, paddingVertical: 6 },
  sheetCancelText: {

    fontSize: typography.body,
    fontWeight: '600'},
  sheetSaveText: {

    fontSize: typography.body,
    fontWeight: '800'},
  sheetSaveDisabled: { },
  sheetTitle: {
    fontSize: typography.subheading,
    fontWeight: '800'},
  sheetBody: {
    padding: spacing.lg,
    gap: spacing.md,
    paddingBottom: 60},

  wheelRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',

    borderRadius: radii.card,
    paddingVertical: spacing.md,
    gap: spacing.sm},
  wheelSeparator: {
    fontSize: 22,
    fontWeight: '700',

    paddingBottom: 50},

  durRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6},
  durChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radii.pill},
  durChipActive: { },
  durChipText: {
    fontSize: typography.callout,
    fontWeight: '700'},
  durChipTextActive: { color: '#FFFFFF' },

  endsAtRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm},
  endsAtLabel: {
    fontSize: typography.callout,
    fontWeight: '700'},
  endsAtValue: {
    fontSize: typography.body,
    fontWeight: '800'},

  previewBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,

    borderRadius: radii.card,
    padding: spacing.md},
  previewChip: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center'},
  previewName: {
    fontSize: typography.body,
    fontWeight: '800'},
  previewTime: {
    marginTop: 2,
    fontSize: typography.caption},

  dateBody: {
    flex: 1,
    padding: spacing.lg,
    justifyContent: 'center'},
});
