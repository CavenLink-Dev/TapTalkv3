import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { Text, TextInput, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { ErrorBoundary } from '../src/components/ErrorBoundary';
import { AppProvider } from '../src/context/AppContext';
import { useAppContext } from '../src/hooks/useAppContext';
import { useSession } from '../src/hooks/useSession';
import { useTapTalkFonts } from '../src/theme/fonts';
import { useTheme } from '../src/theme/useTheme';
import { colorsLight, typography } from '../src/theme/tokens';
import { SpeechService } from '../src/features/speech/SpeechService';

// Keep the iOS/Android splash up until fonts are ready. Prevents the
// black-frame flash between splash-hide and first render.
SplashScreen.preventAutoHideAsync().catch(() => undefined);
import {
  ScanningProvider,
  SwitchInputCapture,
  useScanning,
  useSwitchInput,
} from '../src/features/scanning';

const DefaultText = Text as typeof Text & { defaultProps?: { style?: unknown } };
const DefaultTextInput = TextInput as typeof TextInput & { defaultProps?: { style?: unknown } };

DefaultText.defaultProps = DefaultText.defaultProps ?? {};
DefaultText.defaultProps.style = [{ fontFamily: typography.fontFamily }, DefaultText.defaultProps.style];

DefaultTextInput.defaultProps = DefaultTextInput.defaultProps ?? {};
DefaultTextInput.defaultProps.style = [{ fontFamily: typography.fontFamily }, DefaultTextInput.defaultProps.style];

function ThemeShell() {
  const t = useTheme();
  const { state, dispatch } = useAppContext();
  const { user } = useSession();

  useEffect(() => {
    if (!user) return;
    if (state.signedIn && state.user.email === (user.email ?? '')) return;
    dispatch({
      type: 'SIGN_IN',
      payload: {
        email: user.email ?? state.user.email,
        displayName: state.user.displayName || user.user_metadata?.display_name,
        rememberLogin: state.rememberLogin,
      },
    });
  }, [dispatch, state.rememberLogin, state.signedIn, state.user.displayName, state.user.email, user]);

  // Splash is the first route and already waits for hydration before
  // navigating — no need to block the stack on a blank frame here.
  return (
    <>
      <Stack screenOptions={{ headerShown: false }} />
      <StatusBar style={t.isDark ? 'light' : 'dark'} />
      {/* Invisible key capture + switch-input listener. Only render the
          listener bridge when scanning is on — but the components
          themselves gate internally so this stays cheap either way. */}
      <SwitchInputCapture />
      <SwitchInputBridge />
    </>
  );
}

/**
 * A wrapper that hooks up the switch-input event stream to the current
 * ScanningController. Lives inside the provider so it can call `useScanning`.
 */
function SwitchInputBridge(): null {
  const controller = useScanning();
  useSwitchInput(controller);
  return null;
}

export default function RootLayout() {
  const [fontsLoaded] = useTapTalkFonts();

  // Initialise the audio session once — needed before the first tile-tap TTS.
  useEffect(() => { SpeechService.init(); }, []);

  // Hide the native splash only after fonts are ready — no black frame,
  // no fallback-face flash.
  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync().catch(() => undefined);
  }, [fontsLoaded]);

  // Native splash is still up; render nothing rather than a black View.
  if (!fontsLoaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ErrorBoundary>
        <SafeAreaProvider>
          <AppProvider>
            {/* ScanningProvider must live INSIDE AppProvider — it reads
                accessibility flags via useAppSelector. It sits OUTSIDE the
                Stack so scan state survives navigation transitions. */}
            <ScanningProvider>
              <ThemeShell />
            </ScanningProvider>
          </AppProvider>
        </SafeAreaProvider>
      </ErrorBoundary>
    </GestureHandlerRootView>
  );
}
