import * as Speech from 'expo-speech';

export const useSpeech = () => {
  const speak = (text: string, options?: Speech.SpeechOptions) => {
    Speech.speak(text, options);
  };

  const stop = () => {
    Speech.stop();
  };

  const isSpeakingAsync = async () => {
    return await Speech.isSpeakingAsync();
  };

  return {
    speak,
    stop,
    isSpeakingAsync,
  };
};
