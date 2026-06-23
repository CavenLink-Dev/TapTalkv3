import React from 'react';
import { Text, View } from 'react-native';
import { Href, useRouter } from 'expo-router';
import { PrimaryButton } from '../../src/components/native/PrimaryButton';
import { TextField } from '../../src/components/native/TextField';
import { RegistrationScaffold } from '../../src/components/registration/RegistrationScaffold';
import { useRegistration } from '../../src/context/RegistrationContext';
import { authFormStyles } from '../../src/styles/authFormStyles';

const nextRoute = '/registration/08-password' as Href;

export default function RegStep7Phone() {
  const router = useRouter();
  const { data, update } = useRegistration();

  const canContinue = data.phone.replace(/\D/g, '').length >= 8;

  return (
    <RegistrationScaffold
      step={7}
      title="Mobile number"
      subtitle="Used for two-factor verification to keep the account secure."
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
        <Text style={authFormStyles.label}>Phone number</Text>
        <TextField
          accessibilityLabel="Phone number"
          placeholder="+61 400 000 000"
          keyboardType="phone-pad"
          value={data.phone}
          onChangeText={(t) => update({ phone: t })}
          style={authFormStyles.field}
        />
      </View>
    </RegistrationScaffold>
  );
}
