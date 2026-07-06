/**
 * SymbolPackBrowser — hierarchical folder browser for curated Symbol Packs
 * inside Add Symbol (Rules 1, 5, 27 — simple root, drill-down detail).
 */
import React, { useCallback, useMemo } from 'react';
import { Alert, LayoutAnimation, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  SYMBOL_PACK_ROOT,
  SymbolPackFolder,
  SymbolPackNode,
  SymbolPackSymbol,
  packFolderSubtitle,
  resolvePackFolder,
} from '../../data/symbolPacks';
import { MulberrySymbol } from '../symbols/MulberrySymbol';
import { ThemedText } from '../native/ThemedText';
import { useTheme } from '../../theme/useTheme';
import { radii, spacing } from '../../theme/tokens';
import { fonts } from '../../theme/fonts';
import { hapticSelection } from '../../utils/haptics';

interface Props {
  folderPath: string[];
  onFolderPathChange: (path: string[]) => void;
  onSelectSymbol: (entry: SymbolPackSymbol) => void;
  reduceMotion: boolean;
  /**
   * Bulk-import hook (Phase 1 — Symbol Pack Bulk Add). Fires with the tapped
   * folder so the host can spin up matching board(s), folder tiles, and
   * symbol tiles in one atomic import. Falls back to the single-symbol flow
   * when this is omitted so the browser stays useful in read-only contexts.
   */
  onImportFolder?: (folder: SymbolPackFolder) => void;
}

/** Recursively tallies folder / symbol counts for the contextual peek. */
function countPackDescendants(folder: SymbolPackFolder): { folders: number; symbols: number } {
  let folders = 0;
  let symbols = 0;
  const walk = (node: SymbolPackNode) => {
    if (node.type === 'folder') {
      folders += 1;
      node.children.forEach(walk);
    } else {
      symbols += 1;
    }
  };
  folder.children.forEach(walk);
  return { folders, symbols };
}

/** First N leaf-symbol labels for the peek preview (Rule 22). */
function previewSymbolLabels(folder: SymbolPackFolder, max = 6): string[] {
  const labels: string[] = [];
  const walk = (node: SymbolPackNode): boolean => {
    if (labels.length >= max) return true;
    if (node.type === 'symbol') {
      labels.push(node.label);
      return labels.length >= max;
    }
    for (const child of node.children) if (walk(child)) return true;
    return false;
  };
  folder.children.forEach(walk);
  return labels;
}

function splitChildren(children: SymbolPackNode[]) {
  const folders: SymbolPackFolder[] = [];
  const symbols: SymbolPackSymbol[] = [];
  for (const child of children) {
    if (child.type === 'folder') folders.push(child);
    else symbols.push(child);
  }
  return { folders, symbols };
}

