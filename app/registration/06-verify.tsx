import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  NativeSyntheticEvent,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TextInputKeyPressEventData,
  View,
} from 'react-native';
import { Href, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { PrimaryButton } from '../../src/components/native/PrimaryButton';
import { TextField } from '../../src/components/native/TextField';
import { RegistrationScaffold } from '../../src/components/registration/RegistrationScaffold';
import {
  useRegistration,
  verificationContact,
} from '../../src/context/RegistrationContext';
import { spacing, typography } from '../../src/theme/tokens';
import { useTheme } from '../../src/theme/useTheme';
import { fonts } from '../../src/theme/fonts';
import { hapticError, hapticSuccess } from '../../src/utils/haptics';

const nextRoute = '/registration/07-verified' as Href;

const RESEND_SECONDS = 60;
const MAX_ATTEMPTS = 3;

// TODO: wire to real SMS auth. For QA, the magic pass code is 000000.
const ACCEPTED_CODE = '000000';

export default function RegStep6Verify() {
  const router = useRouter();
  const t = useTheme();
  const { data, update } = useRegistration();
  const { phone } = verificationContact(data);

  const [first, setFirst] = useState('');   // group 1 — 3 digits
  const [second, setSecond] = useState(''); // group 2 — 3 digits
  const [attempts, setAttempts] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [resendIn, setResendIn] = useState(RESEND_SECONDS);

  const firstRef = useRef<TextInput>(null);
  const secondRef = useRef<TextInput>(null);

  const locked = attempts >= MAX_ATTEMPTS;
  const code = `${first}${second}`;
  const complete = code.length === 6;

  useEffect(() => {
    // Auto-focus the first input on mount.
    const timer = setTimeout(() => firstRef.current?.focus(), 120);
    return () => clearTimeout(timer);
  }, []);

  // ── Resend countdown ──
  useEffect(() => {
    if (resendIn <= 0) return;
    const timer = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendIn]);

  // ── Auto-advance / backspace between groups ──
  const onFirstChange = (t: string) => {
    const clean = t.replace(/\D/g, '').slice(0, 3);
    setFirst(clean);
    setError(null);
    if (clean.length === 3) secondRef.current?.focus();
  };
  const onSecondChange = (t: string) => {
    const clean = t.replace(/\D/g, '').slice(0, 3);
    setSecond(clean);
    setError(null);
  };
  const onSecondKey = (e: NativeSyntheticEvent<TextInputKeyPressEventData>) => {
    if (e.nativeEvent.key === 'Backspace' && second.length === 0) {
      firstRef.current?.focus();
    }
  };

  const announce = useCallback((msg: string) => {
    AccessibilityInfo.announceForAccessibility(msg);
  }, []);

  const verify = useCallback(() => {
    if (!complete || locked || verifying) return;
    setVerifying(true);
    update({ verificationCode: code });

    // Simulate a brief server check.
    setTimeout(() => {
      setVerifying(false);
      if (code === ACCEPTED_CODE) {
        hapticSuccess();
        announce('Code verified');
        router.replace(nextRoute);
      } else {
        const next = attempts + 1;
        setAttempts(next);
        hapticError();
        if (next >= MAX_ATTEMPTS) {
          setError('Too many incorrect attempts. Tap "Resend a new code" to try again.');
          announce('Too many incorrect attempts');
        } else {
          setError(`That code didn't match. ${MAX_ATTEMPTS - next} attempt${MAX_ATTEMPTS - next === 1 ? '' : 's'} left.`);
          announce("That code didn't match");
        }
      }
    }, 500);
  }, [complete, locked, verifying, code, attempts, router, announce, update]);

  // Auto-submit when 6 digits arrive (and only when not already verifying / locked).
  useEffect(() => {
    if (complete && !locked && !verifying) {
      verify();
    }
  }, [complete, locked, verifying, verify]);

  // ── Resend ──
  const resend = () => {
    if (resendIn > 0 && !locked) return;
    // TODO: trigger SMS resend.
    setFirst('');
    setSecond('');
    setAttempts(0);
    setError(null);
    setResendIn(RESEND_SECONDS);
    firstRef.current?.focus();
    announce('A new code has been sent');
  };

  return (
    <RegistrationScaffold
      step={6}
      title="Enter your code"
      subtitle={
        phone
          ? `We sent a 6-digit code to ${maskPhone(phone)}. It expires in 10 minutes.`
          : 'We sent a 6-digit code to your mobile. It expires in 10 minutes.'
      }
      scroll
      footer={
        <PrimaryButton
          accessibilityLabel="Verify the code"
          label="Verify"
          disabled={!complete || locked || verifying}
          loading={verifying}
          onPress={verify}
        />
      }
    >
      <View style={styles.codeBlock}>
        <View style={styles.codeRow} accessibilityLabel="Six digit verification code" accessibilityRole="text">
          <TextField
            ref={firstRef as React.Ref<TextInput>}
            accessibilityLabel="First three digits"
            placeholder="000"
            keyboardType="number-pad"
            maxLength={3}
            value={first}
            onChangeText={onFirstChange}
            editable={!locked}
            error={error && first.length === 3 ? '' : undefined}
            style={[styles.codeField, locked && styles.codeFieldDisabled]}
            textAlign="center"
            textContentType="oneTimeCode"
            autoComplete="sms-otp"
            returnKeyType="next"
          />
          <Text style={[styles.dash, { color: t.colors.textTertiary }]}>–</Text>
          <TextField
            ref={secondRef as React.Ref<TextInput>}
            accessibilityLabel="Last three digits"
            placeholder="000"
            keyboardType="number-pad"
            maxLength={3}
            value={second}
            onChangeText={onSecondChange}
            onKeyPress={onSecondKey}
            editable={!locked}
            error={error && second.length === 3 ? '' : undefined}
            style={[styles.codeField, locked && styles.codeFieldDisabled]}
            textAlign="center"
            textContentType="oneTimeCode"
            autoComplete="sms-otp"
            returnKeyType="done"
            onSubmitEditing={verify}
          />
        </View>

        {error ? (
          <Text
            accessibilityLiveRegion="polite"
            style={[styles.errorText, { color: t.colors.danger }, locked && styles.errorLocked]}
          >
            <Ionicons name="alert-circle" size={14} color={t.colors.danger} />
            {'  '}
            {error}
          </Text>
        ) : null}

        <View style={styles.resendRow}>
          {locked || resendIn === 0 ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Resend a new verification code"
              onPress={resend}
              hitSlop={8}
              style={styles.resendBtn}
            >
              <Ionicons name="refresh" size={16} color={t.colors.primary} />
              <Text style={[styles.resendActive, { color: t.colors.primary }]}>Resend a new code</Text>
            </Pressable>
          ) : (
            <Text style={[styles.resendIdle, { color: t.colors.textTertiary }]}>
              Resend a new code in {resendIn}s
            </Text>
          )}
        </View>
      </View>
    </RegistrationScaffold>
  );
}

// "+61 412 345 678" → "+61 41••• ••678" — preserves country + last 3 digits.
function maskPhone(raw: string): string {
  const trimmed = raw.trim();
  if (trimmed.length <= 6) return trimmed;
  const digits = trimmed.replace(/\D/g, '');
  const last = digits.slice(-3);
  return `••• ••• ${last}`;
}

const styles = StyleSheet.create({
  codeBlock: { gap: spacing.lg, marginTop: spacing.lg },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  codeField: {
    flex: 1,
    fontFamily: fonts.displayHeavy,
    fontSize: 28,
    letterSpacing: 6,
    textAlign: 'center',
  },
  codeFieldDisabled: {
    opacity: 0.5,
  },
  dash: {
    fontFamily: fonts.displayBold,
    fontSize: 26,
  },
  errorText: {
    fontFamily: fonts.body,
    fontSize: typography.callout,
    textAlign: 'center',
    lineHeight: 20,
  },
  errorLocked: {
    fontFamily: fonts.displayBold,
  },
  resendRow: {
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  resendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  resendActive: {
    fontFamily: fonts.displayBold,
    fontSize: typography.callout,
  },
  resendIdle: {
    fontFamily: fonts.body,
    fontSize: typography.callout,
  },
});
