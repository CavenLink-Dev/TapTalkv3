import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { Href, useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { PrimaryButton } from '../../src/components/native/PrimaryButton';
import { TextField } from '../../src/components/native/TextField';
import { RegistrationScaffold } from '../../src/components/registration/RegistrationScaffold';
import { useRegistration } from '../../src/context/RegistrationContext';
import { authFormStyles } from '../../src/styles/authFormStyles';
import { colors, radii, shadows, spacing, typography } from '../../src/theme/tokens';
import { fonts } from '../../src/theme/fonts';
import { hapticSelection, hapticSuccess } from '../../src/utils/haptics';

const nextRoute = '/registration/05-consent' as Href;

const hasNumber  = (s: string) => /\d/.test(s);
const hasSpecial = (s: string) => /[^a-zA-Z0-9]/.test(s);
const inLength   = (s: string) => s.length >= 8 && s.length <= 16;

type Mode = 'idle' | 'passkey' | 'password';

export default function RegStep4Secure() {
  const router = useRouter();
  const { data, update } = useRegistration();

  const [mode, setMode] = useState<Mode>(data.secureMethod ?? 'idle');
  const [confirm, setConfirm] = useState('');
  const [biometricsOn, setBiometricsOn] = useState(data.biometricsEnabled);

  // ── Passkey "creation" — UI-only stub. Real version would call
  // `AuthenticationServices` (requires expo-apple-authentication or the
  // native passkey APIs from Expo SDK 55+). For now we simulate creation.
  const createPasskey = () => {
    hapticSuccess();
    setMode('passkey');
    update({ secureMethod: 'passkey', password: '' });
  };

  const switchToPassword = () => {
    hapticSelection();
    setMode('password');
    update({ secureMethod: 'password' });
  };

  const password = data.password;
  const lengthOk  = inLength(password);
  const numberOk  = hasNumber(password);
  const specialOk = hasSpecial(password);
  const passwordOk = lengthOk && numberOk && specialOk;
  const confirmOk  = passwordOk && confirm.length > 0 && confirm === password;

  const strength = [lengthOk, numberOk, specialOk].filter(Boolean).length;
  const strengthLabels  = ['', 'Weak', 'Fair', 'Strong'];
  const strengthColors  = [colors.progressTrack, colors.danger, colors.warning, colors.success];

  const ready = mode === 'passkey' || (mode === 'password' && confirmOk);

  useEffect(() => {
    update({ biometricsEnabled: biometricsOn });
  }, [biometricsOn, update]);

  return (
    <RegistrationScaffold
      step={4}
      title="Secure your account"
      subtitle="Passkeys use Face ID or Touch ID and are far more secure than a password — they never leave this device."
      scroll
      footer={
        <PrimaryButton
          accessibilityLabel="Continue to consent"
          label="Continue"
          disabled={!ready}
          onPress={() => router.push(nextRoute)}
        />
      }
    >
      <View style={styles.list}>
        {/* ── Primary: Passkey card ── */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Create a passkey using Face ID or Touch ID"
          accessibilityState={{ selected: mode === 'passkey' }}
          onPress={createPasskey}
          style={({ pressed }) => [
            styles.passkeyCard,
            mode === 'passkey' && styles.passkeyCardDone,
            pressed && styles.passkeyCardPressed,
          ]}
        >
          <View style={styles.passkeyIconWrap}>
            <Ionicons
              name={mode === 'passkey' ? 'checkmark-circle' : 'finger-print'}
              size={28}
              color={mode === 'passkey' ? colors.surface : colors.primary}
            />
          </View>
          <View style={styles.flex}>
            <Text style={styles.passkeyTitle}>
              {mode === 'passkey' ? 'Passkey created' : 'Create a passkey'}
            </Text>
            <Text style={styles.passkeyBody}>
              {mode === 'passkey'
                ? "You're set — Face ID or Touch ID will sign you in next time."
                : 'One tap. Uses your device biometrics. Recommended.'}
            </Text>
          </View>
        </Pressable>

        {/* ── Secondary: switch to password ── */}
        {mode !== 'password' ? (
          <Pressable
            accessibilityRole="link"
            accessibilityLabel="Use an email and password instead"
            onPress={switchToPassword}
            hitSlop={6}
            style={styles.altLinkWrap}
          >
            <Text style={styles.altLink}>
              {mode === 'passkey' ? 'Use a password as well' : 'Use email and password instead'}
            </Text>
          </Pressable>
        ) : null}

        {/* ── Password fields ── */}
        {mode === 'password' ? (
          <Animated.View entering={FadeInDown.duration(260)} style={styles.passwordBlock}>
            <View>
              <Text style={authFormStyles.label}>Password</Text>
              <TextField
                accessibilityLabel="New password"
                placeholder="8–16 characters"
                autoCapitalize="none"
                autoCorrect={false}
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
                <Requirement met={lengthOk}  label="8–16 characters" />
                <Requirement met={numberOk}  label="At least one number" />
                <Requirement met={specialOk} label="At least one special character" />
              </View>
            </View>

            <View>
              <Text style={authFormStyles.label}>Confirm password</Text>
              <TextField
                accessibilityLabel="Confirm password"
                placeholder="Re-enter your password"
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                value={confirm}
                onChangeText={setConfirm}
                error={
                  confirm.length > 0 && !confirmOk
                    ? 'Passwords don\u2019t match.'
                    : undefined
                }
                success={confirmOk}
                style={authFormStyles.field}
              />
            </View>
          </Animated.View>
        ) : null}

        {/* ── Biometrics opt-in ── */}
        {ready ? (
          <Animated.View entering={FadeInDown.duration(260)} style={styles.bioCard}>
            <View style={styles.flex}>
              <Text style={styles.bioTitle}>Enable Face ID for quick access</Text>
              <Text style={styles.bioBody}>
                Sign back in with one glance — no typing.
              </Text>
            </View>
            <Switch
              value={biometricsOn}
              onValueChange={(v) => {
                hapticSelection();
                setBiometricsOn(v);
              }}
              trackColor={{ false: colors.progressTrack, true: colors.primary }}
              thumbColor={colors.surface}
              accessibilityLabel="Enable Face ID quick access"
            />
          </Animated.View>
        ) : null}
      </View>
    </RegistrationScaffold>
  );
}

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

const styles = StyleSheet.create({
  list: { gap: spacing.lg },
  flex: { flex: 1 },

  passkeyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radii.card,
    borderWidth: 1.5,
    borderColor: colors.primary,
    backgroundColor: '#EAF5FE',
    ...shadows.card,
  },
  passkeyCardPressed: {
    transform: [{ scale: 0.985 }],
  },
  passkeyCardDone: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  passkeyIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  passkeyTitle: {
    fontFamily: fonts.displayHeavy,
    fontSize: typography.body,
    color: colors.text,
  },
  passkeyBody: {
    marginTop: 2,
    fontFamily: fonts.body,
    fontSize: typography.callout,
    color: colors.textMuted,
    lineHeight: 20,
  },

  altLinkWrap: { alignSelf: 'center', paddingVertical: spacing.xs },
  altLink: {
    fontFamily: fonts.displayBold,
    fontSize: typography.callout,
    color: colors.primary,
  },

  passwordBlock: { gap: spacing.lg },
  meterRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs },
  meterSegment: { flex: 1, height: 6, borderRadius: 3 },
  strength: {
    fontFamily: fonts.displayBold,
    fontSize: typography.caption,
    marginTop: spacing.xs,
  },
  reqs: { marginTop: spacing.md, gap: spacing.sm },
  reqRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  reqText: {
    fontFamily: fonts.body,
    fontSize: typography.callout,
    color: colors.textTertiary,
  },
  reqTextMet: { color: colors.textMuted },

  bioCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  bioTitle: {
    fontFamily: fonts.displayHeavy,
    fontSize: typography.body,
    color: colors.text,
  },
  bioBody: {
    marginTop: 2,
    fontFamily: fonts.body,
    fontSize: typography.caption,
    color: colors.textMuted,
    lineHeight: 18,
  },
});
