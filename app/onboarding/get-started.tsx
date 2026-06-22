import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { Href, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MascotImage } from '../../src/components/MascotImage';
import { PrimaryButton } from '../../src/components/native/PrimaryButton';
import { SpeechBubble } from '../../src/components/native/SpeechBubble';
import { animation, colors, radii, shadows, spacing, typography } from '../../src/theme/tokens';

const registerRoute = '/registration/01-who' as Href;
const loginRoute = '/auth/login' as Href;

export default function GetStarted() {
  const router = useRouter();
  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -8,
          duration: animation.durFloat,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: animation.durFloat,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [floatAnim]);

  return (
    <SafeAreaView style={styles.container}>
      {/* ── Upper area: speech bubble + floating mascot ─────────────── */}
      <View style={styles.upper}>
        <SpeechBubble tail="bottom" style={styles.bubble}>
          <Text style={styles.bubbleText}>
            Welcome to TapTalk! I'm <Text style={styles.bold}>Clo</Text>.{'\n'}
            <Text style={styles.bold}>Everyone deserves a voice.</Text>
          </Text>
        </SpeechBubble>

        <Animated.View style={{ transform: [{ translateY: floatAnim }] }}>
          <MascotImage mascot="excited_wave" size={190} />
        </Animated.View>
      </View>

      {/* ── Bottom white card ────────────────────────────────────────── */}
      <View style={styles.card}>
        <Text style={styles.title}>WELCOME TO TAPTALK</Text>
        <Text style={styles.tagline}>
          Core communication is{' '}
          <Text style={styles.bold}>free forever</Text>
          {' '}— because everyone deserves to be heard.
        </Text>

        <PrimaryButton
          accessibilityLabel="Get Started"
          label="GET STARTED"
          onPress={() => router.push(registerRoute)}
          style={styles.primaryBtn}
        />

        <PrimaryButton
          accessibilityLabel="I already have an account"
          label="I ALREADY HAVE AN ACCOUNT"
          variant="secondary"
          onPress={() => router.push(loginRoute)}
        />

        <Text style={styles.privacy}>
          Check out this{' '}
          <Text style={styles.privacyLink}>LINK</Text>
          {' '}to see how we store your data
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

  // ── Upper (mascot + speech bubble)
  upper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    gap: spacing.lg,
  },
  bubble: {
    alignSelf: 'stretch',
  },
  bubbleText: {
    fontSize: typography.body,
    fontWeight: '600',
    color: colors.text,
    lineHeight: 24,
  },
  bold: {
    fontWeight: '800',
  },

  // ── Bottom card (white, 40px top radius)
  card: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii.bgCard,
    borderTopRightRadius: radii.bgCard,
    paddingHorizontal: spacing.xl,
    paddingTop: 28,
    paddingBottom: 30,
    gap: spacing.lg,
    ...shadows.cardRaise,
  },
  title: {
    fontSize: typography.heading,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
    letterSpacing: -0.4,
  },
  tagline: {
    fontSize: typography.callout,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 22,
  },
  primaryBtn: {
    marginTop: spacing.xs,
  },
  privacy: {
    textAlign: 'center',
    fontSize: typography.caption,
    color: colors.textTertiary,
  },
  privacyLink: {
    color: colors.primary,
    fontWeight: '700',
  },
});
