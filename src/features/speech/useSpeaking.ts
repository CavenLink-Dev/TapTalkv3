/**
 * Subscribe to SpeechService's speaking state for UI reactions
 * (e.g. animate the message strip while TTS is active).
 */
import { useEffect, useState } from 'react';
import { SpeechService } from './SpeechService';

export function useSpeaking(): boolean {
  const [speaking, setSpeaking] = useState(false);
  useEffect(() => SpeechService.onSpeakingChange(setSpeaking), []);
  return speaking;
}
