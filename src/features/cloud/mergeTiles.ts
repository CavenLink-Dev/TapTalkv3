/**
 * Tile-level merge for Supabase cloud sync.
 *
 * Replaces last-writer-wins across the whole vocabulary tree. Each tile
 * carries a small meta trailer (`updatedAt`, `updatedBy`) so caregiver edits
 * from another device don't silently overwrite a user's in-session tile.
 *
 * Rules, in order:
 *   1. If only one side has the tile, keep it.
 *   2. Newer `updatedAt` wins.
 *   3. On a tie, the 'user' edit wins over 'caregiver' — the person actually
 *      communicating gets the last word.
 *   4. On a tie between two same-role edits, keep local (least churn).
 *
 * Deletions are represented as `{ deletedAt: number }` so a deletion on one
 * device can still beat a stale edit on the other.
 */
export type MergeMeta = {
  updatedAt: number;
  updatedBy: 'user' | 'caregiver';
  deletedAt?: number;
};

export type Mergeable<T> = T & MergeMeta & { id: string };

export type MergeResult<T> = {
  merged: Mergeable<T>[];
  conflicts: Array<{ id: string; local: Mergeable<T>; remote: Mergeable<T>; kept: 'local' | 'remote' }>;
};

export function mergeTiles<T>(
  local: Mergeable<T>[],
  remote: Mergeable<T>[],
): MergeResult<T> {
  const byId = new Map<string, Mergeable<T>>();
  const conflicts: MergeResult<T>['conflicts'] = [];

  for (const t of local) byId.set(t.id, t);

  for (const r of remote) {
    const l = byId.get(r.id);
    if (!l) {
      byId.set(r.id, r);
      continue;
    }
    const winner = pickWinner(l, r);
    byId.set(r.id, winner);
    if (winner !== l) {
      conflicts.push({ id: r.id, local: l, remote: r, kept: 'remote' });
    } else if (l.updatedAt === r.updatedAt && l.updatedBy !== r.updatedBy) {
      // silently kept local, but note the disagreement so the UI can flag it
      conflicts.push({ id: r.id, local: l, remote: r, kept: 'local' });
    }
  }

  // Filter out tiles whose latest state is a deletion.
  const merged = [...byId.values()].filter((t) => !t.deletedAt);
  return { merged, conflicts };
}

function pickWinner<T>(a: Mergeable<T>, b: Mergeable<T>): Mergeable<T> {
  // Deletions beat older edits.
  const aStamp = a.deletedAt ?? a.updatedAt;
  const bStamp = b.deletedAt ?? b.updatedAt;
  if (aStamp > bStamp) return a;
  if (bStamp > aStamp) return b;
  // Tie: user edit beats caregiver edit.
  if (a.updatedBy === 'user' && b.updatedBy !== 'user') return a;
  if (b.updatedBy === 'user' && a.updatedBy !== 'user') return b;
  // Otherwise keep local (a).
  return a;
}

/** Convenience helper for TileCell edit dispatches. */
export function withMeta<T>(
  tile: T & { id: string },
  updatedBy: 'user' | 'caregiver',
): Mergeable<T> {
  return { ...tile, updatedAt: Date.now(), updatedBy };
}
