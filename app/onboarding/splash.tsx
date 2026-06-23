import React, { useEffect, useRef } from 'react';
import { Animated, Image, StyleSheet, Text, View } from 'react-native';
import { Href, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LoadingDots } from '../../src/components/LoadingDots';
import { DevSkip } from '../../src/components/DevSkip';
import { colors, spacing, typography } from '../../src/theme/tokens';

const onboardingRoute = '/onboarding/get-started' as Href;

export default function Splash() {
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const logoSlide = useRef(new Animated.Value(16)).current;
  const dotsOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 650, useNativeDriver: true }),
        Animated.spring(logoSlide, { toValue: 0, useNativeDriver: true, tension: 50, friction: 11 }),
      ]),
      Animated.timing(dotsOpacity, { toValue: 1, duration: 450, useNativeDriver: true }),
    ]).start();

    const timer = setTimeout(() => router.replace(onboardingRoute), 2600);
    return () => clearTimeout(timer);
  }, [dotsOpacity, fadeAnim, logoSlide, router]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Animated.View
          style={{ opacity: fadeAnim, transform: [{ translateY: logoSlide }], alignItems: 'center' }}
        >
          <Image
            source={require('../../asset/taptalk_logo.png')}
            style={styles.logo}
            resizeMode="contain"
            accessibilityLabel="TapTalk"
          />
          <Text style={styles.tagline}>Everyone deserves a voice</Text>
        </Animated.View>
      </View>

      <Animated.View style={[styles.footer, { opacity: dotsOpacity }]}>
        <LoadingDots />
      </Animated.View>
      <DevSkip next="/onboarding/get-started" />
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
  logo: {
    width: 240,
    height: 88,
  },
  tagline: {
    marginTop: spacing.lg,
    fontSize: typography.body,
    color: colors.textMuted,
    letterSpacing: 0.2,
  },
  footer: {
    alignItems: 'center',
    paddingBottom: 48,
  },
});
