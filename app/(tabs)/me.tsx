/**
 * Me / Profile tab — iOS Settings-style grouped list.
 *
 * Groups:
 *   1. User Card (always visible — not collapsible)
 *   2. User Profile & Settings  (Profile + Settings + Accessibility)
 *   3. Privacy & Data
 *   4. About Us & Guide         (Tour + About)
 *   5. Sign Out button (centred, horizontally compact)
 *
 * Design principles applied: 1 (simple first), 3 (expandable sections),
 * 5 (deeper pages on demand), 12 (separate risky actions), 13/14/16
 * (clear results, spring/soft motion), 18 (reduce motion), 19 (haptics),
 * 20 (44pt targets), 21–23 (a11y labels, dynamic type, no colour-only),
 * 27 (sections), 30 (calm).
 */

import React, { useCallback, useRef, useState } from 'react';
import {
  ActionSheetIOS,
  Alert,
  Animated,
  Easing,
  Image,
  LayoutAnimation,
  Linking,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Switch,
  Share,
  Text,
  UIManager,
  View,
} from 'react-native';
import { Href, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { MulberrySymbol } from '../../src/components/symbols/MulberrySymbol';
import { Card } from '../../src/components/native/Card';
import { HelperCaption } from '../../src/components/native/HelperCaption';
import { PrimaryButton } from '../../src/components/native/PrimaryButton';
import { Screen } from '../../src/components/native/Screen';
import { TextField } from '../../src/components/native/TextField';
import { useAppContext } from '../../src/hooks/useAppContext';
import { splitAppState } from '../../src/context/persistence';
import { setActivitySfxEnabled, useActivitySfx } from '../../src/features/activities/sound-settings';
import { usePullRefresh } from '../../src/hooks/usePullRefresh';
import { useReduceMotion } from '../../src/hooks/useReduceMotion';
import { verifyPin } from '../../src/utils/pin';
import { hapticSelection, hapticSuccess } from '../../src/utils/haptics';
import { radii, spacing, typography } from '../../src/theme/tokens';
import { useTheme } from '../../src/theme/useTheme';
import { fonts } from '../../src/theme/fonts';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const APP_VERSION = '0.1.0';
const SUPPORT_EMAIL = 'hello@taptalk.app';
const voiceRoute = '/settings/voice' as Href;
const displayRoute = '/settings/display' as Href;
const attributionRoute = '/symbol-attribution' as Href;
const privacyPolicyRoute = '/legal/privacy-policy' as Href;
const dataChoicesRoute = '/legal/data-choices' as Href;
const termsRoute = '/legal/terms-of-use' as Href;
const medicalDisclaimerRoute = '/legal/medical-disclaimer' as Href;
const tourRoute = '/onboarding/tour' as Href;
const splashRoute = '/onboarding/splash' as Href;

const MASCOT_HAPPY = require('../../assets/mascot_library/png_mascot/mascot_happy_looking_up.png');

// Avatar symbols — bundled Mulberry IDs already used elsewhere in the app.
// A symbol avatar is stored as `symbol:<id>` in profilePhotoUri.
const AVATAR_SYMBOL_PREFIX = 'symbol:';
const AVATAR_SYMBOLS: { symbolId: string; name: string }[] = [
  { symbolId: 'mulberry_family_excv0f', name: 'Family' },
  { symbolId: 'mulberry_cat_1lz3nun',   name: 'Cat' },
  { symbolId: 'mulberry_dog_1bfmoh1',   name: 'Dog' },
  { symbolId: 'mulberry_bird_13ztxas',  name: 'Bird' },
  { symbolId: 'mulberry_fish_1u95ovx',  name: 'Fish' },
  { symbolId: 'mulberry_rabbit_sjorvr', name: 'Rabbit' },
  { symbolId: 'mulberry_horse_c0o22y',  name: 'Horse' },
  { symbolId: 'mulberry_house_1ice1xp', name: 'House' },
];

const USER_TYPE_LABELS: Record<string, string> = {
  myself: 'AAC user',
  parent: 'Parent / Family',
  support: 'Support worker',
  guardian: 'Therapist',
};

function speechRateLabel(rate: number): string {
  if (rate < 0.8) return 'Slow';
  if (rate > 1.0) return 'Fast';
  return 'Normal';
}

const TEXT_SIZE_LABELS: Record<string, string> = {
  default: 'Default',
  large: 'Large',
  xlarge: 'Extra Large',
  maximum: 'Maximum',
};

const BUTTON_SIZE_LABELS: Record<string, string> = {
  standard: 'Standard',
  large: 'Large',
};

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

// ── Sub-section label (inside merged group) ──────────────────────────────────

function SubSectionLabel({ label }: { label: string }) {
  const t = useTheme();
  return (
    <View style={[styles.subSectionLabelWrap, { borderTopColor: t.colors.input }]}>
      <Text
        style={[styles.subSectionLabel, { color: t.colors.textTertiary }]}
        accessibilityElementsHidden
        importantForAccessibility="no"
      >
        {label.toUpperCase()}
      </Text>
    </View>
  );
}

// ── Row ──────────────────────────────────────────────────────────────────────

interface RowProps {
  icon: IoniconName;
  iconColor?: string;
  iconBg?: string;
  label: string;
  value?: string;
  hint?: string;
  onPress?: () => void;
  toggle?: { value: boolean; onValueChange: () => void };
  destructive?: boolean;
  info?: boolean;
  showDivider?: boolean;
}

function SettingsRow({
  icon,
  iconColor,
  iconBg,
  label,
  value,
  hint,
  onPress,
  toggle,
  destructive,
  info,
  showDivider = true,
}: RowProps) {
  const t = useTheme();
  const resolvedIconColor = iconColor ?? t.colors.primary;
  const resolvedIconBg = iconBg ?? t.colors.iconTintBlueBg;
  const spokenLabel = value ? `${label}, ${value}` : label;

  const body = (
    <>
      <View style={[styles.rowIcon, { backgroundColor: resolvedIconBg }]}>
        <Ionicons name={icon} size={19} color={resolvedIconColor} />
      </View>
      <Text
        style={[
          styles.rowLabel,
          { color: destructive ? t.colors.danger : t.colors.text },
        ]}
        numberOfLines={2}
      >
        {label}
      </Text>
      {value ? (
        <Text style={[styles.rowValue, { color: t.colors.textTertiary }]} numberOfLines={1}>
          {value}
        </Text>
      ) : null}
      {toggle ? (
        <View pointerEvents="none" importantForAccessibility="no">
          <Switch
            value={toggle.value}
            trackColor={{ false: t.colors.disabled, true: t.colors.success }}
            thumbColor={t.colors.surface}
            ios_backgroundColor={t.colors.disabled}
          />
        </View>
      ) : info ? null : (
        <Ionicons
          name="chevron-forward"
          size={17}
          color={t.colors.textTertiary}
          accessibilityElementsHidden
          importantForAccessibility="no"
        />
      )}
    </>
  );

  const divider = showDivider ? (
    <View style={[styles.rowDivider, { backgroundColor: t.colors.input }]} />
  ) : null;

  if (toggle) {
    return (
      <>
        <Pressable
          accessibilityRole="switch"
          accessibilityLabel={spokenLabel}
          accessibilityHint={hint}
          accessibilityState={{ checked: toggle.value }}
          onPress={() => {
            hapticSelection();
            toggle.onValueChange();
          }}
          style={({ pressed }) => [
            styles.row,
            pressed && { opacity: 0.75 },
          ]}
        >
          {body}
        </Pressable>
        {divider}
      </>
    );
  }

  if (info || !onPress) {
    return (
      <>
        <View style={styles.row} accessibilityRole="text" accessibilityLabel={spokenLabel}>
          {body}
        </View>
        {divider}
      </>
    );
  }

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={spokenLabel}
        accessibilityHint={hint}
        onPress={() => {
          hapticSelection();
          onPress();
        }}
        style={({ pressed }) => [
          styles.row,
          pressed && { opacity: 0.75 },
        ]}
      >
        {body}
      </Pressable>
      {divider}
    </>
  );
}

