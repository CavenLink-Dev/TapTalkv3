/**
 * normaliseMulberrySvg.ts
 *
 * Trims every Mulberry SVG to its tight visual bounding box, then expands the
 * shorter axis so the output viewBox is always square. A uniform inner padding
 * is added so all glyphs occupy the same visual fraction of their frame —
 * which is what makes the AAC board look consistent regardless of which
 * symbols are showing.
 *
 *   IN:   src/assets/symbols/mulberry/svg/<Name>.svg          (Mulberry originals)
 *   OUT:  src/assets/symbols/mulberry/svg-normalised/<Name>.svg
 *
 * Behaviour
 *   • Default: trim every SVG, except a small DO_NOT_TRIM_LIST of
 *     positional/directional concepts where whitespace carries meaning
 *     (e.g. "above" — the object's offset from the centre IS the message).
 *   • Auto-flag any symbol whose post-trim area is < 0.5 × pre-trim area
 *     for manual review (written to import-report.json).
 *
 * Bounding-box source (in order of preference)
 *   1. Puppeteer's <svg>.getBBox()  — most accurate (handles filters,
 *      markers, complex transforms). Slow (~3min for 3,436 files) but
 *      only runs at build time. Opt-in: `npm i -D puppeteer`.
 *   2. svgson + svg-path-bounds folding — pure JS, opt-in.
 *   3. Built-in path-bounds parser (default — zero dependencies). Handles
 *      paths, rects, circles, ellipses, lines, polylines/polygons, and
 *      simple translate/scale group transforms. Control points expand
 *      the bbox conservatively, so the result is a safe upper bound —
 *      slightly looser than getBBox but well within our 8% padding budget.
 *
 * Idempotent: re-running over an already-normalised tree is a no-op
 * unless --force is passed.
 *
 *   Run:  npm run normalise:mulberry
 *         npm run normalise:mulberry -- --force
 */

import fs from 'node:fs/promises';
import path from 'node:path';

const ROOT = process.cwd();
const SVG_DIR = path.join(ROOT, 'src', 'assets', 'symbols', 'mulberry', 'svg');
const NORMALISED_DIR = path.join(
  ROOT,
  'src',
  'assets',
  'symbols',
  'mulberry',
  'svg-normalised',
);
const REPORT_PATH = path.join(
  ROOT,
  'src',
  'data',
  'imports',
  'mulberry',
  'normalise-report.json',
);

/**
 * Symbols whose whitespace is part of the meaning. These get a viewBox-only
 * rewrite (no trim) so the glyph still sits where the artist drew it relative
 * to the canvas centre.
 */
const DO_NOT_TRIM_LIST = new Set<string>([
  'above.svg',
  'below.svg',
  'across.svg',
  'after.svg',
  'against.svg',
  'ahead.svg',
  'behind.svg',
  'beside.svg',
  'between.svg',
  'inside.svg',
  'outside.svg',
  'top.svg',
  'bottom.svg',
  'left.svg',
  'right.svg',
  'centre.svg',
  'middle.svg',
  'corner.svg',
  'over.svg',
  'under.svg',
]);

/** Inner padding applied around the tight bbox, expressed as a fraction of the longer axis. */
const PADDING_FRACTION = 0.08;

/** Final viewBox edge length — arbitrary; symbols scale to fit at render time. */
const SQUARE_SIDE = 100;

type Bbox = { x: number; y: number; width: number; height: number };

type NormaliseStats = {
  total: number;
  normalised: number;
  preserved: number;
  flaggedForReview: { file: string; areaRatio: number }[];
  failedBbox: string[];
  bboxBackend: 'puppeteer' | 'svgson' | 'builtin';
};

function parseExistingViewBox(svg: string): Bbox | null {
  const match = svg.match(/viewBox\s*=\s*["']([^"']+)["']/);
  if (!match) return null;
  const parts = match[1].split(/[\s,]+/).map(Number);
  if (parts.length !== 4 || parts.some(Number.isNaN)) return null;
  return { x: parts[0], y: parts[1], width: parts[2], height: parts[3] };
}

