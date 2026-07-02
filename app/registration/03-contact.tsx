import React, { useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Href, useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { PrimaryButton } from '../../src/components/native/PrimaryButton';
import { TextField } from '../../src/components/native/TextField';
import { Pill } from '../../src/components/native/Pill';
import { RegistrationScaffold } from '../../src/components/registration/RegistrationScaffold';
import {
  ageGate,
  GuardianRelationship,
  useRegistration,
} from '../../src/context/RegistrationContext';
import { createAuthFormStyles } from '../../src/styles/authFormStyles';
import { EMAIL_PATTERN } from '../../src/utils/validation';
import { spacing, typography } from '../../src/theme/tokens';
import { useTheme } from '../../src/theme/useTheme';
import { fonts } from '../../src/theme/fonts';
import { useReduceMotion } from '../../src/hooks/useReduceMotion';

const nextRoute = '/registration/04-secure' as Href;

// Stand-in for the server's "is this email already registered?" check until
// real auth lands. Anything in this list triggers the inline "log in?" hint.
const KNOWN_EMAILS = new Set(['existing@taptalk.app', 'demo@taptalk.app']);

const RELATIONSHIPS: { id: GuardianRelationship; label: string }[] = [
  { id: 'parent',          label: 'Parent' },
  { id: 'carer',           label: 'Carer' },
  { id: 'support_worker',  label: 'Support worker' },
  { id: 'other',           label: 'Other' },
];

export default function RegStep3Contact() {
  const router = useRouter();
  const t = useTheme();
  const reduceMotion = useReduceMotion();
  const authFormStyles = useMemo(() => createAuthFormStyles(t), [t]);
  const { data, update } = useRegistration();
  const gate = ageGate(data);

  // Path A — AAC user's own contact details. Path B — guardian or setup person.
  const isPathA = gate.kind === 'self_ok';
  const isGuardianFlow = gate.kind === 'guardian_required';

  const screenTitle = isPathA
    ? 'Contact details'
    : isGuardianFlow
      ? 'Your details as the guardian'
      : 'Your details as the person setting up';

  const screenSubtitle = isPathA
    ? "We'll use these to sign you in and verify the account."
    : isGuardianFlow
      ? "The AAC user's name and date of birth are kept for personalisation. Your email and phone are used for account access and security."
      : "We'll use these to sign in and verify the account on behalf of " +
        (data.displayName || data.firstName || 'the AAC user') + '.';

  // ─ Field bindings ─
  const emailField = isPathA ? data.email : data.guardianEmail;
  const phoneField = isPathA ? data.phone : data.guardianPhone;
  const setEmail = (v: string) => update(isPathA ? { email: v } : { guardianEmail: v });
  const setPhone = (v: string) => update(isPathA ? { phone: v } : { guardianPhone: v });

  // ─ Validation ─
  const [emailBlurred, setEmailBlurred] = useState(false);
  const emailValid = EMAIL_PATTERN.test(emailField.trim());
  const emailKnown = emailValid && KNOWN_EMAILS.has(emailField.trim().toLowerCase());
  const emailErrorMsg =
    emailBlurred && emailField.length > 0 && !emailValid
      ? 'Enter a valid email address.'
      : emailKnown
        ? 'An account with this email already exists.'
        : null;

  const phoneDigits = phoneField.replace(/\D/g, '');
  const phoneValid = phoneDigits.length >= 8;

  const guardianNameOk = isPathA ? true : data.guardianName.trim().length > 0;
  const relationshipOk = isPathA ? true : data.guardianRelationship !== null;

  const canContinue =
    emailValid && !emailKnown && phoneValid && guardianNameOk && relationshipOk;

  const phoneRef = useRef<TextInput>(null);
  const noteEntering = reduceMotion
    ? FadeInDown.duration(160).withInitialValues({ transform: [{ translateY: 0 }] })
    : FadeInDown.duration(260).delay(60);

  const goLogin = () => {
    router.replace('/auth/login' as Href);
  };

  return (
    <RegistrationScaffold
      step={3}
      title={screenTitle}
      subtitle={screenSubtitle}
      scroll
      footer={
        <PrimaryButton
          accessibilityLabel="Continue to secure access"
          label="Continue"
          disabled={!canContinue}
          onPress={() => router.push(nextRoute)}
        />
      }
    >
      <View style={styles.fields}>
        {/* ── Guardian / setup-person extras (Path B only) ── */}
        {!isPathA ? (
          <>
            <View>
              <Text style={authFormStyles.label}>
                {isGuardianFlow ? 'Guardian full name' : 'Your full name'}
              </Text>
              <TextField
                accessibilityLabel={isGuardianFlow ? 'Guardian full name' : 'Your full name'}
                placeholder="e.g. Alex Smith"
                autoCapitalize="words"
                value={data.guardianName}
                onChangeText={(t) => update({ guardianName: t })}
                style={authFormStyles.field}
              />
            </View>

            {isGuardianFlow ? (
              <View>
                <Text style={authFormStyles.label}>Relationship to AAC user</Text>
                <View style={styles.relationshipRow}>
                  {RELATIONSHIPS.map((r) => (
                    <Pill
                      key={r.id}
                      label={r.label}
                      selected={data.guardianRelationship === r.id}
                      onPress={() => update({ guardianRelationship: r.id })}
                      accessibilityLabel={r.label}
                    />
                  ))}
                </View>
              </View>
            ) : null}
          </>
        ) : null}

        {/* ── Email ── */}
        <View>
          <Text style={authFormStyles.label}>
            {isPathA ? 'Email address' : isGuardianFlow ? 'Guardian email' : 'Email address'}
          </Text>
          <TextField
            accessibilityLabel="Email"
            placeholder="you@example.com"
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            returnKeyType="next"
            value={emailField}
            onChangeText={setEmail}
            onBlur={() => setEmailBlurred(true)}
            onSubmitEditing={() => phoneRef.current?.focus()}
            error={emailErrorMsg ?? undefined}
            success={emailValid && !emailKnown && emailBlurred}
            style={authFormStyles.field}
          />
          {emailKnown ? (
            <Pressable
              accessibilityRole="link"
              accessibilityLabel="Log in to the existing account"
              onPress={goLogin}
              hitSlop={8}
              style={styles.knownRow}
            >
              <Text style={[styles.knownText, { color: t.colors.primary }]}>Log in instead</Text>
              <Ionicons name="chevron-forward" size={16} color={t.colors.primary} />
            </Pressable>
          ) : null}
        </View>

        {/* ── Phone ── */}
        <View>
          <Text style={authFormStyles.label}>
            {isPathA ? 'Mobile number' : isGuardianFlow ? 'Guardian mobile' : 'Mobile number'}
          </Text>
          <TextField
            ref={phoneRef as React.Ref<TextInput>}
            accessibilityLabel="Mobile number"
            placeholder="+61 400 000 000"
            keyboardType="phone-pad"
            autoComplete="tel"
            value={phoneField}
            onChangeText={setPhone}
            style={authFormStyles.field}
            helper="Used to send the verification code in the next step. Australian numbers default to +61."
          />
        </View>

        {!isPathA ? (
          <Animated.View entering={noteEntering} style={styles.note}>
            <Ionicons
              name="shield-checkmark-outline"
              size={20}
              color={t.colors.primaryDark}
              accessibilityElementsHidden
            />
            <Text style={[styles.noteText, { color: t.colors.text }]}>
              Your email becomes the account login and your phone is the
              verification contact. The AAC user's name and DOB are kept
              for personalisation only.
            </Text>
          </Animated.View>
        ) : null}
      </View>
    </RegistrationScaffold>
  );
}

const styles = StyleSheet.create({
  fields: { gap: spacing.lg },
  relationshipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: 6,
  },
  knownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginTop: spacing.xs,
    alignSelf: 'flex-start',
    paddingVertical: 4,
  },
  knownText: {
    fontFamily: fonts.displayBold,
    fontSize: typography.callout,
  },
  note: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: 16,
    backgroundColor: '#EAF5FE',
  },
  noteText: {
    flex: 1,
    fontFamily: fonts.body,
    fontSize: typography.callout,
    lineHeight: 21,
  },
});
