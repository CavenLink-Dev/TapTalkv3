import React, { useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Href, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { MascotImage } from '../../src/components/MascotImage';
import { PrimaryButton } from '../../src/components/native/PrimaryButton';
import { SpeechBubble } from '../../src/components/native/SpeechBubble';
import { colors, radii, shadows, spacing, typography } from '../../src/theme/tokens';

const talkRoute = '/(tabs)/talk' as Href;
const { width: SCREEN_W } = Dimensions.get('window');

interface TourSlide {
  id: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  iconColor: string;
  iconBg: string;
  title: string;
  description: string;
  mascotLine: string;
}

const SLIDES: TourSlide[] = [
  {
    id: 'talk',
    icon: 'chatbubble-ellipses-outline',
    iconColor: colors.primary,
    iconBg: '#E6F4FD',
    title: 'TALK',
    description:
      'Your AAC communication board. Tap symbols to build a sentence, then tap to speak it aloud — free forever.',
    mascotLine: 'This is where your voice lives. Tap any symbol to say a word!',
  },
  {
    id: 'activity',
    icon: 'bulb-outline',
    iconColor: '#FF9500',
    iconBg: '#FFF4E0',
    title: 'ACTIVITY',
    description:
      'Cognitive and therapy-style activities — memory games, picture matching, and more. Premium feature.',
    mascotLine: 'Fun challenges to keep your mind sharp. Premium unlocks more!',
  },
  {
    id: 'settings',
    icon: 'settings-outline',
    iconColor: '#5CD65C',
    iconBg: '#E8FAE8',
    title: 'SETTINGS',
    description:
      'First-Then boards, daily planners, visual timers, and app preferences — all in one place.',
    mascotLine: 'Customise how TapTalk works for you right here.',
  },
  {
    id: 'profile',
    icon: 'person-circle-outline',
    iconColor: '#BD73FF',
    iconBg: '#F3EAFF',
    title: 'PROFILE',
    description:
      'Your account, voice settings, caregiver controls, and subscription status. Always free to access.',
    mascotLine: "That's your space. Edit your name, voice, and settings anytime.",
  },
];

export default function TourScreen() {
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const dotScale = useRef(SLIDES.map(() => new Animated.Value(1))).current;

  const goTo = (index: number) => {
    scrollRef.current?.scrollTo({ x: index * SCREEN_W, animated: true });
    setActiveIndex(index);
    const dot = dotScale[index];
    if (!dot) return;
    Animated.sequence([
      Animated.timing(dot, { toValue: 1.4, duration: 150, useNativeDriver: true }),
      Animated.timing(dot, { toValue: 1.0, duration: 150, useNativeDriver: true }),
    ]).start();
  };

  const handleScroll = (e: { nativeEvent: { contentOffset: { x: number } } }) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_W);
    if (index !== activeIndex) setActiveIndex(index);
  };

  const isLast = activeIndex === SLIDES.length - 1;
  const slide = SLIDES[activeIndex] ?? SLIDES[0]!;

  return (
    <SafeAreaView style={styles.container}>
      {/* Skip always visible */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Skip tour"
        onPress={() => router.replace(talkRoute)}
        style={styles.skipBtn}
      >
        <Text style={styles.skipText}>SKIP</Text>
      </Pressable>

      {/* Slide pager */}
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        style={styles.pager}
      >
        {SLIDES.map((s) => (
          <View key={s.id} style={styles.slide}>
            {/* Icon pill */}
            <View style={[styles.iconCircle, { backgroundColor: s.iconBg }]}>
              <Ionicons name={s.icon} size={52} color={s.iconColor} />
            </View>

            <Text style={styles.slideTitle}>{s.title}</Text>
            <Text style={styles.slideDesc}>{s.description}</Text>
          </View>
        ))}
      </ScrollView>

      {/* Bottom card */}
      <View style={styles.card}>
        {/* Speech bubble */}
        <SpeechBubble tail="bottom" style={styles.bubble}>
          <Text style={styles.bubbleText}>{slide.mascotLine}</Text>
        </SpeechBubble>

        {/* Mascot */}
        <MascotImage mascot="happy_smile" size={80} style={styles.mascot} />

        {/* Dots */}
        <View style={styles.dots}>
          {SLIDES.map((s, i) => {
            const dot = dotScale[i];
            return (
              <Pressable key={s.id} onPress={() => goTo(i)} accessibilityRole="button" accessibilityLabel={`Slide ${i + 1}`}>
                <Animated.View
                  style={[
                    styles.dot,
                    i === activeIndex && styles.dotActive,
                    dot ? { transform: [{ scale: dot }] } : undefined,
                  ]}
                />
              </Pressable>
            );
          })}
        </View>

        {/* Navigation row */}
        <View style={styles.navRow}>
          {activeIndex > 0 ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Previous slide"
              onPress={() => goTo(activeIndex - 1)}
              style={styles.prevBtn}
            >
              <Ionicons name="chevron-back" size={20} color={colors.primary} />
              <Text style={styles.prevText}>Back</Text>
            </Pressable>
          ) : (
            <View style={styles.prevBtn} />
          )}

          <PrimaryButton
            accessibilityLabel={isLast ? 'Enter the app' : 'Next slide'}
            label={isLast ? "LET'S GO!" : 'NEXT'}
            onPress={isLast ? () => router.replace(talkRoute) : () => goTo(activeIndex + 1)}
            style={styles.nextBtn}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  skipBtn: {
    position: 'absolute',
    top: 56,
    right: spacing.xl,
    zIndex: 10,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    ...shadows.card,
  },
  skipText: {
    fontSize: typography.caption,
    fontWeight: '800',
    color: colors.textTertiary,
    letterSpacing: 0.4,
  },

  pager: {
    flex: 1,
  },
  slide: {
    width: SCREEN_W,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: 60,
    gap: spacing.xl,
  },

  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },

  slideTitle: {
    fontSize: typography.title,
    fontWeight: '900',
    color: colors.text,
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  slideDesc: {
    fontSize: typography.callout,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 320,
  },

  // Bottom card
  card: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii.bgCard,
    borderTopRightRadius: radii.bgCard,
    paddingHorizontal: spacing.xl,
    paddingTop: 20,
    paddingBottom: 28,
    alignItems: 'center',
    gap: spacing.lg,
    ...shadows.cardRaise,
  },

  bubble: {
    alignSelf: 'stretch',
  },
  bubbleText: {
    fontSize: typography.callout,
    fontWeight: '600',
    color: colors.text,
    lineHeight: 22,
    textAlign: 'center',
  },
  mascot: {
    marginTop: -spacing.lg,
  },

  dots: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.border,
  },
  dotActive: {
    width: 22,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },

  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    gap: spacing.md,
  },
  prevBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minWidth: 70,
  },
  prevText: {
    fontSize: typography.callout,
    fontWeight: '700',
    color: colors.primary,
  },
  nextBtn: {
    flex: 1,
  },
});
