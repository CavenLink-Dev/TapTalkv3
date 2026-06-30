/**
 * resolveSymbolForKeyword — Jest test pack
 *
 * Covers:
 *   A) 30 high-frequency AAC words → tier 'exact' or 'alias'
 *   B) 20 gibberish words        → tier 'category' or 'unknown', never throws
 *   C) 10 ambiguous sentences    → different symbols based on sentenceTokens
 *   D) LRU cache hit             → searchSymbols called only once per unique key
 *   E) resolveSymbolsForPhrase   → tokenises a phrase and resolves each word,
 *                                  threading siblings through as sentenceTokens
 */

jest.mock('../symbolSearchService');
jest.mock('../../../data/sqlite/repositories/symbolRepository');
jest.mock('../../../data/sqlite/repositories/conceptRepository');
jest.mock('../../../data/categoryExemplars.generated', () => ({
  CATEGORY_EXEMPLARS: {
    'Animal Mammal': {
      symbolId: 'mulberry_dog_test',
      displayName: 'dog',
      selectedBy: 'curated',
    },
    'Sport': {
      symbolId: 'mulberry_ball_test',
      displayName: 'ball',
      selectedBy: 'auto',
    },
    'Food General': {
      symbolId: 'mulberry_food_test',
      displayName: 'food',
      selectedBy: 'auto',
    },
    'Descriptive State': {
      symbolId: 'mulberry_happy_test',
      displayName: 'happy',
      selectedBy: 'auto',
    },
  },
  UNKNOWN_FALLBACK_SYMBOL_ID: 'mulberry_what_test',
}));
jest.mock('../../../data/mulberryAssetMap.generated', () => ({
  MULBERRY_ASSET_MAP: {
    'mulberry_dog_test': 1,
    'mulberry_ball_test': 2,
    'mulberry_food_test': 3,
    'mulberry_happy_test': 4,
    'mulberry_what_test': 5,
    'mulberry_animal_bat_test': 6,
    'mulberry_cricket_bat_test': 7,
    'mulberry_river_bank_test': 8,
    'mulberry_money_bank_test': 9,
  },
}));

import {
  resolveSymbolForKeyword,
  resolveSymbolsForPhrase,
  clearResolveCache,
} from '../resolveSymbolForKeyword';
import { searchSymbols } from '../symbolSearchService';
import { getSymbolById } from '../../../data/sqlite/repositories/symbolRepository';
import { getConceptById } from '../../../data/sqlite/repositories/conceptRepository';
import { SymbolItem, Concept, SearchResult } from '../types';

const mockSearchSymbols = searchSymbols as jest.Mock;
const mockGetSymbolById = getSymbolById as jest.Mock;
const mockGetConceptById = getConceptById as jest.Mock;

// ── Fixtures ────────────────────────────────────────────────────────────────

function makeSymbol(id: string, display_name: string, category = 'General'): SymbolItem {
  const now = '2026-01-01T00:00:00.000Z';
  return {
    id,
    concept_id: `CONCEPT_${id}`,
    display_name,
    file_path: `mulberry/svg/${id}.svg`,
    file_type: 'svg',
    category,
    tags: [],
    source: 'Mulberry Symbols',
    license: 'CC BY-SA 4.0',
    author: 'Mulberry Symbols',
    is_sensitive: false,
    age_level: 'all',
    locale: ['en', 'en-AU'],
    aac_priority: 0.8,
    created_at: now,
    updated_at: now,
  };
}

function makeConcept(symbolId: string): Concept {
  return {
    concept_id: `CONCEPT_${symbolId}`,
    canonical_label: symbolId.replace(/_/g, ' '),
    concept_type: 'core',
    category: 'General',
    core_or_fringe: 'core',
  };
}

function makeSearchResult(
  id: string,
  display_name: string,
  matchReason: string,
  score = 0.92,
): SearchResult {
  return {
    symbol: makeSymbol(id, display_name),
    concept: makeConcept(id),
    score,
    match_reasons: [matchReason],
    confidence: 'high',
  };
}

function exactResult(keyword: string): SearchResult {
  return makeSearchResult(`mulberry_${keyword}_test`, keyword, `exact keyword: ${keyword}`);
}

function aliasResult(keyword: string, canonical: string): SearchResult {
  return makeSearchResult(`mulberry_${canonical}_test`, canonical, `alias/prefix keyword: ${keyword}`);
}

// ── High-frequency AAC words ─────────────────────────────────────────────────

const AAC_EXACT: string[] = [
  'help', 'more', 'want', 'go', 'stop',
  'please', 'eat', 'drink', 'play', 'yes',
  'no', 'look', 'feel', 'hurt', 'happy',
  'sad', 'big', 'give', 'take', 'need',
];