export function SymbolPackBrowser({
  folderPath,
  onFolderPathChange,
  onSelectSymbol,
  reduceMotion,
  onImportFolder,
}: Props) {
  const t = useTheme();

  const currentFolder = useMemo(
    () => (folderPath.length === 0 ? null : resolvePackFolder(folderPath)),
    [folderPath],
  );

  const { folders, symbols } = useMemo(() => {
    if (currentFolder) return splitChildren(currentFolder.children);
    return { folders: SYMBOL_PACK_ROOT, symbols: [] as SymbolPackSymbol[] };
  }, [currentFolder]);

  const animate = useCallback(() => {
    if (!reduceMotion) {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    }
  }, [reduceMotion]);

  const handleOpenFolder = useCallback((folder: SymbolPackFolder) => {
    hapticSelection();
    animate();
    onFolderPathChange([...folderPath, folder.id]);
  }, [animate, folderPath, onFolderPathChange]);

  const handleBack = useCallback(() => {
    hapticSelection();
    animate();
    onFolderPathChange(folderPath.slice(0, -1));
  }, [animate, folderPath, onFolderPathChange]);

  const handleSymbolTap = useCallback((entry: SymbolPackSymbol) => {
    hapticSelection();
    onSelectSymbol(entry);
  }, [onSelectSymbol]);

  // Bulk-import a whole folder (root call — direct button on the current folder).
  const handleImportCurrent = useCallback(() => {
    if (!onImportFolder || !currentFolder) return;
    hapticSelection();
    onImportFolder(currentFolder);
  }, [currentFolder, onImportFolder]);

  // Long-press peek — Rule 22 contextual menu preview. Native Alert keeps
  // the touch target unambiguous, works with VoiceOver, and offers an
  // Import action in-place so users don't have to drill in and back out.
  const handleFolderPeek = useCallback((folder: SymbolPackFolder) => {
    if (!onImportFolder) return;
    hapticSelection();
    const { folders, symbols } = countPackDescendants(folder);
    const preview = previewSymbolLabels(folder);
    const body =
      `${folders} folder${folders === 1 ? '' : 's'}, ${symbols} symbol${symbols === 1 ? '' : 's'}` +
      (preview.length > 0 ? `\n\nIncludes: ${preview.join(', ')}${symbols > preview.length ? '…' : ''}` : '');
    Alert.alert(folder.label, body, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Open', onPress: () => handleOpenFolder(folder) },
      {
        text: 'Import folder',
        style: 'default',
        onPress: () => onImportFolder(folder),
      },
    ]);
  }, [handleOpenFolder, onImportFolder]);

  // Row-level bulk add — the trailing `+` on each folder tile. Isolated so
  // it doesn't fire the folder-open Pressable underneath.
  const handleImportRow = useCallback((folder: SymbolPackFolder) => {
    if (!onImportFolder) return;
    hapticSelection();
    onImportFolder(folder);
  }, [onImportFolder]);

  const renderFolderRow = (folder: SymbolPackFolder) => (
    <Pressable
      key={folder.id}
      accessibilityRole="button"
      accessibilityLabel={`Open ${folder.label} folder, ${packFolderSubtitle(folder)}`}
      accessibilityHint={onImportFolder ? 'Long press to preview or import the whole folder' : undefined}
      onPress={() => handleOpenFolder(folder)}
      onLongPress={onImportFolder ? () => handleFolderPeek(folder) : undefined}
      delayLongPress={350}
      style={({ pressed }) => [
        styles.folderCell,
        { backgroundColor: pressed ? t.colors.inputBg : t.colors.surface },
      ]}
    >
      <View style={styles.folderIcon}>
        {folder.iconId ? (
          <MulberrySymbol symbolId={folder.iconId} size={36} />
        ) : (
          <Ionicons name="folder-outline" size={28} color={t.colors.primary} />
        )}
      </View>
      <View style={styles.folderText}>
        <ThemedText variant="callout" color={t.colors.text} style={styles.folderLabel}>
          {folder.label}
        </ThemedText>
        <ThemedText variant="caption" color={t.colors.textMuted}>
          {packFolderSubtitle(folder)}
        </ThemedText>
      </View>
      {onImportFolder ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Import ${folder.label} folder and all nested symbols`}
          onPress={() => handleImportRow(folder)}
          hitSlop={12}
          style={({ pressed }) => [
            styles.importBadge,
            { backgroundColor: pressed ? t.colors.selectionBg : t.colors.inputBg },
          ]}
        >
          <Ionicons name="add" size={22} color={t.colors.primary} />
        </Pressable>
      ) : (
        <Ionicons name="chevron-forward" size={18} color={t.colors.textTertiary} />
      )}
    </Pressable>
  );

  const renderSymbolGrid = (items: SymbolPackSymbol[]) => (
    <View style={styles.symbolGrid}>
      {items.map(entry => (
        <Pressable
          key={`${entry.symbolId}-${entry.label}`}
          accessibilityRole="button"
          accessibilityLabel={`Select symbol ${entry.label}`}
          onPress={() => handleSymbolTap(entry)}
          style={({ pressed }) => [
            styles.symbolCell,
            { backgroundColor: pressed ? t.colors.inputBg : t.colors.surface },
          ]}
        >
          <MulberrySymbol symbolId={entry.symbolId} size={40} />
          <ThemedText variant="caption" color={t.colors.text} numberOfLines={1} style={styles.symbolLabel}>
            {entry.label}
          </ThemedText>
        </Pressable>
      ))}
    </View>
  );

  const renderSymbolRows = (items: SymbolPackSymbol[]) => (
    items.map(entry => (
      <Pressable
        key={`${entry.symbolId}-${entry.label}`}
        accessibilityRole="button"
        accessibilityLabel={`Select symbol ${entry.label}`}
        onPress={() => handleSymbolTap(entry)}
        style={({ pressed }) => [
          styles.symbolRow,
          { backgroundColor: pressed ? t.colors.inputBg : t.colors.surface },
        ]}
      >
        <View style={styles.symbolIcon}>
          <MulberrySymbol symbolId={entry.symbolId} size={44} />
        </View>
        <ThemedText variant="callout" color={t.colors.text} style={styles.symbolRowLabel}>
          {entry.label}
        </ThemedText>
        <Ionicons name="chevron-forward" size={18} color={t.colors.textTertiary} />
      </Pressable>
    ))
  );

  const useGridForSymbols =
    symbols.length > 0 &&
    folders.length === 0 &&
    symbols.length <= 16;

  return (
    <View style={styles.wrap}>
      {folderPath.length > 0 && currentFolder && (
        <>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Back to ${folderPath.length > 1 ? 'previous folder' : 'Symbol Pack'}`}
            onPress={handleBack}
            hitSlop={8}
            style={({ pressed }) => [
              styles.backRow,
              pressed && { opacity: 0.6 },
            ]}
          >
            <Ionicons name="chevron-back" size={20} color={t.colors.primary} />
            <ThemedText variant="body" color={t.colors.primary} style={styles.backLabel}>
              {folderPath.length > 1 ? 'Back' : 'Symbol Pack'}
            </ThemedText>
            <ThemedText variant="callout" color={t.colors.text} style={styles.currentFolder}>
              {currentFolder.label}
            </ThemedText>
          </Pressable>

          {onImportFolder && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Import ${currentFolder.label}, ${packFolderSubtitle(currentFolder)}, into your board`}
              accessibilityHint="Adds this folder and every nested symbol to your current board in one step"
              onPress={handleImportCurrent}
              style={({ pressed }) => [
                styles.importPrimary,
                {
                  backgroundColor: pressed ? t.colors.selectionBg : t.colors.inputBg,
                  borderColor: t.colors.primary,
                },
              ]}
            >
              <Ionicons name="albums-outline" size={22} color={t.colors.primary} />
              <View style={styles.importPrimaryText}>
                <ThemedText variant="callout" color={t.colors.primary} style={styles.importPrimaryLabel}>
                  Import this folder
                </ThemedText>
                <ThemedText variant="caption" color={t.colors.textMuted} numberOfLines={1}>
                  {packFolderSubtitle(currentFolder)} — added to your board
                </ThemedText>
              </View>
              <Ionicons name="add-circle" size={26} color={t.colors.primary} />
            </Pressable>
          )}
        </>
      )}

      {folders.length > 0 && (
        <>
          <ThemedText variant="eyebrow" color={t.colors.textTertiary} style={styles.sectionEyebrow}>
            {currentFolder ? 'FOLDERS' : 'SYMBOL PACK'}
          </ThemedText>
          <View style={styles.folderGrid}>{folders.map(renderFolderRow)}</View>
        </>
      )}

      {symbols.length > 0 && (
        <>
          <ThemedText
            variant="eyebrow"
            color={t.colors.textTertiary}
            style={[styles.sectionEyebrow, folders.length > 0 && styles.sectionEyebrowSpaced]}
          >
            SYMBOLS
          </ThemedText>
          {useGridForSymbols ? renderSymbolGrid(symbols) : renderSymbolRows(symbols)}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingBottom: spacing.md,
  },
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
    marginBottom: spacing.sm,
    gap: spacing.xs,
  },
  backLabel: {
    fontFamily: fonts.displayBold,
  },
  currentFolder: {
    flex: 1,
    textAlign: 'right',
    fontFamily: fonts.displayBold,
  },
  sectionEyebrow: {
    marginBottom: spacing.sm,
  },
  sectionEyebrowSpaced: {
    marginTop: spacing.lg,
  },
  folderGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  folderCell: {
    width: '48%',
    flexGrow: 1,
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 60,
    borderRadius: radii.card,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.md,
  },
  folderIcon: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  folderText: {
    flex: 1,
    gap: 2,
  },
  folderLabel: {
    fontFamily: fonts.displayBold,
  },
  symbolGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  symbolCell: {
    width: 72,
    minHeight: 72,
    borderRadius: radii.card,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xs,
    gap: 2,
  },
  symbolLabel: {
    maxWidth: 64,
    textAlign: 'center',
  },
  symbolRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 60,
    borderRadius: radii.card,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.sm,
    gap: spacing.md,
  },
  symbolIcon: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  symbolRowLabel: {
    flex: 1,
    fontFamily: fonts.displayBold,
  },
  // Bulk-import affordances (Phase 1 — Symbol Pack Bulk Add).
  importPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 56,
    borderRadius: radii.button,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  importPrimaryText: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  importPrimaryLabel: {
    fontFamily: fonts.displayBold,
  },
  importBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
