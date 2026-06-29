/**
 * sounds.ts — sound effects for TapTalk activities.
 *
 * Uses expo-audio (SDK 54). Players are created once and cached.
 * All calls are fire-and-forget; errors never crash the app.
 *
 * Volumes are tuned to avoid sensory overload:
 *   - Selection feedback: 0.6 (subtle)
 *   - Correct / incorrect: 0.75 (clear but not harsh)
 *   - Streak bonus: 0.65 (rewarding, below correct so it layers nicely)
 *   - Level complete: 0.8 (peak moment, earned)
 */

import { AudioPlayer, createAudioPlayer, setAudioModeAsync } from 'expo-audio';

export type SoundKey =
  | 'select_selection'
  | 'change_select_selection'
  | 'confirm_selection'
  | 'correct'
  | 'incorrect'
  | 'level_complete'
  | 'denied'
  | 'correct_answer_streak'
  | 'correct_answer_streak_extra_step';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const SOURCES: Record<SoundKey, number> = {
  select_selection:                require('../../assets/sounds/select_selection.mp3'),
  change_select_selection:         require('../../assets/sounds/change_select_selection.mp3'),
  confirm_selection:               require('../../assets/sounds/confirm_selection.mp3'),
  correct:                         require('../../assets/sounds/correct.mp3'),
  incorrect:                       require('../../assets/sounds/incorrect.mp3'),
  level_complete:                  require('../../assets/sounds/level_complete.mp3'),
  denied:                          require('../../assets/sounds/denied.mp3'),
  correct_answer_streak:           require('../../assets/sounds/correct_answer_streak.mp3'),
  correct_answer_streak_extra_step: require('../../assets/sounds/correct_answer_streak_extra_step.mp3'),
};

/** Per-sound volume (0–1). Keeps layered sounds from feeling overwhelming. */
const VOLUMES: Record<SoundKey, number> = {
  select_selection:                0.6,
  change_select_selection:         0.6,
  confirm_selection:               0.65,
  correct:                         0.75,
  incorrect:                       0.7,
  level_complete:                  0.8,
  denied:                          0.7,
  correct_answer_streak:           0.52,
  correct_answer_streak_extra_step: 0.52,
};

/** Per-sound playback rate (1.0 = normal pitch). Values < 1 lower pitch slightly. */
const RATES: Partial<Record<SoundKey, number>> = {
  correct_answer_streak:           0.92,
  correct_answer_streak_extra_step: 0.92,
};

const players: Partial<Record<SoundKey, AudioPlayer>> = {};
const hasPlayed = new Set<SoundKey>();

let modeSet = false;
async function ensureMode() {
  if (modeSet) return;
  await setAudioModeAsync({ playsInSilentMode: true });
  modeSet = true;
}

export async function playSound(key: SoundKey, soundOn = true): Promise<void> {
  if (!soundOn) return;
  try {
    await ensureMode();

    if (!players[key]) {
      const player = createAudioPlayer(SOURCES[key]);
      player.volume = VOLUMES[key];
      if (RATES[key] !== undefined) player.rate = RATES[key]!;
      players[key] = player;
    }

    const p = players[key]!;

    // Only seek back to 0 on replays — seeking on an unloaded player fails silently.
    if (hasPlayed.has(key)) {
      await p.seekTo(0);
    }

    p.play();
    hasPlayed.add(key);
  } catch {
    // Sound is enhancement-only — never crash the app.
  }
}

/**
 * For single-tap games: plays select_selection immediately,
 * then confirm_selection 90ms later on the same gesture.
 */
export function playSelectThenConfirm(soundOn = true): void {
  playSound('select_selection', soundOn);
  setTimeout(() => playSound('confirm_selection', soundOn), 90);
}

/**
 * Play the level-appropriate streak chime after a correct answer.
 * level 1–2 → correct_answer_streak (simpler chime)
 * level 3+  → correct_answer_streak_extra_step (fuller chime)
 * Delayed 300ms so it layers cleanly after the correct sound.
 */
export function playStreakSound(level: number, soundOn = true): void {
  const key: SoundKey = level <= 2
    ? 'correct_answer_streak'
    : 'correct_answer_streak_extra_step';
  setTimeout(() => playSound(key, soundOn), 300);
}
