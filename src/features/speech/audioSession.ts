/**
 * Audio session configuration for TTS. Lets TapTalk speak while background
 * audio (music, podcasts) is playing by ducking those sources instead of
 * pausing them. Called once from SpeechService.init().
 */
import { Audio, InterruptionModeIOS, InterruptionModeAndroid } from 'expo-audio';

export async function configureAudioSession(): Promise<void> {
  await Audio.setAudioModeAsync({
    playsInSilentModeIOS: true,
    interruptionModeIOS: InterruptionModeIOS.DuckOthers,
    shouldDuckAndroid: true,
    interruptionModeAndroid: InterruptionModeAndroid.DuckOthers,
    staysActiveInBackground: false,
  });
}
