/**
 * Activities — game selection screen.
 *
 * Mirrors the Tools screen precisely:
 *   • Spring-entrance animations, shimmer, press-depth illusion
 *   • Star favourites with glow halo + particle burst
 *   • Accent play button (filled circle, ▶ icon)
 *   • Favourites section with golden tint strip when any activity is starred
 *   • No tags — clean, professional, disability-first
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  ImageBackground,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Href, useRouter } from 'expo-router';
import { Screen } from '../../src/components/native/Screen';
import { animation as anim, radii, spacing, typography } from '../../src/theme/tokens';
import { fonts } from '../../src/theme/fonts';
import { hapticLight, hapticSelection } from '../../src/utils/haptics';
import {
  ActivityId,
  toggleFavourite,
  useFavouriteActivities,
} from '../../src/features/activities/favourites-store';
import { setActivityOrder, useActivityOrder } from '../../src/features/activities/order-store';
import { usePullRefresh } from '../../src/hooks/usePullRefresh';
import { useReduceMotion } from '../../src/hooks/useReduceMotion';
import { useReduceSensoryLoad } from '../../src/hooks/useReduceSensoryLoad';
import { useTheme } from '../../src/theme/useTheme';

// --- Data ---

interface Activity {
  id: ActivityId;
  route: Href;
  title: string;
  subtitle: string;
  accent: string;
  heroBg: string;  // hero image band background (light mode)
  image: number;
}

const ACTIVITIES: Activity[] = [
  {
    id: 'shape-match',
    route: '/activities/shape-match' as Href,
    title: 'Shape Match',
    subtitle: 'Drag each shape into its matching outline.',
    accent:  '#1B8A4A',
    heroBg:  '#E8FAE8',
    image:   require('../../assets/activities/shape-match-logo.png'),
  },
  {
    id: 'colour-pop',
    route: '/activities/colour-pop' as Href,
    title: 'Colour Pop',
    subtitle: 'Tap every shape that matches the colour word.',
    accent:  '#7C3AED',
    heroBg:  '#E0D9FF',
    image:   require('../../assets/activities/colour-pop-logo.png'),
  },
  {
    id: 'memory-match',
    route: '/activities/memory-match' as Href,
    title: 'Memory Match',
    subtitle: 'A shape appears then hides. Pick the one you saw.',
    accent:  '#0A6ED1',
    heroBg:  '#E1EFFB',
    image:   require('../../assets/activities/memory-match.png'),
  },
];

const ACTIVITY_BY_ID = new Map<ActivityId, Activity>(ACTIVITIES.map(activity => [activity.id, activity]));

const CARD_HEIGHT = 188;
const HERO_HEIGHT = 112;
const CARD_GAP    = spacing.xxl;

const PARTICLE_ANGLES = [0, 60, 120, 180, 240, 300] as const;

function moveItem<T>(items: T[], fromIndex: number, toIndex: number): T[] {
  const next = [...items];
  const [item] = next.splice(fromIndex, 1);
  if (item === undefined) return items;
  next.splice(toIndex, 0, item);
  return next;
}

function withAlpha(color: string, alpha: number): string {
  const match = color.match(/^#([0-9a-fA-F]{6})$/);
  if (!match) return color;
  const hex = match[1] ?? '000000';
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// --- StarParticles ---

function StarParticles({ trigger }: { trigger: number }) {
  const t = useTheme();
  const particles = useRef(
    PARTICLE_ANGLES.map(() => ({
      opacity:  new Animated.Value(0),
      progress: new Animated.Value(0),
    }))
  ).current;

  const lastTrigger = useRef(0);

  useEffect(() => {
    if (trigger === 0 || trigger === lastTrigger.current) return;
    lastTrigger.current = trigger;

    particles.forEach(p => {
      p.opacity.setValue(0);
      p.progress.setValue(0);
    });

    const anims = particles.map(p =>
      Animated.parallel([
        Animated.timing(p.progress, {
          toValue: 1,
          duration: 320,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.timing(p.opacity, {
            toValue: 1,
            duration: 55,
            useNativeDriver: true,
          }),
          Animated.timing(p.opacity, {
            toValue: 0,
            duration: 240,
            delay: 50,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
        ]),
      ])
    );

    Animated.stagger(18, anims).start();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trigger]);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {PARTICLE_ANGLES.map((angle, i) => {
        const rad    = (angle * Math.PI) / 180;
        const radius = 20;
        const p      = particles[i];
        if (!p) return null;
        return (
          <Animated.View
            key={angle}
            style={{
              position:    'absolute',
              top:         '50%',
              left:        '50%',
              width:       5,
              height:      5,
              marginTop:   -2.5,
              marginLeft:  -2.5,
              borderRadius: 2.5,
              backgroundColor: t.colors.favouriteGold,
              opacity: p.opacity,
              transform: [
                {
                  translateX: p.progress.interpolate({
                    inputRange:  [0, 1],
                    outputRange: [0, Math.cos(rad) * radius],
                  }),
                },
                {
                  translateY: p.progress.interpolate({
                    inputRange:  [0, 1],
                    outputRange: [0, Math.sin(rad) * radius],
                  }),
                },
                {
                  scale: p.progress.interpolate({
                    inputRange:  [0, 0.3, 1],
                    outputRange: [0.4, 1, 0.5],
                  }),
                },
              ],
            }}
          />
        );
      })}
    </View>
  );
}

// --- SectionHeader ---

function SectionHeader({
  icon,
  label,
  entryDelay = 0,
  isFavourites = false,
}: {
  icon?: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  entryDelay?: number;
  isFavourites?: boolean;
}) {
  const t = useTheme();
  const reduceMotion  = useReduceMotion();
  const mountProgress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (reduceMotion) { mountProgress.setValue(1); return; }
    Animated.sequence([
      Animated.delay(entryDelay),
      Animated.timing(mountProgress, {
        toValue: 1,
        duration: 260,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const translateY = mountProgress.interpolate({
    inputRange:  [0, 1],
    outputRange: [6, 0],
  });

  return (
    <Animated.View
      style={[
        styles.sectionHeader,
        { opacity: mountProgress, transform: [{ translateY }] },
      ]}
    >
      {icon ? <Ionicons name={icon} size={15} color={t.colors.favouriteGold} /> : null}
      <Text
        style={[
          styles.sectionTitle,
          { color: isFavourites ? t.colors.favouriteGold : t.colors.textMuted },
        ]}
      >
        {label}
      </Text>
    </Animated.View>
  );
}

// --- ActivityCard ---

function ActivityCard({
  activity,
  favourite,
  showReorderControls,
  index,
  canMoveUp,
  canMoveDown,
  onPress,
  onRevealReorderControls,
  onMoveUp,
  onMoveDown,
  onToggleStar,
}: {
  activity: Activity;
  favourite: boolean;
  showReorderControls: boolean;
  index: number;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onPress: () => void;
  onRevealReorderControls: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onToggleStar: () => void;
}) {
  const t = useTheme();
  const reduceMotion = useReduceMotion();
  const reduceSensory = useReduceSensoryLoad();

  const mountProgress   = useRef(new Animated.Value(0)).current;
  const pressScale      = useRef(new Animated.Value(1)).current;
  const heroScale       = useRef(new Animated.Value(1)).current;
  const shimmerProgress = useRef(new Animated.Value(0)).current;
  const starScale       = useRef(new Animated.Value(1)).current;
  const starGlow        = useRef(new Animated.Value(favourite ? 1 : 0)).current;
  const [particleTrigger, setParticleTrigger] = useState(0);
  const suppressOpenAfterLongPress = useRef(false);

  // Mount entrance
  useEffect(() => {
    if (reduceMotion) { mountProgress.setValue(1); return; }
    Animated.sequence([
      Animated.delay(index * anim.stagRow),
      Animated.spring(mountProgress, {
        toValue:   1,
        useNativeDriver: true,
        damping:   22,
        stiffness: 260,
        mass:      1,
      }),
    ]).start();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Shimmer loop — favourites only, with a slightly stronger pass
  useEffect(() => {
    if (reduceMotion || reduceSensory || !favourite) return;
    let timeout: ReturnType<typeof setTimeout>;
    const runShimmer = () => {
      shimmerProgress.setValue(0);
      Animated.timing(shimmerProgress, {
        toValue:  1,
        duration: 760,
        easing:   Easing.inOut(Easing.sin),
        useNativeDriver: true,
      }).start(() => {
        timeout = setTimeout(runShimmer, 5_500 + Math.random() * 2_500);
      });
    };
    timeout = setTimeout(runShimmer, 1_500 + index * 500 + Math.random() * 1_200);
    return () => clearTimeout(timeout);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [favourite, reduceMotion]);

  // Star bounce + glow + particles
  const isMounted    = useRef(false);
  const wasFavourite = useRef(favourite);

  useEffect(() => {
    if (!isMounted.current) {
      isMounted.current = true;
      starGlow.setValue(favourite ? 1 : 0);
      return;
    }
    const wasFav = wasFavourite.current;
    wasFavourite.current = favourite;

    if (reduceMotion) {
      starGlow.setValue(favourite ? 1 : 0);
      return;
    }

    Animated.parallel([
      Animated.sequence([
        Animated.spring(starScale, {
          toValue: favourite ? 1.3 : 0.8,
          useNativeDriver: true,
          damping: 8, stiffness: 380, mass: 0.7,
        }),
        Animated.spring(starScale, {
          toValue: 1,
          useNativeDriver: true,
          damping: 14, stiffness: 300, mass: 1,
        }),
      ]),
      Animated.timing(starGlow, {
        toValue:  favourite ? 1 : 0,
        duration: 240,
        easing:   Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();

    if (favourite && !wasFav && !reduceMotion && !reduceSensory) {
      setParticleTrigger(t => t + 1);
    }
  }, [favourite, reduceMotion, reduceSensory]);

  const handlePressIn = () => {
    if (reduceMotion) return;
    Animated.parallel([
      Animated.spring(pressScale, {
        toValue: anim.scalePressMd, useNativeDriver: true,
        damping: 14, stiffness: 460, mass: 0.8,
      }),
      Animated.spring(heroScale, {
        toValue: 1.05, useNativeDriver: true,
        damping: 18, stiffness: 360, mass: 0.8,
      }),
    ]).start();
  };

  const handlePressOut = () => {
    if (reduceMotion) return;
    Animated.parallel([
      Animated.spring(pressScale, {
        toValue: 1, useNativeDriver: true,
        damping: 16, stiffness: 340, mass: 1,
      }),
      Animated.spring(heroScale, {
        toValue: 1, useNativeDriver: true,
        damping: 20, stiffness: 380, mass: 1,
      }),
    ]).start();
  };

  const mountTranslateY = mountProgress.interpolate({
    inputRange:  [0, 1],
    outputRange: [18, 0],
  });
  const shimmerTranslateX = shimmerProgress.interpolate({
    inputRange:  [0, 1],
    outputRange: [-160, 380],
  });
  const starGlowOpacity = starGlow.interpolate({
    inputRange:  [0, 1],
    outputRange: [0, 0.45],
  });
  const starGlowScale = starGlow.interpolate({
    inputRange:  [0, 1],
    outputRange: [0.5, 1],
  });

  const heroBackground = t.isDark ? `${activity.accent}33` : activity.heroBg;
  const cardBorderColor = withAlpha(t.colors.border, 0.75);

  const revealReorderControls = () => {
    suppressOpenAfterLongPress.current = true;
    hapticSelection();
    onRevealReorderControls();
  };

  return (
    <Animated.View
      style={{
        opacity:   mountProgress,
        transform: [{ translateY: mountTranslateY }, { scale: pressScale }],
        borderRadius:  radii.card,
        shadowColor:   favourite ? t.colors.favouriteGold : t.colors.favouriteGlow,
        shadowOffset:  { width: 0, height: favourite ? 3 : 0 },
        shadowOpacity: favourite ? 0.10 : 0,
        shadowRadius:  favourite ? 6 : 0,
        elevation:     0,
      }}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Open ${activity.title}. ${activity.subtitle}`}
        accessibilityHint={
          showReorderControls
            ? 'Use the up and down buttons to reorder this activity.'
            : 'Press and hold to show reorder controls.'
        }
        onLongPress={revealReorderControls}
        delayLongPress={260}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={() => {
          if (suppressOpenAfterLongPress.current) {
            suppressOpenAfterLongPress.current = false;
            return;
          }
          onPress();
        }}
        style={[styles.card, { backgroundColor: t.colors.surface, borderColor: cardBorderColor }]}
      >
        {/* Hero image band */}
        <View style={[styles.cardHero, { backgroundColor: heroBackground }]}>
          <Animated.View
            style={[StyleSheet.absoluteFill, { transform: [{ scale: heroScale }] }]}
          >
            <ImageBackground
              source={activity.image}
              style={StyleSheet.absoluteFill}
              imageStyle={styles.cardHeroImage}
              resizeMode="cover"
            />
          </Animated.View>

          {favourite ? (
            <Animated.View
              pointerEvents="none"
              style={[
                StyleSheet.absoluteFill,
                { transform: [{ translateX: shimmerTranslateX }] },
              ]}
            >
              <View style={styles.shimmerStripe} />
            </Animated.View>
          ) : null}
        </View>

        {/* Favourite star — top-left overlay over the hero (Rule 10) */}
        <Pressable
          onPress={event => {
            event.stopPropagation();
            hapticLight();
            onToggleStar();
          }}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel={
            favourite
              ? `Remove ${activity.title} from favourites`
              : `Add ${activity.title} to favourites`
          }
          accessibilityState={{ selected: favourite }}
          style={[styles.starOverlay, { backgroundColor: t.colors.surface }]}
        >
          <Animated.View
            style={[
              styles.starGlow,
              {
                backgroundColor: t.colors.favouriteGlow,
                opacity: starGlowOpacity,
                transform: [{ scale: starGlowScale }],
              },
            ]}
          />
          <Animated.View style={{ transform: [{ scale: starScale }] }}>
            <Ionicons
                name={favourite ? 'star' : 'star-outline'}
                size={22}
                color={favourite ? t.colors.favouriteGold : t.colors.textTertiary}
              />
          </Animated.View>
          <StarParticles trigger={particleTrigger} />
        </Pressable>

        <View
          style={[
            styles.cardBody,
            { backgroundColor: t.colors.surface, borderTopColor: cardBorderColor },
          ]}
        >
          <View style={styles.cardContentRow}>
            {showReorderControls ? (
              <View
                accessible
                accessibilityRole="toolbar"
                accessibilityLabel={`Reorder ${activity.title}`}
                style={styles.reorderControls}
              >
                <Ionicons name="reorder-three" size={22} color={t.colors.textMuted} />
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Move ${activity.title} up`}
                  accessibilityState={{ disabled: !canMoveUp }}
                  disabled={!canMoveUp}
                  onPress={(event) => {
                    event.stopPropagation();
                    hapticSelection();
                    onMoveUp();
                  }}
                  style={({ pressed }) => [
                    styles.reorderButton,
                    { backgroundColor: t.colors.inputBg },
                    (!canMoveUp || pressed) && { opacity: !canMoveUp ? 0.35 : 0.75 },
                  ]}
                >
                  <Ionicons name="chevron-up" size={20} color={t.colors.textMuted} />
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Move ${activity.title} down`}
                  accessibilityState={{ disabled: !canMoveDown }}
                  disabled={!canMoveDown}
                  onPress={(event) => {
                    event.stopPropagation();
                    hapticSelection();
                    onMoveDown();
                  }}
                  style={({ pressed }) => [
                    styles.reorderButton,
                    { backgroundColor: t.colors.inputBg },
                    (!canMoveDown || pressed) && { opacity: !canMoveDown ? 0.35 : 0.75 },
                  ]}
                >
                  <Ionicons name="chevron-down" size={20} color={t.colors.textMuted} />
                </Pressable>
              </View>
            ) : null}
            <View style={styles.copy}>
              <Text style={[styles.cardName, { color: t.colors.text }]}>{activity.title}</Text>
              <Text style={[styles.cardSubtitle, { color: t.colors.textMuted }]} numberOfLines={2}>
                {activity.subtitle}
              </Text>
            </View>

            <View style={styles.actions}>
              {/* Play button — 2× glyph, optically centred */}
              <Pressable
                onPress={event => {
                  event.stopPropagation();
                  hapticSelection();
                  onPress();
                }}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel={`Play ${activity.title}`}
                style={[
                  styles.iconButton,
                  styles.playButton,
                  { backgroundColor: activity.accent },
                ]}
              >
                <Ionicons
                  name="play"
                  size={32}
                  color={t.colors.textOnDark}
                  style={styles.playIcon}
                />
              </Pressable>
            </View>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

