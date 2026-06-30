/**
 * Activities favourites store.
 *
 * Mirrors src/features/tools/favourites-store.ts exactly.
 * Persists pinned activity ids to AsyncStorage so stars survive restarts.
 *
 * Behaviour:
 *   • Tapping the star toggles pinned/unpinned.
 *   • Pinned cards appear in a "Favourites" section above the main list.
 *   • Pin order is insertion order — most recently starred at the top.
 */

import { useSyncExternalStore } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ActivityId = 'shape-match' | 'colour-pop';

const STORAGE_KEY = '@taptalk/activities/favourites/v1';

let favourites: ActivityId[] = [];
let hydrated = false;
const listeners = new Set<() => void>();

function emit(): void {
  listeners.forEach(l => l());
}

async function persist(): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(favourites));
  } catch {
    // Best-effort: pins are quality-of-life, not essential data.
  }
}

async function hydrate(): Promise<void> {
  if (hydrated) return;
  hydrated = true;
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as unknown;
      if (Array.isArray(parsed)) {
        favourites = parsed.filter(
          (v): v is ActivityId => v === 'shape-match' || v === 'colour-pop',
        );
        emit();
      }
    }
  } catch {
    // Ignore; defaults to empty pinned set.
  }
}

hydrate();

export function isFavourite(id: ActivityId): boolean {
  return favourites.includes(id);
}

export function toggleFavourite(id: ActivityId): void {
  favourites = favourites.includes(id)
    ? favourites.filter(x => x !== id)
    : [id, ...favourites];
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
  return favourites;
}

export function useFavouriteActivities(): ActivityId[] {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
