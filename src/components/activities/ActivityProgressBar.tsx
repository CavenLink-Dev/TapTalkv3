/**
 * ActivityProgressBar
 *
 * Shared progress indicator used across every Activity game. Replaces the
 * old text-only "Level X of Y" pill with a visual bar, while keeping the
 * text accessible to screen readers.
 *
 * Assets:
 *   - Back button: circular white button with dark arrow.
 *   - Track: long rounded pill in #D5E1E8.
 *   - Fill: blue circle in #199AEE for completed levels.
 *
 * Behaviour:
 *   - One dot per level in the chosen difficulty.
 *   - Dots 1..current are filled blue; remaining dots match the track.
 *   - Back button navigates via the supplied `onBack` callback.
 */

import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
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
const TRACK_COLOR = '#D5E1E8';
const FILL_COLOR = '#199AEE';
const MIN_DOT_RADIUS = 3.5;
const MAX_DOT_RADIUS = 10;
const MIN_DOT_SPACING = 8;
const BACK_BUTTON_SIZE = 40;

export function ActivityProgressBar({
  current,
  total,
  onBack,
  backAccessibleLabel = 'Back',
  progressAccessibleLabel,
}: ActivityProgressBarProps) {
  // Clamp values so the bar always renders something sensible.
  const safeTotal = Math.max(1, total);
  const safeCurrent = Math.max(1, Math.min(current, safeTotal));

  return (
    <View style={styles.container}>
      <Pressable
        onPress={onBack}
        style={styles.backButton}
        accessibilityRole="button"
        accessibilityLabel={backAccessibleLabel}
      >
        <View style={styles.backButtonCircle}>
          <Svg width={BACK_BUTTON_SIZE} height={BACK_BUTTON_SIZE} viewBox="0 0 40 40">
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
        style={styles.barContainer}
        accessibilityRole="progressbar"
        accessibilityLabel={progressAccessibleLabel}
        accessibilityValue={{
          min: 1,
          max: safeTotal,
          now: safeCurrent,
          text: `Level ${safeCurrent} of ${safeTotal}`,
        }}
      >
        <Bar current={safeCurrent} total={safeTotal} />
      </View>
    </View>
  );
}

function Bar({ current, total }: { current: number; total: number }) {
  const [width, setWidth] = React.useState(0);

  const padding = 8;
  const availableWidth = Math.max(0, width - padding * 2);
  const dotSpacing = Math.max(MIN_DOT_SPACING, availableWidth / (total + 1));
  const rawRadius = Math.min(dotSpacing / 2, TRACK_HEIGHT / 2 - 2);
  const dotRadius = Math.max(MIN_DOT_RADIUS, Math.min(MAX_DOT_RADIUS, rawRadius));
  const barWidth = width || 1;

  const dots = Array.from({ length: total }, (_, i) => {
    const cx = padding + (availableWidth * (i + 1)) / (total + 1);
    return { key: i, cx, filled: i < current };
  });

  return (
    <View style={styles.barInner} onLayout={e => setWidth(e.nativeEvent.layout.width)}>
      <Svg width={barWidth} height={TRACK_HEIGHT}>
        {/* Track background */}
        <Rect x={0} y={0} width={barWidth} height={TRACK_HEIGHT} rx={TRACK_HEIGHT / 2} fill={TRACK_COLOR} />
        {/* Fill dots */}
        {dots.map(d => (
          <Circle
            key={d.key}
            cx={d.cx}
            cy={TRACK_HEIGHT / 2}
            r={dotRadius}
            fill={d.filled ? FILL_COLOR : TRACK_COLOR}
          />
        ))}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  backButton: {
    width: BACK_BUTTON_SIZE,
    height: BACK_BUTTON_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonCircle: {
    width: BACK_BUTTON_SIZE,
    height: BACK_BUTTON_SIZE,
    borderRadius: BACK_BUTTON_SIZE / 2,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  barContainer: {
    flex: 1,
    height: TRACK_HEIGHT,
  },
  barInner: {
    width: '100%',
    height: TRACK_HEIGHT,
  },
});
