import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { PicturePicker } from '../native/PicturePicker';
import { ColorPickerSheet } from '../native/ColorPickerSheet';
import { Icon } from '../native/Icon';
import { useTheme } from '../../theme/useTheme';
import { radii, spacing, symbolColors, typography } from '../../theme/tokens';
import { fonts } from '../../theme/fonts';
import { useReduceMotion } from '../../hooks/useReduceMotion';
import { hapticSelection, hapticSuccess } from '../../utils/haptics';

export type CustomSymbolEditorResult = {
  label: string;
  speech: string;
  picture: string | null;
  backgroundColor: string;
  backgroundOpacity: number;
  outlineColor: string;
  outlineOpacity: number;
};

type Props = {
  visible: boolean;
  onDismiss: () => void;
  onDone: (result: CustomSymbolEditorResult) => void;
  canAddToFolder?: boolean;
  onAddToFolder?: (result: CustomSymbolEditorResult) => void;
};

function buildInitialResult(): CustomSymbolEditorResult {
  return {
    label: '',
    speech: '',
    picture: null,
    backgroundColor: symbolColors.noun,
    backgroundOpacity: 0.3,
    outlineColor: symbolColors.social,
    outlineOpacity: 0,
  };
}

export function CustomSymbolEditor({
  visible,
  onDismiss,
  onDone,
  canAddToFolder = false,
  onAddToFolder,
}: Props) {
  const t = useTheme();
  const reduceMotion = useReduceMotion();
  const [draft, setDraft] = useState<CustomSymbolEditorResult>(() => buildInitialResult());
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [colourSheet, setColourSheet] = useState<'background' | 'outline' | null>(null);

  useEffect(() => {
    if (!visible) return;
    setDraft(buildInitialResult());
    setAdvancedOpen(false);
  }, [visible]);

  const initial = useMemo(() => {
    const first = draft.label.trim().charAt(0);
    return first ? first.toUpperCase() : '+';
  }, [draft.label]);

  const updateDraft = useCallback((patch: Partial<CustomSymbolEditorResult>) => {
    setDraft(prev => ({ ...prev, ...patch }));
  }, []);

  const commit = useCallback((target: 'board' | 'folder') => {
    const label = draft.label.trim();
    if (!label) {
      Alert.alert('Name needed', 'Add a short name before saving this symbol.', [{ text: 'OK' }]);
      return;
    }
    const result = {
      ...draft,
      label,
      speech: draft.speech.trim() || label,
    };
    hapticSuccess();
    if (target === 'folder') {
      onAddToFolder?.(result);
    } else {
      onDone(result);
    }
  }, [draft, onAddToFolder, onDone]);

  const activeColour = colourSheet === 'outline' ? draft.outlineColor : draft.backgroundColor;

  return (
    <Modal
      visible={visible}
      animationType={reduceMotion ? 'fade' : 'slide'}
      presentationStyle="formSheet"
      onRequestClose={onDismiss}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={[styles.shell, { backgroundColor: t.colors.background }]}
      >
        <View style={[styles.header, { borderBottomColor: t.colors.border }]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Cancel custom symbol"
            onPress={() => {
              hapticSelection();
              onDismiss();
            }}
            hitSlop={12}
            style={({ pressed }) => [styles.headerButton, pressed && { opacity: 0.65 }]}
          >
            <Text style={[styles.headerCancel, { color: t.colors.textMuted }]}>Cancel</Text>
          </Pressable>
          <Text style={[styles.title, { color: t.colors.text }]}>Custom Symbol</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Done"
            onPress={() => commit('board')}
            hitSlop={12}
            style={({ pressed }) => [styles.headerButton, pressed && { opacity: 0.65 }]}
          >
            <Text style={[styles.headerDone, { color: t.colors.primary }]}>Done</Text>
          </Pressable>
        </View>

        <ScrollView
          bounces
          alwaysBounceVertical
          overScrollMode="always"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.body}
        >
          <PicturePicker
            value={draft.picture}
            initial={initial}
            onChange={(picture) => updateDraft({ picture })}
            size={124}
            shape="square"
            label="Add Photo"
          />

          <View style={styles.fieldGroup}>
            <Text style={[styles.inputLabel, { color: t.colors.textMuted }]}>Name</Text>
            <TextInput
              accessibilityLabel="Symbol name"
              value={draft.label}
              onChangeText={(label) => updateDraft({ label })}
              placeholder="e.g. Water"
              placeholderTextColor={t.colors.textTertiary}
              clearButtonMode="while-editing"
              maxLength={24}
              style={[
                styles.input,
                {
                  color: t.colors.text,
                  backgroundColor: t.colors.input,
                  borderColor: t.colors.border,
                },
              ]}
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={[styles.inputLabel, { color: t.colors.textMuted }]}>Speech</Text>
            <TextInput
              accessibilityLabel="Spoken phrase"
              value={draft.speech}
              onChangeText={(speech) => updateDraft({ speech })}
              placeholder="e.g. I want water"
              placeholderTextColor={t.colors.textTertiary}
              clearButtonMode="while-editing"
              style={[
                styles.input,
                {
                  color: t.colors.text,
                  backgroundColor: t.colors.input,
                  borderColor: t.colors.border,
                },
              ]}
            />
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={advancedOpen ? 'Hide advanced options' : 'Show advanced options'}
            accessibilityState={{ expanded: advancedOpen }}
            onPress={() => {
              hapticSelection();
              setAdvancedOpen(open => !open);
            }}
            style={({ pressed }) => [
              styles.disclosure,
              {
                backgroundColor: t.colors.surface,
                borderColor: t.colors.border,
                opacity: pressed ? 0.75 : 1,
              },
            ]}
          >
            <Text style={[styles.disclosureLabel, { color: t.colors.text }]}>Advanced</Text>
            <Icon name={advancedOpen ? 'chevron-down' : 'chevron-right'} size={20} color={t.colors.text} strokeWidth={3} />
          </Pressable>

          {advancedOpen ? (
            <View style={[styles.advanced, { backgroundColor: t.colors.surface, borderColor: t.colors.border }]}>
              <ColourRow
                label="Background"
                colour={draft.backgroundColor}
                opacity={draft.backgroundOpacity}
                onPick={() => setColourSheet('background')}
              />
              <OpacityStepper
                label="Background Opacity"
                value={draft.backgroundOpacity}
                onChange={(backgroundOpacity) => updateDraft({ backgroundOpacity })}
              />
              <ColourRow
                label="Outline"
                colour={draft.outlineColor}
                opacity={draft.outlineOpacity}
                onPick={() => setColourSheet('outline')}
              />
              <OpacityStepper
                label="Outline Opacity"
                value={draft.outlineOpacity}
                onChange={(outlineOpacity) => updateDraft({ outlineOpacity })}
              />
            </View>
          ) : null}
        </ScrollView>

        <View style={[styles.footer, { backgroundColor: t.colors.background, borderTopColor: t.colors.border }]}>
          {canAddToFolder && onAddToFolder ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Add to folder"
              onPress={() => commit('folder')}
              style={({ pressed }) => [
                styles.secondaryButton,
                { borderColor: t.colors.primary, opacity: pressed ? 0.75 : 1 },
              ]}
            >
              <Text style={[styles.secondaryButtonText, { color: t.colors.primary }]}>Add to Folder</Text>
            </Pressable>
          ) : null}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Done"
            onPress={() => commit('board')}
            style={({ pressed }) => [
              styles.primaryButton,
              { backgroundColor: pressed ? t.colors.primaryPressed : t.colors.primary },
            ]}
          >
            <Text style={styles.primaryButtonText}>Done</Text>
          </Pressable>
        </View>

        <ColorPickerSheet
          visible={colourSheet != null}
          initialColor={activeColour}
          title={colourSheet === 'outline' ? 'Outline Colour' : 'Background Colour'}
          reduceMotion={reduceMotion}
          onCancel={() => setColourSheet(null)}
          onDone={(hex) => {
            hapticSelection();
            updateDraft(colourSheet === 'outline' ? { outlineColor: hex } : { backgroundColor: hex });
            setColourSheet(null);
          }}
        />
      </KeyboardAvoidingView>
    </Modal>
  );
}

