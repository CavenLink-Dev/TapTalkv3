import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Href, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { PrimaryButton } from '../../src/components/native/PrimaryButton';
import { TextField } from '../../src/components/native/TextField';
import { RegistrationScaffold } from '../../src/components/registration/RegistrationScaffold';
import { useRegistration } from '../../src/context/RegistrationContext';
import { authFormStyles } from '../../src/styles/authFormStyles';
import { EMAIL_PATTERN } from '../../src/utils/validation';
import { colors, spacing, typography } from '../../src/theme/tokens';

const nextRoute = '/registration/06-email' as Href;

export default function RegStep5Guardian() {
  const router = useRouter();
  const { data, update } = useRegistration();
  const [sent, setSent] = useState(false);

  const canSend = EMAIL_PATTERN.test(data.guardianEmail.trim());

  const handleSend = () => {
    if (!canSend) return;
    // TODO: Supabase — send guardian verification email, enforce 5-account limit
    setSent(true);
  };

  return (
    <RegistrationScaffold
      step={5}
      title="Guardian verification"
      subtitle="A nominated guardian must confirm this account by email before it can be finalised."
      scroll
      footer={
        !sent ? (
          <PrimaryButton
            accessibilityLabel="Send verification link"
            label="Send verification link"
            disabled={!canSend}
            onPress={handleSend}
          />
        ) : (
          <PrimaryButton
            accessibilityLabel="Continue"
            label="Continue"
            onPress={() => router.push(nextRoute)}
          />
        )
      }
    >
      <View>
        <Text style={authFormStyles.label}>Guardian's email address</Text>
        <TextField
          accessibilityLabel="Guardian email"
          placeholder="guardian@example.com"
          autoCapitalize="none"
          keyboardType="email-address"
          value={data.guardianEmail}
          onChangeText={(t) => update({ guardianEmail: t })}
          style={authFormStyles.field}
        />
        {sent ? (
          <View style={styles.sentRow}>
            <Ionicons name="checkmark-circle" size={18} color={colors.success} />
            <Text style={styles.sentText}>
              Verification link sent. Ask the guardian to confirm from their inbox.
            </Text>
          </View>
        ) : null}
      </View>
    </RegistrationScaffold>
  );
}

const styles = StyleSheet.create({
  sentRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.sm },
  sentText: { flex: 1, fontSize: typography.callout, color: colors.textMuted, lineHeight: 20 },
});
