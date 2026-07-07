/**
 * SpeechService — interrupt vs enqueue, error → next utterance.
 * expo-speech is mocked so tests don't need a JS engine with TTS.
 */
jest.mock('expo-speech', () => {
  const listeners: Array<(name: 'onDone' | 'onError' | 'onStopped') => void> = [];
  return {
    speak: jest.fn((_text: string, opts: { onDone?: () => void; onError?: (e: unknown) => void; onStopped?: () => void }) => {
      // Simulate async completion on the next tick
      setTimeout(() => opts?.onDone?.(), 0);
      listeners.push((name) => (name === 'onDone' ? opts?.onDone?.() : name === 'onError' ? opts?.onError?.(new Error('x')) : opts?.onStopped?.()));
    }),
    stop: jest.fn(),
    getAvailableVoicesAsync: jest.fn(async () => []),
    VoiceQuality: { Enhanced: 'Enhanced', Default: 'Default' },
  };
});

import * as Speech from 'expo-speech';
import { SpeechService } from '../SpeechService';

describe('SpeechService', () => {
  beforeEach(() => {
    (Speech.speak as jest.Mock).mockClear();
    (Speech.stop as jest.Mock).mockClear();
    SpeechService.stop();
  });

  it('speaks a single utterance', async () => {
    SpeechService.say('hello');
    expect(Speech.speak).toHaveBeenCalledTimes(1);
    expect((Speech.speak as jest.Mock).mock.calls[0][0]).toBe('hello');
  });

  it('interrupt mode drops queued utterances and stops current speech', () => {
    SpeechService.say('one', 'enqueue');
    SpeechService.say('two', 'interrupt');
    expect(Speech.stop).toHaveBeenCalled();
    // Second speak call is for 'two' — 'one' should be discarded
    const lastCall = (Speech.speak as jest.Mock).mock.calls.pop();
    expect(lastCall?.[0]).toBe('two');
  });

  it('empty text is ignored', () => {
    SpeechService.say('   ');
    expect(Speech.speak).not.toHaveBeenCalled();
  });

  it('notifies speaking-state subscribers', () => {
    const cb = jest.fn();
    const off = SpeechService.onSpeakingChange(cb);
    SpeechService.say('hi');
    expect(cb).toHaveBeenCalledWith(true);
    off();
  });
});
