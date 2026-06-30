/**
 * Visual Timer — a calm countdown the user can see.
 *
 * Two states managed by `mode`:
 *   • 'setup' — duration pickers, optional delay, optional sound, Lock
 *               toggle, appearance + accessibility disclosures, Start.
 *   • 'run'   — focus overlay dims the surrounding chrome; a clock face
 *               (digital or analog) stays bright in the centre; top-left
 *               control is "Unfocus" (single tap) or "Unlock" (press-and-
 *               hold) depending on the pre-start Lock toggle.
 *
 * Design rules in force:
 *   • Default duration is 0; the user picks. No top-level presets — they
 *     live behind a collapsed "Preset Duration ›" disclosure.
 *   • Focus is automatic on Start (principle 13 — clear result on tap).
 *   • Tap outside the clock while Unfocus is showing → iOS Alert to
 *     confirm exit (principle 12 — risky action confirmed).
 *   • Run-mode pause/resume sits next to Unfocus (principle 7 — clear
 *     control with one action).
 *   • Reduce-Motion friendly: hand sweep uses linear motion only; pulse
 *     at end is a single fade, no bouncing.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Easing,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import Svg, { Circle, G, Line } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { Card } from '../../src/components/native/Card';
import { DisclosureRow } from '../../src/components/native/DisclosureRow';
import { WheelPicker } from '../../src/components/native/WheelPicker';
import { radii, spacing, typography } from '../../src/theme/tokens';
import { hapticSelection } from '../../src/utils/haptics';
import { useTheme } from '../../src/theme/useTheme';

// ─── Constants ──────────────────────────────────────────────────────────────

const HOURS    = Array.from({ length: 24 }, (_, i) => i); // 0–23
const MINUTES  = Array.from({ length: 60 }, (_, i) => i); // 0–59
const SECONDS  = Array.from({ length: 60 }, (_, i) => i); // 0–59
const DELAY_MINS = Array.from({ length: 61 }, (_, i) => i); // 0–60

type Face = 'modern' | 'old-school' | 'analog';

interface Duration {
  h: number;
  m: number;
  s: number;
}

interface DelayDuration {
  m: number;
  s: number;
}

interface SoundOption {
  id: string;
  label: string;
}

const SOUND_OPTIONS: SoundOption[] = [
  { id: 'soft-chime', label: 'Soft chime' },
  { id: 'bell',       label: 'Bell' },
  { id: 'beep',       label: 'Beep' },
  { id: 'tin',        label: 'Tin' },
  { id: 'none',       label: 'None' },
];

const PRESET_DURATIONS: { label: string; total: Duration }[] = [
  { label: '1 min',  total: { h: 0, m: 1,  s: 0 } },
  { label: '5 min',  total: { h: 0, m: 5,  s: 0 } },
  { label: '10 min', total: { h: 0, m: 10, s: 0 } },
  { label: '15 min', total: { h: 0, m: 15, s: 0 } },
];

const pad2 = (n: number): string => String(n).padStart(2, '0');

function totalSeconds(d: Duration): number {
  return d.h * 3600 + d.m * 60 + d.s;
}

function delayTotalSeconds(d: DelayDuration): number {
  return d.m * 60 + d.s;
}

function describeDuration(d: Duration): string {
  if (totalSeconds(d) === 0) return 'Not set';
  const parts: string[] = [];
  if (d.h) parts.push(`${d.h}h`);
  if (d.m) parts.push(`${d.m}m`);
  if (d.s) parts.push(`${d.s}s`);
  return parts.join(' ');
}

function describeDelay(d: DelayDuration): string {
  if (delayTotalSeconds(d) === 0) return 'No delay';
  const parts: string[] = [];
  if (d.m) parts.push(`${d.m}m`);
  if (d.s) parts.push(`${d.s}s`);
  return parts.join(' ');
}

// ─── Sound stub ─────────────────────────────────────────────────────────────
// Real audio assets will be wired in a follow-up; for now the chime is a
// short haptic burst so the rest of the timer behaviour can be tested.
function playChime(sound: string): void {
  if (sound === 'none') return;
  // eslint-disable-next-line no-console
  console.log(`[VisualTimer] chime → ${sound}`);
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
}

// ─── Modern digital face ────────────────────────────────────────────────────
// SVG canvas: 1720 × 771. Three gaps inside black screen (x=125,y=150,w=1470,h=450).
// Colons at x=600 and x=1070 (width 50 each).

function ModernFace({ remainingSec }: { remainingSec: number }) {
  const { width } = useWindowDimensions();
  const h = Math.floor(remainingSec / 3600);
  const m = Math.floor((remainingSec % 3600) / 60);
  const s = remainingSec % 60;

  const imgH = width * (771 / 1720);
  const fontSize = width * 0.13;

  // Gap bounds (SVG px → screen %)
  const screenY  = imgH * (150 / 771);      // screen top of the gaps
  const gapH     = imgH * (450 / 771);      // gap height on screen

  const segments = [
    { xLeft: width * (125  / 1720), gapW: width * (475 / 1720), value: pad2(h) }, // hours
    { xLeft: width * (650  / 1720), gapW: width * (420 / 1720), value: pad2(m) }, // minutes
    { xLeft: width * (1120 / 1720), gapW: width * (475 / 1720), value: pad2(s) }, // seconds
  ];

  return (
    <View
      style={{ width, height: imgH, alignSelf: 'center' }}
      accessibilityLiveRegion="polite"
    >
      <Image
        source={require('../../assets/clock_variations/clock_modern_digital/clock_digital_modern.png')}
        style={{ position: 'absolute', width, height: imgH }}
        resizeMode="stretch"
      />
      {segments.map(({ xLeft, gapW, value }) => (
        <View
          key={xLeft}
          style={{
            position: 'absolute',
            left: xLeft,
            top: screenY,
            width: gapW,
            height: gapH,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text
            style={{
              color: '#FFFFFF',
              fontSize,
              fontWeight: '800',
              fontVariant: ['tabular-nums'],
              fontFamily: Platform.select({ ios: undefined, android: 'sans-serif-medium' }),
            }}
          >
            {value}
          </Text>
        </View>
      ))}
    </View>
  );
}

// ─── Old-school digital face ─────────────────────────────────────────────────
// SVG canvas: 1725 × 725. Three dark boxes at y=195, h=360.
// Hours: x=82.5, w=410 | Minutes: x=582.5, w=410 | Seconds: x=1082.5, w=410

function OldSchoolFace({ remainingSec }: { remainingSec: number }) {
  const { width } = useWindowDimensions();
  const h = Math.floor(remainingSec / 3600);
  const m = Math.floor((remainingSec % 3600) / 60);
  const s = remainingSec % 60;

  const imgH    = width * (725 / 1725);
  const fontSize = width * 0.115;

  const screenY = imgH * (195 / 725);
  const gapH    = imgH * (360 / 725);
  const gapW    = width * (410 / 1725);

  const segments = [
    { xLeft: width * (82.5  / 1725), value: pad2(h) },  // hours
    { xLeft: width * (582.5 / 1725), value: pad2(m) },  // minutes
    { xLeft: width * (1082.5 / 1725), value: pad2(s) }, // seconds
  ];

  return (
    <View
      style={{ width, height: imgH, alignSelf: 'center' }}
      accessibilityLiveRegion="polite"
    >
      <Image
        source={require('../../assets/clock_variations/clock_old_school_digital/clock_old_school.png')}
        style={{ position: 'absolute', width, height: imgH }}
        resizeMode="stretch"
      />
      {segments.map(({ xLeft, value }) => (
        <View
          key={xLeft}
          style={{
            position: 'absolute',
            left: xLeft,
            top: screenY,
            width: gapW,
            height: gapH,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text
            style={{
              color: '#FF8800',
              fontSize,
              fontWeight: '700',
              fontVariant: ['tabular-nums'],
              fontFamily: Platform.select({
                ios: 'Courier New',
                android: 'monospace',
              }),
            }}
          >
            {value}
          </Text>
        </View>
      ))}
    </View>
  );
}

// ─── Analog face ────────────────────────────────────────────────────────────
// Shows REMAINING time as if it were a time of day: hour hand sweeps 12 hours
// over 12h of remaining time, minute hand sweeps 60 over 60m, second hand
// sweeps once per minute. So 5:30:00 remaining → hour hand at 5.5, minute
// hand at 6, second hand at 12.

const CLOCK_SIZE = 240;
const CLOCK_RADIUS = (CLOCK_SIZE - 4) / 2;
const CENTRE = CLOCK_SIZE / 2;

function AnalogFace({ remainingSec }: { remainingSec: number }) {
  const t = useTheme();
  const h = (remainingSec / 3600) % 12;
  const m = (remainingSec % 3600) / 60;
  const s = remainingSec % 60;

  const hourAngle   = (h / 12) * 360;
  const minuteAngle = (m / 60) * 360;
  const secondAngle = (s / 60) * 360;

  // Hand lengths as fractions of radius.
  const hourLen   = CLOCK_RADIUS * 0.5;
  const minuteLen = CLOCK_RADIUS * 0.72;
  const secondLen = CLOCK_RADIUS * 0.78;

  return (
    <View style={styles.analogWrap} accessibilityLiveRegion="polite">
      <Svg width={CLOCK_SIZE} height={CLOCK_SIZE}>
        {/* Outer ring */}
        <Circle
          cx={CENTRE}
          cy={CENTRE}
          r={CLOCK_RADIUS}
          stroke={t.colors.surface}
          strokeWidth={3}
          fill="#1A2330"
        />
        {/* Hour ticks (12 of them) */}
        {Array.from({ length: 12 }).map((_, i) => {
          const angle = (i / 12) * 360;
          const inner = CLOCK_RADIUS - 14;
          const outer = CLOCK_RADIUS - 4;
          const rad = (angle - 90) * (Math.PI / 180);
          return (
            <Line
              key={`tick-${i}`}
              x1={CENTRE + Math.cos(rad) * inner}
              y1={CENTRE + Math.sin(rad) * inner}
              x2={CENTRE + Math.cos(rad) * outer}
              y2={CENTRE + Math.sin(rad) * outer}
              stroke="#FFFFFF"
              strokeWidth={i % 3 === 0 ? 3 : 1.5}
              strokeLinecap="round"
            />
          );
        })}
        {/* Hour hand */}
        <G transform={`rotate(${hourAngle}, ${CENTRE}, ${CENTRE})`}>
          <Line
            x1={CENTRE}
            y1={CENTRE + 8}
            x2={CENTRE}
            y2={CENTRE - hourLen}
            stroke="#FFFFFF"
            strokeWidth={5}
            strokeLinecap="round"
          />
        </G>
        {/* Minute hand */}
        <G transform={`rotate(${minuteAngle}, ${CENTRE}, ${CENTRE})`}>
          <Line
            x1={CENTRE}
            y1={CENTRE + 12}
            x2={CENTRE}
            y2={CENTRE - minuteLen}
            stroke="#FFFFFF"
            strokeWidth={3.5}
            strokeLinecap="round"
          />
        </G>
        {/* Second hand */}
        <G transform={`rotate(${secondAngle}, ${CENTRE}, ${CENTRE})`}>
          <Line
            x1={CENTRE}
            y1={CENTRE + 16}
            x2={CENTRE}
            y2={CENTRE - secondLen}
            stroke={t.colors.primary}
            strokeWidth={2}
            strokeLinecap="round"
          />
        </G>
        {/* Centre dot */}
        <Circle cx={CENTRE} cy={CENTRE} r={5} fill={t.colors.primary} />
      </Svg>
      <Text style={styles.analogSub}>{describeDuration({ h: Math.floor(remainingSec / 3600), m: Math.floor((remainingSec % 3600) / 60), s: remainingSec % 60 })}</Text>
    </View>
  );
}

