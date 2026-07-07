import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type React from 'react';
import {
  AccessibilityInfo,
  LayoutAnimation,
  LayoutChangeEvent,
  ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { QUICK_TAGS_STORAGE_KEY } from './constants';
import type { BoardMode, QuickDockMode } from './types';

export function useQuickManage({
  activeMode,
  hapticIfEnabled,
  reduceMotion,
  scrollRef,
  scrollPositions,
  setSortMenuVisible,
  setHideMenuVisible,
}: {
  activeMode: BoardMode;
  hapticIfEnabled: () => void;
  reduceMotion: boolean;
  scrollRef: React.RefObject<ScrollView | null>;
  scrollPositions: React.MutableRefObject<Partial<Record<BoardMode, number>>>;
  setSortMenuVisible: React.Dispatch<React.SetStateAction<boolean>>;
  setHideMenuVisible: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  // quickTaggedIds: persisted set of tile IDs the user pinned as "Quick".
  // Empty set => Quick newcomer (Quick press nudges towards Manage).
  const [quickTaggedIds, setQuickTaggedIds] = useState<Set<string>>(new Set());
  // quickViewActive: the Quick view overlay (reorder + highlight + dim).
  const [quickViewActive, setQuickViewActive] = useState(false);
  // quickDockMode: 'manage' shows the green Manage pill above the dock.
  const [quickDockMode, setQuickDockMode] = useState<QuickDockMode>('hidden');
  // quickManageOpen: the Manage Control Bar replaces the default dock row.
  const [quickManageOpen, setQuickManageOpen] = useState(false);
  // Ephemeral selection intents while managing (session only).
  const [manageSelectedIds, setManageSelectedIds] = useState<Set<string>>(new Set());
  // A symbol was just created via Create + (auto-tagged) — makes Done appear.
  const [manageCreatedTag, setManageCreatedTag] = useState(false);
  // Accidental-selection guard: taps that land while (or right after) a
  // scroll gesture is moving must not toggle selection.
  const isScrollingRef = useRef(false);
  // One auto-scroll-to-top per Quick activation.
  const hasAutoScrolledRef = useRef(false);
  const [quickAnchor, setQuickAnchor] = useState({ x: 0, width: 0 });
  // Reanimated shared values for the Quick button feedback. The old
  // Manage-pill entrance/pulse shared values were removed with the pill —
  // the Manage sub-control now lives in DockSubControls (Phase 2), which
  // owns its own animation state.
  const quickButtonShake = useSharedValue(0);
  const quickButtonErrorTint = useSharedValue(0);
  const manageDoneEntrance = useSharedValue(0);
  const unselectBlink = useSharedValue(1);

  // Hydrate the persisted Quick list once on mount.
  useEffect(() => {
    AsyncStorage.getItem(QUICK_TAGS_STORAGE_KEY)
      .then(raw => {
        if (!raw) return;
        const ids = JSON.parse(raw);
        if (Array.isArray(ids)) setQuickTaggedIds(new Set(ids.filter(id => typeof id === 'string')));
      })
      .catch(() => {});
  }, []);

  // Persist on every change (cheap: a handful of IDs).
  const quickHydratedRef = useRef(false);
  useEffect(() => {
    if (!quickHydratedRef.current) { quickHydratedRef.current = true; return; }
    AsyncStorage.setItem(QUICK_TAGS_STORAGE_KEY, JSON.stringify(Array.from(quickTaggedIds))).catch(() => {});
  }, [quickTaggedIds]);

  const handleQuickAnchorLayout = useCallback((e: LayoutChangeEvent) => {
    const { x, width: w } = e.nativeEvent.layout;
    setQuickAnchor({ x, width: w });
  }, []);

  const handleQuickPress = useCallback(() => {
    hapticIfEnabled();
    setSortMenuVisible(false);
    setHideMenuVisible(false);

    // Toggle the Quick view.
    if (quickViewActive) {
      if (!reduceMotion) LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setQuickViewActive(false);
      setQuickDockMode('hidden');
      hasAutoScrolledRef.current = false;
      AccessibilityInfo.announceForAccessibility?.('Quick view off');
      return;
    }

    if (!reduceMotion) LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setQuickViewActive(true);
    if (!hasAutoScrolledRef.current) {
      if ((scrollPositions.current[activeMode] ?? 0) > 1) {
        scrollRef.current?.scrollTo({ y: 0, animated: true });
      }
      hasAutoScrolledRef.current = true;
    }
    AccessibilityInfo.announceForAccessibility?.('Quick view on');
  }, [activeMode, hapticIfEnabled, quickViewActive, reduceMotion, scrollPositions, scrollRef, setHideMenuVisible, setSortMenuVisible]);

  // Manage pill -> open the Manage Control Bar (replaces the dock row).
  // Symbols already tagged with Quick enter Manage PRESELECTED so it's
  // obvious which symbols are already part of Quick; unselecting one
  // marks it for removal.
  const handleManagePress = useCallback(() => {
    hapticIfEnabled();
    setSortMenuVisible(false);
    setHideMenuVisible(false);
    setQuickDockMode('hidden');
    setManageSelectedIds(new Set());
    setManageCreatedTag(false);
    setQuickManageOpen(true);
    AccessibilityInfo.announceForAccessibility?.(
      'Manage. Tap symbols to select them, then Done.',
    );
  }, [hapticIfEnabled, setHideMenuVisible, setSortMenuVisible]);

  const closeQuickManage = useCallback(() => {
    setManageSelectedIds(new Set());
    setManageCreatedTag(false);
    setQuickManageOpen(false);
    setQuickDockMode('hidden');
  }, []);

  // Dirty when any symbols are selected or a symbol was just created.
  const manageDirty = useMemo(() => {
    return manageCreatedTag || manageSelectedIds.size > 0;
  }, [manageCreatedTag, manageSelectedIds]);

  const handleQuickManageBack = useCallback(() => {
    hapticIfEnabled();
    closeQuickManage();
  }, [closeQuickManage, hapticIfEnabled]);

  // Unselect — clears all selected symbols when any are selected.
  const handleQuickSelectToggle = useCallback(() => {
    hapticIfEnabled();
    if (manageSelectedIds.size > 0) {
      setManageSelectedIds(new Set());
      setManageCreatedTag(false);
      AccessibilityInfo.announceForAccessibility?.('All symbols unselected');
    }
  }, [hapticIfEnabled, manageSelectedIds.size]);

  // Done — save selected symbols as Quick, jump to Quick view.
  const handleQuickManageDone = useCallback(() => {
    hapticIfEnabled();
    const next = new Set(manageSelectedIds);
    setQuickTaggedIds(next);
    closeQuickManage();
    if (!reduceMotion) LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    if (next.size > 0) {
      setQuickViewActive(true);
      hasAutoScrolledRef.current = true;
      scrollRef.current?.scrollTo({ y: 0, animated: true });
      AccessibilityInfo.announceForAccessibility?.(
        `Quick updated. ${next.size} symbol${next.size !== 1 ? 's' : ''}.`,
      );
    } else {
      setQuickViewActive(false);
      AccessibilityInfo.announceForAccessibility?.('Quick cleared');
    }
  }, [closeQuickManage, hapticIfEnabled, manageSelectedIds, reduceMotion, scrollRef]);

  // Done is conditional — only when there are pending changes to save
  // (selection differs from the tagged set, or a symbol was just created
  // via Create +). Same dirty-state gating pattern as editDirty/editClean.
  const manageDoneVisible = quickManageOpen && manageDirty;

  // ── Quick animated styles + entrance effects ────────────────────────────
  const quickShakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: quickButtonShake.value }],
  }));
  // Faint red overlay only (opacity 0 -> 0.25) — never a hard colour switch.
  const quickTintStyle = useAnimatedStyle(() => ({
    opacity: quickButtonErrorTint.value * 0.25,
  }));
  const manageDoneStyle = useAnimatedStyle(() => ({
    opacity: manageDoneEntrance.value,
    transform: [{ scale: 0.7 + manageDoneEntrance.value * 0.3 }],
  }));
  const unselectBlinkStyle = useAnimatedStyle(() => ({
    opacity: unselectBlink.value,
  }));

  // Done springs in when it first appears; disappears instantly.
  useEffect(() => {
    manageDoneEntrance.value = manageDoneVisible
      ? (reduceMotion ? 1 : withSpring(1, { damping: 14, stiffness: 240 }))
      : 0;
  }, [manageDoneEntrance, manageDoneVisible, reduceMotion]);

  // Select <-> Unselect switch — a brief 150ms blink stands in for the
  // colour tween (BoardDockAction handles the blue -> red tint itself).
  useEffect(() => {
    if (!quickManageOpen || reduceMotion) return;
    unselectBlink.value = withSequence(
      withTiming(0.55, { duration: 75 }),
      withTiming(1, { duration: 75 }),
    );
  }, [manageDirty, quickManageOpen, reduceMotion, unselectBlink]);

  return {
    quickTaggedIds,
    setQuickTaggedIds,
    quickViewActive,
    setQuickViewActive,
    quickDockMode,
    setQuickDockMode,
    quickManageOpen,
    setQuickManageOpen,
    manageSelectedIds,
    setManageSelectedIds,
    manageCreatedTag,
    setManageCreatedTag,
    isScrollingRef,
    hasAutoScrolledRef,
    quickAnchor,
    setQuickAnchor,
    quickButtonShake,
    quickButtonErrorTint,
    manageDoneEntrance,
    unselectBlink,
    handleQuickAnchorLayout,
    handleQuickPress,
    handleManagePress,
    closeQuickManage,
    manageDirty,
    handleQuickManageBack,
    handleQuickSelectToggle,
    handleQuickManageDone,
    manageDoneVisible,
    quickShakeStyle,
    quickTintStyle,
    manageDoneStyle,
    unselectBlinkStyle,
  };
}
