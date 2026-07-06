/**
 * One-time nudge on first launch: if no Enhanced-quality English voice is
 * installed, deep-link the caregiver to iOS Voice download.
 */
import { Alert } from 'react-native';
import * as Linking from 'expo-linking';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SpeechService } from './SpeechService';

const DONE_KEY = '@TapTalk_voice_check_done';

export async function checkVoicesOnce(languagePrefix = 'en'): Promise<void> {
  const done = await AsyncStorage.getItem(DONE_KEY);
  if (done === '1') return;

  const enhanced = await SpeechService.getEnhancedVoices(languagePrefix);
  await AsyncStorage.setItem(DONE_KEY, '1');
  if (enhanced.length > 0) return;

  Alert.alert(
    'Clearer voice available',
    'For sharper speech, install an Enhanced voice from iOS Settings → Accessibility → Spoken Content → Voices.',
    [
      { text: 'Later', style: 'cancel' },
      { text: 'Open Settings', onPress: () => Linking.openSettings().catch(() => undefined) },
    ],
  );
}
