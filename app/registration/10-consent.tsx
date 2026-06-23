import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Href, useRouter } from 'expo-router';
import { PrimaryButton } from '../../src/components/native/PrimaryButton';
import { RegistrationScaffold } from '../../src/components/registration/RegistrationScaffold';
import { SelectableCard } from '../../src/components/registration/SelectableCard';
import { useRegistration, toUserPayload } from '../../src/context/RegistrationContext';
import { useAppContext } from '../../src/hooks/useAppContext';
import { spacing } from '../../src/theme/tokens';

const tourRoute = '/onboarding/tour' as Href;

const CONSENTS = [
  { id: 'terms', label: 'I agree to the Terms & Conditions' },
  { id: 'privacy', label: 'I agree to the Privacy Policy' },
  { id: 'data', label: 'I consent to my data being stored securely' },
] as const;

export default function RegStep10Consent() {
  const router = useRouter();
  const { data, update } = useRegistration();
  const { dispatch } = useAppContext();

  const allChecked = CONSENTS.every((c) => data.consents[c.id]);

  const toggle = (id: string) =>
    update({ consents: { ...data.consents, [id]: !data.consents[id] } });

  const createAccount = () => {
    if (!allChecked) return;
    dispatch({ type: 'SET_USER', payload: toUserPayload(data) });
    dispatch({ type: 'COMPLETE_ONBOARDING' });
    dispatch({
      type: 'SIGN_IN',
      payload: { email: data.email.trim(), displayName: toUserPayload(data).displayName },
    });
    router.replace(tourRoute);
  };

  return (
    <RegistrationScaffold
      step={10}
      title="Review & consent"
      subtitle="Confirm the agreements below to finish creating your account."
      scroll
      footer={
        <PrimaryButton
          accessibilityLabel="Create account"
          label="Create account"
          disabled={!allChecked}
          onPress={createAccount}
        />
      }
    >
      <View style={styles.list}>
        {CONSENTS.map((c) => (
          <SelectableCard
            key={c.id}
            label={c.label}
            selected={!!data.consents[c.id]}
            onPress={() => toggle(c.id)}
          />
        ))}
      </View>
    </RegistrationScaffold>
  );
}

const styles = StyleSheet.create({
  list: { gap: spacing.md },
});
