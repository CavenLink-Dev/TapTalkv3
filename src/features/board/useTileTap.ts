/**
 * Tap/dwell/debounce for AAC tiles.
 *
 *  • standard motor profile → fire on release (normal tap)
 *  • tremor                 → same, but discard second fires inside debounce window
 *  • severe                 → dwell activation: user must hold for dwellMs
 *
 * Wire from TileCell: {onPress, onPressIn, onPressOut} = useTileTap(handleFire).
 * `handleFire(tileId)` should dispatch the append-to-message-strip action AND
 * call SpeechService.say(word).
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

  const onPressOut = useCallback(() => {
    clearDwell();
  }, [clearDwell]);

  const onPress = useCallback(
    (tileId: string) => {
      if (motor.dwellMs > 0) return; // dwell already fired (or was cancelled)
      fire(tileId);
    },
    [motor.dwellMs, fire],
  );

  return { onPress, onPressIn, onPressOut };
}