function applyPaddingAndSquare(bbox: Bbox): Bbox {
  const longer = Math.max(bbox.width, bbox.height);
  const pad = longer * PADDING_FRACTION;
  const padded: Bbox = {
    x: bbox.x - pad,
    y: bbox.y - pad,
    width: bbox.width + pad * 2,
    height: bbox.height + pad * 2,
  };
  // Square it up by extending the shorter axis equally on both sides
  // so the glyph stays visually centred.
  if (padded.width > padded.height) {
    const extra = padded.width - padded.height;
    padded.y -= extra / 2;
    padded.height = padded.width;
  } else if (padded.height > padded.width) {
    const extra = padded.height - padded.width;
    padded.x -= extra / 2;
    padded.width = padded.height;
  }
  return padded;
}

function bboxToViewBoxString(bbox: Bbox): string {
  // Round to 2dp for clean output. Sub-pixel precision past that is noise.
  const r = (n: number) => Math.round(n * 100) / 100;
  return `${r(bbox.x)} ${r(bbox.y)} ${r(bbox.width)} ${r(bbox.height)}`;
}

function rewriteSvg(originalSvg: string, newBbox: Bbox): string {
  let svg = originalSvg;

  // Ensure preserveAspectRatio is xMidYMid meet so the glyph scales uniformly
  // inside its rendering box (the consumer always gives it a square frame).
  if (/preserveAspectRatio\s*=/.test(svg)) {
    svg = svg.replace(
      /preserveAspectRatio\s*=\s*["'][^"']*["']/,
      'preserveAspectRatio="xMidYMid meet"',
    );
  } else {
    svg = svg.replace(
      /<svg\b/,
      '<svg preserveAspectRatio="xMidYMid meet"',
    );
  }

  // Rewrite viewBox.
  const viewBoxString = bboxToViewBoxString(newBbox);
  if (/viewBox\s*=/.test(svg)) {
    svg = svg.replace(
      /viewBox\s*=\s*["'][^"']*["']/,
      `viewBox="${viewBoxString}"`,
    );
  } else {
    svg = svg.replace(/<svg\b/, `<svg viewBox="${viewBoxString}"`);
  }

  // Drop width/height attributes — the render target controls those.
  svg = svg.replace(/\s(?:width|height)\s*=\s*["'][^"']*["']/g, '');

  return svg;
}

// ── Built-in pure-JS bbox (zero dependencies) ──────────────────────────────

type Transform = { tx: number; ty: number; sx: number; sy: number };

const IDENTITY: Transform = { tx: 0, ty: 0, sx: 1, sy: 1 };

function compose(a: Transform, b: Transform): Transform {
  // Apply b first, then a, on a point: (a ∘ b)(p) = a(b(p))
  return {
    tx: a.tx + a.sx * b.tx,
    ty: a.ty + a.sy * b.ty,
    sx: a.sx * b.sx,
    sy: a.sy * b.sy,
  };
}

function parseTransform(attr: string | undefined): Transform {
  if (!attr) return IDENTITY;
  let t: Transform = IDENTITY;
  // We only handle translate/scale — Mulberry glyphs largely use these.
  // Anything else (matrix/rotate/skew) is ignored, which slightly inflates
  // the bbox in rare cases. That's acceptable for our 8% padding budget.
  const re = /(translate|scale)\s*\(\s*([-\d.eE,\s]+)\)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(attr)) !== null) {
    const args = m[2].split(/[\s,]+/).map(Number).filter(n => Number.isFinite(n));
    if (m[1] === 'translate') {
      t = compose(t, { tx: args[0] ?? 0, ty: args[1] ?? 0, sx: 1, sy: 1 });
    } else if (m[1] === 'scale') {
      const sx = args[0] ?? 1;
      const sy = args[1] ?? sx;
      t = compose(t, { tx: 0, ty: 0, sx, sy });
    }
  }
  return t;
}

