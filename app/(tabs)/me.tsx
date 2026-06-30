/**
 * Me / Profile tab — iOS Settings-style grouped list.
 *
 * Replaces the old open dashboard (user card + zero-stats + inline edit form +
 * flat guide list) with a calm, compact, progressively-disclosed settings
 * screen. Structure: Header → User Card → Profile → Settings → Accessibility →
 * Privacy & Data → Library & Guides → About → Sign Out.
 *
 * Design laws applied: 1 (simple first), 3 (expandable sections), 5 (deeper
 * pages on demand), 12 (separate risky actions), 13/14/16 (clear results,
 * spring/soft motion), 18 (reduce motion), 19 (haptics), 20 (44pt targets),
 * 21–23 (a11y labels, dynamic type, no colour-only), 27 (sections), 30 (calm).
 *
 * Most advanced settings are structural for now: rows that have a real
 * destination navigate there; rows whose feature is not built yet give calm
 * "coming soon" feedback so there are never dead ends.
 */

import React, { useCallback, useRef, useState } from 'react';
import {
  ActionSheetIOS,
  Alert,
  Animated,
  Easing,
  LayoutAnimation,
  Platform,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  UIManager,
  View,
} from 'react-native';
import { Href, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../../src/components/native/Card';
import { PrimaryButton } from '../../src/components/native/PrimaryButton';
import { Screen } from '../../src/components/native/Screen';
import { TextField } from '../../src/components/native/TextField';
import { TapTalkMascot } from '../../src/components/TapTalkMascot';
import { useAppContext } from '../../src/hooks/useAppContext';
import { useReduceMotion } from '../../src/hooks/useReduceMotion';
import { verifyPin } from '../../src/utils/pin';
import { hapticSelection } from '../../src/utils/haptics';
import { colors, radii, spacing, typography } from '../../src/theme/tokens';
import { useTheme } from '../../src/theme/useTheme';
import { fonts } from '../../src/theme/fonts';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const APP_VERSION = '0.1.0';
const voiceRoute = '/settings/voice' as Href;
const displayRoute = '/settings/display' as Href;
const attributionRoute = '/symbol-attribution' as Href;
const splashRoute = '/onboarding/splash' as Href;

const USER_TYPE_LABELS: Record<string, string> = {
  myself: 'AAC user',
  parent: 'Parent / Family',
  support: 'Support worker',
  guardian: 'Therapist',
};

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

// ── Row ──────────────────────────────────────────────────────────────────────

interface RowProps {
  icon: IoniconName;
  iconColor?: string;
  iconBg?: string;
  label: string;
  /** Right-aligned grey value, e.g. current selection. */
  value?: string;
  /** Spoken hint appended after the label. */
  hint?: string;
  onPress?: () => void;
  /** When provided, renders a Switch instead of a chevron. */
  toggle?: { value: boolean; onValueChange: () => void };
  /** Calm destructive styling (tinted label, no aggressive red fill). */
  destructive?: boolean;
  /** Static info row — no chevron, not pressable. */
  info?: boolean;
  showDivider?: boolean;
}

function SettingsRow({
  icon,
  iconColor,
  iconBg = '#E6F4FD',
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
  const spokenLabel = value ? `${label}, ${value}` : label;

  const body = (
    <>
      <View style={[styles.rowIcon, { backgroundColor: iconBg }]}>
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
            pressed && { backgroundColor: t.colors.background },
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
            pressed && { backgroundColor: t.colors.background },
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
  expanded: boolean;
  onToggle: () => void;
  reduceMotion: boolean;
  children: React.ReactNode;
}

function CollapsibleSection({ title, expanded, onToggle, reduceMotion, children }: SectionProps) {
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
    <View style={styles.sectionWrap}>
      <Text
        style={[styles.sectionEyebrow, { color: t.colors.textTertiary }]}
        accessibilityElementsHidden
        importantForAccessibility="no"
      >
        {title.toUpperCase()}
      </Text>
      <Card style={styles.sectionCard}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={title}
          accessibilityState={{ expanded }}
          accessibilityHint={expanded ? 'Collapses this section' : 'Expands this section'}
          onPress={handle}
          style={({ pressed }) => [
            styles.sectionHeader,
            pressed && { backgroundColor: t.colors.background },
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
  const { state, dispatch } = useAppContext();
  const t = useTheme();

  const [open, setOpen] = useState({
    profile: true,
    settings: false,
    accessibility: false,
    privacy: false,
    library: false,
    about: false,
  });
  const toggleSection = (key: keyof typeof open) =>
    setOpen((prev) => ({ ...prev, [key]: !prev[key] }));

  // Caregiver lock (preserved from previous screen) ──
  const [caregiverLocked, setCaregiverLocked] = useState(state.parent.lockEnabled);
  const [pinPromptVisible, setPinPromptVisible] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [showPin, setShowPin] = useState(false);

  const name =
    state.user.displayName || state.user.nickname || state.user.name || 'Guest';
  const initial = name.charAt(0).toUpperCase() || '?';
  const userType = state.user.role ? USER_TYPE_LABELS[state.user.role] ?? 'Other' : 'Not set';
  const hasPhoto = !!state.profilePhotoUri;

  const comingSoon = useCallback((feature: string) => {
    Alert.alert(feature, 'This is coming soon. We are building it with care.', [
      { text: 'OK', style: 'cancel' },
    ]);
  }, []);

  // Profile picture action sheet ──
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
        hapticSelection();
        return;
      }
      const option = options[index];
      if (!option) return;
      comingSoon(option);
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
  }, [hasPhoto, dispatch, comingSoon]);

  const onEditDisplayName = useCallback(() => {
    if (Platform.OS === 'ios' && typeof Alert.prompt === 'function') {
      Alert.prompt(
        'Display Name',
        'This is the name shown on your profile.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Save',
            onPress: (text?: string) => {
              const trimmed = (text ?? '').trim();
              if (!trimmed) return;
              dispatch({ type: 'SET_USER', payload: { displayName: trimmed, nickname: trimmed } });
            },
          },
        ],
        'plain-text',
        name === 'Guest' ? '' : name,
      );
    } else {
      comingSoon('Display Name');
    }
  }, [name, dispatch, comingSoon]);

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
  }, [dispatch, state.user.role]);

  // Caregiver lock handlers ──
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

  const signOut = useCallback(() => {
    Alert.alert('Sign out?', 'You can sign back in any time with your email.', [
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
    <Screen title="Profile" subtitle="Your voice, access, and app controls.">
      {/* 2 · User Card — always visible; opens the Profile section. */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${name}. Voice and AAC profile ready.`}
        accessibilityHint="Opens your profile details"
        onPress={() => {
          hapticSelection();
          setOpen((prev) => ({ ...prev, profile: true }));
        }}
        style={({ pressed }) => [pressed && styles.userCardPressed]}
      >
        <Card style={styles.userCard}>
          <View style={styles.avatar}>
            <Text style={[styles.avatarText, { color: t.colors.surface }]}>{initial}</Text>
          </View>
          <View style={styles.userCopy}>
            <Text style={[styles.userName, { color: t.colors.text }]} numberOfLines={1}>
              {name}
            </Text>
            <Text style={[styles.userMeta, { color: t.colors.textMuted }]} numberOfLines={1}>
              Voice and AAC profile ready
            </Text>
          </View>
          <Ionicons
            name="chevron-forward"
            size={18}
            color={t.colors.textTertiary}
            accessibilityElementsHidden
            importantForAccessibility="no"
          />
        </Card>
      </Pressable>

      {/* 3 · Profile */}
      <CollapsibleSection
        title="Profile"
        expanded={open.profile}
        onToggle={() => toggleSection('profile')}
        reduceMotion={reduceMotion}
      >
        <SettingsRow
          icon="image-outline"
          label="Profile Picture"
          value={hasPhoto ? 'Set' : 'Avatar'}
          hint="Choose an avatar, symbol, or photo"
          onPress={onProfilePicture}
        />
        <SettingsRow
          icon="person-outline"
          label="Display Name"
          value={name === 'Guest' ? 'Not set' : name}
          onPress={onEditDisplayName}
        />
        <SettingsRow
          icon="mic-outline"
          label="Voice Name"
          value="Default"
          hint="Choose the speaking voice"
          onPress={() => router.push(voiceRoute)}
        />
        <SettingsRow
          icon="people-outline"
          label="User Type"
          value={userType}
          onPress={onEditUserType}
          showDivider={false}
        />
      </CollapsibleSection>

      {/* 5 · Settings */}
      <CollapsibleSection
        title="Settings"
        expanded={open.settings}
        onToggle={() => toggleSection('settings')}
        reduceMotion={reduceMotion}
      >
        <SettingsRow
          icon="volume-high-outline"
          label="Voice & Speech"
          hint="Voice, speed, and pitch"
          onPress={() => router.push(voiceRoute)}
        />
        <SettingsRow
          icon="musical-notes-outline"
          iconColor="#FF9500"
          iconBg="#FFF4E0"
          label="Sounds & Haptics"
          onPress={() => comingSoon('Sounds & Haptics')}
        />
        <SettingsRow
          icon="grid-outline"
          iconColor="#5CD65C"
          iconBg="#E8FAE8"
          label="Board Appearance"
          onPress={() => router.push(displayRoute)}
        />
        <SettingsRow
          icon="language-outline"
          iconColor="#BD73FF"
          iconBg="#F3EAFF"
          label="Language"
          value="English"
          onPress={() => comingSoon('Language')}
          showDivider={false}
        />
      </CollapsibleSection>

      {/* 6 · Accessibility */}
      <CollapsibleSection
        title="Accessibility"
        expanded={open.accessibility}
        onToggle={() => toggleSection('accessibility')}
        reduceMotion={reduceMotion}
      >
        <SettingsRow
          icon="text-outline"
          label="Text Size"
          hint="Make text larger or smaller"
          onPress={() => router.push(displayRoute)}
        />
        <SettingsRow
          icon="resize-outline"
          iconColor="#5CD65C"
          iconBg="#E8FAE8"
          label="Button Size"
          onPress={() => router.push(displayRoute)}
        />
        <SettingsRow
          icon="contract-outline"
          iconColor="#FF9500"
          iconBg="#FFF4E0"
          label="Reduce Motion"
          value={reduceMotion ? 'On' : 'Follows iOS'}
          hint="Reduce Motion follows your iOS setting"
          onPress={() =>
            Alert.alert(
              'Reduce Motion',
              'TapTalk follows the Reduce Motion setting in iOS Settings → Accessibility → Motion. When it is on, animations become gentle fades.',
              [{ text: 'OK', style: 'cancel' }],
            )
          }
        />
        <SettingsRow
          icon="contrast-outline"
          iconColor="#BD73FF"
          iconBg="#F3EAFF"
          label="Increase Contrast"
          toggle={{ value: state.accessibility.highContrast, onValueChange: toggleHighContrast }}
        />
        <SettingsRow
          icon="eye-outline"
          label="VoiceOver Support"
          value="Built in"
          hint="Information about screen reader support"
          onPress={() =>
            Alert.alert(
              'VoiceOver Support',
              'Every control in TapTalk is labelled for VoiceOver. Turn VoiceOver on in iOS Settings → Accessibility.',
              [{ text: 'OK', style: 'cancel' }],
            )
          }
        />
        <SettingsRow
          icon="heart-outline"
          iconColor="#FF9500"
          iconBg="#FFF4E0"
          label="Calm Feedback"
          onPress={() => comingSoon('Calm Feedback')}
          showDivider={false}
        />
      </CollapsibleSection>

      {/* 7 · Privacy & Data */}
      <CollapsibleSection
        title="Privacy & Data"
        expanded={open.privacy}
        onToggle={() => toggleSection('privacy')}
        reduceMotion={reduceMotion}
      >
        <Text style={[styles.sectionNote, { color: t.colors.textMuted }]}>
          TapTalk keeps your profile and AAC choices private. Photos are only used when you choose
          them. You can export or delete your profile data anytime.
        </Text>

        {/* Caregiver lock — preserved feature, lives with trust & control. */}
        <SettingsRow
          icon="lock-closed-outline"
          label="Caregiver Lock"
          hint="Protect settings with a PIN"
          toggle={{ value: caregiverLocked, onValueChange: toggleLock }}
        />
        {pinPromptVisible ? (
          <View style={[styles.pinPrompt, { backgroundColor: t.colors.input }]}>
            <Text style={[styles.pinPromptLabel, { color: t.colors.text }]}>
              Enter your 6-digit PIN to disable lock
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
          iconColor="#5CD65C"
          iconBg="#E8FAE8"
          label="Camera Access"
          onPress={() => comingSoon('Camera Access')}
        />
        <SettingsRow
          icon="images-outline"
          iconColor="#BD73FF"
          iconBg="#F3EAFF"
          label="Photo Access"
          onPress={() => comingSoon('Photo Access')}
        />
        <SettingsRow
          icon="phone-portrait-outline"
          label="Local Data"
          value="On this device"
          onPress={() => comingSoon('Local Data')}
        />
        <SettingsRow
          icon="download-outline"
          label="Export My Data"
          onPress={() => comingSoon('Export My Data')}
        />
        <SettingsRow
          icon="trash-outline"
          iconColor={t.colors.danger}
          iconBg="#FDECEC"
          label="Delete Profile Data"
          destructive
          hint="Calm, confirmed delete"
          onPress={() =>
            Alert.alert(
              'Delete Profile Data',
              'This will be available soon. When ready, it will ask you to confirm before anything is removed.',
              [{ text: 'OK', style: 'cancel' }],
            )
          }
          showDivider={false}
        />
      </CollapsibleSection>

      {/* 8 · Library & Guides */}
      <CollapsibleSection
        title="Library & Guides"
        expanded={open.library}
        onToggle={() => toggleSection('library')}
        reduceMotion={reduceMotion}
      >
        <SettingsRow
          icon="book-outline"
          label="Welcome to TapTalk"
          onPress={() => comingSoon('Welcome to TapTalk')}
        />
        <SettingsRow
          icon="grid-outline"
          label="Using the AAC Board"
          onPress={() => comingSoon('Using the AAC Board')}
        />
        <SettingsRow
          icon="list-outline"
          label="First-Then and Lists"
          onPress={() => comingSoon('First-Then and Lists')}
        />
        <SettingsRow
          icon="shield-checkmark-outline"
          label="Caregiver Controls"
          onPress={() => comingSoon('Caregiver Controls')}
        />
        <SettingsRow
          icon="information-circle-outline"
          label="Symbol Licences & Attribution"
          onPress={() => router.push(attributionRoute)}
          showDivider={false}
        />
      </CollapsibleSection>

      {/* 9 · About */}
      <CollapsibleSection
        title="About"
        expanded={open.about}
        onToggle={() => toggleSection('about')}
        reduceMotion={reduceMotion}
      >
        <SettingsRow icon="information-circle-outline" label="App Version" value={APP_VERSION} info />
        <SettingsRow
          icon="ribbon-outline"
          label="Symbol Licences"
          onPress={() => router.push(attributionRoute)}
        />
        <SettingsRow
          icon="library-outline"
          label="Mulberry Attribution"
          onPress={() => router.push(attributionRoute)}
        />
        <SettingsRow
          icon="help-buoy-outline"
          iconColor="#5CD65C"
          iconBg="#E8FAE8"
          label="Support"
          onPress={() => comingSoon('Support')}
        />
        <SettingsRow
          icon="document-text-outline"
          label="Privacy Policy"
          onPress={() => comingSoon('Privacy Policy')}
          showDivider={false}
        />
      </CollapsibleSection>

      <View style={styles.mascotRow} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <TapTalkMascot variant="business" style={styles.mascot} />
        <Text style={[styles.mascotText, { color: t.colors.textMuted }]}>
          Built with care for everyone who deserves to be heard.
        </Text>
      </View>

      <PrimaryButton
        accessibilityLabel="Sign out"
        label="Sign Out"
        onPress={signOut}
        variant="danger"
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  // User card ──
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  userCardPressed: {
    opacity: 0.7,
  },
  avatar: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 28,
    backgroundColor: colors.primary,
  },
  avatarText: {
    fontFamily: fonts.displayBlack,
    color: colors.surface,
    fontSize: 26,
  },
  userCopy: { flex: 1 },
  userName: {
    fontFamily: fonts.displayHeavy,
    color: colors.text,
    fontSize: typography.subheading,
    letterSpacing: -0.3,
  },
  userMeta: {
    fontFamily: fonts.body,
    marginTop: 2,
    color: colors.textMuted,
    fontSize: typography.caption,
  },

  // Section ──
  sectionWrap: {
    marginBottom: spacing.lg,
  },
  sectionEyebrow: {
    fontFamily: fonts.bodyHeavy,
    fontSize: typography.caption,
    color: colors.textTertiary,
    letterSpacing: 0.8,
    marginBottom: spacing.xs,
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
    color: colors.text,
    letterSpacing: -0.2,
  },
  sectionBody: {
    paddingBottom: spacing.xs,
  },
  sectionNote: {
    fontFamily: fonts.body,
    fontSize: typography.caption,
    color: colors.textMuted,
    lineHeight: 19,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs,
    paddingBottom: spacing.sm,
  },

  // Row ──
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    minHeight: 52,
  },
  rowPressed: {
    backgroundColor: colors.background,
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
    color: colors.text,
  },
  rowLabelDestructive: {
    color: colors.danger,
  },
  rowValue: {
    fontFamily: fonts.body,
    fontSize: typography.callout,
    color: colors.textTertiary,
  },
  rowDivider: {
    height: 1,
    backgroundColor: '#EEF2F6',
    marginLeft: 34 + spacing.md + spacing.md,
  },

  // Mascot ──
  mascotRow: {
    alignItems: 'center',
    gap: spacing.sm,
    marginVertical: spacing.lg,
  },
  mascot: {
    width: 64,
    height: 64,
  },
  mascotText: {
    fontFamily: fonts.body,
    color: colors.textMuted,
    fontSize: typography.caption,
    textAlign: 'center',
  },

  // PIN prompt ──
  pinPrompt: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    borderRadius: radii.card,
    backgroundColor: colors.input,
    padding: spacing.md,
  },
  pinPromptLabel: {
    fontFamily: fonts.displayHeavy,
    color: colors.text,
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
    color: colors.danger,
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
});
