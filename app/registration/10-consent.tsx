import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Href, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PrimaryButton } from '../../src/components/native/PrimaryButton';
import { useAppContext } from '../../src/hooks/useAppContext';
import { colors, radii, spacing, typography } from '../../src/theme/tokens';

const tourRoute = '/onboarding/tour' as Href;

const CONSENTS = [
  { id: 'terms', label: 'I agree to the Terms & Conditions' },
  { id: 'privacy', label: 'I agree to the Privacy Policy' },
  { id: 'data', label: 'I consent to my data being stored securely' },
] as const;

export default function RegStep10Consent() {
  const router = useRouter();
  const { dispatch } = useAppContext();
  const [checked, setChecked] = useState<Record<string, boolean>>({});

  const allChecked = CONSENTS.every(c => checked[c.id]);

  const toggle = (id: string) => setChecked((prev: Record<string, boolean>) => ({ ...prev, [id]: !prev[id] }));

  const createAccount = () => {
    if (!allChecked) return;
    dispatch({ type: 'COMPLETE_ONBOARDING' });
    dispatch({ type: 'SIGN_IN', payload: { email: 'new-user@taptalk.local', displayName: 'TapTalk User' } });
    router.replace(tourRoute);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.step}>Step 10 of 10</Text>
        <Text style={styles.title}>Legal & Consent</Text>
        <Text style={styles.hint}>All three must be ticked to create your account.</Text>

        <View style={styles.checkboxes}>
          {CONSENTS.map(c => (
            <Pressable key={c.id} onPress={() => toggle(c.id)} style={styles.row} accessibilityRole="checkbox" accessibilityState={{ checked: !!checked[c.id] }}>
              <View style={[styles.box, checked[c.id] && styles.boxChecked]}>
                {checked[c.id] && <Text style={styles.tick}>✓</Text>}
              </View>
              <Text style={styles.label}>{c.label}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.footer}>
        <PrimaryButton
          accessibilityLabel="Create Account"
          label="Create Account"
          disabled={!allChecked}
          onPress={createAccount}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { flex: 1, paddingHorizontal: spacing.xl, paddingTop: spacing.xxl },
  step: { fontSize: typography.caption, color: colors.textTertiary, marginBottom: spacing.sm },
  title: { fontSize: typography.heading, fontWeight: '700', color: colors.text, marginBottom: spacing.sm },
  hint: { fontSize: typography.callout, color: colors.textMuted, marginBottom: spacing.xl },
  checkboxes: { gap: spacing.lg },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  box: {
    width: 26, height: 26, borderRadius: radii.button / 2,
    borderWidth: 2, borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center', justifyContent: 'center',
  },
  boxChecked: { backgroundColor: colors.primary, borderColor: colors.primary },
  tick: { color: colors.textOnDark, fontSize: 14, fontWeight: '700' },
  label: { flex: 1, fontSize: typography.callout, color: colors.text },
  footer: { padding: spacing.xl },
});
