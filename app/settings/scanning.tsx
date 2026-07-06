/**
 * Switch Access & Scanning settings.
 *
 * The single motor-access screen for enabling and tuning the ScanningController.
 * Reached from Accessibility → Switch Access.
 *
 * Controls exposed:
 *   • Enable Scanning (master switch)
 *   • Scan Speed (100–2000ms; 100ms increments)
 *   • Scan Mode: auto / step (dual switch) / inverse (hold-to-scan)
 *   • Switch Input Source: keyboard / volume / both
 *   • Auto-pause after N idle cycles (1–10)
 *   • Audio Cue on each advance (for low-vision users)
 *
 * All values write through `SET_ACCESSIBILITY`, which clamps ranges
 * defensively so a corrupt persisted value can never brick the scanner.
 */

import React, { useCallback, useMemo, useRef } from 'react';
import {
  LayoutChangeEvent,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../../src/components/native/Card';
import { useAppContext } from '../../src/hooks/useAppContext';
import { useTheme } from '../../src/theme/useTheme';
import { radii, spacing, typography } from '../../src/theme/tokens';
import { hapticSelection, hapticSuccess } from '../../src/utils/haptics';
import type { AppState } from '../../src/context/types';

type ScanMode = AppState['accessibility']['scanMode'];
type SwitchSource = AppState['accessibility']['switchInputSource'];

const MODE_OPTIONS: { label: string; value: ScanMode; hint: string }[] = [
  {
    label: 'Automatic',
    value: 'auto',
    hint: 'Highlight moves on its own. One switch selects.',
  },
  {
    label: 'Step (Two-Switch)',
    value: 'step',
    hint: 'One switch advances the highlight, another selects.',
  },
  {
    label: 'Inverse',
    value: 'inverse',
    hint: 'Highlight moves only while your switch is held down.',
  },
];

const SOURCE_OPTIONS: {
  label: string;
  value: SwitchSource;
  hint: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
}[] = [
  {
    label: 'Bluetooth / External Keyboard',
    value: 'keyboard',
    hint: 'AbleNet Blue2, Tecla, Hook+ or iOS Switch Control key mapping.',
    icon: 'bluetooth-outline',
  },
  {
    label: 'Volume Buttons',
    value: 'volume',
    hint: 'Volume up = advance, volume down = select.',
    icon: 'volume-high-outline',
  },
  {
    label: 'Both',
    value: 'both',
    hint: 'Accept input from either source.',
    icon: 'infinite-outline',
  },
];

/** Slider granularity — 100ms steps keep the value legible in the label. */
const SPEED_MIN = 100;
const SPEED_MAX = 2000;
const SPEED_STEP = 100;

export default function ScanningSettingsScreen(): React.ReactElement {
  const t = useTheme();
  const router = useRouter();
  const { state, dispatch } = useAppContext();
  const {
    scanningEnabled,
    scanRate,
    scanMode,
    switchInputSource,
    scanAutoPauseCycles,
    scanAudioCue,
  } = state.accessibility;

  const update = useCallback(
    (patch: Partial<AppState['accessibility']>) => {
      dispatch({ type: 'SET_ACCESSIBILITY', payload: patch });
    },
    [dispatch],
  );

  const toggleMaster = useCallback(
    (next: boolean) => {
      hapticSuccess();
      update({ scanningEnabled: next });
    },
    [update],
  );

  const speedLabel = useMemo(() => `${scanRate} ms per step`, [scanRate]);

  const cyclesLabel = useMemo(
    () =>
      `${scanAutoPauseCycles} ${scanAutoPauseCycles === 1 ? 'cycle' : 'cycles'} before auto-pause`,
    [scanAutoPauseCycles],
  );

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: t.colors.background }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.headerRow}>
          <Pressable
            onPress={() => router.back()}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Back"
            style={({ pressed }) => [styles.backBtn, pressed && styles.pressedDim]}
          >
            <Ionicons name="chevron-back" size={28} color={t.colors.text} />
          </Pressable>
          <Text
            accessibilityRole="header"
            style={[styles.title, { color: t.colors.text }]}
            allowFontScaling
            maxFontSizeMultiplier={2.0}
          >
            Switch Access
          </Text>
        </View>

        <Text
          style={[styles.blurb, { color: t.colors.textMuted }]}
          allowFontScaling
          maxFontSizeMultiplier={2.0}
        >
          Operate every part of the app with one or two switches — no touching the screen required.
          Highlights sweep row by row, then column by column, so you can pick any tile with a
          single press.
        </Text>

        <Card style={styles.card}>
          <ToggleRow
            title="Enable Scanning"
            subtitle={
              scanningEnabled
                ? 'Row-then-column scanning is on.'
                : 'Turn on to start highlighting tiles for switch selection.'
            }
            value={scanningEnabled}
            onValueChange={toggleMaster}
          />
        </Card>

        <View
          // Disable the tuning controls when the master switch is off — but
          // leave them visible so the user can see what will be applied.
          pointerEvents={scanningEnabled ? 'auto' : 'none'}
          style={{ opacity: scanningEnabled ? 1 : 0.5 }}
        >
          <Text style={[styles.sectionLabel, { color: t.colors.textMuted }]}>SCAN SPEED</Text>
          <Card style={styles.card}>
            <View style={styles.sliderRow}>
              <Text
                style={[styles.value, { color: t.colors.text }]}
                accessibilityLiveRegion="polite"
                allowFontScaling
              >
                {speedLabel}
              </Text>
              <StepSlider
                min={SPEED_MIN}
                max={SPEED_MAX}
                step={SPEED_STEP}
                value={scanRate}
                onChange={(v) => update({ scanRate: v })}
                onCommit={(v) => {
                  hapticSelection();
                  update({ scanRate: v });
                }}
                accessibilityLabel="Scan speed"
                accessibilityHint="Milliseconds between highlight advances."
              />
              <View style={styles.sliderEnds}>
                <Text style={[styles.endLabel, { color: t.colors.textMuted }]}>Fast</Text>
                <Text style={[styles.endLabel, { color: t.colors.textMuted }]}>Slow</Text>
              </View>
            </View>
          </Card>

          <Text style={[styles.sectionLabel, { color: t.colors.textMuted }]}>SCAN MODE</Text>
          <Card style={styles.card}>
            {MODE_OPTIONS.map((opt, idx) => (
              <ModeChoice
                key={opt.value}
                option={opt}
                selected={scanMode === opt.value}
                onSelect={() => {
                  hapticSelection();
                  update({ scanMode: opt.value });
                }}
                isLast={idx === MODE_OPTIONS.length - 1}
              />
            ))}
          </Card>

          <Text style={[styles.sectionLabel, { color: t.colors.textMuted }]}>SWITCH INPUT</Text>
          <Card style={styles.card}>
            {SOURCE_OPTIONS.map((opt, idx) => (
              <SourceChoice
                key={opt.value}
                option={opt}
                selected={switchInputSource === opt.value}
                onSelect={() => {
                  hapticSelection();
                  update({ switchInputSource: opt.value });
                }}
                isLast={idx === SOURCE_OPTIONS.length - 1}
              />
            ))}
          </Card>

          <Text style={[styles.sectionLabel, { color: t.colors.textMuted }]}>ADVANCED</Text>
          <Card style={styles.card}>
            <View style={styles.sliderRow}>
              <Text style={[styles.value, { color: t.colors.text }]} allowFontScaling>
                {cyclesLabel}
              </Text>
              <StepSlider
                min={1}
                max={10}
                step={1}
                value={scanAutoPauseCycles}
                onChange={(v) => update({ scanAutoPauseCycles: v })}
                onCommit={(v) => {
                  hapticSelection();
                  update({ scanAutoPauseCycles: v });
                }}
                accessibilityLabel="Auto-pause cycles"
                accessibilityHint="Number of full row-scan cycles with no selection before the highlight pauses."
              />
            </View>
            <ToggleRow
              title="Audio cue on advance"
              subtitle="Play a soft tick each time the highlight moves. Useful for low-vision users."
              value={scanAudioCue}
              onValueChange={(v) => update({ scanAudioCue: v })}
            />
          </Card>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

