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
    // Pass every OTHER token in the sentence as context so the scorer can
    // boost candidates whose category overlaps the inferred sentence domain.
    // This is what makes ambiguous words ("bat" — animal vs sport,
    // "bank" — river vs money) resolve sensibly.
    const sentenceTokens = tokens.filter(t => t !== token);
    const tokenContext: Partial<SearchContext> = {
      ...context,
      sentenceTokens: [...(context.sentenceTokens ?? []), ...sentenceTokens],
    };
    const matches = await searchSymbols(token, userId, tokenContext);
    return {
      token,
      best: matches[0] ?? null,
      alternatives: matches.slice(1, 5),
    };
  }));
  return rows;
}
