import { openSymbolBrainDatabase } from '../database';
import { PreferenceSelectedBy, UserSymbolPreference } from '../../../features/symbol-brain/types';

export async function getPreferencesForUser(userId: string): Promise<UserSymbolPreference[]> {
  const db = await openSymbolBrainDatabase();
  return db.getAllAsync<UserSymbolPreference>(
    `SELECT * FROM user_symbol_preferences
      WHERE user_id = ?
      ORDER BY preference_score DESC, last_used_at DESC`,
    userId,
  );
}

export async function getPreferenceForConcept(
  userId: string,
  conceptId: string,
): Promise<UserSymbolPreference | null> {
  const db = await openSymbolBrainDatabase();
  return db.getFirstAsync<UserSymbolPreference>(
    `SELECT * FROM user_symbol_preferences
      WHERE user_id = ? AND concept_id = ?
      ORDER BY preference_score DESC, last_used_at DESC
      LIMIT 1`,
    userId,
    conceptId,
  );
}

export async function saveUserSymbolPreference(input: {
  userId: string;
  conceptId: string;
  preferredSymbolId: string;
  selectedBy: PreferenceSelectedBy;
}) {
  const db = await openSymbolBrainDatabase();
  const id = `${input.userId}:${input.conceptId}:${input.preferredSymbolId}`;
  const now = new Date().toISOString();
  await db.runAsync(
    `INSERT INTO user_symbol_preferences
      (id, user_id, concept_id, preferred_symbol_id, preference_score, last_used_at, selected_by)
     VALUES (?, ?, ?, ?, 1.0, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       preference_score = preference_score + 0.1,
       last_used_at = excluded.last_used_at,
       selected_by = excluded.selected_by`,
    id,
    input.userId,
    input.conceptId,
    input.preferredSymbolId,
    now,
    input.selectedBy,
  );
}