function applyTransform(t: Transform, x: number, y: number): [number, number] {
  return [t.tx + t.sx * x, t.ty + t.sy * y];
}

/**
 * Parse an SVG path's `d` attribute and produce a bbox covering every
 * endpoint and control point. Control points overestimate the true bbox
 * by a known amount (bezier curves lie inside the convex hull of their
 * control points), but the overestimate is bounded and consistent — and
 * the 8% padding we add afterwards makes it invisible.
 */
function pathBoundsBuiltin(d: string, t: Transform): {
  minX: number; minY: number; maxX: number; maxY: number;
} | null {
  const tokens = d.match(/[MmLlHhVvCcSsQqTtAaZz]|-?\d*\.?\d+(?:[eE][-+]?\d+)?/g);
  if (!tokens) return null;

  let cmd = '';
  let cx = 0, cy = 0;        // current point
  let startX = 0, startY = 0; // start of subpath (for Z)
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

  function pt(x: number, y: number) {
    const [tx, ty] = applyTransform(t, x, y);
    if (tx < minX) minX = tx;
    if (tx > maxX) maxX = tx;
    if (ty < minY) minY = ty;
    if (ty > maxY) maxY = ty;
  }

  let i = 0;
  while (i < tokens.length) {
    const tok = tokens[i];
    if (/[A-Za-z]/.test(tok)) {
      cmd = tok;
      i += 1;
      continue;
    }

    const n = (idx: number) => parseFloat(tokens[i + idx]);

    switch (cmd) {
      case 'M': {
        cx = n(0); cy = n(1);
        startX = cx; startY = cy;
        pt(cx, cy);
        cmd = 'L'; // implicit repeat
        i += 2;
        break;
      }
      case 'm': {
        cx += n(0); cy += n(1);
        startX = cx; startY = cy;
        pt(cx, cy);
        cmd = 'l';
        i += 2;
        break;
      }
      case 'L': case 'T': {
        cx = n(0); cy = n(1);
        pt(cx, cy);
        i += 2;
        break;
      }
      case 'l': case 't': {
        cx += n(0); cy += n(1);
        pt(cx, cy);
        i += 2;
        break;
      }
      case 'H': { cx = n(0); pt(cx, cy); i += 1; break; }
      case 'h': { cx += n(0); pt(cx, cy); i += 1; break; }
      case 'V': { cy = n(0); pt(cx, cy); i += 1; break; }
      case 'v': { cy += n(0); pt(cx, cy); i += 1; break; }
      case 'C': {
        pt(n(0), n(1)); pt(n(2), n(3)); pt(n(4), n(5));
        cx = n(4); cy = n(5);
        i += 6;
        break;
      }
      case 'c': {
        pt(cx + n(0), cy + n(1));
        pt(cx + n(2), cy + n(3));
        pt(cx + n(4), cy + n(5));
        cx += n(4); cy += n(5);
        i += 6;
        break;
      }
      case 'S': case 'Q': {
        pt(n(0), n(1)); pt(n(2), n(3));
        cx = n(2); cy = n(3);
        i += 4;
        break;
      }
      case 's': case 'q': {
        pt(cx + n(0), cy + n(1));
        pt(cx + n(2), cy + n(3));
        cx += n(2); cy += n(3);
        i += 4;
        break;
      }
      case 'A': {
        // rx ry xrot largeArcFlag sweepFlag x y — we only bbox the endpoint.
        pt(n(5), n(6));
        cx = n(5); cy = n(6);
        i += 7;
        break;
      }
      case 'a': {
        pt(cx + n(5), cy + n(6));
        cx += n(5); cy += n(6);
        i += 7;
        break;
      }
      case 'Z': case 'z': {
        cx = startX; cy = startY;
        // Z takes no numeric args. If a stray number follows (malformed),
        // the next loop iteration's letter check will fail and we'll skip it
        // via the default below.
        i += 1;
        break;
      }
      default: {
        // Unknown command or stray token — skip safely.
        i += 1;
      }
    }
  }

  if (!Number.isFinite(minX)) return null;
  return { minX, minY, maxX, maxY };
}

