/**
 * useSwitchInput — bridges physical switch hardware into ScanningController.
 *
 * Three input paths, chosen by `switchInputSource` in accessibility settings:
 *
 *  1. `keyboard` — a Bluetooth switch interface (AbleNet Blue2, Tecla, Hook+)
 *     or any Made-For-iPhone HID appears to iOS as an external keyboard.
 *     They emit Space / Enter / Arrow keys per their configured mapping.
 *     We attach a passthrough via React Native's `Keyboard` module, plus
 *     a hidden focused TextInput so keydowns don't get swallowed by other
 *     views (see `SwitchInputCapture`).
 *
 *  2. `volume` — the hardware volume rockers, exposed via
 *     `react-native-volume-manager` when installed, or the Expo AV interim
 *     no-op shim when it's not. This is the accessible fallback for users
 *     who don't own a dedicated switch — volume-up = advance, volume-down
 *     = select. We debounce so a single physical press only emits once.
 *
 *  3. `both` — attach both. Volume rockers keep working while a
 *     Bluetooth switch is also paired (common in classrooms where the
 *     student's own switch is on the wheelchair tray but the therapist
 *     needs a fallback on the iPad itself).
 *
 * All handlers are cleaned up on unmount to prevent lingering listeners
 * from firing after the user leaves the scanning screens.
 */

import { useEffect, useRef } from 'react';
import { NativeEventEmitter, NativeModules, Platform } from 'react-native';
import { useAppSelector } from '../../hooks/useAppContext';
import type { ScanningContextValue } from './types';

/** Minimum interval between two consecutive volume-button emits, ms. */
const VOLUME_DEBOUNCE_MS = 150;

/**
 * Key mapping for the `keyboard` input source. We accept a generous set so
 * the same setup works for AbleNet's default (Space/Enter), Tecla's default
 * (arrow keys), and iOS Switch Control's forwarded Space/Enter.
 */
const ADVANCE_KEYS = new Set(['Space', ' ', 'ArrowRight', 'ArrowDown', 'Tab']);
const SELECT_KEYS = new Set(['Enter', 'Return', 'ArrowLeft', 'ArrowUp']);
const PAUSE_KEYS = new Set(['Escape', 'Backspace']);

type VolumeEvent = { volume?: number; direction?: 'up' | 'down' } | undefined;

/**
 * Poll iOS volume through the `VolumeManager` native module if it is linked.
 * We do NOT require the dependency — the app must degrade gracefully on
 * builds that ship without it, so we detect at runtime.
 */
function subscribeVolume(
  onUp: () => void,
  onDown: () => void,
): () => void {
  if (Platform.OS !== 'ios') return () => undefined;
  const module = (NativeModules as Record<string, unknown>).VolumeManager as
    | { addListener?: unknown }
    | undefined;
  if (!module) return () => undefined;
  try {
    const emitter = new NativeEventEmitter(module as never);
    let lastVolume: number | null = null;
    let lastEmitAt = 0;
    const sub = emitter.addListener('RNVMEventVolume', (raw: VolumeEvent) => {
      if (!raw) return;
      const now = Date.now();
      if (now - lastEmitAt < VOLUME_DEBOUNCE_MS) return;
      const v = typeof raw.volume === 'number' ? raw.volume : null;
      if (raw.direction === 'up') {
        lastEmitAt = now;
        onUp();
      } else if (raw.direction === 'down') {
        lastEmitAt = now;
        onDown();
      } else if (v != null && lastVolume != null) {
        // Some builds don't populate `direction` — infer from delta sign.
        if (v > lastVolume + 0.001) {
          lastEmitAt = now;
          onUp();
        } else if (v < lastVolume - 0.001) {
          lastEmitAt = now;
          onDown();
        }
      }
      if (v != null) lastVolume = v;
    });
    return () => {
      try {
        sub.remove();
      } catch {
        /* noop — emitter already torn down */
      }
    };
  } catch {
    // Emitter constructor throws if the module isn't a real event emitter;
    // treat as "volume rocker input unavailable" and no-op.
    return () => undefined;
  }
}

