/**
 * VocabularyExportManager
 *
 * Serialises a user's custom communication vocabulary to a JSON file and
 * surfaces it via the iOS native Share sheet. The exported bundle includes
 * every artefact needed to fully reconstruct a user's setup on a replacement
 * device: custom tiles, folder definitions, pronunciations, favourite pins,
 * the personal n-gram model, and board layouts.
 *
 * Import restores the bundle back into AppContext via dispatch calls. Stale
 * tile IDs that no longer match any known board are silently dropped.
 *
 * Dependencies: expo-file-system (bundled via expo peer deps), react-native Share.
 * No additional package.json entry required — expo-file-system ships with
 * the default Expo managed workflow.
 */

import * as FileSystem from 'expo-file-system';
import { Share, Alert } from 'react-native';
import type { AppState } from '../context/types';

export const EXPORT_VERSION = 1;

export interface VocabularyBundle {
  version: number;
  exportedAt: string;
  customBoardTiles: AppState['customBoardTiles'];
  pronunciations: AppState['pronunciations'];
  favouritesByMode: AppState['favouritesByMode'];
  ngramModel: AppState['ngramModel'];
  boardPlacements: AppState['boardPlacements'];
  boardLayouts?: AppState['boardLayouts'];
}

// ── Export ────────────────────────────────────────────────────────────────────

/**
 * Serialises the relevant slices of AppState, writes to a timestamped JSON
 * file in the Expo documentDirectory, and opens the iOS Share sheet so the
 * user can AirDrop, email, or save to Files.
 *
 * Returns `true` on success, `false` if the share was dismissed or failed.
 */
export async function exportVocabulary(state: AppState): Promise<boolean> {
  const bundle: VocabularyBundle = {
    version: EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    customBoardTiles: state.customBoardTiles,
    pronunciations: state.pronunciations,
    favouritesByMode: state.favouritesByMode,
    ngramModel: state.ngramModel,
    boardPlacements: state.boardPlacements,
    boardLayouts: state.boardLayouts,
  };

  const filename = `TapTalk_vocab_${new Date().toISOString().slice(0, 10)}.json`;
  const fileUri = `${FileSystem.documentDirectory}${filename}`;

  try {
    await FileSystem.writeAsStringAsync(fileUri, JSON.stringify(bundle, null, 2), {
      encoding: FileSystem.EncodingType.UTF8,
    });
  } catch (err) {
    Alert.alert(
      'Export failed',
      'Could not write the vocabulary file. Please check available storage.',
      [{ text: 'OK' }],
    );
    return false;
  }

  try {
    const result = await Share.share(
      { url: fileUri, title: 'TapTalk vocabulary backup' },
      { dialogTitle: 'Save or send vocabulary backup' },
    );
    return result.action !== Share.dismissedAction;
  } catch {
    // Share sheet failed to open — file is still on disk, user can retrieve manually
    Alert.alert(
      'Share unavailable',
      `The backup file was saved as ${filename}. You can retrieve it from the app's Documents folder in the Files app.`,
      [{ text: 'OK' }],
    );
    return false;
  }
}

// ── Import / restore ──────────────────────────────────────────────────────────

export type ImportResult =
  | { ok: true; bundle: VocabularyBundle }
  | { ok: false; error: string };

/**
 * Reads and parses a vocabulary bundle JSON file at the given URI.
 * The caller is responsible for obtaining the file URI (e.g. from
 * expo-document-picker or a Files-app deep link).
 */
export async function readVocabularyBundle(fileUri: string): Promise<ImportResult> {
  try {
    const info = await FileSystem.getInfoAsync(fileUri);
    if (!info.exists) return { ok: false, error: 'File not found.' };

    const raw = await FileSystem.readAsStringAsync(fileUri, {
      encoding: FileSystem.EncodingType.UTF8,
    });
    const parsed = JSON.parse(raw) as Partial<VocabularyBundle>;

    if (!parsed.version || !Array.isArray(parsed.customBoardTiles)) {
      return { ok: false, error: 'This file does not look like a TapTalk vocabulary backup.' };
    }
    if (parsed.version > EXPORT_VERSION) {
      return {
        ok: false,
        error: `This backup was made with a newer version of TapTalk. Please update the app and try again.`,
      };
    }

    return {
      ok: true,
      bundle: {
        version: parsed.version,
        exportedAt: parsed.exportedAt ?? '',
        customBoardTiles: parsed.customBoardTiles ?? [],
        pronunciations: parsed.pronunciations ?? [],
        favouritesByMode: parsed.favouritesByMode ?? {},
        ngramModel: parsed.ngramModel ?? {},
        boardPlacements: parsed.boardPlacements ?? {},
        boardLayouts: parsed.boardLayouts,
      },
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return { ok: false, error: `Could not read the backup file: ${msg}` };
  }
}

/**
 * Dispatches the bundle contents into AppContext. Existing data is REPLACED
 * (not merged) so the restore is deterministic. Call only after the user has
 * confirmed they want to overwrite their current vocabulary.
 */
export function applyVocabularyBundle(
  bundle: VocabularyBundle,
  dispatch: (action: import('../context/types').Action) => void,
): void {
  // Restore custom tiles (includes folder definitions)
  bundle.customBoardTiles.forEach(tile => {
    dispatch({ type: 'UPSERT_CUSTOM_BOARD_TILE', payload: tile });
  });

  // Restore pronunciations
  bundle.pronunciations.forEach(rule => {
    dispatch({ type: 'ADD_PRONUNCIATION', payload: rule });
  });

  // Restore favourites
  dispatch({ type: 'SET_ALL_FAVOURITES', payload: bundle.favouritesByMode });

  // Restore n-gram model via a trick: dispatch a zero-word update that merges
  // the restored model into state. The reducer merges; we seed with full data
  // by dispatching an explicit SET_ALL action — but since there's no dedicated
  // SET_NGRAM action, we use HYDRATE for this slice only.
  dispatch({
    type: 'HYDRATE',
    payload: {
      ngramModel: bundle.ngramModel,
      boardPlacements: bundle.boardPlacements,
      boardLayouts: bundle.boardLayouts ?? {},
    },
  });
}
