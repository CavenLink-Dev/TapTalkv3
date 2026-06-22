import React, { useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { Card } from '../../src/components/native/Card';
import { PrimaryButton } from '../../src/components/native/PrimaryButton';
import { Screen } from '../../src/components/native/Screen';
import { TextField } from '../../src/components/native/TextField';
import { authFormStyles } from '../../src/styles/authFormStyles';
import { EMAIL_PATTERN } from '../../src/utils/validation';
import { colors, typography } from '../../src/theme/tokens';

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
    <Screen title="Forgot Password" subtitle="Enter your email and we'll send you a reset link.">
      <Card>
        {sent ? (
          <Text style={styles.confirmation}>
            ✓ Reset link sent to {email}. Check your inbox.
          </Text>
        ) : (
          <>
            <Text style={authFormStyles.label}>Email Address</Text>
            <TextField
              accessibilityLabel="Email"
              placeholder="you@gmail.com"
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
              style={authFormStyles.field}
            />
            <PrimaryButton
              accessibilityLabel="Send reset link"
              label="Send Reset Link"
              disabled={!canSend}
              onPress={handleSend}
              style={authFormStyles.button}
            />
          </>
        )}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  confirmation: {
    fontSize: typography.body,
    color: colors.text,
    textAlign: 'center',
    paddingVertical: 16,
  },
});
