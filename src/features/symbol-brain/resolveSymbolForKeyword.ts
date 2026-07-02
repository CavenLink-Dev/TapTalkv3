/**
 * resolveSymbolForKeyword
 *
 * Guarantees a Mulberry symbol for any input keyword. Order of attempts:
 *
 *   1. exact      — exact keyword match (high confidence)
 *   2. alias      — alias / lemma / prefix match (high confidence)
 *   3. fuzzy      — fuzzy-string match above threshold (medium)
 *   4. semantic   — semantic similarity above threshold (medium)
 *   5. category   — exemplar for the closest matching category (low)
 *   6. unknown    — the global "I don't know" fallback (low)
 *
 * The tier is returned so the UI can render a subtle indicator (dashed
 * border, "≈" prefix) for non-direct matches — keeps the experience honest
 * without making it look broken.
 *
 * Wrapped in a small in-memory LRU so the AAC board doesn't re-query SQLite
 * for the same keyword on every re-render.
 */

import {
  CATEGORY_EXEMPLARS,
  UNKNOWN_FALLBACK_SYMBOL_ID,
} from '../../data/categoryExemplars.generated';
import { MULBERRY_ASSET_MAP } from '../../data/mulberryAssetMap.generated';
import { getSymbolById } from '../../data/sqlite/repositories/symbolRepository';
import { getConceptById } from '../../data/sqlite/repositories/conceptRepository';
import { normalizeText } from './normalizeText';
import { searchSymbols } from './symbolSearchService';
import { Concept, SearchContext, SearchResult, SymbolItem } from './types';

export type ResolveTier =
  | 'exact'
  | 'alias'
  | 'fuzzy'
  | 'semantic'
  | 'category'
  | 'unknown';

export interface ResolvedSymbol {
  symbol: SymbolItem;
  concept: Concept | null;
  tier: ResolveTier;
  score: number;
  /** Original SearchResult when one was produced; null for category/unknown fallbacks. */
  searchResult: SearchResult | null;
  /** Human-readable explanation for debugging/audit. */
  reason: string;
}

/** Score floors below which we fall through to the next tier. */
const FUZZY_FLOOR = 0.45;
const SEMANTIC_FLOOR = 0.55;

// ── Tier classification ────────────────────────────────────────────────────

function tierFromMatchReasons(reasons: string[]): ResolveTier {
  // Match reasons are tagged at the source in symbolSearchService.
  // e.g. "exact keyword: hello", "alias/prefix keyword: hi", "fuzzy keyword: helo", "semantic: ..."
  if (reasons.some(r => r.startsWith('exact keyword'))) return 'exact';
  if (reasons.some(r => r.startsWith('alias/prefix keyword') || r.startsWith('lemma keyword'))) {
    return 'alias';
  }
  if (reasons.some(r => r.startsWith('fuzzy keyword'))) return 'fuzzy';
  if (reasons.some(r => r.startsWith('semantic'))) return 'semantic';
  // tag matches behave like aliases for UX purposes
  if (reasons.some(r => r.startsWith('tag match'))) return 'alias';
  return 'exact';
}

// ── Category fallback ──────────────────────────────────────────────────────

/**
 * Naive category inference from a keyword: find the category-en string whose
 * lowercased words have the largest token-overlap with the keyword. Cheap and
 * deterministic — good enough to route unknown words to a sensible bucket.
 */
function inferCategoryForKeyword(keyword: string): string | null {
  const want = new Set(normalizeText(keyword).split(/\s+/).filter(Boolean));
  if (want.size === 0) return null;

  let bestCategory: string | null = null;
  let bestOverlap = 0;
  for (const category of Object.keys(CATEGORY_EXEMPLARS)) {
    const have = category.toLowerCase().split(/\s+/);
    const overlap = have.reduce((n, word) => (want.has(word) ? n + 1 : n), 0);
    if (overlap > bestOverlap) {
      bestOverlap = overlap;
      bestCategory = category;
    }
  }
  return bestOverlap > 0 ? bestCategory : null;
}

async function categoryFallback(
  keyword: string,
): Promise<{ symbolId: string; reason: string } | null> {
  const category = inferCategoryForKeyword(keyword);
  if (!category) return null;
  const exemplar = CATEGORY_EXEMPLARS[category];
  if (!exemplar) return null;
  if (!(exemplar.symbolId in MULBERRY_ASSET_MAP)) return null;
  return {
    symbolId: exemplar.symbolId,
    reason: `category fallback: ${category}`,
  };
}

async function unknownFallback(): Promise<{ symbolId: string; reason: string }> {
  // If the build script picked an id, use it. Otherwise pick the asset map's
  // first key so something always renders.
  if (UNKNOWN_FALLBACK_SYMBOL_ID && UNKNOWN_FALLBACK_SYMBOL_ID in MULBERRY_ASSET_MAP) {
    return { symbolId: UNKNOWN_FALLBACK_SYMBOL_ID, reason: 'unknown fallback' };
  }
  const first = Object.keys(MULBERRY_ASSET_MAP)[0] ?? '';
  return { symbolId: first, reason: 'unknown fallback (stub)' };
}

