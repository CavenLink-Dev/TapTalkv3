/**
 * ColorPickerSheet — an iOS-style sheet wrapping the reusable ColorWheel.
 *
 * Any colour is reachable (wheel + brightness + hex/RGB). Cancel keeps the old
 * colour; Done commits. Respects Reduce Motion (fade vs slide).
 */

import React, { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ColorWheel } from './ColorWheel';
import { useTheme } from '../../theme/useTheme';
import { spacing, typography } from '../../theme/tokens';
import { fonts } from '../../theme/fonts';
import { hapticSelection } from '../../utils/haptics';

interface ColorPickerSheetProps {
  visible: boolean;
  initialColor: string;
  title?: string;
  reduceMotion?: boolean;
  onCancel: () => void;
  onDone: (hex: string) => void;
}

export function ColorPickerSheet({
  visible,
  initialColor,
  title = 'Choose Colour',
  reduceMotion = false,
  onCancel,
  onDone,
}: ColorPickerSheetProps) {
  const t = useTheme();
  const [draft, setDraft] = useState(initialColor);

  useEffect(() => {
    if (visible) setDraft(initialColor);
  }, [visible, initialColor]);

  return (
    <Modal
      visible={visible}
      animationType={reduceMotion ? 'fade' : 'slide'}
      presentationStyle="formSheet"
      onRequestClose={onCancel}
    >
      <View style={[styles.sheet, { backgroundColor: t.colors.background }]}>
        <View style={[styles.header, { borderBottomColor: t.colors.border }]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Cancel"
            onPress={() => {
              hapticSelection();
              onCancel();
            }}
            hitSlop={12}
            style={({ pressed }) => [styles.headerBtn, pressed && { opacity: 0.6 }]}
          >
            <Text style={[styles.cancel, { color: t.colors.textMuted }]}>Cancel</Text>
          </Pressable>
          <Text style={[styles.title, { color: t.colors.text }]}>{title}</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Use this colour"
            onPress={() => {
              hapticSelection();
              onDone(draft);
            }}
            hitSlop={12}
            style={({ pressed }) => [styles.headerBtn, pressed && { opacity: 0.6 }]}
          >
            <Text style={[styles.done, { color: t.colors.primary }]}>Done</Text>
          </Pressable>
        </View>
        <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
          <ColorWheel color={draft} onChange={setDraft} />
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  sheet: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
  },
  headerBtn: { minWidth: 64, minHeight: 44, justifyContent: 'center' },
  cancel: { fontFamily: fonts.body, fontSize: typography.body },
  done: { fontFamily: fonts.displayBold, fontSize: typography.body, textAlign: 'right' },
  title: { fontFamily: fonts.displayHeavy, fontSize: typography.subheading },
  body: { padding: spacing.lg, alignItems: 'center', gap: spacing.lg },
});
