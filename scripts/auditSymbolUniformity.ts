/**
 * auditSymbolUniformity.ts
 *
 * Measures how uniformly the normalised Mulberry SVGs fill their frame.
 * For each sampled SVG we compute the ratio of (glyph bbox area) / (viewBox
 * area). Post-normalisation, all glyphs should sit in a square viewBox with
 * uniform inner padding (PADDING_FRACTION = 0.08), so the expected occupancy
 * ratio is roughly the same number for every symbol.
 *
 *   Pass criteria:
 *     mean occupancy ≥ 0.70
 *     std dev        ≤ 0.06
 *     no symbol has occupancy < 0.55 (would look small/lost on the board)
 *     no symbol has occupancy > 0.95 (would touch the frame edges)
 *
 *   Run:  npm run audit:uniformity
 *         npm run audit:uniformity -- --sample 100   # default 200
 *
 * Uses the same bbox backends as scripts/normaliseMulberrySvg.ts.
 */

import fs from 'node:fs/promises';
import path from 'node:path';

const ROOT = process.cwd();
const NORMALISED_DIR = path.join(
  ROOT,
  'src',
  'assets',
  'symbols',
  'mulberry',
  'svg-normalised',
);
const RAW_DIR = path.join(ROOT, 'src', 'assets', 'symbols', 'mulberry', 'svg');
const REPORT_PATH = path.join(ROOT, 'src', 'data', 'imports', 'mulberry', 'uniformity-report.json');

type Bbox = { x: number; y: number; width: number; height: number };

function arg(name: string, fallback: number): number {
  const idx = process.argv.indexOf(name);
  if (idx === -1) return fallback;
  const n = Number(process.argv[idx + 1]);
  return Number.isFinite(n) ? n : fallback;
}

function parseViewBox(svg: string): Bbox | null {
  const m = svg.match(/viewBox\s*=\s*["']([^"']+)["']/);
  if (!m) return null;
  const parts = m[1].split(/[\s,]+/).map(Number);
  if (parts.length !== 4 || parts.some(Number.isNaN)) return null;
  return { x: parts[0], y: parts[1], width: parts[2], height: parts[3] };
}

async function tryLoadPuppeteer() {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('puppeteer');
  } catch {
    return null;
  }
}

async function bboxesFromPuppeteer(
  dir: string,
  files: string[],
): Promise<Map<string, Bbox | null>> {
  const puppeteer = await tryLoadPuppeteer();
  if (!puppeteer) throw new Error('puppeteer-not-installed');

  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setContent('<!DOCTYPE html><html><body></body></html>');
  const out = new Map<string, Bbox | null>();

  for (const file of files) {
    const raw = await fs.readFile(path.join(dir, file), 'utf8');
    try {
      const bbox = await page.evaluate((svgMarkup: string) => {
        document.body.innerHTML = svgMarkup;
        const svg = document.body.querySelector('svg') as SVGSVGElement | null;
        if (!svg) return null;
        const b = svg.getBBox();
        return { x: b.x, y: b.y, width: b.width, height: b.height };
      }, raw);
      out.set(file, bbox);
    } catch {
      out.set(file, null);
    }
  }

  await browser.close();
  return out;
}

// Built-in bbox: same pure-JS extractor used by the normaliser. Lets the audit
// run without any optional install. Slightly less accurate than rendered
// getBBox but consistent with what the normaliser saw — so a healthy uniformity
// score here is still a meaningful self-consistency check.
function parseAttrs(text: string): Record<string, string> {
  const attrs: Record<string, string> = {};
  const re = /([a-zA-Z_:][-a-zA-Z0-9_:.]*)\s*=\s*"([^"]*)"|([a-zA-Z_:][-a-zA-Z0-9_:.]*)\s*=\s*'([^']*)'/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    const key = m[1] ?? m[3];
    const val = m[2] ?? m[4];
    attrs[key] = val;
  }
  return attrs;
}

