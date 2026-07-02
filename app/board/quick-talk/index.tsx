/**
 * Quick Talk — saved phrases.
 *
 * Default view: a list of every saved phrase. Tap a phrase -> stops any
 * current speech and speaks it through the shared useSpeech hook. Long-press
 * -> action sheet (Edit / Delete / Move up / Move down) per principle 11.
 *
 * Edit Mode (toggled via "Edit" in the header, principle 25): each row gains
 * up/down arrow buttons + an inline X delete. Edit Mode hides the long-press
 * sheet so power features live where users expect them.
 *
 * "List is full" state appears at the top whenever the cap (25) is reached,
 * with a primary action to enter Edit Mode and remove items.
 */

import React, { useState } from 'react';
import {
  ActionSheetIOS,
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
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import { radii, spacing, typography } from '../../../src/theme/tokens';
import { hapticSelection } from '../../../src/utils/haptics';
import { useAppContext } from '../../../src/hooks/useAppContext';
import { useSpeech } from '../../../src/hooks/useSpeech';
import {
  QUICK_TALK_MAX,
  QuickTalkItem,
  isFull,
  moveQuickTalk,
  removeQuickTalk,
  updateQuickTalk,
  useQuickTalk,
} from '../../../src/features/quick-talk/store';
import { useTheme } from '../../../src/theme/useTheme';

// ─── Row ────────────────────────────────────────────────────────────────────

function PhraseRow({
  item,
  index,
  total,
  editMode,
  onTap,
  onLongPress,
  onMove,
  onDelete,
}: {
  item: QuickTalkItem;
  index: number;
  total: number;
  editMode: boolean;
  onTap: () => void;
  onLongPress: () => void;
  onMove: (dir: 'up' | 'down') => void;
  onDelete: () => void;
}) {
  const t = useTheme();
  return (
    <View style={styles.row}>
      {editMode ? (
        <View style={styles.editHandles}>
          <Pressable
            onPress={onDelete}
            hitSlop={10}
            accessibilityLabel={`Delete phrase ${index + 1}`}
            accessibilityRole="button"
            style={({ pressed }) => [styles.deleteHandle, pressed && { opacity: 0.85 }]}
          >
            <Ionicons name="remove" size={22} color="#FFFFFF" />
          </Pressable>
        </View>
      ) : null}

      <Pressable
        onPress={onTap}
        onLongPress={onLongPress}
        delayLongPress={350}
        accessibilityRole="button"
        accessibilityLabel={`Speak: ${item.text}`}
        style={({ pressed }) => [styles.card, pressed && { opacity: 0.94 }]}
      >
        <Ionicons name="volume-medium-outline" size={20} color={t.colors.primary} />
        <Text style={[styles.cardText, { color: t.colors.text }]} numberOfLines={3}>{item.text}</Text>
        {!editMode ? (
          <Ionicons name="reorder-three" size={22} color={t.colors.textTertiary} />
        ) : (
          <View style={styles.arrows}>
            <Pressable
              onPress={() => onMove('up')}
              disabled={index === 0}
              hitSlop={8}
              accessibilityLabel="Move up"
              accessibilityRole="button"
              style={({ pressed }) => [
                styles.arrowBtn,
                index === 0 && styles.arrowBtnDisabled,
                pressed && index !== 0 && { opacity: 0.85 },
              ]}
            >
              <Ionicons name="chevron-up" size={18} color={index === 0 ? t.colors.textTertiary : t.colors.primary} />
            </Pressable>
            <Pressable
              onPress={() => onMove('down')}
              disabled={index === total - 1}
              hitSlop={8}
              accessibilityLabel="Move down"
              accessibilityRole="button"
              style={({ pressed }) => [
                styles.arrowBtn,
                index === total - 1 && styles.arrowBtnDisabled,
                pressed && index !== total - 1 && { opacity: 0.85 },
              ]}
            >
              <Ionicons name="chevron-down" size={18} color={index === total - 1 ? t.colors.textTertiary : t.colors.primary} />
            </Pressable>
          </View>
        )}
      </Pressable>
    </View>
  );
}

// ─── Edit-phrase sheet ─────────────────────────────────────────────────────

function EditPhraseSheet({
  visible,
  initial,
  onSave,
  onCancel,
}: {
  visible: boolean;
  initial: string;
  onSave: (text: string) => void;
  onCancel: () => void;
}) {
  const t = useTheme();
  const [draft, setDraft] = useState<string>(initial);

  React.useEffect(() => {
    if (visible) setDraft(initial);
  }, [visible, initial]);

  const canSave = draft.trim().length > 0;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="formSheet" onRequestClose={onCancel}>
      <SafeAreaView style={[styles.sheet, { backgroundColor: t.colors.background }]} edges={['top']}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.sheetHeader}>
          <Pressable onPress={onCancel} accessibilityLabel="Cancel" style={styles.sheetTextBtn}>
            <Text style={[styles.sheetCancelText, { color: t.colors.textMuted }]}>Cancel</Text>
          </Pressable>
          <Text style={[styles.sheetTitle, { color: t.colors.text }]}>Edit Phrase</Text>
          <Pressable
            onPress={() => {
              if (!canSave) return;
              hapticSelection();
              onSave(draft.trim());
            }}
            accessibilityLabel="Save phrase"
            style={styles.sheetTextBtn}
          >
            <Text style={[styles.sheetSaveText, !canSave && styles.sheetSaveDisabled]}>Save</Text>
          </Pressable>
        </View>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <View style={styles.sheetBody}>
            <Text style={[styles.fieldEyebrow, { color: t.colors.textMuted }]}>PHRASE</Text>
            <TextInput
              value={draft}
              onChangeText={setDraft}
              placeholder="e.g. I want some water please"
              placeholderTextColor={t.colors.textTertiary}
              style={[styles.input, { color: t.colors.text, backgroundColor: t.colors.surface }]}
              maxLength={140}
              autoFocus
              multiline
              accessibilityLabel="Phrase text"
            />
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

// ─── Screen ────────────────────────────────────────────────────────────────

export default function QuickTalkScreen() {
  const t = useTheme();
  const router = useRouter();
  const { state } = useAppContext();
  const { speak, stop } = useSpeech();
  const items = useQuickTalk();
  const [editMode, setEditMode] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const editingItem = items.find(i => i.id === editingId);
  const total = items.length;
  const { speechRate, speechPitch } = state.accessibility;

  const showRowMenu = (item: QuickTalkItem, index: number) => {
    if (editMode) return; // Edit mode owns the actions.
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          title: item.text,
          options: ['Cancel', 'Edit', 'Move up', 'Move down', 'Delete'],
          cancelButtonIndex: 0,
          destructiveButtonIndex: 4,
          disabledButtonIndices: [
            ...(index === 0 ? [2] : []),
            ...(index === total - 1 ? [3] : []),
          ],
        },
        (buttonIndex) => {
          if (buttonIndex === 1) setEditingId(item.id);
          else if (buttonIndex === 2) moveQuickTalk(item.id, 'up');
          else if (buttonIndex === 3) moveQuickTalk(item.id, 'down');
          else if (buttonIndex === 4) confirmDelete(item.id);
        },
      );
    } else {
      // Android fallback — show a small confirm alert and go straight to edit.
      setEditingId(item.id);
    }
  };

  const confirmDelete = (id: string) => {
    Alert.alert(
      'Delete phrase?',
      'This phrase will be removed from Quick Talk.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => removeQuickTalk(id) },
      ],
      { cancelable: true },
    );
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: t.colors.background }]} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={16}
          style={styles.headerIconBtn}
          accessibilityLabel="Back"
          accessibilityRole="button"
        >
          <Ionicons name="chevron-back" size={28} color={t.colors.primary} />
        </Pressable>
        <Text style={[styles.title, { color: t.colors.text }]} accessibilityRole="header">Quick Talk</Text>
        {items.length > 0 ? (
          <Pressable
            onPress={() => {
              hapticSelection();
              setEditMode(v => !v);
            }}
            accessibilityRole="button"
            accessibilityLabel={editMode ? 'Done editing' : 'Edit list'}
            style={styles.editBtn}
          >
            <Text style={[styles.editBtnText, { color: t.colors.primary }]}>{editMode ? 'Done' : 'Edit'}</Text>
          </Pressable>
        ) : (
          <View style={styles.headerSpacer} />
        )}
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        bounces
        alwaysBounceVertical
        overScrollMode="always"
      >
        {isFull() ? (
          <View style={styles.fullBanner}>
            <Ionicons name="warning-outline" size={20} color={t.colors.warning} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.fullTitle, { color: t.colors.text }]}>Quick Talk is full</Text>
              <Text style={[styles.fullSub, { color: t.colors.textMuted }]}>
                You've saved {QUICK_TALK_MAX} phrases. Remove one to add another.
              </Text>
            </View>
          </View>
        ) : null}

        {items.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Ionicons name="chatbubbles-outline" size={64} color={t.colors.textTertiary} />
            <Text style={[styles.emptyTitle, { color: t.colors.text }]}>No saved phrases yet</Text>
            <Text style={[styles.emptySub, { color: t.colors.textMuted }]}>
              Build a sentence on the keyboard, then tap Save to keep it here for quick speaking.
            </Text>
          </View>
        ) : (
          <View style={{ gap: spacing.sm }}>
            {items.map((it, idx) => (
              <PhraseRow
                key={it.id}
                item={it}
                index={idx}
                total={total}
                editMode={editMode}
                onTap={() => {
                  hapticSelection();
                  stop();
                  speak(it.text, { rate: speechRate, pitch: speechPitch });
                }}
                onLongPress={() => {
                  hapticSelection();
                  showRowMenu(it, idx);
                }}
                onMove={(dir) => {
                  hapticSelection();
                  moveQuickTalk(it.id, dir);
                }}
                onDelete={() => confirmDelete(it.id)}
              />
            ))}
          </View>
        )}

        {items.length > 0 ? (
          <Text style={[styles.countLine, { color: t.colors.textMuted }]}>
            {items.length} / {QUICK_TALK_MAX} saved
          </Text>
        ) : null}
      </ScrollView>

      <EditPhraseSheet
        visible={!!editingItem}
        initial={editingItem?.text ?? ''}
        onSave={(text) => {
          if (editingItem) updateQuickTalk(editingItem.id, text);
          setEditingId(null);
        }}
        onCancel={() => setEditingId(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1},

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    gap: spacing.md},
  headerIconBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  title: {
    flex: 1,
    fontSize: typography.heading,
    fontWeight: '900',

    letterSpacing: typography.trackHeading},
  headerSpacer: { width: 44 },
  editBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6},
  editBtnText: {
    fontSize: typography.body,
    fontWeight: '800'},

  scroll: {
    padding: spacing.lg,
    paddingBottom: 60,
    gap: spacing.lg},

  fullBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: 'rgba(255, 149, 0, 0.10)',
    borderRadius: radii.card},
  fullTitle: {
    fontSize: typography.body,
    fontWeight: '800'},
  fullSub: {
    marginTop: 2,
    fontSize: typography.caption},

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm},
  editHandles: {
    width: 36,
    alignItems: 'center'},
  deleteHandle: {
    width: 28,
    height: 28,
    borderRadius: 14,

    alignItems: 'center',
    justifyContent: 'center'},

  card: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,

    borderRadius: radii.card,
    minHeight: 60},
  cardText: {
    flex: 1,
    fontSize: typography.body,
    fontWeight: '700'},
  arrows: {
    flexDirection: 'row',
    gap: 4},
  arrowBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E6F4FD',
    alignItems: 'center',
    justifyContent: 'center'},
  arrowBtnDisabled: {

  },

  emptyWrap: {
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxl},
  emptyTitle: {
    fontSize: typography.subheading,
    fontWeight: '800'},
  emptySub: {
    fontSize: typography.body,

    textAlign: 'center',
    lineHeight: 24},

  countLine: {
    textAlign: 'center',
    fontSize: typography.caption,

    fontWeight: '600'},

  // ── Edit sheet ──
  sheet: { flex: 1},
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderBottomColor: '#E0E5EA',
    borderBottomWidth: StyleSheet.hairlineWidth},
  sheetTextBtn: { paddingHorizontal: 4, paddingVertical: 6 },
  sheetCancelText: {

    fontSize: typography.body,
    fontWeight: '600'},
  sheetSaveText: {

    fontSize: typography.body,
    fontWeight: '800'},
  sheetSaveDisabled: { },
  sheetTitle: {
    fontSize: typography.subheading,
    fontWeight: '800'},
  sheetBody: {
    flex: 1,
    padding: spacing.lg,
    gap: spacing.md},
  fieldEyebrow: {
    fontSize: typography.caption,
    fontWeight: '800',

    letterSpacing: 1.1,
    textTransform: 'uppercase'},
  input: {

    borderRadius: radii.card,
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
    fontSize: typography.body,

    minHeight: 120,
    textAlignVertical: 'top'},
});
