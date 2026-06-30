import React, { useCallback, useState } from 'react';
import { Alert, Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { Href, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../../src/components/native/Card';
import { PrimaryButton } from '../../src/components/native/PrimaryButton';
import { Screen } from '../../src/components/native/Screen';
import { TextField } from '../../src/components/native/TextField';
import { TapTalkMascot } from '../../src/components/TapTalkMascot';
import { useAppContext } from '../../src/hooks/useAppContext';
import { listStyles } from '../../src/styles/listStyles';
import { verifyPin } from '../../src/utils/pin';
import { hapticSelection } from '../../src/utils/haptics';
import { colors, radii, spacing, typography } from '../../src/theme/tokens';

const documents = [
  'Welcome to TapTalk',
  'Using the AAC Board',
  'Today Tools: First-Then and Lists',
  'Caregiver Controls',
];
const splashRoute = '/onboarding/splash' as Href;
const attributionRoute = '/symbol-attribution' as Href;

export default function MeScreen() {
  const router = useRouter();
  const { state, dispatch } = useAppContext();
  const [displayName, setDisplayName] = useState(state.user.displayName || state.user.nickname);
  const [caregiverLocked, setCaregiverLocked] = useState(state.parent.lockEnabled);
  const [pinPromptVisible, setPinPromptVisible] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [showPin, setShowPin] = useState(false);

  const saveProfile = () => {
    dispatch({
      type: 'SET_USER',
      payload: {
        displayName: displayName.trim(),
        nickname: displayName.trim(),
      },
    });
  };

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

  const signOut = () => {
    Alert.alert(
      'Sign out?',
      'You can sign back in any time with your email.',
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
  };

  const name = state.user.displayName || state.user.nickname || state.user.name || 'Guest';
  const initial = name.charAt(0).toUpperCase() || '?';

  return (
    <Screen title="Profile" subtitle="Your account, voice, and controls.">
      <Card style={styles.profileCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initial}</Text>
        </View>
        <View style={styles.profileCopy}>
          <Text style={styles.name}>{name}</Text>
          <Text style={styles.email}>{state.user.email || 'No email signed in'}</Text>
        </View>
      </Card>

      {/* ── Stats row (from design system MeScreen) */}
      <View style={styles.statsRow}>
        {([
          [String(state.talkStats.totalWords), 'total words'],
          [String(state.talkStats.streakDays), 'day streak'],
          [String(state.activityStats.gamesPlayed), 'activities'],
        ] as [string, string][]).map(([num, label]) => (
          <Card key={label} style={styles.statCard}>
            <Text style={styles.statNum}>{num}</Text>
            <Text style={styles.statLabel}>{label}</Text>
          </Card>
        ))}
      </View>

      <Card style={listStyles.section}>
        <Text style={listStyles.sectionTitle}>Edit Profile</Text>
        <Text style={styles.fieldLabel}>Display name</Text>
        <TextField
          accessibilityLabel="Display name"
          placeholder="e.g. Alex"
          value={displayName}
          onChangeText={setDisplayName}
          style={styles.profileInput}
        />
        <PrimaryButton
          accessibilityLabel="Save profile"
          label="Save Profile"
          onPress={saveProfile}
        />
      </Card>

      <Card style={listStyles.section}>
        <Text style={listStyles.sectionTitle}>Library & Guides</Text>
        {documents.map((doc) => (
          <View key={doc} style={styles.docRow}>
            <Ionicons
              name="book-outline"
              size={20}
              color={colors.primary}
              style={styles.docIcon}
              accessibilityElementsHidden
              importantForAccessibility="no"
            />
            <Text style={styles.docText}>{doc}</Text>
          </View>
        ))}
        <Pressable
          accessibilityRole="link"
          accessibilityLabel="Open symbol licences"
          onPress={() => { hapticSelection(); router.push(attributionRoute); }}
          style={styles.docRow}
        >
          <Ionicons
            name="information-circle-outline"
            size={20}
            color={colors.primary}
            style={styles.docIcon}
            accessibilityElementsHidden
            importantForAccessibility="no"
          />
          <Text style={styles.docText}>Symbol Licences & Attribution</Text>
        </Pressable>
      </Card>

      <Card style={listStyles.section}>
        <Text style={listStyles.sectionTitle}>Caregiver Controls</Text>
        <View style={styles.settingRow}>
          <View style={styles.settingCopy}>
            <Text style={styles.settingTitle}>Caregiver Lock</Text>
            <Text style={styles.settingSubtitle}>Protect settings with a PIN.</Text>
          </View>
          <Switch
            value={caregiverLocked}
            onValueChange={toggleLock}
            trackColor={{ false: colors.disabled, true: colors.success }}
            thumbColor={colors.surface}
            ios_backgroundColor={colors.disabled}
            accessibilityLabel="Caregiver lock"
          />
        </View>
        {pinPromptVisible ? (
          <View style={styles.pinPrompt}>
            <Text style={styles.pinPromptLabel}>Enter your 6-digit PIN to disable lock</Text>
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
                  color={colors.textMuted}
                />
              </Pressable>
            </View>
            {pinError ? (
              <Text
                style={styles.pinError}
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
        <View style={styles.parentDetails}>
          <Text style={styles.parentText}>Parent email: {state.parent.email || 'Not set'}</Text>
          <Text style={styles.parentText}>
            Timeout: {state.parent.timeoutHours ? `${state.parent.timeoutHours} hours` : 'Not set'}
          </Text>
        </View>
      </Card>

      <Card style={styles.mascotCard}>
        <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          <TapTalkMascot variant="business" style={styles.mascot} />
        </View>
        <Text style={styles.mascotText}>Built with care for everyone who deserves to be heard.</Text>
      </Card>

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
  avatar: {
    width: 64,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 32,
    backgroundColor: colors.primary,
  },
  avatarText: {
    color: colors.surface,
    fontSize: 28,
    fontWeight: '900',
  },
  docIcon: {
    width: 24,
    textAlign: 'center',
  },
  // Rhythm comes from vertical padding alone — no decorative dividers.
  docRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  docText: {
    flex: 1,
    color: colors.text,
    fontSize: typography.callout,
    fontWeight: '700',
  },
  email: {
    marginTop: 2,
    color: colors.textMuted,
    fontSize: typography.caption,
  },
  mascot: {
    width: 72,
    height: 72,
  },
  mascotCard: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  mascotText: {
    marginTop: spacing.sm,
    color: colors.textMuted,
    fontSize: typography.caption,
    textAlign: 'center',
  },
  name: {
    color: colors.text,
    fontSize: typography.subheading,
    fontWeight: '900',
  },
  parentDetails: {
    marginTop: spacing.md,
    borderRadius: radii.card,
    backgroundColor: colors.input,
    padding: spacing.md,
  },
  parentText: {
    color: colors.textMuted,
    fontSize: typography.caption,
    fontWeight: '700',
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  profileCopy: {
    flex: 1,
  },
  fieldLabel: {
    marginTop: spacing.md,
    marginBottom: 6,
    fontSize: typography.caption,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.2,
  },
  profileInput: {
    marginBottom: spacing.md,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  settingCopy: {
    flex: 1,
  },
  settingSubtitle: {
    marginTop: 2,
    color: colors.textMuted,
    fontSize: typography.caption,
  },
  settingTitle: {
    color: colors.text,
    fontSize: typography.callout,
    fontWeight: '800',
  },
  pinPrompt: {
    marginTop: spacing.md,
    borderRadius: radii.card,
    backgroundColor: colors.input,
    padding: spacing.md,
  },
  pinPromptLabel: {
    color: colors.text,
    fontSize: typography.caption,
    fontWeight: '800',
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
    color: colors.danger,
    fontSize: typography.caption,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  pinActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  pinButton: {
    flex: 1,
  },

  // ── Stats row
  statsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  statNum: {
    fontSize: typography.heading,
    fontWeight: '900',
    color: colors.primary,
    letterSpacing: -0.5,
  },
  statLabel: {
    marginTop: 2,
    fontSize: typography.caption,
    color: colors.textMuted,
    fontWeight: '700',
    textAlign: 'center',
  },
});
