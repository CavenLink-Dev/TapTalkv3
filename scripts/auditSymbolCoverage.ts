/**
 * auditSymbolCoverage.ts
 *
 * Runs the resolver against the AAC Core 200 word list and prints a tier
 * breakdown so you can see how well the system answers everyday vocabulary.
 *
 * Target distribution (rule of thumb):
 *   exact + alias   ≥ 85%      — the system "just knows" the word
 *   fuzzy + semantic ≤ 10%     — typos / near-misses
 *   category        ≤ 5%       — graceful bucket fallback
 *   unknown         = 0        — should never need the last resort for core
 *
 *   Run:  npm run audit:coverage
 *
 * This script intentionally does NOT boot Expo/SQLite — we hit the seed JSON
 * directly so the audit can run in a plain Node environment.
 */

import fs from 'node:fs/promises';
import path from 'node:path';

const ROOT = process.cwd();
const SEED_PATH = path.join(ROOT, 'src', 'data', 'imports', 'mulberry', 'seed.json');
const EXEMPLARS_PATH = path.join(ROOT, 'src', 'data', 'categoryExemplars.generated.ts');

// Standard "Quick AAC" + Communication Core list. Trimmed to 200 high-utility
// words spanning verbs, pronouns, descriptors, nouns, social phrases, and
// question words. Curated to mirror what AAC users actually say day-to-day.
const CORE_200: string[] = [
  // Pronouns
  'i', 'me', 'my', 'you', 'your', 'he', 'she', 'we', 'they', 'it',
  // Common verbs
  'want', 'need', 'go', 'come', 'help', 'eat', 'drink', 'play', 'see', 'look',
  'like', 'love', 'have', 'get', 'give', 'take', 'make', 'do', 'stop', 'start',
  'open', 'close', 'put', 'find', 'tell', 'show', 'know', 'think', 'feel', 'try',
  'read', 'write', 'wait', 'work', 'rest', 'sleep', 'wake', 'sit', 'stand', 'walk',
  'run', 'jump', 'dance', 'sing', 'cook', 'wash', 'brush', 'clean', 'fix', 'turn',
  // Core descriptors
  'good', 'bad', 'big', 'small', 'hot', 'cold', 'fast', 'slow', 'happy', 'sad',
  'angry', 'tired', 'sick', 'hungry', 'thirsty', 'scared', 'excited', 'calm',
  'new', 'old', 'clean', 'dirty', 'easy', 'hard', 'safe', 'sore', 'better', 'worse',
  // Time / quantity
  'now', 'later', 'today', 'tomorrow', 'yesterday', 'morning', 'afternoon',
  'night', 'soon', 'always', 'never', 'more', 'less', 'all', 'none', 'one',
  'two', 'three', 'many', 'few', 'enough',
  // Places
  'home', 'school', 'work', 'shop', 'park', 'beach', 'hospital', 'doctor',
  'toilet', 'bathroom', 'kitchen', 'bedroom', 'outside', 'inside',
  // People
  'mum', 'dad', 'friend', 'teacher', 'baby', 'family', 'sister', 'brother',
  'person', 'people',
  // Food
  'food', 'water', 'milk', 'juice', 'tea', 'coffee', 'apple', 'banana', 'bread',
  'rice', 'pasta', 'pizza', 'cake', 'lunch', 'dinner', 'breakfast', 'snack',
  // Transport / things
  'car', 'bus', 'train', 'bike', 'plane', 'book', 'phone', 'tv', 'computer',
  'toy', 'ball', 'music', 'game',
  // Social
  'hello', 'goodbye', 'please', 'thanks', 'sorry', 'yes', 'no', 'ok',
  // Question words
  'what', 'where', 'when', 'why', 'who', 'how',
  // Body / health
  'head', 'hand', 'eye', 'ear', 'mouth', 'foot', 'leg', 'arm', 'tooth', 'hair',
  'medicine', 'pain', 'rest',
  // Connectors
  'and', 'or', 'but', 'with', 'without', 'because',
  // Misc high-utility
  'finished', 'again', 'different', 'same', 'special', 'favourite', 'birthday',
  'present', 'party', 'holiday', 'weekend',
];

type SeedSymbol = {
  id: string;
  display_name: string;
  category: string;
};

type SeedKeyword = {
  keyword: string;
  normalized_keyword: string;
  concept_id: string;
  source: 'mulberry' | 'manual' | 'australian_english' | string;
};

type SeedBundle = {
  symbols: SeedSymbol[];
  keywords: SeedKeyword[];
};

type Tier = 'exact' | 'alias' | 'fuzzy' | 'category' | 'unknown';