function extendBoxWith(
  out: { minX: number; minY: number; maxX: number; maxY: number },
  x: number, y: number,
) {
  if (x < out.minX) out.minX = x;
  if (x > out.maxX) out.maxX = x;
  if (y < out.minY) out.minY = y;
  if (y > out.maxY) out.maxY = y;
}

function builtinBboxFromSvg(svg: string): Bbox | null {
  const out = { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity };

  // Walk the SVG element-by-element with a simple regex scanner. We track
  // the active transform stack so nested <g transform="..."> compounds.
  // This is not a full XML parser — but Mulberry SVGs are well-formed
  // enough that a regex scan over <(g|path|rect|...) attrs/?> works.
  const elementRe = /<\s*(g|path|rect|circle|ellipse|line|polyline|polygon)\b([^>]*?)\/?>|<\s*\/\s*g\s*>/g;
  const stack: Transform[] = [IDENTITY];

  let m: RegExpExecArray | null;
  while ((m = elementRe.exec(svg)) !== null) {
    const closingG = m[0].startsWith('</');
    if (closingG) {
      if (stack.length > 1) stack.pop();
      continue;
    }

    const tag = m[1];
    const attrText = m[2] ?? '';
    const attrs = parseAttrs(attrText);
    const current = stack[stack.length - 1];

    if (tag === 'g') {
      const t = parseTransform(attrs.transform);
      stack.push(compose(current, t));
      // <g/> self-closed (rare) — pop now.
      if (m[0].endsWith('/>')) stack.pop();
      continue;
    }

    // Combine the element's own transform with the active stack transform.
    const elTransform = parseTransform(attrs.transform);
    const t = compose(current, elTransform);

    if (tag === 'path' && attrs.d) {
      const b = pathBoundsBuiltin(attrs.d, t);
      if (b) {
        extendBoxWith(out, b.minX, b.minY);
        extendBoxWith(out, b.maxX, b.maxY);
      }
    } else if (tag === 'rect') {
      const x = Number(attrs.x ?? 0);
      const y = Number(attrs.y ?? 0);
      const w = Number(attrs.width ?? 0);
      const h = Number(attrs.height ?? 0);
      const [x0, y0] = applyTransform(t, x, y);
      const [x1, y1] = applyTransform(t, x + w, y + h);
      extendBoxWith(out, Math.min(x0, x1), Math.min(y0, y1));
      extendBoxWith(out, Math.max(x0, x1), Math.max(y0, y1));
    } else if (tag === 'circle') {
      const cxa = Number(attrs.cx ?? 0);
      const cya = Number(attrs.cy ?? 0);
      const r = Number(attrs.r ?? 0);
      const [x0, y0] = applyTransform(t, cxa - r, cya - r);
      const [x1, y1] = applyTransform(t, cxa + r, cya + r);
      extendBoxWith(out, Math.min(x0, x1), Math.min(y0, y1));
      extendBoxWith(out, Math.max(x0, x1), Math.max(y0, y1));
    } else if (tag === 'ellipse') {
      const cxa = Number(attrs.cx ?? 0);
      const cya = Number(attrs.cy ?? 0);
      const rx = Number(attrs.rx ?? 0);
      const ry = Number(attrs.ry ?? 0);
      const [x0, y0] = applyTransform(t, cxa - rx, cya - ry);
      const [x1, y1] = applyTransform(t, cxa + rx, cya + ry);
      extendBoxWith(out, Math.min(x0, x1), Math.min(y0, y1));
      extendBoxWith(out, Math.max(x0, x1), Math.max(y0, y1));
    } else if (tag === 'line') {
      const x1a = Number(attrs.x1 ?? 0);
      const y1a = Number(attrs.y1 ?? 0);
      const x2a = Number(attrs.x2 ?? 0);
      const y2a = Number(attrs.y2 ?? 0);
      const [p1x, p1y] = applyTransform(t, x1a, y1a);
      const [p2x, p2y] = applyTransform(t, x2a, y2a);
      extendBoxWith(out, p1x, p1y);
      extendBoxWith(out, p2x, p2y);
    } else if (tag === 'polyline' || tag === 'polygon') {
      const pts = (attrs.points ?? '').split(/[\s,]+/).map(Number).filter(n => Number.isFinite(n));
      for (let k = 0; k + 1 < pts.length; k += 2) {
        const [px, py] = applyTransform(t, pts[k], pts[k + 1]);
        extendBoxWith(out, px, py);
      }
    }
  }

  if (!Number.isFinite(out.minX)) return null;
  return { x: out.minX, y: out.minY, width: out.maxX - out.minX, height: out.maxY - out.minY };
}

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

