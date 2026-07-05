import React from 'react';
import { LegalDocumentScreen, LegalSection } from '../../src/screens/LegalDocumentScreen';

export default function MedicalDisclaimerScreen() {
  return (
    <LegalDocumentScreen
      title="Medical & Therapy Disclaimer"
      subtitle="TapTalk supports communication and daily access. It does not replace clinical care."
      reviewNotice="Use professional advice, emergency services, and approved care plans where they are needed."
    >
      <LegalSection heading="What TapTalk supports">
        TapTalk supports AAC communication, routines, learning activities, calm tools, accessibility
        preferences, and everyday organisation. It can help people express messages, follow steps,
        practise skills, and share communication preferences with trusted supporters.
      </LegalSection>

      <LegalSection heading="What TapTalk does not do">
        TapTalk does not diagnose, treat, prevent, monitor, or cure any condition. It is not a medical
        device, clinical record system, therapy provider, behaviour support plan, medication tool,
        emergency service, NDIS provider, or substitute for qualified professional advice.
      </LegalSection>

      <LegalSection heading="Professional advice">
        TapTalk does not replace speech pathology, occupational therapy, psychology, behaviour support,
        medical care, education planning, supervision, safeguarding, or emergency response. Always follow
        advice from qualified clinicians, educators, providers, and emergency responders who know the
        person using TapTalk.
      </LegalSection>

      <LegalSection heading="NDIS and support use">
        TapTalk may be used alongside disability supports, including NDIS-funded supports, but it is not
        NDIS-approved clinical evidence, a funding guarantee, or a replacement for provider obligations.
        Support workers and providers remain responsible for consent, privacy, dignity, safety, record
        keeping, incident escalation, and professional boundaries.
      </LegalSection>

      <LegalSection heading="When to seek help">
        If someone is in danger, distressed, at risk of harm, or needs urgent medical attention, call
        local emergency services immediately. Do not delay professional care because TapTalk is available
        or because a message, routine, activity, or support tool appears in the app.
      </LegalSection>

      <LegalSection heading="No clinical claims">
        TapTalk avoids claims such as “clinically proven,” “diagnoses,” “treats,” “cures,” “NDIS
        approved,” or “medical device” unless proper evidence, regulatory assessment, and legal review
        support those claims. Features may support everyday communication and learning, but they do not
        guarantee clinical, behavioural, educational, or funding outcomes.
      </LegalSection>
    </LegalDocumentScreen>
  );
}
