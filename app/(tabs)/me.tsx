import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Href, useRouter } from 'expo-router';
import { Card } from '../../src/components/native/Card';
import { PrimaryButton } from '../../src/components/native/PrimaryButton';
import { Screen } from '../../src/components/native/Screen';
import { TextField } from '../../src/components/native/TextField';
import { TapTalkMascot } from '../../src/components/TapTalkMascot';
import { useAppContext } from '../../src/hooks/useAppContext';
import { listStyles } from '../../src/styles/listStyles';
import { colors, radii, spacing, typography } from '../../src/theme/tokens';

const documents = [
  'Welcome to TapTalk',
  'Using the AAC Board',
  'Today Tools: First-Then and Lists',
  'Caregiver Controls',
];
const splashRoute = '/onboarding/splash' as Href;

export default function MeScreen() {
  const router = useRouter();
  const { state, dispatch } = useAppContext();
  const [displayName, setDisplayName] = useState(state.user.displayName || state.user.nickname);
  const [caregiverLocked, setCaregiverLocked] = useState(state.parent.lockEnabled);

  const saveProfile = () => {
    dispatch({
      type: 'SET_USER',
      payload: {
        displayName: displayName.trim(),
        nickname: displayName.trim(),
      },
    });
  };

  const toggleLock = () => {
    const next = !caregiverLocked;
    setCaregiverLocked(next);
    dispatch({ type: 'SET_PARENT', payload: { lockEnabled: next } });
  };

  const signOut = () => {
    dispatch({ type: 'SIGN_OUT' });
    router.replace(splashRoute);
  };

  const name = state.user.displayName || state.user.nickname || state.user.name || 'Guest';
  const initial = name.charAt(0).toUpperCase() || '?';

  return (
    <Screen title="Me" subtitle="Profile, supports, and calm controls.">
      <Card style={styles.profileCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initial}</Text>
        </View>
        <View style={styles.profileCopy}>
          <Text style={styles.name}>{name}</Text>
          <Text style={styles.email}>{state.user.email || 'No email signed in'}</Text>
        </View>
      </Card>

      <Card style={listStyles.section}>
        <Text style={listStyles.sectionTitle}>Edit Profile</Text>
        <TextField
          accessibilityLabel="Display name"
          placeholder="Display name"
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
            <Text style={styles.docIcon}>📚</Text>
            <Text style={styles.docText}>{doc}</Text>
          </View>
        ))}
      </Card>

      <Card style={listStyles.section}>
        <Text style={listStyles.sectionTitle}>Caregiver Controls</Text>
        <Pressable
          accessibilityRole="switch"
          accessibilityLabel="Caregiver lock"
          accessibilityState={{ checked: caregiverLocked }}
          onPress={toggleLock}
          style={styles.settingRow}
        >
          <View>
            <Text style={styles.settingTitle}>Caregiver Lock</Text>
            <Text style={styles.settingSubtitle}>Protect settings with a PIN.</Text>
          </View>
          <View style={[styles.switchTrack, caregiverLocked && styles.switchTrackOn]}>
            <View style={[styles.switchThumb, caregiverLocked && styles.switchThumbOn]} />
          </View>
        </Pressable>
        <View style={styles.parentDetails}>
          <Text style={styles.parentText}>Parent email: {state.parent.email || 'Not set'}</Text>
          <Text style={styles.parentText}>
            Timeout: {state.parent.timeoutHours ? `${state.parent.timeoutHours} hours` : 'Not set'}
          </Text>
        </View>
      </Card>

      <Card style={styles.mascotCard}>
        <TapTalkMascot variant="business" style={styles.mascot} />
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
    fontSize: 20,
  },
  docRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
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
  profileInput: {
    marginVertical: spacing.md,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    marginTop: spacing.md,
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
  switchThumb: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.surface,
  },
  switchThumbOn: {
    alignSelf: 'flex-end',
  },
  switchTrack: {
    width: 48,
    height: 28,
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: colors.disabled,
    paddingHorizontal: 3,
  },
  switchTrackOn: {
    backgroundColor: colors.success,
  },
});
