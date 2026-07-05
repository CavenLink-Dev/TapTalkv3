import React from 'react';
import { LegalDocumentScreen, LegalSection } from '../../src/screens/LegalDocumentScreen';

const SUPPORT_EMAIL = 'hello@taptalk.app';

export default function PrivacyPolicyScreen() {
  return (
    <LegalDocumentScreen
      title="Privacy Policy"
      subtitle="Last updated: July 2026"
      reviewNotice="This policy applies to TapTalk pre-release builds and may be updated when data practices materially change."
    >
      <LegalSection heading="Who this policy is for">
        TapTalk is an AAC and accessibility support app built in Adelaide, South Australia. This
        policy explains how TapTalk handles information for AAC users, parents, guardians, carers,
        support workers, therapists, and other people who help set up or use the app.
      </LegalSection>

      <LegalSection heading="Personal and sensitive information">
        TapTalk may handle personal information such as names, display names, usernames, contact
        details, role, age or date-of-birth details used for age-appropriate setup, profile photos,
        accessibility settings, AAC boards, routines, activity progress, calendar plans, first-then
        sequences, communication passport notes, and support messages you choose to send. Because
        TapTalk is used for communication and disability support, some user-entered content may reveal
        sensitive information. TapTalk does not ask for NDIS numbers, Medicare numbers, government ID,
        payment card details, precise location, health records, clinical notes, or diagnoses.
      </LegalSection>

      <LegalSection heading="How data is collected">
        Data is collected when you type it into TapTalk, create boards or routines, choose settings,
        complete activities, pick or take a profile photo, sign in, use cloud sync, export data, or
        contact support. Camera and photo access are only used when you choose to add or change a
        profile picture.
      </LegalSection>

      <LegalSection heading="How TapTalk uses data">
        TapTalk uses data to run communication boards, speak messages, save layouts, remember calm
        accessibility choices, support routines and activities, keep progress available, sync account
        data when cloud sync is used, provide support, protect accounts, and comply with legal or App
        Store obligations.
      </LegalSection>

      <LegalSection heading="On-device storage">
        TapTalk is designed so everyday AAC use can work from data stored on this iPhone or iPad.
        Local data stays on the device unless you choose to sign in, use cloud sync, export data,
        share content, or contact support.
      </LegalSection>

      <LegalSection heading="Cloud storage and accounts">
        If you create an account or use cloud sync, selected profile and app data may be sent to
        TapTalk's cloud provider so your account, routines, calendar plans, and supported sync data can
        be saved. Authentication is handled by the account provider. TapTalk does not sell user data or
        use it for advertising or tracking.
      </LegalSection>

      <LegalSection heading="Third-party services">
        TapTalk may use service providers for authentication, cloud database storage, app distribution,
        device permissions, email support, and operating-system services. These providers may process
        data only for the service they provide. TapTalk requires third-party service providers to protect
        user data in a way that is consistent with this policy and applicable privacy requirements.
      </LegalSection>

      <LegalSection heading="Sharing">
        TapTalk does not sell personal information and does not share data with advertising networks or
        data brokers. Data may leave the device when you choose to export or share it, when you sign in
        or use cloud sync, when you contact support, when required by law, or when needed to protect the
        safety, security, or legal rights of users or TapTalk.
      </LegalSection>

      <LegalSection heading="Children, guardians, and support people">
        TapTalk can be set up by a parent, guardian, authorised carer, support worker, or therapist for
        someone who needs help using AAC. The person setting up the app must have appropriate authority
        or consent to enter information for the AAC user. For children and young people, TapTalk uses
        age-appropriate consent prompts and avoids advertising, tracking, and unnecessary data collection.
      </LegalSection>

      <LegalSection heading="NDIS and support settings">
        TapTalk may be used by people receiving disability supports, including NDIS-funded supports, but
        TapTalk is not an NDIS provider, plan manager, medical device, behaviour support plan, or
        emergency service. Providers and workers using TapTalk with a participant remain responsible for
        consent, privacy, confidentiality, safe practice, and any NDIS obligations that apply to them.
      </LegalSection>

      <LegalSection heading="Retention and deletion">
        Local data stays on the device until you delete it, sign out, reset the app, or remove the app.
        Profile → Privacy & Data lets you export or delete local profile data. Deleting local data does
        not automatically delete cloud account records. For help deleting account or cloud data, contact
        {SUPPORT_EMAIL} with the subject line “Data deletion request”.
      </LegalSection>

      <LegalSection heading="Security">
        TapTalk uses reasonable technical and organisational safeguards for the type of app it is,
        including local device storage, account authentication where enabled, and caregiver lock options.
        No app or cloud service can guarantee perfect security. Keep devices, passcodes, caregiver PINs,
        and account credentials secure.
      </LegalSection>

      <LegalSection heading="Your choices and rights">
        You can review, update, export, and delete local data from Profile → Privacy & Data. You can
        withdraw device permissions in iOS Settings. You can also ask for help accessing, correcting, or
        deleting account data by contacting {SUPPORT_EMAIL}. TapTalk will respond using the contact
        details you provide.
      </LegalSection>

      <LegalSection heading="Contact">
        Questions about privacy, account data, cloud storage, or deletion requests can be emailed to
        {SUPPORT_EMAIL} with the subject line “Privacy question”.
      </LegalSection>
    </LegalDocumentScreen>
  );
}
