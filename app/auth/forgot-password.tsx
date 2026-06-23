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
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { PrimaryButton } from '../../src/components/native/PrimaryButton';
import { TextField } from '../../src/components/native/TextField';
import { authFormStyles } from '../../src/styles/authFormStyles';
import { EMAIL_PATTERN } from '../../src/utils/validation';
import { colors, spacing, typography } from '../../src/theme/tokens';

export default function ForgotPassword() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  const canSend = EMAIL_PATTERN.test(email.trim());

  const handleSend = () => {
    if (!canSend) return;
    // TODO: Supabase password reset — auth.resetPasswordForEmail(email)
    setSent(true);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go back"
            onPress={() => router.back()}
            hitSlop={10}
            style={styles.backBtn}
          >
            <Ionicons name="chevron-back" size={24} color={colors.text} />
          </Pressable>
        </View>

        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.title}>Reset password</Text>
          <Text style={styles.subtitle}>
            Enter the email on your account and we'll send a link to reset your password.
          </Text>

          {sent ? (
            <View style={styles.confirmBox}>
              <Ionicons name="mail-unread-outline" size={28} color={colors.primary} />
              <Text style={styles.confirmText}>
                If an account exists for {email.trim()}, a reset link is on its way. Check your inbox.
              </Text>
            </View>
          ) : (
            <View style={styles.form}>
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
          )}
        </ScrollView>

        <View style={styles.footer}>
          {sent ? (
            <PrimaryButton
              accessibilityLabel="Back to login"
              label="Back to login"
              onPress={() => router.back()}
            />
          ) : (
            <PrimaryButton
              accessibilityLabel="Send reset link"
              label="Send reset link"
              disabled={!canSend}
              onPress={handleSend}
            />
          )}
        </View>
      </KeyboardAvoidingView>
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
  backBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  content: { paddingHorizontal: spacing.xl, paddingTop: spacing.lg },
  title: { fontSize: 30, fontWeight: '800', color: colors.text, letterSpacing: -0.5 },
  subtitle: {
    marginTop: spacing.sm,
    fontSize: typography.body,
    color: colors.textMuted,
    lineHeight: 24,
  },
  form: { marginTop: spacing.xxl },
  confirmBox: {
    marginTop: spacing.xxl,
    padding: spacing.lg,
    borderRadius: 16,
    backgroundColor: '#EAF5FE',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  confirmText: { flex: 1, fontSize: typography.callout, color: colors.text, lineHeight: 21 },
  footer: { paddingHorizontal: spacing.xl, paddingBottom: spacing.lg },
});