function normalise(s: string): string {
  // Mirror the importer's normalizeText (lower, strip punct, underscores → space).
  return s
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/[^a-z0-9\s'-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function levenshtein(a: string, b: string): number {
  const dp: number[][] = Array.from({ length: a.length + 1 }, () =>
    new Array(b.length + 1).fill(0),
  );
  for (let i = 0; i <= a.length; i += 1) dp[i][0] = i;
  for (let j = 0; j <= b.length; j += 1) dp[0][j] = j;
  for (let i = 1; i <= a.length; i += 1) {
    for (let j = 1; j <= b.length; j += 1) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[a.length][b.length];
}

async function loadExemplarCategories(): Promise<Set<string>> {
  try {
    const raw = await fs.readFile(EXEMPLARS_PATH, 'utf8');
    const matches = Array.from(raw.matchAll(/"([^"]+)":\s*\{/g));
    return new Set(matches.map(m => m[1]));
  } catch {
    return new Set();
  }
}

async function main() {
  const seed = JSON.parse(await fs.readFile(SEED_PATH, 'utf8')) as SeedBundle;
  const exemplarCategories = await loadExemplarCategories();

  // Build indices that mirror the live resolver's tier definitions.
  //
  //   exact  = the word IS the symbol's display_name (the symbol literally
  //            represents that concept)
  //   alias  = the word matches a keyword from manual/AU-aliases (someone
  //            curated this mapping) or matches the canonical keyword for
  //            a symbol whose display_name is different (e.g. "mum" → "mother")
  //   fuzzy  = within edit distance 2 of any keyword
  //   ...
  const displayNameSet = new Set<string>();
  for (const s of seed.symbols) displayNameSet.add(normalise(s.display_name));

  const allKeywords = new Set<string>();
  const curatedAliases = new Set<string>(); // manual + australian_english
  for (const k of seed.keywords) {
    allKeywords.add(k.normalized_keyword);
    allKeywords.add(normalise(k.keyword));
    if (k.source === 'manual' || k.source === 'australian_english') {
      curatedAliases.add(k.normalized_keyword);
      curatedAliases.add(normalise(k.keyword));
    }
  }

  function resolveTier(word: string): { tier: Tier; via: string } {
    const w = normalise(word);

    if (displayNameSet.has(w)) return { tier: 'exact', via: w };

    if (curatedAliases.has(w)) return { tier: 'alias', via: w };

    if (allKeywords.has(w)) {
      // It's a keyword, but not the display name and not in our curated
      // alias list — so it's a tag or auto-derived keyword. Counts as alias.
      return { tier: 'alias', via: w };
    }

    // Cheap fuzzy: any keyword within edit-distance 2 (and ≤ 30% of the word length).
    for (const k of allKeywords) {
      if (Math.abs(k.length - w.length) > 2) continue;
      const d = levenshtein(k, w);
      if (d <= 2 && d / Math.max(k.length, w.length) <= 0.3) {
        return { tier: 'fuzzy', via: k };
      }
    }

    // Category fallback by token overlap.
    let bestCategory = '';
    let bestOverlap = 0;
    for (const category of exemplarCategories) {
      const have = category.toLowerCase().split(/\s+/);
      const overlap = have.reduce((n, x) => (w === x ? n + 1 : n), 0);
      if (overlap > bestOverlap) {
        bestOverlap = overlap;
        bestCategory = category;
      }
    }
    if (bestOverlap > 0) return { tier: 'category', via: bestCategory };

    return { tier: 'unknown', via: '' };
  }

  const counts: Record<Tier, number> = {
    exact: 0,
    alias: 0,
    fuzzy: 0,
    category: 0,
    unknown: 0,
  };
  const examples: Record<Tier, string[]> = {
    exact: [],
    alias: [],
    fuzzy: [],
    category: [],
    unknown: [],
  };

  for (const word of CORE_200) {
    const { tier, via } = resolveTier(word);
    counts[tier] += 1;
    if (examples[tier].length < 8) {
      examples[tier].push(via ? `${word} → ${via}` : word);
    }
  }

  const total = CORE_200.length;
  const pct = (n: number) => `${Math.round((n / total) * 1000) / 10}%`;

  process.stdout.write(
    JSON.stringify(
      {
        wordsTested: total,
        exemplarCategoriesLoaded: exemplarCategories.size,
        distribution: {
          exact: `${counts.exact} (${pct(counts.exact)})`,
          alias: `${counts.alias} (${pct(counts.alias)})`,
          fuzzy: `${counts.fuzzy} (${pct(counts.fuzzy)})`,
          category: `${counts.category} (${pct(counts.category)})`,
          unknown: `${counts.unknown} (${pct(counts.unknown)})`,
        },
        examples,
        targetsHit: {
          exactPlusAliasGte85pct: (counts.exact + counts.alias) / total >= 0.85,
          unknownEqualsZero: counts.unknown === 0,
        },
      },
      null,
      2,
    ) + '\n',
  );
}

main().catch(err => {
  process.stderr.write(`${err instanceof Error ? err.stack : String(err)}\n`);
  process.exitCode = 1;
});
