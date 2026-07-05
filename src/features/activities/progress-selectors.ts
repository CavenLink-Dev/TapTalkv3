/**
 * Progress selectors — pure aggregation over ActivitySession records.
 *
 * No React, no store writes: every function takes sessions in and returns
 * derived data out, so the overview screen, the detail screen, and the
 * therapist export all share one tested source of truth.
 *
 * Tone rules (locked): calm, observational, non-judgmental. Positive
 * signals are surfaced only when clearly present; otherwise we say
 * nothing (mirrors the original `independenceTrend` behaviour). Never
 * scores, ranks, streaks, or penalty language.
 */

import type { ActivitySession, SessionDifficulty } from './progress-store';

export const DAY_MS = 24 * 60 * 60 * 1000;
export const WEEK_MS = 7 * DAY_MS;

const DIFFICULTY_ORDER: SessionDifficulty[] = ['easy', 'medium', 'hard'];

// ─── Format helpers ─────────────────────────────────────────────────────────

/** "Easy" | "Medium" | "Hard" */
export function difficultyLabel(d: SessionDifficulty): string {
  return d.charAt(0).toUpperCase() + d.slice(1);
}

/** Calm duration: "<1 min", "4 min", "1 hr 5 min". */
export function formatDuration(ms: number): string {
  const minutes = Math.round(ms / 60000);
  if (minutes < 1) return '<1 min';
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours} hr` : `${hours} hr ${rest} min`;
}

/** "Today", "Yesterday", "3 days ago", "2 weeks ago". */
export function relativeDay(ts: number, now: number = Date.now()): string {
  const days = Math.floor((now - ts) / DAY_MS);
  if (days <= 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  const weeks = Math.floor(days / 7);
  return weeks === 1 ? '1 week ago' : `${weeks} weeks ago`;
}

// ─── Per-activity summaries ─────────────────────────────────────────────────

export interface ActivityProgressSummary {
  activityId: string;
  /** Sessions oldest-first (stable for trend maths). */
  sessions: ActivitySession[];
  runCount: number;
  lastAt: number;
  /** Difficulties covered at least once, in easy→hard order. */
  difficulties: SessionDifficulty[];
  /** Highest difficulty completed at least once. */
  highestDifficulty: SessionDifficulty;
  /** Total time practised across all runs (ms). */
  totalDurationMs: number;
  /** Retries per level, recent half vs earlier half. Null when unclear. */
  retryTrend: 'steadier' | null;
  /** True when a recent run used a harder difficulty than the first runs. */
  advancedDifficulty: boolean;
}

/**
 * Group sessions by activity and derive calm per-activity summaries,
 * ordered by most recently practised.
 */
export function summariseActivities(sessions: ActivitySession[]): ActivityProgressSummary[] {
  const byActivity = new Map<string, ActivitySession[]>();
  sessions.forEach(s => {
    const list = byActivity.get(s.activityId) ?? [];
    list.push(s);
    byActivity.set(s.activityId, list);
  });

  return [...byActivity.entries()]
    .map(([activityId, list]) => {
      const sorted = [...list].sort((a, b) => a.completedAt - b.completedAt);
      const last = sorted[sorted.length - 1]!;

      // Retry trend — only surfaced when clearly positive (≥25% fewer
      // retries per level in the recent half, with 4+ runs of signal).
      let retryTrend: ActivityProgressSummary['retryTrend'] = null;
      if (sorted.length >= 4) {
        const mid = Math.floor(sorted.length / 2);
        const rate = (xs: ActivitySession[]) =>
          xs.reduce((sum, s) => sum + s.incorrectCount / Math.max(1, s.totalLevels), 0) / xs.length;
        const early = rate(sorted.slice(0, mid));
        const recent = rate(sorted.slice(mid));
        if (recent < early * 0.75) retryTrend = 'steadier';
      }

      const rank = (d: SessionDifficulty) => DIFFICULTY_ORDER.indexOf(d);
      const covered = DIFFICULTY_ORDER.filter(d => sorted.some(s => s.difficulty === d));
      const highestDifficulty = covered[covered.length - 1] ?? sorted[0]!.difficulty;

      // Difficulty progression — conservative: the FIRST run's difficulty
      // vs the highest difficulty seen in the most recent half. Needs 2+
      // runs so a single hard run doesn't over-claim.
      let advancedDifficulty = false;
      if (sorted.length >= 2) {
        const firstRank = rank(sorted[0]!.difficulty);
        const recentHalf = sorted.slice(Math.floor(sorted.length / 2));
        const recentBest = Math.max(...recentHalf.map(s => rank(s.difficulty)));
        advancedDifficulty = recentBest > firstRank;
      }

      return {
        activityId,
        sessions: sorted,
        runCount: sorted.length,
        lastAt: last.completedAt,
        difficulties: covered,
        highestDifficulty,
        totalDurationMs: sorted.reduce((sum, s) => sum + Math.max(0, s.durationMs), 0),
        retryTrend,
        advancedDifficulty,
      };
    })
    .sort((a, b) => b.lastAt - a.lastAt);
}

// ─── Weekly practice strip ──────────────────────────────────────────────────

export interface WeekBucket {
  /** Epoch ms of the bucket's start (aligned to whole weeks before `now`). */
  weekStart: number;
  /** Completed runs in this week. */
  count: number;
}

/**
 * Zero-filled buckets for the most recent `weeks` weeks, oldest-first,
 * so the strip reads left → right = past → now. Week boundaries are
 * rolling 7-day windows anchored at `now` (calm and timezone-neutral —
 * no calendar-week pedantry for a practice picture).
 */
export function weeklyBuckets(
  sessions: ActivitySession[],
  weeks = 8,
  now: number = Date.now(),
): WeekBucket[] {
  const buckets: WeekBucket[] = [];
  for (let i = weeks - 1; i >= 0; i -= 1) {
    const start = now - (i + 1) * WEEK_MS;
    const end = now - i * WEEK_MS;
    buckets.push({
      weekStart: start,
      count: sessions.filter(s => s.completedAt > start && s.completedAt <= end).length,
    });
  }
  return buckets;
}

// ─── Practice windows (summary card) ────────────────────────────────────────

export interface PracticeWindows {
  last7: number;
  prev7: number;
  total: number;
  /** Whole minutes practised across all recorded runs. */
  totalMinutes: number;
}

export function practiceWindows(
  sessions: ActivitySession[],
  now: number = Date.now(),
): PracticeWindows {
  const last7 = sessions.filter(s => now - s.completedAt < WEEK_MS).length;
  const prev7 = sessions.filter(s => {
    const age = now - s.completedAt;
    return age >= WEEK_MS && age < 2 * WEEK_MS;
  }).length;
  const totalMs = sessions.reduce((sum, s) => sum + Math.max(0, s.durationMs), 0);
  return {
    last7,
    prev7,
    total: sessions.length,
    totalMinutes: Math.round(totalMs / 60000),
  };
}

// ─── Recent runs (detail screen) ────────────────────────────────────────────

export interface RecentRun {
  completedAt: number;
  difficulty: SessionDifficulty;
  incorrectCount: number;
  totalLevels: number;
  durationMs: number;
}

/** Newest-first recent runs for one activity. */
export function recentRuns(
  sessions: ActivitySession[],
  activityId: string,
  limit = 10,
): RecentRun[] {
  return sessions
    .filter(s => s.activityId === activityId)
    .sort((a, b) => b.completedAt - a.completedAt)
    .slice(0, limit)
    .map(({ completedAt, difficulty, incorrectCount, totalLevels, durationMs }) => ({
      completedAt, difficulty, incorrectCount, totalLevels, durationMs,
    }));
}

// ─── Therapist export ───────────────────────────────────────────────────────

export interface TherapistSummaryMeta {
  /** activityId → display title (falls back to the raw id). */
  titles: Record<string, string>;
  /** Restrict the summary to one activity (detail-screen share). */
  activityId?: string;
  now?: number;
}

/**
 * Multi-line plain-text practice summary for sharing with a therapist.
 * Observation tone throughout; explicitly framed as not a score.
 */
export function buildTherapistSummary(
  sessions: ActivitySession[],
  meta: TherapistSummaryMeta,
): string {
  const now = meta.now ?? Date.now();
  const scoped = meta.activityId
    ? sessions.filter(s => s.activityId === meta.activityId)
    : sessions;

  const titleFor = (id: string) => meta.titles[id] ?? id;
  const header = meta.activityId
    ? `TapTalk activity practice — ${titleFor(meta.activityId)}`
    : 'TapTalk activity practice summary';

  if (scoped.length === 0) {
    return `${header}\n\nNo completed activity runs recorded yet.`;
  }

  const first = Math.min(...scoped.map(s => s.completedAt));
  const fmtDate = (ts: number) => new Date(ts).toLocaleDateString();
  const windows = practiceWindows(scoped, now);

  const lines: string[] = [
    header,
    `${fmtDate(first)} – ${fmtDate(now)}`,
    '',
    `Practice: ${windows.last7} run${windows.last7 === 1 ? '' : 's'} over the last 7 days; ` +
      `${windows.total} total (about ${formatDuration(windows.totalMinutes * 60000)} practised).`,
    '',
  ];

  summariseActivities(scoped).forEach(sum => {
    lines.push(`${titleFor(sum.activityId)}:`);
    lines.push(
      `  ${sum.runCount} run${sum.runCount === 1 ? '' : 's'}, ` +
        `${formatDuration(sum.totalDurationMs)} practised, ` +
        `last ${relativeDay(sum.lastAt, now).toLowerCase()}.`,
    );
    lines.push(`  Difficulties: ${sum.difficulties.map(difficultyLabel).join(', ')}.`);
    if (sum.retryTrend === 'steadier') {
      lines.push('  Observation: fewer retries in recent runs — answers are getting steadier.');
    }
    if (sum.advancedDifficulty) {
      lines.push(`  Observation: now practising ${difficultyLabel(sum.highestDifficulty)}.`);
    }
    lines.push('');
  });

  lines.push('This is a picture of practice over time, not a score.');
  return lines.join('\n');
}
