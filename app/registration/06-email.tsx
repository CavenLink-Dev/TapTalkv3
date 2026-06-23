import React from 'react';
import { Text, View } from 'react-native';
import { Href, useRouter } from 'expo-router';
import { PrimaryButton } from '../../src/components/native/PrimaryButton';
import { TextField } from '../../src/components/native/TextField';
import { RegistrationScaffold } from '../../src/components/registration/RegistrationScaffold';
import { useRegistration } from '../../src/context/RegistrationContext';
import { authFormStyles } from '../../src/styles/authFormStyles';
import { EMAIL_PATTERN } from '../../src/utils/validation';

const nextRoute = '/registration/07-phone' as Href;

export default function RegStep6Email() {
  const router = useRouter();
  const { data, update } = useRegistration();

  const canContinue = EMAIL_PATTERN.test(data.email.trim());

  return (
    <RegistrationScaffold
      step={6}
      title="Email address"
      subtitle="We'll use this to sign you in and send important account notices."
      scroll
      footer={
        <PrimaryButton
          accessibilityLabel="Continue"
          label="Continue"
          disabled={!canContinue}
          onPress={() => router.push(nextRoute)}
        />
      }
    >
      <View>
        <Text style={authFormStyles.label}>Email</Text>
        <TextField
          accessibilityLabel="Email address"
          placeholder="you@example.com"
          autoCapitalize="none"
          keyboardType="email-address"
          value={data.email}
          onChangeText={(t) => update({ email: t })}
          style={authFormStyles.field}
        />
      </View>
    </RegistrationScaffold>
  );
}
