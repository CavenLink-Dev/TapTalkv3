import { SymbolCandidate } from './types';

export const semanticSearchService = {
  enabled: false,
  async find(_normalizedInput?: string): Promise<SymbolCandidate[]> {
    // Local embeddings will plug in here later. Keeping this explicit prevents
    // accidental network dependency for communication-critical AAC search.
    return [];
  },
};
