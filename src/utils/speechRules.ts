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

// ─── Pronunciation overrides ──────────────────────────────────────────────────
// The user's "say it like this" list. Kept in a module singleton and synced
// from AppContext so speech callers don't need to thread it through. Matched
// whole-word and case-insensitively, longest phrases first.

type PronunciationRule = { from: string; to: string };

let activePronunciations: PronunciationRule[] = [];

export function setPronunciations(list: PronunciationRule[]): void {
  activePronunciations = [...list]
    .filter((p) => p.from.trim() && p.to.trim())
    .sort((a, b) => b.from.length - a.from.length);
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Replace each written word/phrase with its spoken form. */
export function applyPronunciations(text: string): string {
  let out = text;
  for (const rule of activePronunciations) {
    const re = new RegExp(`\\b${escapeRegExp(rule.from.trim())}\\b`, 'gi');
    out = out.replace(re, rule.to.trim());
  }
  return out;
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
 * Returns true when `word` is present in the board vocabulary set.
 * Comparison is case-insensitive. A known word always speaks directly —
 * it should never be spelled out letter-by-letter regardless of the user's
 * spelling-mode preference (emergency communication safety requirement).
 *
 * @param word        - The single word to test (no spaces).
 * @param knownLabels - Pre-built Set of lowercase label strings from
 *                      BOARD_TILES + customBoardTiles. Build this once per
 *                      board state change (not on every utterance call).
 */
export function isKnownVocabWord(word: string, knownLabels: Set<string>): boolean {
  return knownLabels.has(word.toLowerCase().trim());
}

export interface BuildMessageUtterancesOptions {
  /**
   * When true, single unknown words are spelled letter-by-letter before
   * being spoken whole. Defaults to false — speak directly.
   * Known vocab words (present in `knownVocabSet`) ALWAYS speak directly
   * regardless of this flag.
   */
  spellingModeEnabled?: boolean;
  /**
   * Set of lowercase board vocabulary labels used to bypass the spell path
   * for known words. Built from BOARD_TILES + customBoardTiles.
   */
  knownVocabSet?: Set<string>;
}

/**
 * Build the utterance chain for a full-message read.
 * `rate`/`pitch` are the user's stored voice preferences.
 */
export function buildMessageUtterances(
  text: string,
  rate: number,
  pitch: number,
  opts?: BuildMessageUtterancesOptions,
): Utterance[] {
  const trimmed = text.trim();
  if (!trimmed) return [];

  // Single word (no spaces, no punctuation):
  //   • If it is a known vocab word → speak directly (always, regardless of
  //     spellingModeEnabled — a user tapping "HELP" must not wait for H…E…L…P).
  //   • Otherwise, if spellingModeEnabled is explicitly true → spell-and-speak.
  //   • Default (spellingModeEnabled falsy) → speak directly.
  if (!/[\s.,!?]/.test(trimmed)) {
    const spellingOn = opts?.spellingModeEnabled === true;
    const isKnown = opts?.knownVocabSet
      ? isKnownVocabWord(trimmed, opts.knownVocabSet)
      : false;

    if (spellingOn && !isKnown) {
      // Opt-in spell-and-speak: letters first, then the whole word.
      const letters: Utterance[] = [...trimmed].map(letter => ({
        text: letter,
        rate: rate * 0.95,
        pitch,
        gapAfter: 80,
      }));
      letters.push({ text: applyPronunciations(trimmed), rate, pitch, gapAfter: 0 });
      return letters;
    }

    // Direct-speak: known vocab word OR spelling mode disabled.
    return [{ text: applyPronunciations(trimmed), rate, pitch, gapAfter: 0 }];
  }

  const out: Utterance[] = [];
  for (const c of tokeniseClauses(applyPronunciations(trimmed))) {
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
