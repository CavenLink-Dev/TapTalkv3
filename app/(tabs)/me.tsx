/**
 * Me / Profile tab — an iOS Settings-style index.
 *
 * The screen is a scannable list of small grouped sections rather than a few
 * giant collapsible dropdowns. Identity editing lives on a dedicated Account
 * page (`/settings/account`) opened from the Account Card. Deep settings open
 * focused secondary pages; only true on/off settings use toggles, and every
 * toggle mutates state and reflects immediately (Rules 1, 5, 8, 13, 27, 30).
 *
 * Section order:
 *   Account Card · User Profile · User Settings · Accessibility Controls ·
 *   Privacy · Device & Access · Your Data · Security · Guide · Legal ·
 *   About Us · Sign Out
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  Alert,
  Animated,
  LayoutAnimation,
  Linking,
  Platform,
  Pressable,
  Share,
  StyleSheet,
  Switch,
  Text,
  UIManager,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Href, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../../src/components/native/Card';
import { PrimaryButton } from '../../src/components/native/PrimaryButton';
import { Screen } from '../../src/components/native/Screen';
import { TextField } from '../../src/components/native/TextField';
import { AvatarView } from '../../src/features/profile/AvatarView';
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

const APP_VERSION = '0.1.0';
const SUPPORT_EMAIL = 'hello@taptalk.app';

// Default: the important, everyday sections open, everything else collapsed so
// the page stays short to scroll. The user's own choices persist and override
// this on the next visit.
const DEFAULT_GROUP_OPEN: Record<string, boolean> = {
  'User Profile': true,
  'User Settings': true,
  'Accessibility Controls': true,
};

const GROUPS_STORAGE_KEY = '@taptalk/profile/groups/v1';

const accountRoute = '/settings/account' as Href;
const voiceRoute = '/settings/voice' as Href;
const displayRoute = '/settings/display' as Href;
const hiddenTilesRoute = '/board/hidden-tiles' as Href;
const pronunciationRoute = '/settings/pronunciation' as Href;
const attributionRoute = '/symbol-attribution' as Href;
const privacyPolicyRoute = '/legal/privacy-policy' as Href;
const dataChoicesRoute = '/legal/data-choices' as Href;
const termsRoute = '/legal/terms-of-use' as Href;
const medicalDisclaimerRoute = '/legal/medical-disclaimer' as Href;
const beliefsRoute = '/legal/beliefs' as Href;
const tourRoute = '/onboarding/tour' as Href;
const splashRoute = '/onboarding/splash' as Href;

const USER_TYPE_LABELS: Record<string, string> = {
  myself: 'AAC user',
  parent: 'Parent / Family',
  support: 'Support worker',
  guardian: 'Therapist',
};

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

function speechRateLabel(rate: number): string {
  if (rate < 0.8) return 'Slow';
  if (rate > 1.0) return 'Fast';
  return 'Normal';
}

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

// One-tap accessibility starting points. Each applies a known-good bundle;
// the individual controls below stay editable afterwards (Rule 1 / Rule 2).
type AccessibilityPatch = Partial<{
  textSize: 'default' | 'large' | 'xlarge' | 'maximum';
  buttonSize: 'standard' | 'large';
  highContrast: boolean;
  reduceSensoryLoad: boolean;
  hapticsEnabled: boolean;
  motorAccessMode: boolean;
}>;

const ACCESS_PRESETS: { id: string; label: string; icon: IoniconName; patch: AccessibilityPatch }[] = [
  {
    id: 'default',
    label: 'Default',
    icon: 'refresh-outline',
    patch: {
      textSize: 'default',
      buttonSize: 'standard',
      highContrast: false,
      reduceSensoryLoad: false,
      hapticsEnabled: true,
      motorAccessMode: false,
    },
  },
  {
    id: 'lowVision',
    label: 'Low Vision',
    icon: 'eye-outline',
    patch: { textSize: 'xlarge', buttonSize: 'large', highContrast: true },
  },
  {
    id: 'motor',
    label: 'Motor',
    icon: 'hand-left-outline',
    patch: { textSize: 'large', buttonSize: 'large', motorAccessMode: true, hapticsEnabled: true },
  },
  {
    id: 'calm',
    label: 'Calm',
    icon: 'leaf-outline',
    patch: { reduceSensoryLoad: true, hapticsEnabled: false, highContrast: false, textSize: 'default' },
  },
];

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// ── Collapsible group (iOS-style disclosure header + flat card) ───────────────
// Each section header toggles its card open/closed. The chevron points right
// when collapsed and rotates down when expanded. Open/closed state is shared
// via context so the screen can persist it and offer Expand / Collapse all.

interface GroupsContextValue {
  isOpen: (key: string) => boolean;
  toggle: (key: string) => void;
  reduceMotion: boolean;
}

const GroupsContext = createContext<GroupsContextValue>({
  isOpen: () => true,
  toggle: () => undefined,
  reduceMotion: false,
});

function Group({
  label,
  children,
  last,
  bare,
}: {
  label: string;
  children: React.ReactNode;
  last?: boolean;
  /** Render children without the inner Card (caller supplies its own). */
  bare?: boolean;
}) {
  const t = useTheme();
  const { isOpen, toggle, reduceMotion } = useContext(GroupsContext);
  const expanded = isOpen(label);
  const chevron = useRef(new Animated.Value(expanded ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(chevron, {
      toValue: expanded ? 1 : 0,
      duration: reduceMotion ? 0 : 180,
      useNativeDriver: true,
    }).start();
  }, [expanded, reduceMotion, chevron]);

  const rotate = chevron.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '90deg'] });

  return (
    <View style={[styles.group, last && expanded && styles.groupLast]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ expanded }}
        accessibilityHint={expanded ? `Collapses the ${label} section` : `Expands the ${label} section`}
        onPress={() => toggle(label)}
        style={({ pressed }) => [
          styles.groupHeader,
          { backgroundColor: t.colors.surface },
          expanded && styles.groupHeaderExpanded,
          pressed && { opacity: 0.6 },
        ]}
      >
        <Text style={[styles.groupLabel, { color: t.colors.textMuted }]}>{label.toUpperCase()}</Text>
        <Animated.View style={{ transform: [{ rotate }] }}>
          <Ionicons name="chevron-forward" size={15} color={t.colors.textTertiary} />
        </Animated.View>
      </Pressable>
      {expanded ? (
        bare ? <View>{children}</View> : <Card style={styles.groupCard}>{children}</Card>
      ) : null}
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

