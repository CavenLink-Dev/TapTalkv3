import { openSymbolBrainDatabase } from '../database';
import { Concept } from '../../../features/symbol-brain/types';

export async function getConceptById(conceptId: string): Promise<Concept | null> {
  const db = await openSymbolBrainDatabase();
  return db.getFirstAsync<Concept>(
    'SELECT * FROM concepts WHERE concept_id = ?',
    conceptId,
  );
}

export async function getConceptsByLabel(normalizedLabel: string): Promise<Concept[]> {
  const db = await openSymbolBrainDatabase();
  return db.getAllAsync<Concept>(
    `SELECT DISTINCT c.*
       FROM concepts c
       LEFT JOIN keywords k ON k.concept_id = c.concept_id
      WHERE lower(c.canonical_label) = ?
         OR k.normalized_keyword = ?
      ORDER BY c.core_or_fringe ASC, c.canonical_label ASC`,
    normalizedLabel,
    normalizedLabel,
  );
}

export async function getAllConcepts(): Promise<Concept[]> {
  const db = await openSymbolBrainDatabase();
  return db.getAllAsync<Concept>(
    'SELECT * FROM concepts ORDER BY core_or_fringe ASC, canonical_label ASC',
  );
}
