/**
 * Me / Profile tab — an iOS Settings-style index.
 *
 * De-duplicated hub: each setting has exactly one home, and this page links
 * to it once. Deep settings open focused secondary pages; only true on/off
 * settings use toggles, and every toggle mutates state and reflects
 * immediately (Rules 1, 5, 8, 13, 27, 30).
 *
 * Section order:
 *   Account Card · User Profile · General · Accessibility · Privacy & Data ·
 *   Security & Access · Help & Support · About & Legal · Advanced · Sign Out
 *
 * Advanced holds the less-used rows (hidden words, sign-in method, camera and
 * photo permissions) behind a "Show Advanced Settings" toggle that is OFF by
 * default and persists.
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  LayoutAnimation,
  Linking,
  Platform,
  Pressable,
  Share,
  StyleSheet,
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
import { SettingsRow } from '../../src/components/native/SettingsRow';
import { TextField } from '../../src/components/native/TextField';
import { AvatarView } from '../../src/features/profile/AvatarView';
import { useAppContext } from '../../src/hooks/useAppContext';
import { splitAppState } from '../../src/context/persistence';
import { usePullRefresh } from '../../src/hooks/usePullRefresh';
import { useReduceMotion } from '../../src/hooks/useReduceMotion';
import { verifyPin } from '../../src/utils/pin';
import { hapticSelection, hapticSuccess } from '../../src/utils/haptics';
import { radii, spacing, typography } from '../../src/theme/tokens';
import { useTheme } from '../../src/theme/useTheme';
import { fonts } from '../../src/theme/fonts';
import { supabase } from '../../src/lib/supabase';

const APP_VERSION = '0.1.0';
const SUPPORT_EMAIL = 'hello@taptalk.app';

const SHOW_ADVANCED_KEY = '@taptalk/profile/showAdvanced/v1';

const accountRoute = '/settings/account' as Href;
const voiceRoute = '/settings/voice' as Href;
const displayRoute = '/settings/display' as Href;
const hiddenTilesRoute = '/board/hidden-tiles' as Href;
const pronunciationRoute = '/settings/pronunciation' as Href;
const passportRoute = '/passport' as Href;
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

function speechRateLabel(rate: number): string {
  if (rate < 0.8) return 'Slow';
  if (rate > 1.0) return 'Fast';
  return 'Normal';
}

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// Flat iOS-Settings section: a small grouped-list title sitting ~5pt above an
// always-visible card of rows (scan, don't expand).
function Group({
  label,
  children,
  last,
}: {
  label: string;
  children: React.ReactNode;
  last?: boolean;
}) {
  const t = useTheme();
  return (
    <View style={[styles.group, last && styles.groupLast]}>
      <Text
        accessibilityRole="header"
        style={[styles.groupTitle, { color: t.colors.textTertiary }]}
      >
        {label.toUpperCase()}
      </Text>
      <Card style={styles.groupCard}>{children}</Card>
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

  const [saveNotice, setSaveNotice] = useState('');

  // Caregiver lock
  const [caregiverLocked, setCaregiverLocked] = useState(state.parent.lockEnabled);
  const [pinPromptVisible, setPinPromptVisible] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [showPin, setShowPin] = useState(false);

  // ── Advanced settings (hidden by default, persisted) ──
  const [showAdvanced, setShowAdvanced] = useState(false);
  useEffect(() => {
    AsyncStorage.getItem(SHOW_ADVANCED_KEY)
      .then((raw) => {
        if (raw === 'true') setShowAdvanced(true);
      })
      .catch(() => {});
  }, []);

  const setAdvancedVisibility = useCallback(
    (next: boolean) => {
      if (next === showAdvanced) return;
      if (!reduceMotion) {
        LayoutAnimation.configureNext({
          duration: 200,
          create: { type: 'easeInEaseOut', property: 'opacity' },
          update: { type: 'easeInEaseOut' },
          delete: { type: 'easeInEaseOut', property: 'opacity' },
        });
      }
      setShowAdvanced(() => {
        AsyncStorage.setItem(SHOW_ADVANCED_KEY, next ? 'true' : 'false').catch(() => {});
        return next;
      });
    },
    [reduceMotion, showAdvanced],
  );

  const name = state.user.displayName || state.user.nickname || state.user.name || 'Guest';
  const initial = name.charAt(0).toUpperCase() || '?';
  const userType = state.user.role ? USER_TYPE_LABELS[state.user.role] ?? 'Other' : 'Not set';
  const voiceLabel = speechRateLabel(state.accessibility.speechRate);
  const textSizeLabel = TEXT_SIZE_LABELS[state.accessibility.textSize] ?? 'Default';
  const signInLabel =
    state.secureMethod === 'passkey' ? 'Passkey' : state.secureMethod === 'password' ? 'Password' : 'Not set';
  const passportStarted =
    state.passport.howICommunicate.trim().length > 0 ||
    state.passport.whatHelps.trim().length > 0 ||
    state.passport.trustedContacts.length > 0;

  const showSaveNotice = useCallback((message: string) => {
    setSaveNotice(message);
    hapticSuccess();
    setTimeout(() => setSaveNotice(''), 2000);
  }, []);

  const handleToggleBiometrics = useCallback(
    (next: boolean) => {
      dispatch({
        type: 'SET_SECURE_METHOD',
        payload: {
          method: state.secureMethod ?? 'password',
          biometricsEnabled: next,
        },
      });
    },
    [dispatch, state.secureMethod],
  );

  const handleToggleRememberLogin = useCallback(
    (next: boolean) => {
      dispatch({ type: 'SET_REMEMBER_LOGIN', payload: next });
    },
    [dispatch],
  );

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

  const handleToggleLock = useCallback(
    (next: boolean) => {
      if (next === caregiverLocked) return;
      toggleLock();
    },
    [caregiverLocked, toggleLock],
  );

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
        onPress: async () => {
          await supabase?.auth.signOut().catch(() => undefined);
          dispatch({ type: 'SIGN_OUT' });
          router.replace(splashRoute);
        },
      },
    ]);
  }, [dispatch, router]);

  return (
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
        <SettingsRow
          type="navigation"
          icon="person-circle-outline"
          label="Edit Profile"
          value={name === 'Guest' ? 'Set up' : 'Open'}
          hint="Edit your picture, name, nickname, and user type"
          onPress={() => router.push(accountRoute)}
        />
        <SettingsRow
          type="navigation"
          icon="id-card-outline"
          iconColor={t.colors.iconTintPurple}
          iconBg={t.colors.iconTintPurpleBg}
          label="Communication Passport"
          value={passportStarted ? 'Open' : 'Set up'}
          hint="How you communicate, what helps, and who to contact — for support workers and staff"
          onPress={() => router.push(passportRoute)}
          showDivider={false}
        />
      </Group>

      {/* ── General ── */}
      <Group label="General">
        <SettingsRow
          type="navigation"
          icon="volume-high-outline"
          label="Voice & Speech"
          value={voiceLabel}
          hint="Choose the voice, speed, and pitch"
          onPress={() => router.push(voiceRoute)}
        />
        <SettingsRow
          type="navigation"
          icon="chatbubble-ellipses-outline"
          iconColor={t.colors.iconTintBlue}
          iconBg={t.colors.iconTintBlueBg}
          label="Pronunciations"
          hint="Fix how the voice says names and words"
          onPress={() => router.push(pronunciationRoute)}
        />
        <SettingsRow
          type="action"
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
        <SettingsRow
          type="action"
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

      {/* ── Accessibility — one home for everything ── */}
      <Group label="Accessibility">
        <SettingsRow
          type="navigation"
          icon="options-outline"
          iconColor={t.colors.iconTintGreen}
          iconBg={t.colors.iconTintGreenBg}
          label="Accessibility & Display"
          value={`${textSizeLabel} text`}
          hint="Vision, motor, and sensory settings — text size, theme, contrast, buttons, haptics, motion, and sounds"
          onPress={() => router.push(displayRoute)}
          showDivider={false}
        />
      </Group>

      {/* ── Privacy & Data ── */}
      <Group label="Privacy & Data">
        <SettingsRow
          type="navigation"
          icon="shield-checkmark-outline"
          label="Privacy Policy"
          hint="How TapTalk stores, uses, and protects your data"
          onPress={() => router.push(privacyPolicyRoute)}
        />
        <SettingsRow
          type="navigation"
          icon="options-outline"
          iconColor={t.colors.iconTintPurple}
          iconBg={t.colors.iconTintPurpleBg}
          label="Data & Privacy Choices"
          hint="Manage, export, delete, or request changes to your data"
          onPress={() => router.push(dataChoicesRoute)}
        />
        <SettingsRow
          type="action"
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
        <SettingsRow
          type="action"
          icon="download-outline"
          iconColor={t.colors.iconTintBlue}
          iconBg={t.colors.iconTintBlueBg}
          label="Export My Data"
          hint="Share a copy of your profile as text"
          onPress={exportProfileData}
        />
        <SettingsRow
          type="action"
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

      {/* ── Security & Access ── */}
      <Group label="Security & Access">
        <SettingsRow
          type="toggle"
          icon="lock-closed-outline"
          label="Caregiver Lock"
          hint="Requires a PIN before changing settings on a shared device"
          toggleValue={caregiverLocked}
          onToggle={handleToggleLock}
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
        <SettingsRow
          type="toggle"
          icon="finger-print-outline"
          iconColor={t.colors.iconTintGreen}
          iconBg={t.colors.iconTintGreenBg}
          label="Biometric Unlock"
          hint="Use Face ID or Touch ID to open TapTalk"
          toggleValue={state.biometricsEnabled}
          onToggle={handleToggleBiometrics}
        />
        <SettingsRow
          type="toggle"
          icon="log-in-outline"
          iconColor={t.colors.iconTintNeutral}
          iconBg={t.colors.iconTintNeutralBg}
          label="Keep Me Signed In"
          hint="Skip the sign-in screen on this device"
          toggleValue={state.rememberLogin}
          onToggle={handleToggleRememberLogin}
          showDivider={false}
        />
      </Group>

      {/* ── Help & Support ── */}
      <Group label="Help & Support">
        <SettingsRow
          type="navigation"
          icon="compass-outline"
          label="Replay the Tour"
          hint="Walk through Talk, Activity, Tools, and Profile again"
          onPress={() => router.push(tourRoute)}
        />
        <SettingsRow
          type="action"
          icon="mail-outline"
          iconColor={t.colors.iconTintBlue}
          iconBg={t.colors.iconTintBlueBg}
          label="Contact Support"
          hint="Email the developer for help or privacy questions"
          onPress={contactSupport}
        />
        <SettingsRow
          type="action"
          icon="chatbox-ellipses-outline"
          iconColor={t.colors.iconTintPurple}
          iconBg={t.colors.iconTintPurpleBg}
          label="Send Feedback"
          hint="Tell us what would make TapTalk better"
          onPress={sendFeedback}
          showDivider={false}
        />
      </Group>

      {/* ── About & Legal ── */}
      <Group label="About & Legal">
        <SettingsRow
          type="navigation"
          icon="heart-outline"
          iconColor={t.colors.iconTintBlue}
          iconBg={t.colors.iconTintBlueBg}
          label="Our Beliefs"
          hint="What TapTalk stands for and who built it"
          onPress={() => router.push(beliefsRoute)}
        />
        <SettingsRow
          type="navigation"
          icon="document-text-outline"
          iconColor={t.colors.iconTintNeutral}
          iconBg={t.colors.iconTintNeutralBg}
          label="Terms of Use"
          hint="Plain-English rules for using TapTalk safely"
          onPress={() => router.push(termsRoute)}
        />
        <SettingsRow
          type="navigation"
          icon="medkit-outline"
          iconColor={t.colors.iconTintGreen}
          iconBg={t.colors.iconTintGreenBg}
          label="Medical & Therapy Disclaimer"
          hint="TapTalk supports communication but does not replace professional advice"
          onPress={() => router.push(medicalDisclaimerRoute)}
        />
        <SettingsRow
          type="navigation"
          icon="ribbon-outline"
          iconColor={t.colors.iconTintOrange}
          iconBg={t.colors.iconTintOrangeBg}
          label="Licences & Attribution"
          hint="Symbol, icon, sound, font, and open-source credits"
          onPress={() => router.push(attributionRoute)}
        />
        <SettingsRow
          type="static"
          icon="information-circle-outline"
          label="App Version"
          value={APP_VERSION}
          showDivider={false}
        />
      </Group>

      {/* ── Advanced (hidden by default) ── */}
      <Group label="Advanced" last>
        <SettingsRow
          type="toggle"
          icon="construct-outline"
          iconColor={t.colors.iconTintNeutral}
          iconBg={t.colors.iconTintNeutralBg}
          label="Show Advanced Settings"
          hint="Less-used options. Hidden to keep this page simple."
          toggleValue={showAdvanced}
          onToggle={setAdvancedVisibility}
          showDivider={showAdvanced}
        />
        {showAdvanced ? (
          <>
            <SettingsRow
              type="navigation"
              icon="eye-off-outline"
              iconColor={t.colors.iconTintPurple}
              iconBg={t.colors.iconTintPurpleBg}
              label="Hidden Words"
              value={state.hiddenTileIds.length > 0 ? String(state.hiddenTileIds.length) : 'None'}
              hint="See and restore words hidden from a board"
              onPress={() => router.push(hiddenTilesRoute)}
            />
            <SettingsRow
              type="action"
              icon="key-outline"
              label="Sign-in Method"
              value={signInLabel}
              hint="How you sign in to TapTalk"
              onPress={() =>
                Alert.alert(
                  'Sign-in Method',
                  state.secureMethod === 'passkey'
                    ? 'You sign in with a passkey using Face ID or Touch ID.'
                    : 'You sign in with a password. You can enable biometric unlock in Security & Access.',
                  [{ text: 'OK', style: 'cancel' }],
                )
              }
            />
            <SettingsRow
              type="action"
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
            <SettingsRow
              type="action"
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
          </>
        ) : null}
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
  // iOS grouped-list section title: quiet uppercase caption ~5pt above the card.
  groupTitle: {
    fontFamily: fonts.bodyHeavy,
    fontSize: typography.eyebrow,
    letterSpacing: 0.8,
    marginBottom: 5,
    marginLeft: spacing.md,
  },
  groupCard: {
    padding: 0,
    overflow: 'hidden',
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
