/**
 * First / Then sequence store.
 *
 * Kept deliberately tiny — a module-level array + listener set exposed
 * through useSyncExternalStore so the sequence index page and the Add Step
 * page can share state without threading callbacks through expo-router.
 * If/when this needs to persist across launches, swap the in-memory list
 * for AsyncStorage-backed reads inside the same API surface.
 */

import { useSyncExternalStore } from 'react';

export type FirstThenItem = {
  id: string;
  name: string;
  /** Optional countdown in whole minutes. Undefined = no timer. */
  minutes?: number;
  /** Ionicons name. Stored as string so consumers can cast safely. */
  symbol: string;
  /** Hex color used for the symbol tint and chip background. */
  symbolColor: string;
};

let items: FirstThenItem[] = [];
const listeners = new Set<() => void>();

function emit(): void {
  listeners.forEach(l => l());
}

export function addFirstThen(item: FirstThenItem): void {
  items = [...items, item];
  emit();
}

export function removeFirstThen(id: string): void {
  items = items.filter(i => i.id !== id);
  emit();
}

export function clearFirstThen(): void {
  if (items.length === 0) return;
  items = [];
  emit();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): FirstThenItem[] {
  return items;
}

export function useFirstThenItems(): FirstThenItem[] {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
