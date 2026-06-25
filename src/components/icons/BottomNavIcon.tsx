import { Asset } from 'expo-asset';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { SvgUri } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/tokens';

export type BottomNavIconName = 'board' | 'activity' | 'calendar' | 'profile' | 'tools';

type SvgVariants = { kind: 'svg'; selected: number; unselected: number };
type IoniconsVariants = {
  kind: 'ionicons';
  selected: React.ComponentProps<typeof Ionicons>['name'];
  unselected: React.ComponentProps<typeof Ionicons>['name'];
};
type IconVariants = SvgVariants | IoniconsVariants;

// 'tools' uses Ionicons (no SVG asset yet). Everything else keeps the
// existing SVG cross-fade so the visual language stays identical.
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
  // `tools` is a composite — hammer + wrench stacked — so we can light each
  // part with its own colour on selection (hammer blue, wrench yellow) while
  // both share the neutral idle tint when unfocused. Same visual size as the
  // SVG-backed icons via `IONICON_SIZE`.
  tools: {
    kind: 'ionicons',
    selected: 'construct',
    unselected: 'construct-outline',
  },
};

// Smaller than the previous 60/64 so the tab bar reads closer to a standard
// iOS tab bar without losing legibility for users with low vision.
const ICON_SIZE = 48;
// Ionicons render slightly heavier than the existing SVGs, but we still aim
// for the same optical footprint as the 48pt SVG icons. 40 lands close to
// the SVGs' inked area; under that the tools tab looked notably smaller.
const IONICON_SIZE = 40;
const TRANSITION_MS = 200;
const IDLE_TINT = '#4B555C';
// Component colours for the tools tab's selected state — hammer reads blue,
// wrench reads yellow, echoing the symbol palette on the talk board.
const TOOLS_HAMMER_COLOR = '#0A84FF';
const TOOLS_WRENCH_COLOR = '#FFD60A';

export function BottomNavIcon({
  name,
  focused,
}: {
  name: BottomNavIconName;
  focused: boolean;
}) {
  const variants = ICONS[name];
  const [selectedUri, setSelectedUri] = useState<string | null>(null);
  const [unselectedUri, setUnselectedUri] = useState<string | null>(null);

  // Two opacity tracks so we can cross-fade between the colored and outlined
  // variants instead of swapping them instantly. Keeps the transition subtle.
  const selectedOpacity = useRef(new Animated.Value(focused ? 1 : 0)).current;
  const unselectedOpacity = useRef(new Animated.Value(focused ? 0 : 1)).current;
  // A small scale lift on focus — barely perceptible but adds polish.
  const scale = useRef(new Animated.Value(focused ? 1 : 0.94)).current;

  // Preload both SVG variants so the cross-fade has both layers ready on
  // first tap. Ionicons variant skips this entirely.
  useEffect(() => {
    if (variants.kind !== 'svg') return;
    let cancelled = false;
    async function resolve() {
      if (variants.kind !== 'svg') return;
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
        toValue: focused ? 1 : 0.94,
        duration: TRANSITION_MS,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [focused, selectedOpacity, unselectedOpacity, scale]);

  if (variants.kind === 'ionicons') {
    // The `tools` tab paints its hammer + wrench in two colours when active.
    // Ionicons' `construct` glyph is a single path so we can't recolour the
    // halves directly; instead we stack `hammer` and `build` on top of the
    // base glyph and let opacity reveal them on selection. The base glyph
    // still drives the idle (outline) look so the silhouette stays familiar.
    const isTools = name === 'tools';
    return (
      <Animated.View style={[styles.wrap, { transform: [{ scale }] }]}>
        <Animated.View style={[styles.layer, { opacity: unselectedOpacity }]}>
          <Ionicons name={variants.unselected} size={IONICON_SIZE} color={IDLE_TINT} />
        </Animated.View>
        <Animated.View style={[styles.layer, { opacity: selectedOpacity }]}>
          {isTools ? (
            <>
              {/* Hammer slightly up-left, wrench slightly down-right — same
                  geometry as Ionicons' `construct` composite, just painted
                  in two passes. */}
              <Ionicons
                name="hammer"
                size={IONICON_SIZE}
                color={TOOLS_HAMMER_COLOR}
                style={styles.toolsHammer}
              />
              <Ionicons
                name="build"
                size={IONICON_SIZE}
                color={TOOLS_WRENCH_COLOR}
                style={styles.toolsWrench}
              />
            </>
          ) : (
            <Ionicons name={variants.selected} size={IONICON_SIZE} color={colors.primary} />
          )}
        </Animated.View>
      </Animated.View>
    );
  }

  if (!selectedUri || !unselectedUri) {
    // Reserve layout so the tab bar doesn't reflow on first paint.
    return <View style={{ width: ICON_SIZE, height: ICON_SIZE }} />;
  }

  return (
    <Animated.View style={[styles.wrap, { transform: [{ scale }] }]}>
      <Animated.View style={[styles.layer, { opacity: unselectedOpacity }]}>
        <SvgUri uri={unselectedUri} width={ICON_SIZE} height={ICON_SIZE} />
      </Animated.View>
      <Animated.View style={[styles.layer, { opacity: selectedOpacity }]}>
        <SvgUri uri={selectedUri} width={ICON_SIZE} height={ICON_SIZE} />
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
  // Tools-tab composite: hammer up-left, wrench down-right. Small offsets so
  // both glyphs read as a single tool kit without overlapping the heads.
  toolsHammer: {
    position: 'absolute',
    transform: [{ translateX: -4 }, { translateY: -4 }],
  },
  toolsWrench: {
    position: 'absolute',
    transform: [{ translateX: 4 }, { translateY: 4 }],
  },
});
