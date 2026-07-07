import { mergeTiles, withMeta, type Mergeable } from '../mergeTiles';

type T = { label: string };
const mk = (id: string, label: string, ts: number, by: 'user' | 'caregiver'): Mergeable<T> =>
  ({ id, label, updatedAt: ts, updatedBy: by });

describe('mergeTiles', () => {
  it('keeps local-only and remote-only tiles', () => {
    const { merged } = mergeTiles([mk('a', 'A', 1, 'user')], [mk('b', 'B', 1, 'user')]);
    expect(merged.map((t) => t.id).sort()).toEqual(['a', 'b']);
  });

  it('newer wins on conflict', () => {
    const { merged, conflicts } = mergeTiles(
      [mk('a', 'local', 10, 'user')],
      [mk('a', 'remote', 20, 'caregiver')],
    );
    expect(merged[0].label).toBe('remote');
    expect(conflicts[0].kept).toBe('remote');
  });

  it('user beats caregiver on a timestamp tie', () => {
    const { merged } = mergeTiles(
      [mk('a', 'user-edit', 10, 'user')],
      [mk('a', 'care-edit', 10, 'caregiver')],
    );
    expect(merged[0].label).toBe('user-edit');
  });

  it('deletions filter out and beat older edits', () => {
    const del: Mergeable<T> = { id: 'a', label: 'X', updatedAt: 5, updatedBy: 'user', deletedAt: 30 };
    const { merged } = mergeTiles([mk('a', 'still-here', 10, 'user')], [del]);
    expect(merged).toEqual([]);
  });

  it('withMeta stamps updatedAt', () => {
    const t = withMeta({ id: 'x', label: 'hi' }, 'user');
    expect(t.updatedBy).toBe('user');
    expect(typeof t.updatedAt).toBe('number');
  });
});
