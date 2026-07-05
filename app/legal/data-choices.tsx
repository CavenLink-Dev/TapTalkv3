import React from 'react';
import { Linking, Pressable } from 'react-native';
import { LegalDocumentScreen, LegalSection } from '../../src/screens/LegalDocumentScreen';
import { ThemedText } from '../../src/components/native/ThemedText';
import { useTheme } from '../../src/theme/useTheme';
import { hapticSelection } from '../../src/utils/haptics';

const FOOTER_CAPTION = 'These choices explain local data controls, cloud/account requests, and support contact options.';

const SUPPORT_EMAIL = 'hello@taptalk.app';

export default function DataChoicesScreen() {
  const t = useTheme();

  const openSupportEmail = () => {
    hapticSelection();
    Linking.openURL(
      `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent('TapTalk data request')}`,
    ).catch(() => {});
  };

  return (
    <LegalDocumentScreen
      title="Data & Privacy Choices"
      subtitle="How to review, export, delete, or request changes to your TapTalk data."
      reviewNotice={FOOTER_CAPTION}
    >
      <LegalSection heading="Where your data lives">
        TapTalk stores profile details, boards, routines, lists, accessibility settings, and activity
        progress on this iPhone or iPad by default. If you sign in or use cloud sync, selected profile
        and app data may also be saved to your TapTalk account so supported information can be restored
        or synced.
      </LegalSection>

      <LegalSection heading="Review your data">
        Your boards, routines, settings, profile details, and saved tools are visible inside the app as
        you use TapTalk. Open Profile → Privacy & Data → Local Data for a plain-language summary of
        on-device storage.
      </LegalSection>

      <LegalSection heading="Export local data">
        In Profile → Privacy & Data, tap Export My Data to share a text copy of local profile and app
        settings. You choose where the export goes, such as Messages, Mail, Files, or another app on
        your device. After export, the copy is controlled by the app or person you share it with.
      </LegalSection>

      <LegalSection heading="Delete local data">
        In Profile → Privacy & Data, tap Delete Profile Data to clear profile content from this device.
        TapTalk asks you to confirm before anything is removed. This cannot be undone. Display and
        accessibility choices may be kept so the app remains usable.
      </LegalSection>

      <LegalSection heading="Cloud and account deletion">
        Deleting local data does not automatically delete cloud account records. For help deleting account
        data, cloud sync records, or support emails, contact {SUPPORT_EMAIL} with the subject line “Data
        deletion request”. Include the email or phone number used for the account and a short description
        of what you want deleted.
      </LegalSection>

      <LegalSection heading="Withdraw permissions">
        You can change camera, photo, notification, and other device permissions in iOS Settings →
        TapTalk. If a permission is turned off, TapTalk will continue to work where possible and may ask
        again only when that permission is needed for a feature you choose to use.
      </LegalSection>

      <LegalSection heading="Request correction or access">
        For help accessing, correcting, exporting, or deleting account data, email {SUPPORT_EMAIL}. Include
        the device you use, the account contact details, and a short description of your request. Do not
        include unnecessary medical, NDIS, or highly sensitive information in the email.
      </LegalSection>

      <Pressable
        accessibilityRole="link"
        accessibilityLabel={`Email ${SUPPORT_EMAIL}`}
        accessibilityHint="Opens your mail app to contact TapTalk support"
        onPress={openSupportEmail}
        style={({ pressed }) => [pressed && { opacity: 0.75 }]}
      >
        <ThemedText variant="callout" color={t.colors.primary}>
          {SUPPORT_EMAIL}
        </ThemedText>
      </Pressable>
    </LegalDocumentScreen>
  );
}
