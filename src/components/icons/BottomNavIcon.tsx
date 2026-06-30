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

// Bulky bottom-nav icons — user-explicit. Every icon renders at the same
// VISUAL height (TARGET_H) regardless of (a) which tab it is or (b) whether
// it's selected or unselected. Each SVG has a different viewBox and aspect
// ratio (some include extra padding around the glyph for a shadow, some are
// landscape, some are portrait), so a flat "all icons are 56×56" makes the
// activity icon look short and the profile icon look narrow. We pre-compute
// per-(name, state) display dimensions that scale each SVG to TARGET_H tall
// and let width follow the SVG's own aspect ratio. The icon container is
// sized to fit the widest variant so layout never shifts.
const TARGET_H = 50;
type DisplayDim = { w: number; h: number };
function fitToHeight(w: number, h: number): DisplayDim {
  return { w: Math.round((w / h) * TARGET_H), h: TARGET_H };
}
const ICON_DISPLAY: Record<BottomNavIconName, { selected: DisplayDim; unselected: DisplayDim }> = {
  board:    { selected: fitToHeight(54, 53), unselected: fitToHeight(47, 47) },
  activity: { selected: fitToHeight(61, 51), unselected: fitToHeight(49, 39) },
  calendar: { selected: fitToHeight(57, 57), unselected: fitToHeight(50, 49) },
  profile:  { selected: fitToHeight(51, 55), unselected: fitToHeight(46, 48) },
  tools:    { selected: fitToHeight(42, 44), unselected: fitToHeight(43, 43) },
};
// Widest rendered icon across all (name, state) pairs — currently
// activity-unselected at fitToHeight(49,39) ≈ 63pt wide. We pad to 68 so
// no icon ever clips and every tab column is the same width.
const CONTAINER_W = 68;
const CONTAINER_H = TARGET_H + 4; // a touch of vertical breathing room
const TRANSITION_MS = 200;
const IDLE_TINT = '#4B555C';

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
    <Animated.View style={[{ width: CONTAINER_W, height: CONTAINER_H }, { transform: [{ scale }] }]}>
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
