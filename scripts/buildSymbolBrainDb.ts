/**
 * Build a pre-populated SQLite database from mulberry seed.json.
 * Run: npm run build:symbol-db
 *
 * Output: assets/databases/taptalk_symbol_brain.db
 */

import fs from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';
import seedBundle from '../src/data/imports/mulberry/seed.json';
import { SYMBOL_BRAIN_MIGRATIONS } from '../src/data/sqlite/migrations';

const ROOT = path.resolve(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'assets', 'databases');
const OUT_FILE = path.join(OUT_DIR, 'taptalk_symbol_brain.db');

type SeedConcept = (typeof seedBundle.concepts)[number] & {
  description?: string;
  part_of_speech?: string;
  default_symbol_id?: string;
};

function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  if (fs.existsSync(OUT_FILE)) fs.unlinkSync(OUT_FILE);

  const db = new Database(OUT_FILE);
  db.pragma('journal_mode = WAL');

  for (const migration of SYMBOL_BRAIN_MIGRATIONS) {
    if (migration) db.exec(migration);
  }
  db.pragma('user_version = 1');

  const insertConcept = db.prepare(`
    INSERT OR REPLACE INTO concepts
      (concept_id, canonical_label, concept_type, part_of_speech, category, core_or_fringe, description, default_symbol_id)
    VALUES (@concept_id, @canonical_label, @concept_type, @part_of_speech, @category, @core_or_fringe, @description, @default_symbol_id)
  `);

  const insertSymbol = db.prepare(`
    INSERT OR REPLACE INTO symbols
      (id, concept_id, display_name, file_path, file_type, category, rating, source, license, author,
       is_sensitive, age_level, locale_json, aac_priority, created_at, updated_at)
    VALUES (@id, @concept_id, @display_name, @file_path, @file_type, @category, @rating, @source, @license, @author,
            @is_sensitive, @age_level, @locale_json, @aac_priority, @created_at, @updated_at)
  `);

  const insertKeyword = db.prepare(`
    INSERT OR REPLACE INTO keywords
      (id, keyword, normalized_keyword, concept_id, weight, locale, source)
    VALUES (@id, @keyword, @normalized_keyword, @concept_id, @weight, @locale, @source)
  `);

  const insertTag = db.prepare(`
    INSERT OR REPLACE INTO symbol_tags
      (id, symbol_id, tag, normalized_tag)
    VALUES (@id, @symbol_id, @tag, @normalized_tag)
  `);

  const insertAttribution = db.prepare(`
    INSERT OR REPLACE INTO licence_attribution
      (id, symbol_id, source, author, license, attribution_text, source_url, created_at)
    VALUES (@id, @symbol_id, @source, @author, @license, @attribution_text, @source_url, @created_at)
  `);

  const tx = db.transaction(() => {
    for (const rawConcept of seedBundle.concepts) {
      const concept = rawConcept as SeedConcept;
      insertConcept.run({
        concept_id: concept.concept_id,
        canonical_label: concept.canonical_label,
        concept_type: concept.concept_type,
        part_of_speech: concept.part_of_speech ?? null,
        category: concept.category,
        core_or_fringe: concept.core_or_fringe,
        description: concept.description ?? null,
        default_symbol_id: concept.default_symbol_id ?? null,
      });
    }

    for (const symbol of seedBundle.symbols) {
      insertSymbol.run({
        id: symbol.id,
        concept_id: symbol.concept_id,
        display_name: symbol.display_name,
        file_path: symbol.file_path,
        file_type: symbol.file_type,
        category: symbol.category,
        rating: symbol.rating ?? null,
        source: symbol.source,
        license: symbol.license,
        author: symbol.author,
        is_sensitive: symbol.is_sensitive ? 1 : 0,
        age_level: symbol.age_level ?? 'all',
        locale_json: JSON.stringify(symbol.locale),
        aac_priority: symbol.aac_priority,
        created_at: symbol.created_at,
        updated_at: symbol.updated_at,
      });
    }

    for (const keyword of seedBundle.keywords) {
      insertKeyword.run(keyword);
    }

    for (const tag of seedBundle.symbol_tags) {
      insertTag.run(tag);
    }

    for (const attribution of seedBundle.licence_attribution) {
      insertAttribution.run(attribution);
    }
  });

  tx();
  db.close();

  const stats = fs.statSync(OUT_FILE);
  console.log(`Built ${OUT_FILE} (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);
}

main();
