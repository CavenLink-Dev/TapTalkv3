/**
 * Accessibility & Display — the single home for every visual, motor, and
 * sensory setting. Reached from Profile → Accessibility (one way in, no
 * duplicate entry points).
 *
 * Layout:
 *   • Quick Setup presets — one-tap bundles; individual controls stay editable.
 *   • VISION   — text size, theme, high contrast.
 *   • MOTOR    — button size, haptic feedback + strength.
 *   • SENSORY  — reduce sensory load, in-app reduce motion, activity sounds.
 *   • ADVANCED — hidden behind a toggle (off by default, persisted):
 *                symbol colours, motor access mode, usage heatmap, VoiceOver.
 *
 * Every control mutates AppContext (or its feature store) directly, so a
 * change applies across the whole app the moment it's tapped.
 */

import React, { useCallback, useEffect, useState } from 'react';
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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../../src/components/native/Card';
import { useAppContext } from '../../src/hooks/useAppContext';
import { useSystemReduceMotion } from '../../src/hooks/useReduceMotion';
import { useTheme } from '../../src/theme/useTheme';
import { radii, spacing, typography } from '../../src/theme/tokens';
import { fonts } from '../../src/theme/fonts';
import { hapticSelection, hapticSuccess } from '../../src/utils/haptics';
import {
  setActivitySfxEnabled,
  useActivitySfx,
} from '../../src/features/activities/sound-settings';
import type { AppState } from '../../src/context/types';

type TextSize = AppState['accessibility']['textSize'];
type ButtonSize = AppState['accessibility']['buttonSize'];
type Theme = AppState['accessibility']['theme'];
type HapticStrength = AppState['accessibility']['hapticStrength'];

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

const SHOW_ADVANCED_KEY = '@taptalk/settings/showAdvanced/v1';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const TEXT_SIZE_OPTIONS: { label: string; value: TextSize; preview: number }[] = [
  { label: 'Default', value: 'default', preview: 15 },
  { label: 'Large', value: 'large', preview: 18 },
  { label: 'Extra Large', value: 'xlarge', preview: 21 },
  { label: 'Maximum', value: 'maximum', preview: 24 },
];

const BUTTON_SIZE_OPTIONS: { label: string; value: ButtonSize; hint: string }[] = [
  { label: 'Standard', value: 'standard', hint: '44 pt minimum tap targets' },
  { label: 'Large', value: 'large', hint: 'Bigger buttons for easier tapping' },
];

const THEME_OPTIONS: { label: string; value: Theme; icon: IoniconName }[] = [
  { label: 'Light', value: 'light', icon: 'sunny-outline' },
  { label: 'Dark', value: 'dark', icon: 'moon-outline' },
  { label: 'System', value: 'system', icon: 'phone-portrait-outline' },
];

const HAPTIC_STRENGTH_OPTIONS: { label: string; value: HapticStrength; hint: string }[] = [
  { label: 'Gentle', value: 'gentle', hint: 'Softest cues' },
  { label: 'Standard', value: 'standard', hint: 'Default feel' },
  { label: 'Strong', value: 'strong', hint: 'Firmer cues' },
];

// One-tap accessibility starting points (moved here from the Profile tab so
// presets and the controls they change live on the same page).
type AccessibilityPatch = Partial<AppState['accessibility']>;

