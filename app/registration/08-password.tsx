import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Href, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card } from '../../src/components/native/Card';
import { PrimaryButton } from '../../src/components/native/PrimaryButton';
import { TextField } from '../../src/components/native/TextField';
import { colors, spacing, typography } from '../../src/theme/tokens';
import { authFormStyles } from '../../src/styles/authFormStyles';

const nextRoute = '/registration/09-confirm' as Href;

const hasNumber = (s: string) => /\d/.test(s);
const hasSpecial = (s: string) => /[^a-zA-Z0-9]/.test(s);
const inLength = (s: string) => s.length >= 8 && s.length <= 16;

export default function RegStep8Password() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);

  const lengthOk = inLength(password);
  const numberOk = hasNumber(password);
  const specialOk = hasSpecial(password);
  const canContinue = lengthOk && numberOk && specialOk;

  const strength = [lengthOk, numberOk, specialOk].filter(Boolean).length;
  const strengthLabels = ['', 'Weak', 'Fair', 'Strong'];
  const strengthColors = ['', colors.danger, colors.warning, colors.primary];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.step}>Step 8 of 10</Text>
        <Text style={styles.title}>Create a Password</Text>

        <Card>
          <Text style={authFormStyles.label}>Password</Text>
          <TextField
            accessibilityLabel="Password"
            placeholder="8–16 characters"
            secureTextEntry={!show}
            value={password}
            onChangeText={setPassword}
            style={authFormStyles.field}
          />
          {password.length > 0 && (
            <View style={styles.hints}>
              {!lengthOk && <Text style={styles.hint}>✗ Must be 8–16 characters</Text>}
              {!numberOk && <Text style={styles.hint}>✗ Must contain at least one number</Text>}
              {!specialOk && <Text style={styles.hint}>✗ Must contain at least one special character</Text>}
              {strength > 0 && (
                <Text style={[styles.strength, { color: strengthColors[strength] }]}>
                  Strength: {strengthLabels[strength]}
                </Text>
              )}
            </View>
          )}
        </Card>
      </View>

      <View style={styles.footer}>
        <PrimaryButton accessibilityLabel="Continue" label="Continue" disabled={!canContinue} onPress={() => router.push(nextRoute)} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { flex: 1, paddingHorizontal: spacing.xl, paddingTop: spacing.xxl },
  step: { fontSize: typography.caption, color: colors.textTertiary, marginBottom: spacing.sm },
  title: { fontSize: typography.heading, fontWeight: '700', color: colors.text, marginBottom: spacing.xl },
  hints: { marginTop: spacing.sm, gap: spacing.xs },
  hint: { fontSize: typography.caption, color: colors.danger },
  strength: { fontSize: typography.caption, fontWeight: '700', marginTop: spacing.xs },
  footer: { padding: spacing.xl },
});
