import React from 'react';
import { LegalDocumentScreen, LegalSection } from '../../src/screens/LegalDocumentScreen';

export default function MedicalDisclaimerScreen() {
  return (
    <LegalDocumentScreen
      title="Medical & Therapy Disclaimer"
      subtitle="Please read before relying on TapTalk for health or therapy decisions."
      reviewNotice="This information explains TapTalk's role in communication and learning — not clinical care."
    >
      <LegalSection heading="What TapTalk supports">
        TapTalk supports communication, routines, learning activities, and progress tracking. It helps
        people express messages, follow steps, practise skills, and stay organised with calm, accessible
        tools.
      </LegalSection>

      <LegalSection heading="What TapTalk does not do">
        TapTalk does not diagnose, treat, prevent, or cure any condition and does not replace advice from
        qualified professionals. It is not a medical device and is not intended for emergency use.
      </LegalSection>

      <LegalSection heading="Not a substitute for professional advice">
        TapTalk does not replace speech pathology, psychology, behavioural support, medical care, therapy
        planning, or emergency services. Always follow guidance from qualified clinicians, educators, and
        emergency responders who know the person using TapTalk.
      </LegalSection>

      <LegalSection heading="When to seek help">
        If someone is in danger or needs urgent medical attention, call local emergency services
        immediately. Do not delay professional care because TapTalk is available.
      </LegalSection>

      <LegalSection heading="No clinical claims">
        TapTalk avoids claims such as “clinically proven,” “diagnoses,” “treats,” “NDIS approved,” or
        “medical device” unless proper evidence and legal review support them. Features may support daily
        communication and learning, but that support is not a clinical outcome guarantee.
      </LegalSection>
    </LegalDocumentScreen>
  );
}
