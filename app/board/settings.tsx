/**
 * Board Settings — first safe version (shell).
 *
 * Simple settings are visible immediately; advanced customisation lives in
 * expandable disclosure sections (rules 1 + 3 — simple first, expandable
 * detail). Values are held in local state for this pass and are NOT yet
 * wired into board rendering or persistence — that lands with the board
 * appearance engine in a follow-up.
 *
 * Every control is ≥44pt (rows are 50pt+), labelled for VoiceOver, and
 * expansion animates gently unless Reduce Motion is on (rule 18).
 */

import React, { useCallback, useState } from 'react';
import {
  LayoutAnimation,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  UIManager,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { Icon } from '../../src/components/native/Icon';
import { radii, spacing, symbolColors, typography } from '../../src/theme/tokens';
import { hapticSelection } from '../../src/utils/haptics';
import { useReduceMotion } from '../../src/hooks/useReduceMotion';
import { useTheme } from '../../src/theme/useTheme';
import { useAppContext } from '../../src/hooks/useAppContext';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// ─── Option data ──────────────────────────────────────────────────────────────

type SizeChoice = 'small' | 'medium' | 'large';
type SpacingChoice = 'compact' | 'standard' | 'roomy';
type DensityChoice = 'cosy' | 'balanced' | 'open';

const SIZE_OPTIONS: { key: SizeChoice; label: string }[] = [
  { key: 'small', label: 'Small' },
  { key: 'medium', label: 'Medium' },
  { key: 'large', label: 'Large' },
];

const SPACING_OPTIONS: { key: SpacingChoice; label: string }[] = [
  { key: 'compact', label: 'Compact' },
  { key: 'standard', label: 'Standard' },
  { key: 'roomy', label: 'Roomy' },
];

const DENSITY_OPTIONS: { key: DensityChoice; label: string }[] = [
  { key: 'cosy', label: 'Cosy' },
  { key: 'balanced', label: 'Balanced' },
  { key: 'open', label: 'Open' },
];

/** Calm palette drawn from the AAC word-type tokens — no new hex. */
const COLOUR_OPTIONS: { key: string; label: string; hex: string }[] = [
  { key: 'noun', label: 'Yellow', hex: symbolColors.noun },
  { key: 'verb', label: 'Green', hex: symbolColors.verb },
  { key: 'adjective', label: 'Blue', hex: symbolColors.adjective },
  { key: 'pronoun', label: 'Purple', hex: symbolColors.pronoun },
  { key: 'social', label: 'Pink', hex: symbolColors.social },
];

// ─── Reusable rows ────────────────────────────────────────────────────────────

/** Three-way segmented choice — each segment ≥44pt tall. */
function ChoiceRow<T extends string>({
  label, options, value, onChange,
}: {
  label: string;
  options: { key: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  const t = useTheme();
  return (
    <View style={styles.settingRow}>
      <Text style={[styles.settingLabel, { color: t.colors.text }]}>{label}</Text>
      <View style={styles.choiceGroup} accessibilityRole="radiogroup">
        {options.map(opt => {
          const active = opt.key === value;
          return (
            <Pressable
              key={opt.key}
              onPress={() => { hapticSelection(); onChange(opt.key); }}
              accessibilityRole="radio"
              accessibilityLabel={`${opt.label} ${label.toLowerCase()}`}
              accessibilityState={{ selected: active }}
              style={({ pressed }) => [
                styles.choicePill,
                {
                  backgroundColor: active ? t.colors.primary : t.colors.input,
                },
                pressed && { opacity: 0.8 },
              ]}
            >
              <Text
                style={[
                  styles.choicePillText,
                  { color: active ? '#FFFFFF' : t.colors.text },
                ]}
              >
                {opt.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

/** Colour swatch choice — 44pt swatches, selection shown by ring + check. */
function ColourRow({
  label, value, onChange,
}: {
  label: string;
  value: string;
  onChange: (key: string) => void;
}) {
  const t = useTheme();
  return (
    <View style={styles.settingRow}>
      <Text style={[styles.settingLabel, { color: t.colors.text }]}>{label}</Text>
      <View style={styles.swatchGroup} accessibilityRole="radiogroup">
        {COLOUR_OPTIONS.map(opt => {
          const active = opt.key === value;
          return (
            <Pressable
              key={opt.key}
              onPress={() => { hapticSelection(); onChange(opt.key); }}
              accessibilityRole="radio"
              accessibilityLabel={`${opt.label} ${label.toLowerCase()}`}
              accessibilityState={{ selected: active }}
              style={({ pressed }) => [
                styles.swatch,
                { backgroundColor: opt.hex },
                active && { borderWidth: 3, borderColor: t.colors.text },
                pressed && { opacity: 0.8 },
              ]}
            >
              {active ? (
                <Icon name="checkmark" size={20} color={t.colors.text} />
              ) : null}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

/** Boolean setting — native Switch (rule 8). */
function ToggleRow({
  label, value, onChange,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  const t = useTheme();
  return (
    <View style={[styles.settingRow, styles.toggleRow]}>
      <Text style={[styles.settingLabel, { color: t.colors.text }]}>{label}</Text>
      <Switch
        value={value}
        onValueChange={(v) => { hapticSelection(); onChange(v); }}
        trackColor={{ true: t.colors.primary, false: t.colors.progressTrack }}
        accessibilityLabel={label}
        accessibilityRole="switch"
        accessibilityState={{ checked: value }}
      />
    </View>
  );
}

/** Stepper for exact sizing — both buttons 44pt. */
function StepperRow({
  label, value, min, max, step, unit, onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  onChange: (v: number) => void;
}) {
  const t = useTheme();
  const dec = () => { hapticSelection(); onChange(Math.max(min, value - step)); };
  const inc = () => { hapticSelection(); onChange(Math.min(max, value + step)); };
  return (
    <View style={[styles.settingRow, styles.toggleRow]}>
      <Text style={[styles.settingLabel, { color: t.colors.text }]}>{label}</Text>
      <View style={styles.stepper}>
        <Pressable
          onPress={dec}
          disabled={value <= min}
          accessibilityRole="button"
          accessibilityLabel={`Decrease ${label.toLowerCase()}`}
          accessibilityState={{ disabled: value <= min }}
          style={({ pressed }) => [
            styles.stepBtn,
            { backgroundColor: t.colors.input },
            value <= min && { opacity: 0.4 },
            pressed && { opacity: 0.7 },
          ]}
        >
          <Icon name="remove" size={22} color={t.colors.text} />
        </Pressable>
        <Text style={[styles.stepValue, { color: t.colors.text }]}>
          {value}{unit}
        </Text>
        <Pressable
          onPress={inc}
          disabled={value >= max}
          accessibilityRole="button"
          accessibilityLabel={`Increase ${label.toLowerCase()}`}
          accessibilityState={{ disabled: value >= max }}
          style={({ pressed }) => [
            styles.stepBtn,
            { backgroundColor: t.colors.input },
            value >= max && { opacity: 0.4 },
            pressed && { opacity: 0.7 },
          ]}
        >
          <Icon name="add" size={22} color={t.colors.text} />
        </Pressable>
      </View>
    </View>
  );
}

/** Expandable disclosure section (rule 3). */
function DisclosureSection({
  title, expanded, onToggle, children,
}: {
  title: string;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  const t = useTheme();
  return (
    <View style={[styles.card, { backgroundColor: t.colors.surface }]}>
      <Pressable
        onPress={onToggle}
        accessibilityRole="button"
        accessibilityLabel={title}
        accessibilityHint={expanded ? 'Collapses this section' : 'Expands this section'}
        accessibilityState={{ expanded }}
        style={({ pressed }) => [styles.disclosureHeader, pressed && { opacity: 0.7 }]}
      >
        <Text style={[styles.disclosureTitle, { color: t.colors.text }]}>{title}</Text>
        <Icon
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={22}
          color={t.colors.textMuted}
        />
      </Pressable>
      {expanded ? <View style={styles.disclosureBody}>{children}</View> : null}
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function BoardSettingsScreen() {
  const t = useTheme();
  const router = useRouter();
  const reduceMotion = useReduceMotion();
  const { state, dispatch } = useAppContext();

  // ── Simple settings (visible) — local state only in this pass ──
  const [symbolSize, setSymbolSize] = useState<SizeChoice>('medium');
  const [textSize, setTextSize] = useState<SizeChoice>('medium');
  const [folderColour, setFolderColour] = useState('adjective');
  const [labelsVisible, setLabelsVisible] = useState(true);
  const [tileSpacing, setTileSpacing] = useState<SpacingChoice>('standard');

  // ── Advanced settings (expandable) ──
  const [textColour, setTextColour] = useState('noun');
  const [tileColour, setTileColour] = useState('verb');
  const [exactTilePt, setExactTilePt] = useState(88);
  const [exactTextPt, setExactTextPt] = useState(17);
  const [density, setDensity] = useState<DensityChoice>('balanced');

  const [openSection, setOpenSection] = useState<string | null>(null);
  const toggleSection = useCallback((key: string) => {
    hapticSelection();
    if (!reduceMotion) {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    }
    setOpenSection(prev => (prev === key ? null : key));
  }, [reduceMotion]);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: t.colors.background }]} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header — Back + large bold title */}
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={16}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          style={styles.headerIconBtn}
        >
          <Icon name="chevron-back" size={28} color={t.colors.primary} />
        </Pressable>
        <Text
          style={[styles.title, { color: t.colors.text }]}
          accessibilityRole="header"
        >
          Board Settings
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        bounces
        alwaysBounceVertical
        overScrollMode="always"
      >
        {/* Note — settings preview only in this version */}
        <Text style={[styles.note, { color: t.colors.textMuted }]}>
          Choose how your board looks. These options will apply to the Talk
          board in an upcoming update.
        </Text>

        {/* ── Simple settings ── */}
        <Text style={[styles.eyebrow, { color: t.colors.textMuted }]}>APPEARANCE</Text>
        <View style={[styles.card, { backgroundColor: t.colors.surface }]}>
          <ChoiceRow label="Symbol size" options={SIZE_OPTIONS} value={symbolSize} onChange={setSymbolSize} />
          <View style={[styles.divider, { backgroundColor: t.colors.background }]} />
          <ChoiceRow label="Text size" options={SIZE_OPTIONS} value={textSize} onChange={setTextSize} />
          <View style={[styles.divider, { backgroundColor: t.colors.background }]} />
          <ColourRow label="Folder colour" value={folderColour} onChange={setFolderColour} />
          <View style={[styles.divider, { backgroundColor: t.colors.background }]} />
          <ToggleRow label="Show labels" value={labelsVisible} onChange={setLabelsVisible} />
          <View style={[styles.divider, { backgroundColor: t.colors.background }]} />
          <ChoiceRow label="Tile spacing" options={SPACING_OPTIONS} value={tileSpacing} onChange={setTileSpacing} />
        </View>

        {/* ── Advanced (expandable) ── */}
        <Text style={[styles.eyebrow, { color: t.colors.textMuted }]}>ADVANCED</Text>

        <DisclosureSection
          title="Text colour"
          expanded={openSection === 'textColour'}
          onToggle={() => toggleSection('textColour')}
        >
          <ColourRow label="Text colour" value={textColour} onChange={setTextColour} />
        </DisclosureSection>

        <DisclosureSection
          title="Tile colour"
          expanded={openSection === 'tileColour'}
          onToggle={() => toggleSection('tileColour')}
        >
          <ColourRow label="Tile colour" value={tileColour} onChange={setTileColour} />
        </DisclosureSection>

        <DisclosureSection
          title="Exact sizing"
          expanded={openSection === 'sizing'}
          onToggle={() => toggleSection('sizing')}
        >
          <StepperRow label="Tile size" value={exactTilePt} min={66} max={132} step={11} unit="pt" onChange={setExactTilePt} />
          <View style={[styles.divider, { backgroundColor: t.colors.background }]} />
          <StepperRow label="Text size" value={exactTextPt} min={13} max={28} step={1} unit="pt" onChange={setExactTextPt} />
        </DisclosureSection>

        <DisclosureSection
          title="Layout density"
          expanded={openSection === 'density'}
          onToggle={() => toggleSection('density')}
        >
          <ChoiceRow label="Density" options={DENSITY_OPTIONS} value={density} onChange={setDensity} />
        </DisclosureSection>

        <DisclosureSection
          title="Advanced board configuration"
          expanded={openSection === 'boardConfig'}
          onToggle={() => toggleSection('boardConfig')}
        >
          <Text style={[styles.comingSoon, { color: t.colors.textMuted }]}>
            Board layouts, grid columns, and per-board overrides are coming in
            a later update.
          </Text>
        </DisclosureSection>

        {/* ── Board Health ── */}
        <Text style={[styles.eyebrow, { color: t.colors.textMuted }]}>DIAGNOSTICS</Text>
        <View style={[styles.card, { backgroundColor: t.colors.surface }]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Run board health check"
            onPress={() => router.push('/board/health')}
            style={({ pressed }) => [styles.healthRow, pressed && { opacity: 0.7 }]}
          >
            <Text style={{ fontSize: typography.body, fontWeight: '600', color: t.colors.text }}>Board Health</Text>
            <Icon name="chevron-forward" size={22} color={t.colors.textMuted} />
          </Pressable>
          <View style={[styles.divider, { backgroundColor: t.colors.background }]} />
          <ToggleRow
            label="Show usage heatmap"
            value={state.showUsageHeatmap}
            onChange={(v) => dispatch({ type: 'SET_SHOW_USAGE_HEATMAP', payload: v })}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  headerIconBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerSpacer: { width: 44 },
  title: {
    flex: 1,
    fontSize: typography.title,
    fontFamily: typography.fontFamilyDisplay,
    fontWeight: typography.weightTitle,
    letterSpacing: typography.trackTitle,
    textAlign: 'center',
  },

  scroll: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.md,
  },

  note: {
    fontSize: typography.callout,
    lineHeight: 21,
  },
  eyebrow: {
    fontSize: typography.eyebrow,
    fontWeight: typography.weightEyebrow,
    letterSpacing: typography.trackEyebrow,
    marginTop: spacing.sm,
  },

  card: {
    borderRadius: radii.card,
    paddingHorizontal: spacing.lg,
    overflow: 'hidden',
  },
  divider: { height: 1.5 },

  settingRow: {
    paddingVertical: spacing.md,
    gap: spacing.sm,
    minHeight: 50,
    justifyContent: 'center',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  healthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 50,
    paddingVertical: spacing.md,
  },
  settingLabel: {
    fontSize: typography.body,
    fontWeight: '700',
  },

  choiceGroup: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  choicePill: {
    flex: 1,
    minHeight: 44,
    borderRadius: radii.button,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
  },
  choicePillText: {
    fontSize: typography.callout,
    fontWeight: '700',
  },

  swatchGroup: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  swatch: {
    width: 44,
    height: 44,
    borderRadius: radii.button,
    alignItems: 'center',
    justifyContent: 'center',
  },

  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  stepBtn: {
    width: 44,
    height: 44,
    borderRadius: radii.button,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepValue: {
    fontSize: typography.body,
    fontWeight: '800',
    minWidth: 56,
    textAlign: 'center',
  },

  disclosureHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 54,
    paddingVertical: spacing.sm,
  },
  disclosureTitle: {
    fontSize: typography.body,
    fontWeight: '700',
  },
  disclosureBody: {
    paddingBottom: spacing.sm,
  },
  comingSoon: {
    fontSize: typography.callout,
    lineHeight: 21,
    paddingBottom: spacing.md,
  },
});
