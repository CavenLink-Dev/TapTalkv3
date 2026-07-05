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
 * Persistence: AsyncStorage. Hydration kicks off at module load; every
 * mutation persists best-effort so sequences (and the auto-advance choice)
 * survive relaunch — caregivers should never rebuild the same routine twice.
 *
 * Templates: common routines (eat → play, bath → bed, ...) that seed the
 * board in one tap via `applyFirstThenTemplate`.
 */

import { useSyncExternalStore } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { enqueueCloudSync } from '../cloud/sync';

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

const STORAGE_KEY = '@taptalk/first-then/v1';

let items: FirstThenItem[] = [];
let settings: SequenceSettings = { autoAdvance: false };
let hydrated = false;
const listeners = new Set<() => void>();

function emit(): void {
  listeners.forEach(l => l());
}

function persist(): void {
  AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ items, settings })).catch(() => {});
  enqueueCloudSync({ kind: 'first-then', items, settings });
}

function isValidItem(v: unknown): v is FirstThenItem {
  if (!v || typeof v !== 'object') return false;
  const i = v as FirstThenItem;
  return (
    typeof i.id === 'string' &&
    typeof i.name === 'string' &&
    typeof i.hours === 'number' &&
    typeof i.minutes === 'number' &&
    typeof i.seconds === 'number' &&
    typeof i.symbol === 'string' &&
    typeof i.symbolColor === 'string'
  );
}

async function hydrate(): Promise<void> {
  if (hydrated) return;
  hydrated = true;
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw) as { items?: unknown; settings?: Partial<SequenceSettings> };
    if (Array.isArray(parsed.items)) {
      items = parsed.items.filter(isValidItem);
    }
    if (parsed.settings && typeof parsed.settings.autoAdvance === 'boolean') {
      settings = { ...settings, autoAdvance: parsed.settings.autoAdvance };
    }
    emit();
  } catch {
    // Ignore; defaults to empty.
  }
}

hydrate();

export function totalDurationSec(item: FirstThenItem): number {
  return item.hours * 3600 + item.minutes * 60 + item.seconds;
}

export function addFirstThen(item: FirstThenItem): void {
  items = [...items, item];
  emit();
  persist();
}

export function updateFirstThen(id: string, patch: Partial<FirstThenItem>): void {
  items = items.map(i => (i.id === id ? { ...i, ...patch } : i));
  emit();
  persist();
}

export function removeFirstThen(id: string): void {
  items = items.filter(i => i.id !== id);
  emit();
  persist();
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
  persist();
}

export function clearFirstThen(): void {
  if (items.length === 0) return;
  items = [];
  emit();
  persist();
}

export function setSettings(patch: Partial<SequenceSettings>): void {
  settings = { ...settings, ...patch };
  emit();
  persist();
}

// ─── Templates ──────────────────────────────────────────────────────────────

export interface FirstThenTemplate {
  id: string;
  name: string;
  /** Ionicons name shown on the template chip. */
  icon: string;
  /** Steps seeded into the board (fresh ids are generated on apply). */
  steps: Omit<FirstThenItem, 'id'>[];
}

/**
 * Common routines caregivers rebuild daily. Applying a template REPLACES the
 * current sequence (callers confirm first when the board isn't empty).
 */
export const FIRST_THEN_TEMPLATES: FirstThenTemplate[] = [
  {
    id: 'eat-play',
    name: 'Eat → Play',
    icon: 'restaurant-outline',
    steps: [
      { name: 'Eat', hours: 0, minutes: 20, seconds: 0, symbol: 'restaurant-outline', symbolColor: '#FF8A3C' },
      { name: 'Play', hours: 0, minutes: 30, seconds: 0, symbol: 'game-controller-outline', symbolColor: '#34C759' },
    ],
  },
  {
    id: 'bath-bed',
    name: 'Bath → Bed',
    icon: 'moon-outline',
    steps: [
      { name: 'Bath', hours: 0, minutes: 15, seconds: 0, symbol: 'water-outline', symbolColor: '#3DC1F2' },
      { name: 'Pyjamas', hours: 0, minutes: 5, seconds: 0, symbol: 'shirt-outline', symbolColor: '#7B61FF' },
      { name: 'Bed', hours: 0, minutes: 0, seconds: 0, symbol: 'moon-outline', symbolColor: '#5856D6' },
    ],
  },
  {
    id: 'morning',
    name: 'Morning Routine',
    icon: 'sunny-outline',
    steps: [
      { name: 'Brush Teeth', hours: 0, minutes: 5, seconds: 0, symbol: 'water-outline', symbolColor: '#3DC1F2' },
      { name: 'Get Dressed', hours: 0, minutes: 10, seconds: 0, symbol: 'shirt-outline', symbolColor: '#7B61FF' },
      { name: 'Breakfast', hours: 0, minutes: 20, seconds: 0, symbol: 'restaurant-outline', symbolColor: '#FF8A3C' },
    ],
  },
  {
    id: 'work-break',
    name: 'Work → Break',
    icon: 'book-outline',
    steps: [
      { name: 'Work Time', hours: 0, minutes: 15, seconds: 0, symbol: 'book-outline', symbolColor: '#199AEE' },
      { name: 'Break', hours: 0, minutes: 10, seconds: 0, symbol: 'leaf-outline', symbolColor: '#5CD65C' },
    ],
  },
  {
    id: 'tidy-tv',
    name: 'Tidy Up → TV',
    icon: 'tv-outline',
    steps: [
      { name: 'Tidy Up', hours: 0, minutes: 10, seconds: 0, symbol: 'cube-outline', symbolColor: '#FFB020' },
      { name: 'Watch TV', hours: 0, minutes: 30, seconds: 0, symbol: 'tv-outline', symbolColor: '#FF2D55' },
    ],
  },
];

/** Replace the current sequence with a template's steps (fresh ids). */
export function applyFirstThenTemplate(templateId: string): void {
  const template = FIRST_THEN_TEMPLATES.find(t => t.id === templateId);
  if (!template) return;
  items = template.steps.map((step, i) => ({
    ...step,
    id: `ft-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 6)}`,
  }));
  emit();
  persist();
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
