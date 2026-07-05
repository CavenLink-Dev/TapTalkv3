import React from 'react';
import {
  LegalDocumentScreen,
  LegalSection,
  SupportEmailLink,
} from '../../src/screens/LegalDocumentScreen';

const SUPPORT_EMAIL = 'hello@taptalk.app';

export default function TermsOfUseScreen() {
  return (
    <LegalDocumentScreen
      title="Terms of Use"
      subtitle="Plain-English rules for using TapTalk safely. Last updated: July 2026."
      reviewNotice="These terms apply to TapTalk pre-release builds and may be updated as the app changes."
    >
      <LegalSection heading="Acceptance">
        By using TapTalk, you agree to these terms. If you do not agree, do not use the app. A
        parent, guardian, authorised carer, support worker, or other trusted person may help someone
        accept these terms where they have appropriate authority to support that person.
      </LegalSection>

      <LegalSection heading="What TapTalk is">
        TapTalk is an AAC and accessibility support app. It helps people build and speak messages,
        organise boards, follow routines, use calm tools, practise activities, and keep communication
        supports available on their iPhone or iPad.
      </LegalSection>

      <LegalSection heading="What TapTalk is not">
        TapTalk is not a medical device, diagnostic tool, therapy service, behaviour support plan,
        emergency service, NDIS provider, plan manager, or substitute for professional advice. TapTalk
        does not diagnose, treat, prevent, or cure any condition and does not guarantee clinical,
        educational, behavioural, or NDIS funding outcomes.
      </LegalSection>

      <LegalSection heading="Emergency and safety limits">
        Do not rely on TapTalk for urgent or life-threatening situations. If someone is in immediate
        danger or needs urgent medical help, call local emergency services. TapTalk may support everyday
        communication, but it must not delay professional care, supervision, safeguarding, or emergency
        response.
      </LegalSection>

      <LegalSection heading="Your responsibilities">
        Use TapTalk lawfully, respectfully, and safely. Make sure any information entered about another
        person is entered with appropriate consent or authority. Keep devices, account credentials,
        caregiver PINs, and exported data secure. You are responsible for content you create, export,
        send, or share outside TapTalk.
      </LegalSection>

      <LegalSection heading="Support workers and providers">
        If you use TapTalk while delivering disability, education, therapy, or NDIS-related supports,
        you remain responsible for following all rules that apply to your role. This includes privacy,
        consent, dignity of risk, confidentiality, safe practice, incident escalation, and professional
        boundaries.
      </LegalSection>

      <LegalSection heading="Accounts and cloud sync">
        Some features may use an account or cloud sync. Cloud sync is provided to help save supported
        profile and app data, not as a guaranteed backup, archive, clinical record, or business record.
        You should keep your own records where required by law, professional standards, school policy,
        provider policy, or care planning needs.
      </LegalSection>

      <LegalSection heading="Data deletion">
        TapTalk includes local data controls in Profile → Privacy & Data. Deleting local profile data
        removes TapTalk content from that device but may not remove account or cloud records. For
        account or cloud deletion help,
        contact <SupportEmailLink email={SUPPORT_EMAIL} subject="Data deletion request" /> with the
        subject line “Data deletion request”.
      </LegalSection>

      <LegalSection heading="Intellectual property">
        TapTalk software, design, branding, and original content belong to TapTalk unless stated
        otherwise. Third-party symbols, fonts, sounds, libraries, and open-source components remain owned
        by their respective rights holders and are credited under Licences & Attribution where required.
      </LegalSection>

      <LegalSection heading="Pre-release availability">
        TapTalk may be released first as a pre-release or early version. Features may change, improve, or
        be removed. The app may contain bugs or incomplete features. TapTalk is provided on an “as is” and
        “as available” basis to the extent permitted by law.
      </LegalSection>

      <LegalSection heading="Limitation of liability">
        To the extent permitted by law, TapTalk is not liable for indirect, special, incidental, or
        consequential loss arising from use of the app, loss of data, reliance on app content, or inability
        to access the app. Nothing in these terms limits rights that cannot be excluded under Australian
        Consumer Law or other applicable laws.
      </LegalSection>

      <LegalSection heading="Changes and contact">
        TapTalk may update these terms as features, legal requirements, or data practices change.
        Material changes will be reflected in the app or policy text. For questions,
        email <SupportEmailLink email={SUPPORT_EMAIL} />.
      </LegalSection>
    </LegalDocumentScreen>
  );
}
