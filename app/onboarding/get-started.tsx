import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Href, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MascotImage } from '../../src/components/MascotImage';
import { PrimaryButton } from '../../src/components/native/PrimaryButton';
import { colors, spacing, typography } from '../../src/theme/tokens';

const registerRoute = '/registration/01-who' as Href;
const loginRoute = '/auth/login' as Href;

export default function GetStarted() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <MascotImage mascot="excited_wave" size={160} />

        <Text style={styles.title}>Welcome to TapTalk</Text>
        <Text style={styles.tagline}>
          Everyone deserves a voice — which is why we don't charge for it.
        </Text>

        <PrimaryButton
          accessibilityLabel="Get Started"
          label="Get Started"
          onPress={() => router.push(registerRoute)}
          style={styles.primaryBtn}
        />

        <PrimaryButton
          accessibilityLabel="I already have an account"
          label="I already have an account"
          variant="secondary"
          onPress={() => router.push(loginRoute)}
          style={styles.secondaryBtn}
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
    paddingHorizontal: spacing.xl,
    gap: spacing.lg,
  },
  title: {
    fontSize: typography.title,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
  },
  tagline: {
    fontSize: typography.body,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 24,
  },
  primaryBtn: {
    width: '100%',
    marginTop: spacing.lg,
  },
  secondaryBtn: {
    width: '100%',
  },
});
