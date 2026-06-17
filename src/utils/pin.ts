import * as Crypto from 'expo-crypto';

const PIN_SALT = 'TapTalk_caregiver_pin_v1';

export async function hashPin(raw: string): Promise<string> {
  return Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    `${PIN_SALT}:${raw}`,
  );
}

export async function verifyPin(raw: string, storedHash: string): Promise<boolean> {
  const hash = await hashPin(raw);
  return hash === storedHash;
}
