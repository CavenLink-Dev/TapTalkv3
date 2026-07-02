/**
 * Board Keyboard (TAPTALK page).
 *
 * Opened from the Board's top-nav TAPTALK tab. Layout:
 *   • Header: Back, "TapTalk Keyboard" title, Save button.
 *   • Message strip: 5 px corner radius rectangle showing the typed text.
 *     Tap to speak the whole message via expo-speech (full-sentence read
 *     — see to_do/board_speech_rules.md for the per-punctuation tonal
 *     rules that get applied here in a follow-up).
 *   • Keyboard:
 *       Row 1: A B C D E F G H I
 *       Row 2: J K L M N O P Q R
 *       Row 3: ⌫ + S T U V W X Y Z
 *       Row 4: . , ! ? + Space
 *
 * Speech rules (per the locked spec):
 *   • Letter key → speak the letter on press.
 *   • Punctuation key → silent itself; punctuation modifies the full-
 *     sentence read.
 *   • Space + Backspace → silent.
 *
 * Back-guard: if the user has typed 3+ words and taps Back, an iOS Alert
 * confirms before discarding (principle 24 — user control + warning).
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Href, Stack, useRouter } from 'expo-router';
import { colors, radii, spacing, typography } from '../../../src/theme/tokens';
import { useAppContext } from '../../../src/hooks/useAppContext';
import { useSpeech } from '../../../src/hooks/useSpeech';
import { hapticSelection } from '../../../src/utils/haptics';
import {
  QUICK_TALK_MAX,
  addQuickTalk,
  isFull,
  quickTalkCount,
  useQuickTalk,
} from '../../../src/features/quick-talk/store';
import { useTheme } from '../../../src/theme/useTheme';

const ROW_1 = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'] as const;
const ROW_2 = ['J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R'] as const;
const ROW_3 = ['S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'] as const;
const PUNCTUATION = ['.', ',', '!', '?'] as const;

const quickTalkRoute = '/board/quick-talk' as Href;

// ─── Speech ────────────────────────────────────────────────────────────────
// Per board_speech_rules.md:
//   . pauses ~350ms (sentence break)
//   , short pause ~180ms
//   ! louder toward the end of the clause (rate dip + pitch rise on the
//     final word — the rest of the clause stays neutral)
//   ? rising tone at the end of the clause (pitch rise on the final word)
//   Single-word message → spell-and-speak: each letter, then the word.
//   Every new run cancels the in-flight run (no overlapping audio).
// Modifications are applied ON TOP of the user's voice prefs
// (state.accessibility.speechRate / speechPitch).

interface Clause {
  text: string;
  /** Punctuation that ended the clause, or undefined if none. */
  terminator?: '.' | ',' | '!' | '?';
}

/** One TTS call in a chained run. */
interface Utterance {
  text: string;
  rate: number;
  pitch: number;
  /** Silent wait before the next utterance starts. */
  gapAfter: number;
}

function tokeniseClauses(text: string): Clause[] {
  const result: Clause[] = [];
  // Match: any non-punctuation run, optionally followed by one of . , ! ?
  const re = /([^.,!?]+)([.,!?])?/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    const body = (m[1] ?? '').trim();
    if (!body) continue;
    const term = m[2] as Clause['terminator'] | undefined;
    result.push({ text: body, terminator: term });
  }
  return result;
}

/**
 * Build the utterance chain for a full-message read.
 * `rate`/`pitch` are the user's stored voice preferences.
 */
