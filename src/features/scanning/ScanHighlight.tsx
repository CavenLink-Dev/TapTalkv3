/**
 * ScanHighlight — visual ring drawn over the currently-scanned row or tile.
 *
 * Positioned absolutely over a target `LayoutRectangle`. The parent view
 * (typically the board grid) measures its tiles once on layout and passes
 * the rectangle for the active row / column; this component pulses the
 * ring subtly so users with reduced central vision can still spot it
 * without inducing motion discomfort.
 *
 * Reduce Motion: when active, we skip the pulse entirely and render a
 * static ring at full opacity. That respects both iOS system Reduce
 * Motion and TapTalk's in-app override.
 */

import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View, type LayoutRectangle } from 'react-native';
import { useReduceMotion } from '../../hooks/useReduceMotion';
import { colors, radii } from '../../theme/tokens';

export interface ScanHighlightProps {
  /** Rectangle to draw the ring around, in the parent's coordinate space. */
  rect: LayoutRectangle | null;
  /** Row highlight is thicker + a different colour than column highlight. */
  variant: 'row' | 'column';
  /** Optional colour override — falls back to the theme focus tokens. */
  color?: string;
  /** Ring stroke thickness. Row=4, column=6 by default (tile is smaller). */
  strokeWidth?: number;
}

export function ScanHighlight({
  rect,
  variant,
  color,
  strokeWidth,
}: ScanHighlightProps): React.ReactElement | null {
  const reduceMotion = useReduceMotion();
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (reduceMotion) {
      pulse.setValue(1);
      return;
    }
    // Gentle 800ms breathing pulse — long enough to not read as flicker,
    // short enough to feel responsive. Loops until rect changes.
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 0.55,
          duration: 800,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: 800,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => {
      loop.stop();
    };
  }, [pulse, reduceMotion, rect?.x, rect?.y, rect?.width, rect?.height]);

  if (!rect) return null;
  if (rect.width <= 0 || rect.height <= 0) return null;

  // Yellow ring for the row phase, blue for the tile phase — high-luminance
  // pairing that stays discriminable for the most common colour-vision
  // deficiencies (deuteranopia/protanopia).
  const ringColor = color ?? (variant === 'row' ? '#FFCC00' : colors.primary);
  const stroke = strokeWidth ?? (variant === 'row' ? 4 : 6);

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.ring,
        {
          left: rect.x - stroke,
          top: rect.y - stroke,
          width: rect.width + stroke * 2,
          height: rect.height + stroke * 2,
          borderColor: ringColor,
          borderWidth: stroke,
          borderRadius: radii.card,
          opacity: pulse,
        },
      ]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    />
  );
}

const styles = StyleSheet.create({
  ring: {
    position: 'absolute',
    // Draw over the tile without capturing input.
    backgroundColor: 'transparent',
    // Slight glow to raise contrast against high-key tiles. Shadow works
    // on iOS with `shadowColor` — Android would need elevation but the
    // app is iOS-only per the AAC scope.
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
  },
});
