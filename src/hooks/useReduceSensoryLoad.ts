/**
 * Returns `true` when the user's Reduce Sensory Load setting is enabled
 * (Priority 6). Callers should suppress shimmer, particles, sound effects,
 * and non-essential animation. This layers on top of system Reduce Motion —
 * it does not replace it.
 */
import { useAppSelector } from './useAppContext';

export function useReduceSensoryLoad(): boolean {
  return useAppSelector((state) => state.accessibility.reduceSensoryLoad);
}
