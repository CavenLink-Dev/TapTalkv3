import React from 'react';
import { Stack } from 'expo-router';
import { Text, TextInput } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { ErrorBoundary } from '../src/components/ErrorBoundary';
import { AppProvider } from '../src/context/AppContext';
import { typography } from '../src/theme/tokens';

const DefaultText = Text as typeof Text & { defaultProps?: { style?: unknown } };
const DefaultTextInput = TextInput as typeof TextInput & { defaultProps?: { style?: unknown } };

DefaultText.defaultProps = DefaultText.defaultProps ?? {};
DefaultText.defaultProps.style = [{ fontFamily: typography.fontFamilyDisplay }, DefaultText.defaultProps.style];

DefaultTextInput.defaultProps = DefaultTextInput.defaultProps ?? {};
DefaultTextInput.defaultProps.style = [{ fontFamily: typography.fontFamily }, DefaultTextInput.defaultProps.style];

export default function RootLayout() {
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
