import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Href, useRouter } from 'expo-router';
import { PrimaryButton } from '../../src/components/native/PrimaryButton';
import { RegistrationScaffold } from '../../src/components/registration/RegistrationScaffold';
import { SelectableCard } from '../../src/components/registration/SelectableCard';
import {
  requiresGuardianConsent,
  useRegistration,
} from '../../src/context/RegistrationContext';
import { spacing, typography } from '../../src/theme/tokens';
import { useTheme } from '../../src/theme/useTheme';
import { fonts } from '../../src/theme/fonts';

const nextRoute = '/registration/06-verify' as Href;

// In-app legal screens — no external browser dependency during consent,
// and the flow stays usable offline.
const termsRoute = '/legal/terms-of-use' as Href;
const privacyRoute = '/legal/privacy-policy' as Href;

export default function RegStep5Consent() {
  const router = useRouter();
  const t = useTheme();
  const { data, updateConsents } = useRegistration();
  const guardian = requiresGuardianConsent(data);
  const displayName =
    data.displayName.trim() || data.firstName.trim() || 'the AAC user';

  const requiredOk =
    data.consents.terms &&
    data.consents.privacy &&
    data.consents.photo &&
    (guardian ? data.consents.guardian : true);

  const openLegal = (route: Href) => {
    router.push(route);
  };

  return (
    <RegistrationScaffold
      step={5}
      title="Review & consent"
      subtitle="A few quick agreements before we create your account."
      scroll
      footer={
        <PrimaryButton
          accessibilityLabel="Create account and send verification code"
          label="Create account"
          disabled={!requiredOk}
          onPress={() => router.push(nextRoute)}
        />
      }
    >
      <View style={styles.list}>
        <SelectableCard
          entranceIndex={0}
          label="I agree to the Terms & Conditions"
          description="Read the full terms."
          selected={data.consents.terms}
          onPress={() => updateConsents({ terms: !data.consents.terms })}
          accessibilityLabel="Agree to the Terms and Conditions"
        />
        <Pressable
          accessibilityRole="link"
          accessibilityLabel="Read the Terms of Use"
          accessibilityHint="Opens the Terms of Use inside the app"
          onPress={() => openLegal(termsRoute)}
          hitSlop={8}
          style={styles.linkRow}
        >
          <Text style={[styles.linkText, { color: t.colors.primary }]}>Read Terms & Conditions</Text>
        </Pressable>

        <SelectableCard
          entranceIndex={1}
          label="I agree to the Privacy Policy"
          description="Covers what's stored on this device, what may sync to your account, deletion rights and retention."
          selected={data.consents.privacy}
          onPress={() => updateConsents({ privacy: !data.consents.privacy })}
          accessibilityLabel="Agree to the Privacy Policy"
        />
        <Pressable
          accessibilityRole="link"
          accessibilityLabel="Read the Privacy Policy"
          accessibilityHint="Opens the Privacy Policy inside the app"
          onPress={() => openLegal(privacyRoute)}
          hitSlop={8}
          style={styles.linkRow}
        >
          <Text style={[styles.linkText, { color: t.colors.primary }]}>Read Privacy Policy</Text>
        </Pressable>

        {guardian ? (
          <SelectableCard
            entranceIndex={2}
            label={`I'm the guardian or authorised carer for ${displayName}`}
            description="I consent to manage this account on their behalf."
            selected={data.consents.guardian}
            onPress={() => updateConsents({ guardian: !data.consents.guardian })}
            accessibilityLabel={`I confirm I am the legal guardian or authorised carer for ${displayName}`}
          />
        ) : null}

        <SelectableCard
          entranceIndex={guardian ? 3 : 2}
          label="I understand profile photos are optional"
          description="Profile photos can identify the AAC user. You can remove the photo later from Settings."
          selected={data.consents.photo}
          onPress={() => updateConsents({ photo: !data.consents.photo })}
          accessibilityLabel="Acknowledge optional profile photo use and deletion rights"
        />
      </View>
    </RegistrationScaffold>
  );
}

const styles = StyleSheet.create({
  list: { gap: spacing.md },
  linkRow: {
    marginTop: -spacing.sm + 2,
    paddingHorizontal: spacing.md,
    paddingVertical: 2,
    alignSelf: 'flex-start',
  },
  linkText: {
    fontFamily: fonts.displayBold,
    fontSize: typography.callout,
  },
});