const AAC_ALIAS: Array<[string, string]> = [
  ['i', 'person'],
  ['me', 'person'],
  ['my', 'person'],
  ['you', 'person'],
  ['he', 'person'],
  ['she', 'person'],
  ['it', 'thing'],
  ['we', 'person'],
  ['they', 'person'],
  ['like', 'want'],
];

// ── Gibberish words (should never match) ─────────────────────────────────────

const GIBBERISH: string[] = [
  'xyzqwf', 'blargorp', 'qzxplt', 'vrmfkl', 'dwnjsrp',
  'tlxqvb', 'przmkf', 'gxqvzp', 'wkrtns', 'fhqjmx',
  'bzlqpr', 'xtmnvr', 'qpzjwl', 'vtkrsn', 'hmpxbz',
  'zjlqvp', 'fxtrwm', 'pkzjvb', 'rqlxnm', 'ythxkp',
];

// ── Setup ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  clearResolveCache();
  jest.clearAllMocks();

  mockGetSymbolById.mockImplementation(async (id: string) => makeSymbol(id, id.replace(/_/g, ' ')));
  mockGetConceptById.mockResolvedValue(null);

  mockSearchSymbols.mockImplementation(
    async (keyword: string, _userId: string, context: { sentenceTokens?: string[] } = {}) => {
      const kw = keyword.toLowerCase().trim();
      const tokens = context?.sentenceTokens ?? [];

      // Exact AAC words
      if (AAC_EXACT.includes(kw)) return [exactResult(kw)];

      // Alias AAC words
      const aliasEntry = AAC_ALIAS.find(([k]) => k === kw);
      if (aliasEntry) return [aliasResult(kw, aliasEntry[1])];

      // Ambiguous: bat — animal vs cricket bat
      if (kw === 'bat') {
        const isSport = tokens.some(t => ['cricket', 'ball', 'game', 'sport', 'pitch'].includes(t));
        if (isSport) {
          return [
            makeSearchResult('mulberry_cricket_bat_test', 'cricket bat', `exact keyword: bat`, 0.88),
          ];
        }
        return [
          makeSearchResult('mulberry_animal_bat_test', 'bat', `exact keyword: bat`, 0.88),
        ];
      }

      // Ambiguous: bank — river vs financial
      if (kw === 'bank') {
        const isMoney = tokens.some(t => ['money', 'account', 'card', 'cash', 'atm'].includes(t));
        if (isMoney) {
          return [
            makeSearchResult('mulberry_money_bank_test', 'bank', `semantic: bank money`, 0.72),
          ];
        }
        return [
          makeSearchResult('mulberry_river_bank_test', 'bank', `semantic: bank river`, 0.70),
        ];
      }

      // Ambiguous: spring — season vs mechanical
      if (kw === 'spring') {
        const isMechanical = tokens.some(t => ['coil', 'metal', 'bounce', 'mechanism', 'tension'].includes(t));
        if (isMechanical) {
          return [makeSearchResult('mulberry_spring_coil_test', 'spring', 'semantic: spring coil', 0.65)];
        }
        return [makeSearchResult('mulberry_spring_season_test', 'spring', 'exact keyword: spring', 0.90)];
      }

      // Ambiguous: light — lamp vs weight
      if (kw === 'light') {
        const isWeight = tokens.some(t => ['heavy', 'weight', 'carry', 'feather', 'lift'].includes(t));
        if (isWeight) {
          return [makeSearchResult('mulberry_light_weight_test', 'light', 'semantic: light weight', 0.68)];
        }
        return [makeSearchResult('mulberry_light_lamp_test', 'light', 'exact keyword: light', 0.91)];
      }

      // Ambiguous: crane — bird vs machine
      if (kw === 'crane') {
        const isMachine = tokens.some(t => ['building', 'construction', 'lift', 'tower', 'steel'].includes(t));
        if (isMachine) {
          return [makeSearchResult('mulberry_crane_machine_test', 'crane', 'semantic: crane machine', 0.70)];
        }
        return [makeSearchResult('mulberry_crane_bird_test', 'crane', 'exact keyword: crane', 0.88)];
      }

      // No match
      return [];
    },
  );
});

// ── A: Known high-frequency AAC words ────────────────────────────────────────

describe('A — known AAC words (30 total)', () => {
  it.each(AAC_EXACT)('"%s" resolves to tier exact', async (word) => {
    const result = await resolveSymbolForKeyword(word);
    expect(result.tier).toBe('exact');
    expect(result.symbol).toBeDefined();
  });

  it.each(AAC_ALIAS)('"%s" resolves to tier alias', async (word: string) => {
    const result = await resolveSymbolForKeyword(word);
    expect(result.tier).toBe('alias');
    expect(result.symbol).toBeDefined();
  });
});

