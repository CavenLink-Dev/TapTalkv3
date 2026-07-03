/**
 * Account / User Profile — a calm, focused identity page.
 *
 * Opened from the Account Card on the Profile tab. Identity editing only:
 * profile picture (via the reusable Pick A Picture control), username, display
 * name, nickname, user type, and optional local-only contact details.
 *
 * Every change applies immediately (dispatch → reducer → re-render). Optional
 * legal name / phone are stored on-device only and clearly labelled — under
 * the Australian Privacy Act (APPs) this is the user's own data on their own
 * device; TapTalk never uploads it.
 */

import React, { useCallback, useState } from 'react';
import {
  ActionSheetIOS,
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../../src/components/native/Card';
import { PrimaryButton } from '../../src/components/native/PrimaryButton';
import { TextField } from '../../src/components/native/TextField';
import { PicturePicker } from '../../src/components/native/PicturePicker';
import { useAppContext } from '../../src/hooks/useAppContext';
import { useTheme } from '../../src/theme/useTheme';
import { radii, spacing, typography } from '../../src/theme/tokens';
import { fonts } from '../../src/theme/fonts';
import { hapticSelection, hapticSuccess } from '../../src/utils/haptics';

const USER_TYPE_LABELS: Record<string, string> = {
  myself: 'AAC user',
  parent: 'Parent / Family',
  support: 'Support worker',
  guardian: 'Therapist',
};

type Role = 'myself' | 'parent' | 'support' | 'guardian';

const ROLE_OPTIONS: { label: string; role: Role }[] = [
  { label: 'AAC user', role: 'myself' },
  { label: 'Parent / Family', role: 'parent' },
  { label: 'Support worker', role: 'support' },
  { label: 'Therapist', role: 'guardian' },
];

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

function validateUsername(raw: string): string | null {
  const v = raw.trim();
  if (v.length < 8) return 'Use 8 or more characters.';
  if (!/^[A-Za-z0-9]+$/.test(v)) return 'Letters and numbers only — no spaces or symbols.';
  return null;
}

export default function AccountScreen() {
  const router = useRouter();
  const { state, dispatch } = useAppContext();
  const t = useTheme();

  const [editor, setEditor] = useState<null | {
    field: 'username' | 'displayName' | 'nickname' | 'legalName' | 'phone';
    title: string;
    desc: string;
    placeholder: string;
    value: string;
    validate?: (v: string) => string | null;
    keyboardType?: 'default' | 'phone-pad';
    autoCapitalize?: 'none' | 'words';
    requireValue?: boolean;
  }>(null);
  const [draft, setDraft] = useState('');
  const [saveNotice, setSaveNotice] = useState('');

  const name = state.user.displayName || state.user.name || 'Guest';
  const displayName = name === 'Guest' ? '' : name;
  const nickname = state.user.nickname && state.user.nickname !== name ? state.user.nickname : '';
  const initial = (name.charAt(0) || '?').toUpperCase();
  const userType = state.user.role ? USER_TYPE_LABELS[state.user.role] ?? 'Not set' : 'Not set';

  const notify = useCallback((message: string) => {
    setSaveNotice(message);
    hapticSuccess();
    setTimeout(() => setSaveNotice(''), 2200);
  }, []);

  // Dispatch only — used for live typing (no toast on every keystroke).
  const applyUser = useCallback(
    (payload: Partial<typeof state.user>) => {
      dispatch({ type: 'SET_USER', payload });
    },
    [dispatch],
  );

  const setUser = useCallback(
    (payload: Partial<typeof state.user>, message: string) => {
      applyUser(payload);
      notify(message);
    },
    [applyUser, notify],
  );

  // Picture — takes effect immediately.
  const onPicture = useCallback(
    (value: string | null) => {
      dispatch({ type: 'SET_PROFILE_PHOTO', payload: value });
      notify('Picture updated');
    },
    [dispatch, notify],
  );

  const openEditor = useCallback((cfg: NonNullable<typeof editor>) => {
    hapticSelection();
    setDraft(cfg.value);
    setEditor(cfg);
  }, []);

  // Live update — applies each valid keystroke to the profile so the identity
  // header and field rows reflect changes immediately, before the editor closes.
  const applyLive = useCallback(
    (field: NonNullable<typeof editor>['field'], value: string) => {
      switch (field) {
        case 'username':
          applyUser({ username: value });
          break;
        case 'displayName':
          applyUser({ displayName: value, name: value });
          break;
        case 'nickname':
          applyUser({ nickname: value });
          break;
        case 'legalName':
          applyUser({ legalName: value });
          break;
        case 'phone':
          applyUser({ phone: value });
          break;
      }
    },
    [applyUser],
  );

  const handleDraftChange = useCallback(
    (next: string) => {
      setDraft(next);
      if (!editor) return;
      const value = next.trim();
      if (editor.validate && editor.validate(value)) return; // wait for a valid value
      if (editor.requireValue && !value) return; // never wipe a required field live
      applyLive(editor.field, value);
    },
    [editor, applyLive],
  );

  const commitEditor = useCallback(() => {
    if (!editor) return;
    const value = draft.trim();
    if (editor.validate && editor.validate(value)) return;
    if (editor.requireValue && !value) return;
    switch (editor.field) {
      case 'username':
        setUser({ username: value }, 'Username updated');
        break;
      case 'displayName':
        setUser({ displayName: value, name: value }, 'Name updated');
        break;
      case 'nickname':
        setUser({ nickname: value }, value ? 'Nickname updated' : 'Nickname cleared');
        break;
      case 'legalName':
        setUser({ legalName: value }, value ? 'Legal name updated' : 'Legal name cleared');
        break;
      case 'phone':
        setUser({ phone: value }, value ? 'Phone updated' : 'Phone cleared');
        break;
    }
    setEditor(null);
  }, [editor, draft, setUser]);

  // Cancel restores the value captured when the editor opened, undoing any live
  // edits so Cancel still means "leave it as it was".
  const cancelEditor = useCallback(() => {
    if (editor) applyLive(editor.field, editor.value.trim());
    setEditor(null);
  }, [editor, applyLive]);

  const onEditUserType = useCallback(() => {
    hapticSelection();
    const options = [...ROLE_OPTIONS.map((r) => r.label), 'Cancel'];
    const cancelButtonIndex = options.length - 1;
    const pick = (index: number) => {
      const role = ROLE_OPTIONS[index]?.role;
      if (!role) return;
      setUser({ role }, 'User type updated');
    };
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions({ options, cancelButtonIndex, title: 'User Type' }, pick);
    } else {
      Alert.alert('User Type', undefined, [
        ...ROLE_OPTIONS.map((r, i) => ({ text: r.label, onPress: () => pick(i) })),
        { text: 'Cancel', style: 'cancel' as const },
      ]);
    }
  }, [setUser]);

  const draftError = editor?.validate ? editor.validate(draft.trim()) : null;

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
        <Text style={[styles.headerTitle, { color: t.colors.text }]}>Account</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        bounces
        alwaysBounceVertical
        overScrollMode="always"
      >
        {saveNotice ? (
          <Text
            style={[styles.saveNotice, { color: t.colors.success }]}
            accessibilityLiveRegion="polite"
            accessibilityRole="alert"
          >
            {saveNotice}
          </Text>
        ) : null}

        {/* Centred identity — 32px top padding */}
        <View style={styles.identityBlock}>
          <PicturePicker value={state.profilePhotoUri} initial={initial} onChange={onPicture} size={112} />
          <Text style={[styles.identityName, { color: t.colors.text }]} numberOfLines={1}>
            {name}
          </Text>
        </View>

        {/* Identity — circular profile symbols on each row */}
        <Text style={[styles.groupLabel, { color: t.colors.textTertiary }]}>PROFILE</Text>
        <Card style={styles.groupCard}>
          <FieldRow
            icon="at-outline"
            label="Username"
            value={state.user.username || 'Not set'}
            onPress={() =>
              openEditor({
                field: 'username',
                title: 'Username',
                desc: 'A handle for your profile. 8+ characters, letters and numbers only.',
                placeholder: 'e.g. alexchat24',
                value: state.user.username,
                validate: validateUsername,
                autoCapitalize: 'none',
              })
            }
          />
          <Divider />
          <FieldRow
            icon="person-outline"
            label="Display Name"
            value={displayName || 'Not set'}
            onPress={() =>
              openEditor({
                field: 'displayName',
                title: 'Display Name',
                desc: 'The name shown on your profile.',
                placeholder: 'e.g. Alex',
                value: displayName,
                autoCapitalize: 'words',
                requireValue: true,
              })
            }
          />
          <Divider />
          <FieldRow
            icon="happy-outline"
            label="Nickname"
            value={nickname || 'Optional'}
            onPress={() =>
              openEditor({
                field: 'nickname',
                title: 'Nickname',
                desc: 'An optional short name. Leave blank to remove it.',
                placeholder: 'e.g. Al',
                value: nickname,
                autoCapitalize: 'words',
              })
            }
          />
          <Divider />
          <FieldRow icon="people-outline" label="User Type" value={userType} onPress={onEditUserType} last />
        </Card>

        {/* Optional contact — local only */}
        <Text style={[styles.groupLabel, { color: t.colors.textTertiary }]}>CONTACT (OPTIONAL)</Text>
        <Card style={styles.groupCard}>
          <FieldRow
            icon="id-card-outline"
            label="Legal Name"
            value={state.user.legalName || 'Optional'}
            onPress={() =>
              openEditor({
                field: 'legalName',
                title: 'Legal Name',
                desc: 'Optional. Stored only on this device and never uploaded.',
                placeholder: 'e.g. Alexandra Smith',
                value: state.user.legalName,
                autoCapitalize: 'words',
              })
            }
          />
          <Divider />
          <FieldRow
            icon="call-outline"
            label="Phone"
            value={state.user.phone || 'Optional'}
            onPress={() =>
              openEditor({
                field: 'phone',
                title: 'Phone',
                desc: 'Optional. Stored only on this device and never uploaded.',
                placeholder: 'e.g. 0400 000 000',
                value: state.user.phone,
                keyboardType: 'phone-pad',
              })
            }
            last
          />
        </Card>

        <Text style={[styles.footnote, { color: t.colors.textTertiary }]}>
          TapTalk keeps your details on this device. Contact fields are optional and are never
          shared or uploaded.
        </Text>
      </ScrollView>

      {/* Edit modal (shared) */}
      <Modal visible={!!editor} transparent animationType="fade" onRequestClose={cancelEditor}>
        <Pressable
          style={styles.modalBackdrop}
          accessibilityRole="button"
          accessibilityLabel="Dismiss editor"
          onPress={cancelEditor}
        >
          <Pressable style={[styles.modalCard, { backgroundColor: t.colors.surface }]} onPress={(e) => e.stopPropagation()}>
            <Text style={[styles.modalTitle, { color: t.colors.text }]}>{editor?.title}</Text>
            <Text style={[styles.modalDesc, { color: t.colors.textMuted }]}>{editor?.desc}</Text>
            <TextField
              accessibilityLabel={editor?.title ?? 'Value'}
              placeholder={editor?.placeholder}
              value={draft}
              onChangeText={handleDraftChange}
              autoFocus
              autoCapitalize={editor?.autoCapitalize ?? 'sentences'}
              autoCorrect={false}
              keyboardType={editor?.keyboardType ?? 'default'}
            />
            {draft.trim() && draftError ? (
              <Text style={[styles.errorText, { color: t.colors.danger }]} accessibilityLiveRegion="polite">
                {draftError}
              </Text>
            ) : null}
            <View style={styles.modalActions}>
              <PrimaryButton
                accessibilityLabel="Cancel"
                label="Cancel"
                variant="secondary"
                onPress={cancelEditor}
                style={styles.modalButton}
              />
              <PrimaryButton
                accessibilityLabel={`Save ${editor?.title ?? ''}`}
                label="Done"
                disabled={(editor?.requireValue ? !draft.trim() : false) || !!draftError}
                onPress={commitEditor}
                style={styles.modalButton}
              />
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

function FieldRow({
  icon,
  label,
  value,
  onPress,
  last,
}: {
  icon: IoniconName;
  label: string;
  value: string;
  onPress: () => void;
  last?: boolean;
}) {
  const t = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${label}, ${value}`}
      onPress={onPress}
      style={({ pressed }) => [styles.fieldRow, last && styles.fieldRowLast, pressed && { opacity: 0.7 }]}
    >
      <View style={[styles.fieldIcon, { backgroundColor: t.colors.iconTintBlueBg }]}>
        <Ionicons name={icon} size={18} color={t.colors.primary} />
      </View>
      <Text style={[styles.fieldLabel, { color: t.colors.text }]}>{label}</Text>
      <Text style={[styles.fieldValue, { color: t.colors.textTertiary }]} numberOfLines={1}>
        {value}
      </Text>
      <Ionicons
        name="chevron-forward"
        size={17}
        color={t.colors.textTertiary}
        accessibilityElementsHidden
        importantForAccessibility="no"
      />
    </Pressable>
  );
}

function Divider() {
  const t = useTheme();
  return <View style={[styles.divider, { backgroundColor: t.colors.input }]} />;
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
  headerSpacer: { width: 44 },

  content: { padding: spacing.lg, paddingBottom: 40 },
  saveNotice: {
    fontFamily: fonts.displayBold,
    fontSize: typography.caption,
    textAlign: 'center',
    marginBottom: spacing.md,
  },

  identityBlock: { alignItems: 'center', paddingTop: 32, marginBottom: spacing.xxl },
  identityName: {
    fontFamily: fonts.displayHeavy,
    fontSize: typography.heading,
    letterSpacing: -0.4,
    marginTop: spacing.md,
  },

  groupLabel: {
    fontFamily: fonts.bodyHeavy,
    fontSize: typography.eyebrow,
    letterSpacing: 0.8,
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
    marginTop: spacing.lg,
  },
  groupCard: { padding: 0, overflow: 'hidden' },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 13,
    minHeight: 56,
  },
  fieldRowLast: {},
  fieldIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fieldLabel: { flex: 1, fontFamily: fonts.displayBold, fontSize: typography.body },
  fieldValue: { fontFamily: fonts.body, fontSize: typography.callout, maxWidth: '42%', textAlign: 'right' },
  divider: { height: 1, marginLeft: 32 + spacing.md + spacing.md },

  footnote: {
    fontFamily: fonts.body,
    fontSize: typography.caption,
    lineHeight: 19,
    marginTop: spacing.lg,
    marginHorizontal: spacing.xs,
  },

  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  modalCard: { borderRadius: radii.card, padding: spacing.lg, gap: spacing.md },
  modalTitle: { fontFamily: fonts.displayHeavy, fontSize: typography.subheading },
  modalDesc: { fontFamily: fonts.body, fontSize: typography.callout },
  errorText: { fontFamily: fonts.displayBold, fontSize: typography.caption },
  modalActions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs },
  modalButton: { flex: 1 },
});
