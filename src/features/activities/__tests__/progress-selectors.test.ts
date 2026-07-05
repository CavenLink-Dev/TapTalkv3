/**
 * Unit tests — progress selectors (pure aggregation + therapist export).
 *
 * All timestamps are built relative to a fixed `NOW` so results are
 * deterministic regardless of when the suite runs.
 */

import type { ActivitySession } from '../progress-store';
import {
  buildTherapistSummary,
  DAY_MS,
  difficultyLabel,
  formatDuration,
  practiceWindows,
  recentRuns,
  relativeDay,
  summariseActivities,
  weeklyBuckets,
  WEEK_MS,
} from '../progress-selectors';

const NOW = 1_750_000_000_000; // fixed epoch ms

let counter = 0;
function session(overrides: Partial<ActivitySession>): ActivitySession {
  counter += 1;
  return {
    id: `s${counter}`,
    activityId: 'shape-match',
    difficulty: 'easy',
    totalLevels: 5,
    incorrectCount: 0,
    completedAt: NOW - DAY_MS,
    durationMs: 60_000,
    ...overrides,
  };
}

// ─── Format helpers ─────────────────────────────────────────────────────────

describe('format helpers', () => {
  it('difficultyLabel capitalises', () => {
    expect(difficultyLabel('easy')).toBe('Easy');
    expect(difficultyLabel('medium')).toBe('Medium');
    expect(difficultyLabel('hard')).toBe('Hard');
  });

  it('formatDuration is calm and coarse', () => {
    expect(formatDuration(20_000)).toBe('<1 min');
    expect(formatDuration(4 * 60_000)).toBe('4 min');
    expect(formatDuration(60 * 60_000)).toBe('1 hr');
    expect(formatDuration(65 * 60_000)).toBe('1 hr 5 min');
  });

  it('relativeDay buckets days and weeks', () => {
    expect(relativeDay(NOW, NOW)).toBe('Today');
    expect(relativeDay(NOW - DAY_MS, NOW)).toBe('Yesterday');
    expect(relativeDay(NOW - 3 * DAY_MS, NOW)).toBe('3 days ago');
    expect(relativeDay(NOW - 8 * DAY_MS, NOW)).toBe('1 week ago');
    expect(relativeDay(NOW - 15 * DAY_MS, NOW)).toBe('2 weeks ago');
  });
});

// ─── summariseActivities ────────────────────────────────────────────────────

describe('summariseActivities', () => {
  it('returns empty for no sessions', () => {
    expect(summariseActivities([])).toEqual([]);
  });

  it('groups by activity and orders by most recent', () => {
    const sums = summariseActivities([
      session({ activityId: 'shape-match', completedAt: NOW - 5 * DAY_MS }),
      session({ activityId: 'colour-pop', completedAt: NOW - DAY_MS }),
    ]);
    expect(sums.map(s => s.activityId)).toEqual(['colour-pop', 'shape-match']);
  });

  it('tracks difficulties covered, highest difficulty, and total time', () => {
    const [sum] = summariseActivities([
      session({ difficulty: 'easy', durationMs: 60_000 }),
      session({ difficulty: 'hard', durationMs: 120_000 }),
    ]);
    expect(sum!.difficulties).toEqual(['easy', 'hard']);
    expect(sum!.highestDifficulty).toBe('hard');
    expect(sum!.totalDurationMs).toBe(180_000);
  });

  it('surfaces the steadier retry trend only when clearly present', () => {
    // Early: 4 retries per 4-level run; recent: 0–1 → clearly steadier.
    const steadier = summariseActivities([
      session({ incorrectCount: 4, totalLevels: 4, completedAt: NOW - 8 * DAY_MS }),
      session({ incorrectCount: 4, totalLevels: 4, completedAt: NOW - 7 * DAY_MS }),
      session({ incorrectCount: 0, totalLevels: 4, completedAt: NOW - 2 * DAY_MS }),
      session({ incorrectCount: 1, totalLevels: 4, completedAt: NOW - DAY_MS }),
    ]);
    expect(steadier[0]!.retryTrend).toBe('steadier');

    // Flat retries → say nothing.
    const flat = summariseActivities([
      session({ incorrectCount: 2, completedAt: NOW - 8 * DAY_MS }),
      session({ incorrectCount: 2, completedAt: NOW - 7 * DAY_MS }),
      session({ incorrectCount: 2, completedAt: NOW - 2 * DAY_MS }),
      session({ incorrectCount: 2, completedAt: NOW - DAY_MS }),
    ]);
    expect(flat[0]!.retryTrend).toBeNull();

    // Too few runs → say nothing.
    const few = summariseActivities([
      session({ incorrectCount: 4 }),
      session({ incorrectCount: 0 }),
    ]);
    expect(few[0]!.retryTrend).toBeNull();
  });

  it('detects moving up a difficulty over time, conservatively', () => {
    const advanced = summariseActivities([
      session({ difficulty: 'easy', completedAt: NOW - 5 * DAY_MS }),
      session({ difficulty: 'medium', completedAt: NOW - DAY_MS }),
    ]);
    expect(advanced[0]!.advancedDifficulty).toBe(true);

    const single = summariseActivities([session({ difficulty: 'hard' })]);
    expect(single[0]!.advancedDifficulty).toBe(false);

    const flat = summariseActivities([
      session({ difficulty: 'medium', completedAt: NOW - 5 * DAY_MS }),
      session({ difficulty: 'medium', completedAt: NOW - DAY_MS }),
    ]);
    expect(flat[0]!.advancedDifficulty).toBe(false);
  });
});

