import React, { useState } from 'react';
import { Pressable, Text } from 'react-native';
import { Href, useRouter } from 'expo-router';
import { Card } from '../../src/components/native/Card';
import { PrimaryButton } from '../../src/components/native/PrimaryButton';
import { Screen } from '../../src/components/native/Screen';
import { TextField } from '../../src/components/native/TextField';
import { useAppContext } from '../../src/hooks/useAppContext';
import { authFormStyles } from '../../src/styles/authFormStyles';
import { EMAIL_PATTERN } from '../../src/utils/validation';
const signUpRoute = '/auth/sign-up' as Href;
const talkRoute = '/(tabs)/talk' as Href;

export default function LoginScreen() {
  const router = useRouter();
  const { dispatch } = useAppContext();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const canContinue = EMAIL_PATTERN.test(email.trim()) && password.length >= 6;

  const login = () => {
    if (!canContinue) return;
    dispatch({ type: 'SIGN_IN', payload: { email: email.trim() } });
    router.replace(talkRoute);
  };

  return (
    <Screen title="Login" subtitle="Mock sign-in for now. Supabase can replace this later.">
      <Card>
        <Text style={authFormStyles.label}>Email</Text>
        <TextField
          accessibilityLabel="Email"
          placeholder="you@gmail.com"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
          style={authFormStyles.field}
        />
        <Text style={authFormStyles.label}>Password</Text>
        <TextField
          accessibilityLabel="Password"
          placeholder="Password"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          style={authFormStyles.field}
        />
        <PrimaryButton
          accessibilityLabel="Log in"
          label="Log In"
          disabled={!canContinue}
          onPress={login}
          style={authFormStyles.button}
        />
        <Pressable
          accessibilityRole="link"
          accessibilityLabel="Go to sign up"
          onPress={() => router.push(signUpRoute)}
          style={authFormStyles.linkButton}
        >
          <Text style={authFormStyles.link}>Need an account? Sign up</Text>
        </Pressable>
      </Card>
    </Screen>
  );
}
