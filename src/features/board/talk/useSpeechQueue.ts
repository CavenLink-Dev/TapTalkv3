import { useCallback, useRef } from 'react';

type SpeakFn = (
  text: string,
  options?: {
    rate?: number;
    pitch?: number;
    onDone?: () => void;
    onStopped?: () => void;
  },
) => boolean;

export function useSpeechQueue({
  speak,
  stopSpeech,
  speechRate,
  speechPitch,
}: {
  speak: SpeakFn;
  stopSpeech: () => boolean;
  speechRate: number;
  speechPitch: number;
}) {
  // Chained-utterance run tracking — cancels any in-flight clause chain so
  // rapid re-taps on the strip never overlap audio (board_speech_rules.md).
  const speakRunIdRef = useRef(0);
  const speakGapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Speech FIFO queue (Bug #7) ────────────────────────────────────────────
  // In word-by-word mode each tile tap enqueues; the queue drains sequentially
  // so rapid taps are heard in order instead of cancelling each other.
  const speechQueueRef = useRef<string[]>([]);
  const isSpeakingQueueRef = useRef(false);

  // drainSpeechQueue — speak the next item; schedules itself via onDone.
  // Must be stable so it can be referenced from the onDone closure without
  // stale-closure bugs (reads refs, not closed-over state).
  const speechRateRef = useRef(speechRate);
  const speechPitchRef = useRef(speechPitch);
  speechRateRef.current = speechRate;
  speechPitchRef.current = speechPitch;

  const drainSpeechQueue = useCallback(() => {
    const next = speechQueueRef.current.shift();
    if (!next) {
      isSpeakingQueueRef.current = false;
      return;
    }
    isSpeakingQueueRef.current = true;
    speak(next, {
      rate: speechRateRef.current,
      pitch: speechPitchRef.current,
      onDone: () => drainSpeechQueue(),
      onStopped: () => { isSpeakingQueueRef.current = false; },
    });
  }, [speak]);

  const enqueueSpeech = useCallback((text: string) => {
    speechQueueRef.current.push(text);
    if (!isSpeakingQueueRef.current) drainSpeechQueue();
  }, [drainSpeechQueue]);

  const flushSpeechQueue = useCallback(() => {
    speechQueueRef.current = [];
    isSpeakingQueueRef.current = false;
    stopSpeech();
  }, [stopSpeech]);

  return {
    speakRunIdRef,
    speakGapTimerRef,
    speechQueueRef,
    drainSpeechQueue,
    enqueueSpeech,
    flushSpeechQueue,
  };
}
