import { useCallback, useEffect, useRef, useState } from 'react';
import type React from 'react';
import {
  AccessibilityInfo,
  Animated as RNAnimated,
  Easing as RNEasing,
  LayoutAnimation,
  LayoutChangeEvent,
} from 'react-native';
import { setTabBarHidden } from '../chromeVisibility';

export function useDockVisibility({
  hapticIfEnabled,
  reduceMotion,
  setSortMenuVisible,
}: {
  hapticIfEnabled: () => void;
  reduceMotion: boolean;
  setSortMenuVisible: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  // hideMenuVisible: vertical popover above Hide (Nav Bar / Control Bar / All).
  // navHidden: bottom tab bar collapsed. dockHidden: control bar slid left
  // fully offscreen, with the DockPeekPill as the visible way back.
  const [hideMenuVisible, setHideMenuVisible] = useState(false);
  const [navHidden, setNavHidden] = useState(false);
  const [dockHidden, setDockHidden] = useState(false);
  const [hideAnchor, setHideAnchor] = useState({ x: 0, width: 0 });
  const dockSlide = useRef(new RNAnimated.Value(0)).current;
  const dockFade = useRef(new RNAnimated.Value(1)).current;
  // Peek-pill long-press popover (partial hide toggles) while dock hidden.
  const [peekMenuVisible, setPeekMenuVisible] = useState(false);

  const toggleHideMenu = useCallback(() => {
    hapticIfEnabled();
    setSortMenuVisible(false);
    setHideMenuVisible(v => !v);
  }, [hapticIfEnabled, setSortMenuVisible]);

  const handleHideAnchorLayout = useCallback((e: LayoutChangeEvent) => {
    const { x, width: w } = e.nativeEvent.layout;
    setHideAnchor({ x, width: w });
  }, []);

  // Nav Bar option — TOGGLES the bottom tab bar (slide down/up via
  // LayoutAnimation; instant under Reduce Motion). Menu stays open.
  const handleHideNavBar = useCallback(() => {
    hapticIfEnabled();
    const next = !navHidden;
    if (!reduceMotion) LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setNavHidden(next);
    setTabBarHidden(next);
    AccessibilityInfo.announceForAccessibility?.(
      next ? 'Navigation bar hidden' : 'Navigation bar shown',
    );
  }, [hapticIfEnabled, navHidden, reduceMotion]);

  // Control Bar option — slides the dock right-to-left until only a
  // the peek pill takes over on the left edge (tap it to bring it back).
  const handleHideDock = useCallback(() => {
    hapticIfEnabled();
    setHideMenuVisible(false);
    setSortMenuVisible(false);
    setDockHidden(true);
    AccessibilityInfo.announceForAccessibility?.(
      'Controls hidden, tap left edge to restore',
    );
  }, [hapticIfEnabled, setSortMenuVisible]);

  // All — nav bar and control bar together. Also what Fullscreen does.
  const handleHideAll = useCallback(() => {
    hapticIfEnabled();
    setHideMenuVisible(false);
    setSortMenuVisible(false);
    if (!reduceMotion) LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setNavHidden(true);
    setTabBarHidden(true);
    setDockHidden(true);
    AccessibilityInfo.announceForAccessibility?.(
      'Controls hidden, tap left edge to restore',
    );
  }, [hapticIfEnabled, reduceMotion, setSortMenuVisible]);

  // Tap on the peek pill restores everything at once.
  const handleChromeRestore = useCallback(() => {
    hapticIfEnabled();
    if (!reduceMotion) LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setPeekMenuVisible(false);
    setNavHidden(false);
    setTabBarHidden(false);
    setDockHidden(false);
    AccessibilityInfo.announceForAccessibility?.('Controls shown');
  }, [hapticIfEnabled, reduceMotion]);

  // Long-press on the peek pill — small popover with partial hide toggles
  // ("Hide control bar" / "Hide nav bar") so users can choose partial vs
  // full hiding instead of always restoring both at once.
  const handlePeekLongPress = useCallback(() => {
    hapticIfEnabled();
    setPeekMenuVisible(v => !v);
  }, [hapticIfEnabled]);

  // Peek popover: toggle just the control bar back (nav stays as-is).
  const handlePeekToggleDock = useCallback(() => {
    hapticIfEnabled();
    setPeekMenuVisible(false);
    setDockHidden(false);
    AccessibilityInfo.announceForAccessibility?.('Control bar shown');
  }, [hapticIfEnabled]);

  // Dock slide animation — right-to-left "cuddle" leaving a half-visible
  // sliver. Native-driver transform; instant under Reduce Motion.
  useEffect(() => {
    RNAnimated.timing(dockSlide, {
      toValue: dockHidden ? 1 : 0,
      duration: reduceMotion ? 0 : 280,
      easing: RNEasing.out(RNEasing.cubic),
      useNativeDriver: true,
    }).start();
  }, [dockHidden, dockSlide, reduceMotion]);

  // Never leave the app without its tab bar if the user navigates away.
  useEffect(() => () => setTabBarHidden(false), []);

  return {
    hideMenuVisible,
    setHideMenuVisible,
    navHidden,
    setNavHidden,
    dockHidden,
    setDockHidden,
    hideAnchor,
    setHideAnchor,
    dockSlide,
    dockFade,
    peekMenuVisible,
    setPeekMenuVisible,
    toggleHideMenu,
    handleHideAnchorLayout,
    handleHideNavBar,
    handleHideDock,
    handleHideAll,
    handleChromeRestore,
    handlePeekLongPress,
    handlePeekToggleDock,
  };
}