// ── B: Gibberish / unknown words ─────────────────────────────────────────────

describe('B — gibberish words (20 total)', () => {
  it.each(GIBBERISH)('"%s" resolves without throwing, tier is category or unknown', async (word) => {
    await expect(resolveSymbolForKeyword(word)).resolves.toBeDefined();
    const result = await resolveSymbolForKeyword(word);
    expect(['category', 'unknown']).toContain(result.tier);
  });
});

// ── C: Ambiguous-context sentences ───────────────────────────────────────────

describe('C — ambiguous context sentences (10 total)', () => {
  it('bat: animal context vs cricket context resolves to different symbols', async () => {
    clearResolveCache();
    const animal = await resolveSymbolForKeyword('bat', 'local-user', {
      sentenceTokens: ['fly', 'wing', 'cave', 'dark'],
    });
    clearResolveCache();
    const sport = await resolveSymbolForKeyword('bat', 'local-user', {
      sentenceTokens: ['cricket', 'ball', 'sport', 'pitch'],
    });
    expect(animal.symbol.id).not.toBe(sport.symbol.id);
  });

  it('bat: animal context produces non-sport symbol', async () => {
    clearResolveCache();
    const result = await resolveSymbolForKeyword('bat', 'local-user', {
      sentenceTokens: ['fly', 'cave'],
    });
    expect(result.symbol.id).toBe('mulberry_animal_bat_test');
  });

  it('bat: cricket context produces sport symbol', async () => {
    clearResolveCache();
    const result = await resolveSymbolForKeyword('bat', 'local-user', {
      sentenceTokens: ['cricket', 'game'],
    });
    expect(result.symbol.id).toBe('mulberry_cricket_bat_test');
  });

  it('bank: river context vs money context resolves to different symbols', async () => {
    clearResolveCache();
    const river = await resolveSymbolForKeyword('bank', 'local-user', {
      sentenceTokens: ['water', 'river', 'fish'],
    });
    clearResolveCache();
    const money = await resolveSymbolForKeyword('bank', 'local-user', {
      sentenceTokens: ['money', 'account', 'card'],
    });
    expect(river.symbol.id).not.toBe(money.symbol.id);
  });

  it('bank: money context resolves to money-bank symbol', async () => {
    clearResolveCache();
    const result = await resolveSymbolForKeyword('bank', 'local-user', {
      sentenceTokens: ['money', 'atm', 'cash'],
    });
    expect(result.symbol.id).toBe('mulberry_money_bank_test');
  });

  it('spring: season context vs mechanical context resolves to different symbols', async () => {
    clearResolveCache();
    const season = await resolveSymbolForKeyword('spring', 'local-user', {
      sentenceTokens: ['flower', 'warm', 'season'],
    });
    clearResolveCache();
    const mechanical = await resolveSymbolForKeyword('spring', 'local-user', {
      sentenceTokens: ['coil', 'metal', 'tension'],
    });
    expect(season.symbol.id).not.toBe(mechanical.symbol.id);
  });

  it('light: lamp context vs weight context resolves to different symbols', async () => {
    clearResolveCache();
    const lamp = await resolveSymbolForKeyword('light', 'local-user', {
      sentenceTokens: ['room', 'dark', 'lamp'],
    });
    clearResolveCache();
    const weight = await resolveSymbolForKeyword('light', 'local-user', {
      sentenceTokens: ['heavy', 'carry', 'feather'],
    });
    expect(lamp.symbol.id).not.toBe(weight.symbol.id);
  });

  it('crane: bird context vs machine context resolves to different symbols', async () => {
    clearResolveCache();
    const bird = await resolveSymbolForKeyword('crane', 'local-user', {
      sentenceTokens: ['bird', 'fly', 'animal'],
    });
    clearResolveCache();
    const machine = await resolveSymbolForKeyword('crane', 'local-user', {
      sentenceTokens: ['building', 'construction', 'tower'],
    });
    expect(bird.symbol.id).not.toBe(machine.symbol.id);
  });

  it('crane: machine context produces machine symbol', async () => {
    clearResolveCache();
    const result = await resolveSymbolForKeyword('crane', 'local-user', {
      sentenceTokens: ['building', 'lift', 'steel'],
    });
    expect(result.symbol.id).toBe('mulberry_crane_machine_test');
  });

  it('crane: bird context produces bird symbol', async () => {
    clearResolveCache();
    const result = await resolveSymbolForKeyword('crane', 'local-user', {
      sentenceTokens: ['bird', 'fly'],
    });
    expect(result.symbol.id).toBe('mulberry_crane_bird_test');
  });
});

