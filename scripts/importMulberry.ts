import fs from 'node:fs/promises';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import Papa from 'papaparse';

const execFileAsync = promisify(execFile);

const REPO_API = 'https://api.github.com/repos/mulberrysymbols/mulberry-symbols/releases/latest';
const ROOT = process.cwd();
const IMPORT_DIR = path.join(ROOT, 'src', 'data', 'imports', 'mulberry');
const SVG_DIR = path.join(ROOT, 'src', 'assets', 'symbols', 'mulberry', 'svg');
const TEMP_DIR = path.join(ROOT, '.tmp', 'mulberry-import');

const LICENSE = 'Creative Commons Attribution-ShareAlike 4.0';
const SOURCE = 'Mulberry Symbols';
const AUTHOR = 'Steve Lee / Mulberry Symbols';
const ATTRIBUTION =
  'Mulberry Symbols are copyright Steve Lee / Mulberry Symbols and licensed under Creative Commons Attribution-ShareAlike.';

type ReleaseAsset = {
  name: string;
  browser_download_url: string;
};

type ReleasePayload = {
  tag_name: string;
  html_url: string;
  assets: ReleaseAsset[];
};

type RawCsvRow = Record<string, string | undefined>;

type SeedSymbol = {
  id: string;
  concept_id: string;
  display_name: string;
  file_path: string;
  file_type: 'svg';
  category: string;
  tags: string[];
  rating?: number;
  source: typeof SOURCE;
  license: typeof LICENSE;
  author: typeof AUTHOR;
  is_sensitive: boolean;
  age_level: 'child' | 'teen' | 'adult' | 'all';
  locale: string[];
  aac_priority: number;
  created_at: string;
  updated_at: string;
};

type SeedConcept = {
  concept_id: string;
  canonical_label: string;
  concept_type: 'core' | 'fringe' | 'phrase' | 'social' | 'action' | 'person' | 'place' | 'emotion';
  part_of_speech?: string;
  category: string;
  core_or_fringe: 'core' | 'fringe';
  description?: string;
  default_symbol_id?: string;
};

type SeedKeyword = {
  id: string;
  keyword: string;
  normalized_keyword: string;
  concept_id: string;
  weight: number;
  locale: string;
  source: 'mulberry' | 'manual' | 'australian_english';
};

type SeedBundle = {
  generated_at: string;
  source_release: string;
  source_url: string;
  symbols: SeedSymbol[];
  concepts: SeedConcept[];
  keywords: SeedKeyword[];
  symbol_tags: { id: string; symbol_id: string; tag: string; normalized_tag: string }[];
  licence_attribution: {
    id: string;
    symbol_id: string;
    source: typeof SOURCE;
    author: typeof AUTHOR;
    license: typeof LICENSE;
    attribution_text: typeof ATTRIBUTION;
    source_url: string;
    created_at: string;
  }[];
};

const AU_ALIASES: Record<string, string[]> = {
  mother: ['mum', 'mummy'],
  diaper: ['nappy'],
  bathroom: ['toilet', 'loo', 'wee'],
  candy: ['lolly'],
  stroller: ['pram'],
  sweater: ['jumper'],
  fuel: ['petrol'],
  cookie: ['biscuit'],
  takeout: ['takeaway'],
  pharmacy: ['chemist'],
};

const MANUAL_ALIASES: Record<string, string[]> = {
  hello: ['hi', 'hey', 'greetings', 'good morning'],
  goodbye: ['bye', 'see you'],
  help: ['support', 'assist', 'need help'],
  happy: ['glad', 'pleased'],
  sad: ['unhappy', 'upset'],
  sick: ['unwell', 'ill'],
  toilet: ['bathroom', 'loo', 'wee'],
  mother: ['mum', 'mummy'],
  father: ['dad', 'daddy'],
  eat: ['hungry', 'food'],
  drink: ['thirsty'],
  yes: ['yeah', 'yep'],
  no: ['nope'],
};

const CORE_WORDS = new Set([
  'i',
  'you',
  'want',
  'go',
  'come',
  'help',
  'more',
  'stop',
  'yes',
  'no',
  'please',
  'eat',
  'drink',
  'look',
  'see',
  'do',
  'make',
  'good',
  'bad',
  'what',
  'where',
  'who',
  'why',
  'how',
  'hello',
  'mum',
  'dad',
  'toilet',
]);

