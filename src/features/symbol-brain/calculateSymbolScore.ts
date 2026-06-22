import {
  CandidateScoreParts,
  SearchConfidence,
  SearchContext,
  SymbolCandidate,
  UserSymbolPreference,
} from './types';

const WEIGHTS: CandidateScoreParts = {
  exactMatch: 0.35,
  aliasMatch: 0.20,
  fuzzyMatch: 0.15,
  semanticSimilarity: 0.15,
  aacPriority: 0.05,
  userHistory: 0.05,
  safetyAgeLocaleFit: 0.05,
};

function clamp01(value: number) {
  return Math.max(0, Math.min(1, value));
}

export function confidenceForScore(score: number): SearchConfidence {
  if (score >= 0.82) return 'high';
  if (score >= 0.55) return 'medium';
  return 'low';
}

export function scoreSafetyAgeLocaleFit(candidate: SymbolCandidate, context: SearchContext): number {
  if (candidate.symbol.is_sensitive && !context.allowSensitive) return 0;
  if (
    context.age_level &&
    candidate.symbol.age_level &&
    candidate.symbol.age_level !== 'all' &&
    candidate.symbol.age_level !== context.age_level
  ) {
    return 0.4;
  }
  if (candidate.symbol.locale.length === 0) return 1;
  if (candidate.symbol.locale.includes(context.locale)) return 1;
  if (context.locale.startsWith('en') && candidate.symbol.locale.some(locale => locale.startsWith('en'))) {
    return 0.9;
  }
  return 0.6;
}

export function scoreUserHistory(
  candidate: SymbolCandidate,
  preferences: UserSymbolPreference[],
): number {
  const preference = preferences.find(pref =>
    pref.concept_id === candidate.concept.concept_id &&
    pref.preferred_symbol_id === candidate.symbol.id
  );
  return preference ? clamp01(preference.preference_score) : 0;
}

export function calculateSymbolScore(
  candidate: SymbolCandidate,
  preferences: UserSymbolPreference[],
  context: SearchContext,
) {
  const parts: CandidateScoreParts = {
    exactMatch: candidate.scoreParts.exactMatch ?? 0,
    aliasMatch: candidate.scoreParts.aliasMatch ?? 0,
    fuzzyMatch: candidate.scoreParts.fuzzyMatch ?? 0,
    semanticSimilarity: candidate.scoreParts.semanticSimilarity ?? 0,
    aacPriority: candidate.symbol.aac_priority,
    userHistory: scoreUserHistory(candidate, preferences),
    safetyAgeLocaleFit: scoreSafetyAgeLocaleFit(candidate, context),
  };

  return clamp01(
    parts.exactMatch * WEIGHTS.exactMatch +
    parts.aliasMatch * WEIGHTS.aliasMatch +
    parts.fuzzyMatch * WEIGHTS.fuzzyMatch +
    parts.semanticSimilarity * WEIGHTS.semanticSimilarity +
    parts.aacPriority * WEIGHTS.aacPriority +
    parts.userHistory * WEIGHTS.userHistory +
    parts.safetyAgeLocaleFit * WEIGHTS.safetyAgeLocaleFit,
  );
}
