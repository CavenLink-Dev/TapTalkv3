/**
 * Tools screen — Apple-grade micro-interactions.
 *
 * Every animation here respects the project's DESIGN_LAWS:
 *   #14 animate change  #15 purposeful motion  #16 spring physics
 *   #17 linear for mechanical  #18 Reduce Motion guard  #19 haptics
 *   #20 44pt+ hit areas  #21 accessibility labels
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
import {
  hapticLight,
  hapticSelection,
} from '../../src/utils/haptics';
import {
  ToolId,
  toggleFavourite,
  useFavouriteTools,
} from '../../src/features/tools/favourites-store';
import { setToolOrder, useToolOrder } from '../../src/features/tools/order-store';
import { usePullRefresh } from '../../src/hooks/usePullRefresh';
import { useReduceMotion } from '../../src/hooks/useReduceMotion';
import { useReduceSensoryLoad } from '../../src/hooks/useReduceSensoryLoad';
import { useTheme } from '../../src/theme/useTheme';

// ─── Types ─────────────────────────────────────────────────────────────────────

type Tool = {
  id: ToolId;
  title: string;
  subtitle: string;
  tag: string;
  accent: string;
  accentBg: string;
  image: number;
  route: Href;
};

// ─── Data ──────────────────────────────────────────────────────────────────────

const TOOLS: Tool[] = [
  {
    id: 'calendar',
    title: 'Calendar',
    subtitle: 'Plan your day, step by step.',
    tag: 'Plan',
    accent: '#199AEE',
    accentBg: '#E6F4FD',
    image: require('../../assets/tools/calendar.png'),
    route: '/calendar' as Href,
  },
  {
    id: 'step-by-step',
    title: 'Step by Step',
    subtitle: 'Show steps with pictures and timers.',
    tag: 'Routine',
    accent: '#7B61FF',
    accentBg: '#EFEAFF',
    image: require('../../assets/tools/step-by-step.png'),
    route: '/first-then' as Href,
  },
  {
    id: 'visual-timer',
    title: 'Visual Timer',
    subtitle: 'A calm countdown you can see.',
    tag: 'Time',
    accent: '#34C759',
    accentBg: '#E6F8EB',
    image: require('../../assets/tools/visual-timer.png'),
    route: '/visual-timer' as Href,
  },
];

const TOOL_BY_ID = new Map<ToolId, Tool>(TOOLS.map(t => [t.id, t]));
const CARD_GAP = spacing.xxl;
const CARD_HEIGHT = 188;

// Six evenly-spaced angles for the star burst particles.
const PARTICLE_ANGLES = [0, 60, 120, 180, 240, 300] as const;

// ─── Helpers ───────────────────────────────────────────────────────────────────

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

// ─── StarParticles ─────────────────────────────────────────────────────────────

function StarParticles({ trigger }: { trigger: number }) {
  const t = useTheme();
  const particles = useRef(
    PARTICLE_ANGLES.map(() => ({
      opacity: new Animated.Value(0),
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
  }, [trigger]);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {PARTICLE_ANGLES.map((angle, i) => {
        const rad = (angle * Math.PI) / 180;
        const radius = 20;
        const p = particles[i];
        if (!p) return null;
        return (
          <Animated.View
            key={angle}
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              width: 5,
              height: 5,
              marginTop: -2.5,
              marginLeft: -2.5,
              borderRadius: 2.5,
              backgroundColor: t.colors.favouriteGold,
              opacity: p.opacity,
              transform: [
                {
                  translateX: p.progress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, Math.cos(rad) * radius],
                  }),
                },
                {
                  translateY: p.progress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, Math.sin(rad) * radius],
                  }),
                },
                {
                  scale: p.progress.interpolate({
                    inputRange: [0, 0.3, 1],
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

// ─── ToolCard ──────────────────────────────────────────────────────────────────

function ToolCard({
  tool,
  favourite,
  showReorderControls,
  index,
  canMoveUp,
  canMoveDown,
  onOpen,
  onRevealReorderControls,
  onMoveUp,
  onMoveDown,
  onToggleStar,
}: {
  tool: Tool;
  favourite: boolean;
  showReorderControls: boolean;
  index: number;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onOpen: () => void;
  onRevealReorderControls: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onToggleStar: () => void;
}) {
  const t = useTheme();
  const reduceMotion = useReduceMotion();
  const reduceSensory = useReduceSensoryLoad();
  const suppressOpenAfterLongPress = useRef(false);

  // Staggered entrance
  const mountProgress = useRef(new Animated.Value(0)).current;

  // Press: card springs inward, hero counter-zooms outward (depth illusion)
  const pressScale = useRef(new Animated.Value(1)).current;
  const heroScale  = useRef(new Animated.Value(1)).current;

  // Star: bounce + warm glow halo + particle burst
  const starScale = useRef(new Animated.Value(1)).current;
  const starGlow  = useRef(new Animated.Value(favourite ? 1 : 0)).current;
  const [particleTrigger, setParticleTrigger] = useState(0);

  // Shimmer: favourites only, with a slightly stronger pass
  const shimmerProgress = useRef(new Animated.Value(0)).current;

  // Mount entrance (staggered by index)
  useEffect(() => {
    if (reduceMotion) {
      mountProgress.setValue(1);
      return;
    }
    Animated.sequence([
      Animated.delay(index * anim.stagRow),
      Animated.spring(mountProgress, {
        toValue: 1,
        useNativeDriver: true,
        damping: 22,
        stiffness: 260,
        mass: 1,
      }),
    ]).start();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Shimmer loop — favourites only, each card has a unique start time
  useEffect(() => {
    if (reduceMotion || reduceSensory || !favourite) return;
    let timeout: ReturnType<typeof setTimeout>;

    const runShimmer = () => {
      shimmerProgress.setValue(0);
      Animated.timing(shimmerProgress, {
        toValue: 1,
        duration: 760,
        easing: Easing.inOut(Easing.sin),
        useNativeDriver: true,
      }).start(() => {
        timeout = setTimeout(runShimmer, 5500 + Math.random() * 2500);
      });
    };

    timeout = setTimeout(runShimmer, 1500 + index * 500 + Math.random() * 1200);
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
          damping: 8,
          stiffness: 380,
          mass: 0.7,
        }),
        Animated.spring(starScale, {
          toValue: 1,
          useNativeDriver: true,
          damping: 14,
          stiffness: 300,
          mass: 1,
        }),
      ]),
      Animated.timing(starGlow, {
        toValue: favourite ? 1 : 0,
        duration: 240,
        easing: Easing.out(Easing.cubic),
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
        toValue: anim.scalePressMd,
        useNativeDriver: true,
        damping: 14,
        stiffness: 460,
        mass: 0.8,
      }),
      Animated.spring(heroScale, {
        toValue: 1.05,
        useNativeDriver: true,
        damping: 18,
        stiffness: 360,
        mass: 0.8,
      }),
    ]).start();
  };

  const handlePressOut = () => {
    if (reduceMotion) return;
    Animated.parallel([
      Animated.spring(pressScale, {
        toValue: 1,
        useNativeDriver: true,
        damping: 16,
        stiffness: 340,
        mass: 1,
      }),
      Animated.spring(heroScale, {
        toValue: 1,
        useNativeDriver: true,
        damping: 20,
        stiffness: 380,
        mass: 1,
      }),
    ]).start();
  };

  const revealReorderControls = () => {
    suppressOpenAfterLongPress.current = true;
    hapticSelection();
    onRevealReorderControls();
  };

  // Interpolations
  const mountTranslateY = mountProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [18, 0],
  });
  const shimmerTranslateX = shimmerProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [-160, 380],
  });
  const starGlowOpacity = starGlow.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.45],
  });
  const starGlowScale = starGlow.interpolate({
    inputRange: [0, 1],
    outputRange: [0.5, 1],
  });

  return (
    <Animated.View
      style={{
        opacity: mountProgress,
        transform: [
          { translateY: mountTranslateY },
          { scale: pressScale },
        ],
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
        accessibilityLabel={`Open ${tool.title}. ${tool.subtitle}`}
        accessibilityHint={
          showReorderControls
            ? 'Use the up and down buttons to reorder this tool.'
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
          hapticSelection();
          onOpen();
        }}
        style={[styles.card, { backgroundColor: t.colors.surface, borderColor: withAlpha(t.colors.border, 0.75) }]}
      >
        {/* Hero image + shimmer */}
        <View style={[styles.cardHero, { backgroundColor: tool.accentBg }]}>
          <Animated.View
            style={[StyleSheet.absoluteFill, { transform: [{ scale: heroScale }] }]}
          >
            <ImageBackground
              source={tool.image}
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
            favourite ? `Remove ${tool.title} from favourites` : `Add ${tool.title} to favourites`
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

        {/* Card body */}
        <View
          style={[
            styles.cardBody,
            { backgroundColor: t.colors.surface, borderTopColor: withAlpha(t.colors.border, 0.75) },
          ]}
        >
          <View style={styles.cardContentRow}>

            {showReorderControls ? (
              <View
                accessible
                accessibilityRole="toolbar"
                accessibilityLabel={`Reorder ${tool.title}`}
                style={styles.reorderControls}
              >
                <Ionicons name="reorder-three" size={22} color={t.colors.textMuted} />
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Move ${tool.title} up`}
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
                  accessibilityLabel={`Move ${tool.title} down`}
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
              <Text style={[styles.name, { color: t.colors.text }]}>{tool.title}</Text>
              <Text style={[styles.description, { color: t.colors.textMuted }]} numberOfLines={2}>
                {tool.subtitle}
              </Text>
            </View>

            <View style={styles.actions}>
              {/* Play button — 2× glyph, optically centred */}
              <Pressable
                onPress={event => {
                  event.stopPropagation();
                  hapticSelection();
                  onOpen();
                }}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel={`Open ${tool.title}`}
                style={[
                  styles.iconButton,
                  styles.playButton,
                  { backgroundColor: tool.accent },
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

// ─── SectionHeader ─────────────────────────────────────────────────────────────

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
    inputRange: [0, 1],
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
          { color: t.colors.textMuted },
          isFavourites && { color: t.colors.favouriteGold },
        ]}
      >
        {label}
      </Text>
    </Animated.View>
  );
}

// ─── ToolsScreen ───────────────────────────────────────────────────────────────

export default function ToolsScreen() {
  const t = useTheme();
  const router     = useRouter();
  const favs       = useFavouriteTools();
  const { refreshing, onRefresh } = usePullRefresh();
  const savedOrder = useToolOrder();

  const [showReorderControls, setShowReorderControls] = useState(false);

  const orderedTools  = savedOrder
    .map(id => TOOL_BY_ID.get(id))
    .filter((tool): tool is Tool => Boolean(tool));
  const favouriteTools = orderedTools.filter(t => favs.includes(t.id));
  const regularTools   = orderedTools.filter(t => !favs.includes(t.id));

  const open = (tool: Tool) => {
    hapticSelection();
    router.push(tool.route);
  };

  const moveTool = useCallback((toolId: ToolId, direction: -1 | 1) => {
    const fromIndex = savedOrder.indexOf(toolId);
    const toIndex = fromIndex + direction;
    if (fromIndex < 0 || toIndex < 0 || toIndex >= savedOrder.length) return;
    setToolOrder(moveItem(savedOrder, fromIndex, toIndex));
  }, [savedOrder]);

  const renderToolCard = (tool: Tool, index: number) => (
    <ToolCard
      key={tool.id}
      tool={tool}
      favourite={favs.includes(tool.id)}
      showReorderControls={showReorderControls}
      index={index}
      canMoveUp={index > 0}
      canMoveDown={index < orderedTools.length - 1}
      onOpen={() => open(tool)}
      onRevealReorderControls={() => setShowReorderControls(true)}
      onMoveUp={() => moveTool(tool.id, -1)}
      onMoveDown={() => moveTool(tool.id, 1)}
      onToggleStar={() => toggleFavourite(tool.id)}
    />
  );

  return (
    <Screen
      title="Tools"
      subtitle="Tap tool to open it."
      backgroundColor={t.isDark ? t.colors.inputBgWhite : t.colors.background}
      subtitleTopSpacing={spacing.sm}
      headerBottomSpacing={spacing.xl}
      refreshing={refreshing}
      onRefresh={onRefresh}
    >
      {/* Reorder mode banner — Law #25: edit mode with a clear exit */}
      {showReorderControls ? (
        <Pressable
          onPress={() => { hapticLight(); setShowReorderControls(false); }}
          accessibilityRole="button"
          accessibilityLabel="Done reordering tools"
          style={[styles.doneBar, { backgroundColor: t.colors.surface, borderColor: withAlpha(t.colors.primary, 0.2) }]}
        >
          <Ionicons name="reorder-three" size={18} color={t.colors.primary} />
          <Text style={[styles.doneBarText, { color: t.colors.textMuted }]}>Reordering</Text>
          <View style={[styles.doneChip, { backgroundColor: t.colors.primary }]}>
            <Text style={[styles.doneChipText, { color: t.colors.textOnDark }]}>Done</Text>
          </View>
        </Pressable>
      ) : null}

      {showReorderControls ? (
        <View style={styles.section}>
          <View style={styles.list}>
            {orderedTools.map(renderToolCard)}
          </View>
        </View>
      ) : favouriteTools.length > 0 ? (
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
            {favouriteTools.map((tool, i) => renderToolCard(tool, i))}
          </View>
        </View>
      ) : null}

      {!showReorderControls && regularTools.length > 0 ? (
        <View style={styles.section}>
          {favouriteTools.length > 0 ? (
            <SectionHeader
              label="Tools"
              entryDelay={favouriteTools.length * anim.stagRow}
            />
          ) : null}
          <View style={styles.list}>
            {regularTools.map((tool, i) => renderToolCard(tool, favouriteTools.length + i))}
          </View>
        </View>
      ) : null}
    </Screen>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  list: {
    gap: CARD_GAP},
  card: {
    height: CARD_HEIGHT,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: 'transparent', // set to token border inline for separation
    overflow: 'hidden'},
  starOverlay: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5},
  // overflow:hidden clips both the counter-zoomed hero and the shimmer stripe
  cardHero: {
    height: 112,
    width: '100%',
    overflow: 'hidden',
    borderTopLeftRadius: radii.card,
    borderTopRightRadius: radii.card},
  cardHeroImage: {
    borderTopLeftRadius: radii.card,
    borderTopRightRadius: radii.card},
  // Static rotation lives here; translateX is animated on the native thread
  shimmerStripe: {
    position: 'absolute',
    top: -20,
    left: 0,
    width: 54,
    height: 200,
    backgroundColor: 'rgba(255, 255, 255, 0.30)',
    transform: [{ rotate: '18deg' }]},
  cardBody: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    justifyContent: 'center',
    borderTopWidth: StyleSheet.hairlineWidth},
  cardContentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm},
  copy: {
    flex: 1,
    minHeight: 52,
    justifyContent: 'space-between',
    gap: 4},
  tag: {
    alignSelf: 'flex-start',
    borderRadius: radii.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2},
  tagText: {
    fontFamily: fonts.displayHeavy,
    fontSize: typography.eyebrow,
    letterSpacing: 0.4,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs},
  // All icon buttons meet Law #20: 44pt minimum touch target
  iconButton: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center'},
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
  starButton: {
    borderRadius: 22},
  playButton: {
    width:          52,
    height:         52,
    borderRadius:   15,
    alignItems:     'center',
    justifyContent: 'center'},
  // Play triangles read left-heavy; a small optical nudge centres them.
  playIcon: {
    marginLeft: 3},
  // Golden halo — only visible (opacity > 0) when card is favourited
  starGlow: {
    position: 'absolute',
    width: 34,
    height: 34,
    borderRadius: 17},
  section: {
    gap: spacing.sm,
    marginBottom: spacing.xxl},
  // Favourites section gets a warm golden tint strip — visually separates it
  favouritesSection: {
    borderRadius: radii.card,
    padding: spacing.sm,
    marginHorizontal: -spacing.sm,
    paddingBottom: spacing.md},
  sectionHeader: {
    minHeight: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.xs},
  sectionTitle: {
    fontFamily: fonts.displayHeavy,
    fontSize: typography.caption,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  // Reorder mode banner — Law #25: clear edit-mode entry/exit
  doneBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,

    borderRadius: radii.button,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 0.5},
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
  name: {
    fontFamily: fonts.displayHeavy,
    fontSize: typography.body,
    letterSpacing: -0.2,
  },
  description: {
    fontFamily: fonts.body,
    fontSize: typography.caption,
    lineHeight: 17,
  },
});
