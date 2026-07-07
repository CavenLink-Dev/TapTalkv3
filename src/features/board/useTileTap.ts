/**
 * Tap / dwell / debounce for AAC tiles.
 *
 *   • standard motor profile → fire on release (normal tap)
 *   • tremor                 → tap, but a debounce window swallows fast repeats
 *   • severe                 → dwell activation: user must hold for dwellMs
 *
 * Wire from TileCell / BoardWordTile:
 *   const { onPress, onPressIn, onPressOut } = useTileTap(handleFire);
 *   <Pressable onPress={() => onPress(tile.id)} onPressIn={() => onPressIn(tile.id)} onPressOut={onPressOut} />
 *
 * `handleFire(tileId)` is expected to (1) dispatch the append-to-message-strip
 * action and (2) call SpeechService.say(word, mode).
 */
import { useCallback, useRef } from 'react';
import { useMotor } from '../accessibility/motor';

export function useTileTap(onFire: (tileId: string) => void) {
  const motor = useMotor();
  const lastFireAt = useRef(0);
  const dwellTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dwellArmedFor = useRef<string | null>(null);

  const fire = useCallback(
    (tileId: string) => {
      const now = Date.now();
      if (motor.tapDebounceMs > 0 && now - lastFireAt.current < motor.tapDebounceMs) return;
      lastFireAt.current = now;
      onFire(tileId);
    },
    [motor.tapDebounceMs, onFire],
  );

  const clearDwell = useCallback(() => {
    if (dwellTimer.current) {
      clearTimeout(dwellTimer.current);
      dwellTimer.current = null;
    }
    dwellArmedFor.current = null;
  }, []);

  const onPressIn = useCallback(
    (tileId: string) => {
      if (motor.dwellMs <= 0) return;
      dwellArmedFor.current = tileId;
      dwellTimer.current = setTimeout(() => {
        if (dwellArmedFor.current === tileId) fire(tileId);
        clearDwell();
      }, motor.dwellMs);
    },
    [motor.dwellMs, fire, clearDwell],
  );

  const onPressOut = useCallback(() => clearDwell(), [clearDwell]);

  const onPress = useCallback(
    (tileId: string) => {
      if (motor.dwellMs > 0) return; // dwell already fired (or was cancelled)
      fire(tileId);
    },
    [motor.dwellMs, fire],
  );

  return { onPress, onPressIn, onPressOut };
}
