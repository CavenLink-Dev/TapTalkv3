import React from 'react';
import { LegalDocumentScreen, LegalSection } from '../../src/screens/LegalDocumentScreen';

const SUPPORT_EMAIL = 'hello@taptalk.app';

export default function PrivacyPolicyScreen() {
  return (
    <LegalDocumentScreen
      title="Privacy Policy"
      subtitle="Last reviewed: July 2026 · Pending legal review"
      reviewNotice="This draft is placeholder wording for development. Have legal counsel review before App Store release."
    >
      <LegalSection heading="What we collect">
        TapTalk stores profile details, AAC board choices, routines, activity progress, accessibility
        settings, and optional profile photos on your device. If you create an account, sign-in details
        are handled by our authentication provider. TapTalk does not collect health diagnoses or clinical
        records.
      </LegalSection>

      <LegalSection heading="How we use your data">
        Your data powers communication boards, routines, learning activities, and progress tracking inside
        the app. TapTalk uses your choices to speak messages, remember layouts, and keep settings consistent
        between sessions on the same device.
      </LegalSection>

      <LegalSection heading="Storage and security">
        By default, TapTalk keeps your profile and AAC content on this iPhone or iPad using local storage.
        A caregiver PIN, when enabled, is stored on the device to protect settings on shared devices. We
        design TapTalk so day-to-day AAC use can work without sending your boards to a cloud server.
      </LegalSection>

      <LegalSection heading="Sharing">
        TapTalk does not sell your personal data. Data leaves your device only when you choose to export
        it, sign in through an authentication provider, or contact support by email. Future cloud backup
        or sync features, if added, will be explained here before they are turned on.
      </LegalSection>

      <LegalSection heading="Data retention">
        Data stays on your device until you delete it, sign out, or remove the app. If you use Export My
        Data, you control where the copy goes. Deleting profile data from Profile → Privacy & Data clears
        TapTalk content on this device.
      </LegalSection>

      <LegalSection heading="Your rights">
        You can review, export, and delete on-device data from Profile → Privacy & Data. For help changing
        or deleting data, contact {SUPPORT_EMAIL}. We will respond using the contact details you provide.
      </LegalSection>

      <LegalSection heading="Contact">
        Questions about privacy or data handling? Email {SUPPORT_EMAIL} with the subject line “Privacy
        question”.
      </LegalSection>
    </LegalDocumentScreen>
  );
}
