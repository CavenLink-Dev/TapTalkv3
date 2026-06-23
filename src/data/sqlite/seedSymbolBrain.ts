import seedBundle from '../imports/mulberry/seed.json';
import { openSymbolBrainDatabase } from './database';

type SeedBundle = typeof seedBundle;
type SeedConcept = SeedBundle['concepts'][number] & {
  description?: string;
  part_of_speech?: string;
  default_symbol_id?: string;
};

const SEED_SOURCE_RELEASE = seedBundle.source_release;
let seedPromise: Promise<void> | null = null;

async function alreadySeeded(): Promise<boolean> {
  const db = await openSymbolBrainDatabase();
  const row = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) AS count FROM symbols WHERE source = ?',
    'Mulberry Symbols',
  );
  return (row?.count ?? 0) > 0;
}

export async function seedSymbolBrainDatabase(force = false) {
  if (!force && seedPromise) return seedPromise;
  seedPromise = seedSymbolBrainDatabaseInternal(force).finally(() => {
    seedPromise = null;
  });
  return seedPromise;
}

async function seedSymbolBrainDatabaseInternal(force = false) {
  const db = await openSymbolBrainDatabase();
  if (!force && await alreadySeeded()) return;

  const seed = seedBundle as SeedBundle;
  await db.withTransactionAsync(async () => {
    if (force) {
      await db.execAsync(`
        DELETE FROM symbols;
        DELETE FROM concepts;
        DELETE FROM keywords;
        DELETE FROM symbol_tags;
        DELETE FROM licence_attribution;
      `);
    }

    for (const rawConcept of seed.concepts) {
      const concept = rawConcept as SeedConcept;
      await db.runAsync(
        `INSERT OR REPLACE INTO concepts
          (concept_id, canonical_label, concept_type, part_of_speech, category, core_or_fringe, description, default_symbol_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        concept.concept_id,
        concept.canonical_label,
        concept.concept_type,
        concept.part_of_speech ?? null,
        concept.category,
        concept.core_or_fringe,
        concept.description ?? null,
        concept.default_symbol_id ?? null,
      );
    }

    for (const symbol of seed.symbols) {
      await db.runAsync(
        `INSERT OR REPLACE INTO symbols
          (id, concept_id, display_name, file_path, file_type, category, rating, source, license, author,
           is_sensitive, age_level, locale_json, aac_priority, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        symbol.id,
        symbol.concept_id,
        symbol.display_name,
        symbol.file_path,
        symbol.file_type,
        symbol.category,
        symbol.rating ?? null,
        symbol.source,
        symbol.license,
        symbol.author,
        symbol.is_sensitive ? 1 : 0,
        symbol.age_level ?? 'all',
        JSON.stringify(symbol.locale),
        symbol.aac_priority,
        symbol.created_at,
        symbol.updated_at,
      );
    }

    for (const keyword of seed.keywords) {
      await db.runAsync(
        `INSERT OR REPLACE INTO keywords
          (id, keyword, normalized_keyword, concept_id, weight, locale, source)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        keyword.id,
        keyword.keyword,
        keyword.normalized_keyword,
        keyword.concept_id,
        keyword.weight,
        keyword.locale,
        keyword.source,
      );
    }

    for (const tag of seed.symbol_tags) {
      await db.runAsync(
        `INSERT OR REPLACE INTO symbol_tags
          (id, symbol_id, tag, normalized_tag)
         VALUES (?, ?, ?, ?)`,
        tag.id,
        tag.symbol_id,
        tag.tag,
        tag.normalized_tag,
      );
    }

    for (const attribution of seed.licence_attribution) {
      await db.runAsync(
        `INSERT OR REPLACE INTO licence_attribution
          (id, symbol_id, source, author, license, attribution_text, source_url, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        attribution.id,
        attribution.symbol_id,
        attribution.source,
        attribution.author,
        attribution.license,
        attribution.attribution_text,
        attribution.source_url,
        attribution.created_at,
      );
    }
  });
}

export function getBundledMulberryRelease() {
  return SEED_SOURCE_RELEASE;
}
