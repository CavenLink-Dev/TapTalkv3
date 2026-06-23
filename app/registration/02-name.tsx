import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Href, useRouter } from 'expo-router';
import { PrimaryButton } from '../../src/components/native/PrimaryButton';
import { TextField } from '../../src/components/native/TextField';
import { RegistrationScaffold } from '../../src/components/registration/RegistrationScaffold';
import { useRegistration } from '../../src/context/RegistrationContext';
import { authFormStyles } from '../../src/styles/authFormStyles';
import { spacing } from '../../src/theme/tokens';

const nextRoute = '/registration/03-username' as Href;

export default function RegStep2Name() {
  const router = useRouter();
  const { data, update } = useRegistration();

  const canContinue = data.firstName.trim().length > 0 && data.lastName.trim().length > 0;

  return (
    <RegistrationScaffold
      step={2}
      title="Legal name"
      subtitle="Use the full name exactly as it appears on official documents."
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
      <View style={styles.fields}>
        <View>
          <Text style={authFormStyles.label}>First name</Text>
          <TextField
            accessibilityLabel="First name"
            placeholder="First"
            value={data.firstName}
            onChangeText={(t) => update({ firstName: t })}
            style={authFormStyles.field}
          />
        </View>
        <View>
          <Text style={authFormStyles.label}>Middle name (optional)</Text>
          <TextField
            accessibilityLabel="Middle name"
            placeholder="Middle"
            value={data.middleName}
            onChangeText={(t) => update({ middleName: t })}
            style={authFormStyles.field}
          />
        </View>
        <View>
          <Text style={authFormStyles.label}>Last name</Text>
          <TextField
            accessibilityLabel="Last name"
            placeholder="Last"
            value={data.lastName}
            onChangeText={(t) => update({ lastName: t })}
            style={authFormStyles.field}
          />
        </View>
      </View>
    </RegistrationScaffold>
  );
}

const styles = StyleSheet.create({
  fields: { gap: spacing.lg },
});
