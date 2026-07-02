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
import { useTheme } from '../../theme/useTheme';
import { radii, spacing, typography } from '../../theme/tokens';
import { fonts } from '../../theme/fonts';
import { hapticSelection } from '../../utils/haptics';
import { useReduceMotion } from '../../hooks/useReduceMotion';

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

// Curated icons — all IDs already bundled and used elsewhere on the board.
const FOLDER_ICONS: { symbolId: string; name: string }[] = [
  { symbolId: 'mulberry_family_excv0f', name: 'People' },
  { symbolId: 'mulberry_food_atkyaz',   name: 'Food' },
  { symbolId: 'mulberry_house_1ice1xp', name: 'Home' },
  { symbolId: 'mulberry_run_1l6fpg7',   name: 'Actions' },
  { symbolId: 'mulberry_cat_1lz3nun',   name: 'Animals' },
  { symbolId: 'mulberry_drink_16zxzpv', name: 'Drinks' },
  { symbolId: 'mulberry_want_16yheia',  name: 'Wants' },
  { symbolId: 'mulberry_help_1g1ppr',   name: 'Help' },
];

// Folder tile colours. Literal hex is the repo convention for tile colour.
const FOLDER_COLORS: { color: string; name: string }[] = [
  { color: '#1DCDFF', name: 'sky blue' },
  { color: '#0A84FF', name: 'blue' },
  { color: '#34C759', name: 'green' },
  { color: '#FF9F0A', name: 'orange' },
  { color: '#BF5AF2', name: 'purple' },
  { color: '#FF3B30', name: 'red' },
];

const DEFAULT_COLOR = FOLDER_COLORS[0]!.color;

export function AddFolderModal({ visible, onDismiss, onAdd }: Props) {
  const t = useTheme();
  const reduceMotion = useReduceMotion();
  const [label, setLabel] = useState('');
  const [iconId, setIconId] = useState<string | null>(null);
  const [color, setColor] = useState<string>(DEFAULT_COLOR);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (visible) {
      setTimeout(() => inputRef.current?.focus(), 400);
    } else {
      setLabel('');
      setIconId(null);
      setColor(DEFAULT_COLOR);
    }
  }, [visible]);

  const handleSelectIcon = useCallback((symbolId: string) => {
    hapticSelection();
    setIconId(prev => (prev === symbolId ? null : symbolId));
  }, []);

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

  const selectedColorName = FOLDER_COLORS.find(c => c.color === color)?.name ?? 'custom';

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
            accessibilityLabel={`Folder tile preview: ${label.trim() || 'unnamed folder'}, ${selectedColorName}`}
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

          {/* Icon picker */}
          <View style={styles.fieldSection}>
            <ThemedText variant="eyebrow" color={t.colors.textTertiary} style={styles.sectionEyebrow}>
              ICON
            </ThemedText>
            <View style={styles.iconGrid}>
              {FOLDER_ICONS.map(icon => {
                const isOn = iconId === icon.symbolId;
                return (
                  <Pressable
                    key={icon.symbolId}
                    accessibilityRole="button"
                    accessibilityLabel={`Folder icon ${icon.name}`}
                    accessibilityState={{ selected: isOn }}
                    onPress={() => handleSelectIcon(icon.symbolId)}
                    style={({ pressed }) => [
                      styles.iconCell,
                      { backgroundColor: pressed || isOn ? t.colors.selectionBg : t.colors.inputBg },
                    ]}
                  >
                    <MulberrySymbol symbolId={icon.symbolId} size={36} />
                    {isOn && (
                      <View style={[styles.iconCheck, { backgroundColor: t.colors.primary }]}>
                        <Ionicons name="checkmark" size={12} color="#FFFFFF" />
                      </View>
                    )}
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Colour picker */}
          <View style={styles.fieldSection}>
            <ThemedText variant="eyebrow" color={t.colors.textTertiary} style={styles.sectionEyebrow}>
              TILE COLOUR
            </ThemedText>
            <View style={styles.swatchRow}>
              {FOLDER_COLORS.map(c => {
                const isOn = color === c.color;
                return (
                  <Pressable
                    key={c.color}
                    accessibilityRole="button"
                    accessibilityLabel={`Tile colour ${c.name}`}
                    accessibilityState={{ selected: isOn }}
                    onPress={() => handleSelectColor(c.color)}
                    hitSlop={6}
                    style={styles.swatchHit}
                  >
                    <View style={[styles.swatch, { backgroundColor: c.color }]}>
                      {isOn && <Ionicons name="checkmark" size={20} color="#FFFFFF" />}
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Empty-state hint (Rule 24) */}
          <View style={styles.hint}>
            <ThemedText variant="callout" color={t.colors.textMuted} style={styles.hintText}>
              The folder will appear as a tile. Tap it to open an empty board you can fill with symbols.
            </ThemedText>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  iconCell: {
    width: 56,
    height: 56,
    borderRadius: radii.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCheck: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  swatchRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  swatchHit: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  swatch: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
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
