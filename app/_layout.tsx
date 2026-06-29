import React from 'react';
import { Stack } from 'expo-router';
import { Text, TextInput, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { ErrorBoundary } from '../src/components/ErrorBoundary';
import { AppProvider } from '../src/context/AppContext';
import { useTapTalkFonts } from '../src/theme/fonts';
import { colors, typography } from '../src/theme/tokens';

const DefaultText = Text as typeof Text & { defaultProps?: { style?: unknown } };
const DefaultTextInput = TextInput as typeof TextInput & { defaultProps?: { style?: unknown } };

DefaultText.defaultProps = DefaultText.defaultProps ?? {};
DefaultText.defaultProps.style = [{ fontFamily: typography.fontFamily }, DefaultText.defaultProps.style];

DefaultTextInput.defaultProps = DefaultTextInput.defaultProps ?? {};
DefaultTextInput.defaultProps.style = [{ fontFamily: typography.fontFamily }, DefaultTextInput.defaultProps.style];

export default function RootLayout() {
  const [fontsLoaded] = useTapTalkFonts();

  // Block the first paint until SF Compact is registered. Without this guard
  // the very first frame would draw with the system fallback and snap to the
  // custom face a tick later — a flash everyone notices.
  if (!fontsLoaded) {
    return <View style={{ flex: 1, backgroundColor: colors.background }} />;
  }

  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <AppProvider>
          <Stack screenOptions={{ headerShown: false }} />
          <StatusBar style="dark" />
        </AppProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}