interface ToggleRowProps {
  title: string;
  subtitle?: string;
  value: boolean;
  onValueChange: (next: boolean) => void;
}

function ToggleRow({ title, subtitle, value, onValueChange }: ToggleRowProps): React.ReactElement {
  const t = useTheme();
  return (
    <View
      style={styles.toggleRow}
      accessible
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      accessibilityLabel={title}
      accessibilityHint={subtitle}
    >
      <View style={styles.toggleText}>
        <Text style={[styles.choiceTitle, { color: t.colors.text }]} allowFontScaling>
          {title}
        </Text>
        {subtitle ? (
          <Text style={[styles.choiceHint, { color: t.colors.textMuted }]} allowFontScaling>
            {subtitle}
          </Text>
        ) : null}
      </View>
      <Switch value={value} onValueChange={onValueChange} accessibilityLabel={title} />
    </View>
  );
}

interface ModeChoiceProps {
  option: (typeof MODE_OPTIONS)[number];
  selected: boolean;
  onSelect: () => void;
  isLast: boolean;
}

function ModeChoice({ option, selected, onSelect, isLast }: ModeChoiceProps): React.ReactElement {
  const t = useTheme();
  return (
    <Pressable
      onPress={onSelect}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={option.label}
      accessibilityHint={option.hint}
      hitSlop={8}
      style={({ pressed }) => [
        styles.choiceRow,
        !isLast && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: t.colors.border },
        pressed && styles.pressedDim,
      ]}
    >
      <View style={styles.choiceText}>
        <Text style={[styles.choiceTitle, { color: t.colors.text }]} allowFontScaling>
          {option.label}
        </Text>
        <Text style={[styles.choiceHint, { color: t.colors.textMuted }]} allowFontScaling>
          {option.hint}
        </Text>
      </View>
      <Ionicons
        name={selected ? 'radio-button-on' : 'radio-button-off'}
        size={26}
        color={selected ? t.colors.primary ?? t.colors.text : t.colors.textMuted}
      />
    </Pressable>
  );
}

