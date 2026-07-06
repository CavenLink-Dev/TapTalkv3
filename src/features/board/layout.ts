// ─── Board layout — pure functions ───────────────────────────────────────────
// All functions here are completely free of React, Reanimated, and side
// effects. They can be imported in unit tests, background workers, and
// snapshot tests without mounting a component tree.
//
// Extracted from app/(tabs)/talk.tsx (Phase 4 — God-screen split).

import { BOARD_COLUMNS, MAX_FW } from './constants';

// ── Types ─────────────────────────────────────────────────────────────────────

/** Tile placement: anchor slot (row-major, 0-based) + size in FINE (44pt) units.
 *  fw=2 → one 88pt coarse cell wide, fw=4 → two cells wide, etc. */
export type TilePlacement = {
  id: string;
  slot: number;
  fw: number;
  fh: number;
};

export type BoardLayout = TilePlacement[];

/** Coarse-cell rectangle a placement occupies. Used for collision math. */
export type CellFootprint = {
  startCol: number;
  startRow: number;
  endCol: number;
  endRow: number;
};

// ── Coarse-dimension helpers ──────────────────────────────────────────────────

/** Fine units → coarse cells (1 cell = 2 fine units). */
export const coarseCols = (fw: number): number => Math.ceil(fw / 2);
export const coarseRows = (fh: number): number => Math.ceil(fh / 2);

// ── Footprint helpers ─────────────────────────────────────────────────────────

/** Coarse-cell rectangle occupied by a placement anchored at `slot`. */
export function footprintAt(slot: number, fw: number, fh: number): CellFootprint {
  const startCol = slot % BOARD_COLUMNS;
  const startRow = Math.floor(slot / BOARD_COLUMNS);
  return {
    startCol,
    startRow,
    endCol: startCol + coarseCols(fw) - 1,
    endRow:  startRow + coarseRows(fh) - 1,
  };
}

/** True when two coarse-cell rectangles overlap. */
export function footprintsOverlap(a: CellFootprint, b: CellFootprint): boolean {
  return !(
    a.startCol > b.endCol  || b.startCol > a.endCol  ||
    a.startRow > b.endRow  || b.startRow > a.endRow
  );
}

// ── Layout reflow ─────────────────────────────────────────────────────────────

/**
 * Re-pack anchor slots in row-major order (e.g. after column-count changes).
 * Sorts by current slot, then reassigns contiguous 0-based slot indices.
 * Size (fw/fh) is preserved; only slot numbers change.
 */
export function reflowLayoutSlots(layout: BoardLayout): BoardLayout {
  return [...layout]
    .sort((a, b) => a.slot - b.slot)
    .map((p, i) => ({ ...p, slot: i }));
}

/**
 * Push-aside reflow around one pinned placement.
 *
 * The pinned tile keeps its slot exactly. Every other tile keeps its slot when
 * possible; tiles whose footprint collides with any already-placed tile walk
 * forward to the nearest empty slot that fits (wrapping rows). Returns the
 * full layout including the pinned placement.
 *
 * Used by both resize and drag-drop commits so a multi-cell tile can never
 * overlap a neighbour after a commit.
 */
export function reflowAroundPinned(
  others: TilePlacement[],
  pinned: TilePlacement,
): BoardLayout {
  const placed: { p: TilePlacement; fp: CellFootprint }[] = [
    { p: pinned, fp: footprintAt(pinned.slot, pinned.fw, pinned.fh) },
  ];
  const sorted = [...others].sort((a, b) => a.slot - b.slot);

  for (const other of sorted) {
    const desiredFp = footprintAt(other.slot, other.fw, other.fh);
    const fits = (fp: CellFootprint) =>
      fp.endCol < BOARD_COLUMNS &&
      !placed.some(pl => footprintsOverlap(pl.fp, fp));

    if (fits(desiredFp)) {
      placed.push({ p: other, fp: desiredFp });
      continue;
    }

    // Walk forward to the nearest slot that fits.
    const cw = coarseCols(other.fw);
    let settled = false;
    for (let s = other.slot + 1; s < 500; s++) {
      if ((s % BOARD_COLUMNS) + cw > BOARD_COLUMNS) continue;
      const testFp = footprintAt(s, other.fw, other.fh);
      if (fits(testFp)) {
        placed.push({ p: { ...other, slot: s }, fp: testFp });
        settled = true;
        break;
      }
    }
    if (!settled) {
      // Fallback: keep original slot even if it overlaps (rare/edge case).
      placed.push({ p: other, fp: desiredFp });
    }
  }

  return placed.map(x => x.p);
}