const ACCESS_PRESETS: { id: string; label: string; icon: IoniconName; patch: AccessibilityPatch }[] = [
  {
    id: 'default',
    label: 'Default',
    icon: 'refresh-outline',
    patch: {
      textSize: 'default',
      buttonSize: 'standard',
      highContrast: false,
      reduceSensoryLoad: false,
      reduceMotionOverride: false,
      hapticsEnabled: true,
      hapticStrength: 'standard',
      motorAccessMode: false,
    },
  },
  {
    id: 'lowVision',
    label: 'Low Vision',
    icon: 'eye-outline',
    patch: { textSize: 'xlarge', buttonSize: 'large', highContrast: true },
  },
  {
    id: 'motor',
    label: 'Motor',
    icon: 'hand-left-outline',
    patch: {
      textSize: 'large',
      buttonSize: 'large',
      motorAccessMode: true,
      hapticsEnabled: true,
      hapticStrength: 'strong',
    },
  },
  {
    id: 'calm',
    label: 'Calm',
    icon: 'leaf-outline',
    patch: {
      reduceSensoryLoad: true,
      reduceMotionOverride: true,
      hapticsEnabled: false,
      highContrast: false,
      textSize: 'default',
    },
  },
];

// ── Small shared pieces ─────────────────────────────────────────────────────

function SectionTitle({ label, desc }: { label: string; desc?: string }) {
  const t = useTheme();
  return (
    <>
      <Text
        accessibilityRole="header"
        style={[styles.sectionTitle, { color: t.colors.textTertiary }]}
      >
        {label}
      </Text>
      {desc ? (
        <Text style={[styles.sectionDesc, { color: t.colors.textMuted }]}>{desc}</Text>
      ) : null}
    </>
  );
}

function ToggleRow({
  title,
  desc,
  value,
  onChange,
  first,
  disabled,
}: {
  title: string;
  desc: string;
  value: boolean;
  onChange: (v: boolean) => void;
  first?: boolean;
  disabled?: boolean;
}) {
  const t = useTheme();
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityLabel={title}
      accessibilityHint={desc}
      accessibilityState={{ checked: value, disabled }}
      disabled={disabled}
      onPress={() => onChange(!value)}
      style={({ pressed }) => [
        styles.toggleRow,
        !first && [styles.toggleRowDivider, { borderTopColor: t.colors.border }],
        pressed && { opacity: 0.75 },
        disabled && { opacity: 0.45 },
      ]}
    >
      <View style={styles.toggleLeft}>
        <Text style={[styles.toggleTitle, { color: t.colors.text }]}>{title}</Text>
        <Text style={[styles.toggleDesc, { color: t.colors.textMuted }]}>{desc}</Text>
      </View>
      <View pointerEvents="none" importantForAccessibility="no">
        <Switch
          value={value}
          disabled={disabled}
          trackColor={{ false: t.colors.disabled, true: t.colors.primary }}
          thumbColor={t.colors.surface}
          ios_backgroundColor={t.colors.disabled}
        />
      </View>
    </Pressable>
  );
}

function RadioOption({
  selected,
  onPress,
  accessibilityLabel,
  children,
}: {
  selected: boolean;
  onPress: () => void;
  accessibilityLabel: string;
  children: React.ReactNode;
}) {
  const t = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [
        styles.option,
        { borderColor: t.colors.border, backgroundColor: t.colors.surface },
        selected && { borderColor: t.colors.primary, backgroundColor: t.colors.selectionBg },
        pressed && { opacity: 0.8 },
      ]}
    >
      {children}
      {selected ? <Ionicons name="checkmark-circle" size={22} color={t.colors.primary} /> : null}
    </Pressable>
  );
}

// ── Screen ──────────────────────────────────────────────────────────────────

