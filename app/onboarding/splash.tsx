import React, { useEffect, useRef } from 'react';
import { Animated, Image, StyleSheet, View } from 'react-native';
import { Href, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LoadingDots } from '../../src/components/LoadingDots';
import { DevSkip } from '../../src/components/DevSkip';
import { MascotImage } from '../../src/components/MascotImage';
import { colors } from '../../src/theme/tokens';

const onboardingRoute = '/onboarding/age-consent' as Href;

export default function Splash() {
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const logoSlide = useRef(new Animated.Value(30)).current;
  const dotsOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.parallel([
        Animated.spring(logoSlide, { toValue: 0, useNativeDriver: true, tension: 50, friction: 10 }),
        Animated.timing(dotsOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
      ]),
    ]).start();

    const timer = setTimeout(() => router.replace(onboardingRoute), 2800);
    return () => clearTimeout(timer);
  }, [dotsOpacity, fadeAnim, logoSlide, router]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Animated.View style={{ opacity: fadeAnim }}>
          <MascotImage mascot="excited_wave" size={200} />
        </Animated.View>

        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: logoSlide }],
            marginTop: 28,
          }}
        >
          <Image
            source={require('../../asset/taptalk_logo.png')}
            style={styles.logo}
            resizeMode="contain"
            accessibilityLabel="TapTalk logo"
          />
        </Animated.View>
      </View>

      <Animated.View style={[styles.footer, { opacity: dotsOpacity }]}>
        <LoadingDots />
      </Animated.View>
      <DevSkip next="/onboarding/age-consent" />
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
  footer: {
    alignItems: 'center',
    paddingBottom: 40,
  },
  logo: {
    width: 220,
    height: 80,
  },
});
