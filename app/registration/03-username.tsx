import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Href, useRouter } from 'expo-router';
import { PrimaryButton } from '../../src/components/native/PrimaryButton';
import { TextField } from '../../src/components/native/TextField';
import { RegistrationScaffold } from '../../src/components/registration/RegistrationScaffold';
import { useRegistration } from '../../src/context/RegistrationContext';
import { authFormStyles } from '../../src/styles/authFormStyles';
import { colors, spacing, typography } from '../../src/theme/tokens';

const nextRoute = '/registration/04-dob' as Href;

export default function RegStep3Username() {
  const router = useRouter();
  const { data, update } = useRegistration();
  const username = data.username;

  const isValid =
    username.length === 0 ||
    (username.length >= 8 && username.length <= 12 && /^[a-zA-Z0-9]+$/.test(username));

  return (
    <RegistrationScaffold
      step={3}
      title="Choose a username"
      subtitle="Optional. 8–12 characters, letters and numbers only."
      scroll
      footer={
        <>
          <PrimaryButton
            accessibilityLabel="Continue"
            label="Continue"
            disabled={username.length > 0 && !isValid}
            onPress={() => router.push(nextRoute)}
          />
          <PrimaryButton
            accessibilityLabel="Skip this step"
            label="Skip for now"
            variant="secondary"
            onPress={() => router.push(nextRoute)}
          />
        </>
      }
    >
      <View>
        <Text style={authFormStyles.label}>Username</Text>
        <TextField
          accessibilityLabel="Username"
          placeholder="e.g. alexmorgan"
          value={username}
          onChangeText={(t) => update({ username: t })}
          autoCapitalize="none"
          autoCorrect={false}
          maxLength={12}
          style={authFormStyles.field}
        />
        {username.length > 0 && !isValid ? (
          <Text style={styles.error}>Use 8–12 letters and numbers, with no spaces or symbols.</Text>
        ) : null}
      </View>
    </RegistrationScaffold>
  );
}

const styles = StyleSheet.create({
  error: { fontSize: typography.caption, color: colors.danger, marginTop: spacing.xs },
});
