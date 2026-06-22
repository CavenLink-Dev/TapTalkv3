import { searchSymbols } from '../symbol-brain/symbolSearchService';
import { SearchContext, SearchResult } from '../symbol-brain/types';
import { keepAACImportantWords } from './keepAACImportantWords';

export interface SymbolisedToken {
  token: string;
  best: SearchResult | null;
  alternatives: SearchResult[];
}

export async function symboliseSentence(
  sentence: string,
  userId = 'local-user',
  context: Partial<SearchContext> = {},
): Promise<SymbolisedToken[]> {
  const tokens = keepAACImportantWords(sentence);
  const rows = await Promise.all(tokens.map(async (token) => {
    const matches = await searchSymbols(token, userId, context);
    return {
      token,
      best: matches[0] ?? null,
      alternatives: matches.slice(1, 5),
    };
  }));
  return rows;
}
