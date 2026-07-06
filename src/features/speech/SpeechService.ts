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

/**
 * Per-utterance overrides. Callers (e.g. useSpeech → talk.tsx) may pass
 * rate/pitch/voice for a single utterance, plus lifecycle callbacks. Anything
 * omitted falls back to the persisted prefs set via setPrefs().
 */
export type SayOptions = {
  rate?: number;
  pitch?: number;
  voice?: string;
  language?: string;
  onDone?: () => void;
  onStopped?: () => void;
  onError?: (error: Error) => void;
};

type Utter = { id: string; text: string; opts?: SayOptions };
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

  say(text: string, mode: SpeechMode = 'interrupt', opts?: SayOptions): void {
    const clean = text.trim();
    if (!clean) return;
    const utter: Utter = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      text: clean,
      opts,
    };

    if (mode === 'interrupt') {
      this.queue = [utter];
      try { Speech.stop(); } catch { /* noop */ }
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

  /** All installed voices. Best-effort — returns [] if the query fails. */
  async getVoices(): Promise<Speech.Voice[]> {
    try {
      return await Speech.getAvailableVoicesAsync();
    } catch {
      return [];
    }
  }

  /** Installed Enhanced-quality voices for a language prefix (e.g. 'en'). */
  async getEnhancedVoices(languagePrefix = 'en'): Promise<Speech.Voice[]> {
    const voices = await this.getVoices();
    return voices.filter(
      (v) =>
        v.language?.toLowerCase().startsWith(languagePrefix) &&
        v.quality === Speech.VoiceQuality.Enhanced,
    );
  }

  private pump(): void {
    const next = this.queue.shift();
    if (!next) {
      this.setSpeaking(false);
      return;
    }
    this.setSpeaking(true);
    const opts = next.opts;
    Speech.speak(next.text, {
      rate: opts?.rate ?? this.prefs.rate,
      pitch: opts?.pitch ?? this.prefs.pitch,
      voice: opts?.voice ?? this.prefs.voice,
      language: opts?.language ?? this.prefs.language,
      onDone: () => { opts?.onDone?.(); this.pump(); },
      onStopped: () => { opts?.onStopped?.(); this.pump(); },
      onError: (e) => { opts?.onError?.(e as Error); this.pump(); },
    });
  }

  private setSpeaking(v: boolean): void {
    if (this.speaking === v) return;
    this.speaking = v;
    this.listeners.forEach((l) => l(v));
  }
}

export const SpeechService = new SpeechServiceImpl();
