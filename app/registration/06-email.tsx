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

const nextRoute = '/registration/07-phone' as Href;

export default function RegStep6Email() {
  const router = useRouter();
  const [email, setEmail] = useState('');

  const canContinue = EMAIL_PATTERN.test(email.trim());

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.step}>Step 6 of 10</Text>
        <Text style={styles.title}>Email Address</Text>

        <Card>
          <Text style={authFormStyles.label}>Email</Text>
          <TextField
            accessibilityLabel="Email address"
            placeholder="you@example.com"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
            style={authFormStyles.field}
          />
        </Card>
      </View>

      <View style={styles.footer}>
        <PrimaryButton accessibilityLabel="Continue" label="Continue" disabled={!canContinue} onPress={() => router.push(nextRoute)} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { flex: 1, paddingHorizontal: spacing.xl, paddingTop: spacing.xxl },
  step: { fontSize: typography.caption, color: colors.textTertiary, marginBottom: spacing.sm },
  title: { fontSize: typography.heading, fontWeight: '700', color: colors.text, marginBottom: spacing.xl },
  footer: { padding: spacing.xl },
});