function ColourRow({
  label,
  colour,
  opacity,
  onPick,
}: {
  label: string;
  colour: string;
  opacity: number;
  onPick: () => void;
}) {
  const t = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${label} colour`}
      onPress={() => {
        hapticSelection();
        onPick();
      }}
      style={({ pressed }) => [styles.colourRow, pressed && { opacity: 0.75 }]}
    >
      <View style={[styles.swatch, { backgroundColor: colour, opacity: Math.max(0.15, opacity), borderColor: t.colors.border }]} />
      <Text style={[styles.rowLabel, { color: t.colors.text }]}>{label}</Text>
      <Icon name="chevron-right" size={18} color={t.colors.textMuted} strokeWidth={3} />
    </Pressable>
  );
}

function OpacityStepper({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  const t = useTheme();
  const percent = Math.round(value * 100);
  const step = (delta: number) => {
    hapticSelection();
    onChange(Math.max(0, Math.min(1, Math.round((value + delta) * 10) / 10)));
  };
  return (
    <View style={styles.stepperRow}>
      <Text style={[styles.rowLabel, { color: t.colors.text }]}>{label}</Text>
      <View style={styles.stepperControls}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Decrease ${label.toLowerCase()}`}
          onPress={() => step(-0.1)}
          style={({ pressed }) => [
            styles.stepButton,
            {
              backgroundColor: t.colors.input,
              borderColor: t.colors.border,
              opacity: pressed ? 0.75 : 1,
            },
          ]}
        >
          <Icon name="minus" size={18} color={t.colors.text} strokeWidth={3} />
        </Pressable>
        <Text style={[styles.percentLabel, { color: t.colors.textMuted }]}>{percent}%</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Increase ${label.toLowerCase()}`}
          onPress={() => step(0.1)}
          style={({ pressed }) => [
            styles.stepButton,
            {
              backgroundColor: t.colors.input,
              borderColor: t.colors.border,
              opacity: pressed ? 0.75 : 1,
            },
          ]}
        >
          <Icon name="plus" size={18} color={t.colors.text} strokeWidth={3} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: { flex: 1 },
  header: {
    minHeight: 68,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    borderBottomWidth: 1,
  },
  headerButton: { minWidth: 64, minHeight: 44, justifyContent: 'center' },
  headerCancel: { fontFamily: fonts.body, fontSize: typography.body },
  headerDone: { fontFamily: fonts.displayBold, fontSize: typography.body, textAlign: 'right' },
  title: { fontFamily: fonts.displayHeavy, fontSize: typography.subheading },
  body: {
    padding: spacing.lg,
    gap: spacing.lg,
    alignItems: 'stretch',
  },
  fieldGroup: { gap: spacing.xs },
  inputLabel: {
    fontFamily: fonts.displayBold,
    fontSize: typography.eyebrow,
    textTransform: 'uppercase',
  },
  input: {
    minHeight: 52,
    borderRadius: radii.input,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    fontFamily: fonts.body,
    fontSize: typography.body,
  },
  disclosure: {
    minHeight: 54,
    borderRadius: radii.button,
    borderWidth: 1,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  disclosureLabel: { fontFamily: fonts.displayBold, fontSize: typography.body },
  advanced: {
    borderRadius: radii.button,
    borderWidth: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    gap: spacing.xs,
  },
  colourRow: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  swatch: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
  },
  rowLabel: {
    flex: 1,
    fontFamily: fonts.displayBold,
    fontSize: typography.body,
  },
  stepperRow: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  stepperControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  stepButton: {
    width: 44,
    height: 44,
    borderRadius: radii.button,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  percentLabel: {
    minWidth: 44,
    textAlign: 'center',
    fontFamily: fonts.displayBold,
    fontSize: typography.callout,
  },
  footer: {
    borderTopWidth: 1,
    padding: spacing.lg,
    gap: spacing.md,
  },
  primaryButton: {
    minHeight: 60,
    borderRadius: radii.button,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontFamily: fonts.displayHeavy,
    fontSize: typography.body,
  },
  secondaryButton: {
    minHeight: 52,
    borderRadius: radii.button,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    fontFamily: fonts.displayBold,
    fontSize: typography.body,
  },
});