// ── Collapsible section ──────────────────────────────────────────────────────

interface SectionProps {
  title: string;
  eyebrow?: string;
  expanded: boolean;
  onToggle: () => void;
  reduceMotion: boolean;
  style?: object;
  children: React.ReactNode;
}

function CollapsibleSection({
  title,
  eyebrow,
  expanded,
  onToggle,
  reduceMotion,
  style,
  children,
}: SectionProps) {
  const t = useTheme();
  const chevron = useRef(new Animated.Value(expanded ? 1 : 0)).current;

  const handle = () => {
    hapticSelection();
    if (!reduceMotion) {
      LayoutAnimation.configureNext({
        duration: 220,
        create: { type: 'easeInEaseOut', property: 'opacity' },
        update: { type: 'easeInEaseOut' },
        delete: { type: 'easeInEaseOut', property: 'opacity' },
      });
    }
    Animated.timing(chevron, {
      toValue: expanded ? 0 : 1,
      duration: reduceMotion ? 0 : 180,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
    onToggle();
  };

  const rotate = chevron.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] });

  return (
    <View style={[styles.sectionWrap, style]}>
      <Text
        style={[styles.sectionEyebrow, { color: t.colors.textTertiary }]}
        accessibilityElementsHidden
        importantForAccessibility="no"
      >
        {(eyebrow ?? title).toUpperCase()}
      </Text>
      <Card style={styles.sectionCard}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={title}
          accessibilityState={{ expanded }}
          accessibilityHint={expanded ? `Collapses the ${title} section` : `Expands the ${title} section`}
          onPress={handle}
          style={({ pressed }) => [
            styles.sectionHeader,
            pressed && { opacity: 0.75 },
          ]}
        >
          <Text style={[styles.sectionHeaderTitle, { color: t.colors.text }]}>{title}</Text>
          <Animated.View style={{ transform: [{ rotate }] }}>
            <Ionicons name="chevron-down" size={20} color={t.colors.textTertiary} />
          </Animated.View>
        </Pressable>
        {expanded ? <View style={styles.sectionBody}>{children}</View> : null}
      </Card>
    </View>
  );
}

// ── Screen ───────────────────────────────────────────────────────────────────

