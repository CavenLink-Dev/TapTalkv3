/**
 * Tools favourites store.
 *
 * Module-level pinned-tool ids, persisted to AsyncStorage so pins survive
 * app restarts. Exposes a `useFavouriteTools()` hook via useSyncExternalStore
 * for the Tools list screen and any other consumer.
 *
 * Behaviour rules (set by user):
 *   • Tapping the star toggles pinned/unpinned.
 *   • Multiple pins allowed. Pinned cards render in a "Favourites" section
 *     above the main "Tools" section (see Tools screen).
 *   • Pin order is the order they were starred — most recent at the top.
 */

import { useSyncExternalStore } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ToolId = 'calendar' | 'step-by-step' | 'visual-timer';

const STORAGE_KEY = '@taptalk/tools/favourites/v1';

let favourites: ToolId[] = [];
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
          (v): v is ToolId =>
            v === 'calendar' || v === 'step-by-step' || v === 'visual-timer',
        );
        emit();
      }
    }
  } catch {
    // Ignore; defaults to empty pinned set.
  }
}

// Kick off hydration eagerly so the first render after subscribe has data.
hydrate();

export function isFavourite(id: ToolId): boolean {
  return favourites.includes(id);
}

export function toggleFavourite(id: ToolId): void {
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

function getSnapshot(): ToolId[] {
  return favourites;
}

export function useFavouriteTools(): ToolId[] {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