// ── D: LRU cache ──────────────────────────────────────────────────────────────

describe('D — LRU cache', () => {
  it('second call with identical args hits cache and skips searchSymbols', async () => {
    clearResolveCache();
    mockSearchSymbols.mockResolvedValue([exactResult('help')]);

    const first = await resolveSymbolForKeyword('help', 'local-user', { locale: 'en' });
    const second = await resolveSymbolForKeyword('help', 'local-user', { locale: 'en' });

    expect(mockSearchSymbols).toHaveBeenCalledTimes(1);
    expect(first).toBe(second);
  });

  it('different sentenceTokens produce distinct cache entries', async () => {
    clearResolveCache();

    const r1 = await resolveSymbolForKeyword('bat', 'local-user', {
      sentenceTokens: ['cricket', 'ball'],
    });
    const r2 = await resolveSymbolForKeyword('bat', 'local-user', {
      sentenceTokens: ['wing', 'cave'],
    });

    expect(mockSearchSymbols).toHaveBeenCalledTimes(2);
    expect(r1.symbol.id).not.toBe(r2.symbol.id);
  });

  it('cache is re-used across multiple calls with same key', async () => {
    clearResolveCache();
    mockSearchSymbols.mockResolvedValue([exactResult('stop')]);

    await resolveSymbolForKeyword('stop');
    await resolveSymbolForKeyword('stop');
    await resolveSymbolForKeyword('stop');

    expect(mockSearchSymbols).toHaveBeenCalledTimes(1);
  });

  it('clearResolveCache forces a fresh lookup', async () => {
    clearResolveCache();
    mockSearchSymbols.mockResolvedValue([exactResult('eat')]);

    await resolveSymbolForKeyword('eat');
    clearResolveCache();
    await resolveSymbolForKeyword('eat');

    expect(mockSearchSymbols).toHaveBeenCalledTimes(2);
  });
});

// ── E: resolveSymbolsForPhrase ────────────────────────────────────────────────

describe('E — resolveSymbolsForPhrase', () => {
  it('resolves one entry per token, in order, with the right tiers', async () => {
    const phrase = await resolveSymbolsForPhrase('help me eat');

    expect(phrase.map(p => p.token)).toEqual(['help', 'me', 'eat']);
    expect(phrase.map(p => p.resolved.tier)).toEqual(['exact', 'alias', 'exact']);
    phrase.forEach(p => expect(p.resolved.symbol).toBeDefined());
  });

  it('lowercases, strips punctuation, and expands contractions before tokenising', async () => {
    // "Eat, drink!" → ['eat', 'drink']; punctuation must not become tokens.
    const punctuated = await resolveSymbolsForPhrase('Eat, drink!');
    expect(punctuated.map(p => p.token)).toEqual(['eat', 'drink']);

    // "I'm" expands to "i am" — two tokens, not one.
    const contracted = await resolveSymbolsForPhrase("I'm");
    expect(contracted.map(p => p.token)).toEqual(['i', 'am']);
  });

  it('threads sibling tokens through as sentenceTokens for disambiguation', async () => {
    // 'bat' next to 'cricket' must resolve to the cricket-bat symbol because
    // the resolver receives ['cricket'] as sentenceTokens for that token.
    const phrase = await resolveSymbolsForPhrase('cricket bat');
    const bat = phrase.find(p => p.token === 'bat');

    expect(bat).toBeDefined();
    expect(bat!.resolved.symbol.id).toBe('mulberry_cricket_bat_test');
  });

  it('resolves unknown / gibberish tokens without throwing', async () => {
    const phrase = await resolveSymbolsForPhrase('help blargorp');

    expect(phrase).toHaveLength(2);
    expect(phrase[0].resolved.tier).toBe('exact');
    expect(['category', 'unknown']).toContain(phrase[1].resolved.tier);
  });

  it('returns an empty array for an empty or whitespace-only phrase', async () => {
    await expect(resolveSymbolsForPhrase('   ')).resolves.toEqual([]);
    await expect(resolveSymbolsForPhrase('')).resolves.toEqual([]);
  });

  it('resolves duplicate tokens independently (no dedup)', async () => {
    const phrase = await resolveSymbolsForPhrase('stop stop');

    expect(phrase.map(p => p.token)).toEqual(['stop', 'stop']);
    phrase.forEach(p => expect(p.resolved.tier).toBe('exact'));
  });
});
