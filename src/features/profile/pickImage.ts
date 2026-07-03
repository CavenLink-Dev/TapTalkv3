/**
 * Profile image picking — permission-on-demand wrapper around expo-image-picker.
 *
 * Privacy rule: TapTalk never requests photo or camera access until the user
 * actually chooses "Upload from Library" or "Take Photo". Everything is guarded
 * so that, on a build where the native module isn't linked yet, the caller gets
 * a clean `unavailable` outcome and can keep offering the non-photo options
 * (symbol, colour, avatar) instead of crashing.
 *
 * The picker crops to a square (avatars are circular) and compresses lightly.
 */

import * as ImagePicker from 'expo-image-picker';

export type PickOutcome =
  | { status: 'picked'; uri: string }
  | { status: 'cancelled' }
  | { status: 'denied' }
  | { status: 'unavailable' };

const PICK_OPTIONS: ImagePicker.ImagePickerOptions = {
  mediaTypes: ['images'],
  allowsEditing: true,
  aspect: [1, 1],
  quality: 0.85,
};

export async function pickFromLibrary(): Promise<PickOutcome> {
  try {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return { status: 'denied' };
    const result = await ImagePicker.launchImageLibraryAsync(PICK_OPTIONS);
    const uri = result.canceled ? undefined : result.assets?.[0]?.uri;
    return uri ? { status: 'picked', uri } : { status: 'cancelled' };
  } catch {
    // Native module not present in this build, or the picker failed to start.
    return { status: 'unavailable' };
  }
}

export async function takePhoto(): Promise<PickOutcome> {
  try {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) return { status: 'denied' };
    const result = await ImagePicker.launchCameraAsync(PICK_OPTIONS);
    const uri = result.canceled ? undefined : result.assets?.[0]?.uri;
    return uri ? { status: 'picked', uri } : { status: 'cancelled' };
  } catch {
    return { status: 'unavailable' };
  }
}
