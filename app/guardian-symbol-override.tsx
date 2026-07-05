import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { GuardianSymbolOverrideScreen } from '../src/features/guardian-settings/GuardianSymbolOverrideScreen';
import { useTheme } from '../src/theme/useTheme';
import { radii, spacing, typography } from '../src/theme/tokens';

/**
 * Guardian symbol override route.
 *
 * A missing concept ID must NEVER silently fall back to a default concept —
 * the old `?? 'CONCEPT_HELLO'` fallback meant a malformed link could edit
 * the wrong symbol without anyone noticing. Instead we show a calm error
 * state with a clear way back.
 */
export default function GuardianSymbolOverrideRoute() {
  const params = useLocalSearchParams<{ conceptId?: string }>();
  const router = useRouter();
  const t = useTheme();
  const conceptId = typeof params.conceptId === 'string' ? params.conceptId.trim() : '';

  if (!conceptId) {
    return (
      <View style={[styles.errorScreen, { backgroundColor: t.colors.background }]}>
        <Ionicons name="alert-circle-outline" size={44} color={t.colors.textMuted} />
        <Text style={[styles.errorTitle, { color: t.colors.text }]} accessibilityRole="header">
          No symbol selected
        </Text>
        <Text style={[styles.errorBody, { color: t.colors.textMuted }]}>
          This page needs to know which symbol to change, but none was
          provided. Go back and choose a symbol first.
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back"
          onPress={() => router.back()}
          style={({ pressed }) => [
            styles.backButton,
            { backgroundColor: t.colors.primary, opacity: pressed ? 0.85 : 1 },
          ]}
        >
          <Text style={[styles.backLabel, { color: '#FFFFFF' }]}>Back</Text>
        </Pressable>
      </View>
    );
  }

  return <GuardianSymbolOverrideScreen conceptId={conceptId} />;
}

const styles = StyleSheet.create({
  errorScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.md,
  },
  errorTitle: {
    fontSize: typography.heading,
    fontWeight: '800',
    textAlign: 'center',
  },
  errorBody: {
    fontSize: typography.body,
    textAlign: 'center',
    lineHeight: 22,
  },
  backButton: {
    marginTop: spacing.md,
    minHeight: 50,
    minWidth: 120,
    borderRadius: radii.button,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  backLabel: {
    fontSize: typography.body,
    fontWeight: '700',
  },
});
