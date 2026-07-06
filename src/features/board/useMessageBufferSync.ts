/**
 * Debounced write of state.messageWords to disk. Mount once at the Talk
 * screen root and it'll keep the buffer file in sync.
 */
import { useEffect, useRef } from 'react';
import { saveBuffer } from './persistMessageBuffer';

const DEBOUNCE_MS = 100;

export function useMessageBufferSync(words: string[]): void {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      saveBuffer(words);
    }, DEBOUNCE_MS);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [words]);
}
