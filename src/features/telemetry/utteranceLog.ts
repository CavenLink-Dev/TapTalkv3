/**
 * Rolling utterance log. Every spoken sentence lands here so SLPs / caregivers
 * can review sessions and export a CSV without needing cloud sync.
 *
 * Storage:
 *   • Newest N lines live at `utterances.log` (NDJSON — one JSON object/line).
 *   • When the file exceeds MAX_BYTES it rotates: current → .1 → .2 → discarded.
 *   • CSV export is derived on demand; no denormalised copy.
 *
 * Never logs PII other than what the user chose to speak.
 */
import * as FileSystem from 'expo-file-system/legacy';

const PATH = `${FileSystem.documentDirectory}utterances.log`;
const ROTATED_1 = `${PATH}.1`;
const ROTATED_2 = `${PATH}.2`;
const MAX_BYTES = 512 * 1024;

export type UtteranceEntry = {
  ts: number;
  text: string;
  tiles: string[];
  mode?: 'word-by-word' | 'sentence';
};

export async function logUtterance(entry: Omit<UtteranceEntry, 'ts'>): Promise<void> {
  const line = JSON.stringify({ ts: Date.now(), ...entry }) + '\n';
  try {
    const info = await FileSystem.getInfoAsync(PATH);
    if (info.exists && (info.size ?? 0) > MAX_BYTES) {
      await FileSystem.deleteAsync(ROTATED_2, { idempotent: true });
      await FileSystem.moveAsync({ from: ROTATED_1, to: ROTATED_2 }).catch(() => undefined);
      await FileSystem.moveAsync({ from: PATH, to: ROTATED_1 }).catch(() => undefined);
    }
    const existing = info.exists ? await FileSystem.readAsStringAsync(PATH) : '';
    await FileSystem.writeAsStringAsync(PATH, existing + line);
  } catch {
    // best-effort only
  }
}

export async function readAllEntries(): Promise<UtteranceEntry[]> {
  const chunks: string[] = [];
  for (const p of [ROTATED_2, ROTATED_1, PATH]) {
    try {
      const info = await FileSystem.getInfoAsync(p);
      if (info.exists) chunks.push(await FileSystem.readAsStringAsync(p));
    } catch { /* skip */ }
  }
  const out: UtteranceEntry[] = [];
  for (const raw of chunks) {
    for (const line of raw.split('\n')) {
      if (!line.trim()) continue;
      try {
        const parsed = JSON.parse(line) as UtteranceEntry;
        if (typeof parsed.ts === 'number' && typeof parsed.text === 'string') out.push(parsed);
      } catch { /* skip malformed */ }
    }
  }
  return out;
}

export async function exportCsv(): Promise<string> {
  const rows = await readAllEntries();
  const header = 'timestamp,mode,text,tiles\n';
  const body = rows
    .map((r) => {
      const ts = new Date(r.ts).toISOString();
      const text = `"${r.text.replace(/"/g, '""')}"`;
      const tiles = `"${r.tiles.join('|')}"`;
      return `${ts},${r.mode ?? ''},${text},${tiles}`;
    })
    .join('\n');
  const out = `${FileSystem.cacheDirectory}taptalk-session-${Date.now()}.csv`;
  await FileSystem.writeAsStringAsync(out, header + body);
  return out;
}

export async function clearLog(): Promise<void> {
  for (const p of [PATH, ROTATED_1, ROTATED_2]) {
    await FileSystem.deleteAsync(p, { idempotent: true });
  }
}
