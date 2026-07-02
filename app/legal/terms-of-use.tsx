import React from 'react';
import { LegalDocumentScreen, LegalSection } from '../../src/screens/LegalDocumentScreen';

export default function TermsOfUseScreen() {
  return (
    <LegalDocumentScreen
      title="Terms of Use"
      subtitle="Plain-English rules for using TapTalk safely."
      reviewNotice="This draft is placeholder wording for development. Have legal counsel review before App Store release."
    >
      <LegalSection heading="Acceptance">
        By using TapTalk, you agree to these terms. If you do not agree, please do not use the app. A
        parent, guardian, or support person may accept on behalf of someone who needs help using TapTalk.
      </LegalSection>

      <LegalSection heading="What TapTalk is">
        TapTalk is an AAC app that helps people build and speak messages with symbols, routines, calm
        tools, and learning activities. It is designed to support everyday communication and organisation.
      </LegalSection>

      <LegalSection heading="What TapTalk is not">
        TapTalk is not a medical device, emergency service, or substitute for professional advice. It does
        not diagnose, treat, or cure any condition. Do not rely on TapTalk for urgent or life-threatening
        situations — contact local emergency services instead.
      </LegalSection>

      <LegalSection heading="Your responsibilities">
        Use TapTalk respectfully and lawfully. Keep your device secure, especially on shared devices where
        a caregiver PIN is recommended. You are responsible for content you create, export, or share outside
        the app.
      </LegalSection>

      <LegalSection heading="Intellectual property">
        TapTalk software, branding, and original content belong to TapTalk unless stated otherwise.
        Third-party symbols, fonts, sounds, and open-source components are credited under Licences &
        Attribution in Profile → About Us & Guide.
      </LegalSection>

      <LegalSection heading="Limitation of liability">
        TapTalk is provided “as is” during development. To the extent permitted by law, TapTalk is not
        liable for indirect or consequential loss arising from use of the app. Nothing here limits rights
        that cannot be excluded under Australian consumer law.
      </LegalSection>

      <LegalSection heading="Changes">
        We may update these terms as TapTalk grows. Material changes will be reflected in the app. Continued
        use after an update means you accept the revised terms.
      </LegalSection>
    </LegalDocumentScreen>
  );
}
