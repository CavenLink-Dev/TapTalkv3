import * as SQLite from 'expo-sqlite';
import {
  SYMBOL_BRAIN_DB_VERSION,
  SYMBOL_BRAIN_MIGRATIONS,
} from './migrations';

export type TapTalkDatabase = SQLite.SQLiteDatabase;

const DB_NAME = 'taptalk_symbol_brain.db';
let databasePromise: Promise<TapTalkDatabase> | null = null;

async function getUserVersion(db: TapTalkDatabase): Promise<number> {
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  return row?.user_version ?? 0;
}

async function setUserVersion(db: TapTalkDatabase, version: number) {
  await db.execAsync(`PRAGMA user_version = ${version};`);
}

export async function openSymbolBrainDatabase(): Promise<TapTalkDatabase> {
  if (!databasePromise) {
    databasePromise = SQLite.openDatabaseAsync(DB_NAME).then(async (db) => {
      await migrateSymbolBrainDatabase(db);
      return db;
    });
  }
  return databasePromise;
}

export async function migrateSymbolBrainDatabase(db: TapTalkDatabase) {
  const currentVersion = await getUserVersion(db);
  if (currentVersion >= SYMBOL_BRAIN_DB_VERSION) return;

  for (let index = currentVersion; index < SYMBOL_BRAIN_MIGRATIONS.length; index += 1) {
    const migration = SYMBOL_BRAIN_MIGRATIONS[index];
    if (migration) {
      await db.execAsync(migration);
    }
  }
  await setUserVersion(db, SYMBOL_BRAIN_DB_VERSION);
}

export async function resetSymbolBrainDatabaseForDev() {
  if (!__DEV__) return;
  const db = await openSymbolBrainDatabase();
  await db.execAsync(`
    DELETE FROM symbols;
    DELETE FROM concepts;
    DELETE FROM keywords;
    DELETE FROM symbol_tags;
    DELETE FROM user_symbol_preferences;
    DELETE FROM search_history;
    DELETE FROM licence_attribution;
    DELETE FROM derived_symbols;
    DELETE FROM custom_symbols;
  `);
}
