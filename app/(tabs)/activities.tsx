import React, { useEffect, useState } from 'react';
import {
  ImageBackground,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { Href, useRouter } from 'expo-router';
import { Screen } from '../../src/components/native/Screen';
import { useReduceMotion } from '../../src/hooks/useReduceMotion';
import { colors, radii, spacing, typography } from '../../src/theme/tokens';
import { hapticSelection } from '../../src/utils/haptics';

// ─── Activity content ───────────────────────────────────────────────────────
// Each card flips to reveal a short description + Start. Start routes into the
// game's own start overlay (per activity_implementation_rules.md §1 — every
// game must show its difficulty picker before play begins).

interface ActivityCard {
  id: string;
  route: Href;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  iconColor: string;
  iconBg: string;
  name: string;
  image?: number;
  description: string;
}

const ACTIVITY_LIST: ActivityCard[] = [
  {
    id: 'shape-match',
    route: '/activities/shape-match' as Href,
    icon: 'shapes-outline',
    iconColor: '#34C759',
    iconBg: '#E8FAE8',
    name: 'Shape Match',
    image: require('../../assets/activities/shape-match.png'),
    description: 'Drag each shape into its matching outline.',
  },
  {
    id: 'colour-pop',
    route: '/activities/colour-pop' as Href,
    icon: 'color-palette-outline',
    iconColor: '#A855F7',
    iconBg: '#E9D5FF',
    name: 'Colour Pop',
    description: 'Tap each shape that matches the colour word.',
  },
  {
    id: 'memory-match',
    route: '/activities/memory-match' as Href,
    icon: 'eye-outline',
    iconColor: colors.primary,
    iconBg: '#E6F4FD',
    name: 'Memory Match',
    image: require('../../assets/activities/memory-match.png'),
    description: 'Watch the shape, then tap the one you saw.',
  },
  {
    id: 'picture-match',
    route: '/activities/picture-match' as Href,
    icon: 'text-outline',
    iconColor: '#BD73FF',
    iconBg: '#F3EAFF',
    name: 'Picture Match',
    description: 'Read the word, then tap the matching picture.',
  },
  {
    id: 'count-along',
    route: '/activities/count-along' as Href,
    icon: 'calculator-outline',
    iconColor: '#FF9500',
    iconBg: '#FFF4E0',
    name: 'Count Along',
    description: 'Count the dots, then choose the right number.',
  },
];

const CARD_GAP = spacing.sm;
const SIDE_PADDING = spacing.lg * 2;
const CARD_HEIGHT = 260;
const HERO_HEIGHT = 140;
const FLIP_DURATION = 420;
const FLIP_REDUCED_DURATION = 180;

export default function ActivitiesScreen() {
  const router = useRouter();
  const { width: screenWidth } = useWindowDimensions();
  const cardWidth = (screenWidth - SIDE_PADDING - CARD_GAP) / 2;
  const [flippedId, setFlippedId] = useState<string | null>(null);

  return (
    <Screen title="Activities" subtitle="Practice focus, memory, language, and numbers.">
      <View style={styles.grid}>
        {ACTIVITY_LIST.map((activity) => (
          <ActivityFlipCard
            key={activity.id}
            activity={activity}
            width={cardWidth}
            isFlipped={flippedId === activity.id}
            onToggle={() =>
              setFlippedId((prev) => (prev === activity.id ? null : activity.id))
            }
            onStart={() => {
              hapticSelection();
              router.push(activity.route);
            }}
          />
        ))}
      </View>
    </Screen>
  );
}

// ─── Flip card ──────────────────────────────────────────────────────────────

interface FlipCardProps {
  activity: ActivityCard;
  width: number;
  isFlipped: boolean;
  onToggle: () => void;
  onStart: () => void;
}

function ActivityFlipCard({ activity, width, isFlipped, onToggle, onStart }: FlipCardProps) {
  const reduceMotion = useReduceMotion();
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(isFlipped ? 1 : 0, {
      duration: reduceMotion ? FLIP_REDUCED_DURATION : FLIP_DURATION,
      easing: Easing.bezier(0.4, 0, 0.2, 1),
    });
  }, [isFlipped, reduceMotion, progress]);

  const frontStyle = useAnimatedStyle(() => {
    if (reduceMotion) return { opacity: 1 - progress.value };
    return {
      transform: [
        { perspective: 1000 },
        { rotateY: `${progress.value * 180}deg` },
      ],
    };
  });

  const backStyle = useAnimatedStyle(() => {
    if (reduceMotion) return { opacity: progress.value };
    return {
      transform: [
        { perspective: 1000 },
        { rotateY: `${180 + progress.value * 180}deg` },
      ],
    };
  });

  const handleToggle = () => {
    hapticSelection();
    onToggle();
  };

  return (
    <View style={[styles.cardOuter, { width, height: CARD_HEIGHT }]}>
      {/* Front face — hero band + title */}
      <Animated.View
        pointerEvents={isFlipped ? 'none' : 'auto'}
        style={[styles.face, frontStyle]}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${activity.name}. Tap for details.`}
          accessibilityState={{ expanded: false }}
          onPress={handleToggle}
          style={({ pressed }) => [styles.faceInner, pressed && styles.pressed]}
        >
          {activity.image ? (
            <ImageBackground
              source={activity.image}
              style={[styles.hero, { backgroundColor: activity.iconBg }]}
              imageStyle={styles.heroImage}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.hero, styles.heroFallback, { backgroundColor: activity.iconBg }]}>
              <Ionicons
                name={activity.icon}
                size={56}
                color={activity.iconColor}
                accessibilityElementsHidden
                importantForAccessibility="no"
              />
            </View>
          )}
          <View style={styles.frontFooter}>
            <Text style={styles.frontName} numberOfLines={1}>
              {activity.name}
            </Text>
          </View>
        </Pressable>
      </Animated.View>

      {/* Back face — title, description, Start */}
      <Animated.View
        pointerEvents={isFlipped ? 'auto' : 'none'}
        style={[styles.face, backStyle]}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${activity.name} details. Tap to close.`}
          accessibilityState={{ expanded: true }}
          onPress={handleToggle}
          style={({ pressed }) => [
            styles.faceInner,
            styles.backFace,
            { backgroundColor: activity.iconBg },
            pressed && styles.pressed,
          ]}
        >
          <View style={styles.backTop}>
            <Text style={styles.backName} numberOfLines={1}>
              {activity.name}
            </Text>
            <Text style={styles.backDescription} numberOfLines={3}>
              {activity.description}
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Start ${activity.name}`}
            onPress={onStart}
            style={({ pressed }) => [styles.startBtn, pressed && styles.startBtnPressed]}
            hitSlop={8}
          >
            <Text
              style={styles.startBtnText}
              maxFontSizeMultiplier={1.4}
              numberOfLines={1}
            >
              Start
            </Text>
          </Pressable>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: CARD_GAP,
  },
  cardOuter: {
    // 3D scene root — children rotate around its centre.
  },
  face: {
    ...StyleSheet.absoluteFillObject,
    backfaceVisibility: 'hidden',
  },
  faceInner: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    overflow: 'hidden',
  },
  pressed: {
    opacity: 0.88,
  },

  // ── Front face ──
  hero: {
    height: HERO_HEIGHT,
    width: '100%',
  },
  heroFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroImage: {
    borderTopLeftRadius: radii.card,
    borderTopRightRadius: radii.card,
  },
  frontFooter: {
    flex: 1,
    paddingHorizontal: spacing.md,
    justifyContent: 'center',
  },
  frontName: {
    fontSize: typography.subheading,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.3,
  },

  // ── Back face ── one tinted surface, no header band, no labels
  backFace: {
    padding: spacing.lg,
    justifyContent: 'space-between',
  },
  backTop: {
    gap: spacing.sm,
  },
  backName: {
    fontSize: typography.subheading,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.3,
  },
  backDescription: {
    fontSize: typography.callout,
    color: colors.text,
    lineHeight: 20,
    opacity: 0.78,
  },
  startBtn: {
    alignSelf: 'flex-end',
    minHeight: 44,
    paddingHorizontal: spacing.xl,
    paddingVertical: 10,
    borderRadius: radii.pill,
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  startBtnPressed: {
    opacity: 0.85,
  },
  startBtnText: {
    fontSize: typography.callout,
    fontWeight: '800',
    color: colors.textOnDark,
    letterSpacing: -0.2,
  },
});
