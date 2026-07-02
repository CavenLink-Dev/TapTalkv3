/**
 * TapTalk — speech clause tokenizer + utterance builder.
 *
 * Source of truth: to_do/board_speech_rules.md. Both the AAC board
 * message strip (app/(tabs)/talk.tsx) and the TapTalk keyboard
 * (app/board/keyboard/index.tsx) call `buildMessageUtterances` so
 * punctuation-aware speech behaves identically everywhere.
 *
 * Rules applied:
 *   .  → ~350 ms pause after the clause
 *   ,  → ~180 ms pause after the clause
 *   !  → pitch rise on the final word of the clause
 *   ?  → rising intonation on the final word of the clause
 *   Single word with no space/punct → spell-and-speak
 *
 * Modifications apply on top of the user's stored voice preferences
 * (state.accessibility.speechRate / speechPitch).
 */

export interface Clause {
  text: string;
  /** Punctuation that ended the clause, or undefined if none. */
  terminator?: '.' | ',' | '!' | '?';
}

/** One TTS call in a chained run. */
export interface Utterance {
  text: string;
  rate: number;
  pitch: number;
  /** Silent wait before the next utterance starts. */
  gapAfter: number;
}

export function tokeniseClauses(text: string): Clause[] {
  const result: Clause[] = [];
  const re = /([^.,!?]+)([.,!?])?/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    const body = (m[1] ?? '').trim();
    if (!body) continue;
    const term = m[2] as Clause['terminator'] | undefined;
    result.push({ text: body, terminator: term });
  }
  return result;
}

/**
 * Build the utterance chain for a full-message read.
 * `rate`/`pitch` are the user's stored voice preferences.
 */
export function buildMessageUtterances(text: string, rate: number, pitch: number): Utterance[] {
  const trimmed = text.trim();
  if (!trimmed) return [];

  // Single word (no spaces, no punctuation) → spell-and-speak.
  if (!/[\s.,!?]/.test(trimmed)) {
    const letters: Utterance[] = [...trimmed].map(letter => ({
      text: letter,
      rate: rate * 0.95,
      pitch,
      gapAfter: 80,
    }));
    letters.push({ text: trimmed, rate, pitch, gapAfter: 0 });
    return letters;
  }

  const out: Utterance[] = [];
  for (const c of tokeniseClauses(trimmed)) {
    switch (c.terminator) {
      case '!':
      case '?': {
        const words = c.text.split(/\s+/);
        const last = words.pop() ?? '';
        const head = words.join(' ');
        const mod = c.terminator === '!'
          ? { rate: rate * 0.94, pitch: pitch * 1.15, gapAfter: 220 }
          : { rate: rate * 0.96, pitch: pitch * 1.25, gapAfter: 200 };
        if (head) out.push({ text: head, rate, pitch, gapAfter: 40 });
        out.push({ text: last, ...mod });
        break;
      }
      case '.':
        out.push({ text: c.text, rate, pitch, gapAfter: 350 });
        break;
      case ',':
        out.push({ text: c.text, rate, pitch, gapAfter: 180 });
        break;
      default:
        out.push({ text: c.text, rate, pitch, gapAfter: 100 });
        break;
    }
  }
  return out;
}
