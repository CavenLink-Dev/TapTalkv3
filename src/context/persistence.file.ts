/**
 * File-backed cold persistence with rotating backups.
 *
 *   ${docs}/state/cold.v3.json         ← current
 *   ${docs}/state/cold.v3.bak1.json    ← previous save
 *   ${docs}/state/cold.v3.bak2.json    ← two saves ago
 *
 * Reads fall through to the most recent readable file, so a corrupt current
 * save auto-recovers from bak1. Writes are atomic (tmp → move).
 *
 * Wire from src/context/AppContext.tsx:
 *   - Replace the AsyncStorage read of COLD_STORAGE_KEY with `loadCold()`.
 *   - Replace the AsyncStorage write with `saveCold(state)`.
 *   - Migrate on first launch: read from AsyncStorage once, saveCold(), then
 *     delete the legacy key.
 */
import * as FileSystem from 'expo-file-system/legacy';
import type { ColdPersistedState } from './persistence';

const SCHEMA_VERSION = 3;
const DIR = `${FileSystem.documentDirectory}state/`;
const CURRENT = `${DIR}cold.v${SCHEMA_VERSION}.json`;
const BAK1 = `${DIR}cold.v${SCHEMA_VERSION}.bak1.json`;
const BAK2 = `${DIR}cold.v${SCHEMA_VERSION}.bak2.json`;
const TMP = `${CURRENT}.tmp`;

type Envelope = {
  version: number;
  savedAt: number;
  state: ColdPersistedState;
};

export async function saveCold(state: ColdPersistedState): Promise<void> {
  await FileSystem.makeDirectoryAsync(DIR, { intermediates: true });
  const envelope: Envelope = { version: SCHEMA_VERSION, savedAt: Date.now(), state };
  await FileSystem.writeAsStringAsync(TMP, JSON.stringify(envelope));

  const currentExists = (await FileSystem.getInfoAsync(CURRENT)).exists;
  if (currentExists) {
    // rotate bak1 → bak2, current → bak1, tmp → current
    await FileSystem.deleteAsync(BAK2, { idempotent: true });
    await FileSystem.moveAsync({ from: BAK1, to: BAK2 }).catch(() => undefined);
    await FileSystem.moveAsync({ from: CURRENT, to: BAK1 }).catch(() => undefined);
  }
  await FileSystem.moveAsync({ from: TMP, to: CURRENT });
}

export async function loadCold(): Promise<ColdPersistedState | null> {
  for (const path of [CURRENT, BAK1, BAK2]) {
    const parsed = await tryReadEnvelope(path);
    if (parsed && parsed.version === SCHEMA_VERSION) return parsed.state;
  }
  return null;
}

export type BackupEntry = { path: string; savedAt: number; label: 'current' | 'bak1' | 'bak2' };

export async function listBackups(): Promise<BackupEntry[]> {
  const out: BackupEntry[] = [];
  const entries: [string, BackupEntry['label']][] = [
    [CURRENT, 'current'],
    [BAK1, 'bak1'],
    [BAK2, 'bak2'],
  ];
  for (const [path, label] of entries) {
    const env = await tryReadEnvelope(path);
    if (env) out.push({ path, label, savedAt: env.savedAt });
  }
  return out;
}

export async function restoreFrom(path: string): Promise<ColdPersistedState | null> {
  const env = await tryReadEnvelope(path);
  if (!env) return null;
  await saveCold(env.state); // promotes the chosen backup to current (rotates)
  return env.state;
}

async function tryReadEnvelope(path: string): Promise<Envelope | null> {
  try {
    const info = await FileSystem.getInfoAsync(path);
    if (!info.exists) return null;
    const raw = await FileSystem.readAsStringAsync(path);
    const parsed = JSON.parse(raw) as Envelope;
    if (typeof parsed?.version !== 'number' || !parsed.state) return null;
    return parsed;
  } catch {
    return null;
  }
}
