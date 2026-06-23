import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Href, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { PrimaryButton } from '../../src/components/native/PrimaryButton';
import { TextField } from '../../src/components/native/TextField';
import { DevSkip } from '../../src/components/DevSkip';
import { useAppContext } from '../../src/hooks/useAppContext';
import { authFormStyles } from '../../src/styles/authFormStyles';
import { EMAIL_PATTERN } from '../../src/utils/validation';
import { colors, spacing, typography } from '../../src/theme/tokens';

const signUpRoute = '/registration/01-who' as Href;
const forgotRoute = '/auth/forgot-password' as Href;
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
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          {router.canGoBack() ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Go back"
              onPress={() => router.back()}
              hitSlop={10}
              style={styles.backBtn}
            >
              <Ionicons name="chevron-back" size={24} color={colors.text} />
            </Pressable>
          ) : null}
        </View>

        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.title}>Welcome back</Text>
          <Text style={styles.subtitle}>Sign in to continue communicating.</Text>

          <View style={styles.form}>
            <View>
              <Text style={authFormStyles.label}>Email</Text>
              <TextField
                accessibilityLabel="Email"
                placeholder="you@example.com"
                autoCapitalize="none"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
                style={authFormStyles.field}
              />
            </View>
            <View>
              <Text style={authFormStyles.label}>Password</Text>
              <TextField
                accessibilityLabel="Password"
                placeholder="Your password"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
                style={authFormStyles.field}
              />
            </View>

            <Pressable
              accessibilityRole="link"
              accessibilityLabel="Forgot password"
              onPress={() => router.push(forgotRoute)}
              style={styles.forgot}
            >
              <Text style={styles.link}>Forgot password?</Text>
            </Pressable>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <PrimaryButton
            accessibilityLabel="Log in"
            label="Log in"
            disabled={!canContinue}
            onPress={login}
          />
          <Pressable
            accessibilityRole="link"
            accessibilityLabel="Create a new account"
            onPress={() => router.push(signUpRoute)}
            style={styles.createRow}
          >
            <Text style={styles.createText}>
              New to TapTalk? <Text style={styles.link}>Create an account</Text>
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
      <DevSkip next="/(tabs)/talk" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    minHeight: 40,
  },
  backBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
  },
  title: { fontSize: 30, fontWeight: '800', color: colors.text, letterSpacing: -0.5 },
  subtitle: { marginTop: spacing.sm, fontSize: typography.body, color: colors.textMuted },
  form: { marginTop: spacing.xxl, gap: spacing.lg },
  forgot: { alignSelf: 'flex-start', paddingVertical: spacing.xs },
  link: { color: colors.primary, fontSize: typography.callout, fontWeight: '700' },
  footer: { paddingHorizontal: spacing.xl, paddingBottom: spacing.lg, gap: spacing.lg },
  createRow: { alignItems: 'center' },
  createText: { fontSize: typography.callout, color: colors.textMuted },
});
