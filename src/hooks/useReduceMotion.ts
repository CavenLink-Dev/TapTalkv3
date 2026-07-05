/**
 * Reusable Reduce Motion subscription hook.
 *
 * Reads `AccessibilityInfo.isReduceMotionEnabled()` on mount and stays in sync
 * via the `reduceMotionChanged` event, so components can branch their
 * Reanimated worklets without each implementing the same subscription.
 *
 * Also honours TapTalk's own in-app override
 * (Settings → Accessibility → Reduce Motion), so users can calm animations
 * without leaving the app: effective value = system Reduce Motion OR override.
 *
 * Falls back to `false` if the bridge is unavailable.
 */

import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';
import { useAppSelector } from './useAppContext';

/** System-level Reduce Motion only (ignores the in-app override). */
export function useSystemReduceMotion(): boolean {
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((enabled) => {
        if (mounted) setReduceMotion(enabled);
      })
      .catch(() => undefined);

    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => {
      mounted = false;
      sub.remove();
    };
  }, []);

  return reduceMotion;
}

export function useReduceMotion(): boolean {
  const systemReduceMotion = useSystemReduceMotion();
  const reduceMotionOverride = useAppSelector((state) => state.accessibility.reduceMotionOverride);
  return systemReduceMotion || reduceMotionOverride;
}
