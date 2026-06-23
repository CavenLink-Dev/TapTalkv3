import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Href, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { PrimaryButton } from '../../src/components/native/PrimaryButton';
import { TextField } from '../../src/components/native/TextField';
import { RegistrationScaffold } from '../../src/components/registration/RegistrationScaffold';
import { useRegistration } from '../../src/context/RegistrationContext';
import { authFormStyles } from '../../src/styles/authFormStyles';
import { colors, spacing, typography } from '../../src/theme/tokens';

const nextRoute = '/registration/10-consent' as Href;

export default function RegStep9Confirm() {
  const router = useRouter();
  const { data } = useRegistration();
  const [confirm, setConfirm] = useState('');

  const matches = data.password.length > 0 && confirm.length > 0 && data.password === confirm;
  const mismatch = confirm.length > 0 && data.password !== confirm;

  return (
    <RegistrationScaffold
      step={9}
      title="Confirm password"
      subtitle="Re-enter the password you just created to make sure it matches."
      scroll
      footer={
        <PrimaryButton
          accessibilityLabel="Continue"
          label="Continue"
          disabled={!matches}
          onPress={() => router.push(nextRoute)}
        />
      }
    >
      <View>
        <Text style={authFormStyles.label}>Confirm password</Text>
        <TextField
          accessibilityLabel="Confirm password"
          placeholder="Re-enter your password"
          secureTextEntry
          value={confirm}
          onChangeText={setConfirm}
          style={authFormStyles.field}
        />
        {matches ? (
          <View style={styles.statusRow}>
            <Ionicons name="checkmark-circle" size={18} color={colors.success} />
            <Text style={[styles.statusText, { color: colors.success }]}>Passwords match</Text>
          </View>
        ) : null}
        {mismatch ? (
          <View style={styles.statusRow}>
            <Ionicons name="close-circle" size={18} color={colors.danger} />
            <Text style={[styles.statusText, { color: colors.danger }]}>
              Passwords do not match
            </Text>
          </View>
        ) : null}
      </View>
    </RegistrationScaffold>
  );
}

const styles = StyleSheet.create({
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.sm },
  statusText: { fontSize: typography.callout, fontWeight: '600' },
});
