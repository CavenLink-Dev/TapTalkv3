import { openSymbolBrainDatabase } from '../database';
import { AttributionRecord } from '../../../features/symbol-brain/types';

export async function getAttributionForSymbol(symbolId: string): Promise<AttributionRecord | null> {
  const db = await openSymbolBrainDatabase();
  return db.getFirstAsync<AttributionRecord>(
    'SELECT * FROM licence_attribution WHERE symbol_id = ?',
    symbolId,
  );
}

export async function getAllAttributions(): Promise<AttributionRecord[]> {
  const db = await openSymbolBrainDatabase();
  return db.getAllAsync<AttributionRecord>(
    'SELECT * FROM licence_attribution ORDER BY source ASC, symbol_id ASC',
  );
}

export async function getAttributionSummary(): Promise<AttributionRecord[]> {
  const db = await openSymbolBrainDatabase();
  return db.getAllAsync<AttributionRecord>(
    `SELECT MIN(id) AS id,
            MIN(symbol_id) AS symbol_id,
            source,
            author,
            license,
            attribution_text,
            source_url,
            MIN(created_at) AS created_at
       FROM licence_attribution
      GROUP BY source, author, license, attribution_text, source_url
      ORDER BY source ASC`,
  );
}
