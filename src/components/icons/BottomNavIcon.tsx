import { Asset } from 'expo-asset';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { SvgUri } from 'react-native-svg';
import { useReduceMotion } from '../../hooks/useReduceMotion';

export type BottomNavIconName = 'board' | 'activity' | 'calendar' | 'profile' | 'tools';

type IconVariants = { kind: 'svg'; selected: number; unselected: number };

// Every tab uses the same SVG cross-fade rig — one selected (colour) layer
// and one unselected (neutral outline) layer cross-fading on focus.
const ICONS: Record<BottomNavIconName, IconVariants> = {
  board: {
    kind: 'svg',
    selected: require('../../../assets/bottom_nav_icons/board-selected.svg'),
    unselected: require('../../../assets/bottom_nav_icons/board-unselected.svg'),
  },
  activity: {
    kind: 'svg',
    selected: require('../../../assets/bottom_nav_icons/activity-selected.svg'),
    unselected: require('../../../assets/bottom_nav_icons/activity-unselected.svg'),
  },
  calendar: {
    kind: 'svg',
    selected: require('../../../assets/bottom_nav_icons/calendar-selected.svg'),
    unselected: require('../../../assets/bottom_nav_icons/calendar-unselected.svg'),
  },
  profile: {
    kind: 'svg',
    selected: require('../../../assets/bottom_nav_icons/profile-selected.svg'),
    unselected: require('../../../assets/bottom_nav_icons/profile-unselected.svg'),
  },
  // Custom toolbox SVGs (hammer + box) — same cross-fade rig as the other
  // bottom-nav icons. Selected = full colour, unselected = neutral outline.
  tools: {
    kind: 'svg',
    selected: require('../../../assets/bottom_nav_icons/tools-selected.svg'),
    unselected: require('../../../assets/bottom_nav_icons/tools-unselected.svg'),
  },
};

// Optical icon sizing — every icon's VISIBLE GLYPH appears at ~50pt height
// regardless of which tab or state (selected/unselected).
//
// Why a flat "all icons the same height" doesn't work:
//   • Selected icons embed a drop-shadow filter (dy=4, blur=2) inside their
//     SVG viewBox, consuming ~6pt of vertical space below the glyph. At equal
//     render heights their visible glyph is shorter than an unselected icon
//     with no shadow.
//   • The tools icon has NO shadow in either state, so at the same render
//     height its glyph appears 12–15% taller — making it look out of place.
//   • activity-unselected (49×39 viewBox) is very landscape; a fitToHeight
//     approach makes it disproportionately wide.
//
// Solution: pre-compute display dimensions so each glyph ≈ 50pt optical height.
//   selected   → display_h = viewBox_h × (50 / glyph_h)  [glyph_h ≈ viewBox_h - 6]
//   unselected → scale viewBox to place glyph at 50pt (no shadow to compensate)
//   tools      → no shadow in either state; shown at 50pt so glyph matches others
//
type DisplayDim = { w: number; h: number };
const rr = (n: number) => Math.round(n);

