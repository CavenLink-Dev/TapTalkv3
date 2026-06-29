/**
 * Step by Step sequence store (formerly "First & Then").
 *
 * The page renders `items` in order. Visible labels are derived in the UI:
 *   • 1 item:  "First"
 *   • 2 items: "First" / "Then"
 *   • 3+ items: "First" / "Then" (any middle) / "Lastly"
 *
 * Settings are sequence-wide (not per-item): `autoAdvance` controls whether
 * the runner moves to the next step when a step's timer hits zero. Off by
 * default per the design rule "intelligent defaults" — the user explicitly
 * opts in.
 *
 * Persistence: in-memory only for now. AsyncStorage swap-in lives in Step 8
 * (Quick Talk + sequences persistence pass).
 */

import { useSyncExternalStore } from 'react';

export type FirstThenItem = {
  id: string;
  name: string;
  /** Duration components — split so the wheel pickers map directly. */
  hours: number;
  minutes: number;
  seconds: number;
  /** Ionicons name. Stored as string so consumers can cast safely. */
  symbol: string;
  /** Hex colour used for the symbol tint and chip background. */
  symbolColor: string;
};

export interface SequenceSettings {
  /** When true, the runner advances automatically as each step's timer hits 0. */
  autoAdvance: boolean;
}

let items: FirstThenItem[] = [];
let settings: SequenceSettings = { autoAdvance: false };
const listeners = new Set<() => void>();

function emit(): void {
  listeners.forEach(l => l());
}

export function totalDurationSec(item: FirstThenItem): number {
  return item.hours * 3600 + item.minutes * 60 + item.seconds;
}

export function addFirstThen(item: FirstThenItem): void {
  items = [...items, item];
  emit();
}

export function updateFirstThen(id: string, patch: Partial<FirstThenItem>): void {
  items = items.map(i => (i.id === id ? { ...i, ...patch } : i));
  emit();
}

export function removeFirstThen(id: string): void {
  items = items.filter(i => i.id !== id);
  emit();
}

export function moveFirstThen(id: string, direction: 'up' | 'down'): void {
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
}

export function clearFirstThen(): void {
  if (items.length === 0) return;
  items = [];
  emit();
}

export function setSettings(patch: Partial<SequenceSettings>): void {
  settings = { ...settings, ...patch };
  emit();
}

/** Derive the visible position label for an index inside the current list. */
export function positionLabel(index: number, total: number): string {
  if (total <= 1) return 'First';
  if (index === 0) return 'First';
  if (index === total - 1 && total >= 3) return 'Lastly';
  return 'Then';
}

function subscribeItems(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getItemsSnapshot(): FirstThenItem[] {
  return items;
}

function getSettingsSnapshot(): SequenceSettings {
  return settings;
}

export function useFirstThenItems(): FirstThenItem[] {
  return useSyncExternalStore(subscribeItems, getItemsSnapshot, getItemsSnapshot);
}

export function useSequenceSettings(): SequenceSettings {
  return useSyncExternalStore(subscribeItems, getSettingsSnapshot, getSettingsSnapshot);
}
