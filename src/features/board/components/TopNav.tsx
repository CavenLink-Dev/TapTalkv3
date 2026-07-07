import React, { useCallback, useEffect, useRef } from 'react';
import { Animated as RNAnimated, Easing as RNEasing, Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useReduceMotion } from '../../../hooks/useReduceMotion';
import { animation, boardSizes } from '../../../theme/tokens';
import { useTheme } from '../../../theme/useTheme';
import { TOP_NAV_HEIGHT, TOP_TAB_META } from '../talk/constants';
import { styles } from '../talk/styles';
import type { TopTab } from '../talk/types';

const TopNavTab = React.memo(function TopNavTab({
  tab,
  active,
  onPress,
}: {
  tab: TopTab;
  active: boolean;
  onPress: (tab: TopTab) => void;
}) {
  const meta = TOP_TAB_META[tab];
  // RM: zero duration, no scale/spring — colour switch only (principle 18).
  const reduceMotion = useReduceMotion();
  const t = useTheme();
  const idleColor = t.colors.textMuted;
  const activeColor = t.colors.primary;

  // activeAnim drives tint (icon + label together) and the selected-state
  // pill. JS driver because of colour interpolation; only one tab animates
  // per switch so this stays cheap.
  const activeAnim = useRef(new RNAnimated.Value(active ? 1 : 0)).current;
  // pressScale is transform-only → native driver, so the press-in feels
  // immediate even if the JS thread is busy.
  const pressScale = useRef(new RNAnimated.Value(1)).current;

  useEffect(() => {
    RNAnimated.timing(activeAnim, {
      toValue: active ? 1 : 0,
      duration: reduceMotion ? 0 : 160,
      easing: RNEasing.out(RNEasing.cubic),
      useNativeDriver: false,
    }).start();
  }, [active, activeAnim, reduceMotion]);

  const handlePressIn = useCallback(() => {
    if (reduceMotion) return;
    RNAnimated.timing(pressScale, {
      toValue: 0.94,
      duration: animation.durFast,
      easing: RNEasing.out(RNEasing.cubic),
      useNativeDriver: true,
    }).start();
  }, [pressScale, reduceMotion]);

  const handlePressOut = useCallback(() => {
    if (reduceMotion) return;
    RNAnimated.spring(pressScale, {
      toValue: 1,
      speed: 26,
      bounciness: 7,
      useNativeDriver: true,
    }).start();
  }, [pressScale, reduceMotion]);

  const handlePress = useCallback(() => onPress(tab), [onPress, tab]);

  const tintColor = activeAnim.interpolate({
    inputRange:  [0, 1],
    outputRange: [idleColor, activeColor],
  });
  const pillOpacity = activeAnim;
  const pillScale = activeAnim.interpolate({
    inputRange:  [0, 1],
    outputRange: [reduceMotion ? 1 : 0.85, 1],
  });

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${meta.label} top tab`}
      accessibilityState={{ selected: active }}
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={styles.topTab}
    >
      <RNAnimated.View style={[styles.topTabContent, { transform: [{ scale: pressScale }] }]}>
        {/* Selected-state pill — soft rounded fill behind the active tab.
            No shadow/glow/elevation; the tint + fill carry the state. */}
        <RNAnimated.View
          pointerEvents="none"
          style={[
            styles.topTabPill,
            {
              backgroundColor: t.colors.selectionBg,
              opacity: pillOpacity,
              transform: [{ scale: pillScale }],
            },
          ]}
        />
        <View style={styles.topTabIconMount}>
          <Ionicons
            name={meta.icon}
            size={boardSizes.topNavIcon}
            color={active ? activeColor : idleColor}
          />
        </View>
        <RNAnimated.Text style={[styles.topTabLabel, { color: tintColor }]}>
          {meta.label}
        </RNAnimated.Text>
      </RNAnimated.View>
    </Pressable>
  );
});

const TOP_TABS: TopTab[] = ['edit', 'layout', 'saved', 'settings'];

// TopNav no longer animates its height frame-by-frame. The old
// RNAnimated.timing on `height` ran on the JS thread and re-laid-out the
// whole board (grid, dock, scroll view) on EVERY frame of the 220ms
// toggle — the source of the top-nav lag. The parent now wraps the state
// change in a single LayoutAnimation transition (one native layout pass),
// and this component just renders open/closed. React.memo keeps board
// re-renders from touching it.
export const TopNav = React.memo(function TopNav({
  visible,
  activeTab,
  onTabPress,
}: {
  visible: boolean;
  activeTab: TopTab | null;
  onTabPress: (tab: TopTab) => void;
}) {
  const t = useTheme();

  return (
    <View
      style={[
        styles.topNavSlot,
        { height: visible ? TOP_NAV_HEIGHT : 0, backgroundColor: t.colors.surface },
      ]}
    >
      <View
        pointerEvents={visible ? 'auto' : 'none'}
        style={[
          styles.topNavPanel,
          { backgroundColor: t.isDark ? t.colors.navBackground : '#FFFFFF' },
        ]}
      >
        {TOP_TABS.map(tab => (
          <TopNavTab
            key={tab}
            tab={tab}
            active={activeTab === tab}
            onPress={onTabPress}
          />
        ))}
      </View>
      <View
        pointerEvents="none"
        style={[
          styles.topNavBottomBorder,
          { backgroundColor: t.colors.border },
        ]}
      />
    </View>
  );
});
