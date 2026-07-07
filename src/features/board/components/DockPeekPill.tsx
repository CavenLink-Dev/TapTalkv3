// ─── DockPeekPill — "way back" when the bottom control bar is hidden ─────────
// Extracted from app/(tabs)/talk.tsx (God-screen split, problem #1).
//
// A soft floating pill hugging the left edge, vertically centred where the
// dock used to sit, with a burger grip so it reads as a floating handle above
// the board. Tap restores the controls; long-press opens a partial-hide
// popover (owned by the parent).
//
// Pure presentational leaf — parent owns both handlers.

import React, { useEffect, useRef } from 'react';
import { Animated as RNAnimated, Pressable, StyleSheet, View } from 'react-native';

import { useTheme } from '../../../theme/useTheme';
import { useReduceMotion } from '../../../hooks/useReduceMotion';
import {
  DOCK_ACTION_SIZE,
  DOCK_BOTTOM_GAP,
} from '../constants';

export function DockPeekPill({
  onPress,
  onLongPress,
}: {
  onPress: () => void;
  onLongPress: () => void;
}) {
  const t = useTheme();
  const reduceMotion = useReduceMotion();
  const anim = useRef(new RNAnimated.Value(0)).current;

  useEffect(() => {
    if (reduceMotion) { anim.setValue(1); return; }
    anim.setValue(0);
    RNAnimated.spring(anim, {
      toValue: 1,
      friction: 7,
      tension: 64,
      useNativeDriver: true,
    }).start();
  }, [anim, reduceMotion]);

  return (
    <RNAnimated.View
      style={[
        styles.mount,
        {
          opacity: anim,
          transform: [{
            translateX: anim.interpolate({ inputRange: [0, 1], outputRange: [-64, 0] }),
          }],
        },
      ]}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Show controls"
        accessibilityHint="Double tap to bring back the control bar and navigation bar. Long press for partial options."
        onPress={onPress}
        onLongPress={onLongPress}
        delayLongPress={350}
        hitSlop={{ top: 10, bottom: 10, left: 0, right: 10 }}
        style={({ pressed }) => [
          styles.pill,
          {
            backgroundColor: t.isDark ? t.colors.navBackground : '#FFFFFF',
            borderColor: t.colors.symbolOutline,
            opacity: pressed ? 0.7 : 1,
          },
        ]}
      >
        <View style={styles.grip}>
          <View style={[styles.gripBar, { backgroundColor: t.colors.textMuted }]} />
          <View style={[styles.gripBar, { backgroundColor: t.colors.textMuted }]} />
          <View style={[styles.gripBar, { backgroundColor: t.colors.textMuted }]} />
        </View>
      </Pressable>
    </RNAnimated.View>
  );
}

const styles = StyleSheet.create({
  mount: {
    position: 'absolute',
    left: 0,
    bottom: DOCK_BOTTOM_GAP + Math.max(0, (DOCK_ACTION_SIZE - 56) / 2),
  },
  pill: {
    width: 44,
    height: 56,
    borderTopRightRadius: 20,
    borderBottomRightRadius: 20,
    borderWidth: 1.6,
    borderLeftWidth: 0,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOpacity: 0.12,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  grip: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  gripBar: {
    width: 14,
    height: 2.5,
    borderRadius: 1.25,
  },
});
