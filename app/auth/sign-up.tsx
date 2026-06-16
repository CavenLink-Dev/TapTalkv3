import React, { useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { Href, useRouter } from 'expo-router';
import { Card } from '../../src/components/native/Card';
import { PrimaryButton } from '../../src/components/native/PrimaryButton';
import { Screen } from '../../src/components/native/Screen';
import { TextField } from '../../src/components/native/TextField';
import { useAppContext } from '../../src/hooks/useAppContext';
import { colors, spacing, typography } from '../../src/theme/tokens';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const talkRoute = '/(tabs)/talk' as Href;

export default function SignUpScreen() {
  const router = useRouter();
  const { dispatch } = useAppContext();
  const [legalName, setLegalName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const canContinue =
    legalName.trim().length > 1 &&
    displayName.trim().length > 1 &&
    emailPattern.test(email.trim()) &&
    password.length >= 6;

  const signUp = () => {
    if (!canContinue) return;
    dispatch({
      type: 'SET_USER',
      payload: {
        legalName: legalName.trim(),
        displayName: displayName.trim(),
        name: legalName.trim(),
        nickname: displayName.trim(),
      },
    });
    dispatch({ type: 'SIGN_IN', payload: { email: email.trim(), displayName: displayName.trim() } });
    router.replace(talkRoute);
  };

  return (
    <Screen title="Sign Up" subtitle="Create a local mock account for Expo Go testing.">
      <Card>
        <Text style={styles.label}>Legal name</Text>
        <TextField
          accessibilityLabel="Legal name"
          placeholder="Legal name"
          value={legalName}
          onChangeText={setLegalName}
          style={styles.field}
        />
        <Text style={styles.label}>Display name</Text>
        <TextField
          accessibilityLabel="Display name"
          placeholder="Display name"
          value={displayName}
          onChangeText={setDisplayName}
          style={styles.field}
        />
        <Text style={styles.label}>Email</Text>
        <TextField
          accessibilityLabel="Email"
          placeholder="you@yahoo.com"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
          style={styles.field}
        />
        <Text style={styles.label}>Password</Text>
        <TextField
          accessibilityLabel="Password"
          placeholder="At least 6 characters"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          style={styles.field}
        />
        <PrimaryButton
          accessibilityLabel="Create account"
          label="Create Account"
          disabled={!canContinue}
          onPress={signUp}
          style={styles.button}
        />
        <Pressable
          accessibilityRole="link"
          accessibilityLabel="Go to login"
          onPress={() => router.back()}
          style={styles.linkButton}
        >
          <Text style={styles.link}>Already have an account? Log in</Text>
        </Pressable>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  button: {
    marginTop: spacing.md,
  },
  field: {
    marginBottom: spacing.md,
    marginTop: 6,
  },
  label: {
    color: colors.text,
    fontSize: typography.caption,
    fontWeight: '900',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  link: {
    color: colors.primary,
    fontSize: typography.callout,
    fontWeight: '800',
    textAlign: 'center',
  },
  linkButton: {
    paddingTop: spacing.lg,
  },
});