interface SourceChoiceProps {
  option: (typeof SOURCE_OPTIONS)[number];
  selected: boolean;
  onSelect: () => void;
  isLast: boolean;
}

function SourceChoice({ option, selected, onSelect, isLast }: SourceChoiceProps): React.ReactElement {
  const t = useTheme();
  return (
    <Pressable
      onPress={onSelect}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={option.label}
      accessibilityHint={option.hint}
      hitSlop={8}
      style={({ pressed }) => [
        styles.choiceRow,
        !isLast && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: t.colors.border },
        pressed && styles.pressedDim,
      ]}
    >
      <Ionicons name={option.icon} size={22} color={t.colors.text} style={{ marginRight: spacing.md }} />
      <View style={styles.choiceText}>
        <Text style={[styles.choiceTitle, { color: t.colors.text }]} allowFontScaling>
          {option.label}
        </Text>
        <Text style={[styles.choiceHint, { color: t.colors.textMuted }]} allowFontScaling>
          {option.hint}
        </Text>
      </View>
      <Ionicons
        name={selected ? 'checkmark-circle' : 'ellipse-outline'}
        size={26}
        color={selected ? t.colors.primary ?? t.colors.text : t.colors.textMuted}
      />
    </Pressable>
  );
}

/**
 * A dependency-free stepped slider. Built with PanResponder because bringing
 * in `@react-native-community/slider` for two rows is not worth the bundle.
 * Renders a track + thumb; drag or tap-anywhere both snap to the nearest
 * step. Meets the 44pt hit target minimum via a padded pressable overlay.
 */
interface StepSliderProps {
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (v: number) => void;
  onCommit: (v: number) => void;
  accessibilityLabel: string;
  accessibilityHint?: string;
}

