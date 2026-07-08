/**
 * VocabularyBackupSection
 *
 * Rendered inside Board Settings. Provides Export and Import/Restore buttons
 * for the user's custom vocabulary bundle. Uses expo-file-system + Share for
 * export; guides the user through a URI-paste flow for import since
 * expo-document-picker is not in the project dependencies.
 *
 * Safeguard rule: Import is always gated behind a confirmation Alert that
 * explains current vocabulary will be overwritten.
 */

import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useAppContext } from '../../hooks/useAppContext';
import { useTheme } from '../../theme/useTheme';
import { radii, spacing, typography } from '../../theme/tokens';
import { hapticSuccess, hapticError } from '../../utils/haptics';
import {
  exportVocabulary,
  readVocabularyBundle,
  applyVocabularyBundle,
} from '../../utils/vocabularyExport';
import * as FileSystem from 'expo-file-system/legacy';

export function VocabularyBackupSection() {
  const { state, dispatch } = useAppContext();
  const t = useTheme();
  const [exportBusy, setExportBusy] = useState(false);
  const [importBusy, setImportBusy] = useState(false);
  // URI input for direct-restore from Files (user pastes/types the file path)
  const [importUri, setImportUri] = useState('');
  const [showUriInput, setShowUriInput] = useState(false);

  // ── Export ──────────────────────────────────────────────────────────────
  const handleExport = useCallback(async () => {
    setExportBusy(true);
    try {
      await exportVocabulary(state);
      hapticSuccess();
    } finally {
      setExportBusy(false);
    }
  }, [state]);

  // ── Import ──────────────────────────────────────────────────────────────
  const handleImportFromUri = useCallback(async (uri: string) => {
    if (!uri.trim()) return;
    setImportBusy(true);
    try {
      const result = await readVocabularyBundle(uri.trim());
      if (!result.ok) {
        hapticError();
        Alert.alert('Import failed', result.error, [{ text: 'OK' }]);
        return;
      }

      const { bundle } = result;
      const tileCount = bundle.customBoardTiles.length;
      const date = bundle.exportedAt ? new Date(bundle.exportedAt).toLocaleDateString() : 'unknown date';

      Alert.alert(
        'Restore vocabulary?',
        `This backup from ${date} contains ${tileCount} custom tile${tileCount !== 1 ? 's' : ''}.\n\nYour current vocabulary will be replaced. This cannot be undone.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Restore',
            style: 'destructive',
            onPress: () => {
              applyVocabularyBundle(bundle, dispatch);
              hapticSuccess();
              setShowUriInput(false);
              setImportUri('');
              Alert.alert('Restored', 'Your vocabulary has been restored. Restart the board to see all changes.', [{ text: 'OK' }]);
            },
          },
        ],
      );
    } finally {
      setImportBusy(false);
    }
  }, [dispatch]);

  // Look for the most recent TapTalk backup in documentDirectory — lets users
  // restore without copy-pasting a URI if they exported to this device.
  const handleFindLatestBackup = useCallback(async () => {
    setImportBusy(true);
    try {
      const dir = FileSystem.documentDirectory ?? '';
      const files = await FileSystem.readDirectoryAsync(dir);
      const backups = files
        .filter(f => f.startsWith('TapTalk_vocab_') && f.endsWith('.json'))
        .sort()
        .reverse();
      if (backups.length === 0) {
        Alert.alert('No backups found', 'No TapTalk vocabulary backups were found in the app Documents folder. Use Export to create one, then share it back to yourself.', [{ text: 'OK' }]);
        return;
      }
      const latest = dir + backups[0];
      await handleImportFromUri(latest);
    } catch {
      Alert.alert('Search failed', 'Could not read the app Documents folder.', [{ text: 'OK' }]);
    } finally {
      setImportBusy(false);
    }
  }, [handleImportFromUri]);

  return (
    <View style={styles.container}>
      <Text style={[styles.sectionTitle, { color: t.colors.text }]}>
        Vocabulary Backup
      </Text>
      <Text style={[styles.description, { color: t.colors.textMuted }]}>
        Back up your custom tiles, folders, pronunciations, and word prediction model. Share to email, AirDrop, or Files so you can restore on any device.
      </Text>

      {/* Export */}
      <Pressable
        onPress={handleExport}
        disabled={exportBusy}
        style={({ pressed }) => [
          styles.button,
          { backgroundColor: t.colors.primary },
          pressed && styles.buttonPressed,
        ]}
        accessibilityRole="button"
        accessibilityLabel="Export vocabulary backup"
        accessibilityHint="Creates a backup file and opens the share sheet"
      >
        {exportBusy ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Export Backup</Text>
        )}
      </Pressable>

      {/* Import — find latest on device */}
      <Pressable
        onPress={handleFindLatestBackup}
        disabled={importBusy}
        style={({ pressed }) => [
          styles.button,
          { backgroundColor: t.colors.surface, borderWidth: 1, borderColor: t.colors.border },
          pressed && styles.buttonPressed,
        ]}
        accessibilityRole="button"
        accessibilityLabel="Restore latest backup from this device"
        accessibilityHint="Finds the most recent TapTalk backup saved to this device and restores it"
      >
        {importBusy ? (
          <ActivityIndicator color={t.colors.primary} />
        ) : (
          <Text style={[styles.buttonText, { color: t.colors.primary }]}>Restore from Device</Text>
        )}
      </Pressable>

      {/* Manual URI entry — advanced path for AirDrop / Files app recipients */}
      <Pressable
        onPress={() => setShowUriInput(v => !v)}
        style={styles.advancedToggle}
        accessibilityRole="button"
        accessibilityLabel={showUriInput ? 'Hide file path entry' : 'Restore from file path'}
      >
        <Text style={[styles.advancedToggleText, { color: t.colors.textMuted }]}>
          {showUriInput ? 'Hide file path ▲' : 'Restore from file path ▼'}
        </Text>
      </Pressable>

      {showUriInput && (
        <View style={styles.uriRow}>
          <TextInput
            style={[
              styles.uriInput,
              { color: t.colors.text, backgroundColor: t.colors.inputBg, borderColor: t.colors.border },
            ]}
            value={importUri}
            onChangeText={setImportUri}
            placeholder="file:///…/TapTalk_vocab_2026-07-01.json"
            placeholderTextColor={t.colors.textTertiary}
            autoCapitalize="none"
            autoCorrect={false}
            accessibilityLabel="Backup file path"
          />
          <Pressable
            onPress={() => handleImportFromUri(importUri)}
            disabled={!importUri.trim() || importBusy}
            style={({ pressed }) => [
              styles.uriRestoreButton,
              { backgroundColor: t.colors.primary },
              pressed && styles.buttonPressed,
              (!importUri.trim() || importBusy) && styles.buttonDisabled,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Restore from this path"
          >
            <Text style={styles.buttonText}>Restore</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.body,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  description: {
    fontSize: typography.callout,
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  button: {
    height: 50,
    borderRadius: radii.button,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  buttonPressed: {
    opacity: 0.7,
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  buttonText: {
    fontSize: typography.body,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  advancedToggle: {
    paddingVertical: spacing.xs,
    alignSelf: 'flex-start',
  },
  advancedToggleText: {
    fontSize: typography.callout,
  },
  uriRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xs,
    alignItems: 'center',
  },
  uriInput: {
    flex: 1,
    height: 44,
    borderWidth: 1,
    borderRadius: radii.input,
    paddingHorizontal: spacing.sm,
    fontSize: typography.caption,
  },
  uriRestoreButton: {
    height: 44,
    paddingHorizontal: spacing.md,
    borderRadius: radii.button,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
