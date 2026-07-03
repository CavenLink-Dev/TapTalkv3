/**
 * Lightweight local n-gram model for next-word prediction.
 * Builds bigram counts from spoken sentences and predicts the next word
 * based on the last word in the message strip.
 */

export function updateNgramModel(
  model: Record<string, Record<string, number>>,
  words: string[]
): Record<string, Record<string, number>> {
  if (words.length < 2) return model;
  const newModel: Record<string, Record<string, number>> = {};
  for (const [key, inner] of Object.entries(model)) {
    newModel[key] = { ...inner };
  }
  for (let i = 0; i < words.length - 1; i++) {
    const current = words[i];
    const next = words[i + 1];
    if (!current || !next) continue;
    if (!newModel[current]) {
      newModel[current] = {};
    }
    newModel[current][next] = (newModel[current][next] ?? 0) + 1;
  }
  return newModel;
}

export function predictNextWords(
  lastWord: string,
  model: Record<string, Record<string, number>>,
  limit = 3
): string[] {
  const candidates = model[lastWord];
  if (!candidates) return [];
  return Object.entries(candidates)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([word]) => word);
}

// ── Prediction v1 — multi-signal, ranked suggestions ─────────────────────────
// Combines three on-device signals so there are always useful, ranked chips:
//   • bigram      — how often `word` followed the last word (strongest)
//   • frequency   — how often `word` is used overall (unigram)
//   • core vocab  — a fixed high-frequency AAC list, so a near-empty model
//                   still surfaces sensible starters (a "core-vocab bonus")
// Everything is local; nothing is uploaded. v2 (grammar, time, activity,
// location, semantic links) can add sources behind this same interface.

export type PredictionSource = 'bigram' | 'frequency' | 'core';
export interface Suggestion {
  word: string;
  score: number;
  source: PredictionSource;
}

// High-frequency AAC core vocabulary. Rendering capitalises as needed.
export const CORE_VOCAB: string[] = [
  'I', 'you', 'it', 'want', 'more', 'stop', 'go', 'like', 'help', 'no',
  'yes', 'my', 'me', 'have', 'do', 'not', 'this', 'that', 'can', 'good',
  'here', 'look', 'turn', 'play', 'eat', 'drink', 'open', 'all', 'done', 'again',
  'please', 'finished', 'love', 'make', 'need',
];

/** Sum every next-word count into a unigram frequency table. */
export function buildUnigramFrequency(
  model: Record<string, Record<string, number>>
): Record<string, number> {
  const freq: Record<string, number> = {};
  for (const inner of Object.values(model)) {
    for (const [word, count] of Object.entries(inner)) {
      freq[word] = (freq[word] ?? 0) + count;
    }
  }
  return freq;
}

/**
 * Returns up to `limit` ranked suggestions (highest score first). Always fills
 * from core vocab so the row never collapses below the requested count once the
 * user has any message context.
 */
export function predictSuggestions(params: {
  lastWord?: string;
  model: Record<string, Record<string, number>>;
  coreVocab?: string[];
  /** Words already in the message — never re-suggested (case-insensitive). */
  exclude?: string[];
  limit?: number;
}): Suggestion[] {
  const { lastWord, model, coreVocab = CORE_VOCAB, exclude = [], limit = 5 } = params;
  // Keyed by lowercase so 'go' (core) and 'Go' (bigram) merge into one chip.
  const scores = new Map<string, { display: string; score: number; source: PredictionSource }>();
  const bump = (word: string, add: number, source: PredictionSource) => {
    const key = word.toLowerCase();
    const cur = scores.get(key);
    if (!cur) {
      scores.set(key, { display: word, score: add, source });
    } else {
      cur.score += add;
      // Bigram is the strongest signal — let it own the label + display.
      if (source === 'bigram') {
        cur.source = 'bigram';
        cur.display = word;
      }
    }
  };

  const lower = lastWord?.toLowerCase();
  const excludeSet = new Set(exclude.map(w => w.toLowerCase()));

  // 1) Bigram — scaled 2..5 by relative count after the last word.
  const bigrams = lastWord ? model[lastWord] ?? (lower ? model[lower] : undefined) : undefined;
  if (bigrams) {
    const entries = Object.entries(bigrams);
    const max = Math.max(1, ...entries.map(([, c]) => c));
    for (const [word, count] of entries) bump(word, 2 + (count / max) * 3, 'bigram');
  }

  // 2) Frequency — scaled 0..1.5 by relative overall use.
  const freq = buildUnigramFrequency(model);
  const maxFreq = Math.max(1, ...Object.values(freq));
  for (const [word, count] of Object.entries(freq)) {
    bump(word, (count / maxFreq) * 1.5, 'frequency');
  }

  // 3) Core-vocab bonus — a flat floor so useful words always appear.
  for (const word of coreVocab) bump(word, 1, 'core');

  return [...scores.entries()]
    .filter(([key]) => key !== lower && !excludeSet.has(key)) // skip last word + words already in message
    .map(([, v]) => ({ word: v.display, score: Math.round(v.score * 100) / 100, source: v.source }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