// --- ActivitiesScreen ---

export default function ActivitiesScreen() {
  const router = useRouter();
  const t = useTheme();
  const favs   = useFavouriteActivities();
  const savedOrder = useActivityOrder();
  const { refreshing, onRefresh } = usePullRefresh();
  const [showReorderControls, setShowReorderControls] = useState(false);

  const orderedActivities = savedOrder
    .map(id => ACTIVITY_BY_ID.get(id))
    .filter((activity): activity is Activity => Boolean(activity));
  const favouriteActivities = orderedActivities.filter(a => favs.includes(a.id));
  const regularActivities   = orderedActivities.filter(a => !favs.includes(a.id));

  const open = (activity: Activity) => {
    hapticSelection();
    router.push(activity.route);
  };

  const moveActivity = useCallback((activityId: ActivityId, direction: -1 | 1) => {
    const fromIndex = savedOrder.indexOf(activityId);
    const toIndex = fromIndex + direction;
    if (fromIndex < 0 || toIndex < 0 || toIndex >= savedOrder.length) return;
    setActivityOrder(moveItem(savedOrder, fromIndex, toIndex));
  }, [savedOrder]);

  const renderActivityCard = (activity: Activity, index: number) => (
    <ActivityCard
      key={activity.id}
      activity={activity}
      favourite={favs.includes(activity.id)}
      showReorderControls={showReorderControls}
      index={index}
      canMoveUp={index > 0}
      canMoveDown={index < orderedActivities.length - 1}
      onPress={() => open(activity)}
      onRevealReorderControls={() => setShowReorderControls(true)}
      onMoveUp={() => moveActivity(activity.id, -1)}
      onMoveDown={() => moveActivity(activity.id, 1)}
      onToggleStar={() => toggleFavourite(activity.id)}
    />
  );

  return (
    <Screen
      title="Activities"
      subtitle="Tap an activity to begin."
      backgroundColor={t.isDark ? t.colors.inputBgWhite : t.colors.background}
      subtitleTopSpacing={spacing.sm}
      headerBottomSpacing={spacing.xl}
      refreshing={refreshing}
      onRefresh={onRefresh}
    >
      {showReorderControls ? (
        <>
          <Pressable
            onPress={() => { hapticLight(); setShowReorderControls(false); }}
            accessibilityRole="button"
            accessibilityLabel="Done reordering activities"
            style={[styles.doneBar, { backgroundColor: t.colors.surface, borderColor: withAlpha(t.colors.primary, 0.2) }]}
          >
            <Ionicons name="reorder-three" size={18} color={t.colors.primary} />
            <Text style={[styles.doneBarText, { color: t.colors.textMuted }]}>Reordering</Text>
            <View style={[styles.doneChip, { backgroundColor: t.colors.primary }]}>
              <Text style={[styles.doneChipText, { color: t.colors.textOnDark }]}>Done</Text>
            </View>
          </Pressable>
          <View style={styles.section}>
            <View style={styles.list}>
              {orderedActivities.map(renderActivityCard)}
            </View>
          </View>
        </>
      ) : favouriteActivities.length > 0 ? (
        <View
          style={[
            styles.section,
            styles.favouritesSection,
            {
              backgroundColor: t.isDark
                ? withAlpha(t.colors.favouriteGold, 0.16)
                : withAlpha(t.colors.favouriteGold, 0.08),
            },
          ]}
        >
          <SectionHeader icon="star" label="Favourites" entryDelay={0} isFavourites />
          <View style={styles.list}>
            {favouriteActivities.map((activity, i) => renderActivityCard(activity, i))}
          </View>
        </View>
      ) : null}

      {!showReorderControls && regularActivities.length > 0 ? (
        <View style={styles.section}>
          {favouriteActivities.length > 0 ? (
            <SectionHeader
              label="Activities"
              entryDelay={favouriteActivities.length * anim.stagRow}
            />
          ) : null}
          <View style={styles.list}>
            {regularActivities.map((activity, i) => renderActivityCard(activity, favouriteActivities.length + i))}
          </View>
        </View>
      ) : null}

      {/* Progress — therapist-friendly view of practice over time */}
      <Pressable
        onPress={() => {
          hapticSelection();
          router.push('/activities/progress' as Href);
        }}
        accessibilityRole="button"
        accessibilityLabel="Progress. See completed activity runs over time."
        style={({ pressed }) => [
          styles.progressRow,
          { backgroundColor: t.colors.surface },
          pressed && { opacity: 0.9 },
        ]}
      >
        <View style={[styles.progressIcon, { backgroundColor: t.colors.selectionBg }]}>
          <Ionicons name="trending-up-outline" size={22} color={t.colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.progressTitle, { color: t.colors.text }]}>Progress</Text>
          <Text style={[styles.progressSub, { color: t.colors.textMuted }]}>
            How practice is going over time.
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={t.colors.textTertiary} />
      </Pressable>
    </Screen>
  );
}

