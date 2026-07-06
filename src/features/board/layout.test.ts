// ─── layout.ts unit tests ────────────────────────────────────────────────────
// Pure functions only — no RN mocks needed. Run with:
//   npx jest src/features/board/layout.test.ts
//
// The BOARD_COLUMNS constant is 4, so a 4-wide board is assumed throughout.

import {
  coarseCols,
  coarseRows,
  footprintAt,
  footprintsOverlap,
  reflowLayoutSlots,
  reflowAroundPinned,
  type TilePlacement,
  type CellFootprint,
} from './layout';

// ── coarseCols / coarseRows ───────────────────────────────────────────────────

describe('coarseCols', () => {
  it('maps fine units to coarse cells (ceil(fw/2))', () => {
    expect(coarseCols(1)).toBe(1); // 1 fine → 1 coarse
    expect(coarseCols(2)).toBe(1); // default 88pt tile
    expect(coarseCols(3)).toBe(2);
    expect(coarseCols(4)).toBe(2); // 2-wide tile
    expect(coarseCols(5)).toBe(3);
    expect(coarseCols(8)).toBe(4); // max (fills a 4-column row)
  });
});

describe('coarseRows', () => {
  it('mirrors coarseCols symmetrically', () => {
    expect(coarseRows(2)).toBe(1);
    expect(coarseRows(4)).toBe(2);
  });
});

// ── footprintAt ───────────────────────────────────────────────────────────────

describe('footprintAt', () => {
  it('returns a 1×1 coarse cell for a default (fw=2,fh=2) tile at slot 0', () => {
    expect(footprintAt(0, 2, 2)).toEqual<CellFootprint>({
      startCol: 0, startRow: 0, endCol: 0, endRow: 0,
    });
  });

  it('correctly maps slot to col/row (BOARD_COLUMNS = 4)', () => {
    // slot 5 → col 1, row 1
    expect(footprintAt(5, 2, 2)).toEqual({ startCol: 1, startRow: 1, endCol: 1, endRow: 1 });
  });

  it('expands endCol/endRow for a 2-wide tile (fw=4)', () => {
    // slot 0, fw=4 → spans cols 0-1
    expect(footprintAt(0, 4, 2)).toEqual({ startCol: 0, startRow: 0, endCol: 1, endRow: 0 });
  });

  it('handles a 2×2 coarse tile (fw=4, fh=4)', () => {
    // slot 0 → occupies cols 0-1, rows 0-1
    expect(footprintAt(0, 4, 4)).toEqual({ startCol: 0, startRow: 0, endCol: 1, endRow: 1 });
  });
});

// ── footprintsOverlap ─────────────────────────────────────────────────────────

describe('footprintsOverlap', () => {
  const fp = (sc: number, sr: number, ec: number, er: number): CellFootprint =>
    ({ startCol: sc, startRow: sr, endCol: ec, endRow: er });

  it('detects an exact overlap', () => {
    expect(footprintsOverlap(fp(0, 0, 0, 0), fp(0, 0, 0, 0))).toBe(true);
  });

  it('detects a partial overlap', () => {
    expect(footprintsOverlap(fp(0, 0, 1, 1), fp(1, 1, 2, 2))).toBe(true);
  });

  it('returns false for adjacent non-overlapping cells', () => {
    expect(footprintsOverlap(fp(0, 0, 0, 0), fp(1, 0, 1, 0))).toBe(false);
    expect(footprintsOverlap(fp(0, 0, 0, 0), fp(0, 1, 0, 1))).toBe(false);
  });

  it('returns false when separated diagonally', () => {
    expect(footprintsOverlap(fp(0, 0, 0, 0), fp(2, 2, 3, 3))).toBe(false);
  });
});

// ── reflowLayoutSlots ─────────────────────────────────────────────────────────

describe('reflowLayoutSlots', () => {
  it('reassigns slots to 0-based contiguous indices, sorted by original slot', () => {
    const layout: TilePlacement[] = [
      { id: 'b', slot: 5, fw: 2, fh: 2 },
      { id: 'a', slot: 2, fw: 2, fh: 2 },
      { id: 'c', slot: 9, fw: 2, fh: 2 },
    ];
    const result = reflowLayoutSlots(layout);
    expect(result.map(p => ({ id: p.id, slot: p.slot }))).toEqual([
      { id: 'a', slot: 0 },
      { id: 'b', slot: 1 },
      { id: 'c', slot: 2 },
    ]);
  });

  it('preserves fw/fh', () => {
    const layout: TilePlacement[] = [{ id: 'x', slot: 7, fw: 4, fh: 4 }];
    const [r] = reflowLayoutSlots(layout);
    expect(r?.fw).toBe(4);
    expect(r?.fh).toBe(4);
  });

  it('does not mutate the input array', () => {
    const layout: TilePlacement[] = [
      { id: 'a', slot: 3, fw: 2, fh: 2 },
      { id: 'b', slot: 1, fw: 2, fh: 2 },
    ];
    const original = layout.map(p => ({ ...p }));
    reflowLayoutSlots(layout);
    expect(layout).toEqual(original);
  });
});

// ── reflowAroundPinned ────────────────────────────────────────────────────────

describe('reflowAroundPinned', () => {
  const tile = (id: string, slot: number, fw = 2, fh = 2): TilePlacement =>
    ({ id, slot, fw, fh });

  it('includes the pinned tile unchanged', () => {
    const pinned = tile('p', 2);
    const result = reflowAroundPinned([], pinned);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual(pinned);
  });

  it('keeps non-colliding tiles in their original slots', () => {
    const pinned = tile('p', 0);        // col 0, row 0
    const other  = tile('o', 1);        // col 1, row 0 — no overlap
    const result = reflowAroundPinned([other], pinned);
    const o = result.find(r => r.id === 'o')!;
    expect(o.slot).toBe(1);
  });

  it('pushes a colliding tile to the next valid slot', () => {
    // Pinned at slot 0 (col 0, row 0). Other also wants slot 0.
    const pinned = tile('p', 0);
    const other  = tile('o', 0);
    const result = reflowAroundPinned([other], pinned);
    const o = result.find(r => r.id === 'o')!;
    // Should be pushed to slot 1 (or later) — not 0
    expect(o.slot).toBeGreaterThan(0);
  });

  it('places a wide pinned tile and pushes its right neighbour forward', () => {
    // fw=4 → spans cols 0-1. A tile at slot 1 (col 1) collides.
    const pinned = tile('p', 0, 4, 2); // occupies slots (0,0)-(1,0)
    const collider = tile('c', 1);
    const result = reflowAroundPinned([collider], pinned);
    const c = result.find(r => r.id === 'c')!;
    // Must move past the pinned tile's footprint
    expect(c.slot).toBeGreaterThanOrEqual(2);
  });

  it('does not mutate the others array', () => {
    const pinned = tile('p', 0);
    const others = [tile('a', 1), tile('b', 2)];
    const origSlots = others.map(o => o.slot);
    reflowAroundPinned(others, pinned);
    expect(others.map(o => o.slot)).toEqual(origSlots);
  });
});
