import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Href, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { PrimaryButton } from '../../src/components/native/PrimaryButton';
import { TextField } from '../../src/components/native/TextField';
import { RegistrationScaffold } from '../../src/components/registration/RegistrationScaffold';
import { useRegistration } from '../../src/context/RegistrationContext';
import { authFormStyles } from '../../src/styles/authFormStyles';
import { colors, spacing, typography } from '../../src/theme/tokens';

const nextRoute = '/registration/09-confirm' as Href;

const hasNumber = (s: string) => /\d/.test(s);
const hasSpecial = (s: string) => /[^a-zA-Z0-9]/.test(s);
const inLength = (s: string) => s.length >= 8 && s.length <= 16;

function Requirement({ met, label }: { met: boolean; label: string }) {
  return (
    <View style={styles.reqRow}>
      <Ionicons
        name={met ? 'checkmark-circle' : 'ellipse-outline'}
        size={18}
        color={met ? colors.success : colors.textTertiary}
      />
      <Text style={[styles.reqText, met && styles.reqTextMet]}>{label}</Text>
    </View>
  );
}

export default function RegStep8Password() {
  const router = useRouter();
  const { data, update } = useRegistration();
  const password = data.password;

  const lengthOk = inLength(password);
  const numberOk = hasNumber(password);
  const specialOk = hasSpecial(password);
  const canContinue = lengthOk && numberOk && specialOk;

  const strength = [lengthOk, numberOk, specialOk].filter(Boolean).length;
  const strengthLabels = ['', 'Weak', 'Fair', 'Strong'];
  const strengthColors = [colors.progressTrack, colors.danger, colors.warning, colors.success];

  return (
    <RegistrationScaffold
      step={8}
      title="Create a password"
      subtitle="Choose something strong and unique to this account."
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
        <Text style={authFormStyles.label}>Password</Text>
        <TextField
          accessibilityLabel="Password"
          placeholder="8–16 characters"
          secureTextEntry
          value={password}
          onChangeText={(t) => update({ password: t })}
          style={authFormStyles.field}
        />

        <View style={styles.meterRow}>
          {[0, 1, 2].map((i) => (
            <View
              key={i}
              style={[
                styles.meterSegment,
                { backgroundColor: i < strength ? strengthColors[strength] : colors.progressTrack },
              ]}
            />
          ))}
        </View>
        {strength > 0 ? (
          <Text style={[styles.strength, { color: strengthColors[strength] }]}>
            {strengthLabels[strength]}
          </Text>
        ) : null}

        <View style={styles.reqs}>
          <Requirement met={lengthOk} label="8–16 characters" />
          <Requirement met={numberOk} label="At least one number" />
          <Requirement met={specialOk} label="At least one special character" />
        </View>
      </View>
    </RegistrationScaffold>
  );
}

const styles = StyleSheet.create({
  meterRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs },
  meterSegment: { flex: 1, height: 6, borderRadius: 3 },
  strength: { fontSize: typography.caption, fontWeight: '700', marginTop: spacing.xs },
  reqs: { marginTop: spacing.lg, gap: spacing.sm },
  reqRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  reqText: { fontSize: typography.callout, color: colors.textTertiary },
  reqTextMet: { color: colors.textMuted },
});
