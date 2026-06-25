/**
 * Add / Edit Step.
 *
 * One linear flow walking the user through three labelled sections:
 *   1. What is the step?      (name input)
 *   2. How long?              (full iOS h/m/s wheel pickers)
 *   3. Pick a symbol          (12-icon grid)
 *
 * If the route is opened with a `?id=…` param, the form pre-fills with
 * that step's values and the Save button updates instead of adding.
 *
 * Design rules: principle 1 (simple first) — three numbered steps, no
 * disclosures here since each section is essential. Principle 9 — pickers
 * for controlled choices. Principle 13 — Save / Cancel each have one clear
 * action; haptic + screen change confirms.
 */

import React, { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
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
import { WheelPicker } from '../../src/components/native/WheelPicker';
import { colors, radii, spacing, typography } from '../../src/theme/tokens';
import { hapticSelection } from '../../src/utils/haptics';
import {
  FirstThenItem,
  addFirstThen,
  updateFirstThen,
  useFirstThenItems,
} from '../../src/features/first-then/store';

type SymbolOption = {
  name: React.ComponentProps<typeof Ionicons>['name'];
  color: string;
  label: string;
};

const SYMBOLS: SymbolOption[] = [
  { name: 'water-outline',         color: '#3DC1F2', label: 'Shower'   },
  { name: 'restaurant-outline',    color: '#FF8A3C', label: 'Eat'      },
  { name: 'bed-outline',           color: '#7B61FF', label: 'Sleep'    },
  { name: 'school-outline',        color: '#199AEE', label: 'School'   },
  { name: 'walk-outline',          color: '#34C759', label: 'Walk'     },
  { name: 'book-outline',          color: '#BD73FF', label: 'Read'     },
  { name: 'shirt-outline',         color: '#FF6B81', label: 'Dress'    },
  { name: 'happy-outline',         color: '#FFB020', label: 'Play'     },
  { name: 'medical-outline',       color: '#FF453A', label: 'Medicine' },
  { name: 'musical-notes-outline', color: '#AF52DE', label: 'Music'    },
  { name: 'car-outline',           color: '#5856D6', label: 'Travel'   },
  { name: 'sparkles-outline',      color: '#FFD700', label: 'Reward'   },
];

const HOURS    = Array.from({ length: 24 }, (_, i) => i);
const MINUTES  = Array.from({ length: 60 }, (_, i) => i);
const SECONDS  = Array.from({ length: 60 }, (_, i) => i);

const pad2 = (n: number) => String(n).padStart(2, '0');

function hexAlpha(hex: string, a: number): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

function findSymbolIndex(item: FirstThenItem | undefined): number | null {
  if (!item) return null;
  const idx = SYMBOLS.findIndex(s => s.name === item.symbol);
  return idx >= 0 ? idx : null;
}

export default function AddStepScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const items = useFirstThenItems();
  const editing = useMemo(
    () => (params.id ? items.find(i => i.id === params.id) : undefined),
    [params.id, items],
  );
  const isEdit = !!editing;

  const [name, setName] = useState<string>(editing?.name ?? '');
  const [hours, setHours] = useState<number>(editing?.hours ?? 0);
  const [minutes, setMinutes] = useState<number>(editing?.minutes ?? 0);
  const [seconds, setSeconds] = useState<number>(editing?.seconds ?? 0);
  const [symbolIndex, setSymbolIndex] = useState<number | null>(findSymbolIndex(editing));

  const canSave = name.trim().length > 0;

  const onSave = () => {
    if (!canSave) return;
    const sym = (symbolIndex != null ? SYMBOLS[symbolIndex] : SYMBOLS[0]) ?? SYMBOLS[0]!;
    if (isEdit && editing) {
      updateFirstThen(editing.id, {
        name: name.trim(),
        hours,
        minutes,
        seconds,
        symbol: sym.name,
        symbolColor: sym.color,
      });
    } else {
      addFirstThen({
        id: `ft-${Date.now()}`,
        name: name.trim(),
        hours,
        minutes,
        seconds,
        symbol: sym.name,
        symbolColor: sym.color,
      });
    }
    hapticSelection();
    router.back();
  };

  const selectedSym = symbolIndex != null ? SYMBOLS[symbolIndex] : null;
  const totalDuration = hours * 3600 + minutes * 60 + seconds;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={16}
          style={styles.headerIconBtn}
          accessibilityLabel="Cancel"
          accessibilityRole="button"
        >
          <Ionicons name="chevron-back" size={28} color={colors.primary} />
        </Pressable>
        <Text style={styles.headerTitle} accessibilityRole="header">
          {isEdit ? 'Edit Step' : 'Add Step'}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          bounces
          alwaysBounceVertical
          overScrollMode="always"
        >
          {/* Preview — neutral until the user picks a symbol, then live. */}
          <View style={styles.preview}>
            {selectedSym ? (
              <View
                style={[
                  styles.previewChip,
                  { backgroundColor: hexAlpha(selectedSym.color, 0.18) },
                ]}
              >
                <Ionicons name={selectedSym.name} size={56} color={selectedSym.color} />
              </View>
            ) : (
              <View style={styles.previewChipEmpty}>
                <Ionicons name="image-outline" size={40} color={colors.textTertiary} />
              </View>
            )}
            <Text style={styles.previewName} numberOfLines={1}>
              {name.trim() || (selectedSym ? 'Your step' : 'Pick a symbol below')}
            </Text>
            {totalDuration > 0 ? (
              <View style={styles.previewTimer}>
                <Ionicons name="time-outline" size={16} color={colors.primary} />
                <Text style={styles.previewTimerText}>
                  {hours > 0 ? `${hours}h ` : ''}{minutes > 0 ? `${minutes}m ` : ''}{seconds > 0 ? `${seconds}s` : ''}
                </Text>
              </View>
            ) : null}
          </View>

          {/* Section 1 — name */}
          <View style={styles.section}>
            <View style={styles.sectionHead}>
              <View style={styles.sectionNum}><Text style={styles.sectionNumText}>1</Text></View>
              <Text style={styles.sectionTitle}>What is the step?</Text>
            </View>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="e.g. Brush teeth"
              placeholderTextColor={colors.textTertiary}
              style={styles.input}
              autoCorrect={false}
              maxLength={40}
              returnKeyType="done"
              accessibilityLabel="Step name"
            />
          </View>

          {/* Section 2 — h/m/s pickers */}
          <View style={styles.section}>
            <View style={styles.sectionHead}>
              <View style={styles.sectionNum}><Text style={styles.sectionNumText}>2</Text></View>
              <Text style={styles.sectionTitle}>How long? (optional)</Text>
            </View>
            <View style={styles.wheelRow}>
              <WheelPicker
                values={HOURS}
                selectedValue={hours}
                onChange={setHours}
                label="Hour"
                format={(v) => pad2(v)}
                accessibilityLabel="Hours"
              />
              <Text style={styles.wheelSeparator}>:</Text>
              <WheelPicker
                values={MINUTES}
                selectedValue={minutes}
                onChange={setMinutes}
                label="Min"
                format={(v) => pad2(v)}
                accessibilityLabel="Minutes"
              />
              <Text style={styles.wheelSeparator}>:</Text>
              <WheelPicker
                values={SECONDS}
                selectedValue={seconds}
                onChange={setSeconds}
                label="Sec"
                format={(v) => pad2(v)}
                accessibilityLabel="Seconds"
              />
            </View>
            <Text style={styles.wheelHint}>
              Leave at 00:00:00 for a step that needs no timer.
            </Text>
          </View>

          {/* Section 3 — symbol */}
          <View style={styles.section}>
            <View style={styles.sectionHead}>
              <View style={styles.sectionNum}><Text style={styles.sectionNumText}>3</Text></View>
              <Text style={styles.sectionTitle}>Pick a symbol</Text>
            </View>
            <View style={styles.symbolGrid}>
              {SYMBOLS.map((s, idx) => {
                const active = idx === symbolIndex;
                return (
                  <Pressable
                    key={`${s.name}-${idx}`}
                    onPress={() => {
                      hapticSelection();
                      setSymbolIndex(idx);
                    }}
                    style={({ pressed }) => [
                      styles.symbolTile,
                      active && { borderColor: s.color, borderWidth: 3 },
                      pressed && { opacity: 0.85 },
                    ]}
                    accessibilityLabel={s.label}
                    accessibilityState={{ selected: active }}
                    accessibilityRole="button"
                  >
                    <View
                      style={[
                        styles.symbolTileBg,
                        { backgroundColor: hexAlpha(s.color, 0.15) },
                      ]}
                    >
                      <Ionicons name={s.name} size={34} color={s.color} />
                    </View>
                    <Text style={styles.symbolTileLabel}>{s.label}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <Pressable
            onPress={onSave}
            disabled={!canSave}
            style={({ pressed }) => [
              styles.saveBtn,
              !canSave && styles.saveBtnDisabled,
              canSave && pressed && { opacity: 0.85 },
            ]}
            accessibilityLabel={isEdit ? 'Save changes' : 'Save step'}
            accessibilityRole="button"
            accessibilityState={{ disabled: !canSave }}
          >
            <Ionicons
              name="checkmark"
              size={22}
              color={canSave ? colors.surface : colors.textTertiary}
            />
            <Text style={[styles.saveBtnText, !canSave && { color: colors.textTertiary }]}>
              {isEdit ? 'Save Changes' : 'Save Step'}
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
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
  },
  headerIconBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
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
    gap: spacing.xl,
  },

  preview: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.lg,
  },
  previewChipEmpty: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewChip: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewName: {
    fontSize: typography.heading,
    fontWeight: '800',
    color: colors.text,
    marginTop: spacing.xs,
    letterSpacing: typography.trackHeading,
    maxWidth: '90%',
  },
  previewTimer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#E6F4FD',
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radii.pill,
  },
  previewTimerText: {
    fontSize: typography.callout,
    fontWeight: '700',
    color: colors.primary,
  },

  section: { gap: spacing.md },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  sectionNum: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionNumText: {
    color: colors.surface,
    fontWeight: '900',
    fontSize: typography.callout,
  },
  sectionTitle: {
    fontSize: typography.subheading,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: typography.trackSubhead,
  },

  input: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    paddingHorizontal: spacing.lg,
    paddingVertical: 16,
    fontSize: typography.body,
    color: colors.text,
    minHeight: 56,
  },

  wheelRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  wheelSeparator: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.textTertiary,
    paddingBottom: 50,
  },
  wheelHint: {
    fontSize: typography.caption,
    color: colors.textMuted,
    textAlign: 'center',
  },

  symbolGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  symbolTile: {
    width: '30%',
    aspectRatio: 0.95,
    padding: 6,
    borderRadius: radii.card,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  symbolTileBg: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  symbolTileLabel: {
    fontSize: typography.caption,
    fontWeight: '700',
    color: colors.text,
  },

  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    paddingVertical: 18,
    borderRadius: radii.pill,
    minHeight: 60,
    marginTop: spacing.md,
  },
  saveBtnDisabled: {
    backgroundColor: colors.disabled,
  },
  saveBtnText: {
    color: colors.surface,
    fontSize: typography.body,
    fontWeight: '800',
  },
});
