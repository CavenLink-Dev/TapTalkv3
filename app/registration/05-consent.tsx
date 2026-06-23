import React from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { Href, useRouter } from 'expo-router';
import { PrimaryButton } from '../../src/components/native/PrimaryButton';
import { RegistrationScaffold } from '../../src/components/registration/RegistrationScaffold';
import { SelectableCard } from '../../src/components/registration/SelectableCard';
import {
  requiresGuardianConsent,
  useRegistration,
} from '../../src/context/RegistrationContext';
import { colors, spacing, typography } from '../../src/theme/tokens';
import { fonts } from '../../src/theme/fonts';

const nextRoute = '/registration/06-verify' as Href;

// Stand-in URLs until the legal pages ship.
const TERMS_URL = 'https://taptalk.app/terms';
const PRIVACY_URL = 'https://taptalk.app/privacy';

export default function RegStep5Consent() {
  const router = useRouter();
  const { data, updateConsents } = useRegistration();
  const guardian = requiresGuardianConsent(data);
  const displayName =
    data.displayName.trim() || data.firstName.trim() || 'the AAC user';

  const requiredOk =
    data.consents.terms &&
    data.consents.privacy &&
    data.consents.photo &&
    (guardian ? data.consents.guardian : true);

  const openLink = (url: string) => {
    Linking.openURL(url).catch(() => undefined);
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
          accessibilityLabel="Open the Terms and Conditions in your browser"
          onPress={() => openLink(TERMS_URL)}
          hitSlop={8}
          style={styles.linkRow}
        >
          <Text style={styles.linkText}>Read Terms & Conditions</Text>
        </Pressable>

        <SelectableCard
          entranceIndex={1}
          label="I agree to the Privacy Policy"
          description="Covers what's stored on this device vs in the cloud, your data deletion rights and retention."
          selected={data.consents.privacy}
          onPress={() => updateConsents({ privacy: !data.consents.privacy })}
          accessibilityLabel="Agree to the Privacy Policy"
        />
        <Pressable
          accessibilityRole="link"
          accessibilityLabel="Open the Privacy Policy in your browser"
          onPress={() => openLink(PRIVACY_URL)}
          hitSlop={8}
          style={styles.linkRow}
        >
          <Text style={styles.linkText}>Read Privacy Policy</Text>
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
          label="I understand profile photos are stored securely"
          description="Your photo is yours. You can delete it at any time from Settings."
          selected={data.consents.photo}
          onPress={() => updateConsents({ photo: !data.consents.photo })}
          accessibilityLabel="Acknowledge profile photo storage and deletion rights"
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
    color: colors.primary,
  },
});
