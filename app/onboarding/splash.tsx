import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Href, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TapTalkMascot } from '../../src/components/TapTalkMascot';
import { PrimaryButton } from '../../src/components/native/PrimaryButton';
import { colors, spacing, typography } from '../../src/theme/tokens';

const onboardingRoute = '/onboarding' as Href;

export default function Splash() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <TapTalkMascot variant="head" style={styles.mascot} />
        <Text style={styles.title}>TapTalk</Text>
        <Text style={styles.tagline}>Your voice, your way.</Text>
      </View>
      <View style={styles.footer}>
        <PrimaryButton
          accessibilityLabel="Start TapTalk onboarding"
          label="Continue"
          onPress={() => router.push(onboardingRoute)}
        />
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  mascot: {
    width: 180,
    height: 180,
  },
  title: {
    marginTop: 24,
    color: colors.primary,
    fontSize: 38,
    fontWeight: '900',
  },
  tagline: {
    marginTop: 8,
    color: colors.textMuted,
    fontSize: typography.body,
    fontWeight: '700',
  },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
  },
});
