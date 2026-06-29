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

const ICON_SIZE = 34;
// Activity SVG has a landscape aspect ratio (~1.26:1) so it appears shorter
// than the other square/portrait icons at the same pixel size. Render it at
// 56px so its constrained height (~44–47px) matches the visual weight of the
// other icons (~44–48px). Applies equally to selected + unselected variants.
const ICON_SIZES: Partial<Record<BottomNavIconName, number>> = {
  activity: 40,
};
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

  const iconSize = ICON_SIZES[name] ?? ICON_SIZE;

  if (!selectedUri || !unselectedUri) {
    // Reserve layout so the tab bar doesn't reflow on first paint.
    return <View style={{ width: iconSize, height: iconSize }} />;
  }

  return (
    <Animated.View style={[{ width: iconSize, height: iconSize }, { transform: [{ scale }] }]}>
      <Animated.View style={[styles.layer, { opacity: unselectedOpacity }]}>
        <SvgUri uri={unselectedUri} width={iconSize} height={iconSize} />
      </Animated.View>
      <Animated.View style={[styles.layer, { opacity: selectedOpacity }]}>
        <SvgUri uri={selectedUri} width={iconSize} height={iconSize} />
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: ICON_SIZE,
    height: ICON_SIZE,
  },
  layer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
