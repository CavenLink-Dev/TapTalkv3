import { openSymbolBrainDatabase } from '../database';
import { SymbolItem } from '../../../features/symbol-brain/types';

interface SymbolRow {
  id: string;
  concept_id: string;
  display_name: string;
  file_path: string;
  file_type: 'svg' | 'png';
  category: string | null;
  rating: number | null;
  source: 'Mulberry Symbols';
  license: string;
  author: string;
  is_sensitive: number;
  age_level: SymbolItem['age_level'] | null;
  locale_json: string;
  aac_priority: number;
  created_at: string;
  updated_at: string;
}

function mapSymbolRow(row: SymbolRow, tags: string[] = []): SymbolItem {
  return {
    id: row.id,
    concept_id: row.concept_id,
    display_name: row.display_name,
    file_path: row.file_path,
    file_type: row.file_type,
    category: row.category ?? '',
    tags,
    rating: row.rating ?? undefined,
    source: row.source,
    license: row.license,
    author: row.author,
    is_sensitive: row.is_sensitive === 1,
    age_level: row.age_level ?? 'all',
    locale: JSON.parse(row.locale_json || '[]') as string[],
    aac_priority: row.aac_priority,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export async function getSymbolById(id: string): Promise<SymbolItem | null> {
  const db = await openSymbolBrainDatabase();
  const row = await db.getFirstAsync<SymbolRow>('SELECT * FROM symbols WHERE id = ?', id);
  if (!row) return null;
  const tags = await getTagsForSymbol(id);
  return mapSymbolRow(row, tags);
}

export async function getSymbolsByConcept(conceptId: string): Promise<SymbolItem[]> {
  const db = await openSymbolBrainDatabase();
  const rows = await db.getAllAsync<SymbolRow>(
    'SELECT * FROM symbols WHERE concept_id = ? ORDER BY aac_priority DESC, rating DESC',
    conceptId,
  );
  return Promise.all(rows.map(async (row) => mapSymbolRow(row, await getTagsForSymbol(row.id))));
}

export async function getSymbolsByCategory(category: string): Promise<SymbolItem[]> {
  const db = await openSymbolBrainDatabase();
  const rows = await db.getAllAsync<SymbolRow>(
    'SELECT * FROM symbols WHERE category = ? ORDER BY aac_priority DESC, display_name ASC',
    category,
  );
  return Promise.all(rows.map(async (row) => mapSymbolRow(row, await getTagsForSymbol(row.id))));
}

export async function getAllSymbols(): Promise<SymbolItem[]> {
  const db = await openSymbolBrainDatabase();
  const rows = await db.getAllAsync<SymbolRow>(
    'SELECT * FROM symbols ORDER BY aac_priority DESC, display_name ASC',
  );
  return Promise.all(rows.map(async (row) => mapSymbolRow(row, await getTagsForSymbol(row.id))));
}

export async function getTagsForSymbol(symbolId: string): Promise<string[]> {
  const db = await openSymbolBrainDatabase();
  const rows = await db.getAllAsync<{ tag: string }>(
    'SELECT tag FROM symbol_tags WHERE symbol_id = ? ORDER BY tag ASC',
    symbolId,
  );
  return rows.map(row => row.tag);
}
