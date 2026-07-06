/**
 * SwitchInputCapture — invisible, 1x1 focused TextInput that keeps
 * iOS routing hardware key events (Bluetooth switch, iOS Switch Control
 * key emulation, external keyboards) through JavaScript.
 *
 * Why this exists: React Native does not surface `onKeyPress` at a global
 * level; hardware keys are delivered only to the currently focused text
 * input. To operate a switch anywhere in the app, we mount a hidden
 * TextInput that stays focused while scanning is on, and re-focus it
 * after any modal or nav transition that steals focus.
 *
 * The input is accessibility-hidden (VoiceOver skips it) and positioned
 * off-screen so it never receives touches. `caretHidden` and
 * `contextMenuHidden` prevent the iOS text-selection UI from flashing.
 */

import React, { useEffect, useRef } from 'react';
import { AppState as RNAppState, StyleSheet, TextInput, View } from 'react-native';
import { useAppSelector } from '../../hooks/useAppContext';
import { emitKey } from './switchInputBridge';

// Special keys iOS forwards through `onKeyPress`. Space and Enter come
// through as literal characters — normalise those to symbolic names so
// the hook's key sets don't need to know about both forms.
function normaliseKey(raw: string): string {
  if (raw === ' ') return 'Space';
  if (raw === '\n' || raw === '\r') return 'Enter';
  return raw;
}

export function SwitchInputCapture(): React.ReactElement | null {
  const enabled = useAppSelector((s) => s.accessibility.scanningEnabled);
  const source = useAppSelector((s) => s.accessibility.switchInputSource);
  const inputRef = useRef<TextInput | null>(null);

  // Refocus after backgrounding / navigation to keep the key funnel alive.
  // A stale unfocused capture is the #1 cause of "the switch stopped
  // working" bug reports on similar apps.
  useEffect(() => {
    if (!enabled) return;
    if (source !== 'keyboard' && source !== 'both') return;
    const tryFocus = () => {
      const node = inputRef.current;
      if (node) {
        try {
          node.focus();
        } catch {
          /* focus can throw during teardown — ignore */
        }
      }
    };
    tryFocus();
    const t = setInterval(tryFocus, 1500);
    const appSub = RNAppState.addEventListener('change', (state) => {
      if (state === 'active') tryFocus();
    });
    return () => {
      clearInterval(t);
      appSub.remove();
    };
  }, [enabled, source]);

  if (!enabled) return null;
  if (source !== 'keyboard' && source !== 'both') return null;

  return (
    <View
      style={styles.host}
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <TextInput
        ref={inputRef}
        style={styles.input}
        value=""
        caretHidden
        contextMenuHidden
        autoCorrect={false}
        autoCapitalize="none"
        keyboardType="default"
        showSoftInputOnFocus={false}
        onKeyPress={(e) => {
          const key = normaliseKey(e.nativeEvent.key);
          emitKey(key, 'down');
          // iOS does not fire a paired keyup — synthesise one on the next
          // tick so `inverse` scan mode (advance while held) still gets a
          // release event.
          setTimeout(() => emitKey(key, 'up'), 16);
        }}
        onChangeText={() => {
          // Prevent the input from ever accumulating text — a runaway
          // repeated key would otherwise fill the buffer and iOS would
          // start suggesting autocorrect popups on top of the app.
          const node = inputRef.current;
          if (node) node.clear();
        }}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  host: {
    position: 'absolute',
    // Off-screen but still "in window" — iOS requires a laid-out view for
    // focus to hold a hardware-key session.
    top: -1000,
    left: -1000,
    width: 1,
    height: 1,
    opacity: 0,
  },
  input: {
    width: 1,
    height: 1,
    opacity: 0,
  },
});