function buildMessageUtterances(text: string, rate: number, pitch: number): Utterance[] {
  const trimmed = text.trim();
  if (!trimmed) return [];

  // Single word (no spaces, no punctuation) → spell-and-speak.
  if (!/[\s.,!?]/.test(trimmed)) {
    const letters: Utterance[] = [...trimmed].map(letter => ({
      text: letter,
      rate: rate * 0.95,
      pitch,
      gapAfter: 80,
    }));
    letters.push({ text: trimmed, rate, pitch, gapAfter: 0 });
    return letters;
  }

  const out: Utterance[] = [];
  for (const c of tokeniseClauses(trimmed)) {
    switch (c.terminator) {
      case '!':
      case '?': {
        // Modify only the final word of the clause; the head stays neutral.
        const words = c.text.split(/\s+/);
        const last = words.pop() ?? '';
        const head = words.join(' ');
        const mod = c.terminator === '!'
          ? { rate: rate * 0.94, pitch: pitch * 1.15, gapAfter: 220 }
          : { rate: rate * 0.96, pitch: pitch * 1.25, gapAfter: 200 };
        if (head) out.push({ text: head, rate, pitch, gapAfter: 40 });
        out.push({ text: last, ...mod });
        break;
      }
      case '.':
        out.push({ text: c.text, rate, pitch, gapAfter: 350 });
        break;
      case ',':
        out.push({ text: c.text, rate, pitch, gapAfter: 180 });
        break;
      default:
        out.push({ text: c.text, rate, pitch, gapAfter: 100 });
        break;
    }
  }
  return out;
}

// ─── Key components ────────────────────────────────────────────────────────

function LetterKey({ value, onPress }: { value: string; onPress: (v: string) => void }) {
  const t = useTheme();
  return (
    <Pressable
      onPress={() => onPress(value)}
      accessibilityRole="button"
      accessibilityLabel={value}
      style={({ pressed }) => [styles.letterKey, pressed && styles.keyPressed]}
    >
      <Text style={[styles.letterText, { color: t.colors.text }]}>{value}</Text>
    </Pressable>
  );
}

function MutedKey({
  label,
  onPress,
  flex = 1,
}: {
  label: string;
  onPress: () => void;
  flex?: number;
}) {
  const t = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [styles.mutedKey, { flex }, pressed && styles.keyPressed]}
    >
      <Text style={[styles.mutedText, { color: t.colors.textMuted }]}>{label}</Text>
    </Pressable>
  );
}

function IconKey({
  icon,
  label,
  onPress,
  flex = 1,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  onPress: () => void;
  flex?: number;
}) {
  const t = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [styles.iconKey, { flex }, pressed && styles.keyPressed]}
    >
      <Ionicons name={icon} size={24} color={t.colors.text} />
    </Pressable>
  );
}

// ─── Screen ────────────────────────────────────────────────────────────────

