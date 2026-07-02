/**
 * Activity progress store — therapist-friendly session history.
 *
 * Each completed difficulty run emits ONE session record (this is the
 * "completed" event contemplated by `activity_implementation_rules.md` §11).
 * The Progress page aggregates these into calm, non-judgmental signals:
 * consistency (sessions over time), independence (fewer retries), and
 * challenge level (difficulty mix). No scores, ranks, or streaks.
 *
 * Persisted to AsyncStorage. Failures never block gameplay.
 */

import { useSyncExternalStore } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@taptalk/activities/sessions/v1';
const MAX_SESSIONS = 400; // plenty of history without unbounded growth

export type SessionDifficulty = 'easy' | 'medium' | 'hard';

export interface ActivitySession {
  id: string;
  /** Matches ActivityId in the favourites store, e.g. 'shape-match'. */
  activityId: string;
  difficulty: SessionDifficulty;
  /** Levels in the completed difficulty run. */
  totalLevels: number;
  /** Wrong attempts across the run — lower over time suggests growing independence. */
  incorrectCount: number;
  /** Epoch ms when the run finished. */
  completedAt: number;
  /** Whole-run duration in ms (start overlay dismissed → final level). */
  durationMs: number;
}

let sessions: ActivitySession[] = [];
let hydrated = false;
const listeners = new Set<() => void>();

function emit(): void {
  listeners.forEach(l => l());
}

async function hydrate(): Promise<void> {
  if (hydrated) return;
  hydrated = true;
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed: unknown = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        sessions = parsed as ActivitySession[];
        emit();
      }
    }
  } catch {
    // Start empty; never block on storage.
  }
}

function persist(): void {
  AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(sessions)).catch(() => {});
}

/** Call once when a difficulty run completes (the game's "won" moment). */
export function recordActivitySession(
  input: Omit<ActivitySession, 'id' | 'completedAt'>,
): void {
  const session: ActivitySession = {
    ...input,
    id: `${input.activityId}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    completedAt: Date.now(),
  };
  sessions = [...sessions, session].slice(-MAX_SESSIONS);
  emit();
  persist();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  void hydrate();
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): ActivitySession[] {
  return sessions;
}

export function useActivitySessions(): ActivitySession[] {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
