/**
 * Pronunciations — user overrides for how the voice says names and words.
 *
 * expo-speech mispronounces personal names and local terms constantly; for an
 * AAC user a mangled name is a real communication failure. Here the user adds
 * "say X as Y" rules, previews them, and removes them. Rules apply everywhere
 * speech is built (board + keyboard) via speechRules.setPronunciations, kept in
 * sync by AppContext. Calm, iOS-native, tokens only.
 */

import React, { useCallback, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../../src/components/native/Card';
import { PrimaryButton } from '../../src/components/native/PrimaryButton';
import { TextField } from '../../src/components/native/TextField';
import { useAppContext } from '../../src/hooks/useAppContext';
import { useSpeech } from '../../src/hooks/useSpeech';
import { useTheme } from '../../src/theme/useTheme';
import { radii, spacing, typography } from '../../src/theme/tokens';
import { fonts } from '../../src/theme/fonts';
import { hapticSelection, hapticSuccess } from '../../src/utils/haptics';

export default function PronunciationScreen() {
  const router = useRouter();
  const { state, dispatch } = useAppContext();
  const { speak, stop } = useSpeech();
  const t = useTheme();
  const { speechRate, speechPitch } = state.accessibility;

  const [modalVisible, setModalVisible] = useState(false);
  const [fromDraft, setFromDraft] = useState('');
  const [toDraft, setToDraft] = useState('');

  const openAdd = useCallback(() => {
    hapticSelection();
    setFromDraft('');
    setToDraft('');
    setModalVisible(true);
  }, []);

  const save = useCallback(() => {
    const from = fromDraft.trim();
    const to = toDraft.trim();
    if (!from || !to) return;
    dispatch({ type: 'ADD_PRONUNCIATION', payload: { id: `p-${Date.now()}`, from, to } });
    hapticSuccess();
    setModalVisible(false);
  }, [dispatch, fromDraft, toDraft]);

  const remove = useCallback(
    (id: string) => {
      hapticSelection();
      dispatch({ type: 'DELETE_PRONUNCIATION', payload: id });
    },
    [dispatch],
  );

  const preview = useCallback(
    (spoken: string) => {
      hapticSelection();
      stop();
      speak(spoken, { rate: speechRate, pitch: speechPitch });
    },
    [speak, stop, speechRate, speechPitch],
  );

  const rules = state.pronunciations;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: t.colors.background }]} edges={['top']}>
      <View style={[styles.header, { backgroundColor: t.colors.surface, borderBottomColor: t.colors.border }]}>
        <Pressable
          onPress={() => {
            hapticSelection();
            router.back();
          }}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          style={styles.backButton}
          hitSlop={8}
        >
          <Ionicons name="chevron-back" size={26} color={t.colors.primary} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: t.colors.text }]}>Pronunciations</Text>
        <Pressable
          onPress={openAdd}
          accessibilityRole="button"
          accessibilityLabel="Add a pronunciation"
          style={styles.addButton}
          hitSlop={8}
        >
          <Ionicons name="add" size={28} color={t.colors.primary} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        bounces
        alwaysBounceVertical
        overScrollMode="always"
      >
        <Text style={[styles.intro, { color: t.colors.textMuted }]}>
          Teach the voice how to say a name or word. Type the word, then how it should sound — for
          example, say “Siobhan” as “shiv-awn”.
        </Text>

        {rules.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Ionicons name="chatbubble-ellipses-outline" size={40} color={t.colors.primary} />
            <Text style={[styles.emptyTitle, { color: t.colors.text }]}>No pronunciations yet</Text>
            <Text style={[styles.emptyDesc, { color: t.colors.textMuted }]}>
              Add one and TapTalk will say it your way everywhere it speaks.
            </Text>
            <PrimaryButton
              accessibilityLabel="Add a pronunciation"
              label="Add Pronunciation"
              onPress={openAdd}
              style={styles.emptyButton}
            />
          </Card>
        ) : (
          <Card style={styles.listCard}>
            {rules.map((rule, i) => (
              <View key={rule.id}>
                <View style={styles.row}>
                  <View style={styles.rowCopy}>
                    <Text style={[styles.rowFrom, { color: t.colors.text }]} numberOfLines={1}>
                      {rule.from}
                    </Text>
                    <Text style={[styles.rowTo, { color: t.colors.textMuted }]} numberOfLines={1}>
                      said as “{rule.to}”
                    </Text>
                  </View>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Preview ${rule.from}`}
                    onPress={() => preview(rule.to)}
                    hitSlop={8}
                    style={({ pressed }) => [
                      styles.iconBtn,
                      { backgroundColor: t.colors.selectionBg },
                      pressed && { opacity: 0.7 },
                    ]}
                  >
                    <Ionicons name="volume-high-outline" size={20} color={t.colors.primary} />
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Delete ${rule.from}`}
                    onPress={() => remove(rule.id)}
                    hitSlop={8}
                    style={({ pressed }) => [
                      styles.iconBtn,
                      { backgroundColor: t.colors.iconTintDangerBg },
                      pressed && { opacity: 0.7 },
                    ]}
                  >
                    <Ionicons name="trash-outline" size={20} color={t.colors.danger} />
                  </Pressable>
                </View>
                {i < rules.length - 1 ? (
                  <View style={[styles.divider, { backgroundColor: t.colors.input }]} />
                ) : null}
              </View>
            ))}
          </Card>
        )}
      </ScrollView>

      {/* Add modal */}
      <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={() => setModalVisible(false)}>
        <Pressable
          style={styles.modalBackdrop}
          accessibilityRole="button"
          accessibilityLabel="Dismiss"
          onPress={() => setModalVisible(false)}
        >
          <Pressable style={[styles.modalCard, { backgroundColor: t.colors.surface }]} onPress={(e) => e.stopPropagation()}>
            <Text style={[styles.modalTitle, { color: t.colors.text }]}>Add Pronunciation</Text>

            <View>
              <Text style={[styles.fieldLabel, { color: t.colors.textTertiary }]}>WORD OR NAME</Text>
              <TextField
                accessibilityLabel="Word or name"
                placeholder="e.g. Siobhan"
                value={fromDraft}
                onChangeText={setFromDraft}
                autoFocus
                autoCapitalize="none"
              />
            </View>

            <View>
              <Text style={[styles.fieldLabel, { color: t.colors.textTertiary }]}>SAY IT AS</Text>
              <TextField
                accessibilityLabel="Say it as"
                placeholder="e.g. shiv-awn"
                value={toDraft}
                onChangeText={setToDraft}
                autoCapitalize="none"
              />
            </View>

            <View style={styles.modalActions}>
              <PrimaryButton
                accessibilityLabel="Preview"
                label="Preview"
                variant="secondary"
                disabled={!toDraft.trim()}
                onPress={() => preview(toDraft.trim())}
                style={styles.modalButton}
              />
              <PrimaryButton
                accessibilityLabel="Save pronunciation"
                label="Save"
                disabled={!fromDraft.trim() || !toDraft.trim()}
                onPress={save}
                style={styles.modalButton}
              />
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
  },
  backButton: { width: 44, height: 44, alignItems: 'flex-start', justifyContent: 'center' },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontFamily: fonts.displayHeavy,
    fontSize: typography.body,
    letterSpacing: -0.2,
  },
  addButton: { width: 44, height: 44, alignItems: 'flex-end', justifyContent: 'center' },

  content: { padding: spacing.lg, paddingBottom: 40, gap: spacing.lg },
  intro: { fontFamily: fonts.body, fontSize: typography.callout, lineHeight: 21 },

  emptyCard: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xl },
  emptyTitle: { fontFamily: fonts.displayHeavy, fontSize: typography.subheading },
  emptyDesc: {
    fontFamily: fonts.body,
    fontSize: typography.callout,
    lineHeight: 21,
    textAlign: 'center',
  },
  emptyButton: { marginTop: spacing.sm, alignSelf: 'stretch' },

  listCard: { padding: 0, overflow: 'hidden' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: 60,
  },
  rowCopy: { flex: 1, gap: 2 },
  rowFrom: { fontFamily: fonts.displayBold, fontSize: typography.body },
  rowTo: { fontFamily: fonts.body, fontSize: typography.callout },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: radii.button,
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: { height: 1, marginLeft: spacing.md },

  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  modalCard: { borderRadius: radii.card, padding: spacing.lg, gap: spacing.md },
  modalTitle: { fontFamily: fonts.displayHeavy, fontSize: typography.subheading },
  fieldLabel: {
    fontFamily: fonts.bodyHeavy,
    fontSize: typography.eyebrow,
    letterSpacing: 0.8,
    marginBottom: spacing.xs,
    marginLeft: spacing.xs,
  },
  modalActions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs },
  modalButton: { flex: 1 },
});
