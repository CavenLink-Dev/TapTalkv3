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
const signUpRoute = '/auth/sign-up' as Href;
const talkRoute = '/(tabs)/talk' as Href;

export default function LoginScreen() {
  const router = useRouter();
  const { dispatch } = useAppContext();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const canContinue = emailPattern.test(email.trim()) && password.length >= 6;

  const login = () => {
    if (!canContinue) return;
    dispatch({ type: 'SIGN_IN', payload: { email: email.trim() } });
    router.replace(talkRoute);
  };

  return (
    <Screen title="Login" subtitle="Mock sign-in for now. Supabase can replace this later.">
      <Card>
        <Text style={styles.label}>Email</Text>
        <TextField
          accessibilityLabel="Email"
          placeholder="you@gmail.com"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
          style={styles.field}
        />
        <Text style={styles.label}>Password</Text>
        <TextField
          accessibilityLabel="Password"
          placeholder="Password"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          style={styles.field}
        />
        <PrimaryButton
          accessibilityLabel="Log in"
          label="Log In"
          disabled={!canContinue}
          onPress={login}
          style={styles.button}
        />
        <Pressable
          accessibilityRole="link"
          accessibilityLabel="Go to sign up"
          onPress={() => router.push(signUpRoute)}
          style={styles.linkButton}
        >
          <Text style={styles.link}>Need an account? Sign up</Text>
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
