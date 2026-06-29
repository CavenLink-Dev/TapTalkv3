/**
 * Persisted ordering for the Tools tab.
 *
 * Favourites are stored separately; this store only controls the order of the
 * single Tools list.
 */

import { useSyncExternalStore } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ToolId } from './favourites-store';

const STORAGE_KEY = '@taptalk/tools/order/v1';
const DEFAULT_ORDER: ToolId[] = ['calendar', 'step-by-step', 'visual-timer'];

let toolOrder: ToolId[] = DEFAULT_ORDER;
let hydrated = false;
const listeners = new Set<() => void>();

function emit(): void {
  listeners.forEach(listener => listener());
}

function normaliseOrder(value: unknown): ToolId[] {
  const seen = new Set<ToolId>();
  const parsed = Array.isArray(value)
    ? value.filter((id): id is ToolId => {
      const valid = id === 'calendar' || id === 'step-by-step' || id === 'visual-timer';
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
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(toolOrder));
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
      toolOrder = normaliseOrder(JSON.parse(raw));
      emit();
    }
  } catch {
    toolOrder = DEFAULT_ORDER;
  }
}

hydrate();

export function setToolOrder(nextOrder: ToolId[]): void {
  toolOrder = normaliseOrder(nextOrder);
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
  return toolOrder;
}

export function useToolOrder(): ToolId[] {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