// --- Styles ---

const styles = StyleSheet.create({
  list: {
    gap: CARD_GAP},

  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderRadius: radii.card,
    padding: spacing.lg,
    minHeight: 60},
  progressIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center'},
  progressTitle: {
    fontFamily: fonts.displayHeavy,
    fontSize: typography.subheading,
    letterSpacing: typography.trackSubhead},
  progressSub: {
    fontFamily: fonts.body,
    fontSize: typography.caption,
    marginTop: 2},

  section: {
    gap: spacing.sm,
    marginBottom: spacing.xxl},

  favouritesSection: {
    borderRadius:     radii.card,
    padding:          spacing.sm,
    marginHorizontal: -spacing.sm,
    paddingBottom:    spacing.md},

  sectionHeader: {
    minHeight:         24,
    flexDirection:     'row',
    alignItems:        'center',
    gap:               spacing.sm,
    paddingHorizontal: spacing.xs},

  sectionTitle: {
    fontFamily:    fonts.displayHeavy,
    fontSize:      typography.caption,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },

  card: {
    height:          CARD_HEIGHT,
    borderRadius:    radii.card,
    borderWidth:     1,
    borderColor:     'transparent', // set to token border inline for separation
    overflow:        'hidden'},

  starOverlay: {
    position:       'absolute',
    top:            spacing.sm,
    left:           spacing.sm,
    width:          40,
    height:         40,
    borderRadius:   20,
    alignItems:     'center',
    justifyContent: 'center',
    zIndex:         5},

  cardHero: {
    height:               HERO_HEIGHT,
    width:                '100%',
    overflow:             'hidden',
    borderTopLeftRadius:  radii.card,
    borderTopRightRadius: radii.card},

  cardHeroImage: {
    borderTopLeftRadius:  radii.card,
    borderTopRightRadius: radii.card},

  shimmerStripe: {
    position:        'absolute',
    top:             -20,
    left:            0,
    width:           54,
    height:          200,
    backgroundColor: 'rgba(255,255,255,0.30)',
    transform:       [{ rotate: '18deg' }]},

  cardBody: {
    flex:              1,
    paddingHorizontal: spacing.md,
    paddingVertical:   spacing.md,
    justifyContent:    'center',
    borderTopWidth:    StyleSheet.hairlineWidth},

  cardContentRow: {
    flexDirection: 'row',
    alignItems:    'flex-start',
    gap:           spacing.sm},

  copy: {
    flex: 1,
    minHeight: 52,
    justifyContent: 'space-between',
    gap:  4},

  cardName: {
    fontFamily:    fonts.displayHeavy,
    fontSize:      typography.body,
    letterSpacing: -0.2,
  },

  cardSubtitle: {
    fontFamily: fonts.body,
    fontSize:   typography.caption,
    lineHeight: 17,
  },

  actions: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           spacing.xs},

  iconButton: {
    minWidth:       44,
    minHeight:      44,
    alignItems:     'center',
    justifyContent: 'center'},

  starButton: {
    borderRadius: 22},

  starGlow: {
    position:        'absolute',
    width:           34,
    height:          34,
    borderRadius:    17},

  reorderControls: {
    minWidth: 44,
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },

  reorderButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },

  doneBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: radii.button,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 0.5,
  },

  doneBarText: {
    flex: 1,
    fontFamily: fonts.body,
    fontSize: typography.caption,
    fontWeight: '600',
  },

  doneChip: {
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    minHeight: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },

  doneChipText: {
    fontFamily: fonts.displayBold,
    fontSize: typography.caption,
    letterSpacing: 0.2,
  },

  playButton: {
    width:          52,
    height:         52,
    borderRadius:   15,
    alignItems:     'center',
    justifyContent: 'center'},

  // Play triangles read left-heavy; a small optical nudge centres them
  // (scaled up with the larger 2× glyph).
  playIcon: {
    marginLeft: 3},
});
