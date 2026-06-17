import { useCallback, useRef, useState } from 'react';
import * as Speech from 'expo-speech';

export interface SpeechError {
  action: 'speak' | 'stop' | 'isSpeaking';
  message: string;
}

export const useSpeech = () => {
  const [lastError, setLastError] = useState<SpeechError | null>(null);
  const errorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  const speak = useCallback(
    (text: string, options?: Speech.SpeechOptions): boolean => {
      try {
        clearError();
        Speech.speak(text, {
          ...options,
          onError: (e) => {
            surfaceError({
              action: 'speak',
              message: e?.message ?? 'Speech playback failed',
            });
          },
        });
        return true;
      } catch (e: unknown) {
        const message =
          e instanceof Error ? e.message : 'Failed to start speech';
        surfaceError({ action: 'speak', message });
        return false;
      }
    },
    [clearError, surfaceError],
  );

  const stop = useCallback((): boolean => {
    try {
      Speech.stop();
      return true;
    } catch (e: unknown) {
      const message =
        e instanceof Error ? e.message : 'Failed to stop speech';
      surfaceError({ action: 'stop', message });
      return false;
    }
  }, [surfaceError]);

  const isSpeakingAsync = useCallback(async (): Promise<boolean> => {
    try {
      return await Speech.isSpeakingAsync();
    } catch (e: unknown) {
      const message =
        e instanceof Error ? e.message : 'Failed to check speech status';
      surfaceError({ action: 'isSpeaking', message });
      return false;
    }
  }, [surfaceError]);

  return {
    speak,
    stop,
    isSpeakingAsync,
    lastError,
    clearError,
  };
};