export default function KeyboardScreen() {
  const t = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { state } = useAppContext();
  const { speak, stop } = useSpeech();
  const [buffer, setBuffer] = useState('');
  // Subscribe so the Quick Talk badge updates after a save.
  useQuickTalk();

  // User voice preferences — punctuation modifiers apply on top of these.
  const speechRate = state.accessibility.speechRate;
  const speechPitch = state.accessibility.speechPitch;

  // Run token + pending-gap timer let us cancel a chained read mid-flight.
  // Without this, the setTimeout between clauses would resume the old chain
  // after Speech.stop() — overlapping audio (board_speech_rules.md).
  const runIdRef = useRef(0);
  const gapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cancelSpeech = useCallback(() => {
    runIdRef.current += 1;
    if (gapTimerRef.current) {
      clearTimeout(gapTimerRef.current);
      gapTimerRef.current = null;
    }
    stop();
  }, [stop]);

  // Never leave a chain running when the screen unmounts.
  useEffect(() => cancelSpeech, [cancelSpeech]);

  const speakLetter = useCallback((letter: string) => {
    cancelSpeech();
    speak(letter, { rate: speechRate * 0.95, pitch: speechPitch });
  }, [cancelSpeech, speak, speechRate, speechPitch]);

  const speakMessage = useCallback((text: string) => {
    cancelSpeech();
    const utterances = buildMessageUtterances(text, speechRate, speechPitch);
    if (utterances.length === 0) return;
    const run = runIdRef.current;

    const speakNext = (i: number) => {
      if (run !== runIdRef.current) return;
      const u = utterances[i];
      if (!u) return;
      speak(u.text, {
        rate: u.rate,
        pitch: u.pitch,
        onDone: () => {
          if (run !== runIdRef.current) return;
          if (i + 1 < utterances.length) {
            gapTimerRef.current = setTimeout(() => speakNext(i + 1), u.gapAfter);
          }
        },
      });
    };

    speakNext(0);
  }, [cancelSpeech, speak, speechRate, speechPitch]);

  const wordCount = useMemo(
    () => buffer.trim().split(/\s+/).filter(Boolean).length,
    [buffer],
  );

  const onLetter = useCallback((letter: string) => {
    hapticSelection();
    setBuffer(b => b + letter);
    speakLetter(letter);
  }, [speakLetter]);

  const onPunctuation = useCallback((mark: string) => {
    hapticSelection();
    setBuffer(b => b + mark);
    // Silent on press per the spec.
  }, []);

  const onSpace = useCallback(() => {
    hapticSelection();
    setBuffer(b => (b.endsWith(' ') ? b : b + ' '));
  }, []);

  const onBackspace = useCallback(() => {
    hapticSelection();
    setBuffer(b => b.slice(0, -1));
  }, []);

  const onSpeakAll = useCallback(() => {
    if (!buffer.trim()) return;
    hapticSelection();
    speakMessage(buffer);
  }, [buffer, speakMessage]);

  const onSave = useCallback(() => {
    const t = buffer.trim();
    if (!t) return;
    if (isFull()) {
      Alert.alert(
        'Quick Talk is full',
        `You've saved ${QUICK_TALK_MAX} phrases. Remove one in Quick Talk before saving another.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Open Quick Talk',
            onPress: () => router.push(quickTalkRoute),
          },
        ],
      );
      return;
    }
    const ok = addQuickTalk(t);
    if (ok) {
      hapticSelection();
      Alert.alert(
        'Saved to Quick Talk',
        `“${t}” is now in Quick Talk.`,
        [
          { text: 'Keep typing', style: 'cancel' },
          { text: 'Clear', onPress: () => setBuffer('') },
        ],
      );
    }
  }, [buffer, router]);

  const onBackPress = useCallback(() => {
    if (wordCount >= 3) {
      Alert.alert(
        'Are you sure you want to go back?',
        'Your current message will be lost.',
        [
          { text: 'No', style: 'cancel' },
          { text: 'Yes', style: 'destructive', onPress: () => router.back() },
        ],
        { cancelable: true },
      );
      return;
    }
    router.back();
  }, [router, wordCount]);

  const onClear = useCallback(() => {
    if (!buffer) return;
    Alert.alert(
      'Clear message?',
      'This will remove everything you have typed.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear', style: 'destructive', onPress: () => setBuffer('') },
      ],
      { cancelable: true },
    );
  }, [buffer]);

  const canSave = buffer.trim().length > 0;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: t.colors.background }]} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.header}>
        <Pressable
          onPress={onBackPress}
          hitSlop={16}
          style={styles.headerIconBtn}
          accessibilityLabel="Back to Board"
          accessibilityRole="button"
        >
          <Ionicons name="chevron-back" size={28} color={t.colors.primary} />
        </Pressable>
        <Text style={[styles.title, { color: t.colors.text }]} accessibilityRole="header">TapTalk Keyboard</Text>
        <Pressable
          onPress={onSave}
          disabled={!canSave}
          accessibilityRole="button"
          accessibilityLabel="Save to Quick Talk"
          accessibilityState={{ disabled: !canSave }}
          style={({ pressed }) => [
            styles.saveBtn,
            !canSave && styles.saveBtnDisabled,
            canSave && pressed && { opacity: 0.85 },
          ]}
        >
          <Ionicons
            name="bookmark"
            size={16}
            color={canSave ? t.colors.surface : t.colors.textTertiary}
          />
          <Text style={[styles.saveBtnText, !canSave && { color: t.colors.textTertiary }]}>
            Save
          </Text>
        </Pressable>
      </View>

      {/* Message strip — 5 px corner radius per spec. Tap to speak. */}
      <View style={styles.stripWrap}>
        <Pressable
          onPress={onSpeakAll}
          accessibilityRole="button"
          accessibilityLabel={buffer.trim() ? `Speak: ${buffer}` : 'Type to begin'}
          style={({ pressed }) => [styles.strip, pressed && { opacity: 0.94 }]}
        >
          {buffer.length > 0 ? (
            <Text style={[styles.stripText, { color: t.colors.text }]} numberOfLines={3}>{buffer}</Text>
          ) : (
            <Text style={[styles.stripPlaceholder, { color: t.colors.textTertiary }]}>
              Tap a letter to start typing…
            </Text>
          )}
        </Pressable>
        <Pressable
          onPress={onClear}
          accessibilityRole="button"
          accessibilityLabel="Clear message"
          hitSlop={10}
          style={({ pressed }) => [styles.clearBtn, pressed && { opacity: 0.7 }]}
        >
          <Ionicons name="close-circle" size={26} color={t.colors.textTertiary} />
        </Pressable>
      </View>

      <View style={styles.stripFooter}>
        <Text style={[styles.stripFooterText, { color: t.colors.textMuted }]}>
          Tap the strip to hear your message
        </Text>
        <Text style={[styles.stripFooterText, { color: t.colors.textMuted }]}>
          {quickTalkCount()} / {QUICK_TALK_MAX} saved
        </Text>
      </View>

      {/* Keyboard — bottom padding clears the home indicator */}
      <View style={[styles.keyboard, { paddingBottom: insets.bottom + spacing.sm }]}>
        <View style={styles.row}>
          {ROW_1.map(l => (
            <LetterKey key={l} value={l} onPress={onLetter} />
          ))}
        </View>
        <View style={styles.row}>
          {ROW_2.map(l => (
            <LetterKey key={l} value={l} onPress={onLetter} />
          ))}
        </View>
        <View style={styles.row}>
          <IconKey icon="backspace-outline" label="Backspace" onPress={onBackspace} flex={1.4} />
          {ROW_3.map(l => (
            <LetterKey key={l} value={l} onPress={onLetter} />
          ))}
        </View>
        <View style={styles.row}>
          {PUNCTUATION.map(p => (
            <MutedKey key={p} label={p} onPress={() => onPunctuation(p)} />
          ))}
          <Pressable
            onPress={onSpace}
            accessibilityRole="button"
            accessibilityLabel="Space"
            style={({ pressed }) => [styles.spaceKey, pressed && styles.keyPressed]}
          >
            <Text style={[styles.spaceText, { color: t.colors.text }]}>Space</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1},

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    gap: spacing.md},
  headerIconBtn: { width: 36, height: 44, alignItems: 'center', justifyContent: 'center' },
  title: {
    flex: 1,
    fontSize: typography.subheading,
    fontWeight: '800',

    letterSpacing: typography.trackSubhead},
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,

    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radii.pill},
  saveBtnDisabled: {

  },
  saveBtnText: {

    fontSize: typography.callout,
    fontWeight: '800'},

  // Message strip — 5 px radius per locked spec.
  stripWrap: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
    marginTop: spacing.sm},
  strip: {
    flex: 1,

    borderRadius: 5,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    minHeight: 84,
    justifyContent: 'center'},
  stripText: {
    fontSize: 26,
    fontWeight: '700',

    letterSpacing: 0.5},
  stripPlaceholder: {
    fontSize: typography.body,

    fontWeight: '500'},
  clearBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4},
  stripFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    marginTop: 6,
    marginBottom: spacing.md},
  stripFooterText: {
    fontSize: typography.caption},

  // Keyboard layout
  keyboard: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: 4,
    gap: 6},
  row: {
    flexDirection: 'row',
    gap: 4},

  letterKey: {
    flex: 1,
    aspectRatio: 1,
    minHeight: 46,

    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center'},
  letterText: {
    fontSize: 26,
    fontWeight: '700',

    letterSpacing: 0.4},

  iconKey: {
    minHeight: 46,
    backgroundColor: colors.inputBg,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center'},

  mutedKey: {
    minHeight: 46,
    backgroundColor: colors.inputBg,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center'},
  mutedText: {
    fontSize: 20,
    fontWeight: '700'},

  spaceKey: {
    flex: 4,
    minHeight: 46,

    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center'},
  spaceText: {
    fontSize: typography.callout,
    fontWeight: '700',

    letterSpacing: 0.6},

  keyPressed: {
    backgroundColor: colors.progressTrack},
});
