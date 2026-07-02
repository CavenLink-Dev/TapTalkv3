/**
 * AddFolderModal — focused form-sheet modal (Rule 6) for creating a new
 * folder tile. Creates a folder that opens a new empty child board.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/useTheme';
import { radii, spacing, typography } from '../../theme/tokens';
import { fonts } from '../../theme/fonts';
import { hapticSelection } from '../../utils/haptics';
import { useReduceMotion } from '../../hooks/useReduceMotion';

export interface AddFolderResult {
  label: string;
  boardKey: string;
}

interface Props {
  visible: boolean;
  onDismiss: () => void;
  onAdd: (result: AddFolderResult) => void;
}

export function AddFolderModal({ visible, onDismiss, onAdd }: Props) {
  const t = useTheme();
  const reduceMotion = useReduceMotion();
  const [label, setLabel] = useState('');
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (visible) {
      setTimeout(() => inputRef.current?.focus(), 400);
    } else {
      setLabel('');
    }
  }, [visible]);

  const handleConfirm = useCallback(() => {
    const trimmed = label.trim();
    if (!trimmed) return;
    hapticSelection();
    // Generate a unique board key from the label
    const boardKey = `folder_${trimmed.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}`;
    onAdd({ label: trimmed, boardKey });
  }, [label, onAdd]);

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
            <Text style={[styles.headerButtonText, { color: t.colors.primary }]}>Cancel</Text>
          </Pressable>
          <Text style={[styles.headerTitle, { color: t.colors.text }]}>Add Folder</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Create folder"
            accessibilityState={{ disabled: !label.trim() }}
            onPress={handleConfirm}
            disabled={!label.trim()}
            hitSlop={12}
            style={styles.headerButton}
          >
            <Text style={[styles.headerButtonText, { color: label.trim() ? t.colors.primary : t.colors.disabled }]}>
              Create
            </Text>
          </Pressable>
        </View>

        {/* Folder name input */}
        <View style={styles.inputSection}>
          <Text style={[styles.labelEyebrow, { color: t.colors.textTertiary }]}>FOLDER NAME</Text>
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

        {/* Empty-state hint (Rule 24) */}
        <View style={styles.hint}>
          <Ionicons name="folder-open-outline" size={48} color={t.colors.textTertiary} />
          <Text style={[styles.hintText, { color: t.colors.textMuted }]}>
            The folder will appear as a tile. Tap it to open an empty board you can fill with symbols.
          </Text>
        </View>
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
    fontSize: typography.body,
  },
  headerTitle: {
    fontFamily: fonts.displayHeavy,
    fontSize: typography.heading,
    letterSpacing: typography.trackHeading,
  },
  inputSection: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
  },
  labelEyebrow: {
    fontFamily: fonts.bodyHeavy,
    fontSize: typography.eyebrow,
    letterSpacing: typography.trackEyebrow,
    marginBottom: spacing.xs,
  },
  nameInput: {
    height: 48,
    borderRadius: radii.button,
    paddingHorizontal: spacing.md,
    fontSize: typography.body,
    fontFamily: fonts.body,
  },
  hint: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.md,
  },
  hintText: {
    fontFamily: fonts.body,
    fontSize: typography.callout,
    textAlign: 'center',
    lineHeight: 22,
  },
});