// ─── Screen ─────────────────────────────────────────────────────────────────

export default function VisualTimerScreen() {
  const t = useTheme();
  const router = useRouter();

  // Setup state.
  const [duration, setDuration] = useState<Duration>({ h: 0, m: 0, s: 0 });
  const [delay, setDelay] = useState<DelayDuration>({ m: 0, s: 0 });
  const [chimeEveryMin, setChimeEveryMin] = useState<number>(0); // 0 = off
  const [chimeSound, setChimeSound] = useState<string>('soft-chime');
  const [soundAtStart, setSoundAtStart] = useState<boolean>(false);
  const [startSound, setStartSound] = useState<string>('bell');
  const [soundAtEnd, setSoundAtEnd] = useState<boolean>(false);
  const [endSound, setEndSound] = useState<string>('bell');
  const [locked, setLocked] = useState<boolean>(false);
  const [face, setFace] = useState<Face>('modern');

  // Disclosure expansion state.
  const [soundExpanded, setSoundExpanded] = useState(false);
  const [appearanceExpanded, setAppearanceExpanded] = useState(false);
  const [a11yExpanded, setA11yExpanded] = useState(false);
  const [presetsExpanded, setPresetsExpanded] = useState(false);

  // Run state.
  const [mode, setMode] = useState<'setup' | 'run'>('setup');
  const [phase, setPhase] = useState<'delay' | 'count' | 'done'>('count');
  const [remaining, setRemaining] = useState<number>(0);
  const [paused, setPaused] = useState<boolean>(false);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastChimeAtRef = useRef<number>(-1);

  const canStart = totalSeconds(duration) > 0;
  const totalDurationSec = totalSeconds(duration);
  const totalDelaySec = delayTotalSeconds(delay);

  // ── Run-mode tick ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (mode !== 'run' || paused || phase === 'done') return;
    tickRef.current = setInterval(() => {
      setRemaining(prev => {
        if (prev <= 1) {
          if (phase === 'delay') {
            // Delay ended → start the timer.
            if (soundAtStart) playChime(startSound);
            setPhase('count');
            return totalDurationSec;
          }
          // Count phase ended.
          if (soundAtEnd) playChime(endSound);
          setPhase('done');
          return 0;
        }
        // Interval chime check (only during count phase).
        if (
          phase === 'count' &&
          chimeEveryMin > 0 &&
          chimeSound !== 'none'
        ) {
          const elapsed = totalDurationSec - prev + 1;
          const chimeIntervalSec = chimeEveryMin * 60;
          if (elapsed > 0 && elapsed % chimeIntervalSec === 0 && elapsed !== lastChimeAtRef.current) {
            lastChimeAtRef.current = elapsed;
            playChime(chimeSound);
          }
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
    };
  }, [
    mode,
    paused,
    phase,
    totalDurationSec,
    chimeEveryMin,
    chimeSound,
    soundAtStart,
    startSound,
    soundAtEnd,
    endSound,
  ]);

  // ── Actions ───────────────────────────────────────────────────────────────
  const handleStart = useCallback(() => {
    if (!canStart) return;
    hapticSelection();
    lastChimeAtRef.current = -1;
    if (totalDelaySec > 0) {
      setPhase('delay');
      setRemaining(totalDelaySec);
    } else {
      if (soundAtStart) playChime(startSound);
      setPhase('count');
      setRemaining(totalDurationSec);
    }
    setPaused(false);
    setMode('run');
  }, [canStart, totalDelaySec, totalDurationSec, soundAtStart, startSound]);

  const exitToSetup = useCallback(() => {
    if (tickRef.current) clearInterval(tickRef.current);
    setMode('setup');
    setPhase('count');
    setPaused(false);
  }, []);

  const handleUnfocusTap = useCallback(() => {
    if (locked) return; // Handled by hold-to-unlock path.
    Alert.alert(
      'Exit the timer?',
      'Your current countdown will stop.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Exit', style: 'destructive', onPress: exitToSetup },
      ],
      { cancelable: true },
    );
  }, [exitToSetup, locked]);

  const handleApplyPreset = useCallback((preset: Duration) => {
    hapticSelection();
    setDuration(preset);
    setPresetsExpanded(false);
  }, []);

  // ── Render helpers ────────────────────────────────────────────────────────
  const summaryDuration = useMemo(() => describeDuration(duration), [duration]);
  const summaryDelay = useMemo(() => describeDelay(delay), [delay]);
  const summarySound = useMemo(() => {
    if (chimeEveryMin === 0 && !soundAtStart && !soundAtEnd) return 'Off';
    return [
      chimeEveryMin > 0 ? `Chime ${chimeEveryMin}m` : null,
      soundAtStart ? 'Start' : null,
      soundAtEnd ? 'End' : null,
    ].filter(Boolean).join(' · ');
  }, [chimeEveryMin, soundAtStart, soundAtEnd]);
  const summaryAppearance = face === 'modern' ? 'Modern' : face === 'old-school' ? 'Old School' : 'Analog';

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: t.colors.background }]} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={16}
          style={styles.headerBack}
          accessibilityLabel="Back"
          accessibilityRole="button"
        >
          <Ionicons name="chevron-back" size={28} color={t.colors.primary} />
        </Pressable>
        <Text style={[styles.title, { color: t.colors.text }]} accessibilityRole="header">Visual Timer</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        bounces
        alwaysBounceVertical
        overScrollMode="always"
      >
        {/* Duration card — three side-by-side wheels. */}
        <Card style={styles.section}>
          <View style={styles.sectionHead}>
            <Text style={[styles.sectionLabel, { color: t.colors.text }]}>Duration</Text>
            <Text style={[styles.sectionSummary, { color: t.colors.textMuted }]}>{summaryDuration}</Text>
          </View>
          <View style={styles.wheelRow}>
            <WheelPicker
              values={HOURS}
              selectedValue={duration.h}
              onChange={(v) => setDuration(d => ({ ...d, h: v }))}
              label="Hour"
              format={(v) => pad2(v)}
              accessibilityLabel="Hours"
            />
            <Text style={[styles.wheelSeparator, { color: t.colors.textTertiary }]}>:</Text>
            <WheelPicker
              values={MINUTES}
              selectedValue={duration.m}
              onChange={(v) => setDuration(d => ({ ...d, m: v }))}
              label="Min"
              format={(v) => pad2(v)}
              accessibilityLabel="Minutes"
            />
            <Text style={[styles.wheelSeparator, { color: t.colors.textTertiary }]}>:</Text>
            <WheelPicker
              values={SECONDS}
              selectedValue={duration.s}
              onChange={(v) => setDuration(d => ({ ...d, s: v }))}
              label="Sec"
              format={(v) => pad2(v)}
              accessibilityLabel="Seconds"
            />
          </View>
        </Card>

        {/* Start delay card */}
        <Card style={styles.section}>
          <View style={styles.sectionHead}>
            <Text style={[styles.sectionLabel, { color: t.colors.text }]}>Start delay</Text>
            <Text style={[styles.sectionSummary, { color: t.colors.textMuted }]}>{summaryDelay}</Text>
          </View>
          <Text style={[styles.sectionHint, { color: t.colors.textMuted }]}>
            Wait this long before the countdown starts.
          </Text>
          <View style={styles.wheelRow}>
            <WheelPicker
              values={DELAY_MINS}
              selectedValue={delay.m}
              onChange={(v) => setDelay(d => ({ ...d, m: v }))}
              label="Min"
              format={(v) => pad2(v)}
              accessibilityLabel="Delay minutes"
            />
            <Text style={[styles.wheelSeparator, { color: t.colors.textTertiary }]}>:</Text>
            <WheelPicker
              values={SECONDS}
              selectedValue={delay.s}
              onChange={(v) => setDelay(d => ({ ...d, s: v }))}
              label="Sec"
              format={(v) => pad2(v)}
              accessibilityLabel="Delay seconds"
            />
          </View>
        </Card>

        {/* Sound disclosure */}
        <DisclosureRow
          title="Sound"
          subtitle="Chimes during, sound at start and end"
          icon="musical-notes-outline"
          summary={summarySound}
          expanded={soundExpanded}
          onToggle={() => setSoundExpanded(v => !v)}
        >
          <View style={styles.disclosureRow}>
            <Text style={[styles.disclosureLabel, { color: t.colors.text }]}>Chime every</Text>
            <View style={styles.chimeInputRow}>
              <WheelPicker
                values={[0, 1, 2, 3, 4, 5, 10, 15, 20, 30, 45, 60]}
                selectedValue={chimeEveryMin}
                onChange={(v) => setChimeEveryMin(v)}
                width={60}
                accessibilityLabel="Chime interval minutes"
              />
              <Text style={[styles.chimeUnit, { color: t.colors.textMuted }]}>min</Text>
            </View>
          </View>

          <SoundPickerRow
            label="Chime sound"
            value={chimeSound}
            onChange={setChimeSound}
          />

          <ToggleRow
            label="Sound at start"
            value={soundAtStart}
            onChange={setSoundAtStart}
          />
          {soundAtStart ? (
            <SoundPickerRow
              label="Start sound"
              value={startSound}
              onChange={setStartSound}
            />
          ) : null}

          <ToggleRow
            label="Sound at end"
            value={soundAtEnd}
            onChange={setSoundAtEnd}
          />
          {soundAtEnd ? (
            <SoundPickerRow
              label="End sound"
              value={endSound}
              onChange={setEndSound}
            />
          ) : null}
        </DisclosureRow>

        {/* Appearance disclosure */}
        <DisclosureRow
          title="Appearance"
          subtitle="Clock face style"
          icon="color-palette-outline"
          summary={summaryAppearance}
          expanded={appearanceExpanded}
          onToggle={() => setAppearanceExpanded(v => !v)}
        >
          <SegmentedFacePicker face={face} onChange={setFace} />
        </DisclosureRow>

        {/* Preset Duration disclosure (optional, collapsed by default) */}
        <DisclosureRow
          title="Preset Duration"
          subtitle="Quick fills for common durations"
          icon="flash-outline"
          expanded={presetsExpanded}
          onToggle={() => setPresetsExpanded(v => !v)}
        >
          <View style={styles.presetsRow}>
            {PRESET_DURATIONS.map(p => (
              <Pressable
                key={p.label}
                onPress={() => handleApplyPreset(p.total)}
                style={({ pressed }) => [styles.presetChip, pressed && styles.presetChipPressed]}
                accessibilityRole="button"
                accessibilityLabel={`Set duration to ${p.label}`}
              >
                <Text style={[styles.presetChipText, { color: t.colors.primary }]}>{p.label}</Text>
              </Pressable>
            ))}
          </View>
        </DisclosureRow>

        {/* Accessibility disclosure (placeholder for future controls) */}
        <DisclosureRow
          title="Accessibility"
          subtitle="Bigger digits, voice cues, more"
          icon="accessibility-outline"
          expanded={a11yExpanded}
          onToggle={() => setA11yExpanded(v => !v)}
        >
          <Text style={[styles.placeholderText, { color: t.colors.textMuted }]}>
            More options coming here — VoiceOver cues, high-contrast face,
            larger numerals. Reduce Motion is already respected automatically.
          </Text>
        </DisclosureRow>

        {/* Lock toggle row — pre-start choice; affects run-mode exit. */}
        <View style={[styles.lockRow, { backgroundColor: t.colors.surface }]}>
          <View style={styles.lockTextWrap}>
            <Text style={[styles.lockLabel, { color: t.colors.text }]}>Lock focus</Text>
            <Text style={[styles.lockSub, { color: t.colors.textMuted }]}>
              Require a press-and-hold to exit during the countdown.
            </Text>
          </View>
          <Switch
            value={locked}
            onValueChange={(v) => {
              hapticSelection();
              setLocked(v);
            }}
            accessibilityLabel="Lock focus"
          />
        </View>

        {/* Start button */}
        <Pressable
          onPress={handleStart}
          disabled={!canStart}
          accessibilityRole="button"
          accessibilityLabel="Start timer"
          accessibilityState={{ disabled: !canStart }}
          style={({ pressed }) => [
            styles.startBtn,
            !canStart && styles.startBtnDisabled,
            canStart && pressed && { opacity: 0.86 },
          ]}
        >
          <Ionicons name="play" size={22} color={canStart ? t.colors.surface : t.colors.textTertiary} />
          <Text style={[styles.startBtnText, !canStart && { color: t.colors.textTertiary }]}>
            Start
          </Text>
        </Pressable>

        {!canStart ? (
          <Text style={[styles.startHint, { color: t.colors.textMuted }]}>Set a duration above to enable Start.</Text>
        ) : null}
      </ScrollView>

      {mode === 'run' ? (
        <RunOverlay
          remaining={remaining}
          phase={phase}
          paused={paused}
          locked={locked}
          face={face}
          onTogglePause={() => {
            hapticSelection();
            setPaused(p => !p);
          }}
          onUnfocusTap={handleUnfocusTap}
          onUnlockComplete={exitToSetup}
          onRestart={handleStart}
          onClose={exitToSetup}
        />
      ) : null}
    </SafeAreaView>
  );
}

