/**
 * Persisted ordering for the Activities tab.
 */

import { useSyncExternalStore } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ActivityId } from './favourites-store';

const STORAGE_KEY = '@taptalk/activities/order/v1';
const DEFAULT_ORDER: ActivityId[] = ['shape-match', 'colour-pop', 'memory-match'];

let activityOrder: ActivityId[] = DEFAULT_ORDER;
let hydrated = false;
const listeners = new Set<() => void>();

function emit(): void {
  listeners.forEach(listener => listener());
}

function normaliseOrder(value: unknown): ActivityId[] {
  const seen = new Set<ActivityId>();
  const parsed = Array.isArray(value)
    ? value.filter((id): id is ActivityId => {
      const valid = id === 'shape-match' || id === 'colour-pop' || id === 'memory-match';
      if (!valid || seen.has(id)) return false;
      seen.add(id);
      return true;
    })
    : [];

  return [
    ...parsed,
    ...DEFAULT_ORDER.filter(id => !seen.has(id)),
  ];
}

async function persist(): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(activityOrder));
  } catch {
    // Best-effort: order is a preference, not essential data.
  }
}

async function hydrate(): Promise<void> {
  if (hydrated) return;
  hydrated = true;
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) {
      activityOrder = normaliseOrder(JSON.parse(raw));
      emit();
    }
  } catch {
    activityOrder = DEFAULT_ORDER;
  }
}

hydrate();

export function setActivityOrder(nextOrder: ActivityId[]): void {
  activityOrder = normaliseOrder(nextOrder);
  emit();
  void persist();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): ActivityId[] {
  return activityOrder;
}

export function useActivityOrder(): ActivityId[] {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
