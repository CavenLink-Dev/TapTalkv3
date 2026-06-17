/**
 * Accessibility utilities for respecting user preferences.
 * 
 * Apple's Human Interface Guidelines require respecting the Reduce Motion setting.
 * When enabled, animations should be simplified to crossfades while keeping
 * meaning-carrying transitions (state changes like "blocked" or "step advanced").
 */

import { AccessibilityInfo } from 'react-native';

let reduceMotionEnabled = false;

/**
 * Check if Reduce Motion is enabled.
 * Call this on app startup and store the result.
 */
export async function checkReduceMotionEnabled(): Promise<boolean> {
  try {
    const enabled = await AccessibilityInfo.isReduceMotionEnabled();
    reduceMotionEnabled = enabled;
    return enabled;
  } catch (error) {
    console.warn('Failed to check Reduce Motion setting:', error);
    return false;
  }
}

/**
 * Get the current Reduce Motion setting (sync).
 * You must call checkReduceMotionEnabled() first on app startup.
 */
export function isReduceMotionEnabled(): boolean {
  return reduceMotionEnabled;
}

/**
 * Subscribe to Reduce Motion changes.
 * Returns an unsubscribe function.
 */
export function subscribeToReduceMotionChanges(callback: (enabled: boolean) => void): () => void {
  const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', (enabled) => {
    reduceMotionEnabled = enabled;
    callback(enabled);
  });

  return () => {
    subscription?.remove();
  };
}

/**
 * Get animation duration based on Reduce Motion setting.
 * If Reduce Motion is enabled, return a shorter duration for crossfades.
 * 
 * @param normalDuration - Duration in ms when Reduce Motion is off
 * @param reducedDuration - Duration in ms when Reduce Motion is on (default: 150ms)
 */
export function getAnimationDuration(normalDuration: number, reducedDuration: number = 150): number {
  return reduceMotionEnabled ? reducedDuration : normalDuration;
}

/**
 * Get spring config based on Reduce Motion setting.
 * If Reduce Motion is enabled, return a config that results in a simple fade.
 */
export function getSpringConfig(reduceMotion?: boolean) {
  const shouldReduce = reduceMotion ?? reduceMotionEnabled;
  
  if (shouldReduce) {
    // Very stiff spring = almost linear, no bounce
    return { damping: 20, stiffness: 500 };
  }
  
  // Normal iOS-like spring
  return { damping: 12, stiffness: 300 };
}
