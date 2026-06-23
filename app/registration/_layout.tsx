import React from 'react';
import { Stack } from 'expo-router';
import { RegistrationProvider } from '../../src/context/RegistrationContext';

export default function RegistrationLayout() {
  return (
    <RegistrationProvider>
      <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }} />
    </RegistrationProvider>
  );
}
