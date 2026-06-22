import { getConceptById } from '../../data/sqlite/repositories/conceptRepository';
import {
  findExactKeywords,
  findPrefixKeywords,
} from '../../data/sqlite/repositories/keywordRepository';
import {
  getSymbolById,
  getSymbolsByConcept,
} from '../../data/sqlite/repositories/symbolRepository';
import { findSymbolIdsByTag } from '../../data/sqlite/repositories/symbolTagRepository';
import { seedSymbolBrainDatabase } from '../../data/sqlite/seedSymbolBrain';
import {
  calculateSymbolScore,
  confidenceForScore,
  scoreSafetyAgeLocaleFit,
} from './calculateSymbolScore';
import { findFuzzyKeywordMatches } from './fuzzySearchService';
import { lemmatizePhrase } from './lemmatize';
import { normalizeText } from './normalizeText';
import { semanticSearchService } from './semanticSearchService';
import {
  Concept,
  KeywordAlias,
  SearchContext,
  SearchResult,
  SymbolCandidate,
  SymbolItem,
} from './types';
import { userPreferenceService } from './userPreferenceService';

const DEFAULT_CONTEXT: SearchContext = {
  locale: 'en-AU',
  age_level: 'all',
  allowSensitive: false,
};

function candidateKey(symbolId: string, conceptId: string) {
  return `${symbolId}:${conceptId}`;
}

async function candidatesFromKeyword(
  keyword: KeywordAlias,
  reason: string,
  scoreParts: SymbolCandidate['scoreParts'],
): Promise<SymbolCandidate[]> {
  const concept = await getConceptById(keyword.concept_id);
  if (!concept) return [];
  const symbols = await getSymbolsByConcept(keyword.concept_id);
  return symbols.map(symbol => ({
    symbol,
    concept,
    scoreParts,
    match_reasons: [reason],
  }));
}

async function candidatesFromSymbol(
  symbol: SymbolItem,
  reason: string,
  scoreParts: SymbolCandidate['scoreParts'],
): Promise<SymbolCandidate[]> {
  const concept = await getConceptById(symbol.concept_id);
  if (!concept) return [];
  return [{
    symbol,
    concept,
    scoreParts,
    match_reasons: [reason],
  }];
}

function mergeCandidates(candidates: SymbolCandidate[]): SymbolCandidate[] {
  const merged = new Map<string, SymbolCandidate>();
  for (const candidate of candidates) {
    const key = candidateKey(candidate.symbol.id, candidate.concept.concept_id);
    const existing = merged.get(key);
    if (!existing) {
      merged.set(key, candidate);
      continue;
    }
    existing.match_reasons = Array.from(new Set([
      ...existing.match_reasons,
      ...candidate.match_reasons,
    ]));
    existing.scoreParts = {
      exactMatch: Math.max(existing.scoreParts.exactMatch ?? 0, candidate.scoreParts.exactMatch ?? 0),
      aliasMatch: Math.max(existing.scoreParts.aliasMatch ?? 0, candidate.scoreParts.aliasMatch ?? 0),
      fuzzyMatch: Math.max(existing.scoreParts.fuzzyMatch ?? 0, candidate.scoreParts.fuzzyMatch ?? 0),
      semanticSimilarity: Math.max(
        existing.scoreParts.semanticSimilarity ?? 0,
        candidate.scoreParts.semanticSimilarity ?? 0,
      ),
    };
  }
  return Array.from(merged.values());
}

function passesSafetyFilters(candidate: SymbolCandidate, context: SearchContext) {
  return scoreSafetyAgeLocaleFit(candidate, context) > 0;
}

async function expandKeywordCandidates(normalized: string) {
  const exact = await findExactKeywords(normalized);
  const alias = await findPrefixKeywords(normalized);
  const lemma = lemmatizePhrase(normalized);
  const lemmaMatches = lemma === normalized ? [] : await findExactKeywords(lemma);

  const exactCandidates = (await Promise.all(exact.map(keyword =>
    candidatesFromKeyword(keyword, `exact keyword: ${keyword.keyword}`, {
      exactMatch: 1,
      aliasMatch: keyword.source === 'mulberry' ? 0.8 : 1,
    })
  ))).flat();

  const aliasCandidates = (await Promise.all(alias.map(keyword =>
    candidatesFromKeyword(keyword, `alias/prefix keyword: ${keyword.keyword}`, {
      aliasMatch: keyword.weight,
    })
  ))).flat();

  const lemmaCandidates = (await Promise.all(lemmaMatches.map(keyword =>
    candidatesFromKeyword(keyword, `lemma keyword: ${keyword.keyword}`, {
      aliasMatch: 0.75,
    })
  ))).flat();

  return [...exactCandidates, ...aliasCandidates, ...lemmaCandidates];
}

async function expandFuzzyCandidates(normalized: string) {
  const fuzzy = await findFuzzyKeywordMatches(normalized);
  return (await Promise.all(fuzzy.map(result =>
    candidatesFromKeyword(result.keyword, `fuzzy keyword: ${result.keyword.keyword}`, {
      fuzzyMatch: result.score,
    })
  ))).flat();
}

async function expandTagCandidates(normalized: string) {
  const symbolIds = await findSymbolIdsByTag(normalized);
  return (await Promise.all(symbolIds.map(async (symbolId) => {
    const symbol = await getSymbolById(symbolId);
    if (!symbol) return [];
    return candidatesFromSymbol(symbol, `tag match: ${normalized}`, {
      aliasMatch: 0.55,
    });
  }))).flat();
}

export async function searchSymbols(
  input: string,
  userId = 'local-user',
  context: Partial<SearchContext> = {},
): Promise<SearchResult[]> {
  await seedSymbolBrainDatabase();
  const mergedContext: SearchContext = { ...DEFAULT_CONTEXT, ...context };
  const normalized = normalizeText(input, { mapAliases: true });
  if (!normalized) return [];

  const [
    keywordCandidates,
    fuzzyCandidates,
    tagCandidates,
    semanticCandidates,
    preferences,
  ] = await Promise.all([
    expandKeywordCandidates(normalized),
    expandFuzzyCandidates(normalized),
    expandTagCandidates(normalized),
    semanticSearchService.find(normalized),
    userPreferenceService.getForUser(userId),
  ]);

  return mergeCandidates([
    ...keywordCandidates,
    ...fuzzyCandidates,
    ...tagCandidates,
    ...semanticCandidates,
  ])
    .filter(candidate => passesSafetyFilters(candidate, mergedContext))
    .map(candidate => {
      const score = calculateSymbolScore(candidate, preferences, mergedContext);
      return {
        symbol: candidate.symbol,
        concept: candidate.concept as Concept,
        score,
        match_reasons: candidate.match_reasons,
        confidence: confidenceForScore(score),
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);
}

export async function getBestSymbolForInput(
  input: string,
  userId = 'local-user',
  context: Partial<SearchContext> = {},
) {
  const results = await searchSymbols(input, userId, context);
  return results[0] ?? null;
}
