import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { Href, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { PrimaryButton } from '../../src/components/native/PrimaryButton';
import { colors, spacing, typography } from '../../src/theme/tokens';

const registerRoute = '/registration/01-who' as Href;
const loginRoute = '/auth/login' as Href;

const HIGHLIGHTS = [
  { icon: 'chatbubbles-outline' as const, text: 'Symbol and text communication that speaks for you' },
  { icon: 'lock-closed-outline' as const, text: 'Private and secure — your words stay yours' },
  { icon: 'heart-outline' as const, text: 'Core communication is free, forever' },
];

export default function GetStarted() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.hero}>
        <Animated.View entering={FadeInDown.duration(400)} style={styles.logoWrap}>
          <Image
            source={require('../../asset/taptalk_logo.png')}
            style={styles.logo}
            resizeMode="contain"
            accessibilityLabel="TapTalk"
          />
        </Animated.View>

        <Animated.Text entering={FadeInDown.duration(400).delay(80)} style={styles.headline}>
          Everyone deserves a voice
        </Animated.Text>
        <Animated.Text entering={FadeInDown.duration(400).delay(140)} style={styles.subhead}>
          A clear, dependable communication tool built for adults who use AAC.
        </Animated.Text>

        <View style={styles.highlights}>
          {HIGHLIGHTS.map((h, i) => (
            <Animated.View
              key={h.text}
              entering={FadeInDown.duration(400).delay(220 + i * 70)}
              style={styles.highlightRow}
            >
              <View style={styles.highlightIcon}>
                <Ionicons name={h.icon} size={20} color={colors.primary} />
              </View>
              <Text style={styles.highlightText}>{h.text}</Text>
            </Animated.View>
          ))}
        </View>
      </View>

      <View style={styles.footer}>
        <PrimaryButton
          accessibilityLabel="Get started and create an account"
          label="Get started"
          onPress={() => router.push(registerRoute)}
        />
        <PrimaryButton
          accessibilityLabel="I already have an account"
          label="I already have an account"
          variant="secondary"
          onPress={() => router.push(loginRoute)}
        />
        <Text style={styles.privacy}>
          By continuing you agree to our{' '}
          <Text style={styles.privacyLink}>Terms</Text> and{' '}
          <Text style={styles.privacyLink}>Privacy Policy</Text>.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  hero: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  logoWrap: {
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  logo: {
    width: 200,
    height: 72,
  },
  headline: {
    fontSize: 34,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.6,
    lineHeight: 40,
  },
  subhead: {
    marginTop: spacing.md,
    fontSize: typography.body,
    color: colors.textMuted,
    lineHeight: 24,
  },
  highlights: {
    marginTop: spacing.xxl,
    gap: spacing.lg,
  },
  highlightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  highlightIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#EAF5FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  highlightText: {
    flex: 1,
    fontSize: typography.callout,
    color: colors.text,
    lineHeight: 21,
  },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
    gap: spacing.md,
  },
  privacy: {
    textAlign: 'center',
    fontSize: typography.caption,
    color: colors.textTertiary,
    lineHeight: 18,
  },
  privacyLink: {
    color: colors.primary,
    fontWeight: '700',
  },
});