// ─── Run overlay ────────────────────────────────────────────────────────────

function RunOverlay({
  remaining,
  phase,
  paused,
  locked,
  face,
  onTogglePause,
  onUnfocusTap,
  onUnlockComplete,
  onRestart,
  onClose,
}: {
  remaining: number;
  phase: 'delay' | 'count' | 'done';
  paused: boolean;
  locked: boolean;
  face: Face;
  onTogglePause: () => void;
  onUnfocusTap: () => void;
  onUnlockComplete: () => void;
  onRestart: () => void;
  onClose: () => void;
}) {
  const t = useTheme();
  // Fade the overlay in on mount.
  const fade = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(fade, {
      toValue: 1,
      duration: 220,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [fade]);

  // End-state pulse on the face.
  const pulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (phase !== 'done') return;
    Animated.sequence([
      Animated.timing(pulse, { toValue: 1, duration: 320, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(pulse, { toValue: 0, duration: 480, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
    ]).start();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
  }, [phase, pulse]);

  const pulseScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.06] });

  return (
    <Animated.View style={[styles.runOverlay, { opacity: fade }]} pointerEvents="auto">
      {/* Dim layer — tappable for Unfocus (with confirm) when not locked. */}
      <Pressable
        style={StyleSheet.absoluteFillObject}
        onPress={onUnfocusTap}
        accessibilityLabel="Exit timer"
        accessibilityRole="button"
      />

      {/* Top toolbar — Unfocus / Unlock on the left, Pause/Resume on the right. */}
      <View style={styles.runToolbar} pointerEvents="box-none">
        {locked ? (
          <HoldToUnlock onComplete={onUnlockComplete} />
        ) : (
          <Pressable
            onPress={onUnfocusTap}
            style={({ pressed }) => [styles.runChip, pressed && styles.runChipPressed]}
            accessibilityRole="button"
            accessibilityLabel="Unfocus and exit timer"
          >
            <Ionicons name="close" size={18} color="#FFFFFF" />
            <Text style={styles.runChipText}>Unfocus</Text>
          </Pressable>
        )}

        {phase === 'done' ? (
          <Pressable
            onPress={onRestart}
            style={({ pressed }) => [styles.runChip, styles.runChipPrimary, pressed && { opacity: 0.85 }]}
            accessibilityRole="button"
            accessibilityLabel="Restart timer"
          >
            <Ionicons name="refresh" size={18} color="#FFFFFF" />
            <Text style={styles.runChipText}>Restart</Text>
          </Pressable>
        ) : (
          <Pressable
            onPress={onTogglePause}
            style={({ pressed }) => [styles.runChip, pressed && styles.runChipPressed]}
            accessibilityRole="button"
            accessibilityLabel={paused ? 'Resume timer' : 'Pause timer'}
          >
            <Ionicons name={paused ? 'play' : 'pause'} size={18} color="#FFFFFF" />
            <Text style={styles.runChipText}>{paused ? 'Resume' : 'Pause'}</Text>
          </Pressable>
        )}
      </View>

      {/* Clock face — intercepts taps so the dim layer Unfocus doesn't fire
          when the user is just looking at the centre. */}
      <Animated.View
        style={[styles.runClock, { transform: [{ scale: pulseScale }] }]}
        onStartShouldSetResponder={() => true}
      >
        {phase === 'delay' ? (
          <Text style={styles.runDelayLabel}>Starting in…</Text>
        ) : null}
        {face === 'modern' ? (
          <ModernFace remainingSec={remaining} />
        ) : face === 'old-school' ? (
          <OldSchoolFace remainingSec={remaining} />
        ) : (
          <AnalogFace remainingSec={remaining} />
        )}
        {phase === 'done' ? (
          <Text style={styles.runDoneLabel}>Time's up</Text>
        ) : null}
      </Animated.View>

      {phase === 'done' ? (
        <Pressable
          onPress={onClose}
          style={({ pressed }) => [styles.runClose, pressed && { opacity: 0.86 }]}
          accessibilityRole="button"
          accessibilityLabel="Close"
        >
          <Text style={styles.runCloseText}>Done</Text>
        </Pressable>
      ) : null}
    </Animated.View>
  );
}

