import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Href, useRouter } from 'expo-router';
import { PrimaryButton } from '../../src/components/native/PrimaryButton';
import { TextField } from '../../src/components/native/TextField';
import { RegistrationScaffold } from '../../src/components/registration/RegistrationScaffold';
import { useRegistration } from '../../src/context/RegistrationContext';
import { authFormStyles } from '../../src/styles/authFormStyles';
import { spacing } from '../../src/theme/tokens';

const nextRoute = '/registration/05-guardian' as Href;

export default function RegStep4DOB() {
  const router = useRouter();
  const { data, update } = useRegistration();

  const canContinue =
    data.dobDay.length > 0 && data.dobMonth.length > 0 && data.dobYear.length === 4;

  return (
    <RegistrationScaffold
      step={4}
      title="Date of birth"
      subtitle="We use this to confirm eligibility and apply the right safeguards."
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
      <Text style={authFormStyles.label}>Date of birth</Text>
      <View style={styles.row}>
        <TextField
          accessibilityLabel="Day"
          placeholder="DD"
          value={data.dobDay}
          onChangeText={(t) => update({ dobDay: t })}
          keyboardType="number-pad"
          maxLength={2}
          style={[authFormStyles.field, styles.field]}
        />
        <TextField
          accessibilityLabel="Month"
          placeholder="MM"
          value={data.dobMonth}
          onChangeText={(t) => update({ dobMonth: t })}
          keyboardType="number-pad"
          maxLength={2}
          style={[authFormStyles.field, styles.field]}
        />
        <TextField
          accessibilityLabel="Year"
          placeholder="YYYY"
          value={data.dobYear}
          onChangeText={(t) => update({ dobYear: t })}
          keyboardType="number-pad"
          maxLength={4}
          style={[authFormStyles.field, styles.field, styles.year]}
        />
      </View>
    </RegistrationScaffold>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.md, marginTop: 6 },
  field: { flex: 1, marginTop: 0 },
  year: { flex: 2 },
});
