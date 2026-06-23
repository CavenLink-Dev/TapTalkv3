import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

/**
 * In-memory state for the registration flow.
 *
 * The flow has nine visible steps. The split into paths happens at Step 3
 * (contact details), driven by `role` from Step 1 and the age computed from
 * Step 2's DOB. We keep the entire collected dataset in a single object so
 * stepping back never loses anything and the final "Create Account" call has
 * the whole payload in one place.
 *
 * Per the spec: NO partial account is created on the server until the user
 * confirms Step 5 (consent) AND passes Step 6 (SMS code). All fields here are
 * client-only memory until that point.
 */

export const REGISTRATION_TOTAL_STEPS = 9;

export type RegistrationRole = 'myself' | 'someone_else';

export type GuardianRelationship = 'parent' | 'carer' | 'support_worker' | 'other' | null;

export type SecureMethod = 'passkey' | 'password';

export type ThemePref = 'light' | 'dark' | 'system';
export type TextSizePref = 'default' | 'large' | 'xlarge' | 'maximum';
export type ButtonSizePref = 'standard' | 'large';
export type ColorSchemePref = 'fitzgerald' | 'cvd_safe';

export interface AccessibilityPrefs {
  textSize: TextSizePref;
  buttonSize: ButtonSizePref;
  theme: ThemePref;
  highContrast: boolean;
  colorScheme: ColorSchemePref;
}

export interface RegistrationData {
  // Step 1
  role: RegistrationRole | null;

  // Step 2 — AAC user (always)
  firstName: string;
  lastName: string;
  displayName: string;
  dobDay: string;
  dobMonth: string;
  dobYear: string;

  // Step 3a — AAC user contact (myself path)
  email: string;
  phone: string;

  // Step 3b — Guardian / setup-person (someone_else path)
  guardianName: string;
  guardianRelationship: GuardianRelationship;
  guardianEmail: string;
  guardianPhone: string;

  // Step 4 — Secure access
  secureMethod: SecureMethod | null;
  password: string;
  biometricsEnabled: boolean;

  // Step 5 — Consents
  consents: {
    terms: boolean;
    privacy: boolean;
    guardian: boolean;
    photo: boolean;
  };

  // Step 6 — Verification (transient, only kept so a back/forward keeps focus)
  verificationCode: string;

  // Step 8 — Accessibility prefs
  accessibility: AccessibilityPrefs;

  // Step 9 — Profile
  profilePhotoUri: string | null;
}

const INITIAL_DATA: RegistrationData = {
  role: null,
  firstName: '',
  lastName: '',
  displayName: '',
  dobDay: '',
  dobMonth: '',
  dobYear: '',
  email: '',
  phone: '',
  guardianName: '',
  guardianRelationship: null,
  guardianEmail: '',
  guardianPhone: '',
  secureMethod: null,
  password: '',
  biometricsEnabled: false,
  consents: {
    terms: false,
    privacy: false,
    guardian: false,
    photo: false,
  },
  verificationCode: '',
  accessibility: {
    textSize: 'default',
    buttonSize: 'standard',
    theme: 'system',
    highContrast: false,
    colorScheme: 'fitzgerald',
  },
  profilePhotoUri: null,
};

interface RegistrationContextValue {
  data: RegistrationData;
  update: (patch: Partial<RegistrationData>) => void;
  /** Shallow-merging update for `accessibility`. */
  updateAccessibility: (patch: Partial<AccessibilityPrefs>) => void;
  /** Shallow-merging update for `consents`. */
  updateConsents: (patch: Partial<RegistrationData['consents']>) => void;
  reset: () => void;
}

const RegistrationContext = createContext<RegistrationContextValue | null>(null);

