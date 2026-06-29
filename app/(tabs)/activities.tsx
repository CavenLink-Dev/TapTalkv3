<<<<<<< HEAD
import React, { useEffect, useState } from 'react';
import {
=======
/**
 * Activities screen — 2-column flip-card grid.
 *
 * Front: hero + name (Law #1/#2 — simple first).
 * Back:  description + Play — tap anywhere on back to flip back (Law #3/#7).
 * Spring physics, calmed for everyday use; crossfade for Reduce Motion (Law #16/#18).
 */
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
>>>>>>> b864a0719673f73b7fa18ae82eaca4d8e465b2da
  ImageBackground,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
<<<<<<< HEAD
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
=======
import { Ionicons } from '@expo/vector-icons';
import { Href, useRouter } from 'expo-router';
import { Screen } from '../../src/components/native/Screen';
import { animation as anim, colors, radii, spacing, typography } from '../../src/theme/tokens';
import { hapticLight, hapticSelection } from '../../src/utils/haptics';
import { useReduceMotion } from '../../src/hooks/useReduceMotion';

// ─── Types ─────────────────────────────────────────────────────────────────────
>>>>>>> b864a0719673f73b7fa18ae82eaca4d8e465b2da

interface ActivityCard {
  id: string;
  route: Href;
  iconColor: string;
  iconBg: string;
  name: string;
<<<<<<< HEAD
  image?: number;
  instruction: string[];
  rule: string[];
=======
  description: string;
  tag: string;
  image?: number;
  hero?: 'colour-pop';
>>>>>>> b864a0719673f73b7fa18ae82eaca4d8e465b2da
}

// ─── Data ──────────────────────────────────────────────────────────────────────

const ACTIVITY_LIST: ActivityCard[] = [
  {
    id: 'shape-match',
    route: '/activities/shape-match' as Href,
<<<<<<< HEAD
    icon: 'shapes-outline',
    iconColor: '#34C759',
    iconBg: '#E8FAE8',
    name: 'Shape Match',
    image: require('../../assets/activities/shape-match.png'),
    instruction: ['Drag each shape into its matching outline.'],
    rule: ['Take your time. No score, no clock.'],
=======
    iconColor: '#34C759',
    iconBg: '#E8FAE8',
    name: 'Shape Match',
    description: 'Match shapes to their outlines.',
    tag: 'Visual',
    image: require('../../assets/activities/shape-match.png'),
  },
  {
    id: 'colour-pop',
    route: '/activities/colour-pop' as Href,
    iconColor: '#E53935',
    iconBg: '#FFE9E7',
    name: 'Colour Pop',
    description: 'Tap the shapes that match the colour word.',
    tag: 'Colours',
    hero: 'colour-pop',
>>>>>>> b864a0719673f73b7fa18ae82eaca4d8e465b2da
  },
  {
    id: 'memory-match',
    route: '/activities/memory-match' as Href,
    iconColor: colors.primary,
    iconBg: '#E6F4FD',
    name: 'Memory Match',
<<<<<<< HEAD
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
=======
    description: 'A shape appears then hides. Pick what you saw.',
    tag: 'Memory',
    image: require('../../assets/activities/memory-match.png'),
  },
];

// ─── Layout ────────────────────────────────────────────────────────────────────

const CARD_GAP    = spacing.sm;      //  8 pt
const SIDE_PAD    = spacing.lg * 2;  // 32 pt total
const CARD_HEIGHT = 244;             // fixed — both faces share this frame
const HERO_HEIGHT = 130;             // front hero image
const PERSPECTIVE = 1200;            // 3-D depth

// ─── ColourPopHero ─────────────────────────────────────────────────────────────

function ColourPopHero({ bg }: { bg: string }) {
  return (
    <View
      style={[
        styles.hero,
        styles.colourPopHero,
        { height: HERO_HEIGHT, backgroundColor: bg },
      ]}
    >
      <View style={styles.colourPopWordPill}>
        <Text style={styles.colourPopWord}>RED</Text>
      </View>
      <View style={[styles.popShape, styles.popCircle,   { backgroundColor: '#E53935', left: 18,  bottom: 18 }]} />
      <View style={[styles.popShape, styles.popSquare,   { backgroundColor: '#1E88E5', right: 20, top: 18    }]} />
      <View style={[styles.popShape, styles.popTriangle, { borderBottomColor: '#43A047', right: 42, bottom: 18 }]} />
      <View style={[styles.popShape, styles.popDot,      { backgroundColor: '#FDD835', left: 96,  bottom: 28 }]} />
    </View>
  );
}

// ─── FlipCard ──────────────────────────────────────────────────────────────────

function FlipCard({
  activity,
  cardWidth,
  index,
  isFlipped,
  onFlip,
  onPlay,
}: {
  activity: ActivityCard;
  cardWidth: number;
  index: number;
  isFlipped: boolean;
  onFlip: () => void;   // toggles — works for both open and close
  onPlay: () => void;
}) {
  const reduceMotion  = useReduceMotion();
  const flipAnim      = useRef(new Animated.Value(0)).current;
  const mountProgress = useRef(new Animated.Value(0)).current;
  const pressScale    = useRef(new Animated.Value(1)).current;

  // ── Staggered mount entrance ──────────────────────────────────────────────
  useEffect(() => {
    if (reduceMotion) { mountProgress.setValue(1); return; }
    Animated.sequence([
      Animated.delay(index * anim.stagRow),
      Animated.spring(mountProgress, {
        toValue: 1,
        useNativeDriver: true,
        damping: 26,   // calmed — no overshoot
        stiffness: 300,
        mass: 1,
      }),
    ]).start();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Flip ─────────────────────────────────────────────────────────────────
  const isMounted = useRef(false);
  useEffect(() => {
    const toValue = isFlipped ? 1 : 0;
    if (!isMounted.current) {
      isMounted.current = true;
      flipAnim.setValue(toValue);
      return;
    }
    if (reduceMotion) {
      // Crossfade only — no rotation (Law #18)
      Animated.timing(flipAnim, {
        toValue,
        duration: anim.durReduced,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
      return;
    }
    // Calmed spring — no visible bounce, just a clean arc
    Animated.spring(flipAnim, {
      toValue,
      useNativeDriver: true,
      damping: 22,
      stiffness: 200,
      mass: 1.0,
    }).start();
  }, [isFlipped, reduceMotion]);

  // ── Press scale (front face only, subtle) ─────────────────────────────────
  const handlePressIn  = () => {
    if (reduceMotion || isFlipped) return;
    Animated.spring(pressScale, {
      toValue: 0.975,           // very subtle — card has weight, not drama
      useNativeDriver: true,
      damping: 18,
      stiffness: 460,
      mass: 0.9,
    }).start();
  };
  const handlePressOut = () => {
    if (reduceMotion) return;
    Animated.spring(pressScale, {
      toValue: 1,
      useNativeDriver: true,
      damping: 20,
      stiffness: 360,
      mass: 1,
    }).start();
  };

  // ── Interpolations ────────────────────────────────────────────────────────
  const mountTranslateY = mountProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [16, 0],    // shorter travel — calmer entrance
  });

  // 3-D flip: front 0°→180°, back 180°→360°
  const frontRotateY = flipAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });
  const backRotateY = flipAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['180deg', '360deg'],
  });

  // Reduce Motion crossfade — sharp cut at midpoint, no gradual dissolve
  const frontOpacityRM = flipAnim.interpolate({
    inputRange: [0, 0.49, 0.51, 1],
    outputRange: [1, 1, 0, 0],
  });
  const backOpacityRM = flipAnim.interpolate({
    inputRange: [0, 0.49, 0.51, 1],
    outputRange: [0, 0, 1, 1],
  });

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <Animated.View
      style={{
        width: cardWidth,
        height: CARD_HEIGHT,
        opacity: mountProgress,
        transform: [{ translateY: mountTranslateY }],
      }}
    >
      {/* ────────────── FRONT FACE ────────────────────────────────────── */}
      <Animated.View
        pointerEvents={isFlipped ? 'none' : 'auto'}
        style={[
          StyleSheet.absoluteFill,
          reduceMotion
            ? { opacity: frontOpacityRM, transform: [{ scale: pressScale }] }
            : {
                backfaceVisibility: 'hidden',
                transform: [
                  { perspective: PERSPECTIVE },
                  { rotateY: frontRotateY },
                  { scale: pressScale },
                ],
              },
        ]}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${activity.name}, ${activity.tag}`}
          accessibilityHint="Tap to see description and play"
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          onPress={() => { hapticLight(); onFlip(); }}
          style={[styles.face, { backgroundColor: colors.surface }]}
        >
          {/* Hero */}
          {activity.hero === 'colour-pop' ? (
            <ColourPopHero bg={activity.iconBg} />
          ) : activity.image ? (
            <ImageBackground
              source={activity.image}
              style={[styles.hero, { height: HERO_HEIGHT, backgroundColor: activity.iconBg }]}
              imageStyle={styles.heroImage}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.hero, { height: HERO_HEIGHT, backgroundColor: activity.iconBg }]} />
          )}

          {/* Front body: tag + name only (Law #1 — simple first) */}
          <View style={styles.frontBody}>
            <View style={[styles.tagPill, { backgroundColor: activity.iconBg }]}>
              <Text style={[styles.tagText, { color: activity.iconColor }]}>
                {activity.tag}
              </Text>
            </View>
            <Text style={styles.frontName} numberOfLines={1}>
              {activity.name}
            </Text>
            {/* Micro-cue that content is behind the card */}
            <View style={styles.flipCue}>
              <Ionicons name="chevron-forward-circle-outline" size={11} color={colors.textTertiary} />
              <Text style={styles.flipCueText}>Details</Text>
            </View>
          </View>
        </Pressable>
      </Animated.View>

      {/* ────────────── BACK FACE ─────────────────────────────────────── */}
      {/*
        Entire back face is one Pressable → tap anywhere to flip back (Law #7/#13).
        Play button is a nested Pressable — inner one wins the touch, outer won't fire.
      */}
      <Animated.View
        pointerEvents={isFlipped ? 'auto' : 'none'}
        style={[
          StyleSheet.absoluteFill,
          reduceMotion
            ? { opacity: backOpacityRM }
            : {
                backfaceVisibility: 'hidden',
                transform: [
                  { perspective: PERSPECTIVE },
                  { rotateY: backRotateY },
                ],
              },
        ]}
      >
        <Pressable
          onPress={() => { hapticLight(); onFlip(); }}
          accessibilityRole="button"
          accessibilityLabel={`${activity.name} details. Tap to flip back.`}
          accessibilityHint="Tap Play to start, or tap anywhere else to go back"
          style={[styles.face, { backgroundColor: activity.iconBg }]}
        >
          <View style={styles.backContent}>

            {/* Header: tag + close icon (visual affordance, not its own button) */}
            <View style={styles.backHeader}>
              <View style={[styles.tagPill, styles.tagPillBack]}>
                <Text style={[styles.tagText, { color: activity.iconColor }]}>
                  {activity.tag}
                </Text>
              </View>
              {/* ✕ is a visual cue only — the whole card taps to close */}
              <Ionicons name="close-circle" size={20} color={colors.textTertiary} />
            </View>

            {/* Description — the disclosed detail (Law #3/#5) */}
            <View style={styles.backBody}>
              <Text style={styles.backName}>{activity.name}</Text>
              <Text style={styles.backDescription} numberOfLines={4}>
                {activity.description}
              </Text>
            </View>

            {/*
              Play — nested Pressable. Inner wins: tapping Play navigates,
              tapping anywhere else on the card closes the back (Law #7/#20).
            */}
            <Pressable
              onPress={() => { hapticSelection(); onPlay(); }}
              accessibilityRole="button"
              accessibilityLabel={`Play ${activity.name}`}
              style={({ pressed }) => [
                styles.playButton,
                { backgroundColor: activity.iconColor },
                pressed && { opacity: 0.85 },
              ]}
            >
              <Ionicons name="play" size={14} color="#FFFFFF" />
              <Text style={styles.playButtonText}>Play</Text>
            </Pressable>

          </View>
        </Pressable>
      </Animated.View>
    </Animated.View>
  );
}

// ─── ActivitiesScreen ──────────────────────────────────────────────────────────
>>>>>>> b864a0719673f73b7fa18ae82eaca4d8e465b2da

export default function ActivitiesScreen() {
  const router = useRouter();
  const { width: screenWidth } = useWindowDimensions();
<<<<<<< HEAD
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
=======
  const compact   = screenWidth < 390;
  const cardWidth = compact
    ? screenWidth - SIDE_PAD
    : (screenWidth - SIDE_PAD - CARD_GAP) / 2;

  // Single card open at a time; tapping same card or its back toggles it closed
  const [flippedId, setFlippedId] = useState<string | null>(null);

  const handleFlip = (id: string) => {
    setFlippedId(prev => (prev === id ? null : id));
  };

  return (
    <Screen title="Activities" subtitle="Practice focus, colours, shapes, and memory.">
      <Text style={styles.sectionTitle}>{ACTIVITY_LIST.length} activities</Text>
      <View style={styles.grid}>
        {ACTIVITY_LIST.map((activity, i) => (
          <FlipCard
            key={activity.id}
            activity={activity}
            cardWidth={cardWidth}
            index={i}
            isFlipped={flippedId === activity.id}
            onFlip={() => handleFlip(activity.id)}
            onPlay={() => {
              setFlippedId(null);
>>>>>>> b864a0719673f73b7fa18ae82eaca4d8e465b2da
              router.push(activity.route);
            }}
          />
        ))}
      </View>
    </Screen>
  );
}

<<<<<<< HEAD
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
=======
// ─── Styles ────────────────────────────────────────────────────────────────────
>>>>>>> b864a0719673f73b7fa18ae82eaca4d8e465b2da

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: CARD_GAP,
  },
<<<<<<< HEAD
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
=======
  sectionTitle: {
    marginBottom: spacing.sm,
    fontSize: typography.caption,
    fontWeight: '800',
    color: colors.textMuted,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },

  // Shared face — both front and back use this as base
  face: {
    flex: 1,
    borderRadius: radii.card,
    overflow: 'hidden',
  },

  // ── Hero (front)
  hero: {
    width: '100%',
  },
  heroImage: {
    borderTopLeftRadius: radii.card,
    borderTopRightRadius: radii.card,
  },

  // ── Front body
  frontBody: {
    flex: 1,
    padding: spacing.md,
    gap: 4,
  },
  tagPill: {
    alignSelf: 'flex-start',
    borderRadius: radii.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  tagPillBack: {
    // Reads cleanly on any iconBg colour
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
  },
  tagText: {
    fontSize: typography.eyebrow,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  frontName: {
    fontSize: typography.callout,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.2,
    marginTop: 2,
>>>>>>> b864a0719673f73b7fa18ae82eaca4d8e465b2da
  },
  flipCue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 3,
  },
  flipCueText: {
    fontSize: 10,
    color: colors.textTertiary,
    letterSpacing: 0.3,
  },

  // ── Back face
  backContent: {
    flex: 1,
    padding: spacing.md,
    paddingTop: spacing.md,
  },
  backHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  backBody: {
    flex: 1,
    justifyContent: 'center',
    gap: 6,
    marginBottom: spacing.sm,
  },
  backName: {
    // Deliberately smaller than heading — fits the card width cleanly
    fontSize: typography.body,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.2,
  },
  backDescription: {
    fontSize: typography.caption,
    color: colors.textMuted,
    lineHeight: 18,
  },
  // Primary action — 48 pt tall, full card width (Law #20)
  playButton: {
    height: 48,
    borderRadius: radii.button,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  playButtonText: {
    fontSize: typography.body,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },

  // ── ColourPop hero shapes
  colourPopHero: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
    borderTopLeftRadius: radii.card,
    borderTopRightRadius: radii.card,
  },
  colourPopWordPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radii.pill,
    backgroundColor: '#FFFFFF',
  },
  colourPopWord: {
    fontSize: typography.heading,
    fontWeight: '900',
    color: '#E53935',
    letterSpacing: 0,
  },
  popShape: { position: 'absolute' },
  popCircle:   { width: 34, height: 34, borderRadius: 17 },
  popSquare:   { width: 31, height: 31, borderRadius: 8 },
  popTriangle: {
    width: 0, height: 0,
    borderLeftWidth: 18, borderRightWidth: 18, borderBottomWidth: 32,
    borderLeftColor: 'transparent', borderRightColor: 'transparent',
  },
  popDot: { width: 22, height: 22, borderRadius: 11 },
});