function bboxBuiltin(svg: string): Bbox | null {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  const push = (x: number, y: number) => {
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  };

  // path
  const pathRe = /<\s*path\b([^>]*?)\/?>/g;
  let m: RegExpExecArray | null;
  while ((m = pathRe.exec(svg)) !== null) {
    const attrs = parseAttrs(m[1] ?? '');
    if (!attrs.d) continue;
    const tokens = attrs.d.match(/[MmLlHhVvCcSsQqTtAaZz]|-?\d*\.?\d+(?:[eE][-+]?\d+)?/g);
    if (!tokens) continue;
    let cmd = '';
    let cx = 0, cy = 0, sx = 0, sy = 0;
    let i = 0;
    while (i < tokens.length) {
      const tok = tokens[i];
      if (/[A-Za-z]/.test(tok)) { cmd = tok; i += 1; continue; }
      const n = (k: number) => parseFloat(tokens[i + k]);
      switch (cmd) {
        case 'M': cx = n(0); cy = n(1); sx = cx; sy = cy; push(cx, cy); cmd = 'L'; i += 2; break;
        case 'm': cx += n(0); cy += n(1); sx = cx; sy = cy; push(cx, cy); cmd = 'l'; i += 2; break;
        case 'L': case 'T': cx = n(0); cy = n(1); push(cx, cy); i += 2; break;
        case 'l': case 't': cx += n(0); cy += n(1); push(cx, cy); i += 2; break;
        case 'H': cx = n(0); push(cx, cy); i += 1; break;
        case 'h': cx += n(0); push(cx, cy); i += 1; break;
        case 'V': cy = n(0); push(cx, cy); i += 1; break;
        case 'v': cy += n(0); push(cx, cy); i += 1; break;
        case 'C': push(n(0), n(1)); push(n(2), n(3)); push(n(4), n(5)); cx = n(4); cy = n(5); i += 6; break;
        case 'c':
          push(cx + n(0), cy + n(1));
          push(cx + n(2), cy + n(3));
          push(cx + n(4), cy + n(5));
          cx += n(4); cy += n(5); i += 6; break;
        case 'S': case 'Q': push(n(0), n(1)); push(n(2), n(3)); cx = n(2); cy = n(3); i += 4; break;
        case 's': case 'q':
          push(cx + n(0), cy + n(1));
          push(cx + n(2), cy + n(3));
          cx += n(2); cy += n(3); i += 4; break;
        case 'A': push(n(5), n(6)); cx = n(5); cy = n(6); i += 7; break;
        case 'a': push(cx + n(5), cy + n(6)); cx += n(5); cy += n(6); i += 7; break;
        case 'Z': case 'z': cx = sx; cy = sy; i += 1; break;
        default: i += 1;
      }
    }
  }

  const primRe = /<\s*(rect|circle|ellipse|line|polyline|polygon)\b([^>]*?)\/?>/g;
  while ((m = primRe.exec(svg)) !== null) {
    const tag = m[1];
    const attrs = parseAttrs(m[2] ?? '');
    if (tag === 'rect') {
      const x = +(attrs.x ?? 0), y = +(attrs.y ?? 0);
      const w = +(attrs.width ?? 0), h = +(attrs.height ?? 0);
      push(x, y); push(x + w, y + h);
    } else if (tag === 'circle') {
      const cx = +(attrs.cx ?? 0), cy = +(attrs.cy ?? 0), r = +(attrs.r ?? 0);
      push(cx - r, cy - r); push(cx + r, cy + r);
    } else if (tag === 'ellipse') {
      const cx = +(attrs.cx ?? 0), cy = +(attrs.cy ?? 0);
      const rx = +(attrs.rx ?? 0), ry = +(attrs.ry ?? 0);
      push(cx - rx, cy - ry); push(cx + rx, cy + ry);
    } else if (tag === 'line') {
      push(+(attrs.x1 ?? 0), +(attrs.y1 ?? 0));
      push(+(attrs.x2 ?? 0), +(attrs.y2 ?? 0));
    } else if (tag === 'polyline' || tag === 'polygon') {
      const pts = (attrs.points ?? '').split(/[\s,]+/).map(Number).filter(Number.isFinite);
      for (let k = 0; k + 1 < pts.length; k += 2) push(pts[k], pts[k + 1]);
    }
  }

  if (!Number.isFinite(minX)) return null;
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}

async function bboxesBuiltin(dir: string, files: string[]): Promise<Map<string, Bbox | null>> {
  const out = new Map<string, Bbox | null>();
  for (const file of files) {
    const raw = await fs.readFile(path.join(dir, file), 'utf8');
    try { out.set(file, bboxBuiltin(raw)); } catch { out.set(file, null); }
  }
  return out;
}

function mean(xs: number[]): number {
  return xs.reduce((a, b) => a + b, 0) / Math.max(xs.length, 1);
}

