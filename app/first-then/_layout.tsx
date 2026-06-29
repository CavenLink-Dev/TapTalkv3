import { Stack } from 'expo-router';
import React from 'react';

export default function FirstThenLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
