/**
 * ActivityCompletionOverlay
 *
 * Shared completion card shown at the end of every activity game.
 * Design principles (per activity design rules):
 *   • Square card with soft 22-pt corners — never a tall pill modal.
 *   • Cancel X always visible top-right — no dark-pattern trapping.
 *   • Effort-first language — celebrates completion, not score.
 *   • No star ratings or accuracy % — avoids shame for slower users.
 *   • Bright per-activity accent colour passed via `theme` prop.
 *   • Time badge shown only when `gameStartedAt` is provided.
 */

import React, { useMemo } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { radii, spacing, typography } from '../../theme/tokens';
import { useTheme } from '../../theme/useTheme';

// ─── Theme ────────────────────────────────────────────────────────────────────

/** Per-activity visual identity for the completion card. */
export interface ActivityCompletionTheme {
  /** Main accent colour: strip, primary button, badge text, left border. */
  primary: string;
  /** Light tint of primary: icon circle bg, badge bg, secondary button bg, encouragement bg. */
  light: string;
  /** Emoji shown in the icon circle. */
  emoji: string;
  /** Short activity name, e.g. "Shape Match". */
  label: string;
  /** Second badge copy, e.g. "All shapes matched". */
  completionLabel: string;
  /** 1–2 sentence encouragement — effort-focused, never comparative. */
  encouragement: string;
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface ActivityCompletionOverlayProps {
  visible: boolean;
  /** Current difficulty string, e.g. 'easy' | 'medium' | 'hard'. */
  difficulty: string;
  /** Total number of levels completed. */
  totalLevels: number;
  /**
   * Unix timestamp (Date.now()) recorded when the game session started.
   * If provided, an elapsed-time badge is shown.
   */
  gameStartedAt: number | null;
  /** Restart the same activity from level 1. */
  onPlayAgain: () => void;
  /** Navigate to the next activity. */
  onNext: () => void;
  /** Dismiss the overlay — goes back to the activities list. */
  onCancel: () => void;
  theme: ActivityCompletionTheme;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatElapsed(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  if (min === 0) return `${sec} sec`;
  return `${min} min ${sec} sec`;
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ActivityCompletionOverlay({
  visible,
  difficulty,
  totalLevels,
  gameStartedAt,
  onPlayAgain,
  onNext,
  onCancel,
  theme,
}: ActivityCompletionOverlayProps) {
  const t = useTheme();
  // Compute elapsed once when the overlay opens (visible flips to true).
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const elapsed = useMemo(() => {
    if (!gameStartedAt || !visible) return null;
    return formatElapsed(Date.now() - gameStartedAt);
  // Re-run whenever visible changes so time is fresh each time the overlay opens.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const diffLabel = capitalize(difficulty);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.backdrop}>
        <View style={[styles.card, { backgroundColor: t.colors.surface }]}>

          {/* ── Accent colour strip across the top ── */}
          <View style={[styles.strip, { backgroundColor: theme.primary }]} />

          {/* ── Cancel / dismiss X ── */}
          <Pressable
            onPress={onCancel}
            accessibilityRole="button"
            accessibilityLabel="Close"
            hitSlop={10}
            style={[styles.cancelBtn, { backgroundColor: t.colors.background }]}
          >
            <Text style={[styles.cancelX, { color: t.colors.textMuted }]}>✕</Text>
          </Pressable>

          {/* ── Icon + title row ── */}
          <View style={styles.headerRow}>
            <View
              style={[styles.iconCircle, { backgroundColor: theme.light }]}
              accessibilityElementsHidden
            >
              <Text style={styles.iconEmoji}>{theme.emoji}</Text>
            </View>
            <View style={styles.titleBlock}>
              <Text
                style={[styles.cardTitle, { color: t.colors.text }]}
                accessibilityRole="header"
              >
                You did it! 🎉
              </Text>
              <Text style={[styles.cardSub, { color: t.colors.textMuted }]}>
                {theme.label} · {diffLabel} · All {totalLevels} done
              </Text>
            </View>
          </View>

          {/* ── Achievement badges ── */}
          <View style={styles.badges} accessibilityElementsHidden>
            <View style={[styles.badge, { backgroundColor: theme.light }]}>
              <Text style={[styles.badgeText, { color: theme.primary }]}>
                ✅  Completed
              </Text>
            </View>
            <View style={[styles.badge, { backgroundColor: theme.light }]}>
              <Text style={[styles.badgeText, { color: theme.primary }]}>
                🏆  {theme.completionLabel}
              </Text>
            </View>
            {elapsed ? (
              <View style={[styles.badge, { backgroundColor: theme.light }]}>
                <Text style={[styles.badgeText, { color: theme.primary }]}>
                  ⏱  {elapsed}
                </Text>
              </View>
            ) : null}
          </View>

          {/* ── Encouragement quote ── */}
          <View
            style={[
              styles.encourage,
              { borderLeftColor: theme.primary, backgroundColor: theme.light },
            ]}
          >
            <Text style={[styles.encourageText, { color: t.colors.text }]}>
              {theme.encouragement}
            </Text>
          </View>

          <View style={[styles.divider, { backgroundColor: t.colors.background }]} />

          {/* ── Primary action: Play Again ── */}
          <Pressable
            onPress={onPlayAgain}
            accessibilityRole="button"
            accessibilityLabel="Play again"
            style={({ pressed }) => [
              styles.btnAgain,
              { backgroundColor: theme.primary },
              pressed && { opacity: 0.85 },
            ]}
          >
            <Text style={styles.btnAgainText}>▶  Play Again</Text>
          </Pressable>

          {/* ── Secondary action: Next Activity ── */}
          <Pressable
            onPress={onNext}
            accessibilityRole="button"
            accessibilityLabel="Next activity"
            style={({ pressed }) => [
              styles.btnNext,
              { backgroundColor: theme.light },
              pressed && { opacity: 0.85 },
            ]}
          >
            <Text style={[styles.btnNextText, { color: theme.primary }]}>
              Next Activity →
            </Text>
          </Pressable>

        </View>
      </View>
    </Modal>
  );
}

// ─── Per-activity theme presets ───────────────────────────────────────────────

export const ACTIVITY_THEMES = {
  shapeMatch: {
    primary:          '#1565C0',
    light:            '#E3F2FD',
    emoji:            '🔷',
    label:            'Shape Match',
    completionLabel:  'All shapes matched',
    encouragement:    'Every shape found — that takes real focus. Well done! 👏',
  },
  colourPop: {
    primary:          '#E53935',
    light:            '#FFE9E7',
    emoji:            '🎈',
    label:            'Colour Pop',
    completionLabel:  'All colours popped',
    encouragement:    'Finding the right colours while ignoring distractors takes careful focus. Great work! 🌈',
  },
  memoryMatch: {
    primary:          '#6A1B9A',
    light:            '#F3E5F5',
    emoji:            '🧠',
    label:            'Memory Match',
    completionLabel:  'All pairs found',
    encouragement:    'Remembering all those pairs takes real concentration. Amazing work! 🌟',
  },
} satisfies Record<string, ActivityCompletionTheme>;

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(8, 14, 24, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },

  card: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 22,
    overflow: 'hidden',
    // Top padding is larger to clear the colour strip.
    paddingTop:    spacing.xl + 6,
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },

  strip: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 6,
  },

  cancelBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelX: {
    fontSize: 13,
    fontWeight: '800',
    lineHeight: 16,
  },

  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.xs,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  iconEmoji: {
    fontSize: 24,
    lineHeight: 30,
  },
  titleBlock: {
    flex: 1,
  },
  cardTitle: {
    fontSize: typography.heading,
    fontWeight: '900',
    lineHeight: 26,
    letterSpacing: typography.trackHeading,
  },
  cardSub: {
    fontSize: typography.caption,
    marginTop: 2,
    fontWeight: '600',
  },

  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  badge: {
    paddingVertical: 6,
    paddingHorizontal: 11,
    borderRadius: 10,
  },
  badgeText: {
    fontSize: typography.caption,
    fontWeight: '700',
  },

  encourage: {
    borderRadius: 12,
    borderLeftWidth: 4,
    padding: spacing.md,
  },
  encourageText: {
    fontSize: typography.callout,
    fontWeight: '600',
    lineHeight: 22,
  },

  divider: {
    height: 1,
    marginHorizontal: -spacing.xl,
  },

  btnAgain: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
  },
  btnAgainText: {
    fontSize: typography.body,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },

  btnNext: {
    width: '100%',
    paddingVertical: 13,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  btnNextText: {
    fontSize: typography.callout,
    fontWeight: '700',
  },
});