function normalizeText(input: string): string {
  return input
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[,()[\]{}]/g, ' ')
    .replace(/_/g, ' ')
    .replace(/\s+to\s*$/g, '')
    .replace(/\bto\b/g, ' ')
    .replace(/[^\p{L}\p{N}\s'-]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function slug(input: string): string {
  return normalizeText(input)
    .replace(/['-]/g, '')
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_');
}

function mulberryFilenameFromLabel(label: string): string {
  return label
    .trim()
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_')
    .concat('.svg');
}

function hashString(input: string): string {
  let hash = 5381;
  for (let index = 0; index < input.length; index += 1) {
    hash = ((hash << 5) + hash) ^ input.charCodeAt(index);
  }
  return (hash >>> 0).toString(36);
}

function conceptIdFor(label: string, category: string, partOfSpeech?: string): string {
  const normalized = slug(label).toUpperCase();
  const cat = category.toLowerCase();
  const pos = partOfSpeech?.toLowerCase() ?? '';
  if (cat.includes('person') || cat.includes('people')) return `PERSON_${normalized}`;
  if (cat.includes('place')) return `PLACE_${normalized}`;
  if (cat.includes('feeling') || cat.includes('emotion')) return `EMOTION_${normalized}`;
  if (pos.includes('verb') || label.includes('_,_to')) return `ACTION_${normalized}`;
  if (['hello', 'goodbye', 'please', 'thank_you'].includes(slug(label))) {
    return `GREETING_${normalized}`;
  }
  return `CONCEPT_${normalized}`;
}

function inferConceptType(category: string, label: string, partOfSpeech?: string): SeedConcept['concept_type'] {
  const cat = category.toLowerCase();
  const pos = partOfSpeech?.toLowerCase() ?? '';
  if (cat.includes('people') || cat.includes('person') || /mother|father|mum|dad/.test(label)) return 'person';
  if (cat.includes('place')) return 'place';
  if (cat.includes('emotion') || cat.includes('feeling')) return 'emotion';
  if (pos.includes('verb') || label.includes('_,_to')) return 'action';
  if (/hello|goodbye|please|thank/.test(label)) return 'social';
  return CORE_WORDS.has(slug(label)) ? 'core' : 'fringe';
}

function csvValue(row: RawCsvRow, candidates: string[]): string {
  for (const key of candidates) {
    const hit = Object.entries(row).find(([rowKey]) => rowKey.toLowerCase().trim() === key.toLowerCase());
    const value = hit?.[1]?.trim();
    if (value) return value;
  }
  return '';
}

function splitTags(input: string): string[] {
  return input
    .split(/[|,;]/)
    .map(tag => tag.trim())
    .filter(Boolean);
}

function getAssetUrl(release: ReleasePayload, name: string): string {
  const asset = release.assets.find(candidate => candidate.name === name);
  if (!asset) throw new Error(`Release asset not found: ${name}`);
  return asset.browser_download_url;
}

async function download(url: string, destination: string) {
  const response = await fetch(url, {
    headers: { 'User-Agent': 'TapTalk-Symbol-Brain-Importer' },
  });
  if (!response.ok) throw new Error(`Download failed ${response.status}: ${url}`);
  const buffer = Buffer.from(await response.arrayBuffer());
  await fs.writeFile(destination, buffer);
}

async function copyDir(source: string, target: string) {
  await fs.rm(target, { recursive: true, force: true });
  await fs.mkdir(target, { recursive: true });
  const entries = await fs.readdir(source, { withFileTypes: true });
  for (const entry of entries) {
    const sourcePath = path.join(source, entry.name);
    const targetPath = path.join(target, entry.name);
    if (entry.isDirectory()) {
      await copyDir(sourcePath, targetPath);
    } else if (entry.isFile() && entry.name.toLowerCase().endsWith('.svg')) {
      await fs.copyFile(sourcePath, targetPath);
    }
  }
}

function makeSymbolFromRow(row: RawCsvRow, filename: string, now: string): SeedSymbol {
  const rawName = csvValue(row, ['symbol-en', 'name', 'symbol', 'symbol_name', 'word']) || filename.replace(/\.svg$/i, '');
  const category = csvValue(row, ['category-en', 'category', 'categories']) || 'Uncategorised';
  const tags = splitTags(csvValue(row, ['tags', 'tag', 'keywords']));
  const ratingRaw = csvValue(row, ['rated', 'rating', 'stars']);
  const partOfSpeech = csvValue(row, ['grammar', 'part_of_speech', 'pos']);
  const label = normalizeText(rawName.replace(/_,_to/g, ''));
  const id = `mulberry_${slug(filename.replace(/\.svg$/i, ''))}_${hashString(filename)}`;
  const concept_id = conceptIdFor(label, category, partOfSpeech);
  const isCore = CORE_WORDS.has(slug(label));

  return {
    id,
    concept_id,
    display_name: label || filename.replace(/\.svg$/i, ''),
    file_path: `src/assets/symbols/mulberry/svg/${filename}`,
    file_type: 'svg',
    category,
    tags,
    rating: ratingRaw ? Number(ratingRaw) : undefined,
    source: SOURCE,
    license: LICENSE,
    author: AUTHOR,
    is_sensitive: /sex|nude|blood|death|drug|alcohol|violence/i.test(`${rawName} ${category} ${tags.join(' ')}`),
    age_level: 'all',
    locale: ['en', 'en-AU'],
    aac_priority: isCore ? 0.95 : 0.5,
    created_at: now,
    updated_at: now,
  };
}

function makeConcept(symbol: SeedSymbol, partOfSpeech?: string): SeedConcept {
  return {
    concept_id: symbol.concept_id,
    canonical_label: symbol.display_name,
    concept_type: inferConceptType(symbol.category, symbol.display_name, partOfSpeech),
    part_of_speech: partOfSpeech || undefined,
    category: symbol.category,
    core_or_fringe: symbol.aac_priority >= 0.9 ? 'core' : 'fringe',
    default_symbol_id: symbol.id,
  };
}

function makeKeywords(symbol: SeedSymbol): SeedKeyword[] {
  const normalized = normalizeText(symbol.display_name);
  const base = new Set<string>([
    symbol.display_name,
    normalized,
    ...symbol.tags,
    symbol.category,
  ]);

  for (const [canonical, aliases] of Object.entries(AU_ALIASES)) {
    if (normalized === normalizeText(canonical)) {
      aliases.forEach(alias => base.add(alias));
    }
  }
  for (const [canonical, aliases] of Object.entries(MANUAL_ALIASES)) {
    if (normalized === normalizeText(canonical)) {
      aliases.forEach(alias => base.add(alias));
    }
  }

  return Array.from(base)
    .map(keyword => keyword.trim())
    .filter(Boolean)
    .map((keyword, index) => {
      const normal = normalizeText(keyword);
      const source: SeedKeyword['source'] =
        Object.values(AU_ALIASES).some(aliases => aliases.includes(keyword))
          ? 'australian_english'
          : Object.values(MANUAL_ALIASES).some(aliases => aliases.includes(keyword))
            ? 'manual'
            : 'mulberry';
      return {
        id: `${symbol.id}_kw_${index}_${slug(keyword)}`,
        keyword,
        normalized_keyword: normal,
        concept_id: symbol.concept_id,
        weight: normal === normalized ? 1 : source === 'australian_english' ? 0.95 : 0.85,
        locale: source === 'australian_english' ? 'en-AU' : 'en',
        source,
      };
    });
}

async function main() {
  await fs.mkdir(TEMP_DIR, { recursive: true });
  await fs.mkdir(IMPORT_DIR, { recursive: true });
  await fs.mkdir(SVG_DIR, { recursive: true });

  const release = await (await fetch(REPO_API, {
    headers: { 'User-Agent': 'TapTalk-Symbol-Brain-Importer' },
  })).json() as ReleasePayload;

  const zipPath = path.join(TEMP_DIR, 'mulberry-symbols.zip');
  const csvPath = path.join(IMPORT_DIR, 'symbol-info.csv');
  const licensePath = path.join(IMPORT_DIR, 'LICENSE.txt');
  const versionPath = path.join(IMPORT_DIR, 'VERSION.txt');

  await download(getAssetUrl(release, 'mulberry-symbols.zip'), zipPath);
  await download(getAssetUrl(release, 'symbol-info.csv'), csvPath);

  await fs.rm(path.join(TEMP_DIR, 'unzipped'), { recursive: true, force: true });
  await fs.mkdir(path.join(TEMP_DIR, 'unzipped'), { recursive: true });
  await execFileAsync('unzip', ['-q', zipPath, '-d', path.join(TEMP_DIR, 'unzipped')]);

  const extracted = path.join(TEMP_DIR, 'unzipped');
  const extractedSymbols = path.join(extracted, 'EN-symbols');
  await copyDir(extractedSymbols, SVG_DIR);

  await fs.copyFile(path.join(extracted, 'LICENSE.txt'), licensePath);
  await fs.copyFile(path.join(extracted, 'VERSION.txt'), versionPath);

  const csv = await fs.readFile(csvPath, 'utf8');
  const parsed = Papa.parse<RawCsvRow>(csv, {
    header: true,
    skipEmptyLines: true,
  });
  if (parsed.errors.length > 0) {
    throw new Error(`CSV parse errors: ${JSON.stringify(parsed.errors.slice(0, 5))}`);
  }

  const svgFiles = (await fs.readdir(SVG_DIR)).filter(file => file.toLowerCase().endsWith('.svg'));
  const rowByFilename = new Map<string, RawCsvRow>();
  for (const row of parsed.data) {
    const filename = csvValue(row, ['filename', 'file', 'svg', 'image', 'symbol_filename']);
    const name = csvValue(row, ['symbol-en', 'name', 'symbol', 'symbol_name', 'word']);
    if (filename) rowByFilename.set(filename, row);
    if (name) {
      rowByFilename.set(`${name}.svg`, row);
      rowByFilename.set(mulberryFilenameFromLabel(name), row);
    }
  }

  const now = new Date().toISOString();
  const symbols: SeedSymbol[] = [];
  const concepts = new Map<string, SeedConcept>();
  const keywords: SeedKeyword[] = [];
  const symbol_tags: SeedBundle['symbol_tags'] = [];
  const licence_attribution: SeedBundle['licence_attribution'] = [];
  const missingMetadata: string[] = [];
  const duplicateConcepts = new Map<string, number>();

  for (const file of svgFiles) {
    const row = rowByFilename.get(file) ?? rowByFilename.get(file.replace(/\.svg$/i, '')) ?? {};
    if (Object.keys(row).length === 0) missingMetadata.push(file);
    const symbol = makeSymbolFromRow(row, file, now);
    symbols.push(symbol);

    duplicateConcepts.set(symbol.concept_id, (duplicateConcepts.get(symbol.concept_id) ?? 0) + 1);
    if (!concepts.has(symbol.concept_id)) {
      concepts.set(symbol.concept_id, makeConcept(symbol, csvValue(row, ['grammar', 'part_of_speech', 'pos'])));
    }

    keywords.push(...makeKeywords(symbol));
    for (const tag of symbol.tags) {
      symbol_tags.push({
        id: `${symbol.id}_tag_${slug(tag)}`,
        symbol_id: symbol.id,
        tag,
        normalized_tag: normalizeText(tag),
      });
    }
    licence_attribution.push({
      id: `${symbol.id}_licence`,
      symbol_id: symbol.id,
      source: SOURCE,
      author: AUTHOR,
      license: LICENSE,
      attribution_text: ATTRIBUTION,
      source_url: release.html_url,
      created_at: now,
    });
  }

  const seed: SeedBundle = {
    generated_at: now,
    source_release: release.tag_name,
    source_url: release.html_url,
    symbols,
    concepts: Array.from(concepts.values()),
    keywords,
    symbol_tags,
    licence_attribution,
  };

  await fs.writeFile(path.join(IMPORT_DIR, 'seed.json'), JSON.stringify(seed, null, 2));
  await fs.writeFile(
    path.join(ROOT, 'src', 'data', 'mulberryAssetMap.generated.ts'),
    [
      '/* AUTO-GENERATED by scripts/importMulberry.ts. Do not edit by hand. */',
      '/* eslint-disable @typescript-eslint/no-var-requires */',
      'declare const require: (path: string) => number;',
      '',
      'export const MULBERRY_ASSET_MAP: Record<string, number> = {',
      ...symbols.map(symbol => {
        const filename = path.basename(symbol.file_path);
        return `  ${JSON.stringify(symbol.id)}: require(${JSON.stringify(`../assets/symbols/mulberry/svg/${filename}`)}),`;
      }),
      '};',
      '',
    ].join('\n'),
  );
  await fs.writeFile(
    path.join(IMPORT_DIR, 'import-report.json'),
    JSON.stringify({
      generatedAt: now,
      sourceRelease: release.tag_name,
      sourceUrl: release.html_url,
      symbolsImported: symbols.length,
      conceptsCreated: concepts.size,
      aliasesCreated: keywords.length,
      tagsCreated: symbol_tags.length,
      missingSvgFiles: [],
      missingMetadata: missingMetadata.slice(0, 100),
      missingMetadataCount: missingMetadata.length,
      duplicateConcepts: Array.from(duplicateConcepts.entries())
        .filter(([, count]) => count > 1)
        .slice(0, 200)
        .map(([concept_id, count]) => ({ concept_id, count })),
      sensitiveSymbolsFlagged: symbols.filter(symbol => symbol.is_sensitive).length,
      license: LICENSE,
    }, null, 2),
  );

  await fs.rm(TEMP_DIR, { recursive: true, force: true });

  return {
    release: release.tag_name,
    symbols: symbols.length,
    concepts: concepts.size,
    aliases: keywords.length,
  };
}

main()
  .then(result => {
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  })
  .catch(error => {
    process.stderr.write(`${error instanceof Error ? error.stack : String(error)}\n`);
    process.exitCode = 1;
  });
