/**
 * Offline core-first next-word predictor.
 *
 * Replaces the removed n-gram model with a small hand-curated bigram table
 * grounded in AAC core-vocabulary research (Van Tatenhove, Cross et al.).
 * Ships in the bundle — no download, no network, no user data leaves the app.
 *
 * `predictNext(prevWord, max)` returns 1–4 suggestion chips. The empty string
 * or undefined `prevWord` returns the sentence-starter set — the first row a
 * new session should show.
 *
 * Extend `BIGRAMS` freely; the table is intentionally lowercase-keyed so
 * matching stays punctuation-insensitive.
 */
const BIGRAMS: Record<string, string[]> = {
  '<start>': ['i', 'you', 'want', 'more', 'help', 'no', 'yes', 'stop'],
  i:         ['want', 'need', 'see', 'like', 'am', 'have', 'feel', 'go'],
  you:       ['are', 'want', 'have', 'can', 'do', 'help'],
  want:      ['more', 'that', 'this', 'help', 'to', 'it'],
  need:      ['help', 'more', 'break', 'water', 'toilet'],
  more:      ['please', 'food', 'water', 'time', 'play'],
  help:      ['me', 'please', 'now'],
  no:        ['more', 'thank', 'thanks', 'stop'],
  yes:       ['please', 'more', 'thanks'],
  go:        ['home', 'there', 'to', 'outside'],
  see:       ['you', 'that', 'this', 'it'],
  like:      ['this', 'that', 'it', 'you'],
  am:        ['happy', 'sad', 'tired', 'hungry', 'okay'],
  feel:      ['happy', 'sad', 'tired', 'sick'],
  have:      ['a', 'to', 'more', 'that'],
  stop:      ['please', 'now'],
  play:      ['with', 'more', 'again'],
  eat:       ['more', 'food', 'now'],
  drink:     ['water', 'more', 'juice'],
  are:       ['you', 'nice', 'okay'],
};

const DEFAULT_START = BIGRAMS['<start>'];

export function predictNext(prev: string | undefined, max = 4): string[] {
  const key = (prev ?? '').trim().toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');
  const list = key && BIGRAMS[key] ? BIGRAMS[key] : DEFAULT_START;
  return list.slice(0, Math.max(1, Math.min(max, 8)));
}

/** For settings / diagnostics — how many keys the predictor covers today. */
export function predictorCoverage(): number {
  return Object.keys(BIGRAMS).length - 1; // -1 for the <start> slot
}