function StepSlider({
  min,
  max,
  step,
  value,
  onChange,
  onCommit,
  accessibilityLabel,
  accessibilityHint,
}: StepSliderProps): React.ReactElement {
  const t = useTheme();
  const widthRef = useRef(1);
  const lastValueRef = useRef(value);

  const snap = useCallback(
    (raw: number) => {
      const clamped = Math.max(min, Math.min(max, raw));
      const stepped = Math.round((clamped - min) / step) * step + min;
      return Math.max(min, Math.min(max, stepped));
    },
    [min, max, step],
  );

  const positionFromValue = useCallback(
    (v: number) => ((v - min) / (max - min)) * widthRef.current,
    [min, max],
  );

  const valueFromPosition = useCallback(
    (x: number) => snap(min + (x / Math.max(1, widthRef.current)) * (max - min)),
    [snap, min, max],
  );

  const responder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (evt) => {
          const v = valueFromPosition(evt.nativeEvent.locationX);
          if (v !== lastValueRef.current) {
            lastValueRef.current = v;
            onChange(v);
          }
        },
        onPanResponderMove: (evt) => {
          const v = valueFromPosition(evt.nativeEvent.locationX);
          if (v !== lastValueRef.current) {
            lastValueRef.current = v;
            onChange(v);
          }
        },
        onPanResponderRelease: () => {
          onCommit(lastValueRef.current);
        },
        onPanResponderTerminate: () => {
          onCommit(lastValueRef.current);
        },
      }),
    [valueFromPosition, onChange, onCommit],
  );

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    widthRef.current = Math.max(1, e.nativeEvent.layout.width);
  }, []);

  const thumbLeft = Math.max(0, Math.min(widthRef.current, positionFromValue(value)));

  const bumpBy = useCallback(
    (delta: number) => {
      const next = snap(value + delta);
      if (next !== value) {
        onChange(next);
        onCommit(next);
      }
    },
    [snap, value, onChange, onCommit],
  );

  return (
    <View
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      accessibilityValue={{ min, max, now: value }}
      onAccessibilityAction={(e) => {
        if (e.nativeEvent.actionName === 'increment') bumpBy(step);
        else if (e.nativeEvent.actionName === 'decrement') bumpBy(-step);
      }}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      style={styles.sliderShell}
      onLayout={onLayout}
      {...responder.panHandlers}
    >
      <View style={[styles.sliderTrack, { backgroundColor: t.colors.textMuted }]} />
      <View
        style={[
          styles.sliderFill,
          {
            width: thumbLeft,
            backgroundColor: t.colors.text,
          },
        ]}
      />
      <View
        style={[
          styles.sliderThumb,
          {
            left: thumbLeft - 14,
            backgroundColor: t.colors.primary ?? t.colors.text,
            borderColor: t.colors.background,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { flex: 1 },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  backBtn: {
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  blurb: {
    fontSize: 15,
    lineHeight: 21,
    marginBottom: spacing.lg,
  },
  card: {
    marginBottom: spacing.lg,
    borderRadius: radii.card,
    overflow: 'hidden',
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: spacing.sm,
    marginTop: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  sliderRow: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  sliderShell: {
    width: '100%',
    height: 44,
    justifyContent: 'center',
    marginVertical: spacing.sm,
  },
  sliderTrack: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 6,
    borderRadius: 3,
    opacity: 0.35,
  },
  sliderFill: {
    position: 'absolute',
    left: 0,
    height: 6,
    borderRadius: 3,
  },
  sliderThumb: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 3,
    // Shadow for hit-affordance visibility on light backgrounds.
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  sliderEnds: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  endLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  value: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  toggleRow: {
    minHeight: 60,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  toggleText: { flex: 1, marginRight: spacing.md },
  choiceRow: {
    minHeight: 60,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  choiceText: { flex: 1 },
  choiceTitle: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 2,
  },
  choiceHint: {
    fontSize: 13,
    lineHeight: 18,
  },
  pressedDim: { opacity: 0.6 },
});
