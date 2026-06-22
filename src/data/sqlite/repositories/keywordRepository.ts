import { openSymbolBrainDatabase } from '../database';
import { KeywordAlias } from '../../../features/symbol-brain/types';

export async function findExactKeywords(normalizedKeyword: string): Promise<KeywordAlias[]> {
  const db = await openSymbolBrainDatabase();
  return db.getAllAsync<KeywordAlias>(
    `SELECT * FROM keywords
      WHERE normalized_keyword = ?
      ORDER BY weight DESC`,
    normalizedKeyword,
  );
}

export async function findPrefixKeywords(normalizedKeyword: string): Promise<KeywordAlias[]> {
  const db = await openSymbolBrainDatabase();
  return db.getAllAsync<KeywordAlias>(
    `SELECT * FROM keywords
      WHERE normalized_keyword LIKE ?
      ORDER BY weight DESC
      LIMIT 50`,
    `${normalizedKeyword}%`,
  );
}

export async function getAllKeywords(): Promise<KeywordAlias[]> {
  const db = await openSymbolBrainDatabase();
  return db.getAllAsync<KeywordAlias>(
    'SELECT * FROM keywords ORDER BY weight DESC, normalized_keyword ASC',
  );
}