// ── LRU cache ──────────────────────────────────────────────────────────────

const CACHE_LIMIT = 512;
const cache = new Map<string, ResolvedSymbol>();

function cacheKey(keyword: string, userId: string, ctx: Partial<SearchContext>): string {
  // Stable, sentence-token-aware cache key — different surrounding sentences
  // can resolve "bat" differently, so they need different cache buckets.
  const tokens = (ctx.sentenceTokens ?? []).slice().sort().join('|');
  return [
    normalizeText(keyword),
    userId,
    ctx.locale ?? '',
    ctx.age_level ?? '',
    ctx.allowSensitive ? '1' : '0',
    ctx.domain ?? '',
    tokens,
  ].join('::');
}

function lruGet(key: string): ResolvedSymbol | undefined {
  const hit = cache.get(key);
  if (hit) {
    // Re-insert to mark as most-recently-used.
    cache.delete(key);
    cache.set(key, hit);
  }
  return hit;
}

function lruSet(key: string, value: ResolvedSymbol): void {
  if (cache.has(key)) cache.delete(key);
  cache.set(key, value);
  if (cache.size > CACHE_LIMIT) {
    const oldest = cache.keys().next().value;
    if (oldest !== undefined) cache.delete(oldest);
  }
}

/** Clear the resolver cache. Exposed for tests and guardian override flows. */
export function clearResolveCache(): void {
  cache.clear();
}

// ── Public API ─────────────────────────────────────────────────────────────

export async function resolveSymbolForKeyword(
  keyword: string,
  userId = 'local-user',
  context: Partial<SearchContext> = {},
): Promise<ResolvedSymbol> {
  const key = cacheKey(keyword, userId, context);
  const cached = lruGet(key);
  if (cached) return cached;

  const results = await searchSymbols(keyword, userId, context);
  const top = results[0];

  let resolved: ResolvedSymbol;

  if (top) {
    const tier = tierFromMatchReasons(top.match_reasons);
    const passesFloor =
      tier === 'exact' ||
      tier === 'alias' ||
      (tier === 'fuzzy' && top.score >= FUZZY_FLOOR) ||
      (tier === 'semantic' && top.score >= SEMANTIC_FLOOR);

    if (passesFloor) {
      resolved = {
        symbol: top.symbol,
        concept: top.concept,
        tier,
        score: top.score,
        searchResult: top,
        reason: top.match_reasons[0] ?? tier,
      };
      lruSet(key, resolved);
      return resolved;
    }
  }

  // Tier 5 — category exemplar.
  const cat = await categoryFallback(keyword);
  if (cat) {
    const sym = await getSymbolById(cat.symbolId);
    if (sym) {
      const concept = await getConceptById(sym.concept_id).catch(() => null);
      resolved = {
        symbol: sym,
        concept: concept ?? null,
        tier: 'category',
        score: 0.3,
        searchResult: null,
        reason: cat.reason,
      };
      lruSet(key, resolved);
      return resolved;
    }
  }

  // Tier 6 — unknown.
  const unk = await unknownFallback();
  const sym = await getSymbolById(unk.symbolId);
  if (sym) {
    const concept = await getConceptById(sym.concept_id).catch(() => null);
    resolved = {
      symbol: sym,
      concept: concept ?? null,
      tier: 'unknown',
      score: 0.1,
      searchResult: null,
      reason: unk.reason,
    };
    lruSet(key, resolved);
    return resolved;
  }

  // Truly last resort — synthesise a minimal SymbolItem so callers always get
  // something to render. Should never happen if the seed bundle is populated.
  const now = new Date().toISOString();
  resolved = {
    symbol: {
      id: unk.symbolId,
      concept_id: 'CONCEPT_UNKNOWN',
      display_name: 'unknown',
      file_path: '',
      file_type: 'svg',
      category: 'Uncategorised',
      tags: [],
      source: 'Mulberry Symbols',
      license: 'CC BY-SA 4.0',
      author: 'Mulberry Symbols',
      is_sensitive: false,
      age_level: 'all',
      locale: ['en'],
      aac_priority: 0,
      created_at: now,
      updated_at: now,
    },
    concept: null,
    tier: 'unknown',
    score: 0,
    searchResult: null,
    reason: 'no symbol available',
  };
  lruSet(key, resolved);
  return resolved;
}

/** Convenience: resolve every word in a phrase to a guaranteed symbol. */
export async function resolveSymbolsForPhrase(
  phrase: string,
  userId = 'local-user',
  context: Partial<SearchContext> = {},
): Promise<{ token: string; resolved: ResolvedSymbol }[]> {
  const tokens = normalizeText(phrase).split(/\s+/).filter(Boolean);
  return Promise.all(
    tokens.map(async token => ({
      token,
      resolved: await resolveSymbolForKeyword(token, userId, {
        ...context,
        sentenceTokens: tokens.filter(t => t !== token),
      }),
    })),
  );
}
