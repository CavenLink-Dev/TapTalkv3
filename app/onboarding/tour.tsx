import React, { useRef, useState } from 'react';
import {
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Href, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { PrimaryButton } from '../../src/components/native/PrimaryButton';
import { spacing, typography } from '../../src/theme/tokens';
import { useTheme } from '../../src/theme/useTheme';

const talkRoute = '/(tabs)/talk' as Href;
const { width: SCREEN_W } = Dimensions.get('window');

interface TourSlide {
  id: string;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  iconColor: string;
  iconBg: string;
  title: string;
  description: string;
}

function buildSlides(primary: string): TourSlide[] {
  return [
    {
      id: 'talk',
      icon: 'account-voice',
      iconColor: primary,
      iconBg: '#E6F4FD',
      title: 'Talk',
      description:
        'Your communication board. Build a message from symbols or text, then speak it aloud with one tap.',
    },
    {
      id: 'activity',
      icon: 'lightbulb-on',
      iconColor: '#FF9500',
      iconBg: '#FFF4E0',
      title: 'Activity',
      description:
        'Practice and therapy-style exercises to build and maintain language skills at your own pace.',
    },
    {
      id: 'settings',
      icon: 'cog',
      iconColor: '#34A853',
      iconBg: '#E8FAEE',
      title: 'Settings',
      description:
        'Shape TapTalk around you — boards, planners, timers and access controls, all in one place.',
    },
    {
      id: 'profile',
      icon: 'account',
      iconColor: '#7C5CFF',
      iconBg: '#F0EAFF',
      title: 'Profile',
      description:
        'Manage your account, voice, support settings and subscription whenever you need to.',
    },
  ];
}

export default function TourScreen() {
  const router = useRouter();
  const t = useTheme();
  const slides = buildSlides(t.colors.primary);
  const scrollRef = useRef<ScrollView>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const finishTour = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace(talkRoute);
  };

  const goTo = (index: number) => {
    scrollRef.current?.scrollTo({ x: index * SCREEN_W, animated: true });
    setActiveIndex(index);
  };

  const handleScroll = (e: { nativeEvent: { contentOffset: { x: number } } }) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_W);
    if (index !== activeIndex) setActiveIndex(index);
  };

  const isLast = activeIndex === slides.length - 1;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: t.colors.background }]}>
      <View style={styles.topBar}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Skip the tour"
          onPress={finishTour}
          hitSlop={10}
          style={styles.skipBtn}
        >
          <Text style={[styles.skipText, { color: t.colors.textTertiary }]}>Skip</Text>
        </Pressable>
      </View>

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        style={styles.pager}
      >
        {slides.map((s) => (
          <View key={s.id} style={styles.slide}>
            <View style={[styles.iconCircle, { backgroundColor: s.iconBg }]}>
              <MaterialCommunityIcons name={s.icon} size={56} color={s.iconColor} />
            </View>
            <Text style={[styles.slideTitle, { color: t.colors.text }]}>{s.title}</Text>
            <Text style={[styles.slideDesc, { color: t.colors.textMuted }]}>{s.description}</Text>
          </View>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.dots}>
          {slides.map((s, i) => (
            <View
              key={s.id}
              style={[
                styles.dot,
                { backgroundColor: t.colors.progressTrack },
                i === activeIndex && [styles.dotActive, { backgroundColor: t.colors.primary }],
              ]}
            />
          ))}
        </View>

        <View style={styles.navRow}>
          {activeIndex > 0 ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Previous"
              onPress={() => goTo(activeIndex - 1)}
              style={styles.prevBtn}
            >
              <Text style={[styles.prevText, { color: t.colors.primary }]}>Back</Text>
            </Pressable>
          ) : (
            <View style={styles.prevBtn} />
          )}

          <PrimaryButton
            accessibilityLabel={isLast ? 'Enter TapTalk' : 'Next'}
            label={isLast ? 'Enter TapTalk' : 'Next'}
            onPress={isLast ? finishTour : () => goTo(activeIndex + 1)}
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
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
  },
  skipBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  skipText: {
    fontSize: typography.callout,
    fontWeight: '700',
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
    gap: spacing.xl,
  },
  iconCircle: {
    width: 116,
    height: 116,
    borderRadius: 58,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  slideTitle: {
    fontSize: typography.title,
    fontWeight: '800',
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  slideDesc: {
    fontSize: typography.body,
    textAlign: 'center',
    lineHeight: 25,
    maxWidth: 320,
  },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
    gap: spacing.xl,
  },
  dots: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotActive: {
    width: 22,
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  prevBtn: {
    minWidth: 64,
    paddingVertical: spacing.sm,
  },
  prevText: {
    fontSize: typography.body,
    fontWeight: '700',
  },
  nextBtn: {
    flex: 1,
  },
});