function stddev(xs: number[]): number {
  const m = mean(xs);
  const variance = xs.reduce((acc, x) => acc + (x - m) ** 2, 0) / Math.max(xs.length, 1);
  return Math.sqrt(variance);
}

async function listAvailable(dir: string): Promise<string[]> {
  try {
    return (await fs.readdir(dir)).filter(f => f.toLowerCase().endsWith('.svg'));
  } catch {
    return [];
  }
}

async function main() {
  const sampleSize = arg('--sample', 200);

  const normalised = await listAvailable(NORMALISED_DIR);
  if (normalised.length === 0) {
    process.stderr.write(
      'No normalised SVGs found at ' +
        path.relative(ROOT, NORMALISED_DIR) +
        '. Run `npm run normalise:mulberry` first.\n',
    );
    process.exitCode = 1;
    return;
  }

  // Deterministic sample: take every Nth file.
  const step = Math.max(1, Math.floor(normalised.length / sampleSize));
  const sample = normalised.filter((_, i) => i % step === 0).slice(0, sampleSize);

  // Default to the built-in (zero-install) bbox. Opt in to puppeteer with
  // `npm run audit:uniformity -- --backend=puppeteer` if you've installed it
  // and want rendered-truth measurements.
  const backendArg = (process.argv.find(a => a.startsWith('--backend=')) ?? '')
    .split('=')[1] ?? 'builtin';

  process.stdout.write(
    `auditing ${sample.length} of ${normalised.length} normalised SVGs (backend=${backendArg})...\n`,
  );

  let bboxes: Map<string, Bbox | null>;
  if (backendArg === 'puppeteer') {
    try {
      bboxes = await bboxesFromPuppeteer(NORMALISED_DIR, sample);
    } catch (err) {
      process.stdout.write(
        `puppeteer unavailable (${(err as Error).message}); falling back to built-in.\n`,
      );
      bboxes = await bboxesBuiltin(NORMALISED_DIR, sample);
    }
  } else {
    bboxes = await bboxesBuiltin(NORMALISED_DIR, sample);
  }

  const occupancies: { file: string; occupancy: number }[] = [];
  const missing: string[] = [];

  for (const file of sample) {
    const raw = await fs.readFile(path.join(NORMALISED_DIR, file), 'utf8');
    const viewBox = parseViewBox(raw);
    const bbox = bboxes.get(file);
    if (!viewBox || !bbox || viewBox.width === 0 || viewBox.height === 0) {
      missing.push(file);
      continue;
    }
    // Use the longer axis on both sides so wide/tall glyphs are compared
    // fairly — we care about visual prominence in the square frame.
    const glyphLong = Math.max(bbox.width, bbox.height);
    const viewLong = Math.max(viewBox.width, viewBox.height);
    const occupancy = glyphLong / viewLong;
    occupancies.push({ file, occupancy });
  }

  const values = occupancies.map(o => o.occupancy);
  const tooSmall = occupancies.filter(o => o.occupancy < 0.55).sort((a, b) => a.occupancy - b.occupancy).slice(0, 10);
  const tooLarge = occupancies.filter(o => o.occupancy > 0.95).sort((a, b) => b.occupancy - a.occupancy).slice(0, 10);

  const report = {
    generatedAt: new Date().toISOString(),
    sampled: occupancies.length,
    missing: missing.length,
    occupancy: {
      mean: Number(mean(values).toFixed(3)),
      stddev: Number(stddev(values).toFixed(3)),
      min: Number(Math.min(...values).toFixed(3)),
      max: Number(Math.max(...values).toFixed(3)),
    },
    tooSmallExamples: tooSmall.map(o => ({ file: o.file, occupancy: Number(o.occupancy.toFixed(3)) })),
    tooLargeExamples: tooLarge.map(o => ({ file: o.file, occupancy: Number(o.occupancy.toFixed(3)) })),
    targetsHit: {
      meanGte70: mean(values) >= 0.70,
      stddevLte06: stddev(values) <= 0.06,
      noneBelow55: tooSmall.length === 0,
      noneAbove95: tooLarge.length === 0,
    },
  };

  await fs.writeFile(REPORT_PATH, JSON.stringify(report, null, 2));
  process.stdout.write(JSON.stringify(report, null, 2) + '\n');
}

main().catch(err => {
  process.stderr.write(`${err instanceof Error ? err.stack : String(err)}\n`);
  process.exitCode = 1;
});
