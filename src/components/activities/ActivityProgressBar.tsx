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

import { Asset } from 'expo-asset';
import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { SvgUri } from 'react-native-svg';
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
const MIN_DOT_RADIUS = 3.5;
const MAX_DOT_RADIUS = 10;
const MIN_DOT_SPACING = 8;
const BACK_BUTTON_SIZE = 40;

const BACK_BUTTON_ASSET = require('../../../assets/progress_bar/back_button.svg');
const TRACK_ASSET = require('../../../assets/progress_bar/progress_bar_background.svg');
const FILL_COLOR = '#199AEE';

export function ActivityProgressBar({
  current,
  total,
  onBack,
  backAccessibleLabel = 'Back',
  progressAccessibleLabel,
}: ActivityProgressBarProps) {
  const [backUri, setBackUri] = useState<string | null>(null);
  const [trackUri, setTrackUri] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function resolve() {
      const back = Asset.fromModule(BACK_BUTTON_ASSET);
      const track = Asset.fromModule(TRACK_ASSET);
      await Promise.all([back.downloadAsync(), track.downloadAsync()]);
      if (!cancelled) {
        setBackUri(back.localUri ?? back.uri);
        setTrackUri(track.localUri ?? track.uri);
      }
    }
    resolve();
    return () => {
      cancelled = true;
    };
  }, []);

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
          {backUri ? (
            <SvgUri width={BACK_BUTTON_SIZE} height={BACK_BUTTON_SIZE} uri={backUri} />
          ) : (
            <View style={styles.backButtonPlaceholder} />
          )}
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
        <Bar current={safeCurrent} total={safeTotal} trackUri={trackUri} />
      </View>
    </View>
  );
}

function Bar({
  current,
  total,
  trackUri,
}: {
  current: number;
  total: number;
  trackUri: string | null;
}) {
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
      {/* Track background */}
      {trackUri ? (
        <View style={StyleSheet.absoluteFill}>
          <SvgUri width={barWidth} height={TRACK_HEIGHT} uri={trackUri} />
        </View>
      ) : (
        <View style={[styles.trackPlaceholder, { width: barWidth, height: TRACK_HEIGHT }]} />
      )}

      {/* Fill dots */}
      <Svg width={barWidth} height={TRACK_HEIGHT} style={StyleSheet.absoluteFill}>
        {dots.map(d => (
          <Circle
            key={d.key}
            cx={d.cx}
            cy={TRACK_HEIGHT / 2}
            r={dotRadius}
            fill={d.filled ? FILL_COLOR : 'transparent'}
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
  backButtonPlaceholder: {
    width: BACK_BUTTON_SIZE,
    height: BACK_BUTTON_SIZE,
    borderRadius: BACK_BUTTON_SIZE / 2,
    backgroundColor: '#FFFFFF',
  },
  barContainer: {
    flex: 1,
    height: TRACK_HEIGHT,
  },
  barInner: {
    width: '100%',
    height: TRACK_HEIGHT,
  },
  trackPlaceholder: {
    borderRadius: TRACK_HEIGHT / 2,
    backgroundColor: '#D5E1E8',
  },
});