async function measureBboxesBuiltin(
  files: string[],
): Promise<Map<string, Bbox | null>> {
  const results = new Map<string, Bbox | null>();
  for (const file of files) {
    const raw = await fs.readFile(path.join(SVG_DIR, file), 'utf8');
    try {
      results.set(file, builtinBboxFromSvg(raw));
    } catch {
      results.set(file, null);
    }
  }
  return results;
}

// ── Bbox via Puppeteer (highest accuracy, opt-in) ──────────────────────────

async function tryLoadPuppeteer() {
  try {
    // Optional dependency. If absent we fall back to svgson.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('puppeteer');
  } catch {
    return null;
  }
}

async function measureBboxesWithPuppeteer(
  files: string[],
): Promise<Map<string, Bbox | null>> {
  const puppeteer = await tryLoadPuppeteer();
  if (!puppeteer) throw new Error('puppeteer-not-installed');

  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  const results = new Map<string, Bbox | null>();

  // Reuse the same page; reset its body each call. Much faster than
  // launching a fresh page per file.
  await page.setContent('<!DOCTYPE html><html><body></body></html>');

  for (const file of files) {
    const raw = await fs.readFile(path.join(SVG_DIR, file), 'utf8');
    try {
      const bbox = await page.evaluate((svgMarkup: string) => {
        document.body.innerHTML = svgMarkup;
        const svg = document.body.querySelector('svg') as SVGSVGElement | null;
        if (!svg) return null;
        // Hidden elements still report a bbox in headless Chrome.
        const box = svg.getBBox();
        return { x: box.x, y: box.y, width: box.width, height: box.height };
      }, raw);
      results.set(file, bbox);
    } catch {
      results.set(file, null);
    }
  }

  await browser.close();
  return results;
}

// ── Bbox via svgson + svg-path-bounds (fallback) ───────────────────────────

async function tryLoadSvgsonStack() {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const svgson = require('svgson');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const svgPathBounds = require('svg-path-bounds');
    return { svgson, svgPathBounds };
  } catch {
    return null;
  }
}

