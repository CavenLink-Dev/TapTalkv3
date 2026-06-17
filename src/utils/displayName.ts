export const DISPLAY_NAME_MAX = 12;

// Small starter blocklist; substring match catches common variants.
const BLOCKED_WORDS = [
  'fuck', 'shit', 'bitch', 'cunt', 'dick', 'piss', 'crap', 'damn',
  'bastard', 'asshole', 'slut', 'whore', 'nigger', 'nigga', 'fag',
  'retard', 'rape', 'porn', 'sex', 'penis', 'vagina', 'boob',
];

export interface DisplayNameResult {
  valid: boolean;
  error: string | null;
}

export function validateDisplayName(raw: string): DisplayNameResult {
  const value = raw.trim();

  if (value.length === 0) {
    return { valid: false, error: null };
  }
  if (value.length > DISPLAY_NAME_MAX) {
    return { valid: false, error: 'Max 12 characters allowed' };
  }
  if (/[^a-zA-Z0-9]/.test(value)) {
    return { valid: false, error: 'Letters and numbers only' };
  }

  const lower = value.toLowerCase();
  if (BLOCKED_WORDS.some((word) => lower.includes(word))) {
    return { valid: false, error: 'Inappropriate display name' };
  }

  return { valid: true, error: null };
}
