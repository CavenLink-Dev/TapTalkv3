/**
 * AddFolderModal — focused form-sheet modal (Rule 6) for creating a new
 * folder tile. Creates a folder that opens a new empty child board.
 *
 * The user names the folder, picks an icon (bundled Mulberry symbols) and a
 * tile colour, with a live real-size tile preview (Rule 13 — clear result).
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MulberrySymbol } from '../symbols/MulberrySymbol';
import { ThemedText } from '../native/ThemedText';
import { SymbolSuggestionRow } from '../aac/symbols/SymbolSuggestionRow';
import { useTheme } from '../../theme/useTheme';
import { radii, spacing, typography } from '../../theme/tokens';
import { fonts } from '../../theme/fonts';
import { hapticSelection } from '../../utils/haptics';
import { useReduceMotion } from '../../hooks/useReduceMotion';
import { ColorPickerSheet } from '../native/ColorPickerSheet';

export interface AddFolderResult {
  label: string;
  boardKey: string;
  color: string;
  mulberrySymbolId?: string;
}

interface Props {
  visible: boolean;
  onDismiss: () => void;
  onAdd: (result: AddFolderResult) => void;
}

// Default folder tile colour. Any colour is reachable via the colour wheel —
// there are intentionally no preset swatches (colour wheel only, app-wide).
const DEFAULT_COLOR = '#1DCDFF';

export function AddFolderModal({ visible, onDismiss, onAdd }: Props) {
  const t = useTheme();
  const reduceMotion = useReduceMotion();
  const [label, setLabel] = useState('');
  const [iconId, setIconId] = useState<string | null>(null);
  const [color, setColor] = useState<string>(DEFAULT_COLOR);
  const [colorSheet, setColorSheet] = useState(false);
  const [iconSearch, setIconSearch] = useState(false);
  const [iconQuery, setIconQuery] = useState('');
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (visible) {
      setTimeout(() => inputRef.current?.focus(), 400);
    } else {
      setLabel('');
      setIconId(null);
      setColor(DEFAULT_COLOR);
      setIconSearch(false);
      setIconQuery('');
    }
  }, [visible]);

  const handleSelectColor = useCallback((c: string) => {
    hapticSelection();
    setColor(c);
  }, []);

  const handleConfirm = useCallback(() => {
    const trimmed = label.trim();
    if (!trimmed) return;
    hapticSelection();
    // Generate a unique board key from the label
    const boardKey = `folder_${trimmed.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}`;
    onAdd({ label: trimmed, boardKey, color, mulberrySymbolId: iconId ?? undefined });
  }, [color, iconId, label, onAdd]);

  return (
    <Modal
      visible={visible}
      animationType={reduceMotion ? 'fade' : 'slide'}
      presentationStyle="formSheet"
      onRequestClose={onDismiss}
    >
      <KeyboardAvoidingView behavior="padding" style={[styles.container, { backgroundColor: t.colors.background }]}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Cancel"
            onPress={onDismiss}
            hitSlop={12}
            style={styles.headerButton}
          >
            <ThemedText variant="body" color={t.colors.primary} style={styles.headerButtonText}>Cancel</ThemedText>
          </Pressable>
          <ThemedText variant="heading" color={t.colors.text}>Add Folder</ThemedText>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Create folder"
            accessibilityState={{ disabled: !label.trim() }}
            onPress={handleConfirm}
            disabled={!label.trim()}
            hitSlop={12}
            style={styles.headerButton}
          >
            <ThemedText
              variant="body"
              color={label.trim() ? t.colors.primary : t.colors.disabled}
              style={styles.headerButtonText}
            >
              Create
            </ThemedText>
          </Pressable>
        </View>

        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.scrollContent} alwaysBounceVertical>
          {/* Live tile preview — real size, updates as you type (Rule 13) */}
          <View
            style={styles.previewWrap}
            accessible
            accessibilityLabel={`Folder tile preview: ${label.trim() || 'unnamed folder'}`}
          >
            <View style={[styles.previewTile, { backgroundColor: color }]}>
              {iconId ? (
                <MulberrySymbol symbolId={iconId} size={48} />
              ) : (
                <Ionicons name="folder" size={48} color="#FFFFFF" />
              )}
              <ThemedText variant="callout" color="#FFFFFF" numberOfLines={1} style={styles.previewLabel}>
                {label.trim() || 'Folder name'}
              </ThemedText>
            </View>
          </View>

          {/* Folder name input */}
          <View style={styles.fieldSection}>
            <ThemedText variant="eyebrow" color={t.colors.textTertiary} style={styles.sectionEyebrow}>
              FOLDER NAME
            </ThemedText>
            <TextInput
              ref={inputRef}
              style={[styles.nameInput, { color: t.colors.text, backgroundColor: t.colors.inputBg }]}
              value={label}
              onChangeText={setLabel}
              placeholder="e.g. My places"
              placeholderTextColor={t.colors.textTertiary}
              returnKeyType="done"
              onSubmitEditing={handleConfirm}
              accessibilityLabel="Folder name"
              maxLength={30}
            />
          </View>

          {/* Icon — search the full symbol library (no bundled quick-set) */}
          <View style={styles.fieldSection}>
            <ThemedText variant="eyebrow" color={t.colors.textTertiary} style={styles.sectionEyebrow}>
              ICON
            </ThemedText>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={iconId ? 'Change folder symbol' : 'Search for a folder symbol'}
              accessibilityHint="Opens the symbol library to search and pick an icon"
              onPress={() => { hapticSelection(); setIconQuery(''); setIconSearch(true); }}
              style={({ pressed }) => [
                styles.iconTrigger,
                { backgroundColor: t.colors.inputBg },
                pressed && { opacity: 0.75 },
              ]}
            >
              <View style={styles.iconTriggerPreview}>
                {iconId ? (
                  <MulberrySymbol symbolId={iconId} size={32} />
                ) : (
                  <Ionicons name="search" size={22} color={t.colors.textMuted} />
                )}
              </View>
              <ThemedText variant="body" color={t.colors.text} style={styles.iconTriggerLabel}>
                {iconId ? 'Change symbol' : 'Search for a symbol'}
              </ThemedText>
              {iconId ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Remove folder symbol"
                  onPress={() => { hapticSelection(); setIconId(null); }}
                  hitSlop={10}
                >
                  <Ionicons name="close-circle" size={22} color={t.colors.textMuted} />
                </Pressable>
              ) : (
                <Ionicons name="chevron-forward" size={20} color={t.colors.textTertiary} />
              )}
            </Pressable>
          </View>

          {/* Colour — full colour wheel (any colour, no presets) */}
          <View style={styles.fieldSection}>
            <ThemedText variant="eyebrow" color={t.colors.textTertiary} style={styles.sectionEyebrow}>
              TILE COLOUR
            </ThemedText>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Change tile colour"
              accessibilityHint="Opens a colour wheel to pick any colour"
              onPress={() => { hapticSelection(); setColorSheet(true); }}
              style={({ pressed }) => [
                styles.colorTrigger,
                { backgroundColor: t.colors.inputBg },
                pressed && { opacity: 0.75 },
              ]}
            >
              <View style={[styles.colorPreview, { backgroundColor: color, borderColor: t.colors.border }]} />
              <ThemedText variant="body" color={t.colors.text} style={styles.colorTriggerLabel}>
                Change colour
              </ThemedText>
              <Ionicons name="color-palette-outline" size={22} color={t.colors.primary} />
            </Pressable>
          </View>

          {/* Empty-state hint (Rule 24) */}
          <View style={styles.hint}>
            <ThemedText variant="callout" color={t.colors.textMuted} style={styles.hintText}>
              The folder will appear as a tile. Tap it to open an empty board you can fill with symbols.
            </ThemedText>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <ColorPickerSheet
        visible={colorSheet}
        initialColor={color}
        title="Folder Colour"
        reduceMotion={reduceMotion}
        onCancel={() => setColorSheet(false)}
        onDone={(hex) => {
          handleSelectColor(hex);
          setColorSheet(false);
        }}
      />

      {/* Search Symbol — full Mulberry library, no bundled quick-set */}
      <Modal
        visible={iconSearch}
        animationType={reduceMotion ? 'fade' : 'slide'}
        presentationStyle="formSheet"
        onRequestClose={() => setIconSearch(false)}
      >
        <View style={[styles.searchSheet, { backgroundColor: t.colors.background }]}>
          <View style={styles.searchHeader}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Cancel"
              onPress={() => { hapticSelection(); setIconSearch(false); }}
              hitSlop={12}
              style={styles.searchCancel}
            >
              <ThemedText variant="body" color={t.colors.primary} style={styles.headerButtonText}>Cancel</ThemedText>
            </Pressable>
            <ThemedText variant="heading" color={t.colors.text}>Search Symbol</ThemedText>
            <View style={styles.searchSpacer} />
          </View>
          <View style={styles.searchBody}>
            <TextInput
              accessibilityLabel="Search symbols"
              value={iconQuery}
              onChangeText={setIconQuery}
              autoFocus
              placeholder="Type a word, e.g. dog, home, food"
              placeholderTextColor={t.colors.textTertiary}
              style={[styles.searchInput, { color: t.colors.text, backgroundColor: t.colors.inputBg, borderColor: t.colors.border }]}
            />
            <SymbolSuggestionRow
              query={iconQuery}
              onSelect={(result) => {
                hapticSelection();
                setIconId(result.symbol.id);
                setIconSearch(false);
              }}
            />
            {!iconQuery.trim() ? (
              <ThemedText variant="callout" color={t.colors.textMuted} style={styles.searchHint}>
                Search the full symbol library and tap one to use it as the folder icon.
              </ThemedText>
            ) : null}
          </View>
        </View>
      </Modal>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  headerButton: {
    minWidth: 60,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerButtonText: {
    fontFamily: fonts.displayBold,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  previewWrap: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  previewTile: {
    width: 120,
    height: 120,
    borderRadius: radii.card,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    padding: spacing.sm,
  },
  previewLabel: {
    fontFamily: fonts.displayBold,
    maxWidth: 104,
    textAlign: 'center',
  },
  fieldSection: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  sectionEyebrow: {
    marginBottom: spacing.sm,
  },
  nameInput: {
    height: 48,
    borderRadius: radii.button,
    paddingHorizontal: spacing.md,
    fontSize: typography.body,
    fontFamily: fonts.body,
  },
  iconTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 56,
    borderRadius: radii.button,
    paddingHorizontal: spacing.md,
  },
  iconTriggerPreview: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconTriggerLabel: {
    flex: 1,
    fontFamily: fonts.displayBold,
  },
  searchSheet: { flex: 1 },
  searchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  searchCancel: { minWidth: 60, minHeight: 44, justifyContent: 'center' },
  searchSpacer: { minWidth: 60 },
  searchBody: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, gap: spacing.md },
  searchInput: {
    fontFamily: fonts.body,
    fontSize: typography.body,
    minHeight: 48,
    borderRadius: radii.button,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
  },
  searchHint: { textAlign: 'center', marginTop: spacing.md },
  colorTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 56,
    borderRadius: radii.button,
    paddingHorizontal: spacing.md,
  },
  colorPreview: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
  },
  colorTriggerLabel: {
    flex: 1,
    fontFamily: fonts.displayBold,
  },
  hint: {
    alignItems: 'center',
    padding: spacing.xl,
  },
  hintText: {
    textAlign: 'center',
    lineHeight: 22,
  },
});
