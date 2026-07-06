/**
 * A tiny pub/sub used by SwitchInputCapture to publish keydown events to
 * `useSwitchInput`. Keeps the capture view free of a hard dependency on
 * the controller and avoids the "focused TextInput swallows key events"
 * problem — we push into this bridge from `onKeyPress` and the hook
 * subscribes without needing view context.
 */

type Phase = 'down' | 'up';
type Listener = (key: string, phase: Phase) => void;

const listeners = new Set<Listener>();

export function emitKey(key: string, phase: Phase): void {
  for (const l of listeners) {
    try {
      l(key, phase);
    } catch {
      // A misbehaving listener should not take the whole bridge down —
      // just skip and continue.
    }
  }
}

export function onKey(cb: Listener): () => void {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}