// ─── Hold-to-Unlock control ────────────────────────────────────────────────

const UNLOCK_HOLD_MS = 900;

function HoldToUnlock({ onComplete }: { onComplete: () => void }) {
  const progress = useRef(new Animated.Value(0)).current;
  const holdRef = useRef<Animated.CompositeAnimation | null>(null);

  const start = () => {
    holdRef.current = Animated.timing(progress, {
      toValue: 1,
      duration: UNLOCK_HOLD_MS,
      easing: Easing.linear,
      useNativeDriver: false,
    });
    holdRef.current.start(({ finished }) => {
      if (finished) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
        onComplete();
      }
    });
  };

  const cancel = () => {
    holdRef.current?.stop();
    Animated.timing(progress, {
      toValue: 0,
      duration: 180,
      useNativeDriver: false,
    }).start();
  };

  const widthInterp = progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

  return (
    <Pressable
      onPressIn={start}
      onPressOut={cancel}
      delayLongPress={50}
      accessibilityRole="button"
      accessibilityLabel="Press and hold to unlock"
      style={({ pressed }) => [styles.runChip, styles.runChipLock, pressed && { opacity: 0.92 }]}
    >
      <Animated.View style={[styles.unlockFill, { width: widthInterp }]} />
      <Ionicons name="lock-closed" size={18} color="#FFFFFF" />
      <Text style={styles.runChipText}>Hold to unlock</Text>
    </Pressable>
  );
}

