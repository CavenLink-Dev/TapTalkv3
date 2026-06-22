import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Href, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card } from '../../src/components/native/Card';
import { PrimaryButton } from '../../src/components/native/PrimaryButton';
import { TextField } from '../../src/components/native/TextField';
import { colors, spacing, typography } from '../../src/theme/tokens';
import { authFormStyles } from '../../src/styles/authFormStyles';
import { EMAIL_PATTERN } from '../../src/utils/validation';

// Only shown when "Someone Else" + under 18. Skipped otherwise via DOB logic.
const nextRoute = '/registration/06-email' as Href;

export default function RegStep5Guardian() {
  const router = useRouter();
  const [guardianEmail, setGuardianEmail] = useState('');
  const [sent, setSent] = useState(false);

  const canSend = EMAIL_PATTERN.test(guardianEmail.trim());

  const handleSend = () => {
    if (!canSend) return;
    // TODO: Supabase — send guardian verification email, enforce 5-account limit
    setSent(true);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.step}>Step 5 of 10</Text>
        <Text style={styles.title}>Guardian Verification</Text>
        <Text style={styles.hint}>
          As this person is a minor, a guardian must verify this account. Enter the guardian's email — they must click the link before registration can continue.
        </Text>

        <Card>
          <Text style={authFormStyles.label}>Guardian's Email Address</Text>
          <TextField
            accessibilityLabel="Guardian email"
            placeholder="guardian@example.com"
            autoCapitalize="none"
            keyboardType="email-address"
            value={guardianEmail}
            onChangeText={setGuardianEmail}
            style={authFormStyles.field}
          />
          {sent && (
            <Text style={styles.sent}>✓ Verification link sent. Ask the guardian to check their inbox.</Text>
          )}
        </Card>
      </View>

      <View style={styles.footer}>
        {!sent ? (
          <PrimaryButton accessibilityLabel="Send verification link" label="Send Verification Link" disabled={!canSend} onPress={handleSend} />
        ) : (
          <PrimaryButton accessibilityLabel="Continue" label="Continue" onPress={() => router.push(nextRoute)} />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { flex: 1, paddingHorizontal: spacing.xl, paddingTop: spacing.xxl },
  step: { fontSize: typography.caption, color: colors.textTertiary, marginBottom: spacing.sm },
  title: { fontSize: typography.heading, fontWeight: '700', color: colors.text, marginBottom: spacing.sm },
  hint: { fontSize: typography.callout, color: colors.textMuted, marginBottom: spacing.xl, lineHeight: 22 },
  sent: { fontSize: typography.callout, color: colors.primary, marginTop: spacing.sm },
  footer: { padding: spacing.xl },
});
