import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Href, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card } from '../../src/components/native/Card';
import { PrimaryButton } from '../../src/components/native/PrimaryButton';
import { TextField } from '../../src/components/native/TextField';
import { colors, spacing, typography } from '../../src/theme/tokens';
import { authFormStyles } from '../../src/styles/authFormStyles';

const nextRoute = '/registration/10-consent' as Href;

export default function RegStep9Confirm() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');

  // TODO: receive real password from registration context
  const matches = confirm.length > 0 && password === confirm;
  const mismatch = confirm.length > 0 && password !== confirm;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.step}>Step 9 of 10</Text>
        <Text style={styles.title}>Confirm Password</Text>

        <Card>
          <Text style={authFormStyles.label}>Re-enter Password</Text>
          <TextField
            accessibilityLabel="Confirm password"
            placeholder="Re-enter your password"
            secureTextEntry
            value={confirm}
            onChangeText={setConfirm}
            style={authFormStyles.field}
          />
          {matches && <Text style={styles.match}>✓ Passwords match</Text>}
          {mismatch && <Text style={styles.mismatch}>✗ Passwords do not match</Text>}
        </Card>
      </View>

      <View style={styles.footer}>
        <PrimaryButton accessibilityLabel="Continue" label="Continue" disabled={!matches} onPress={() => router.push(nextRoute)} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { flex: 1, paddingHorizontal: spacing.xl, paddingTop: spacing.xxl },
  step: { fontSize: typography.caption, color: colors.textTertiary, marginBottom: spacing.sm },
  title: { fontSize: typography.heading, fontWeight: '700', color: colors.text, marginBottom: spacing.xl },
  match: { fontSize: typography.caption, color: colors.primary, marginTop: spacing.xs },
  mismatch: { fontSize: typography.caption, color: colors.danger, marginTop: spacing.xs },
  footer: { padding: spacing.xl },
});
