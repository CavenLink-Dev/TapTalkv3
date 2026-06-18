const PIN_SALT = 'TapTalk_caregiver_pin_v1';

export async function hashPin(raw: string): Promise<string> {
  const data = new TextEncoder().encode(`${PIN_SALT}:${raw}`);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function verifyPin(raw: string, storedHash: string): Promise<boolean> {
  const hash = await hashPin(raw);
  return hash === storedHash;
}
