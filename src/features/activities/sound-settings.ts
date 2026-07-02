/**
 * Shared Activity sound-effect setting.
 *
 * One decision, made once, applied to every activity game (current and
 * future):
 *
 *   • SOUND EFFECTS (short MP3 cues — select / confirm / correct / incorrect /
 *     level_complete) default **ON**. They are calm, non-verbal feedback and
 *     carry no judgment. The in-game header toggle turns them off, and the
 *     choice persists across sessions and across games.
 *   • VOICE / TTS (spoken words, e.g. Memory Match speaking a symbol name)
 *     remains **opt-in, default OFF, per game session**. Unsolicited speech is
 *     overwhelming for much of the AAC audience — see
 *     `to_do/activity_implementation_rules.md` §3.
 *
 * These are deliberately two separate controls so turning cues off never
 * silently enables/disables speech and vice versa.
 */

import { useSyncExternalStore } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@taptalk/activities/sfx/v1';

let sfxEnabled = true;
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
    if (raw !== null) {
      sfxEnabled = raw === 'true';
      emit();
    }
  } catch {
    // Keep the default (on); never block a game on storage.
  }
}

export function setActivitySfxEnabled(next: boolean): void {
  sfxEnabled = next;
  emit();
  AsyncStorage.setItem(STORAGE_KEY, String(next)).catch(() => {});
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  void hydrate();
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): boolean {
  return sfxEnabled;
}

/** Whether activity sound effects (MP3 cues) are enabled. Defaults to true. */
export function useActivitySfx(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