export function RegistrationProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<RegistrationData>(INITIAL_DATA);

  const update = useCallback((patch: Partial<RegistrationData>) => {
    setData((prev) => ({ ...prev, ...patch }));
  }, []);

  const updateAccessibility = useCallback((patch: Partial<AccessibilityPrefs>) => {
    setData((prev) => ({ ...prev, accessibility: { ...prev.accessibility, ...patch } }));
  }, []);

  const updateConsents = useCallback((patch: Partial<RegistrationData['consents']>) => {
    setData((prev) => ({ ...prev, consents: { ...prev.consents, ...patch } }));
  }, []);

  const reset = useCallback(() => setData(INITIAL_DATA), []);

  const value = useMemo(
    () => ({ data, update, updateAccessibility, updateConsents, reset }),
    [data, update, updateAccessibility, updateConsents, reset],
  );

  return <RegistrationContext.Provider value={value}>{children}</RegistrationContext.Provider>;
}

export function useRegistration(): RegistrationContextValue {
  const ctx = useContext(RegistrationContext);
  if (!ctx) {
    throw new Error('useRegistration must be used within a RegistrationProvider');
  }
  return ctx;
}

// ─── Derived helpers ──────────────────────────────────────────────────────────

/** Returns the AAC user's age, or null if the DOB is incomplete / invalid. */
export function computeAge(data: RegistrationData): number | null {
  const day = Number(data.dobDay);
  const month = Number(data.dobMonth);
  const year = Number(data.dobYear);
  if (!day || !month || !year || data.dobYear.length !== 4) return null;
  if (day < 1 || day > 31 || month < 1 || month > 12) return null;

  const today = new Date();
  let age = today.getFullYear() - year;
  const hasHadBirthday =
    today.getMonth() + 1 > month || (today.getMonth() + 1 === month && today.getDate() >= day);
  if (!hasHadBirthday) age -= 1;
  return age >= 0 && age < 130 ? age : null;
}

/** Age-gate decision per the registration spec. */
export type AgeGateOutcome =
  | { kind: 'incomplete' }
  /** "Myself" + under 15 — blocked, must use someone-else path. */
  | { kind: 'blocked_under_15' }
  /** "Myself" 15+, proceed normally. Contact step shows the AAC user's own email/phone. */
  | { kind: 'self_ok' }
  /** "Someone else" + under 18 — guardian verification required. */
  | { kind: 'guardian_required' }
  /** "Someone else" + 18+ — collect setup-person details, no guardian consent copy. */
  | { kind: 'setup_person' };

export function ageGate(data: RegistrationData): AgeGateOutcome {
  const age = computeAge(data);
  if (age === null || !data.role) return { kind: 'incomplete' };

  if (data.role === 'myself') {
    return age < 15 ? { kind: 'blocked_under_15' } : { kind: 'self_ok' };
  }
  return age < 18 ? { kind: 'guardian_required' } : { kind: 'setup_person' };
}

/** Whether Step 5 should display the guardian-specific consent row. */
export function requiresGuardianConsent(data: RegistrationData): boolean {
  return ageGate(data).kind === 'guardian_required';
}

/** Email/phone that get verified in Step 6 — guardian's on path B, AAC user's on path A. */
export function verificationContact(data: RegistrationData): { email: string; phone: string } {
  const useGuardian = data.role === 'someone_else';
  return useGuardian
    ? { email: data.guardianEmail.trim(), phone: data.guardianPhone.trim() }
    : { email: data.email.trim(), phone: data.phone.trim() };
}

/** Maps registration data into the shape the app-wide user store expects. */
export function toUserPayload(data: RegistrationData) {
  const legalName = [data.firstName, data.lastName].map((p) => p.trim()).filter(Boolean).join(' ');
  const display = data.displayName.trim() || data.firstName.trim();
  const useGuardian = data.role === 'someone_else';
  const contactEmail = useGuardian ? data.guardianEmail.trim() : data.email.trim();

  return {
    legalName,
    displayName: display,
    email: contactEmail,
    name: legalName,
    nickname: display,
    age: computeAge(data),
    role: (useGuardian ? 'guardian' : 'myself') as 'myself' | 'guardian',
    useCases: [] as string[],
  };
}