export default function DisplaySettingsScreen() {
  const router = useRouter();
  const systemReduceMotion = useSystemReduceMotion();
  const { state, dispatch } = useAppContext();
  const t = useTheme();
  const {
    textSize,
    buttonSize,
    highContrast,
    theme,
    colorScheme,
    hapticsEnabled,
    hapticStrength,
    reduceMotionOverride,
    motorAccessMode,
    reduceSensoryLoad,
  } = state.accessibility;

  const sfxEnabled = useActivitySfx();
  const [saveNotice, setSaveNotice] = useState('');

  // Advanced settings hidden by default; the choice persists.
  const [showAdvanced, setShowAdvanced] = useState(false);
  useEffect(() => {
    AsyncStorage.getItem(SHOW_ADVANCED_KEY)
      .then((raw) => {
        if (raw === 'true') setShowAdvanced(true);
      })
      .catch(() => {});
  }, []);

  const setAccessibility = useCallback(
    (payload: AccessibilityPatch) => {
      hapticSelection();
      dispatch({ type: 'SET_ACCESSIBILITY', payload });
    },
    [dispatch],
  );

  const showSaved = useCallback((message: string) => {
    setSaveNotice(message);
    hapticSuccess();
    setTimeout(() => setSaveNotice(''), 2000);
  }, []);

  const applyPreset = useCallback(
    (preset: (typeof ACCESS_PRESETS)[number]) => {
      dispatch({ type: 'SET_ACCESSIBILITY', payload: preset.patch });
      showSaved(`${preset.label} applied`);
    },
    [dispatch, showSaved],
  );

  // LayoutAnimation guard — respect both system and in-app reduce motion.
  const effectiveReduceMotion = systemReduceMotion || reduceMotionOverride;

  const toggleAdvanced = useCallback((next: boolean) => {
    hapticSelection();
    if (!effectiveReduceMotion) {
      LayoutAnimation.configureNext({
        duration: 200,
        create: { type: 'easeInEaseOut', property: 'opacity' },
        update: { type: 'easeInEaseOut' },
        delete: { type: 'easeInEaseOut', property: 'opacity' },
      });
    }
    setShowAdvanced(next);
    AsyncStorage.setItem(SHOW_ADVANCED_KEY, next ? 'true' : 'false').catch(() => {});
  }, [effectiveReduceMotion]);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: t.colors.background }]} edges={['top']}>
      <View style={[styles.header, { backgroundColor: t.colors.surface, borderBottomColor: t.colors.border }]}>
        <Pressable
          onPress={() => { hapticSelection(); router.back(); }}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          style={({ pressed }) => [styles.backButton, pressed && { opacity: 0.6 }]}
        >
          <Ionicons name="chevron-back" size={26} color={t.colors.primary} />
        </Pressable>
        <Text accessibilityRole="header" style={[styles.headerTitle, { color: t.colors.text }]}>
          Accessibility &amp; Display
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        bounces
        alwaysBounceVertical
        overScrollMode="always"
      >
        <Text style={[styles.pageIntro, { color: t.colors.textMuted }]}>
          Everything here applies across the whole app the moment you change it,
          and is saved on this device.
        </Text>

        {saveNotice ? (
          <Text
            style={[styles.saveNotice, { color: t.colors.success }]}
            accessibilityLiveRegion="polite"
            accessibilityRole="alert"
          >
            {saveNotice}
          </Text>
        ) : null}

        {/* ── Quick Setup ── */}
        <Card style={styles.section}>
          <SectionTitle
            label="QUICK SETUP"
            desc="A one-tap starting point. You can still adjust anything below."
          />
          <View style={styles.presetGrid}>
            {ACCESS_PRESETS.map((preset) => (
              <Pressable
                key={preset.id}
                accessibilityRole="button"
                accessibilityLabel={`Apply ${preset.label} accessibility preset`}
                accessibilityHint="Sets several accessibility options at once"
                onPress={() => {
                  hapticSelection();
                  applyPreset(preset);
                }}
                style={({ pressed }) => [
                  styles.presetTile,
                  { backgroundColor: t.colors.input },
                  pressed && { opacity: 0.7 },
                ]}
              >
                <Ionicons name={preset.icon} size={22} color={t.colors.primary} />
                <Text style={[styles.presetLabel, { color: t.colors.text }]} numberOfLines={1}>
                  {preset.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </Card>

        {/* ── VISION ── */}
        <Card style={styles.section}>
          <SectionTitle
            label="VISION"
            desc="Reading comfort — size, theme, and contrast."
          />

          <Text style={[styles.subLabel, { color: t.colors.textMuted }]}>Text Size</Text>
          <View style={styles.optionGroup}>
            {TEXT_SIZE_OPTIONS.map((opt) => (
              <RadioOption
                key={opt.value}
                selected={textSize === opt.value}
                onPress={() => setAccessibility({ textSize: opt.value })}
                accessibilityLabel={`Text size ${opt.label}`}
              >
                <Text
                  style={[
                    styles.previewText,
                    { fontSize: opt.preview, color: textSize === opt.value ? t.colors.primary : t.colors.text },
                  ]}
                >
                  {opt.label}
                </Text>
              </RadioOption>
            ))}
          </View>

          <Text style={[styles.subLabel, { color: t.colors.textMuted }]}>Theme</Text>
          <View style={styles.themeRow}>
            {THEME_OPTIONS.map((opt) => {
              const selected = theme === opt.value;
              return (
                <Pressable
                  key={opt.value}
                  onPress={() => setAccessibility({ theme: opt.value })}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: selected }}
                  accessibilityLabel={`${opt.label} theme`}
                  style={({ pressed }) => [
                    styles.themeOption,
                    { borderColor: t.colors.border, backgroundColor: t.colors.surface },
                    selected && { borderColor: t.colors.primary, backgroundColor: t.colors.selectionBg },
                    pressed && { opacity: 0.8 },
                  ]}
                >
                  <Ionicons name={opt.icon} size={24} color={selected ? t.colors.primary : t.colors.textMuted} />
                  <Text style={[styles.themeLabel, { color: selected ? t.colors.primary : t.colors.textMuted }]}>
                    {opt.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <ToggleRow
            title="High Contrast"
            desc="Heavier borders and stronger text colour for clearer separation."
            value={highContrast}
            onChange={(v) => setAccessibility({ highContrast: v })}
          />
        </Card>

        {/* ── MOTOR ── */}
        <Card style={styles.section}>
          <SectionTitle
            label="MOTOR"
            desc="Easier tapping and physical feedback."
          />

          <Text style={[styles.subLabel, { color: t.colors.textMuted }]}>Button Size</Text>
          <View style={styles.optionGroup}>
            {BUTTON_SIZE_OPTIONS.map((opt) => (
              <RadioOption
                key={opt.value}
                selected={buttonSize === opt.value}
                onPress={() => setAccessibility({ buttonSize: opt.value })}
                accessibilityLabel={`Button size ${opt.label}. ${opt.hint}`}
              >
                <View style={styles.optionCopy}>
                  <Text
                    style={[styles.previewText, { color: buttonSize === opt.value ? t.colors.primary : t.colors.text }]}
                  >
                    {opt.label}
                  </Text>
                  <Text style={[styles.optionHint, { color: t.colors.textMuted }]}>{opt.hint}</Text>
                </View>
              </RadioOption>
            ))}
          </View>

          <ToggleRow
            title="Haptic Feedback"
            desc="A light vibration when you tap buttons and symbol tiles."
            value={hapticsEnabled}
            onChange={(v) => {
              // Fire the cue while enabling so the user feels the change.
              dispatch({ type: 'SET_ACCESSIBILITY', payload: { hapticsEnabled: v } });
              if (v) hapticSelection();
            }}
          />

          <Text style={[styles.subLabel, { color: t.colors.textMuted, opacity: hapticsEnabled ? 1 : 0.45 }]}>
            Haptic Strength
          </Text>
          <View style={styles.themeRow}>
            {HAPTIC_STRENGTH_OPTIONS.map((opt) => {
              const selected = hapticStrength === opt.value;
              return (
                <Pressable
                  key={opt.value}
                  disabled={!hapticsEnabled}
                  onPress={() => setAccessibility({ hapticStrength: opt.value })}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: selected, disabled: !hapticsEnabled }}
                  accessibilityLabel={`Haptic strength ${opt.label}. ${opt.hint}`}
                  style={({ pressed }) => [
                    styles.themeOption,
                    { borderColor: t.colors.border, backgroundColor: t.colors.surface },
                    selected && { borderColor: t.colors.primary, backgroundColor: t.colors.selectionBg },
                    pressed && { opacity: 0.8 },
                    !hapticsEnabled && { opacity: 0.45 },
                  ]}
                >
                  <Text style={[styles.themeLabel, { color: selected ? t.colors.primary : t.colors.textMuted }]}>
                    {opt.label}
                  </Text>
                  <Text style={[styles.optionHint, { color: t.colors.textMuted }]}>{opt.hint}</Text>
                </Pressable>
              );
            })}
          </View>
        </Card>

        {/* ── SENSORY ── */}
        <Card style={styles.section}>
          <SectionTitle
            label="SENSORY"
            desc="Calm the app down — less motion, fewer effects, quieter games."
          />
          <ToggleRow
            first
            title="Reduce Sensory Load"
            desc="Quiets shimmer, particles, sound effects, and non-essential animation."
            value={reduceSensoryLoad}
            onChange={(v) => setAccessibility({ reduceSensoryLoad: v })}
          />
          <ToggleRow
            title="Reduce Motion (in-app)"
            desc={
              systemReduceMotion
                ? 'iOS Reduce Motion is on, so animations are already reduced.'
                : 'Reduce TapTalk animations without changing iOS settings.'
            }
            value={reduceMotionOverride}
            onChange={(v) => setAccessibility({ reduceMotionOverride: v })}
          />
          <ToggleRow
            title="Activity Sounds"
            desc="Short sound cues in activity games."
            value={sfxEnabled}
            onChange={(v) => {
              hapticSelection();
              setActivitySfxEnabled(v);
            }}
          />
        </Card>

        {/* ── ADVANCED (hidden by default) ── */}
        <Card style={styles.section}>
          <ToggleRow
            first
            title="Show Advanced Settings"
            desc="Less-used options. Hidden to keep this page simple."
            value={showAdvanced}
            onChange={toggleAdvanced}
          />

          {showAdvanced ? (
            <>
              <Text style={[styles.subLabel, { color: t.colors.textMuted }]}>Symbol Colours</Text>
              <View style={styles.optionGroup}>
                {([
                  { label: 'Standard', value: 'fitzgerald' as const, hint: 'The default TapTalk colours' },
                  { label: 'Colour-blind friendly', value: 'cvd_safe' as const, hint: 'Distinct for red–green colour blindness' },
                ]).map((opt) => (
                  <RadioOption
                    key={opt.value}
                    selected={colorScheme === opt.value}
                    onPress={() => setAccessibility({ colorScheme: opt.value })}
                    accessibilityLabel={`${opt.label}. ${opt.hint}`}
                  >
                    <View style={styles.optionCopy}>
                      <Text
                        style={[styles.previewText, { color: colorScheme === opt.value ? t.colors.primary : t.colors.text }]}
                      >
                        {opt.label}
                      </Text>
                      <Text style={[styles.optionHint, { color: t.colors.textMuted }]}>{opt.hint}</Text>
                    </View>
                  </RadioOption>
                ))}
              </View>
              <View
                style={styles.schemeLegend}
                accessibilityElementsHidden
                importantForAccessibility="no-hide-descendants"
              >
                {([
                  { label: 'Noun', color: t.symbolColors.noun },
                  { label: 'Verb', color: t.symbolColors.verb },
                  { label: 'Adjective', color: t.symbolColors.adjective },
                  { label: 'Question', color: t.symbolColors.question },
                  { label: 'Social', color: t.symbolColors.social },
                ]).map((chip) => (
                  <View key={chip.label} style={[styles.legendChip, { backgroundColor: t.colors.input }]}>
                    <View style={[styles.legendDot, { backgroundColor: chip.color }]} />
                    <Text style={[styles.legendLabel, { color: t.colors.textMuted }]}>{chip.label}</Text>
                  </View>
                ))}
              </View>

              <ToggleRow
                title="Motor Access Mode"
                desc="Tap-based editing — no drag or pinch needed to move and resize tiles."
                value={motorAccessMode}
                onChange={(v) => setAccessibility({ motorAccessMode: v })}
              />
              <ToggleRow
                title="Usage Heatmap"
                desc="Softly highlights your most-used words on the Talk board."
                value={state.showUsageHeatmap}
                onChange={(v) => {
                  hapticSelection();
                  dispatch({ type: 'SET_SHOW_USAGE_HEATMAP', payload: v });
                }}
              />

              <View style={[styles.infoRow, { borderTopColor: t.colors.border }]}>
                <View style={styles.toggleLeft}>
                  <Text style={[styles.toggleTitle, { color: t.colors.text }]}>VoiceOver</Text>
                  <Text style={[styles.toggleDesc, { color: t.colors.textMuted }]}>
                    Built in — every control has a label and hint for screen readers.
                  </Text>
                </View>
                <Ionicons name="checkmark-circle" size={22} color={t.colors.success} accessibilityElementsHidden />
              </View>
            </>
          ) : null}
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontFamily: fonts.displayHeavy,
    fontSize: typography.body,
    letterSpacing: -0.2,
  },
  headerSpacer: {
    width: 44,
  },
  content: {
    padding: spacing.lg,
    gap: spacing.lg,
    paddingBottom: 36,
  },
  pageIntro: {
    fontFamily: fonts.body,
    fontSize: typography.callout,
    lineHeight: 21,
  },
  saveNotice: {
    fontFamily: fonts.displayBold,
    fontSize: typography.caption,
    textAlign: 'center',
  },
  section: {
    gap: spacing.sm,
  },
  sectionTitle: {
    fontFamily: fonts.bodyHeavy,
    fontSize: typography.caption,
    letterSpacing: 1.0,
  },
  sectionDesc: {
    fontFamily: fonts.body,
    fontSize: typography.callout,
    marginBottom: spacing.sm,
  },
  subLabel: {
    fontFamily: fonts.displayBold,
    fontSize: typography.callout,
    marginTop: spacing.sm,
  },
  optionGroup: {
    gap: spacing.sm,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    minHeight: 44,
    borderRadius: radii.card,
    borderWidth: 2,
  },
  previewText: {
    fontFamily: fonts.displayBold,
  },
  optionCopy: {
    flex: 1,
    gap: 2,
  },
  optionHint: {
    fontFamily: fonts.body,
    fontSize: typography.caption,
  },
  themeRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  themeOption: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    minHeight: 44,
    borderRadius: radii.card,
    borderWidth: 2,
    gap: spacing.xs,
  },
  themeLabel: {
    fontFamily: fonts.displayBold,
    fontSize: typography.caption,
  },
  presetGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  presetTile: {
    flexGrow: 1,
    flexBasis: '47%',
    minHeight: 60,
    borderRadius: radii.button,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
  },
  presetLabel: {
    fontFamily: fonts.displayBold,
    fontSize: typography.callout,
  },
  schemeLegend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  legendChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radii.pill,
  },
  legendDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  legendLabel: {
    fontFamily: fonts.body,
    fontSize: typography.caption,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: 44,
    marginTop: spacing.xs,
  },
  toggleRowDivider: {
    borderTopWidth: 1,
    paddingTop: spacing.md,
  },
  toggleLeft: {
    flex: 1,
  },
  toggleTitle: {
    fontFamily: fonts.displayHeavy,
    fontSize: typography.callout,
  },
  toggleDesc: {
    fontFamily: fonts.body,
    fontSize: typography.caption,
    marginTop: 2,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingTop: spacing.md,
    marginTop: spacing.sm,
    borderTopWidth: 1,
    minHeight: 44,
  },
});
