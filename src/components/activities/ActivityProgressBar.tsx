/**
 * ActivityProgressBar
 *
 * Shared progress indicator used across every Activity game.
 * Renders a continuous left-to-right fill bar — the fill grows
 * from 0% (no progress) to 100% (all levels done) as levels complete.
 *
 * Assets:
 *   - Back button: circular button with dark arrow.
 *   - Track: rounded pill in #D5E1E8.
 *   - Fill: blue pill in #199AEE that starts at the left edge and
 *     expands rightward. No individual dots per level.
 */

import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { spacing } from '../../theme/tokens';

interface ActivityProgressBarProps {
  /** 1-based current level. */
  current: number;
  /** Total levels in the current difficulty. */
  total: number;
  /** Called when the back button is pressed. */
  onBack: () => void;
  /** Screen-reader label for the back button. */
  backAccessibleLabel?: string;
  /** Screen-reader label describing current progress, e.g. "Level 3 of 15". */
  progressAccessibleLabel?: string;
}

const TRACK_HEIGHT = 25;
const TRACK_COLOR  = '#D5E1E8';
const FILL_COLOR   = '#199AEE';
const BACK_SIZE    = 40;

export function ActivityProgressBar({
  current,
  total,
  onBack,
  backAccessibleLabel = 'Back',
  progressAccessibleLabel,
}: ActivityProgressBarProps) {
  const safeTotal   = Math.max(1, total);
  const safeCurrent = Math.max(0, Math.min(current, safeTotal));

  return (
    <View style={styles.container}>
      <Pressable
        onPress={onBack}
        style={styles.backButton}
        accessibilityRole="button"
        accessibilityLabel={backAccessibleLabel}
      >
        <View style={styles.backCircle}>
          <Svg width={BACK_SIZE} height={BACK_SIZE} viewBox="0 0 40 40">
            <Path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M21.0996 7.09993C21.6803 7.67849 21.6803 8.61651 21.0996 9.19506L11.7426 18.5179H31.8458C32.667 18.5179 33.3327 19.1811 33.3327 19.9993C33.3327 20.8175 32.667 21.4808 31.8458 21.4808H11.7426L21.0996 30.8036C21.6803 31.3822 21.6803 32.3202 21.0996 32.8988C20.5189 33.4773 19.5775 33.4773 18.9968 32.8988L7.10152 21.0469C6.52085 20.4684 6.52085 19.5303 7.10152 18.9518L18.9968 7.09993C19.5775 6.52138 20.5189 6.52138 21.0996 7.09993Z"
              fill="#252222"
            />
          </Svg>
        </View>
      </Pressable>

      <View
        style={styles.trackContainer}
        accessibilityRole="progressbar"
        accessibilityLabel={progressAccessibleLabel}
        accessibilityValue={{
          min: 0,
          max: safeTotal,
          now: safeCurrent,
          text: `Level ${safeCurrent} of ${safeTotal}`,
        }}
      >
        <FillBar current={safeCurrent} total={safeTotal} />
      </View>
    </View>
  );
}

// ─── Fill bar ───────────────────────────────────────────────────────────────

function FillBar({ current, total }: { current: number; total: number }) {
  const [trackWidth, setTrackWidth] = useState(0);

  // Progress fraction: start at a small but visible dot at level 1,
  // reach 100% only when current === total.
  const fraction = current / total;

  // Ensure the blue pill is at least as wide as the track is tall so
  // it always shows its full rounded cap even at the very first level.
  const minFill = trackWidth > 0 ? TRACK_HEIGHT / trackWidth : 0;
  const fillWidth = trackWidth > 0
    ? Math.max(fraction * trackWidth, TRACK_HEIGHT)
    : 0;

  void minFill; // suppress lint — used implicitly via Math.max above

  return (
    <View
      onLayout={e => setTrackWidth(e.nativeEvent.layout.width)}
      style={styles.track}
    >
      {trackWidth > 0 && (
        <View
          style={[
            styles.fill,
            { width: fillWidth },
          ]}
        />
      )}
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  backButton: {
    width: BACK_SIZE,
    height: BACK_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  backCircle: {
    width: BACK_SIZE,
    height: BACK_SIZE,
    borderRadius: BACK_SIZE / 2,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  trackContainer: {
    flex: 1,
    height: TRACK_HEIGHT,
  },
  track: {
    width: '100%',
    height: TRACK_HEIGHT,
    borderRadius: TRACK_HEIGHT / 2,
    backgroundColor: TRACK_COLOR,
    overflow: 'hidden',
  },
  fill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    borderRadius: TRACK_HEIGHT / 2,
    backgroundColor: FILL_COLOR,
  },
});
