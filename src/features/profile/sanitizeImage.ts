/**
 * Sanitize any user-picked image before persisting.
 *  • Rejects files > 8MB.
 *  • Resizes to 512×512 max and re-encodes (strips EXIF).
 *  • Names the file by content hash (dedupe + stable across renames).
 *  • Writes into the app sandbox — never keeps the picker URI.
 */
import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system';
import * as Crypto from 'expo-crypto';

const DEST_DIR = `${FileSystem.documentDirectory}custom-symbols/`;
const MAX_BYTES = 8 * 1024 * 1024;
const OUTPUT_SIZE = 512;

export class SanitizeImageError extends Error {
  constructor(public code: 'too_large' | 'read_failed' | 'encode_failed', msg: string) {
    super(msg);
  }
}

export async function sanitizeImage(uri: string): Promise<string> {
  const info = await FileSystem.getInfoAsync(uri, { size: true });
  if (!info.exists) throw new SanitizeImageError('read_failed', 'Image not found');
  if ((info.size ?? 0) > MAX_BYTES) {
    throw new SanitizeImageError('too_large', 'Image over 8MB');
  }

  let result: ImageManipulator.ImageResult;
  try {
    result = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: OUTPUT_SIZE, height: OUTPUT_SIZE } }],
      { compress: 0.85, format: ImageManipulator.SaveFormat.PNG },
    );
  } catch (e) {
    throw new SanitizeImageError('encode_failed', (e as Error).message);
  }

  const hash = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    result.uri,
  );
  const dest = `${DEST_DIR}${hash.slice(0, 16)}.png`;
  await FileSystem.makeDirectoryAsync(DEST_DIR, { intermediates: true });
  const existing = await FileSystem.getInfoAsync(dest);
  if (!existing.exists) {
    await FileSystem.moveAsync({ from: result.uri, to: dest });
  } else {
    await FileSystem.deleteAsync(result.uri, { idempotent: true });
  }
  return dest;
}