function Row({
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
        <Ionicons name={icon} size={18} color={resolvedIconColor} />
      </View>
      <Text
        style={[styles.rowLabel, { color: destructive ? t.colors.danger : t.colors.text }]}
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
          style={({ pressed }) => [styles.row, pressed && { opacity: 0.75 }]}
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
        style={({ pressed }) => [styles.row, pressed && { opacity: 0.75 }]}
      >
        {body}
      </Pressable>
      {divider}
    </>
  );
}

// ── Screen ───────────────────────────────────────────────────────────────────

export default function MeScreen() {
  const router = useRouter();
  const reduceMotion = useReduceMotion();
  const { refreshing, onRefresh } = usePullRefresh();
  const { state, dispatch } = useAppContext();
  const t = useTheme();

  const [saveNotice, setSaveNotice] = useState('');

  // Caregiver lock
  const [caregiverLocked, setCaregiverLocked] = useState(state.parent.lockEnabled);
  const [pinPromptVisible, setPinPromptVisible] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [showPin, setShowPin] = useState(false);

  // ── Collapsible section state (persisted so the user's layout sticks) ──
  const [openMap, setOpenMap] = useState<Record<string, boolean>>(DEFAULT_GROUP_OPEN);
  useEffect(() => {
    AsyncStorage.getItem(GROUPS_STORAGE_KEY)
      .then((raw) => {
        if (raw) setOpenMap((prev) => ({ ...prev, ...JSON.parse(raw) }));
      })
      .catch(() => {});
  }, []);

  const persistOpen = useCallback((next: Record<string, boolean>) => {
    AsyncStorage.setItem(GROUPS_STORAGE_KEY, JSON.stringify(next)).catch(() => {});
  }, []);

  const animateGroups = useCallback(() => {
    if (reduceMotion) return;
    LayoutAnimation.configureNext({
      duration: 200,
      create: { type: 'easeInEaseOut', property: 'opacity' },
      update: { type: 'easeInEaseOut' },
      delete: { type: 'easeInEaseOut', property: 'opacity' },
    });
  }, [reduceMotion]);

  const isGroupOpen = useCallback((key: string) => openMap[key] ?? false, [openMap]);

  const toggleGroup = useCallback(
    (key: string) => {
      hapticSelection();
      animateGroups();
      setOpenMap((prev) => {
        const next = { ...prev, [key]: !(prev[key] ?? false) };
        persistOpen(next);
        return next;
      });
    },
    [animateGroups, persistOpen],
  );

  const groupsValue = React.useMemo(
    () => ({ isOpen: isGroupOpen, toggle: toggleGroup, reduceMotion }),
    [isGroupOpen, toggleGroup, reduceMotion],
  );

  const name = state.user.displayName || state.user.nickname || state.user.name || 'Guest';
  const initial = name.charAt(0).toUpperCase() || '?';
  const userType = state.user.role ? USER_TYPE_LABELS[state.user.role] ?? 'Other' : 'Not set';
  const voiceLabel = speechRateLabel(state.accessibility.speechRate);
  const textSizeLabel = TEXT_SIZE_LABELS[state.accessibility.textSize] ?? 'Default';
  const buttonSizeLabel = BUTTON_SIZE_LABELS[state.accessibility.buttonSize] ?? 'Standard';
  const themeLabel =
    state.accessibility.theme === 'dark'
      ? 'Dark'
      : state.accessibility.theme === 'system'
        ? 'System'
        : 'Light';
  const signInLabel =
    state.secureMethod === 'passkey' ? 'Passkey' : state.secureMethod === 'password' ? 'Password' : 'Not set';

  const showSaveNotice = useCallback((message: string) => {
    setSaveNotice(message);
    hapticSuccess();
    setTimeout(() => setSaveNotice(''), 2000);
  }, []);

  // ── Toggles (all take effect immediately) ──
  const sfxEnabled = useActivitySfx();
  const toggleActivitySfx = useCallback(() => setActivitySfxEnabled(!sfxEnabled), [sfxEnabled]);

  const toggleHaptics = useCallback(() => {
    dispatch({
      type: 'SET_ACCESSIBILITY',
      payload: { hapticsEnabled: !state.accessibility.hapticsEnabled },
    });
  }, [dispatch, state.accessibility.hapticsEnabled]);

  const toggleHighContrast = useCallback(() => {
    dispatch({
      type: 'SET_ACCESSIBILITY',
      payload: { highContrast: !state.accessibility.highContrast },
    });
  }, [dispatch, state.accessibility.highContrast]);

  const toggleReduceSensory = useCallback(() => {
    dispatch({
      type: 'SET_ACCESSIBILITY',
      payload: { reduceSensoryLoad: !state.accessibility.reduceSensoryLoad },
    });
  }, [dispatch, state.accessibility.reduceSensoryLoad]);

  const applyPreset = useCallback(
    (preset: (typeof ACCESS_PRESETS)[number]) => {
      dispatch({ type: 'SET_ACCESSIBILITY', payload: preset.patch });
      showSaveNotice(`${preset.label} applied`);
    },
    [dispatch, showSaveNotice],
  );

  const toggleBiometrics = useCallback(() => {
    dispatch({
      type: 'SET_SECURE_METHOD',
      payload: {
        method: state.secureMethod ?? 'password',
        biometricsEnabled: !state.biometricsEnabled,
      },
    });
  }, [dispatch, state.secureMethod, state.biometricsEnabled]);

  const toggleRememberLogin = useCallback(() => {
    dispatch({ type: 'SET_REMEMBER_LOGIN', payload: !state.rememberLogin });
  }, [dispatch, state.rememberLogin]);

  // ── Caregiver lock ──
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
    showSaveNotice(next ? 'Caregiver Lock on' : 'Caregiver Lock off');
  }, [caregiverLocked, state.parent.pin, dispatch, showSaveNotice]);

  const confirmPinAndDisable = useCallback(async () => {
    if (!pinInput) return;
    const ok = await verifyPin(pinInput, state.parent.pin);
    if (ok) {
      setCaregiverLocked(false);
      dispatch({ type: 'SET_PARENT', payload: { lockEnabled: false } });
      setPinPromptVisible(false);
      setPinInput('');
      setPinError('');
      showSaveNotice('Caregiver Lock off');
    } else {
      setPinError('Incorrect PIN');
    }
  }, [pinInput, state.parent.pin, dispatch, showSaveNotice]);

  // ── Actions ──
  const openIOSSettings = useCallback((title: string, body: string) => {
    Alert.alert(title, body, [
      { text: 'Open Settings', onPress: () => Linking.openSettings().catch(() => {}) },
      { text: 'Close', style: 'cancel' },
    ]);
  }, []);

  const exportProfileData = useCallback(async () => {
    hapticSelection();
    const { hot, cold } = splitAppState(state);
    const payload = {
      exportedAt: new Date().toISOString(),
      locale: 'en-AU',
      hot,
      cold: { ...cold, parent: { ...cold.parent, pin: cold.parent.pin ? '[stored on device]' : '' } },
    };
    try {
      await Share.share({ title: 'TapTalk profile export', message: JSON.stringify(payload, null, 2) });
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
    Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent('TapTalk Support')}`).catch(() => {
      Alert.alert('Contact Support', `Email us at ${SUPPORT_EMAIL} for help or privacy questions.`, [
        { text: 'OK', style: 'cancel' },
      ]);
    });
  }, []);

  const sendFeedback = useCallback(() => {
    hapticSelection();
    Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent('TapTalk Feedback')}`).catch(() => {
      Alert.alert('Send Feedback', `Email your feedback to ${SUPPORT_EMAIL}.`, [
        { text: 'OK', style: 'cancel' },
      ]);
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

  const signOut = useCallback(() => {
    Alert.alert('Sign Out?', 'You can sign back in anytime with your credentials.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: () => {
          dispatch({ type: 'SIGN_OUT' });
          router.replace(splashRoute);
        },
      },
    ]);
  }, [dispatch, router]);

  return (
    <GroupsContext.Provider value={groupsValue}>
    <Screen
      title="Profile"
      subtitle="Your voice, access, and app controls."
      subtitleTopSpacing={spacing.sm}
      headerBottomSpacing={spacing.xl}
      refreshing={refreshing}
      onRefresh={onRefresh}
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

      {/* ── Account Card → dedicated Account page ── */}
      <Card style={styles.accountCard}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${name}, ${userType}. Voice ready.`}
          accessibilityHint="Opens your account and profile details"
          onPress={() => {
            hapticSelection();
            router.push(accountRoute);
          }}
          style={({ pressed }) => [styles.accountRow, pressed && { opacity: 0.7 }]}
        >
          <AvatarView value={state.profilePhotoUri} size={60} initial={initial} />
          <View style={styles.accountCopy}>
            <Text style={[styles.accountName, { color: t.colors.text }]} numberOfLines={1}>
              {name}
            </Text>
            <Text style={[styles.accountMeta, { color: t.colors.textMuted }]} numberOfLines={1}>
              {userType}
            </Text>
            <View style={styles.accountStatusRow}>
              <Ionicons
                name="checkmark-circle"
                size={14}
                color={t.colors.success}
                accessibilityElementsHidden
                importantForAccessibility="no"
              />
              <Text style={[styles.accountStatus, { color: t.colors.textMuted }]} numberOfLines={1}>
                Voice ready
              </Text>
            </View>
          </View>
          <Ionicons
            name="chevron-forward"
            size={20}
            color={t.colors.textTertiary}
            accessibilityElementsHidden
            importantForAccessibility="no"
          />
        </Pressable>
      </Card>

      {/* ── User Profile ── */}
      <Group label="User Profile">
        <Row
          icon="person-circle-outline"
          label="Edit Profile"
          value={name === 'Guest' ? 'Set up' : 'Open'}
          hint="Edit your picture, name, and nickname"
          onPress={() => router.push(accountRoute)}
        />
        <Row
          icon="people-outline"
          iconColor={t.colors.iconTintPurple}
          iconBg={t.colors.iconTintPurpleBg}
          label="User Type"
          value={userType}
          hint="Who is using TapTalk on this device"
          onPress={() => router.push(accountRoute)}
          showDivider={false}
        />
      </Group>

      {/* ── User Settings ── */}
      <Group label="User Settings">
        <Row
          icon="volume-high-outline"
          label="Voice & Speech"
          value={voiceLabel}
          hint="Choose the voice, speed, and pitch"
          onPress={() => router.push(voiceRoute)}
        />
        <Row
          icon="grid-outline"
          iconColor={t.colors.iconTintBlue}
          iconBg={t.colors.iconTintBlueBg}
          label="Board Appearance"
          hint="Change how the AAC board looks"
          onPress={() => router.push(displayRoute)}
        />
        <Row
          icon="chatbubble-ellipses-outline"
          iconColor={t.colors.iconTintBlue}
          iconBg={t.colors.iconTintBlueBg}
          label="Pronunciations"
          hint="Fix how the voice says names and words"
          onPress={() => router.push(pronunciationRoute)}
        />
        <Row
          icon="eye-off-outline"
          iconColor={t.colors.iconTintPurple}
          iconBg={t.colors.iconTintPurpleBg}
          label="Hidden Words"
          value={state.hiddenTileIds.length > 0 ? String(state.hiddenTileIds.length) : 'None'}
          hint="See and restore words hidden from a board"
          onPress={() => router.push(hiddenTilesRoute)}
        />
        <Row
          icon="musical-notes-outline"
          iconColor={t.colors.iconTintOrange}
          iconBg={t.colors.iconTintOrangeBg}
          label="Activity Sounds"
          hint="Turns short sound cues in activity games on or off"
          toggle={{ value: sfxEnabled, onValueChange: toggleActivitySfx }}
        />
        <Row
          icon="notifications-outline"
          iconColor={t.colors.iconTintPurple}
          iconBg={t.colors.iconTintPurpleBg}
          label="Notifications"
          hint="Manage reminders in iOS Settings"
          onPress={() =>
            openIOSSettings(
              'Notifications',
              'Reminders and daily check-ins are controlled in iOS Settings → TapTalk → Notifications.',
            )
          }
        />
        <Row
          icon="language-outline"
          iconColor={t.colors.iconTintNeutral}
          iconBg={t.colors.iconTintNeutralBg}
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
      </Group>

      {/* ── Quick Setup presets ── */}
      <Group label="Quick Setup" bare>
        <Card style={styles.presetCard}>
          <Text style={[styles.presetIntro, { color: t.colors.textMuted }]}>
            A one-tap starting point. You can still adjust anything below.
          </Text>
          <View style={styles.presetGrid}>
            {ACCESS_PRESETS.map((preset) => (
              <Pressable
                key={preset.id}
                accessibilityRole="button"
                accessibilityLabel={`Apply ${preset.label} accessibility preset`}
                accessibilityHint="Sets several accessibility options at once"
                onPress={() => {
                  hapticSelection();
                  applyPreset(preset);
                }}
                style={({ pressed }) => [
                  styles.presetTile,
                  { backgroundColor: t.colors.input },
                  pressed && { opacity: 0.7 },
                ]}
              >
                <Ionicons name={preset.icon} size={22} color={t.colors.primary} />
                <Text style={[styles.presetLabel, { color: t.colors.text }]} numberOfLines={1}>
                  {preset.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </Card>
      </Group>

      {/* ── Accessibility Controls ── */}
      <Group label="Accessibility Controls">
        <Row
          icon="text-outline"
          label="Text Size"
          value={textSizeLabel}
          hint="Opens Display to change label size"
          onPress={() => router.push(displayRoute)}
        />
        <Row
          icon="resize-outline"
          iconColor={t.colors.iconTintGreen}
          iconBg={t.colors.iconTintGreenBg}
          label="Button Size"
          value={buttonSizeLabel}
          hint="Opens Display to change tap target size"
          onPress={() => router.push(displayRoute)}
        />
        <Row
          icon="color-palette-outline"
          iconColor={t.colors.iconTintPurple}
          iconBg={t.colors.iconTintPurpleBg}
          label="Theme"
          value={themeLabel}
          hint="Opens Display to choose light, dark, or system"
          onPress={() => router.push(displayRoute)}
        />
        <Row
          icon="contrast-outline"
          iconColor={t.colors.iconTintNeutral}
          iconBg={t.colors.iconTintNeutralBg}
          label="High Contrast"
          hint="Stronger borders and text across TapTalk"
          toggle={{ value: state.accessibility.highContrast, onValueChange: toggleHighContrast }}
        />
        <Row
          icon="radio-outline"
          iconColor={t.colors.iconTintOrange}
          iconBg={t.colors.iconTintOrangeBg}
          label="Haptic Feedback"
          hint="Gentle vibration on taps"
          toggle={{ value: state.accessibility.hapticsEnabled, onValueChange: toggleHaptics }}
        />
        <Row
          icon="sparkles-outline"
          iconColor={t.colors.iconTintOrange}
          iconBg={t.colors.iconTintOrangeBg}
          label="Reduce Sensory Load"
          hint="Quiets shimmer, particles, and non-essential motion"
          toggle={{ value: state.accessibility.reduceSensoryLoad, onValueChange: toggleReduceSensory }}
        />
        <Row
          icon="contract-outline"
          iconColor={t.colors.iconTintGreen}
          iconBg={t.colors.iconTintGreenBg}
          label="Reduce Motion"
          value={reduceMotion ? 'On' : 'Follows iOS'}
          hint="TapTalk follows the iOS Reduce Motion setting"
          onPress={() =>
            openIOSSettings(
              'Reduce Motion',
              'TapTalk follows Reduce Motion in iOS Settings → Accessibility → Motion. When on, animations become gentle fades.',
            )
          }
        />
        <Row
          icon="options-outline"
          label="All Accessibility Settings"
          hint="Open the full Display and accessibility page"
          onPress={() => router.push(displayRoute)}
          showDivider={false}
        />
      </Group>

      {/* ── Privacy ── */}
      <Group label="Privacy">
        <Row
          icon="shield-checkmark-outline"
          label="Privacy Policy"
          hint="How TapTalk stores, uses, and protects your data"
          onPress={() => router.push(privacyPolicyRoute)}
        />
        <Row
          icon="options-outline"
          iconColor={t.colors.iconTintPurple}
          iconBg={t.colors.iconTintPurpleBg}
          label="Data & Privacy Choices"
          hint="Manage, export, delete, or request changes to your data"
          onPress={() => router.push(dataChoicesRoute)}
          showDivider={false}
        />
      </Group>

      {/* ── Device & Access ── */}
      <Group label="Device & Access">
        <Row
          icon="lock-closed-outline"
          label="Caregiver Lock"
          hint="Requires a PIN before changing settings on a shared device"
          toggle={{ value: caregiverLocked, onValueChange: toggleLock }}
        />
        {pinPromptVisible ? (
          <View style={[styles.pinPrompt, { backgroundColor: t.colors.input }]}>
            <Text style={[styles.pinPromptLabel, { color: t.colors.text }]}>
              Enter your 6-digit PIN to turn off Caregiver Lock
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
                <Ionicons name={showPin ? 'eye-off-outline' : 'eye-outline'} size={22} color={t.colors.textMuted} />
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
        <Row
          icon="camera-outline"
          iconColor={t.colors.iconTintGreen}
          iconBg={t.colors.iconTintGreenBg}
          label="Camera Access"
          hint="TapTalk only uses the camera when you take a profile photo"
          onPress={() =>
            openIOSSettings(
              'Camera Access',
              'TapTalk only uses the camera when you choose to take a profile photo. Allow or deny in iOS Settings → TapTalk → Camera.',
            )
          }
        />
        <Row
          icon="images-outline"
          iconColor={t.colors.iconTintPurple}
          iconBg={t.colors.iconTintPurpleBg}
          label="Photo Access"
          hint="TapTalk only reads photos when you pick one for your profile"
          onPress={() =>
            openIOSSettings(
              'Photo Access',
              'TapTalk only reads photos when you pick one for your profile. Allow or deny in iOS Settings → TapTalk → Photos.',
            )
          }
          showDivider={false}
        />
      </Group>

      {/* ── Your Data ── */}
      <Group label="Your Data">
        <Row
          icon="phone-portrait-outline"
          label="Local Data"
          value="On this device"
          hint="How TapTalk stores your data locally"
          onPress={() =>
            Alert.alert(
              'Local data storage',
              'Your profile, boards, and AAC choices are saved on this iPhone or iPad. Data stays on your device unless you export it.',
              [{ text: 'OK', style: 'cancel' }],
            )
          }
        />
        <Row
          icon="download-outline"
          iconColor={t.colors.iconTintBlue}
          iconBg={t.colors.iconTintBlueBg}
          label="Export My Data"
          hint="Share a copy of your profile as text"
          onPress={exportProfileData}
        />
        <Row
          icon="trash-outline"
          iconColor={t.colors.danger}
          iconBg={t.colors.iconTintDangerBg}
          label="Delete Profile Data"
          destructive
          hint="Removes profile data from this device. Cannot be undone."
          onPress={deleteProfileData}
          showDivider={false}
        />
      </Group>

      {/* ── Security ── */}
      <Group label="Security">
        <Row
          icon="key-outline"
          label="Sign-in Method"
          value={signInLabel}
          hint="How you sign in to TapTalk"
          onPress={() =>
            Alert.alert(
              'Sign-in Method',
              state.secureMethod === 'passkey'
                ? 'You sign in with a passkey using Face ID or Touch ID.'
                : 'You sign in with a password. You can enable biometric unlock below.',
              [{ text: 'OK', style: 'cancel' }],
            )
          }
        />
        <Row
          icon="finger-print-outline"
          iconColor={t.colors.iconTintGreen}
          iconBg={t.colors.iconTintGreenBg}
          label="Biometric Unlock"
          hint="Use Face ID or Touch ID to open TapTalk"
          toggle={{ value: state.biometricsEnabled, onValueChange: toggleBiometrics }}
        />
        <Row
          icon="log-in-outline"
          iconColor={t.colors.iconTintNeutral}
          iconBg={t.colors.iconTintNeutralBg}
          label="Keep Me Signed In"
          hint="Skip the sign-in screen on this device"
          toggle={{ value: state.rememberLogin, onValueChange: toggleRememberLogin }}
          showDivider={false}
        />
      </Group>

      {/* ── Guide ── */}
      <Group label="Guide">
        <Row
          icon="compass-outline"
          label="Replay the Tour"
          hint="Walk through Talk, Activity, Tools, and Profile again"
          onPress={() => router.push(tourRoute)}
          showDivider={false}
        />
      </Group>

      {/* ── Help ── */}
      <Group label="Help">
        <Row
          icon="mail-outline"
          iconColor={t.colors.iconTintBlue}
          iconBg={t.colors.iconTintBlueBg}
          label="Contact Support"
          hint="Email the developer for help or privacy questions"
          onPress={contactSupport}
        />
        <Row
          icon="chatbox-ellipses-outline"
          iconColor={t.colors.iconTintPurple}
          iconBg={t.colors.iconTintPurpleBg}
          label="Send Feedback"
          hint="Tell us what would make TapTalk better"
          onPress={sendFeedback}
          showDivider={false}
        />
      </Group>

      {/* ── Legal ── */}
      <Group label="Legal">
        <Row
          icon="document-text-outline"
          iconColor={t.colors.iconTintNeutral}
          iconBg={t.colors.iconTintNeutralBg}
          label="Terms of Use"
          hint="Plain-English rules for using TapTalk safely"
          onPress={() => router.push(termsRoute)}
        />
        <Row
          icon="medkit-outline"
          iconColor={t.colors.iconTintGreen}
          iconBg={t.colors.iconTintGreenBg}
          label="Medical & Therapy Disclaimer"
          hint="TapTalk supports communication but does not replace professional advice"
          onPress={() => router.push(medicalDisclaimerRoute)}
        />
        <Row
          icon="ribbon-outline"
          iconColor={t.colors.iconTintOrange}
          iconBg={t.colors.iconTintOrangeBg}
          label="Licences & Attribution"
          hint="Symbol, icon, sound, font, and open-source credits"
          onPress={() => router.push(attributionRoute)}
          showDivider={false}
        />
      </Group>

      {/* ── About Us ── */}
      <Group label="About Us" last>
        <Row
          icon="heart-outline"
          iconColor={t.colors.iconTintBlue}
          iconBg={t.colors.iconTintBlueBg}
          label="Our Beliefs"
          hint="What TapTalk stands for and who built it"
          onPress={() => router.push(beliefsRoute)}
        />
        <Row icon="information-circle-outline" label="App Version" value={APP_VERSION} info showDivider={false} />
      </Group>

      {/* ── Sign Out ── */}
      <View style={styles.signOutContainer}>
        <PrimaryButton
          accessibilityLabel="Sign out of TapTalk"
          accessibilityHint="You can sign back in anytime with your credentials"
          label="Sign Out"
          onPress={signOut}
          variant="danger"
          style={styles.signOutButton}
        />
        <View style={styles.legalBar}>
          <Text style={[styles.legalCaption, { color: t.colors.textTertiary }]}>
            Only sign out when you are finished on this device.
          </Text>
          <View style={styles.legalLinks}>
            <Pressable
              accessibilityRole="link"
              accessibilityLabel="Privacy Policy"
              onPress={() => {
                hapticSelection();
                router.push(privacyPolicyRoute);
              }}
              hitSlop={10}
            >
              <Text style={[styles.legalLink, { color: t.colors.primary }]}>Privacy Policy</Text>
            </Pressable>
            <Text style={[styles.legalCaption, { color: t.colors.textTertiary }]}>·</Text>
            <Pressable
              accessibilityRole="link"
              accessibilityLabel="Terms of Use"
              onPress={() => {
                hapticSelection();
                router.push(termsRoute);
              }}
              hitSlop={10}
            >
              <Text style={[styles.legalLink, { color: t.colors.primary }]}>Terms of Use</Text>
            </Pressable>
            <Text style={[styles.legalCaption, { color: t.colors.textTertiary }]}>·</Text>
            <Pressable
              accessibilityRole="link"
              accessibilityLabel="Data choices"
              onPress={() => {
                hapticSelection();
                router.push(dataChoicesRoute);
              }}
              hitSlop={10}
            >
              <Text style={[styles.legalLink, { color: t.colors.primary }]}>Data Choices</Text>
            </Pressable>
          </View>
          <Text style={[styles.legalCaption, { color: t.colors.textTertiary }]}>
            © 2026 TapTalk · Adelaide, South Australia
          </Text>
        </View>
      </View>
    </Screen>
    </GroupsContext.Provider>
  );
}

const styles = StyleSheet.create({
  saveNotice: {
    fontFamily: fonts.displayBold,
    fontSize: typography.caption,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },

  // ── Account card ──
  accountCard: {
    marginBottom: spacing.xl,
  },
  accountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 64,
  },
  accountCopy: { flex: 1 },
  accountName: {
    fontFamily: fonts.displayHeavy,
    fontSize: typography.subheading,
    letterSpacing: -0.3,
  },
  accountMeta: {
    fontFamily: fonts.body,
    fontSize: typography.callout,
    marginTop: spacing.xs,
  },
  accountStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  accountStatus: {
    fontFamily: fonts.body,
    fontSize: typography.caption,
  },

  // ── Group ──
  group: {
    marginBottom: spacing.lg,
  },
  groupLast: {
    marginBottom: spacing.lg,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 48,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.pill,
  },
  // When the section is open, square off the bottom corners so the header
  // reads as one piece with the card beneath it.
  groupHeaderExpanded: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    borderRadius: radii.card,
    borderTopLeftRadius: radii.card,
    borderTopRightRadius: radii.card,
  },
  groupLabel: {
    fontFamily: fonts.bodyHeavy,
    fontSize: typography.eyebrow,
    letterSpacing: 0.8,
  },
  groupCard: {
    padding: 0,
    overflow: 'hidden',
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
  },
  // ── Quick Setup presets ──
  presetCard: {
    gap: spacing.md,
    // Sit flush beneath the section header pill (which squares its bottom
    // corners when expanded) so the open group reads as one connected piece.
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
  },
  presetIntro: {
    fontFamily: fonts.body,
    fontSize: typography.caption,
    lineHeight: 19,
  },
  presetGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  presetTile: {
    flexGrow: 1,
    flexBasis: '47%',
    minHeight: 60,
    borderRadius: radii.button,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
  },
  presetLabel: {
    fontFamily: fonts.displayBold,
    fontSize: typography.callout,
  },

  // ── Row ──
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 13,
    minHeight: 56,
  },
  rowIcon: {
    width: 32,
    height: 32,
    borderRadius: radii.button,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowLabel: {
    flex: 1,
    fontFamily: fonts.displayBold,
    fontSize: typography.body,
  },
  rowValue: {
    fontFamily: fonts.body,
    fontSize: typography.callout,
    maxWidth: '40%',
    textAlign: 'right',
  },
  rowDivider: {
    height: 1,
    marginLeft: 32 + spacing.md + spacing.md,
  },

  // ── Legal bar (tiny caption text, width matches the Sign Out button) ──
  legalBar: {
    width: 240,
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.md,
  },
  legalCaption: {
    fontFamily: fonts.body,
    fontSize: 10,
    lineHeight: 14,
    textAlign: 'center',
  },
  legalLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  legalLink: {
    fontFamily: fonts.body,
    fontSize: 10,
    lineHeight: 14,
    textDecorationLine: 'underline',
  },

  // ── PIN prompt ──
  pinPrompt: {
    marginHorizontal: spacing.md,
    marginVertical: spacing.sm,
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
  pinInputField: { flex: 1 },
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
  pinButton: { flex: 1 },

  // ── Sign Out ──
  signOutContainer: {
    alignItems: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.xxl,
  },
  signOutButton: {
    width: 240,
  },
});
