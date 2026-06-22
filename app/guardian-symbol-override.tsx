import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { GuardianSymbolOverrideScreen } from '../src/features/guardian-settings/GuardianSymbolOverrideScreen';

export default function GuardianSymbolOverrideRoute() {
  const params = useLocalSearchParams<{ conceptId?: string }>();
  return (
    <GuardianSymbolOverrideScreen
      conceptId={params.conceptId ?? 'CONCEPT_HELLO'}
    />
  );
}
