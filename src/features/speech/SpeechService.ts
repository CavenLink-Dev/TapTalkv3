/**
 * SpeechService — single source of truth for TTS.
 *
 * Replaces the fire-and-forget calls scattered through the app. Guarantees:
 *  • FIFO queue when caller wants sequential words (word-by-word mode)
 *  • Interrupt-and-speak when caller wants latest utterance to win
 *  • Audio session configured once so TTS ducks background audio
 *  • Voice / rate / pitch persist across sessions via setPrefs()
 *  • Subscribers can react to speaking-state changes for UI feedback
 *
 * Do NOT call `expo-speech` directly anywhere else. Route through this.
 */
import * as Speech from 'expo-speech';

type Utter = { id: string; text: string };
export type SpeechMode = 'interrupt' | 'enqueue';

class SpeechServiceImpl {
  private queue: Utter[] = [];
  private speaking = false;
  private initialised = false;
  private prefs = {
    rate: 0.9,
    pitch: 1.0,
    voice: undefined as string | undefined,
    language: 'en-US',
  };
  private listeners = new Set<(speaking: boolean) => void>();

  async init(): Promise<void> {
    if (this.initialised) return;
    this.initialised = true;
    // Audio session config lives in a lightweight module to avoid pulling
    // expo-audio into every speech call site. Best-effort — never throw.
    try {
      const { configureAudioSession } = await import('./audioSession');
      await configureAudioSession();
    } catch {
      // ignore — worst case, TTS still plays without ducking
    }
  }

  setPrefs(next: Partial<typeof this.prefs>): void {
    this.prefs = { ...this.prefs, ...next };
  }

  onSpeakingChange(cb: (speaking: boolean) => void): () => void {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  say(text: string, mode: SpeechMode = 'interrupt'): void {
    const clean = text.trim();
    if (!clean) return;
    const utter: Utter = { id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, text: clean };

    if (mode === 'interrupt') {
      this.queue = [utter];
      Speech.stop();
    } else {
      this.queue.push(utter);
    }
    if (!this.speaking) this.pump();
  }

  stop(): void {
    this.queue = [];
    try { Speech.stop(); } catch { /* noop */ }
    this.setSpeaking(false);
  }

  private pump(): void {
    const next = this.queue.shift();
    if (!next) {
      this.setSpeaking(false);
      return;
    }
    this.setSpeaking(true);
    Speech.speak(next.text, {
      rate: this.prefs.rate,
      pitch: this.prefs.pitch,
      voice: this.prefs.voice,
      language: this.prefs.language,
      onDone: () => this.pump(),
      onStopped: () => this.pump(),
      onError: () => this.pump(),
    });
  }

  private setSpeaking(v: boolean): void {
    if (this.speaking === v) return;
    this.speaking = v;
    this.listeners.forEach((l) => l(v));
  }
}

export const SpeechService = new SpeechServiceImpl();
