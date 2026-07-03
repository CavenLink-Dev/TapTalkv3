/**
 * Account / User Profile — a calm, focused identity page.
 *
 * Opened from the Account Card on the Profile tab. Scope is deliberately
 * narrow (Rule 2 / Rule 30): profile image, display name, optional nickname,
 * and user type. No legal name, phone, address, or clinical fields live here.
 *
 * Profile-image editing uses a native action sheet (Rule 6 / iOS-native).
 * Photo + camera stay honest stubs until the image picker ships; symbol,
 * colour, mascot, and remove all take effect immediately (Rule 13). No
 * camera/photo permission is requested until the user picks that action.
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
import { MulberrySymbol } from '../../src/components/symbols/MulberrySymbol';
import { AvatarView } from '../../src/features/profile/AvatarView';
import {
  AVATAR_COLORS,
  AVATAR_MASCOT_VALUE,
  AVATAR_SYMBOLS,
  encodeColor,
  encodeSymbol,
  hasCustomAvatar,
  parseAvatar,
} from '../../src/features/profile/avatar';
import { useAppContext } from '../../src/hooks/useAppContext';
import { useReduceMotion } from '../../src/hooks/useReduceMotion';
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

export default function AccountScreen() {
  const router = useRouter();
  const reduceMotion = useReduceMotion();
  const { state, dispatch } = useAppContext();
  const t = useTheme();

  const [symbolPickerVisible, setSymbolPickerVisible] = useState(false);
  const [colorPickerVisible, setColorPickerVisible] = useState(false);
  const [nameModalVisible, setNameModalVisible] = useState(false);
  const [nickModalVisible, setNickModalVisible] = useState(false);
  const [nameDraft, setNameDraft] = useState('');
  const [nickDraft, setNickDraft] = useState('');
  const [saveNotice, setSaveNotice] = useState('');

  const name = state.user.displayName || state.user.name || 'Guest';
  const displayName = name === 'Guest' ? '' : name;
  const nickname = state.user.nickname && state.user.nickname !== name ? state.user.nickname : '';
  const initial = (name.charAt(0) || '?').toUpperCase();
  const userType = state.user.role ? USER_TYPE_LABELS[state.user.role] ?? 'Not set' : 'Not set';
  const avatar = parseAvatar(state.profilePhotoUri);

  const avatarSummary =
    avatar.kind === 'symbol'
      ? 'Symbol'
      : avatar.kind === 'color'
        ? 'Colour'
        : avatar.kind === 'mascot'
          ? 'TapTalk avatar'
          : avatar.kind === 'photo'
            ? 'Photo'
            : 'Initial';

  const notify = useCallback((message: string) => {
    setSaveNotice(message);
    hapticSuccess();
    setTimeout(() => setSaveNotice(''), 2200);
  }, []);

  const setPhoto = useCallback(
    (value: string | null, message: string) => {
      dispatch({ type: 'SET_PROFILE_PHOTO', payload: value });
      notify(message);
    },
    [dispatch, notify],
  );

  const saveDisplayName = useCallback(
    (raw: string) => {
      const trimmed = raw.trim();
      if (!trimmed) return;
      dispatch({ type: 'SET_USER', payload: { displayName: trimmed, name: trimmed } });
      notify('Name updated');
    },
    [dispatch, notify],
  );

  const saveNickname = useCallback(
    (raw: string) => {
      const trimmed = raw.trim();
      dispatch({ type: 'SET_USER', payload: { nickname: trimmed } });
      notify(trimmed ? 'Nickname updated' : 'Nickname cleared');
    },
    [dispatch, notify],
  );

  // ── Photo / camera stay honest until the image picker ships. Non-photo
  //    options all work today, so the user is never stuck (privacy rule). ──
  const photoUnavailable = useCallback(() => {
    Alert.alert(
      'Photos arrive soon',
      'Choosing a photo or taking one arrives in a later update. For now you can use a symbol, a colour, or the TapTalk avatar — all work right away.',
      [{ text: 'OK', style: 'cancel' }],
    );
  }, []);

  const onEditPicture = useCallback(() => {
    hapticSelection();
    const hasPhoto = hasCustomAvatar(state.profilePhotoUri);
    const options = [
      'Choose from Library',
      'Take Photo',
      'Choose Symbol',
      'Choose Colour',
      'Use TapTalk Avatar',
      ...(hasPhoto ? ['Remove Current Picture'] : []),
      'Cancel',
    ];
    const cancelButtonIndex = options.length - 1;
    const removeIndex = hasPhoto ? options.length - 2 : -1;

    const handle = (index: number) => {
      switch (options[index]) {
        case 'Choose from Library':
        case 'Take Photo':
          photoUnavailable();
          break;
        case 'Choose Symbol':
          setSymbolPickerVisible(true);
          break;
        case 'Choose Colour':
          setColorPickerVisible(true);
          break;
        case 'Use TapTalk Avatar':
          setPhoto(AVATAR_MASCOT_VALUE, 'Using TapTalk avatar');
          break;
        case 'Remove Current Picture':
          setPhoto(null, 'Picture removed');
          break;
        default:
          break;
      }
    };

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options,
          cancelButtonIndex,
          destructiveButtonIndex: removeIndex >= 0 ? removeIndex : undefined,
          title: 'Profile Picture',
        },
        handle,
      );
    } else {
      Alert.alert('Profile Picture', undefined, [
        ...options.slice(0, cancelButtonIndex).map((opt, i) => ({
          text: opt,
          style: (i === removeIndex ? 'destructive' : 'default') as 'destructive' | 'default',
          onPress: () => handle(i),
        })),
        { text: 'Cancel', style: 'cancel' },
      ]);
    }
  }, [state.profilePhotoUri, photoUnavailable, setPhoto]);

  const onEditName = useCallback(() => {
    hapticSelection();
    if (Platform.OS === 'ios' && typeof Alert.prompt === 'function') {
      Alert.prompt(
        'Display Name',
        'The name shown on your profile.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Save', onPress: (text?: string) => saveDisplayName(text ?? '') },
        ],
        'plain-text',
        displayName,
      );
    } else {
      setNameDraft(displayName);
      setNameModalVisible(true);
    }
  }, [displayName, saveDisplayName]);

  const onEditNickname = useCallback(() => {
    hapticSelection();
    if (Platform.OS === 'ios' && typeof Alert.prompt === 'function') {
      Alert.prompt(
        'Nickname',
        'An optional short name. Leave blank to remove it.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Save', onPress: (text?: string) => saveNickname(text ?? '') },
        ],
        'plain-text',
        nickname,
      );
    } else {
      setNickDraft(nickname);
      setNickModalVisible(true);
    }
  }, [nickname, saveNickname]);

  const onEditUserType = useCallback(() => {
    hapticSelection();
    const options = [...ROLE_OPTIONS.map((r) => r.label), 'Cancel'];
    const cancelButtonIndex = options.length - 1;
    const pick = (index: number) => {
      const role = ROLE_OPTIONS[index]?.role;
      if (!role) return;
      dispatch({ type: 'SET_USER', payload: { role } });
      notify('User type updated');
    };
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions({ options, cancelButtonIndex, title: 'User Type' }, pick);
    } else {
      Alert.alert('User Type', undefined, [
        ...ROLE_OPTIONS.map((r, i) => ({ text: r.label, onPress: () => pick(i) })),
        { text: 'Cancel', style: 'cancel' as const },
      ]);
    }
  }, [dispatch, notify]);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: t.colors.background }]} edges={['top']}>
      {/* Native-style top bar with swipe-back-compatible back button */}
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

        {/* ── Centred identity block ── */}
        <View style={styles.identityBlock}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Edit profile picture. Current: ${avatarSummary}`}
            accessibilityHint="Opens options for a symbol, colour, avatar, or photo"
            onPress={onEditPicture}
            style={({ pressed }) => [styles.avatarPress, pressed && { opacity: 0.75 }]}
            hitSlop={8}
          >
            <AvatarView value={state.profilePhotoUri} size={112} initial={initial} />
            <View style={[styles.avatarBadge, { backgroundColor: t.colors.primary, borderColor: t.colors.surface }]}>
              <Ionicons name="camera" size={16} color="#FFFFFF" />
            </View>
          </Pressable>
          <Text style={[styles.identityName, { color: t.colors.text }]} numberOfLines={1}>
            {name}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Change profile picture"
            onPress={onEditPicture}
            hitSlop={8}
            style={({ pressed }) => [styles.editPictureLink, pressed && { opacity: 0.6 }]}
          >
            <Text style={[styles.editPictureText, { color: t.colors.primary }]}>Edit Picture</Text>
          </Pressable>
        </View>

        {/* ── Identity fields ── */}
        <Text style={[styles.groupLabel, { color: t.colors.textTertiary }]}>YOUR DETAILS</Text>
        <Card style={styles.groupCard}>
          <FieldRow
            label="Display Name"
            value={displayName || 'Not set'}
            onPress={onEditName}
            hint="Edit the name shown on your profile"
          />
          <Divider />
          <FieldRow
            label="Nickname"
            value={nickname || 'Optional'}
            onPress={onEditNickname}
            hint="Add or change an optional short name"
          />
          <Divider />
          <FieldRow
            label="User Type"
            value={userType}
            onPress={onEditUserType}
            hint="Who is using TapTalk on this device"
            last
          />
        </Card>

        <Text style={[styles.footnote, { color: t.colors.textTertiary }]}>
          TapTalk only asks for what it needs to show your profile. It never asks for a legal name,
          phone number, address, or clinical details.
        </Text>
      </ScrollView>

      {/* Symbol picker */}
      <PickerSheet
        visible={symbolPickerVisible}
        title="Choose Symbol"
        reduceMotion={reduceMotion}
        onClose={() => setSymbolPickerVisible(false)}
      >
        <View style={styles.grid}>
          {AVATAR_SYMBOLS.map((s) => {
            const isOn = avatar.kind === 'symbol' && avatar.symbolId === s.symbolId;
            return (
              <Pressable
                key={s.symbolId}
                accessibilityRole="button"
                accessibilityLabel={`Use ${s.name} symbol`}
                accessibilityState={{ selected: isOn }}
                onPress={() => {
                  setPhoto(encodeSymbol(s.symbolId), 'Symbol updated');
                  setSymbolPickerVisible(false);
                }}
                style={({ pressed }) => [
                  styles.cell,
                  { backgroundColor: pressed || isOn ? t.colors.selectionBg : t.colors.input },
                ]}
              >
                <MulberrySymbol symbolId={s.symbolId} size={44} />
                <Text style={[styles.cellLabel, { color: t.colors.text }]} numberOfLines={1}>
                  {s.name}
                </Text>
                {isOn ? <Check color={t.colors.primary} surface={t.colors.surface} /> : null}
              </Pressable>
            );
          })}
        </View>
      </PickerSheet>

      {/* Colour picker */}
      <PickerSheet
        visible={colorPickerVisible}
        title="Choose Colour"
        reduceMotion={reduceMotion}
        onClose={() => setColorPickerVisible(false)}
      >
        <View style={styles.grid}>
          {AVATAR_COLORS.map((c) => {
            const isOn = avatar.kind === 'color' && avatar.hex === c.hex;
            return (
              <Pressable
                key={c.hex}
                accessibilityRole="button"
                accessibilityLabel={`Use ${c.name} background`}
                accessibilityState={{ selected: isOn }}
                onPress={() => {
                  setPhoto(encodeColor(c.hex), 'Colour updated');
                  setColorPickerVisible(false);
                }}
                style={({ pressed }) => [styles.cell, pressed && { opacity: 0.85 }]}
              >
                <View style={[styles.swatch, { backgroundColor: c.hex }]}>
                  <Text style={styles.swatchInitial} allowFontScaling={false}>
                    {initial}
                  </Text>
                </View>
                <Text style={[styles.cellLabel, { color: t.colors.text }]} numberOfLines={1}>
                  {c.name}
                </Text>
                {isOn ? <Check color={t.colors.primary} surface={t.colors.surface} /> : null}
              </Pressable>
            );
          })}
        </View>
      </PickerSheet>

      {/* Name / nickname fallback modals (non-iOS or when Alert.prompt is absent) */}
      <EditModal
        visible={nameModalVisible}
        title="Display Name"
        desc="The name shown on your profile."
        placeholder="e.g. Alex"
        value={nameDraft}
        onChange={setNameDraft}
        requireValue
        onSave={() => {
          saveDisplayName(nameDraft);
          setNameModalVisible(false);
        }}
        onCancel={() => setNameModalVisible(false)}
      />
      <EditModal
        visible={nickModalVisible}
        title="Nickname"
        desc="An optional short name. Leave blank to remove it."
        placeholder="e.g. Al"
        value={nickDraft}
        onChange={setNickDraft}
        onSave={() => {
          saveNickname(nickDraft);
          setNickModalVisible(false);
        }}
        onCancel={() => setNickModalVisible(false)}
      />
    </SafeAreaView>
  );
}

// ── Small building blocks ────────────────────────────────────────────────────

function FieldRow({
  label,
  value,
  onPress,
  hint,
  last,
}: {
  label: string;
  value: string;
  onPress: () => void;
  hint?: string;
  last?: boolean;
}) {
  const t = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${label}, ${value}`}
      accessibilityHint={hint}
      onPress={() => {
        hapticSelection();
        onPress();
      }}
      style={({ pressed }) => [styles.fieldRow, last && styles.fieldRowLast, pressed && { opacity: 0.7 }]}
    >
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