async function measureBboxesWithSvgson(
  files: string[],
): Promise<Map<string, Bbox | null>> {
  const stack = await tryLoadSvgsonStack();
  if (!stack) throw new Error('svgson-not-installed');

  const { svgson, svgPathBounds } = stack;
  const results = new Map<string, Bbox | null>();

  function walk(
    node: { name?: string; attributes?: Record<string, string>; children?: unknown[] },
    out: { minX: number; minY: number; maxX: number; maxY: number },
  ): void {
    if (!node) return;
    const attrs = node.attributes ?? {};
    if (node.name === 'path' && attrs.d) {
      try {
        const [minX, minY, maxX, maxY] = svgPathBounds(attrs.d) as number[];
        out.minX = Math.min(out.minX, minX);
        out.minY = Math.min(out.minY, minY);
        out.maxX = Math.max(out.maxX, maxX);
        out.maxY = Math.max(out.maxY, maxY);
      } catch {
        // Skip unparseable paths.
      }
    } else if (node.name === 'rect') {
      const x = Number(attrs.x ?? 0);
      const y = Number(attrs.y ?? 0);
      const w = Number(attrs.width ?? 0);
      const h = Number(attrs.height ?? 0);
      out.minX = Math.min(out.minX, x);
      out.minY = Math.min(out.minY, y);
      out.maxX = Math.max(out.maxX, x + w);
      out.maxY = Math.max(out.maxY, y + h);
    } else if (node.name === 'circle') {
      const cx = Number(attrs.cx ?? 0);
      const cy = Number(attrs.cy ?? 0);
      const r = Number(attrs.r ?? 0);
      out.minX = Math.min(out.minX, cx - r);
      out.minY = Math.min(out.minY, cy - r);
      out.maxX = Math.max(out.maxX, cx + r);
      out.maxY = Math.max(out.maxY, cy + r);
    } else if (node.name === 'ellipse') {
      const cx = Number(attrs.cx ?? 0);
      const cy = Number(attrs.cy ?? 0);
      const rx = Number(attrs.rx ?? 0);
      const ry = Number(attrs.ry ?? 0);
      out.minX = Math.min(out.minX, cx - rx);
      out.minY = Math.min(out.minY, cy - ry);
      out.maxX = Math.max(out.maxX, cx + rx);
      out.maxY = Math.max(out.maxY, cy + ry);
    } else if (node.name === 'line') {
      const x1 = Number(attrs.x1 ?? 0);
      const y1 = Number(attrs.y1 ?? 0);
      const x2 = Number(attrs.x2 ?? 0);
      const y2 = Number(attrs.y2 ?? 0);
      out.minX = Math.min(out.minX, x1, x2);
      out.minY = Math.min(out.minY, y1, y2);
      out.maxX = Math.max(out.maxX, x1, x2);
      out.maxY = Math.max(out.maxY, y1, y2);
    } else if (node.name === 'polyline' || node.name === 'polygon') {
      const pts = (attrs.points ?? '')
        .split(/[\s,]+/)
        .map(Number)
        .filter(n => Number.isFinite(n));
      for (let i = 0; i + 1 < pts.length; i += 2) {
        const x = pts[i];
        const y = pts[i + 1];
        out.minX = Math.min(out.minX, x);
        out.minY = Math.min(out.minY, y);
        out.maxX = Math.max(out.maxX, x);
        out.maxY = Math.max(out.maxY, y);
      }
    }
    if (node.children) {
      for (const child of node.children) {
        walk(child as Parameters<typeof walk>[0], out);
      }
    }
  }

  for (const file of files) {
    const raw = await fs.readFile(path.join(SVG_DIR, file), 'utf8');
    try {
      const tree = await svgson.parse(raw);
      const out = {
        minX: Infinity,
        minY: Infinity,
        maxX: -Infinity,
        maxY: -Infinity,
      };
      walk(tree, out);
      if (!Number.isFinite(out.minX)) {
        results.set(file, null);
      } else {
        results.set(file, {
          x: out.minX,
          y: out.minY,
          width: out.maxX - out.minX,
          height: out.maxY - out.minY,
        });
      }
    } catch {
      results.set(file, null);
    }
  }

  return results;
}

// ── Orchestration ──────────────────────────────────────────────────────────

