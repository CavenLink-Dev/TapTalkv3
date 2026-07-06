/**
 * Audio session configuration for TTS. Lets TapTalk speak while background
 * audio (music, podcasts) is playing by ducking those sources instead of
 * pausing them. Called once from SpeechService.init().
 */
import { setAudioModeAsync } from 'expo-audio';

export async function configureAudioSession(): Promise<void> {
  await setAudioModeAsync({
    playsInSilentMode: true,
    // 'duckOthers' lowers background music/podcasts instead of pausing them,
    // and works on both iOS and Android in the current expo-audio API.
    interruptionMode: 'duckOthers',
  });
}
