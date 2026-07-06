/**
 * Crash-safe message buffer. Persists the sentence-being-built on every
 * change so an app kill mid-conversation does not erase the user's thought.
 *
 * Writes are atomic: temp file → rename. Reads survive a partial write by
 * validating JSON shape and rejecting entries older than STALE_MS.
 */
import * as FileSystem from 'expo-file-system';

const PATH = `${FileSystem.documentDirectory}message-buffer.json`;
const TMP = `${PATH}.tmp`;
const STALE_MS = 5 * 60 * 1000; // 5 minutes

export type BufferSnapshot = { ts: number; words: string[] };

export async function saveBuffer(words: string[]): Promise<void> {
  const payload: BufferSnapshot = { ts: Date.now(), words };
  try {
    await FileSystem.writeAsStringAsync(TMP, JSON.stringify(payload));
    await FileSystem.moveAsync({ from: TMP, to: PATH });
  } catch {
    // Best-effort persistence — never surface an error to the user for this.
  }
}

export async function loadBuffer(): Promise<BufferSnapshot | null> {
  try {
    const info = await FileSystem.getInfoAsync(PATH);
    if (!info.exists) return null;
    const raw = await FileSystem.readAsStringAsync(PATH);
    const parsed = JSON.parse(raw);
    if (
      typeof parsed?.ts !== 'number' ||
      !Array.isArray(parsed?.words) ||
      parsed.words.some((w: unknown) => typeof w !== 'string')
    ) {
      return null;
    }
    if (Date.now() - parsed.ts > STALE_MS) return null;
    return parsed as BufferSnapshot;
  } catch {
    return null;
  }
}

export async function clearBuffer(): Promise<void> {
  try {
    await FileSystem.deleteAsync(PATH, { idempotent: true });
  } catch {
    /* noop */
  }
}
