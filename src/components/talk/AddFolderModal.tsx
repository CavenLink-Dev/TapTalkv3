/**
 * AddFolderModal — focused form-sheet modal (Rule 6) for creating a new
 * folder tile. Creates a folder that opens a new empty child board.
 *
 * The user names the folder, picks an icon (bundled Mulberry symbols) and a
 * tile colour, with a live real-size tile preview (Rule 13 — clear result).
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActionSheetIOS,
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
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
import { pickFromLibrary, takePhoto, type PickOutcome } from '../../features/profile/pickImage';

export interface AddFolderResult {
  label: string;
  boardKey: string;
  color: string;
  mulberrySymbolId?: string;
  customImageUri?: string;
  parentBoardKey?: string;
}

export interface FolderPlacementOption {
  boardKey: string;
  label: string;
}

interface Props {
  visible: boolean;
  onDismiss: () => void;
  onAdd: (result: AddFolderResult) => void;
  placementOptions?: FolderPlacementOption[];
  initialParentBoardKey?: string;
}

// Default folder tile colour. Any colour is reachable via the colour wheel —
// there are intentionally no preset swatches (colour wheel only, app-wide).
const DEFAULT_COLOR = '#1DCDFF';

export function AddFolderModal({
  visible,
  onDismiss,
  onAdd,
  placementOptions = [],
  initialParentBoardKey = 'home',
}: Props) {
  const t = useTheme();
  const reduceMotion = useReduceMotion();
  const [label, setLabel] = useState('');
  const [iconId, setIconId] = useState<string | null>(null);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [color, setColor] = useState<string>(DEFAULT_COLOR);
  const [colorSheet, setColorSheet] = useState(false);
  const [iconSearch, setIconSearch] = useState(false);
  const [iconQuery, setIconQuery] = useState('');
  const [parentBoardKey, setParentBoardKey] = useState(initialParentBoardKey);
  const inputRef = useRef<TextInput>(null);
  const focusTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (focusTimerRef.current) {
      clearTimeout(focusTimerRef.current);
      focusTimerRef.current = null;
    }
    if (visible) {
      setParentBoardKey(initialParentBoardKey);
      focusTimerRef.current = setTimeout(() => inputRef.current?.focus(), 400);
    } else {
      setLabel('');
      setIconId(null);
      setPhotoUri(null);
      setColor(DEFAULT_COLOR);
      setIconSearch(false);
      setIconQuery('');
      setParentBoardKey(initialParentBoardKey);
    }
    return () => {
      if (focusTimerRef.current) {
        clearTimeout(focusTimerRef.current);
        focusTimerRef.current = null;
      }
    };
  }, [initialParentBoardKey, visible]);

  const selectedPlacement = placementOptions.find(option => option.boardKey === parentBoardKey)
    ?? placementOptions[0]
    ?? { boardKey: initialParentBoardKey, label: 'Current board' };

  const handleSelectColor = useCallback((c: string) => {
    hapticSelection();
    setColor(c);
  }, []);

  const handlePickOutcome = useCallback((outcome: PickOutcome) => {
    if (outcome.status === 'picked') {
      hapticSelection();
      setPhotoUri(outcome.uri);
      setIconId(null);
      return;
    }
    if (outcome.status === 'denied') {
      Alert.alert('Photo access needed', 'Allow photo access in Settings to use a photo as the folder icon.');
    } else if (outcome.status === 'unavailable') {
      Alert.alert('Photo picker unavailable', 'Choose a symbol for now.');
    }
  }, []);

  const openSymbolSearch = useCallback(() => {
    hapticSelection();
    setIconQuery('');
    setIconSearch(true);
  }, []);

  const handleTakePhoto = useCallback(async () => {
    handlePickOutcome(await takePhoto());
  }, [handlePickOutcome]);

  const handleChoosePhoto = useCallback(async () => {
    handlePickOutcome(await pickFromLibrary());
  }, [handlePickOutcome]);

  const showIconOptions = useCallback(() => {
    hapticSelection();
    const labels = ['Take Photo', 'Choose Photo from Library', 'Choose a Symbol', 'Cancel'];
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: labels,
          cancelButtonIndex: 3,
          userInterfaceStyle: t.isDark ? 'dark' : 'light',
        },
        (buttonIndex) => {
          if (buttonIndex === 0) void handleTakePhoto();
          if (buttonIndex === 1) void handleChoosePhoto();
          if (buttonIndex === 2) openSymbolSearch();
        },
      );
      return;
    }
    Alert.alert('Search for an icon', undefined, [
      { text: 'Take Photo', onPress: () => { void handleTakePhoto(); } },
      { text: 'Choose Photo from Library', onPress: () => { void handleChoosePhoto(); } },
      { text: 'Choose a Symbol', onPress: openSymbolSearch },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }, [handleChoosePhoto, handleTakePhoto, openSymbolSearch, t.isDark]);

  const showPlacementOptions = useCallback(() => {
    if (placementOptions.length === 0) return;
    hapticSelection();
    const labels = [...placementOptions.map(option => option.label), 'Cancel'];
    const cancelButtonIndex = labels.length - 1;
    const selectIndex = (index: number) => {
      const option = placementOptions[index];
      if (!option) return;
      hapticSelection();
      setParentBoardKey(option.boardKey);
    };
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: labels,
          cancelButtonIndex,
          userInterfaceStyle: t.isDark ? 'dark' : 'light',
        },
        selectIndex,
      );
      return;
    }
    Alert.alert(
      'Add folder to',
      undefined,
      [
        ...placementOptions.map((option, index) => ({
          text: option.label,
          onPress: () => selectIndex(index),
        })),
        { text: 'Cancel', style: 'cancel' as const },
      ],
    );
  }, [placementOptions, t.isDark]);

  const handleConfirm = useCallback(() => {
    const trimmed = label.trim().replace(/\s+/g, ' ');
    if (!trimmed) return;
    hapticSelection();
    // Generate a unique board key from the label
    const boardKey = `folder_${trimmed.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}`;
    onAdd({
      label: trimmed,
      boardKey,
      color,
      mulberrySymbolId: iconId ?? undefined,
      customImageUri: photoUri ?? undefined,
      parentBoardKey: selectedPlacement.boardKey,
    });
  }, [color, iconId, label, onAdd, photoUri, selectedPlacement.boardKey]);

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
            style={({ pressed }) => [styles.headerButton, pressed && { opacity: 0.6 }]}
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
            style={({ pressed }) => [styles.headerButton, pressed && { opacity: 0.6 }]}
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
              ) : photoUri ? (
                <Image source={{ uri: photoUri }} style={styles.previewPhoto} />
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
              Folder Name.
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
            {label.trim().split(/\s+/).filter(Boolean).length > 2 ? (
              <ThemedText variant="caption" color={t.colors.textMuted} style={styles.labelHint}>
                Tip: short folder names read best on the board — one or two words.
              </ThemedText>
            ) : null}
          </View>

          {/* Icon — search the full symbol library (no bundled quick-set) */}
          <View style={styles.fieldSection}>
            <ThemedText variant="eyebrow" color={t.colors.textTertiary} style={styles.sectionEyebrow}>
              ICON
            </ThemedText>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Search for an icon"
              accessibilityHint="Choose a photo or symbol"
              onPress={showIconOptions}
              style={({ pressed }) => [
                styles.iconTrigger,
                { backgroundColor: t.colors.inputBg },
                pressed && { opacity: 0.75 },
              ]}
            >
              <View style={styles.iconTriggerPreview}>
                {iconId ? (
                  <MulberrySymbol symbolId={iconId} size={32} />
                ) : photoUri ? (
                  <Image source={{ uri: photoUri }} style={styles.iconPreviewPhoto} />
                ) : (
                  <Ionicons name="search" size={22} color={t.colors.textMuted} />
                )}
              </View>
              <ThemedText variant="body" color={t.colors.text} style={styles.iconTriggerLabel}>
                Search for an icon
              </ThemedText>
              {iconId || photoUri ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Remove folder icon"
                  onPress={(event) => {
                    event.stopPropagation();
                    hapticSelection();
                    setIconId(null);
                    setPhotoUri(null);
                  }}
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
              <ThemedText variant="caption" color={t.colors.textMuted} style={styles.colorTriggerHex}>
                {color.toUpperCase()}
              </ThemedText>
              <Ionicons name="color-palette-outline" size={22} color={t.colors.primary} />
            </Pressable>
          </View>

          {/* Placement — add this folder to the current board or an existing folder */}
          <View style={styles.fieldSection}>
            <ThemedText variant="eyebrow" color={t.colors.textTertiary} style={styles.sectionEyebrow}>
              ADD TO
            </ThemedText>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Add folder to ${selectedPlacement.label}`}
              accessibilityHint="Choose where this folder appears"
              onPress={showPlacementOptions}
              style={({ pressed }) => [
                styles.placementTrigger,
                { backgroundColor: t.colors.inputBg },
                pressed && { opacity: 0.75 },
              ]}
            >
              <Ionicons name="folder-open-outline" size={22} color={t.colors.primary} />
              <ThemedText variant="body" color={t.colors.text} style={styles.placementLabel}>
                {selectedPlacement.label}
              </ThemedText>
              <Ionicons name="chevron-forward" size={20} color={t.colors.textTertiary} />
            </Pressable>
          </View>

          {/* Empty-state hint (Rule 24) */}
          <View style={styles.hint}>
            <ThemedText variant="callout" color={t.colors.textMuted} style={styles.hintText}>
              Tap Create when you are ready. The folder opens as a tile with its own board.
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

      {/* Choose Symbol — full Mulberry library, no bundled quick-set */}
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
            <ThemedText variant="heading" color={t.colors.text}>Choose Symbol</ThemedText>
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
                setPhotoUri(null);
                setIconSearch(false);
              }}
            />
            {!iconQuery.trim() ? (
              <ThemedText variant="callout" color={t.colors.textMuted} style={styles.searchHint}>
                Pick one symbol for the folder icon.
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
  previewPhoto: {
    width: 50,
    height: 50,
    borderRadius: radii.button,
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
  iconPreviewPhoto: {
    width: 34,
    height: 34,
    borderRadius: radii.button,
  },
  iconTriggerLabel: {
    flex: 1,
    fontFamily: fonts.displayBold,
  },
  placementTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 56,
    borderRadius: radii.button,
    paddingHorizontal: spacing.md,
  },
  placementLabel: {
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
  colorTriggerHex: {
    fontFamily: fonts.body,
    marginRight: spacing.xs,
  },
  labelHint: {
    marginTop: spacing.xs,
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
