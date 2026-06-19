/**
 * DEV-ONLY: floating "Skip >" button that advances through the full app flow.
 * Delete this file and all <DevSkip /> usages to remove it entirely.
 *
 * Sequence:
 *   splash → age-consent → adult → pay → login → /(tabs)/talk
 *
 * Each call dispatches whatever state that screen normally writes so guards
 * in index.tsx don't redirect back.
 */

import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { Href, useRouter } from 'expo-router';
import { useAppContext } from '../hooks/useAppContext';

type Route =
  | '/onboarding/age-consent'
  | '/onboarding/adult'
  | '/pay'
  | '/auth/login'
  | '/(tabs)/talk';

interface DevSkipProps {
  /** The route this button should navigate TO (i.e. the next screen). */
  next: Route;
}

export function DevSkip({ next }: DevSkipProps) {
  if (!__DEV__) return null;

  const router = useRouter();
  const { dispatch } = useAppContext();

  const handleSkip = () => {
    // Dispatch whatever the current screen normally writes before leaving.
    if (next === '/pay') {
      // adult.tsx normally calls COMPLETE_ONBOARDING + SET_USER
      dispatch({
        type: 'SET_USER',
        payload: {
          legalName: 'Dev User',
          displayName: 'DevUser',
          name: 'Dev User',
          nickname: 'DevUser',
          role: 'myself',
          useCases: [],
        },
      });
      dispatch({ type: 'COMPLETE_ONBOARDING' });
    } else if (next === '/auth/login') {
      // pay.tsx normally calls COMPLETE_SUBSCRIPTION
      dispatch({ type: 'COMPLETE_SUBSCRIPTION' });
    } else if (next === '/(tabs)/talk') {
      // login.tsx normally calls SIGN_IN
      dispatch({ type: 'SIGN_IN', payload: { email: 'dev@dev.com' } });
    }

    router.replace(next as Href);
  };

  return (
    <Pressable
      onPress={handleSkip}
      style={({ pressed }) => [styles.btn, pressed && styles.pressed]}
      accessibilityLabel={`Dev skip to ${next}`}
      hitSlop={12}
    >
      <Text style={styles.label}>Skip {'>'}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    position: 'absolute',
    bottom: 18,
    right: 18,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    zIndex: 9999,
  },
  pressed: {
    opacity: 0.6,
  },
  label: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