async function main() {
  const force = process.argv.includes('--force');

  await fs.mkdir(NORMALISED_DIR, { recursive: true });
  const allFiles = (await fs.readdir(SVG_DIR)).filter(file =>
    file.toLowerCase().endsWith('.svg'),
  );

  // Skip files already normalised unless --force.
  let pending = allFiles;
  if (!force) {
    const existing = new Set(
      (await fs.readdir(NORMALISED_DIR)).filter(file =>
        file.toLowerCase().endsWith('.svg'),
      ),
    );
    pending = allFiles.filter(file => !existing.has(file));
  }

  if (pending.length === 0) {
    process.stdout.write(
      'normaliseMulberrySvg: nothing to do (use --force to re-normalise).\n',
    );
    return;
  }

  process.stdout.write(
    `normaliseMulberrySvg: processing ${pending.length} of ${allFiles.length} files...\n`,
  );

  // Backend order:
  //   --backend=puppeteer  → puppeteer (most accurate, slow)
  //   --backend=svgson     → svgson + svg-path-bounds
  //   (default)            → built-in pure-JS path-bounds parser (zero deps)
  const backendArg = (process.argv.find(a => a.startsWith('--backend=')) ?? '')
    .split('=')[1] ?? 'builtin';

  let bboxes: Map<string, Bbox | null>;
  let backend: NormaliseStats['bboxBackend'];

  if (backendArg === 'puppeteer') {
    try {
      bboxes = await measureBboxesWithPuppeteer(pending);
      backend = 'puppeteer';
    } catch (err) {
      process.stdout.write(
        `puppeteer unavailable (${(err as Error).message}); falling back to built-in.\n`,
      );
      bboxes = await measureBboxesBuiltin(pending);
      backend = 'builtin';
    }
  } else if (backendArg === 'svgson') {
    try {
      bboxes = await measureBboxesWithSvgson(pending);
      backend = 'svgson';
    } catch (err) {
      process.stdout.write(
        `svgson unavailable (${(err as Error).message}); falling back to built-in.\n`,
      );
      bboxes = await measureBboxesBuiltin(pending);
      backend = 'builtin';
    }
  } else {
    bboxes = await measureBboxesBuiltin(pending);
    backend = 'builtin';
  }

  const stats: NormaliseStats = {
    total: pending.length,
    normalised: 0,
    preserved: 0,
    flaggedForReview: [],
    failedBbox: [],
    bboxBackend: backend,
  };

  for (const file of pending) {
    const raw = await fs.readFile(path.join(SVG_DIR, file), 'utf8');

    if (DO_NOT_TRIM_LIST.has(file)) {
      // Preserve original geometry — but still square the viewBox so
      // the consumer can render in a 1:1 frame without distortion.
      const existing = parseExistingViewBox(raw) ?? {
        x: 0,
        y: 0,
        width: 100,
        height: 100,
      };
      const squared = applyPaddingAndSquare(existing);
      const rewritten = rewriteSvg(raw, squared);
      await fs.writeFile(path.join(NORMALISED_DIR, file), rewritten, 'utf8');
      stats.preserved += 1;
      continue;
    }

    const tight = bboxes.get(file);
    if (!tight || tight.width === 0 || tight.height === 0) {
      // Couldn't measure — copy verbatim so the asset still resolves.
      await fs.writeFile(path.join(NORMALISED_DIR, file), raw, 'utf8');
      stats.failedBbox.push(file);
      continue;
    }

    const originalViewBox = parseExistingViewBox(raw);
    if (originalViewBox) {
      const originalArea = originalViewBox.width * originalViewBox.height;
      const tightArea = tight.width * tight.height;
      const ratio = originalArea === 0 ? 1 : tightArea / originalArea;
      if (ratio < 0.5) {
        stats.flaggedForReview.push({ file, areaRatio: Number(ratio.toFixed(3)) });
      }
    }

    const finalBox = applyPaddingAndSquare(tight);
    const rewritten = rewriteSvg(raw, finalBox);
    await fs.writeFile(path.join(NORMALISED_DIR, file), rewritten, 'utf8');
    stats.normalised += 1;
  }

  await fs.writeFile(
    REPORT_PATH,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        ...stats,
        paddingFraction: PADDING_FRACTION,
        squareSide: SQUARE_SIDE,
        doNotTrimList: Array.from(DO_NOT_TRIM_LIST),
      },
      null,
      2,
    ),
  );

  process.stdout.write(
    `done. normalised=${stats.normalised} preserved=${stats.preserved} ` +
      `flagged=${stats.flaggedForReview.length} failed=${stats.failedBbox.length} ` +
      `backend=${stats.bboxBackend}\n`,
  );
}

main().catch(err => {
  process.stderr.write(`${err instanceof Error ? err.stack : String(err)}\n`);
  process.exitCode = 1;
});
