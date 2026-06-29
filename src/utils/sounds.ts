/**
 * sounds.ts — sound effects for TapTalk activities.
 *
 * Uses expo-audio (SDK 54). Players are created once and cached.
 * All calls are fire-and-forget; errors never crash the app.
 */

import { AudioPlayer, createAudioPlayer, setAudioModeAsync } from 'expo-audio';

export type SoundKey =
  | 'select_selection'
  | 'confirm_selection'
  | 'correct'
  | 'incorrect'
  | 'level_complete'
  | 'denied';

const SOURCES: Record<SoundKey, number> = {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  select_selection:  require('../../asset/sounds/select_selection.mp3'),
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  confirm_selection: require('../../asset/sounds/confirm_selection.mp3'),
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  correct:           require('../../asset/sounds/correct.mp3'),
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  incorrect:         require('../../asset/sounds/incorrect.mp3'),
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  level_complete:    require('../../asset/sounds/level_complete.mp3'),
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  denied:            require('../../asset/sounds/denied.mp3'),
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
      players[key] = createAudioPlayer(SOURCES[key]);
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