export default function MeScreen() {
  const router = useRouter();
  const reduceMotion = useReduceMotion();
  const { refreshing, onRefresh } = usePullRefresh();
  const { state, dispatch } = useAppContext();
  const t = useTheme();

  // Three logical groups — User Profile & Settings defaults open so users
  // immediately see their identity and key controls.
  const [open, setOpen] = useState({
    userSettings: true,
    privacy: false,
    about: false,
  });
  const [nameModalVisible, setNameModalVisible] = useState(false);
  const [symbolPickerVisible, setSymbolPickerVisible] = useState(false);
  const [nameDraft, setNameDraft] = useState('');
  const [saveNotice, setSaveNotice] = useState('');
  const toggleSection = (key: keyof typeof open) =>
    setOpen((prev) => ({ ...prev, [key]: !prev[key] }));

  // Caregiver lock ──
  const [caregiverLocked, setCaregiverLocked] = useState(state.parent.lockEnabled);
  const [pinPromptVisible, setPinPromptVisible] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [showPin, setShowPin] = useState(false);

  const themeLabel =
    state.accessibility.theme === 'dark'
      ? 'Dark'
      : state.accessibility.theme === 'system'
        ? 'System'
        : 'Light';

  const name =
    state.user.displayName || state.user.nickname || state.user.name || 'Guest';
  const initial = name.charAt(0).toUpperCase() || '?';
  const userType = state.user.role ? USER_TYPE_LABELS[state.user.role] ?? 'Other' : 'Not set';
  const hasPhoto = !!state.profilePhotoUri;
  const avatarSymbolId = state.profilePhotoUri?.startsWith(AVATAR_SYMBOL_PREFIX)
    ? state.profilePhotoUri.slice(AVATAR_SYMBOL_PREFIX.length)
    : null;
  const voiceLabel = speechRateLabel(state.accessibility.speechRate);
  const textSizeLabel = TEXT_SIZE_LABELS[state.accessibility.textSize] ?? 'Default';
  const buttonSizeLabel = BUTTON_SIZE_LABELS[state.accessibility.buttonSize] ?? 'Standard';

  const showSaveNotice = useCallback((message: string) => {
    setSaveNotice(message);
    setTimeout(() => setSaveNotice(''), 2200);
  }, []);

  const saveDisplayName = useCallback(
    (raw: string) => {
      const trimmed = raw.trim();
      if (!trimmed) return;
      dispatch({
        type: 'SET_USER',
        payload: { displayName: trimmed, nickname: trimmed, name: trimmed },
      });
      hapticSuccess();
      showSaveNotice('Profile updated');
    },
    [dispatch, showSaveNotice],
  );

  // Honest, calm copy for the parts that are not built yet (Rule 7 / Rule 30).
  const notYetAvailable = useCallback((feature: string) => {
    Alert.alert(
      feature,
      'Photo picking arrives in update 1.2. Your initial avatar or a symbol works today.',
      [{ text: 'OK', style: 'cancel' }],
    );
  }, []);

  const chooseAvatarSymbol = useCallback((symbolId: string) => {
    dispatch({ type: 'SET_PROFILE_PHOTO', payload: `${AVATAR_SYMBOL_PREFIX}${symbolId}` });
    setSymbolPickerVisible(false);
    hapticSuccess();
    showSaveNotice('Profile symbol updated');
  }, [dispatch, showSaveNotice]);

  // Profile picture ──
  const onProfilePicture = useCallback(() => {
    hapticSelection();
    const options = [
      'Use TapTalk Avatar',
      'Choose Symbol',
      'Choose from Photos',
      'Take Photo',
      ...(hasPhoto ? ['Remove Current Picture'] : []),
      'Cancel',
    ];
    const cancelButtonIndex = options.length - 1;
    const destructiveButtonIndex = hasPhoto ? options.length - 2 : undefined;

    const handle = (index: number) => {
      if (index === cancelButtonIndex) return;
      if (hasPhoto && index === destructiveButtonIndex) {
        dispatch({ type: 'SET_PROFILE_PHOTO', payload: null });
        hapticSuccess();
        showSaveNotice('Profile picture removed');
        return;
      }
      if (index === 0) {
        dispatch({ type: 'SET_PROFILE_PHOTO', payload: null });
        hapticSuccess();
        showSaveNotice('Using TapTalk avatar');
        return;
      }
      if (index === 1) {
        setSymbolPickerVisible(true);
        return;
      }
      const option = options[index];
      if (!option) return;
      notYetAvailable(option);
    };

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { options, cancelButtonIndex, destructiveButtonIndex, title: 'Profile Picture' },
        handle,
      );
    } else {
      Alert.alert('Profile Picture', undefined, [
        ...options.slice(0, cancelButtonIndex).map((opt, i) => ({
          text: opt,
          style: (hasPhoto && i === destructiveButtonIndex ? 'destructive' : 'default') as 'destructive' | 'default',
          onPress: () => handle(i),
        })),
        { text: 'Cancel', style: 'cancel' },
      ]);
    }
  }, [hasPhoto, dispatch, notYetAvailable, showSaveNotice]);

  const onEditDisplayName = useCallback(() => {
    hapticSelection();
    if (Platform.OS === 'ios' && typeof Alert.prompt === 'function') {
      Alert.prompt(
        'Display Name',
        'This is the name shown on your profile.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Save',
            onPress: (text?: string) => saveDisplayName(text ?? ''),
          },
        ],
        'plain-text',
        name === 'Guest' ? '' : name,
      );
    } else {
      setNameDraft(name === 'Guest' ? '' : name);
      setNameModalVisible(true);
    }
  }, [name, saveDisplayName]);

  const onEditUserType = useCallback(() => {
    hapticSelection();
    const roles: Array<{ label: string; role: typeof state.user.role }> = [
      { label: 'AAC user', role: 'myself' },
      { label: 'Parent / Family', role: 'parent' },
      { label: 'Support worker', role: 'support' },
      { label: 'Therapist', role: 'guardian' },
    ];
    const options = [...roles.map((r) => r.label), 'Cancel'];
    const cancelButtonIndex = options.length - 1;
    const pick = (index: number) => {
      if (index === cancelButtonIndex) return;
      const role = roles[index]?.role;
      if (!role) return;
      dispatch({ type: 'SET_USER', payload: { role } });
      hapticSuccess();
      showSaveNotice('User type updated');
    };
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { options, cancelButtonIndex, title: 'User Type' },
        pick,
      );
    } else {
      Alert.alert('User Type', undefined, [
        ...roles.map((r, i) => ({ text: r.label, onPress: () => pick(i) })),
        { text: 'Cancel', style: 'cancel' as const },
      ]);
    }
  }, [dispatch, state.user.role, showSaveNotice]);

  // Caregiver lock ──
  const toggleLock = useCallback(() => {
    hapticSelection();
    if (caregiverLocked && state.parent.pin) {
      setPinPromptVisible(true);
      setPinInput('');
      setPinError('');
      return;
    }
    const next = !caregiverLocked;
    setCaregiverLocked(next);
    dispatch({ type: 'SET_PARENT', payload: { lockEnabled: next } });
  }, [caregiverLocked, state.parent.pin, dispatch]);

  const confirmPinAndDisable = useCallback(async () => {
    if (!pinInput) return;
    const ok = await verifyPin(pinInput, state.parent.pin);
    if (ok) {
      setCaregiverLocked(false);
      dispatch({ type: 'SET_PARENT', payload: { lockEnabled: false } });
      setPinPromptVisible(false);
      setPinInput('');
      setPinError('');
    } else {
      setPinError('Incorrect PIN');
    }
  }, [pinInput, state.parent.pin, dispatch]);

  const toggleHighContrast = useCallback(() => {
    dispatch({
      type: 'SET_ACCESSIBILITY',
      payload: { highContrast: !state.accessibility.highContrast },
    });
  }, [dispatch, state.accessibility.highContrast]);

  // Sounds & Haptics — real controls, not placeholders (Rule 8 — toggles for
  // on/off settings; Rule 13 — the switch itself is the visible result).
  const sfxEnabled = useActivitySfx();
  const toggleActivitySfx = useCallback(() => {
    setActivitySfxEnabled(!sfxEnabled);
  }, [sfxEnabled]);

  const toggleHaptics = useCallback(() => {
    dispatch({
      type: 'SET_ACCESSIBILITY',
      payload: { hapticsEnabled: !state.accessibility.hapticsEnabled },
    });
  }, [dispatch, state.accessibility.hapticsEnabled]);

  const signOut = useCallback(() => {
    Alert.alert(
      'Sign Out?',
      'You can sign back in anytime with your credentials.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: () => {
            dispatch({ type: 'SIGN_OUT' });
            router.replace(splashRoute);
          },
        },
      ],
    );
  }, [dispatch, router]);

  const exportProfileData = useCallback(async () => {
    hapticSelection();
    const { hot, cold } = splitAppState(state);
    const payload = {
      exportedAt: new Date().toISOString(),
      locale: 'en-AU',
      hot,
      cold: {
        ...cold,
        parent: { ...cold.parent, pin: cold.parent.pin ? '[stored on device]' : '' },
      },
    };
    try {
      await Share.share({
        title: 'TapTalk profile export',
        message: JSON.stringify(payload, null, 2),
      });
    } catch {
      Alert.alert(
        'Export not available',
        'Sharing could not start on this device. Your data is still stored safely on this iPhone or iPad.',
        [{ text: 'OK', style: 'cancel' }],
      );
    }
  }, [state]);

  const contactSupport = useCallback(() => {
    hapticSelection();
    Linking.openURL(
      `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent('TapTalk Support')}`,
    ).catch(() => {
      Alert.alert(
        'Contact Support',
        `Email us at ${SUPPORT_EMAIL} for help or privacy questions.`,
        [{ text: 'OK', style: 'cancel' }],
      );
    });
  }, []);

  const deleteProfileData = useCallback(() => {
    Alert.alert(
      'Delete profile data?',
      'This removes your profile, boards, lists, and habits from this device. Your display and accessibility choices stay. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            hapticSelection();
            setCaregiverLocked(false);
            dispatch({ type: 'SIGN_OUT' });
            Alert.alert(
              'Profile data deleted',
              'Your TapTalk profile on this device has been cleared. Accessibility settings were kept.',
              [{ text: 'OK', style: 'cancel' }],
            );
          },
        },
      ],
    );
  }, [dispatch]);

  return (
    <Screen
      title="Profile"
      subtitle="Your voice, access, and app controls."
      subtitleTopSpacing={spacing.sm}
      headerBottomSpacing={spacing.xl}
      refreshing={refreshing}
      onRefresh={onRefresh}
    >
      {/* Save notice */}
      {saveNotice ? (
        <Text
          style={[styles.saveNotice, { color: t.colors.success }]}
          accessibilityLiveRegion="polite"
          accessibilityRole="alert"
        >
          {saveNotice}
        </Text>
      ) : null}

      {/* ── 1 · User Card — always visible (Rule 1/2 — identity + quick
             actions only, everything else stays in the groups below) ── */}
      <Card style={styles.userCard}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${name}, ${userType}. Voice ready.`}
          accessibilityHint="Opens your profile details"
          onPress={() => {
            hapticSelection();
            setOpen((prev) => ({ ...prev, userSettings: true }));
          }}
          style={({ pressed }) => [styles.userCardTop, pressed && { opacity: 0.7 }]}
        >
          <View style={[styles.avatar, { backgroundColor: avatarSymbolId ? t.colors.iconTintBlueBg : t.colors.primary }]}>
            {avatarSymbolId ? (
              <MulberrySymbol symbolId={avatarSymbolId} size={40} />
            ) : hasPhoto ? (
              <Image
                source={{ uri: state.profilePhotoUri! }}
                style={styles.avatarImage}
                accessibilityIgnoresInvertColors
              />
            ) : (
              <Text style={[styles.avatarText, { color: t.colors.surface }]}>{initial}</Text>
            )}
          </View>
          <View style={styles.userCopy}>
            <Text style={[styles.userName, { color: t.colors.text }]} numberOfLines={1}>
              {name}
            </Text>
            <Text style={[styles.userMeta, { color: t.colors.textMuted }]} numberOfLines={1}>
              {userType}
            </Text>
            <View style={styles.userStatusRow}>
              <Ionicons
                name="checkmark-circle"
                size={14}
                color={t.colors.success}
                accessibilityElementsHidden
                importantForAccessibility="no"
              />
              <Text style={[styles.userStatus, { color: t.colors.textMuted }]} numberOfLines={1}>
                Voice ready
              </Text>
            </View>
          </View>
          <Ionicons
            name="chevron-forward"
            size={18}
            color={t.colors.textTertiary}
            accessibilityElementsHidden
            importantForAccessibility="no"
          />
        </Pressable>

        {/* Quick actions (Rule 29 — high-value actions near the top) */}
        <View style={[styles.quickActionsRow, { borderTopColor: t.colors.input }]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Voice settings"
            accessibilityHint="Opens voice, speed, and pitch settings"
            onPress={() => {
              hapticSelection();
              router.push(voiceRoute);
            }}
            style={({ pressed }) => [
              styles.quickAction,
              { backgroundColor: t.colors.input },
              pressed && { opacity: 0.75 },
            ]}
          >
            <Ionicons name="mic-outline" size={18} color={t.colors.primary} />
            <Text style={[styles.quickActionLabel, { color: t.colors.text }]}>Voice</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Display settings"
            accessibilityHint="Opens text size, theme, and board appearance"
            onPress={() => {
              hapticSelection();
              router.push(displayRoute);
            }}
            style={({ pressed }) => [
              styles.quickAction,
              { backgroundColor: t.colors.input },
              pressed && { opacity: 0.75 },
            ]}
          >
            <Ionicons name="grid-outline" size={18} color={t.colors.primary} />
            <Text style={[styles.quickActionLabel, { color: t.colors.text }]}>Display</Text>
          </Pressable>
        </View>
      </Card>

      {/* ── 2 · User Profile & Settings ── */}
      <CollapsibleSection
        title="User Profile & Settings"
        eyebrow="User Profile & Settings"
        expanded={open.userSettings}
        onToggle={() => toggleSection('userSettings')}
        reduceMotion={reduceMotion}
      >
        {/* Profile sub-section */}
        <SubSectionLabel label="Profile" />
        <SettingsRow
          icon="image-outline"
          label="Profile Picture"
          value={hasPhoto ? 'Set' : 'Avatar'}
          hint="Choose an avatar, symbol, or photo for your profile"
          onPress={onProfilePicture}
        />
        <SettingsRow
          icon="person-outline"
          label="Display Name"
          value={name === 'Guest' ? 'Not set' : name}
          hint="The name shown on your profile"
          onPress={onEditDisplayName}
        />
        <SettingsRow
          icon="mic-outline"
          label="Voice Name"
          value={voiceLabel}
          hint="Choose the speaking voice and speed"
          onPress={() => router.push(voiceRoute)}
        />
        <SettingsRow
          icon="people-outline"
          label="User Type"
          value={userType}
          hint="Who is using TapTalk on this device"
          onPress={onEditUserType}
          showDivider={false}
        />

        {/* Settings sub-section */}
        <SubSectionLabel label="Settings" />
        <SettingsRow
          icon="volume-high-outline"
          label="Voice & Speech"
          hint="Adjust voice, speed, and pitch"
          onPress={() => router.push(voiceRoute)}
        />
        <SettingsRow
          icon="musical-notes-outline"
          iconColor={t.colors.iconTintOrange}
          iconBg={t.colors.iconTintOrangeBg}
          label="Activity Sounds"
          hint="Turns short sound cues in activity games on or off"
          toggle={{ value: sfxEnabled, onValueChange: toggleActivitySfx }}
        />
        <SettingsRow
          icon="radio-outline"
          iconColor={t.colors.iconTintOrange}
          iconBg={t.colors.iconTintOrangeBg}
          label="Haptic Feedback"
          hint="Turns gentle vibration on taps on or off"
          toggle={{ value: state.accessibility.hapticsEnabled, onValueChange: toggleHaptics }}
        />
        <SettingsRow
          icon="grid-outline"
          iconColor={t.colors.iconTintGreen}
          iconBg={t.colors.iconTintGreenBg}
          label="Board Appearance"
          hint="Change how the AAC board looks"
          onPress={() => router.push(displayRoute)}
        />
        <SettingsRow
          icon="language-outline"
          iconColor={t.colors.iconTintPurple}
          iconBg={t.colors.iconTintPurpleBg}
          label="Language"
          value="English (AU)"
          hint="The language used for voice and labels"
          onPress={() =>
            Alert.alert(
              'Language',
              'TapTalk is in Australian English (en-AU). More languages are planned.',
              [{ text: 'OK', style: 'cancel' }],
            )
          }
          showDivider={false}
        />

        {/* Accessibility sub-section */}
        <SubSectionLabel label="Accessibility Controls" />
        <Text style={[styles.sectionNote, { color: t.colors.textMuted }]}>
          Most options live in Display — open it to change text, buttons, and theme.
        </Text>
        <SettingsRow
          icon="text-outline"
          label="Text Size"
          value={textSizeLabel}
          hint="Opens Display to change label size"
          onPress={() => router.push(displayRoute)}
        />
        <SettingsRow
          icon="resize-outline"
          iconColor={t.colors.iconTintGreen}
          iconBg={t.colors.iconTintGreenBg}
          label="Button Size"
          value={buttonSizeLabel}
          hint="Opens Display to change tap target size"
          onPress={() => router.push(displayRoute)}
        />
        <SettingsRow
          icon="contract-outline"
          iconColor={t.colors.iconTintOrange}
          iconBg={t.colors.iconTintOrangeBg}
          label="Reduce Motion"
          value={reduceMotion ? 'On' : 'Follows iOS'}
          hint="TapTalk follows the Reduce Motion setting in iOS Settings"
          onPress={() =>
            Alert.alert(
              'Reduce Motion',
              'TapTalk follows the Reduce Motion setting in iOS Settings → Accessibility → Motion. When it is on, animations become gentle fades instead of movement.',
              [{ text: 'OK', style: 'cancel' }],
            )
          }
        />
        <SettingsRow
          icon="contrast-outline"
          iconColor={t.colors.iconTintPurple}
          iconBg={t.colors.iconTintPurpleBg}
          label="High Contrast"
          hint="Enables stronger borders and text in TapTalk"
          toggle={{ value: state.accessibility.highContrast, onValueChange: toggleHighContrast }}
        />
        <SettingsRow
          icon="color-palette-outline"
          label="Theme"
          value={themeLabel}
          hint="Opens Display to choose light, dark, or system theme"
          onPress={() => router.push(displayRoute)}
        />
        <SettingsRow
          icon="eye-outline"
          label="VoiceOver"
          value="Built in"
          hint="Every control has a VoiceOver label and hint"
          onPress={() =>
            Alert.alert(
              'VoiceOver',
              'Every button, tile, and setting in TapTalk has a VoiceOver label and hint. Turn VoiceOver on in iOS Settings → Accessibility → VoiceOver.',
              [{ text: 'OK', style: 'cancel' }],
            )
          }
          showDivider={false}
        />
      </CollapsibleSection>

      {/* ── 3 · Privacy & Data ── */}
      <CollapsibleSection
        title="Privacy & Data"
        expanded={open.privacy}
        onToggle={() => toggleSection('privacy')}
        reduceMotion={reduceMotion}
      >
        <SubSectionLabel label="Privacy" />
        <SettingsRow
          icon="shield-checkmark-outline"
          iconColor={t.colors.iconTintBlue}
          iconBg={t.colors.iconTintBlueBg}
          label="Privacy Policy"
          hint="How TapTalk stores, uses, and protects your data"
          onPress={() => router.push(privacyPolicyRoute)}
          showDivider={false}
        />

        <SubSectionLabel label="Device & Access" />
        <SettingsRow
          icon="lock-closed-outline"
          label="Caregiver Lock"
          hint="Requires a PIN before changing settings on a shared device"
          toggle={{ value: caregiverLocked, onValueChange: toggleLock }}
        />
        {pinPromptVisible ? (
          <View style={[styles.pinPrompt, { backgroundColor: t.colors.input }]}>
            <Text style={[styles.pinPromptLabel, { color: t.colors.text }]}>
              Enter your 6-digit PIN to turn off Caregiver Lock on this shared device
            </Text>
            <View style={styles.pinInputRow}>
              <TextField
                accessibilityLabel="Enter PIN to disable lock"
                placeholder="e.g. 123456"
                secureTextEntry={!showPin}
                keyboardType="number-pad"
                maxLength={6}
                value={pinInput}
                onChangeText={setPinInput}
                style={styles.pinInputField}
              />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={showPin ? 'Hide PIN' : 'Show PIN'}
                onPress={() => setShowPin((v) => !v)}
                hitSlop={10}
                style={styles.pinPeekBtn}
              >
                <Ionicons
                  name={showPin ? 'eye-off-outline' : 'eye-outline'}
                  size={22}
                  color={t.colors.textMuted}
                />
              </Pressable>
            </View>
            {pinError ? (
              <Text
                style={[styles.pinError, { color: t.colors.danger }]}
                accessibilityLiveRegion="polite"
                accessibilityRole="alert"
              >
                {pinError}
              </Text>
            ) : null}
            <View style={styles.pinActions}>
              <PrimaryButton
                accessibilityLabel="Confirm PIN"
                label="Confirm"
                disabled={pinInput.length < 6}
                onPress={confirmPinAndDisable}
                style={styles.pinButton}
              />
              <PrimaryButton
                accessibilityLabel="Cancel"
                label="Cancel"
                onPress={() => setPinPromptVisible(false)}
                variant="secondary"
                style={styles.pinButton}
              />
            </View>
          </View>
        ) : null}
        <SettingsRow
          icon="camera-outline"
          iconColor={t.colors.iconTintGreen}
          iconBg={t.colors.iconTintGreenBg}
          label="Camera Access"
          hint="TapTalk only uses the camera when you choose to take a profile photo"
          onPress={() =>
            Alert.alert(
              'Camera Access',
              'TapTalk only uses the camera when you choose to take a profile photo. You can allow or deny access in iOS Settings → TapTalk → Camera.',
              [{ text: 'OK', style: 'cancel' }],
            )
          }
        />
        <SettingsRow
          icon="images-outline"
          iconColor={t.colors.iconTintPurple}
          iconBg={t.colors.iconTintPurpleBg}
          label="Photo Access"
          hint="TapTalk only reads photos when you pick one for your profile"
          onPress={() =>
            Alert.alert(
              'Photo Access',
              'TapTalk only reads photos when you pick one for your profile. You can allow or deny access in iOS Settings → TapTalk → Photos.',
              [{ text: 'OK', style: 'cancel' }],
            )
          }
          showDivider={false}
        />

        <SubSectionLabel label="Your Data" />
        <SettingsRow
          icon="phone-portrait-outline"
          label="Local Data"
          value="On this device"
          hint="How TapTalk stores your data locally on this iPhone or iPad"
          onPress={() =>
            Alert.alert(
              'Local data storage',
              'Your profile, boards, and AAC choices are saved on this iPhone or iPad. TapTalk uses two local storage areas: one for day-to-day AAC use, and one for profile and lists. Data stays on your device unless you export it.',
              [{ text: 'OK', style: 'cancel' }],
            )
          }
        />
        <SettingsRow
          icon="options-outline"
          iconColor={t.colors.iconTintPurple}
          iconBg={t.colors.iconTintPurpleBg}
          label="Data & Privacy Choices"
          hint="Manage, export, delete, or request changes to your data"
          onPress={() => router.push(dataChoicesRoute)}
        />
        <SettingsRow
          icon="download-outline"
          label="Export My Data"
          hint="Share a copy of your profile as text"
          onPress={exportProfileData}
        />
        <SettingsRow
          icon="trash-outline"
          iconColor={t.colors.danger}
          iconBg={t.colors.iconTintDangerBg}
          label="Delete Profile Data"
          destructive
          hint="Removes profile data from this device. Cannot be undone."
          onPress={deleteProfileData}
        />
        <SettingsRow
          icon="ribbon-outline"
          iconColor={t.colors.iconTintOrange}
          iconBg={t.colors.iconTintOrangeBg}
          label="Mulberry Symbols (CC BY-SA 4.0)"
          hint="View symbol licence and attribution"
          onPress={() => router.push(attributionRoute)}
          showDivider={false}
        />

        <HelperCaption style={styles.sectionFooterCaption}>
          Learn how TapTalk stores, protects, exports, and deletes your data.
        </HelperCaption>
      </CollapsibleSection>

      {/* ── 4 · About Us & Guide ── */}
      <CollapsibleSection
        title="About Us & Guide"
        expanded={open.about}
        onToggle={() => toggleSection('about')}
        reduceMotion={reduceMotion}
        style={styles.sectionWrapLast}
      >
        {/* Guide sub-section */}
        <SubSectionLabel label="Guide" />
        <SettingsRow
          icon="compass-outline"
          iconColor={t.colors.iconTintBlue}
          iconBg={t.colors.iconTintBlueBg}
          label="Replay the Tour"
          hint="Walk through Talk, Activity, Tools, and Profile again"
          onPress={() => router.push(tourRoute)}
          showDivider={false}
        />

        {/* Legal sub-section */}
        <SubSectionLabel label="Legal" />
        <SettingsRow
          icon="document-text-outline"
          iconColor={t.colors.iconTintNeutral}
          iconBg={t.colors.iconTintNeutralBg}
          label="Terms of Use"
          hint="Plain-English rules for using TapTalk safely"
          onPress={() => router.push(termsRoute)}
        />
        <SettingsRow
          icon="medkit-outline"
          iconColor={t.colors.iconTintGreen}
          iconBg={t.colors.iconTintGreenBg}
          label="Medical & Therapy Disclaimer"
          hint="TapTalk supports communication but does not replace professional advice"
          onPress={() => router.push(medicalDisclaimerRoute)}
        />
        <SettingsRow
          icon="ribbon-outline"
          iconColor={t.colors.iconTintOrange}
          iconBg={t.colors.iconTintOrangeBg}
          label="Licences & Attribution"
          hint="Symbol, icon, sound, font, and open-source credits"
          onPress={() => router.push(attributionRoute)}
          showDivider={false}
        />

        {/* About sub-section */}
        <SubSectionLabel label="About" />
        <Text style={[styles.sectionNote, { color: t.colors.textMuted }]}>
          TapTalk is an AAC app that helps everyone build and speak messages with symbols,
          routines, and calm tools — built with care in Adelaide, South Australia.
        </Text>
        <SettingsRow icon="information-circle-outline" label="App Version" value={APP_VERSION} info />
        <SettingsRow
          icon="mail-outline"
          iconColor={t.colors.iconTintBlue}
          iconBg={t.colors.iconTintBlueBg}
          label="Contact Support"
          hint="Email the developer for help or privacy questions"
          onPress={contactSupport}
          showDivider={false}
        />

        <HelperCaption style={styles.sectionFooterCaption}>
          © 2026 TapTalk. All rights reserved.
        </HelperCaption>
        <HelperCaption>
          Replay the guide, view app information, and learn about TapTalk.
        </HelperCaption>
      </CollapsibleSection>

      {/* ── Mascot ── */}
      <View
        style={styles.mascotRow}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        <Image
          source={MASCOT_HAPPY}
          style={styles.mascotImage}
          resizeMode="contain"
          accessibilityIgnoresInvertColors
        />
      </View>

      {/* ── 5 · Sign Out ── */}
      <View style={styles.signOutContainer}>
        <PrimaryButton
          accessibilityLabel="Sign out of TapTalk"
          accessibilityHint="You can sign back in anytime with your credentials"
          label="Sign Out"
          onPress={signOut}
          variant="danger"
          style={styles.signOutButton}
        />
        <HelperCaption>
          Only sign out if you are finished using TapTalk on this device.
        </HelperCaption>
      </View>

      {/* Symbol avatar picker (Rule 6 — focused modal, Rule 9 — pick one) */}
      <Modal
        visible={symbolPickerVisible}
        animationType={reduceMotion ? 'fade' : 'slide'}
        presentationStyle="formSheet"
        onRequestClose={() => setSymbolPickerVisible(false)}
      >
        <View style={[styles.symbolPickerContainer, { backgroundColor: t.colors.background }]}>
          <View style={styles.symbolPickerHeader}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Cancel"
              onPress={() => {
                hapticSelection();
                setSymbolPickerVisible(false);
              }}
              hitSlop={12}
              style={styles.symbolPickerCancel}
            >
              <Text style={[styles.symbolPickerCancelText, { color: t.colors.primary }]}>Cancel</Text>
            </Pressable>
            <Text style={[styles.symbolPickerTitle, { color: t.colors.text }]}>Choose Symbol</Text>
            <View style={styles.symbolPickerSpacer} />
          </View>
          <View style={styles.symbolGrid}>
            {AVATAR_SYMBOLS.map((s) => {
              const isOn = avatarSymbolId === s.symbolId;
              return (
                <Pressable
                  key={s.symbolId}
                  accessibilityRole="button"
                  accessibilityLabel={`Use ${s.name} symbol as profile picture`}
                  accessibilityState={{ selected: isOn }}
                  onPress={() => chooseAvatarSymbol(s.symbolId)}
                  style={({ pressed }) => [
                    styles.symbolCell,
                    { backgroundColor: pressed || isOn ? t.colors.selectionBg : t.colors.input },
                  ]}
                >
                  <MulberrySymbol symbolId={s.symbolId} size={44} />
                  <Text style={[styles.symbolCellLabel, { color: t.colors.text }]} numberOfLines={1}>
                    {s.name}
                  </Text>
                  {isOn ? (
                    <View style={[styles.symbolCellCheck, { backgroundColor: t.colors.primary }]}>
                      <Ionicons name="checkmark" size={12} color={t.colors.surface} />
                    </View>
                  ) : null}
                </Pressable>
              );
            })}
          </View>
        </View>
      </Modal>

      {/* Display name modal */}
      <Modal
        visible={nameModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setNameModalVisible(false)}
      >
        <Pressable
          style={styles.modalBackdrop}
          accessibilityRole="button"
          accessibilityLabel="Dismiss display name editor"
          onPress={() => setNameModalVisible(false)}
        >
          <Pressable
            style={[styles.modalCard, { backgroundColor: t.colors.surface }]}
            onPress={(e) => e.stopPropagation()}
          >
            <Text style={[styles.modalTitle, { color: t.colors.text }]}>Display Name</Text>
            <Text style={[styles.modalDesc, { color: t.colors.textMuted }]}>
              This is the name shown on your profile.
            </Text>
            <TextField
              accessibilityLabel="Display name"
              placeholder="e.g. Alex"
              value={nameDraft}
              onChangeText={setNameDraft}
              autoFocus
            />
            <View style={styles.modalActions}>
              <PrimaryButton
                accessibilityLabel="Save display name"
                label="Save"
                disabled={!nameDraft.trim()}
                onPress={() => {
                  saveDisplayName(nameDraft);
                  setNameModalVisible(false);
                }}
                style={styles.modalButton}
              />
              <PrimaryButton
                accessibilityLabel="Cancel"
                label="Cancel"
                variant="secondary"
                onPress={() => setNameModalVisible(false)}
                style={styles.modalButton}
              />
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  // ── User card ──
  userCard: {
    marginBottom: spacing.xxl,
  },
  userCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 60,
  },
  userStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  userStatus: {
    fontFamily: fonts.body,
    fontSize: typography.caption,
  },
  quickActionsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    borderTopWidth: 1,
    marginTop: spacing.md,
    paddingTop: spacing.md,
  },
  quickAction: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    minHeight: 44,
    borderRadius: radii.button,
  },
  quickActionLabel: {
    fontFamily: fonts.displayBold,
    fontSize: typography.callout,
  },
  saveNotice: {
    fontFamily: fonts.displayBold,
    fontSize: typography.caption,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  avatar: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 28,
    overflow: 'hidden',
  },
  avatarImage: {
    width: 56,
    height: 56,
  },
  avatarText: {
    fontFamily: fonts.displayBlack,
    fontSize: 26,
  },
  userCopy: { flex: 1 },
  userName: {
    fontFamily: fonts.displayHeavy,
    fontSize: typography.subheading,
    letterSpacing: -0.3,
  },
  userMeta: {
    fontFamily: fonts.body,
    marginTop: spacing.sm,
    fontSize: typography.caption,
  },

  // ── Section ──
  sectionWrap: {
    marginBottom: spacing.xxl,
  },
  sectionWrapLast: {
    marginBottom: 0,
  },
  sectionEyebrow: {
    fontFamily: fonts.bodyHeavy,
    fontSize: typography.caption,
    letterSpacing: 0.8,
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
  },
  sectionCard: {
    padding: 0,
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    minHeight: 52,
  },
  sectionHeaderTitle: {
    fontFamily: fonts.displayHeavy,
    fontSize: typography.body,
    letterSpacing: -0.2,
  },
  sectionBody: {
    paddingBottom: spacing.sm,
  },
  sectionNote: {
    fontFamily: fonts.body,
    fontSize: typography.caption,
    lineHeight: 19,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs,
    paddingBottom: spacing.sm,
  },

  // ── Sub-section label ──
  subSectionLabelWrap: {
    borderTopWidth: 1,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
  },
  subSectionLabel: {
    fontFamily: fonts.bodyHeavy,
    fontSize: 11,
    letterSpacing: 0.7,
  },

  // ── Row ──
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    minHeight: 52,
  },
  rowIcon: {
    width: 34,
    height: 34,
    borderRadius: radii.button,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowLabel: {
    flex: 1,
    fontFamily: fonts.displayBold,
    fontSize: typography.callout,
  },
  rowValue: {
    fontFamily: fonts.body,
    fontSize: typography.callout,
  },
  rowDivider: {
    height: 1,
    marginLeft: 34 + spacing.md + spacing.md,
  },

  // ── Mascot ──
  mascotRow: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  mascotImage: {
    width: 140,
    height: 140,
  },

  // ── Sign Out ──
  signOutContainer: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  signOutButton: {
    width: 240,
  },
  sectionFooterCaption: {
    marginTop: spacing.sm,
    paddingBottom: spacing.xs,
  },

  // ── PIN prompt ──
  pinPrompt: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    borderRadius: radii.card,
    padding: spacing.md,
  },
  pinPromptLabel: {
    fontFamily: fonts.displayHeavy,
    fontSize: typography.caption,
    marginBottom: spacing.sm,
  },
  pinInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  pinInputField: {
    flex: 1,
  },
  pinPeekBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinError: {
    fontFamily: fonts.displayBold,
    fontSize: typography.caption,
    marginBottom: spacing.sm,
  },
  pinActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  pinButton: {
    flex: 1,
  },

  // ── Modal ──
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  modalCard: {
    borderRadius: radii.card,
    padding: spacing.lg,
    gap: spacing.md,
  },
  modalTitle: {
    fontFamily: fonts.displayHeavy,
    fontSize: typography.subheading,
  },
  modalDesc: {
    fontFamily: fonts.body,
    fontSize: typography.callout,
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  modalButton: {
    flex: 1,
  },

  // ── Symbol avatar picker ──
  symbolPickerContainer: {
    flex: 1,
  },
  symbolPickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  symbolPickerCancel: {
    minWidth: 60,
    minHeight: 44,
    justifyContent: 'center',
  },
  symbolPickerCancelText: {
    fontFamily: fonts.displayBold,
    fontSize: typography.body,
  },
  symbolPickerTitle: {
    fontFamily: fonts.displayHeavy,
    fontSize: typography.heading,
  },
  symbolPickerSpacer: {
    minWidth: 60,
  },
  symbolGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  symbolCell: {
    width: 76,
    minHeight: 76,
    borderRadius: radii.card,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xs,
    gap: 2,
  },
  symbolCellLabel: {
    fontFamily: fonts.body,
    fontSize: typography.caption,
    maxWidth: 68,
    textAlign: 'center',
  },
  symbolCellCheck: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
