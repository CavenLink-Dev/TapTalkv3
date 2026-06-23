import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Href, useRouter } from 'expo-router';
import { PrimaryButton } from '../../src/components/native/PrimaryButton';
import { RegistrationScaffold } from '../../src/components/registration/RegistrationScaffold';
import { SelectableCard } from '../../src/components/registration/SelectableCard';
import { useRegistration } from '../../src/context/RegistrationContext';
import { spacing } from '../../src/theme/tokens';

const nextRoute = '/registration/02-name' as Href;

export default function RegStep1Who() {
  const router = useRouter();
  const { data, update } = useRegistration();

  return (
    <RegistrationScaffold
      step={1}
      title="Who are you setting up?"
      subtitle="This tailors the account and the verification we ask for."
      footer={
        <PrimaryButton
          accessibilityLabel="Continue to next step"
          label="Continue"
          disabled={data.role === null}
          onPress={() => router.push(nextRoute)}
        />
      }
    >
      <View style={styles.choices}>
        <SelectableCard
          label="Myself"
          description="I'll be using TapTalk to communicate."
          selected={data.role === 'myself'}
          onPress={() => update({ role: 'myself' })}
        />
        <SelectableCard
          label="Someone else"
          description="I'm setting this up for a person I support."
          selected={data.role === 'someone_else'}
          onPress={() => update({ role: 'someone_else' })}
        />
      </View>
    </RegistrationScaffold>
  );
}

const styles = StyleSheet.create({
  choices: { gap: spacing.md },
});
