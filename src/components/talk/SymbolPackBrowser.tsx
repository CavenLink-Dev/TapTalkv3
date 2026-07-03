/**
 * SymbolPackBrowser — hierarchical folder browser for curated Symbol Packs
 * inside Add Symbol (Rules 1, 5, 27 — simple root, drill-down detail).
 */
import React, { useCallback, useMemo } from 'react';
import { LayoutAnimation, Pressable, ScrollView, StyleSheet, View } from 'react-native';
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

  const renderFolderRow = (folder: SymbolPackFolder) => (
    <Pressable
      key={folder.id}
      accessibilityRole="button"
      accessibilityLabel={`Open ${folder.label} folder, ${packFolderSubtitle(folder)}`}
      onPress={() => handleOpenFolder(folder)}
      style={({ pressed }) => [
        styles.folderRow,
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
      <Ionicons name="chevron-forward" size={18} color={t.colors.textTertiary} />
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
      )}

      {folders.length > 0 && (
        <>
          <ThemedText variant="eyebrow" color={t.colors.textTertiary} style={styles.sectionEyebrow}>
            {currentFolder ? 'FOLDERS' : 'SYMBOL PACK'}
          </ThemedText>
          {folders.map(renderFolderRow)}
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
  folderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 60,
    borderRadius: radii.card,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.sm,
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
});
