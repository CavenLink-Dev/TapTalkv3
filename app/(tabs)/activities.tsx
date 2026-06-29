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
// Each card flips to reveal Instruction + Rule + Start. The Start button still
// routes into the game's own start overlay (per activity_implementation_rules.md
// §1 — every game must show its difficulty picker before play begins).

interface ActivityCard {
  id: string;
  route: Href;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  iconColor: string;
  iconBg: string;
  name: string;
  image?: number;
  instruction: string[];
  rule: string[];
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
    instruction: ['Drag each shape into its matching outline.'],
    rule: ['Take your time. No score, no clock.'],
  },
  {
    id: 'memory-match',
    route: '/activities/memory-match' as Href,
    icon: 'eye-outline',
    iconColor: colors.primary,
    iconBg: '#E6F4FD',
    name: 'Memory Match',
    image: require('../../assets/activities/memory-match.png'),
    instruction: ['Watch the shape, then tap the one you saw.'],
    rule: ['Wrong picks return gently. Try again.'],
  },
  {
    id: 'picture-match',
    route: '/activities/picture-match' as Href,
    icon: 'text-outline',
    iconColor: '#BD73FF',
    iconBg: '#F3EAFF',
    name: 'Picture Match',
    instruction: ['Read the word, then tap the matching picture.'],
    rule: ['Sound is off by default. Turn it on in the header.'],
  },
  {
    id: 'count-along',
    route: '/activities/count-along' as Href,
    icon: 'calculator-outline',
    iconColor: '#FF9500',
    iconBg: '#FFF4E0',
    name: 'Count Along',
    instruction: ['Count the dots, then choose the right number.'],
    rule: ['Every level reshuffles. Just count again.'],
  },
];

const CARD_GAP = spacing.sm;
const SIDE_PADDING = spacing.lg * 2;
const CARD_HEIGHT = 290;
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
      {/* Front face */}
      <Animated.View
        pointerEvents={isFlipped ? 'none' : 'auto'}
        style={[styles.face, frontStyle]}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Show ${activity.name} details`}
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
              <Ionicons name={activity.icon} size={56} color={activity.iconColor} />
            </View>
          )}
          <View style={styles.frontFooter}>
            <View style={styles.frontFooterText}>
              <Text style={styles.cardTitle} numberOfLines={1}>
                {activity.name}
              </Text>
              <View style={styles.detailsRow}>
                <Ionicons
                  name="chevron-forward-circle-outline"
                  size={18}
                  color={colors.textMuted}
                />
                <Text style={styles.detailsText}>Details</Text>
              </View>
            </View>
            <Ionicons
              name="information-circle-outline"
              size={28}
              color={colors.success}
              accessibilityElementsHidden
              importantForAccessibility="no"
            />
          </View>
        </Pressable>
      </Animated.View>

      {/* Back face */}
      <Animated.View
        pointerEvents={isFlipped ? 'auto' : 'none'}
        style={[styles.face, backStyle]}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Hide ${activity.name} details`}
          accessibilityState={{ expanded: true }}
          onPress={handleToggle}
          style={({ pressed }) => [styles.faceInner, pressed && styles.pressed]}
        >
          <View style={styles.backHeader}>
            <Text style={styles.cardTitle} numberOfLines={1}>
              {activity.name}
            </Text>
            <View style={styles.detailsRow}>
              <Ionicons name="chevron-down-circle-outline" size={18} color={colors.textMuted} />
              <Text style={styles.detailsText}>Details</Text>
            </View>
          </View>
          <View style={[styles.backBody, { backgroundColor: activity.iconBg }]}>
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Instruction</Text>
              {activity.instruction.map((line, i) => (
                <Text key={`i-${i}`} style={styles.sectionLine}>
                  {`${i + 1}. ${line}`}
                </Text>
              ))}
            </View>
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Rule</Text>
              {activity.rule.map((line, i) => (
                <Text key={`r-${i}`} style={styles.sectionLine}>
                  {`•  ${line}`}
                </Text>
              ))}
            </View>
            <View style={styles.startWrap}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Start ${activity.name}`}
                onPress={onStart}
                style={({ pressed }) => [styles.startBtn, pressed && styles.startBtnPressed]}
                hitSlop={8}
              >
                <Text style={styles.startBtnText}>Start</Text>
              </Pressable>
            </View>
          </View>
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  frontFooterText: {
    flex: 1,
    gap: 4,
  },
  cardTitle: {
    fontSize: typography.heading,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.4,
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailsText: {
    fontSize: typography.callout,
    color: colors.textMuted,
    fontWeight: '600',
  },

  // ── Back face ──
  backHeader: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    gap: 4,
    backgroundColor: colors.surface,
  },
  backBody: {
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
    gap: spacing.sm,
  },
  section: {
    gap: 2,
  },
  sectionLabel: {
    fontSize: typography.caption,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: 0.2,
  },
  sectionLine: {
    fontSize: typography.caption,
    lineHeight: 17,
    color: colors.textMuted,
  },
  startWrap: {
    flex: 1,
    alignItems: 'flex-end',
    justifyContent: 'flex-end',
  },
  startBtn: {
    minWidth: 96,
    minHeight: 44,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  startBtnPressed: {
    opacity: 0.85,
  },
  startBtnText: {
    fontSize: typography.body,
    fontWeight: '800',
    color: colors.textOnDark,
    letterSpacing: -0.2,
  },
});
