/**
 * buildCategoryExemplars.ts
 *
 * For every Mulberry category, pick ONE canonical "exemplar" symbol to use as
 * the graceful fallback when no keyword/alias/fuzzy/semantic candidate clears
 * the confidence threshold. Selection order:
 *
 *   1. Curated override (`categoryExemplars.curated.json`) — author-picked.
 *   2. Highest aac_priority symbol in the category, tie-break shortest name.
 *   3. First symbol in the category alphabetically (deterministic fallback).
 *
 * Also picks a global "unknown" symbol for words we can't even bucket into a
 * category — last-resort so the AAC board never renders a blank tile.
 *
 *   Run:  npm run build:exemplars
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import Papa from 'papaparse';

const ROOT = process.cwd();
const CSV_PATH = path.join(ROOT, 'src', 'data', 'imports', 'mulberry', 'symbol-info.csv');
const SEED_PATH = path.join(ROOT, 'src', 'data', 'imports', 'mulberry', 'seed.json');
const CURATED_PATH = path.join(
  ROOT,
  'src',
  'data',
  'imports',
  'mulberry',
  'categoryExemplars.curated.json',
);
const OUT_PATH = path.join(ROOT, 'src', 'data', 'categoryExemplars.generated.ts');

const UNKNOWN_DISPLAY_NAME_CANDIDATES = ['what', 'unknown', 'help', 'thinking', 'question'];

type CsvRow = Record<string, string | undefined>;

type SeedSymbol = {
  id: string;
  display_name: string;
  category: string;
  aac_priority: number;
  is_sensitive: boolean;
};

type SeedBundle = { symbols: SeedSymbol[] };

type CuratedFile = {
  exemplars: Record<string, string>;
};

function readCsvCategoryMap(csv: string): Map<string, string> {
  // category-id → category-en (first occurrence wins; the CSV is consistent).
  const parsed = Papa.parse<CsvRow>(csv, { header: true, skipEmptyLines: true });
  const out = new Map<string, string>();
  for (const row of parsed.data) {
    const id = row['category-id']?.trim();
    const en = row['category-en']?.trim();
    if (id && en && !out.has(id)) out.set(id, en);
  }
  return out;
}

function pickExemplar(
  candidates: SeedSymbol[],
  curatedDisplayName: string | undefined,
): SeedSymbol | null {
  if (candidates.length === 0) return null;

  if (curatedDisplayName) {
    const want = curatedDisplayName.toLowerCase();
    const curated = candidates.find(s => s.display_name.toLowerCase() === want);
    if (curated) return curated;
  }

  // Highest aac_priority, then shortest display_name, then alphabetical id.
  const safe = candidates.filter(s => !s.is_sensitive);
  const pool = safe.length > 0 ? safe : candidates;
  return [...pool].sort((a, b) => {
    if (b.aac_priority !== a.aac_priority) return b.aac_priority - a.aac_priority;
    if (a.display_name.length !== b.display_name.length) {
      return a.display_name.length - b.display_name.length;
    }
    return a.id.localeCompare(b.id);
  })[0];
}

async function main() {
  const [csv, seedRaw, curatedRaw] = await Promise.all([
    fs.readFile(CSV_PATH, 'utf8'),
    fs.readFile(SEED_PATH, 'utf8'),
    fs.readFile(CURATED_PATH, 'utf8'),
  ]);

  const seed = JSON.parse(seedRaw) as SeedBundle;
  const curated = JSON.parse(curatedRaw) as CuratedFile;
  const categoryMap = readCsvCategoryMap(csv);

  // Group symbols by their category-en string.
  const byCategory = new Map<string, SeedSymbol[]>();
  for (const symbol of seed.symbols) {
    const list = byCategory.get(symbol.category) ?? [];
    list.push(symbol);
    byCategory.set(symbol.category, list);
  }

  const exemplars: Record<string, { symbolId: string; displayName: string; selectedBy: 'curated' | 'auto' }> = {};
  const missingCategories: string[] = [];

  // Use the union of categories present in CSV and in seed (defensive: a few
  // imports historically have CSV rows with no matching SVG).
  const allCategories = new Set<string>([
    ...categoryMap.values(),
    ...byCategory.keys(),
  ]);

  for (const category of allCategories) {
    const candidates = byCategory.get(category) ?? [];
    const curatedName = curated.exemplars[category];
    const pick = pickExemplar(candidates, curatedName);
    if (!pick) {
      missingCategories.push(category);
      continue;
    }
    const selectedBy: 'curated' | 'auto' =
      curatedName && pick.display_name.toLowerCase() === curatedName.toLowerCase()
        ? 'curated'
        : 'auto';
    exemplars[category] = {
      symbolId: pick.id,
      displayName: pick.display_name,
      selectedBy,
    };
  }

  // Pick the global "unknown" symbol.
  let unknown: SeedSymbol | null = null;
  for (const want of UNKNOWN_DISPLAY_NAME_CANDIDATES) {
    unknown = seed.symbols.find(s => s.display_name.toLowerCase() === want) ?? null;
    if (unknown) break;
  }
  if (!unknown) {
    // Last resort — the very first non-sensitive symbol.
    unknown = seed.symbols.find(s => !s.is_sensitive) ?? seed.symbols[0] ?? null;
  }
  if (!unknown) throw new Error('No symbols in seed bundle — cannot select unknown fallback.');

  const out = [
    '/* AUTO-GENERATED by scripts/buildCategoryExemplars.ts. Do not edit by hand. */',
    '/* Each category maps to one Mulberry symbol used when no keyword/alias/fuzzy/semantic match clears the threshold. */',
    '',
    'export interface CategoryExemplar {',
    '  symbolId: string;',
    '  displayName: string;',
    '  selectedBy: \'curated\' | \'auto\';',
    '}',
    '',
    'export const CATEGORY_EXEMPLARS: Record<string, CategoryExemplar> = {',
    ...Object.entries(exemplars)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([category, ex]) =>
        `  ${JSON.stringify(category)}: ${JSON.stringify(ex)},`,
      ),
    '};',
    '',
    'export const UNKNOWN_FALLBACK_SYMBOL_ID = ' + JSON.stringify(unknown.id) + ';',
    'export const UNKNOWN_FALLBACK_DISPLAY_NAME = ' + JSON.stringify(unknown.display_name) + ';',
    '',
  ].join('\n');

  await fs.writeFile(OUT_PATH, out, 'utf8');

  process.stdout.write(
    JSON.stringify(
      {
        categoriesCovered: Object.keys(exemplars).length,
        curatedCount: Object.values(exemplars).filter(e => e.selectedBy === 'curated').length,
        autoCount: Object.values(exemplars).filter(e => e.selectedBy === 'auto').length,
        missingCategories,
        unknownFallbackSymbolId: unknown.id,
        unknownFallbackDisplayName: unknown.display_name,
        wroteTo: path.relative(ROOT, OUT_PATH),
      },
      null,
      2,
    ) + '\n',
  );
}

main().catch(err => {
  process.stderr.write(`${err instanceof Error ? err.stack : String(err)}\n`);
  process.exitCode = 1;
});
