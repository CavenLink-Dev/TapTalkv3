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
import { colors, radii, spacing, typography } from '../../src/theme/tokens';

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

const SLIDES: TourSlide[] = [
  {
    id: 'talk',
    icon: 'account-voice',
    iconColor: colors.primary,
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

export default function TourScreen() {
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const goTo = (index: number) => {
    scrollRef.current?.scrollTo({ x: index * SCREEN_W, animated: true });
    setActiveIndex(index);
  };

  const handleScroll = (e: { nativeEvent: { contentOffset: { x: number } } }) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_W);
    if (index !== activeIndex) setActiveIndex(index);
  };

  const isLast = activeIndex === SLIDES.length - 1;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topBar}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Skip the tour"
          onPress={() => router.replace(talkRoute)}
          hitSlop={10}
          style={styles.skipBtn}
        >
          <Text style={styles.skipText}>Skip</Text>
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
        {SLIDES.map((s) => (
          <View key={s.id} style={styles.slide}>
            <View style={[styles.iconCircle, { backgroundColor: s.iconBg }]}>
              <MaterialCommunityIcons name={s.icon} size={56} color={s.iconColor} />
            </View>
            <Text style={styles.slideTitle}>{s.title}</Text>
            <Text style={styles.slideDesc}>{s.description}</Text>
          </View>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.dots}>
          {SLIDES.map((s, i) => (
            <View key={s.id} style={[styles.dot, i === activeIndex && styles.dotActive]} />
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
              <Text style={styles.prevText}>Back</Text>
            </Pressable>
          ) : (
            <View style={styles.prevBtn} />
          )}

          <PrimaryButton
            accessibilityLabel={isLast ? 'Enter TapTalk' : 'Next'}
            label={isLast ? 'Enter TapTalk' : 'Next'}
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
    color: colors.textTertiary,
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
    color: colors.text,
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  slideDesc: {
    fontSize: typography.body,
    color: colors.textMuted,
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
    backgroundColor: colors.progressTrack,
  },
  dotActive: {
    width: 22,
    backgroundColor: colors.primary,
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
    color: colors.primary,
  },
  nextBtn: {
    flex: 1,
  },
});
