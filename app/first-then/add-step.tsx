/**
 * Add Step — separate page so the flow is one decision at a time. The page
 * walks the user through three labelled sections: name, optional timer,
 * symbol. Sizing and contrast are tuned for accessibility — labels are
 * eyebrow-style, inputs and tappable chips are large.
 */

import React, { useState } from 'react';
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
import { Stack, useRouter } from 'expo-router';
import { colors, radii, spacing, typography } from '../../src/theme/tokens';
import { hapticSelection } from '../../src/utils/haptics';
import { addFirstThen } from '../../src/features/first-then/store';

type SymbolOption = {
  name: React.ComponentProps<typeof Ionicons>['name'];
  color: string;
  label: string;
};

// Twelve curated symbols cover the common daily-routine concepts and match
// the visual cue style used elsewhere in the planner.
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

const TIMER_PRESETS: Array<number | null> = [null, 1, 2, 5, 10, 15, 20, 30];

function hexAlpha(hex: string, a: number): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

export default function AddStepScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [minutes, setMinutes] = useState<number | null>(null);
  const [symbolIndex, setSymbolIndex] = useState<number>(0);

  const canSave = name.trim().length > 0;

  const onSave = () => {
    if (!canSave) return;
    const sym = SYMBOLS[symbolIndex] ?? SYMBOLS[0]!;
    addFirstThen({
      id: `ft-${Date.now()}`,
      name: name.trim(),
      minutes: minutes ?? undefined,
      symbol: sym.name,
      symbolColor: sym.color,
    });
    hapticSelection();
    router.back();
  };

  const selectedSym = SYMBOLS[symbolIndex] ?? SYMBOLS[0]!;

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
        <Text style={styles.headerTitle} accessibilityRole="header">Add Step</Text>
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
          {/* Preview — gives the user instant visual feedback as they fill the form. */}
          <View style={styles.preview}>
            <View
              style={[
                styles.previewChip,
                { backgroundColor: hexAlpha(selectedSym.color, 0.18) },
              ]}
            >
              <Ionicons name={selectedSym.name} size={56} color={selectedSym.color} />
            </View>
            <Text style={styles.previewName} numberOfLines={1}>
              {name.trim() || 'Your step'}
            </Text>
            {minutes != null && (
              <View style={styles.previewTimer}>
                <Ionicons name="timer-outline" size={16} color={colors.primary} />
                <Text style={styles.previewTimerText}>{minutes} min</Text>
              </View>
            )}
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
              placeholder="e.g. Eat breakfast"
              placeholderTextColor={colors.textTertiary}
              style={styles.input}
              autoCorrect={false}
              maxLength={40}
              returnKeyType="done"
              accessibilityLabel="Step name"
            />
          </View>

          {/* Section 2 — timer */}
          <View style={styles.section}>
            <View style={styles.sectionHead}>
              <View style={styles.sectionNum}><Text style={styles.sectionNumText}>2</Text></View>
              <Text style={styles.sectionTitle}>How long? (optional)</Text>
            </View>
            <View style={styles.chipRow}>
              {TIMER_PRESETS.map(m => {
                const active = minutes === m;
                const label = m == null ? 'No timer' : `${m} min`;
                return (
                  <Pressable
                    key={String(m)}
                    onPress={() => {
                      hapticSelection();
                      setMinutes(m);
                    }}
                    style={({ pressed }) => [
                      styles.timerChip,
                      active && styles.timerChipActive,
                      pressed && { opacity: 0.85 },
                    ]}
                    accessibilityLabel={label}
                    accessibilityState={{ selected: active }}
                    accessibilityRole="button"
                  >
                    <Text style={[styles.timerChipText, active && styles.timerChipTextActive]}>
                      {label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
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
            accessibilityLabel="Save step"
            accessibilityRole="button"
            accessibilityState={{ disabled: !canSave }}
          >
            <Ionicons
              name="checkmark"
              size={22}
              color={canSave ? colors.surface : colors.textTertiary}
            />
            <Text style={[styles.saveBtnText, !canSave && { color: colors.textTertiary }]}>
              Save Step
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },

  // Header
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
    gap: spacing.xl,
  },

  // Preview
  preview: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.lg,
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

  // Section
  section: {
    gap: spacing.md,
  },
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

  // Name input — filled, no idle border. Focus state could add a border in
  // future, but the filled background already reads as input clearly.
  input: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    paddingHorizontal: spacing.lg,
    paddingVertical: 16,
    fontSize: typography.body,
    color: colors.text,
    minHeight: 56,
  },

  // Timer chips
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  timerChip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: 12,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    minHeight: 48,
    justifyContent: 'center',
  },
  timerChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  timerChipText: {
    fontSize: typography.callout,
    fontWeight: '700',
    color: colors.text,
  },
  timerChipTextActive: {
    color: colors.surface,
  },

  // Symbol grid
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

  // Save
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
