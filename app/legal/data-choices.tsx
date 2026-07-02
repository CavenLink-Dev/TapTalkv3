import React from 'react';
import { Linking, Pressable } from 'react-native';
import { LegalDocumentScreen, LegalSection } from '../../src/screens/LegalDocumentScreen';
import { ThemedText } from '../../src/components/native/ThemedText';
import { useTheme } from '../../src/theme/useTheme';
import { hapticSelection } from '../../src/utils/haptics';

const FOOTER_CAPTION = 'This information helps explain how TapTalk handles data and app responsibilities.';

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
        TapTalk stores profile details, boards, routines, lists, and activity progress on this iPhone or
        iPad by default. Nothing is sent to a cloud server unless you choose to sign in, export data, or
        email support.
      </LegalSection>

      <LegalSection heading="Review your data">
        Open Profile → Privacy & Data → Local Data for a summary of on-device storage. Your boards,
        routines, and settings are visible inside the app as you use TapTalk.
      </LegalSection>

      <LegalSection heading="Export your data">
        In Profile → Privacy & Data, tap Export My Data to share a text copy of your profile and settings.
        You choose where the export goes — Messages, Mail, Files, or another app on your device.
      </LegalSection>

      <LegalSection heading="Delete your data">
        In Profile → Privacy & Data, tap Delete Profile Data. TapTalk asks you to confirm before anything
        is removed. This clears profile content on this device and cannot be undone. Display and
        accessibility choices are kept so the app stays usable.
      </LegalSection>

      <LegalSection heading="Request changes or deletion by email">
        For help updating or deleting data, or for privacy questions, email us at {SUPPORT_EMAIL}. Include
        the device you use and a short description of your request.
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
