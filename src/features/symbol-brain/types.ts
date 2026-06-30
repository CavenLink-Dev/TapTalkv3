export type SymbolFileType = 'svg' | 'png';
export type SymbolSource = 'Mulberry Symbols';
export type AgeLevel = 'child' | 'teen' | 'adult' | 'all';
export type ConceptType =
  | 'core'
  | 'fringe'
  | 'phrase'
  | 'social'
  | 'action'
  | 'person'
  | 'place'
  | 'emotion';
export type CoreOrFringe = 'core' | 'fringe';
export type KeywordAliasSource =
  | 'mulberry'
  | 'manual'
  | 'guardian'
  | 'australian_english';
export type PreferenceSelectedBy =
  | 'guardian'
  | 'support_worker'
  | 'speech_pathologist'
  | 'user';
export type SearchConfidence = 'low' | 'medium' | 'high';

export interface SymbolItem {
  id: string;
  concept_id: string;
  display_name: string;
  file_path: string;
  file_type: SymbolFileType;
  category: string;
  tags: string[];
  rating?: number;
  source: SymbolSource;
  license: string;
  author: string;
  is_sensitive: boolean;
  age_level?: AgeLevel;
  locale: string[];
  aac_priority: number;
  created_at: string;
  updated_at: string;
}

export interface Concept {
  concept_id: string;
  canonical_label: string;
  concept_type: ConceptType;
  part_of_speech?: string;
  category: string;
  core_or_fringe: CoreOrFringe;
  description?: string;
  default_symbol_id?: string;
}

export interface KeywordAlias {
  id: string;
  keyword: string;
  normalized_keyword: string;
  concept_id: string;
  weight: number;
  locale: string;
  source: KeywordAliasSource;
}

export interface UserSymbolPreference {
  id: string;
  user_id: string;
  concept_id: string;
  preferred_symbol_id: string;
  preference_score: number;
  last_used_at: string;
  selected_by: PreferenceSelectedBy;
}

export interface SearchResult {
  symbol: SymbolItem;
  concept: Concept;
  score: number;
  match_reasons: string[];
  confidence: SearchConfidence;
}

export interface SearchContext {
  locale: string;
  age_level?: AgeLevel;
  childMode?: boolean;
  allowSensitive?: boolean;
  /**
   * Other tokens in the surrounding sentence/utterance. Used by the scorer to
   * boost candidates whose category overlaps with the inferred sentence
   * domain — disambiguates "bat" (animal vs sport), "bank" (river vs money).
   */
  sentenceTokens?: string[];
  /**
   * Optional explicit board domain (e.g. "school", "medical", "leisure").
   * When set, candidates whose category contains this string get a small
   * scoring nudge.
   */
  domain?: string;
}

export interface CandidateScoreParts {
  exactMatch: number;
  aliasMatch: number;
  fuzzyMatch: number;
  semanticSimilarity: number;
  aacPriority: number;
  userHistory: number;
  safetyAgeLocaleFit: number;
  /** 0..1 boost when the candidate's category overlaps the surrounding sentence's inferred categories. */
  contextCategoryBoost: number;
}

export interface SymbolCandidate {
  symbol: SymbolItem;
  concept: Concept;
  scoreParts: Partial<CandidateScoreParts>;
  match_reasons: string[];
}

export interface SearchHistoryRecord {
  id: string;
  user_id: string;
  raw_input: string;
  normalized_input: string;
  matched_concept_id?: string;
  selected_symbol_id?: string;
  accepted_or_overridden: 'accepted' | 'overridden' | 'dismissed';
  created_at: string;
}

export interface AttributionRecord {
  id: string;
  symbol_id: string;
  source: SymbolSource;
  author: string;
  license: string;
  attribution_text: string;
  source_url?: string;
  created_at: string;
}
