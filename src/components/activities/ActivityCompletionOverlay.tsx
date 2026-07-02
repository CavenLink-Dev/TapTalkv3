/**
 * ActivityCompletionOverlay
 *
 * Shared completion card shown at the end of every activity game.
 * Design (activity rules §7 + completion-screen spec):
 *   • Square card with soft continuous corners — never a tall pill modal.
 *   • Green check badge — positive, non-comparative.
 *   • Title "Great work!" with a per-game sub line (§7 structure).
 *   • Quiet session stats: levels, time, difficulty. No scores, no star
 *     ratings, no accuracy % — effort-first, never shaming.
 *   • Actions stacked: Play Again (brand-blue primary), Next Activity
 *     (soft blue secondary), Back to Activities (ghost). Buttons always use
 *     the brand/mascot blue family — theme.primary tints stats only.
 *     Cancel X stays top-right — no trapping.
 *   • Copy is calm and sentence case. No emoji, no praise spam.
 */

import React, { useMemo } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Icon } from '../native/Icon';
import { colors, radii, spacing, typography } from '../../theme/tokens';
import { useTheme } from '../../theme/useTheme';

// Soft tint of the brand blue for the secondary action — same family as
// colors.primary (#199AEE), matching the tint already used across activity
// footers (e.g. Colour Pop's footerGhost).
const SOFT_BLUE_TINT = '#E6F4FD';

// ─── Theme ────────────────────────────────────────────────────────────────────

/** Per-activity visual identity for the completion card. */
export interface ActivityCompletionTheme {
  /** Accent colour — stat values only. Buttons always use brand blue. */
  primary: string;
  /** Light tint of primary. Kept for compatibility; buttons no longer use it. */
  light: string;
  /** Short activity name, e.g. "Shape Match". */
  label: string;
  /** Sub-line verb phrase, e.g. "You matched every shape". */
  completionLabel: string;
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
   * If provided, a time stat is shown.
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
  if (min === 0) return `${sec}s`;
  return `${min}m ${sec}s`;
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
  const elapsed = useMemo(() => {
    if (!gameStartedAt || !visible) return null;
    return formatElapsed(Date.now() - gameStartedAt);
  // Re-run whenever visible changes so time is fresh each time the overlay opens.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const diffLabel = capitalize(difficulty);

  const stat = (label: string, value: string) => (
    <View
      style={[styles.statCell, { backgroundColor: t.colors.background }]}
      accessible
      accessibilityLabel={`${label}: ${value}`}
    >
      <Text style={[styles.statValue, { color: theme.primary }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: t.colors.textMuted }]}>{label}</Text>
    </View>
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.backdrop}>
        <View style={[styles.card, { backgroundColor: t.colors.surface }]}>

          {/* ── Cancel / dismiss X ── */}
          <Pressable
            onPress={onCancel}
            accessibilityRole="button"
            accessibilityLabel="Close and go back to activities"
            hitSlop={12}
            style={[styles.cancelBtn, { backgroundColor: t.colors.background }]}
          >
            <Icon name="close" size={18} color={t.colors.textMuted} />
          </Pressable>

          {/* ── Green check badge (§7) ── */}
          <View
            style={[styles.checkBadge, { backgroundColor: colors.success }]}
            accessibilityElementsHidden
          >
            <Icon name="checkmark" size={48} color="#FFFFFF" />
          </View>

          {/* ── Title + sub ── */}
          <Text
            style={[styles.cardTitle, { color: t.colors.text }]}
            accessibilityRole="header"
          >
            Great work!
          </Text>
          <Text style={[styles.cardSub, { color: t.colors.textMuted }]}>
            {theme.completionLabel} across {totalLevels} {diffLabel.toLowerCase()} levels.
          </Text>

          {/* ── Session stats — quiet, factual, never comparative ── */}
          <View style={styles.statsRow}>
            {stat('Levels', String(totalLevels))}
            {elapsed ? stat('Time', elapsed) : null}
            {stat('Difficulty', diffLabel)}
          </View>

          {/* ── Actions (§7): Play Again / Next Activity / Back ── */}
          <Pressable
            onPress={onPlayAgain}
            accessibilityRole="button"
            accessibilityLabel="Play again from level 1"
            style={({ pressed }) => [
              styles.btnAgain,
              { backgroundColor: colors.primary },
              pressed && { opacity: 0.85 },
            ]}
          >
            <Icon name="refresh" size={20} color="#FFFFFF" />
            <Text style={styles.btnAgainText}>Play Again</Text>
          </Pressable>

          <Pressable
            onPress={onNext}
            accessibilityRole="button"
            accessibilityLabel="Next activity"
            style={({ pressed }) => [
              styles.btnNext,
              { backgroundColor: SOFT_BLUE_TINT },
              pressed && { opacity: 0.85 },
            ]}
          >
            <Text style={[styles.btnNextText, { color: colors.primaryDark }]}>
              Next Activity
            </Text>
          </Pressable>

          <Pressable
            onPress={onCancel}
            accessibilityRole="button"
            accessibilityLabel="Back to activities"
            style={({ pressed }) => [styles.btnGhost, pressed && { opacity: 0.7 }]}
          >
            <Text style={[styles.btnGhostText, { color: t.colors.textMuted }]}>
              Back to Activities
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
    label:            'Shape Match',
    completionLabel:  'You matched every shape',
  },
  colourPop: {
    primary:          '#E53935',
    light:            '#FFE9E7',
    label:            'Colour Pop',
    completionLabel:  'You found every colour',
  },
  memoryMatch: {
    primary:          '#6A1B9A',
    light:            '#F3E5F5',
    label:            'Memory Match',
    completionLabel:  'You remembered every shape',
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

  // Square card, soft continuous corners
  card: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 22,
    overflow: 'hidden',
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    gap: spacing.md,
  },

  cancelBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },

  checkBadge: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sm,
  },

  cardTitle: {
    fontSize: typography.title,
    fontWeight: '800',
    letterSpacing: typography.trackTitle,
    textAlign: 'center',
  },
  cardSub: {
    fontSize: typography.body,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 22,
  },

  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    width: '100%',
    marginTop: spacing.xs,
  },
  statCell: {
    flex: 1,
    borderRadius: radii.card,
    paddingVertical: spacing.md,
    alignItems: 'center',
    gap: 2,
  },
  statValue: {
    fontSize: typography.subheading,
    fontWeight: '800',
  },
  statLabel: {
    fontSize: typography.caption,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },

  btnAgain: {
    width: '100%',
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 15,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 54,
    marginTop: spacing.xs,
  },
  btnAgainText: {
    fontSize: typography.body,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },

  btnNext: {
    width: '100%',
    paddingVertical: 13,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
  },
  btnNextText: {
    fontSize: typography.callout,
    fontWeight: '700',
  },

  btnGhost: {
    width: '100%',
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  btnGhostText: {
    fontSize: typography.callout,
    fontWeight: '600',
  },
});