// ─── Smaller helpers ────────────────────────────────────────────────────────

function ToggleRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  const t = useTheme();
  return (
    <View style={styles.toggleRow}>
      <Text style={[styles.toggleLabel, { color: t.colors.text }]}>{label}</Text>
      <Switch
        value={value}
        onValueChange={(v) => {
          hapticSelection();
          onChange(v);
        }}
        accessibilityLabel={label}
      />
    </View>
  );
}

function SoundPickerRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (id: string) => void;
}) {
  const t = useTheme();
  return (
    <View style={styles.soundRow}>
      <Text style={[styles.toggleLabel, { color: t.colors.text }]}>{label}</Text>
      <View style={styles.soundChips}>
        {SOUND_OPTIONS.map(opt => {
          const active = opt.id === value;
          return (
            <Pressable
              key={opt.id}
              onPress={() => {
                hapticSelection();
                onChange(opt.id);
                if (opt.id !== 'none') playChime(opt.id);
              }}
              style={({ pressed }) => [
                styles.soundChip,
                active && styles.soundChipActive,
                pressed && { opacity: 0.86 },
              ]}
              accessibilityRole="button"
              accessibilityLabel={`${label} ${opt.label}`}
              accessibilityState={{ selected: active }}
            >
              <Text style={[styles.soundChipText, active && styles.soundChipTextActive]}>
                {opt.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function SegmentedFacePicker({
  face,
  onChange,
}: {
  face: Face;
  onChange: (f: Face) => void;
}) {
  const t = useTheme();
  return (
    <View style={[styles.segmented, { backgroundColor: t.colors.background }]} accessibilityRole="radiogroup">
      {([ ['modern', 'Modern'], ['old-school', 'Old School'], ['analog', 'Analog'] ] as [Face, string][]).map(([f, label]) => {
        const active = f === face;
        return (
          <Pressable
            key={f}
            onPress={() => {
              hapticSelection();
              onChange(f);
            }}
            style={({ pressed }) => [
              styles.segment,
              active && styles.segmentActive,
              pressed && { opacity: 0.86 },
            ]}
            accessibilityRole="radio"
            accessibilityLabel={`${label} face`}
            accessibilityState={{ selected: active }}
          >
            <Text style={[styles.segmentText, active && styles.segmentTextActive]}>
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1},

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm},
  headerBack: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center'},
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
    gap: spacing.md},

  section: {
    gap: spacing.sm},
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between'},
  sectionLabel: {
    fontSize: typography.body,
    fontWeight: '700'},
  sectionSummary: {
    fontSize: typography.callout,

    fontWeight: '600'},
  sectionHint: {
    fontSize: typography.caption,

    marginBottom: spacing.sm},

  wheelRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: spacing.sm},
  wheelSeparator: {
    fontSize: 22,
    fontWeight: '700',

    paddingBottom: 50},

  disclosureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 48},
  disclosureLabel: {
    fontSize: typography.callout,
    fontWeight: '700'},
  chimeInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6},
  chimeUnit: {
    fontSize: typography.callout},

  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 44},
  toggleLabel: {
    fontSize: typography.callout,
    fontWeight: '600'},

  soundRow: {
    gap: spacing.sm},
  soundChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6},
  soundChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radii.pill},
  soundChipActive: {

  },
  soundChipText: {
    fontSize: typography.caption,
    fontWeight: '700'},
  soundChipTextActive: {

  },

  segmented: {
    flexDirection: 'row',

    borderRadius: radii.pill,
    padding: 4},
  segment: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: radii.pill,
    alignItems: 'center'},
  segmentActive: {

  },
  segmentText: {
    fontSize: typography.callout,
    fontWeight: '700'},
  segmentTextActive: {

  },

  presetsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8},
  presetChip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: 10,
    borderRadius: radii.pill,
    backgroundColor: '#E6F4FD'},
  presetChipPressed: { opacity: 0.85 },
  presetChipText: {
    fontSize: typography.callout,
    fontWeight: '700'},

  placeholderText: {
    fontSize: typography.callout,

    lineHeight: 21},

  lockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    gap: spacing.md,

    borderRadius: radii.card},
  lockTextWrap: { flex: 1 },
  lockLabel: {
    fontSize: typography.body,
    fontWeight: '700'},
  lockSub: {
    fontSize: typography.caption,

    marginTop: 2},

  startBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,

    paddingVertical: 18,
    borderRadius: radii.pill,
    minHeight: 60,
    marginTop: spacing.md},
  startBtnDisabled: {

  },
  startBtnText: {

    fontSize: typography.body,
    fontWeight: '800'},
  startHint: {
    textAlign: 'center',
    fontSize: typography.caption,

    marginTop: spacing.xs},

  // ── Run overlay ───────────────────────────────────────────────────────────
  runOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(8, 14, 24, 0.72)',
    alignItems: 'center',
    justifyContent: 'center'},
  runToolbar: {
    position: 'absolute',
    top: spacing.xxl + spacing.lg,
    left: spacing.lg,
    right: spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'},
  runChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderRadius: radii.pill,
    overflow: 'hidden'},
  runChipPressed: {
    backgroundColor: 'rgba(255,255,255,0.28)'},
  runChipPrimary: {

  },
  runChipLock: {
    paddingHorizontal: spacing.lg},
  runChipText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: typography.callout},
  unlockFill: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(52, 199, 89, 0.65)',
    borderRadius: radii.pill},

  runClock: {
    alignItems: 'center',
    gap: spacing.md},
  runDelayLabel: {
    color: '#FFFFFF',
    fontSize: typography.callout,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    opacity: 0.85},
  runDoneLabel: {
    color: '#FFFFFF',
    fontSize: typography.heading,
    fontWeight: '900',
    letterSpacing: -0.3,
    marginTop: spacing.lg},
  runClose: {
    position: 'absolute',
    bottom: spacing.xxl + spacing.md,
    paddingHorizontal: spacing.xxl,
    paddingVertical: 14,

    borderRadius: radii.pill},
  runCloseText: {
    color: '#FFFFFF',
    fontSize: typography.body,
    fontWeight: '800'},

  // ── Digital face ──────────────────────────────────────────────────────────
  digitalWrap: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xxl},
  digitalText: {
    color: '#FFFFFF',
    fontSize: 72,
    fontWeight: '900',
    letterSpacing: 2,
    fontVariant: ['tabular-nums']},
  digitalSub: {
    marginTop: 6,
    color: 'rgba(255,255,255,0.7)',
    fontSize: typography.caption,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase'},

  // ── Analog face ───────────────────────────────────────────────────────────
  analogWrap: {
    alignItems: 'center',
    gap: spacing.md},
  analogSub: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: typography.body,
    fontWeight: '700',
    letterSpacing: 0.3,
    fontVariant: ['tabular-nums']},
});
