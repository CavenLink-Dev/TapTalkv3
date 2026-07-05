/**
 * extractSymbolCategories.ts
 *
 * Reads seed.json and groups every Mulberry symbol by its category value.
 * Outputs to_do/mulberry_categories.json — a verified reference for building symbolPacks.ts.
 *
 * Run with:
 *   npx ts-node --skip-project scripts/extractSymbolCategories.ts
 */

import * as fs from 'fs';
import * as path from 'path';

const ROOT = process.cwd();
const SEED_PATH = path.join(ROOT, 'src/data/imports/mulberry/seed.json');
const OUT_PATH = path.join(ROOT, 'to_do/mulberry_categories.json');

type SeedSymbol = {
  id: string;
  display_name: string;
  category: string;
};

type SeedFile = {
  symbols: SeedSymbol[];
};

const seed: SeedFile = JSON.parse(fs.readFileSync(SEED_PATH, 'utf-8'));

const grouped: Record<string, { id: string; name: string }[]> = {};

for (const symbol of seed.symbols) {
  const cat = symbol.category || 'Uncategorised';
  if (!grouped[cat]) grouped[cat] = [];
  grouped[cat].push({ id: symbol.id, name: symbol.display_name });
}

// Sort categories alphabetically, symbols within each category alphabetically
const sorted: Record<string, { id: string; name: string }[]> = {};
for (const cat of Object.keys(grouped).sort()) {
  sorted[cat] = grouped[cat].sort((a, b) => a.name.localeCompare(b.name));
}

fs.writeFileSync(OUT_PATH, JSON.stringify(sorted, null, 2), 'utf-8');

// Print summary to console
console.log('\n=== Mulberry Symbol Categories ===\n');
for (const [cat, symbols] of Object.entries(sorted)) {
  console.log(`  ${cat.padEnd(45)} ${symbols.length} symbols`);
}
console.log(`\nTotal categories: ${Object.keys(sorted).length}`);
console.log(`Total symbols:    ${seed.symbols.length}`);
console.log(`\nFull list written to: ${OUT_PATH}\n`);