// ─── weeklyBuckets ──────────────────────────────────────────────────────────

describe('weeklyBuckets', () => {
  it('zero-fills the requested window, oldest first', () => {
    const buckets = weeklyBuckets([], 8, NOW);
    expect(buckets).toHaveLength(8);
    expect(buckets.every(b => b.count === 0)).toBe(true);
    expect(buckets[0]!.weekStart).toBeLessThan(buckets[7]!.weekStart);
  });

  it('counts sessions into the right rolling week', () => {
    const buckets = weeklyBuckets(
      [
        session({ completedAt: NOW - DAY_MS }),          // this week
        session({ completedAt: NOW - DAY_MS }),          // this week
        session({ completedAt: NOW - WEEK_MS - DAY_MS }), // last week
        session({ completedAt: NOW - 9 * WEEK_MS }),      // outside window
      ],
      8,
      NOW,
    );
    expect(buckets[7]!.count).toBe(2);
    expect(buckets[6]!.count).toBe(1);
    expect(buckets.reduce((a, b) => a + b.count, 0)).toBe(3);
  });
});

// ─── practiceWindows ────────────────────────────────────────────────────────

describe('practiceWindows', () => {
  it('splits last-7 / previous-7 and totals minutes', () => {
    const w = practiceWindows(
      [
        session({ completedAt: NOW - DAY_MS, durationMs: 120_000 }),
        session({ completedAt: NOW - 10 * DAY_MS, durationMs: 60_000 }),
        session({ completedAt: NOW - 30 * DAY_MS, durationMs: 60_000 }),
      ],
      NOW,
    );
    expect(w.last7).toBe(1);
    expect(w.prev7).toBe(1);
    expect(w.total).toBe(3);
    expect(w.totalMinutes).toBe(4);
  });
});

// ─── recentRuns ─────────────────────────────────────────────────────────────

describe('recentRuns', () => {
  it('filters to one activity, newest first, limited', () => {
    const runs = recentRuns(
      [
        session({ activityId: 'shape-match', completedAt: NOW - 3 * DAY_MS }),
        session({ activityId: 'shape-match', completedAt: NOW - DAY_MS }),
        session({ activityId: 'colour-pop', completedAt: NOW }),
      ],
      'shape-match',
      1,
    );
    expect(runs).toHaveLength(1);
    expect(runs[0]!.completedAt).toBe(NOW - DAY_MS);
  });
});

// ─── buildTherapistSummary ──────────────────────────────────────────────────

describe('buildTherapistSummary', () => {
  const titles = { 'shape-match': 'Shape Match', 'colour-pop': 'Colour Pop' };

  it('handles the empty case calmly', () => {
    const text = buildTherapistSummary([], { titles, now: NOW });
    expect(text).toContain('No completed activity runs recorded yet');
  });

  it('includes practice window, per-activity lines, and the closing note', () => {
    const text = buildTherapistSummary(
      [
        session({ activityId: 'shape-match', completedAt: NOW - DAY_MS, durationMs: 120_000 }),
        session({ activityId: 'colour-pop', completedAt: NOW - 2 * DAY_MS, difficulty: 'medium' }),
      ],
      { titles, now: NOW },
    );
    expect(text).toContain('TapTalk activity practice summary');
    expect(text).toContain('2 runs over the last 7 days');
    expect(text).toContain('Shape Match:');
    expect(text).toContain('Colour Pop:');
    expect(text).toContain('Difficulties: Medium.');
    expect(text).toContain('not a score');
  });

  it('scopes to one activity when asked', () => {
    const text = buildTherapistSummary(
      [
        session({ activityId: 'shape-match' }),
        session({ activityId: 'colour-pop' }),
      ],
      { titles, activityId: 'shape-match', now: NOW },
    );
    expect(text).toContain('Shape Match');
    expect(text).not.toContain('Colour Pop');
  });

  it('never uses score/streak/penalty language', () => {
    const text = buildTherapistSummary(
      [session({}), session({ incorrectCount: 3 })],
      { titles, now: NOW },
    );
    ['score', 'rank', 'streak', 'penalty', 'failed'].forEach(word => {
      // "not a score" is the single allowed mention, as a disclaimer.
      const stripped = text.replace('not a score', '');
      expect(stripped.toLowerCase()).not.toContain(word);
    });
  });
});