const ICON_DISPLAY: Record<BottomNavIconName, { selected: DisplayDim; unselected: DisplayDim }> = {
  // board-selected  54×53: shadow ≈6pt → glyph ≈47pt
  // board-unselected 47×47: glyph ≈46pt (minimal margin)
  board: {
    selected:   { w: rr(54 * 50 / 47), h: rr(53 * 50 / 47) },  // 57×56
    unselected: { w: rr(47 * 50 / 46), h: rr(47 * 50 / 46) },  // 51×51
  },
  // activity-selected  61×51: shadow ≈6pt → glyph ≈45pt. Wide icon by design.
  // activity-unselected 49×39: no shadow, glyph ≈37pt. Inherently landscape.
  activity: {
    selected:   { w: rr(61 * 50 / 45), h: rr(51 * 50 / 45) },  // 68×57
    unselected: { w: rr(49 * 50 / 37), h: rr(39 * 50 / 37) },  // 66×53
  },
  // calendar-selected  57×57: tick marks at top + shadow; glyph span ≈51pt
  // calendar-unselected 50×49: ticks + body ≈46pt glyph
  calendar: {
    selected:   { w: rr(57 * 50 / 51), h: rr(57 * 50 / 51) },  // 56×56
    unselected: { w: rr(50 * 50 / 46), h: rr(49 * 50 / 46) },  // 54×53
  },
  // profile-selected  51×55: shadow ≈6pt → glyph ≈49pt
  // profile-unselected 46×48: no shadow, glyph ≈46pt
  profile: {
    selected:   { w: rr(51 * 50 / 49), h: rr(55 * 50 / 49) },  // 52×56
    unselected: { w: rr(46 * 50 / 46), h: rr(48 * 50 / 46) },  // 50×52
  },
  // tools: NO shadow in either state → show at exactly 50pt so glyph matches
  // the shadow-compensated selected icons rather than appearing taller.
  tools: {
    selected:   { w: rr(42 * 50 / 44), h: 50 },  // 48×50
    unselected: { w: 50, h: 50 },                 // 50×50
  },
};

// Container sized to the widest icon (activity-unselected ≈ 66pt) + margin.
const CONTAINER_W = 74;
// Tallest icon (activity-selected ≈ 57pt) + breathing room.
const CONTAINER_H = 62;
const TRANSITION_MS = 200;

export function BottomNavIcon({
  name,
  focused,
}: {
  name: BottomNavIconName;
  focused: boolean;
}) {
  const variants = ICONS[name];
  const reduceMotion = useReduceMotion();
  const [selectedUri, setSelectedUri] = useState<string | null>(null);
  const [unselectedUri, setUnselectedUri] = useState<string | null>(null);

  // Two opacity tracks so we can cross-fade between the colored and outlined
  // variants instead of swapping them instantly. Keeps the transition subtle.
  const selectedOpacity = useRef(new Animated.Value(focused ? 1 : 0)).current;
  const unselectedOpacity = useRef(new Animated.Value(focused ? 0 : 1)).current;
  // A small scale lift on focus — barely perceptible but adds polish.
  const scale = useRef(new Animated.Value(1)).current;

  // Preload both SVG variants so the cross-fade has both layers ready on
  // first tap.
  useEffect(() => {
    let cancelled = false;
    async function resolve() {
      const s = Asset.fromModule(variants.selected);
      const u = Asset.fromModule(variants.unselected);
      await Promise.all([s.downloadAsync(), u.downloadAsync()]);
      if (!cancelled) {
        setSelectedUri(s.localUri ?? s.uri);
        setUnselectedUri(u.localUri ?? u.uri);
      }
    }
    resolve();
    return () => {
      cancelled = true;
    };
  }, [name, variants]);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(selectedOpacity, {
        toValue: focused ? 1 : 0,
        duration: TRANSITION_MS,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(unselectedOpacity, {
        toValue: focused ? 0 : 1,
        duration: TRANSITION_MS,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: reduceMotion ? 1 : focused ? 1 : 0.96,
        duration: reduceMotion ? 0 : TRANSITION_MS,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [focused, reduceMotion, selectedOpacity, unselectedOpacity, scale]);

  const dims = ICON_DISPLAY[name];

  if (!selectedUri || !unselectedUri) {
    // Reserve layout so the tab bar doesn't reflow on first paint.
    return <View style={{ width: CONTAINER_W, height: CONTAINER_H }} />;
  }

  return (
    <Animated.View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[{ width: CONTAINER_W, height: CONTAINER_H }, { transform: [{ scale }] }]}
    >
      <Animated.View style={[styles.layer, { opacity: unselectedOpacity }]}>
        <SvgUri uri={unselectedUri} width={dims.unselected.w} height={dims.unselected.h} />
      </Animated.View>
      <Animated.View style={[styles.layer, { opacity: selectedOpacity }]}>
        <SvgUri uri={selectedUri} width={dims.selected.w} height={dims.selected.h} />
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  layer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
