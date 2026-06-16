import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Href, useRouter } from 'expo-router';
import { Card } from '../src/components/native/Card';
import { PrimaryButton } from '../src/components/native/PrimaryButton';
import { Screen } from '../src/components/native/Screen';
import { useAppContext } from '../src/hooks/useAppContext';
import { colors, radii, spacing, typography } from '../src/theme/tokens';

const tiers = [
  { id: 'starter', name: 'Starter', price: '$0', detail: 'Try TapTalk on this device.' },
  { id: 'family', name: 'Family', price: '$8', detail: 'Simple tools for home and school.' },
  { id: 'clinic', name: 'Clinic', price: '$18', detail: 'For support teams and therapists.' },
] as const;
const loginRoute = '/auth/login' as Href;

export default function PayScreen() {
  const router = useRouter();
  const { dispatch } = useAppContext();
  const [selected, setSelected] = useState<(typeof tiers)[number]['id']>('starter');

  const continueToLogin = () => {
    dispatch({ type: 'COMPLETE_SUBSCRIPTION' });
    router.replace(loginRoute);
  };

  return (
    <Screen title="Choose TapTalk" subtitle="Mock subscription screen for now. No payment is taken.">
      {tiers.map((tier) => {
        const isSelected = tier.id === selected;
        return (
          <Pressable
            key={tier.id}
            accessibilityRole="button"
            accessibilityLabel={`Select ${tier.name} plan`}
            accessibilityState={{ selected: isSelected }}
            onPress={() => setSelected(tier.id)}
          >
            <Card style={[styles.tierCard, isSelected && styles.tierSelected]}>
              <View>
                <Text style={styles.tierName}>{tier.name}</Text>
                <Text style={styles.tierDetail}>{tier.detail}</Text>
              </View>
              <Text style={styles.price}>{tier.price}</Text>
            </Card>
          </Pressable>
        );
      })}
      <PrimaryButton
        accessibilityLabel="Continue to login"
        label="Continue"
        onPress={continueToLogin}
        style={styles.cta}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  cta: {
    marginTop: spacing.lg,
  },
  price: {
    color: colors.primary,
    fontSize: typography.heading,
    fontWeight: '900',
  },
  tierCard: {
    minHeight: 92,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  tierDetail: {
    marginTop: 4,
    color: colors.textMuted,
    fontSize: typography.callout,
  },
  tierName: {
    color: colors.text,
    fontSize: typography.subheading,
    fontWeight: '900',
  },
  tierSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.softBlue,
    borderRadius: radii.card,
  },
});
