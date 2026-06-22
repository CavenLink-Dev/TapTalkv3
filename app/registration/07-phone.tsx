import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Href, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card } from '../../src/components/native/Card';
import { PrimaryButton } from '../../src/components/native/PrimaryButton';
import { TextField } from '../../src/components/native/TextField';
import { colors, spacing, typography } from '../../src/theme/tokens';
import { authFormStyles } from '../../src/styles/authFormStyles';

const nextRoute = '/registration/08-password' as Href;

export default function RegStep7Phone() {
  const router = useRouter();
  const [phone, setPhone] = useState('');

  const canContinue = phone.replace(/\D/g, '').length >= 8;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.step}>Step 7 of 10</Text>
        <Text style={styles.title}>Mobile Number</Text>
        <Text style={styles.hint}>Used for 2FA verification.</Text>

        <Card>
          <Text style={authFormStyles.label}>Phone Number</Text>
          <TextField
            accessibilityLabel="Phone number"
            placeholder="+1 000 000 0000"
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
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
  title: { fontSize: typography.heading, fontWeight: '700', color: colors.text, marginBottom: spacing.sm },
  hint: { fontSize: typography.callout, color: colors.textMuted, marginBottom: spacing.xl },
  footer: { padding: spacing.xl },
});
