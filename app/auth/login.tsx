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
import { CheckRow } from '../../src/components/native/CheckRow';
import { SignInWithAppleButton } from '../../src/components/native/SignInWithAppleButton';
import { DevSkip } from '../../src/components/DevSkip';
import { useAppContext } from '../../src/hooks/useAppContext';
import { authFormStyles } from '../../src/styles/authFormStyles';
import { EMAIL_PATTERN } from '../../src/utils/validation';
import { colors, spacing, typography } from '../../src/theme/tokens';
import { fonts } from '../../src/theme/fonts';

const signUpRoute = '/registration/01-who' as Href;
const forgotRoute = '/auth/forgot-password' as Href;
const talkRoute = '/(tabs)/talk' as Href;

export default function LoginScreen() {
  const router = useRouter();
  const { state, dispatch } = useAppContext();
  const [email, setEmail] = useState(state.user.email);
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(state.rememberLogin);
  const [submitting, setSubmitting] = useState(false);

  const canContinue = EMAIL_PATTERN.test(email.trim()) && password.length >= 6;

  const finish = (signInEmail: string, displayName?: string) => {
    dispatch({
      type: 'SIGN_IN',
      payload: { email: signInEmail.trim(), displayName, rememberLogin: remember },
    });
    router.replace(talkRoute);
  };

  const login = () => {
    if (!canContinue || submitting) return;
    setSubmitting(true);
    // TODO: replace with real auth (Supabase / Apple). For now we simulate a
    // brief network hop so the loading state is visible in QA.
    setTimeout(() => {
      setSubmitting(false);
      finish(email);
    }, 600);
  };

  // Stubbed Apple flow — see SignInWithAppleButton for the production note.
  const signInWithApple = () => {
    if (submitting) return;
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      finish('apple-user@privaterelay.appleid.com', 'Apple User');
    }, 600);
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
          <Text style={styles.title} accessibilityRole="header">
            Welcome back
          </Text>
          <Text style={styles.subtitle}>Sign in to continue communicating.</Text>

          <View style={styles.form}>
            <View>
              <Text style={authFormStyles.label}>Email</Text>
              <TextField
                accessibilityLabel="Email"
                placeholder="you@example.com"
                autoCapitalize="none"
                autoComplete="email"
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
                autoComplete="password"
                value={password}
                onChangeText={setPassword}
                style={authFormStyles.field}
              />
            </View>

            <View style={styles.rememberRow}>
              <CheckRow
                label="Keep me signed in"
                value={remember}
                onChange={setRemember}
                accessibilityLabel="Keep me signed in on this device"
              />
              <Pressable
                accessibilityRole="link"
                accessibilityLabel="Forgot password"
                onPress={() => router.push(forgotRoute)}
                hitSlop={8}
              >
                <Text style={styles.link}>Forgot?</Text>
              </Pressable>
            </View>
            <Text style={styles.rememberHelp}>
              Keeps you signed in on this device until you sign out. Turn off
              for a shared device.
            </Text>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <PrimaryButton
            accessibilityLabel="Log in"
            label="Log in"
            disabled={!canContinue}
            loading={submitting}
            onPress={login}
          />

          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          <SignInWithAppleButton onPress={signInWithApple} loading={submitting} />

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
  title: {
    fontFamily: fonts.displayHeavy,
    fontSize: typography.title,
    color: colors.text,
    letterSpacing: typography.trackTitle,
  },
  subtitle: {
    marginTop: spacing.sm,
    fontFamily: fonts.body,
    fontSize: typography.body,
    color: colors.textMuted,
  },
  form: { marginTop: spacing.xxl, gap: spacing.lg },
  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  rememberHelp: {
    marginTop: -spacing.sm + 2,
    fontFamily: fonts.body,
    fontSize: typography.caption,
    color: colors.textTertiary,
    lineHeight: 18,
  },
  link: {
    fontFamily: fonts.displayBold,
    color: colors.primary,
    fontSize: typography.callout,
  },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
    gap: spacing.md,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginVertical: spacing.xs,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.border, opacity: 0.5 },
  dividerText: {
    fontFamily: fonts.body,
    fontSize: typography.caption,
    color: colors.textTertiary,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  createRow: { alignItems: 'center', marginTop: spacing.xs },
  createText: { fontFamily: fonts.body, fontSize: typography.callout, color: colors.textMuted },
});
