/**
 * Quick Talk — persistent store of saved phrases.
 *
 * Rules locked with the user:
 *   • Single flat list (no separate buckets for words vs sentences).
 *   • Max 25 items. When the user tries to save a 26th, the caller is
 *     told via the `addQuickTalk` return value so it can present the
 *     "Quick Talk is full" sheet.
 *   • Persisted via AsyncStorage. Hydration kicks off at module load.
 *   • Order is most-recently-saved first, then user-reordered via the
 *     `move*` helpers.
 *
 * The store follows the same useSyncExternalStore pattern as the rest of
 * the app for consistency (principle 17 — consistent state management).
 */

import { useSyncExternalStore } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const QUICK_TALK_MAX = 25;
const STORAGE_KEY = '@taptalk/quick-talk/v1';

export interface QuickTalkItem {
  id: string;
  /** The exact text spoken via TTS. */
  text: string;
  /** Unix ms — used for sort fallback / debugging only. */
  createdAt: number;
}

let items: QuickTalkItem[] = [];
let hydrated = false;
const listeners = new Set<() => void>();

function emit(): void {
  listeners.forEach(l => l());
}

async function persist(): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // Best-effort.
  }
}

async function hydrate(): Promise<void> {
  if (hydrated) return;
  hydrated = true;
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw) as unknown;
    if (Array.isArray(parsed)) {
      items = parsed.filter(
        (v): v is QuickTalkItem =>
          !!v && typeof v === 'object'
          && typeof (v as QuickTalkItem).id === 'string'
          && typeof (v as QuickTalkItem).text === 'string'
          && typeof (v as QuickTalkItem).createdAt === 'number',
      );
      emit();
    }
  } catch {
    // Ignore; defaults to empty.
  }
}

hydrate();

export function isFull(): boolean {
  return items.length >= QUICK_TALK_MAX;
}

export function quickTalkCount(): number {
  return items.length;
}

/**
 * Attempt to add a phrase to Quick Talk.
 * @returns `true` on success, `false` if the list is full (no add performed).
 */
export function addQuickTalk(text: string): boolean {
  const t = text.trim();
  if (!t) return false;
  if (isFull()) return false;
  const item: QuickTalkItem = {
    id: `qt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    text: t,
    createdAt: Date.now(),
  };
  items = [item, ...items];
  emit();
  void persist();
  return true;
}

export function updateQuickTalk(id: string, text: string): void {
  const t = text.trim();
  if (!t) return;
  items = items.map(i => (i.id === id ? { ...i, text: t } : i));
  emit();
  void persist();
}

export function removeQuickTalk(id: string): void {
  items = items.filter(i => i.id !== id);
  emit();
  void persist();
}

export function clearQuickTalk(): void {
  if (items.length === 0) return;
  items = [];
  emit();
  void persist();
}

export function moveQuickTalk(id: string, direction: 'up' | 'down'): void {
  const idx = items.findIndex(i => i.id === id);
  if (idx === -1) return;
  const target = direction === 'up' ? idx - 1 : idx + 1;
  if (target < 0 || target >= items.length) return;
  const next = [...items];
  const cur = next[idx];
  const swap = next[target];
  if (!cur || !swap) return;
  next[idx] = swap;
  next[target] = cur;
  items = next;
  emit();
  void persist();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): QuickTalkItem[] {
  return items;
}

export function useQuickTalk(): QuickTalkItem[] {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
