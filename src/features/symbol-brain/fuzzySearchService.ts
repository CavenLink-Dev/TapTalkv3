import Fuse from 'fuse.js';
import { getAllKeywords } from '../../data/sqlite/repositories/keywordRepository';
import { KeywordAlias } from './types';

let fusePromise: Promise<Fuse<KeywordAlias>> | null = null;

async function getFuse() {
  if (!fusePromise) {
    fusePromise = getAllKeywords().then(keywords => new Fuse(keywords, {
      keys: ['normalized_keyword', 'keyword'],
      threshold: 0.32,
      includeScore: true,
      ignoreLocation: true,
      minMatchCharLength: 2,
    }));
  }
  return fusePromise;
}

export async function findFuzzyKeywordMatches(normalizedInput: string, limit = 12) {
  const fuse = await getFuse();
  return fuse.search(normalizedInput, { limit }).map(result => ({
    keyword: result.item,
    score: 1 - (result.score ?? 1),
  }));
}

export function clearFuzzyIndexCache() {
  fusePromise = null;
}
