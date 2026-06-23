import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

/**
 * Shared, in-memory state for the multi-step registration flow.
 *
 * Each step reads and writes here instead of holding isolated local state, so
 * tapping the "<" back button preserves what the user already entered and the
 * final "Create Account" step has the complete dataset in one object.
 */

export const REGISTRATION_TOTAL_STEPS = 10;

export type RegistrationRole = 'myself' | 'someone_else';

export interface RegistrationData {
  role: RegistrationRole | null;
  firstName: string;
  middleName: string;
  lastName: string;
  username: string;
  dobDay: string;
  dobMonth: string;
  dobYear: string;
  guardianEmail: string;
  email: string;
  phone: string;
  password: string;
  consents: Record<string, boolean>;
}

const INITIAL_DATA: RegistrationData = {
  role: null,
  firstName: '',
  middleName: '',
  lastName: '',
  username: '',
  dobDay: '',
  dobMonth: '',
  dobYear: '',
  guardianEmail: '',
  email: '',
  phone: '',
  password: '',
  consents: {},
};

interface RegistrationContextValue {
  data: RegistrationData;
  update: (patch: Partial<RegistrationData>) => void;
  reset: () => void;
}

const RegistrationContext = createContext<RegistrationContextValue | null>(null);

export function RegistrationProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<RegistrationData>(INITIAL_DATA);

  const update = useCallback((patch: Partial<RegistrationData>) => {
    setData((prev) => ({ ...prev, ...patch }));
  }, []);

  const reset = useCallback(() => setData(INITIAL_DATA), []);

  const value = useMemo(() => ({ data, update, reset }), [data, update, reset]);

  return <RegistrationContext.Provider value={value}>{children}</RegistrationContext.Provider>;
}

export function useRegistration(): RegistrationContextValue {
  const ctx = useContext(RegistrationContext);
  if (!ctx) {
    throw new Error('useRegistration must be used within a RegistrationProvider');
  }
  return ctx;
}

/** Best-effort age from the collected day/month/year fields. Returns null if incomplete. */
export function computeAge(data: RegistrationData): number | null {
  const day = Number(data.dobDay);
  const month = Number(data.dobMonth);
  const year = Number(data.dobYear);
  if (!day || !month || !year || data.dobYear.length !== 4) return null;

  const today = new Date();
  let age = today.getFullYear() - year;
  const hasHadBirthday =
    today.getMonth() + 1 > month || (today.getMonth() + 1 === month && today.getDate() >= day);
  if (!hasHadBirthday) age -= 1;
  return age >= 0 && age < 130 ? age : null;
}

/** Maps the collected registration data into the shape the app's user store expects. */
export function toUserPayload(data: RegistrationData) {
  const legalName = [data.firstName, data.middleName, data.lastName]
    .map((part) => part.trim())
    .filter(Boolean)
    .join(' ');
  const nickname = data.username.trim() || data.firstName.trim();

  return {
    legalName,
    displayName: nickname,
    email: data.email.trim(),
    name: legalName,
    nickname,
    age: computeAge(data),
    role: (data.role === 'someone_else' ? 'guardian' : 'myself') as 'myself' | 'guardian',
    useCases: [] as string[],
  };
}
