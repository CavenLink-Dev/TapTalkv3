/**
 * Simple test page to navigate to the age consent screen
 * 
 * Usage: Navigate to /onboarding/test-age-consent to see a button
 * that takes you to the age consent flow
 */

import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { colors, spacing, typography } from '../../src/theme/tokens';

export default function TestAgeConsent() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Age Consent Screen Test</Text>
        <Text style={styles.description}>
          This button will navigate you to the age consent onboarding screen
          where you can test all 28 variant combinations.
        </Text>

        <TouchableOpacity
          style={styles.button}
          onPress={() => router.push('/onboarding/age-consent')}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>Test Age Consent Flow</Text>
        </TouchableOpacity>

        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>What to test:</Text>
          <Text style={styles.infoText}>
            • Select "Myself" → try all 4 age ranges{'\n'}
            • Select "Someone Else" → try all age + guardian combos{'\n'}
            • Verify blocked states show red panel{'\n'}
            • Check consent checkboxes work{'\n'}
            • Test provider icons appear after consent{'\n'}
            • Feel the haptic feedback on button presses
          </Text>
        </View>

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    padding: spacing.xl,
    justifyContent: 'center',
  },
  title: {
    fontSize: typography.title,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  description: {
    fontSize: typography.body,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: spacing.xxl,
    lineHeight: 24,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonText: {
    fontSize: typography.subheading,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  infoBox: {
    marginTop: spacing.xxl,
    backgroundColor: colors.softBlue,
    borderRadius: 12,
    padding: spacing.lg,
  },
  infoTitle: {
    fontSize: typography.body,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  infoText: {
    fontSize: typography.callout,
    color: colors.textMuted,
    lineHeight: 20,
  },
  backButton: {
    marginTop: spacing.xl,
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  backButtonText: {
    fontSize: typography.body,
    color: colors.primary,
    fontWeight: '600',
  },
});