/**
 * Attach the switch-input listeners for the active source. Idempotent
 * across dependency changes — reattaches cleanly when the user flips
 * settings mid-session.
 */
export function useSwitchInput(controller: ScanningContextValue | null): void {
  const enabled = useAppSelector((s) => s.accessibility.scanningEnabled);
  const source = useAppSelector((s) => s.accessibility.switchInputSource);
  const scanMode = useAppSelector((s) => s.accessibility.scanMode);

  // Track pressed state for `inverse` mode — advance only while HELD.
  // A ref (not state) so we don't rerender on every key change.
  const inverseHeldRef = useRef<boolean>(false);

  useEffect(() => {
    if (!enabled || !controller) return;
    if (source !== 'volume' && source !== 'both') return;

    const onUp = () => {
      if (scanMode === 'inverse') {
        // In inverse mode, volume-up starts holding; release ends it.
        // Volume rockers don't emit a distinct "release" — treat every
        // press as an advance tick instead.
        controller.dispatchInput('advance');
        return;
      }
      controller.dispatchInput('advance');
    };
    const onDown = () => controller.dispatchInput('select');

    const unsubscribe = subscribeVolume(onUp, onDown);
    return unsubscribe;
  }, [enabled, source, scanMode, controller]);

  // Keyboard path — Bluetooth switch / iOS Switch Control forwarded keys.
  // React Native does not expose a first-party hardware-key event stream
  // outside of a focused TextInput, so the pairing here is:
  //   - `SwitchInputCapture` renders a hidden, focused input that keeps
  //     iOS routing hardware keys through JS.
  //   - This effect subscribes to the DeviceEventEmitter channel that
  //     capture component publishes to. The pairing keeps the listener
  //     side free of view concerns.
  useEffect(() => {
    if (!enabled || !controller) return;
    if (source !== 'keyboard' && source !== 'both') return;

    const emitter = NativeModules.SwitchInputEventEmitter
      ? new NativeEventEmitter(NativeModules.SwitchInputEventEmitter as never)
      : null;

    // Fallback: a JS-side channel published by `SwitchInputCapture`.
    // We import lazily to avoid a circular dependency at module load.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const bridge = require('./switchInputBridge') as {
      onKey: (cb: (key: string, phase: 'down' | 'up') => void) => () => void;
    };

    const handleKey = (key: string, phase: 'down' | 'up') => {
      if (scanMode === 'inverse') {
        if (ADVANCE_KEYS.has(key)) {
          if (phase === 'down' && !inverseHeldRef.current) {
            inverseHeldRef.current = true;
            controller.dispatchInput('resume');
          } else if (phase === 'up' && inverseHeldRef.current) {
            inverseHeldRef.current = false;
            controller.dispatchInput('pause');
          }
          return;
        }
        if (SELECT_KEYS.has(key) && phase === 'down') {
          controller.dispatchInput('select');
        }
        return;
      }
      // Auto / step mode share the same "one press = one action" model.
      if (phase !== 'down') return;
      if (ADVANCE_KEYS.has(key)) controller.dispatchInput('advance');
      else if (SELECT_KEYS.has(key)) controller.dispatchInput('select');
      else if (PAUSE_KEYS.has(key)) controller.dispatchInput('pause');
    };

    const unsubscribeBridge = bridge.onKey(handleKey);
    const nativeSub = emitter
      ? emitter.addListener('SwitchKeyEvent', (evt: { key?: string; phase?: 'down' | 'up' }) => {
          if (evt && typeof evt.key === 'string') {
            handleKey(evt.key, evt.phase === 'up' ? 'up' : 'down');
          }
        })
      : null;

    return () => {
      unsubscribeBridge();
      if (nativeSub) {
        try {
          nativeSub.remove();
        } catch {
          /* noop */
        }
      }
    };
  }, [enabled, source, scanMode, controller]);
}
