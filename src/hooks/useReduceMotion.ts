/**
 * Reusable Reduce Motion subscription hook.
 *
 * Reads `AccessibilityInfo.isReduceMotionEnabled()` on mount and stays in sync
 * via the `reduceMotionChanged` event, so components can branch their
 * Reanimated worklets without each implementing the same subscription.
 *
 * Falls back to `false` if the bridge is unavailable.
 */

import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

export function useReduceMotion(): boolean {
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
