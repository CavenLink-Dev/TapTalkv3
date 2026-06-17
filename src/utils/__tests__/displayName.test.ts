import { validateDisplayName, DISPLAY_NAME_MAX } from '../displayName';

describe('validateDisplayName', () => {
  it('returns invalid with no error for empty string', () => {
    expect(validateDisplayName('')).toEqual({ valid: false, error: null });
  });

  it('returns invalid with no error for whitespace-only input', () => {
    expect(validateDisplayName('   ')).toEqual({ valid: false, error: null });
  });

  it('accepts a valid alphanumeric name', () => {
    expect(validateDisplayName('Alex')).toEqual({ valid: true, error: null });
  });

  it('accepts a name at exactly the max length', () => {
    const name = 'A'.repeat(DISPLAY_NAME_MAX);
    expect(validateDisplayName(name)).toEqual({ valid: true, error: null });
  });

  it('rejects a name exceeding the max length', () => {
    const name = 'A'.repeat(DISPLAY_NAME_MAX + 1);
    expect(validateDisplayName(name)).toEqual({
      valid: false,
      error: 'Max 12 characters allowed',
    });
  });

  it('rejects names with special characters', () => {
    expect(validateDisplayName('Alex!')).toEqual({
      valid: false,
      error: 'Letters and numbers only',
    });
  });

  it('rejects names with spaces', () => {
    expect(validateDisplayName('A B')).toEqual({
      valid: false,
      error: 'Letters and numbers only',
    });
  });

  it('rejects names with underscores', () => {
    expect(validateDisplayName('a_b')).toEqual({
      valid: false,
      error: 'Letters and numbers only',
    });
  });

  it('accepts names with digits', () => {
    expect(validateDisplayName('User123')).toEqual({ valid: true, error: null });
  });

  it('trims leading and trailing whitespace before validating', () => {
    expect(validateDisplayName('  Alex  ')).toEqual({ valid: true, error: null });
  });

  it('rejects a blocked word', () => {
    expect(validateDisplayName('damn')).toEqual({
      valid: false,
      error: 'Inappropriate display name',
    });
  });

  it('rejects a blocked word as substring', () => {
    expect(validateDisplayName('ohcrap')).toEqual({
      valid: false,
      error: 'Inappropriate display name',
    });
  });

  it('rejects blocked words case-insensitively', () => {
    expect(validateDisplayName('DAMN')).toEqual({
      valid: false,
      error: 'Inappropriate display name',
    });
  });

  it('checks length before profanity (long profane string)', () => {
    const long = 'damn'.repeat(10);
    expect(validateDisplayName(long)).toEqual({
      valid: false,
      error: 'Max 12 characters allowed',
    });
  });

  it('checks special chars before profanity', () => {
    expect(validateDisplayName('d@mn')).toEqual({
      valid: false,
      error: 'Letters and numbers only',
    });
  });

  it('DISPLAY_NAME_MAX is 12', () => {
    expect(DISPLAY_NAME_MAX).toBe(12);
  });
});
