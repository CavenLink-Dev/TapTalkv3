import * as Haptics from 'expo-haptics';

export function hapticSelection(): Promise<void> {
  return Haptics.selectionAsync().catch(() => undefined) as Promise<void>;
}
