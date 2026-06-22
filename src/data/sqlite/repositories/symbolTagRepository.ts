import { openSymbolBrainDatabase } from '../database';

export async function findSymbolIdsByTag(normalizedTag: string): Promise<string[]> {
  const db = await openSymbolBrainDatabase();
  const rows = await db.getAllAsync<{ symbol_id: string }>(
    `SELECT DISTINCT symbol_id
       FROM symbol_tags
      WHERE normalized_tag = ?
         OR normalized_tag LIKE ?
      LIMIT 50`,
    normalizedTag,
    `%${normalizedTag}%`,
  );
  return rows.map(row => row.symbol_id);
}
