import { useCallback, useEffect, useRef, useState } from 'react';
import { SpeechService, type SayOptions, type SpeechMode } from '../features/speech/SpeechService';
import { useSpeaking } from '../features/speech/useSpeaking';

/**
 * Thin UI hook over SpeechService. Every TTS call in the app routes through the
 * service so the queue, audio-ducking, and persisted rate/pitch/voice prefs
 * apply uniformly — callers never touch `expo-speech` directly.
 *
 * `speak(text, options)` keeps the historical (rate/pitch/onDone/onError)
 * signature so existing callers (Talk board word-by-word queue) work unchanged;
 * options are now honoured per-utterance by the service.
 */
export interface SpeechError {
  action: 'speak' | 'stop' | 'isSpeaking';
  message: string;
}

/** Back-compat alias for the old expo-speech options shape callers passed. */
export type SpeechOptions = SayOptions;

export const useSpeech = () => {
  const [lastError, setLastError] = useState<SpeechError | null>(null);
  const errorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const speaking = useSpeaking();

  const surfaceError = useCallback((err: SpeechError) => {
    setLastError(err);
    if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
    errorTimerRef.current = setTimeout(() => setLastError(null), 4000);
  }, []);

  const clearError = useCallback(() => {
    setLastError(null);
    if (errorTimerRef.current) {
      clearTimeout(errorTimerRef.current);
      errorTimerRef.current = null;
    }
  }, []);

  useEffect(
    () => () => {
      if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
    },
    [],
  );

  const speak = useCallback(
    (text: string, options?: SpeechOptions & { mode?: SpeechMode }): boolean => {
      try {
        clearError();
        const { mode, onError, ...rest } = options ?? {};
        SpeechService.say(text, mode ?? 'interrupt', {
          ...rest,
          onError: (e) => {
            onError?.(e);
            surfaceError({ action: 'speak', message: e?.message ?? 'Speech playback failed' });
          },
        });
        return true;
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : 'Failed to start speech';
        surfaceError({ action: 'speak', message });
        return false;
      }
    },
    [clearError, surfaceError],
  );

  const stop = useCallback((): boolean => {
    try {
      SpeechService.stop();
      return true;
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Failed to stop speech';
      surfaceError({ action: 'stop', message });
      return false;
    }
  }, [surfaceError]);

  const isSpeakingAsync = useCallback(async (): Promise<boolean> => speaking, [speaking]);

  return {
    speak,
    stop,
    isSpeakingAsync,
    speaking,
    lastError,
    clearError,
  };
};
