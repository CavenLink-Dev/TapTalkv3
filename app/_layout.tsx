import React from 'react';
import { Stack } from 'expo-router';
import { Text, TextInput } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { ErrorBoundary } from '../src/components/ErrorBoundary';
import { AppProvider } from '../src/context/AppContext';
import { typography } from '../src/theme/tokens';

Text.defaultProps = Text.defaultProps ?? {};
Text.defaultProps.style = [{ fontFamily: typography.fontFamilyDisplay }, Text.defaultProps.style];

TextInput.defaultProps = TextInput.defaultProps ?? {};
TextInput.defaultProps.style = [{ fontFamily: typography.fontFamily }, TextInput.defaultProps.style];

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