function Check({ color, surface }: { color: string; surface: string }) {
  return (
    <View style={[styles.check, { backgroundColor: color }]}>
      <Ionicons name="checkmark" size={12} color={surface} />
    </View>
  );
}

function PickerSheet({
  visible,
  title,
  reduceMotion,
  onClose,
  children,
}: {
  visible: boolean;
  title: string;
  reduceMotion: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const t = useTheme();
  return (
    <Modal
      visible={visible}
      animationType={reduceMotion ? 'fade' : 'slide'}
      presentationStyle="formSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.sheet, { backgroundColor: t.colors.background }]}>
        <View style={styles.sheetHeader}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Cancel"
            onPress={() => {
              hapticSelection();
              onClose();
            }}
            hitSlop={12}
            style={styles.sheetCancel}
          >
            <Text style={[styles.sheetCancelText, { color: t.colors.primary }]}>Cancel</Text>
          </Pressable>
          <Text style={[styles.sheetTitle, { color: t.colors.text }]}>{title}</Text>
          <View style={styles.sheetSpacer} />
        </View>
        {children}
      </View>
    </Modal>
  );
}

function EditModal({
  visible,
  title,
  desc,
  placeholder,
  value,
  onChange,
  onSave,
  onCancel,
  requireValue,
}: {
  visible: boolean;
  title: string;
  desc: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  onSave: () => void;
  onCancel: () => void;
  requireValue?: boolean;
}) {
  const t = useTheme();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable
        style={styles.modalBackdrop}
        accessibilityRole="button"
        accessibilityLabel={`Dismiss ${title} editor`}
        onPress={onCancel}
      >
        <Pressable style={[styles.modalCard, { backgroundColor: t.colors.surface }]} onPress={(e) => e.stopPropagation()}>
          <Text style={[styles.modalTitle, { color: t.colors.text }]}>{title}</Text>
          <Text style={[styles.modalDesc, { color: t.colors.textMuted }]}>{desc}</Text>
          <TextField accessibilityLabel={title} placeholder={placeholder} value={value} onChangeText={onChange} autoFocus />
          <View style={styles.modalActions}>
            <PrimaryButton
              accessibilityLabel={`Save ${title}`}
              label="Save"
              disabled={requireValue ? !value.trim() : false}
              onPress={onSave}
              style={styles.modalButton}
            />
            <PrimaryButton
              accessibilityLabel="Cancel"
              label="Cancel"
              variant="secondary"
              onPress={onCancel}
              style={styles.modalButton}
            />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
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
  headerSpacer: { width: 44 },

  content: { padding: spacing.lg, paddingBottom: 40 },

  saveNotice: {
    fontFamily: fonts.displayBold,
    fontSize: typography.caption,
    textAlign: 'center',
    marginBottom: spacing.md,
  },

  // Identity block
  identityBlock: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  avatarPress: {
    position: 'relative',
  },
  avatarBadge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  identityName: {
    fontFamily: fonts.displayHeavy,
    fontSize: typography.heading,
    letterSpacing: -0.4,
    marginTop: spacing.lg,
  },
  editPictureLink: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    marginTop: spacing.xs,
  },
  editPictureText: {
    fontFamily: fonts.displayBold,
    fontSize: typography.callout,
  },

  // Grouped card
  groupLabel: {
    fontFamily: fonts.bodyHeavy,
    fontSize: typography.eyebrow,
    letterSpacing: 0.8,
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
  },
  groupCard: { padding: 0, overflow: 'hidden' },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
    minHeight: 56,
  },
  fieldRowLast: {},
  fieldLabel: {
    flex: 1,
    fontFamily: fonts.displayBold,
    fontSize: typography.body,
  },
  fieldValue: {
    fontFamily: fonts.body,
    fontSize: typography.callout,
    maxWidth: '48%',
    textAlign: 'right',
  },
  divider: { height: 1, marginLeft: spacing.lg },

  footnote: {
    fontFamily: fonts.body,
    fontSize: typography.caption,
    lineHeight: 19,
    marginTop: spacing.lg,
    marginHorizontal: spacing.xs,
  },

  // Picker sheet
  sheet: { flex: 1 },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  sheetCancel: { minWidth: 60, minHeight: 44, justifyContent: 'center' },
  sheetCancelText: { fontFamily: fonts.displayBold, fontSize: typography.body },
  sheetTitle: { fontFamily: fonts.displayHeavy, fontSize: typography.heading },
  sheetSpacer: { minWidth: 60 },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  cell: {
    width: 80,
    minHeight: 84,
    borderRadius: radii.card,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.sm,
    gap: spacing.xs,
  },
  cellLabel: {
    fontFamily: fonts.body,
    fontSize: typography.caption,
    maxWidth: 70,
    textAlign: 'center',
  },
  swatch: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  swatchInitial: {
    fontFamily: fonts.displayBlack,
    fontSize: 20,
    color: '#FFFFFF',
  },
  check: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Edit modal
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  modalCard: { borderRadius: radii.card, padding: spacing.lg, gap: spacing.md },
  modalTitle: { fontFamily: fonts.displayHeavy, fontSize: typography.subheading },
  modalDesc: { fontFamily: fonts.body, fontSize: typography.callout },
  modalActions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs },
  modalButton: { flex: 1 },
});
