/**
 * Tools screen — Apple-grade micro-interactions.
 *
 * Every animation here respects the project's DESIGN_LAWS:
 *   #14 animate change  #15 purposeful motion  #16 spring physics
 *   #17 linear for mechanical  #18 Reduce Motion guard  #19 haptics
 *   #20 44pt+ hit areas  #21 accessibility labels
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  GestureResponderEvent,
  ImageBackground,
  PanResponder,
  PanResponderGestureState,
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
  hapticMedium,
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
const CARD_GAP = spacing.lg;
const CARD_HEIGHT = 214;

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

// ─── StarParticles ─────────────────────────────────────────────────────────────

function StarParticles({ trigger }: { trigger: number }) {
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
              backgroundColor: '#F5B400',
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
  showDragHandle,
  dragging,
  index,
  onOpen,
  onRevealDragHandles,
  onToggleStar,
  onDragStart,
  onDragMove,
  onDragEnd,
}: {
  tool: Tool;
  favourite: boolean;
  showDragHandle: boolean;
  dragging: boolean;
  index: number;
  onOpen: () => void;
  onRevealDragHandles: () => void;
  onToggleStar: () => void;
  onDragStart: () => void;
  onDragMove: (gesture: PanResponderGestureState) => void;
  onDragEnd: () => void;
}) {
  const t = useTheme();
  const reduceMotion = useReduceMotion();
  const suppressOpenAfterLongPress = useRef(false);

  // Staggered entrance
  const mountProgress = useRef(new Animated.Value(0)).current;

  // Press: card springs inward, hero counter-zooms outward (depth illusion)
  const pressScale = useRef(new Animated.Value(1)).current;
  const heroScale  = useRef(new Animated.Value(1)).current;

  // Drag: card lifts to signal it is picked up — no tilt (disability-first, Law #30)
  const dragScale = useRef(new Animated.Value(1)).current;

  // Star: bounce + warm glow halo + particle burst
  const starScale = useRef(new Animated.Value(1)).current;
  const starGlow  = useRef(new Animated.Value(favourite ? 1 : 0)).current;
  const [particleTrigger, setParticleTrigger] = useState(0);

  // Shimmer: faint diagonal stripe sweeps across hero periodically
  const shimmerProgress = useRef(new Animated.Value(0)).current;

  // Drag handle: slides in from left when edit mode opens
  const handleSlideX  = useRef(new Animated.Value(-20)).current;
  const handleOpacity = useRef(new Animated.Value(0)).current;

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

  // Shimmer loop — each card has a unique start time so they never sync up
  useEffect(() => {
    if (reduceMotion) return;
    let timeout: ReturnType<typeof setTimeout>;

    const runShimmer = () => {
      shimmerProgress.setValue(0);
      Animated.timing(shimmerProgress, {
        toValue: 1,
        duration: 680,
        easing: Easing.inOut(Easing.sin),
        useNativeDriver: true,
      }).start(() => {
        timeout = setTimeout(runShimmer, 9000 + Math.random() * 7000);
      });
    };

    timeout = setTimeout(runShimmer, 2600 + index * 800 + Math.random() * 2000);
    return () => clearTimeout(timeout);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduceMotion]);

  // Drag handle slide in/out
  useEffect(() => {
    if (reduceMotion) {
      handleSlideX.setValue(0);
      handleOpacity.setValue(showDragHandle ? 1 : 0);
      return;
    }
    if (showDragHandle) {
      Animated.parallel([
        Animated.spring(handleSlideX, {
          toValue: 0,
          useNativeDriver: true,
          damping: 18,
          stiffness: 320,
          mass: 0.8,
        }),
        Animated.timing(handleOpacity, {
          toValue: 1,
          duration: 180,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(handleSlideX, {
          toValue: -20,
          duration: 150,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(handleOpacity, {
          toValue: 0,
          duration: 110,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [showDragHandle, reduceMotion]);

  // Drag lift / settle — pure scale, no rotation (Law #30)
  useEffect(() => {
    if (reduceMotion) {
      dragScale.setValue(1);
      return;
    }
    Animated.spring(dragScale, {
      toValue: dragging ? 1.03 : 1,
      useNativeDriver: true,
      damping: dragging ? 12 : 20,
      stiffness: dragging ? 280 : 380,
      mass: dragging ? 0.8 : 1,
    }).start();
  }, [dragging, reduceMotion]);

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

    if (favourite && !wasFav) {
      setParticleTrigger(t => t + 1);
    }
  }, [favourite, reduceMotion]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: () => dragging,
        onPanResponderMove: (_e, gesture) => onDragMove(gesture),
        onPanResponderRelease: onDragEnd,
        onPanResponderTerminate: onDragEnd,
      }),
    [dragging, onDragEnd, onDragMove]
  );

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

  const startDrag = (event: GestureResponderEvent) => {
    event.stopPropagation();
    hapticMedium();
    onDragStart();
  };

  const revealDragHandles = () => {
    suppressOpenAfterLongPress.current = true;
    hapticSelection();
    onRevealDragHandles();
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
    outputRange: [0, 0.7],
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
          { scale: dragScale },
        ],
      }}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Open ${tool.title}. ${tool.subtitle}`}
        accessibilityHint={
          showDragHandle
            ? 'Use the menu handle on the left to reorder this tool.'
            : 'Press and hold to show reorder handles.'
        }
        onLongPress={revealDragHandles}
        delayLongPress={240}
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
        style={[styles.card, { backgroundColor: t.colors.surface }]}
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

          <Animated.View
            pointerEvents="none"
            style={[
              StyleSheet.absoluteFill,
              { transform: [{ translateX: shimmerTranslateX }] },
            ]}
          >
            <View style={styles.shimmerStripe} />
          </Animated.View>
        </View>

        {/* Card body */}
        <View style={styles.cardBody}>
          <View style={styles.cardContentRow}>

            {showDragHandle ? (
              <Animated.View
                style={{
                  opacity: handleOpacity,
                  transform: [{ translateX: handleSlideX }],
                }}
              >
                <Pressable
                  onLongPress={startDrag}
                  delayLongPress={180}
                  hitSlop={12}
                  accessibilityRole="button"
                  accessibilityLabel={`Hold and drag to reorder ${tool.title}`}
                  style={[styles.iconButton, styles.dragHandle]}
                  {...panResponder.panHandlers}
                >
                  <Ionicons
                    name="menu"
                    size={25}
                    color={dragging ? tool.accent : t.colors.textMuted}
                  />
                </Pressable>
              </Animated.View>
            ) : null}

            <View style={styles.copy}>
              <Text style={[styles.name, { color: t.colors.text }]}>{tool.title}</Text>
              <Text style={[styles.description, { color: t.colors.textMuted }]} numberOfLines={2}>
                {tool.subtitle}
              </Text>
            </View>

            <View style={styles.actions}>
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
                    ? `Remove ${tool.title} from favourites`
                    : `Add ${tool.title} to favourites`
                }
                accessibilityState={{ selected: favourite }}
                style={[styles.iconButton, styles.starButton]}
              >
                <Animated.View
                  style={[
                    styles.starGlow,
                    {
                      opacity: starGlowOpacity,
                      transform: [{ scale: starGlowScale }],
                    },
                  ]}
                />
                <Animated.View style={{ transform: [{ scale: starScale }] }}>
                  <Ionicons
                    name={favourite ? 'star' : 'star-outline'}
                    size={24}
                    color={favourite ? '#F5B400' : t.colors.textTertiary}
                  />
                </Animated.View>
                <StarParticles trigger={particleTrigger} />
              </Pressable>

              {/* Play button */}
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
                  size={15}
                  color="#fff"
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
      {icon ? <Ionicons name={icon} size={15} color="#F5B400" /> : null}
      <Text
        style={[
          styles.sectionTitle,
          { color: t.colors.textMuted },
          isFavourites && styles.sectionTitleFavourites,
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

  const [showDragHandles, setShowDragHandles] = useState(false);
  const [draftOrder,      setDraftOrder]      = useState<ToolId[] | null>(null);
  const [draggingId,      setDraggingId]      = useState<ToolId | null>(null);

  const dragStartIndex = useRef(0);
  const draftOrderRef  = useRef<ToolId[] | null>(null);
  const draggingIdRef  = useRef<ToolId | null>(null);

  const orderedIds    = draftOrder ?? savedOrder;
  const orderedTools  = orderedIds
    .map(id => TOOL_BY_ID.get(id))
    .filter((tool): tool is Tool => Boolean(tool));
  const favouriteTools = orderedTools.filter(t => favs.includes(t.id));
  const regularTools   = orderedTools.filter(t => !favs.includes(t.id));
  const visibleIds     = [...favouriteTools, ...regularTools].map(t => t.id);

  const open = (tool: Tool) => {
    hapticSelection();
    router.push(tool.route);
  };

  const startDrag = (toolId: ToolId) => {
    dragStartIndex.current = visibleIds.indexOf(toolId);
    draftOrderRef.current  = visibleIds;
    draggingIdRef.current  = toolId;
    setDraftOrder(visibleIds);
    setDraggingId(toolId);
  };

  const moveDraggedTool = (gesture: PanResponderGestureState) => {
    const activeId = draggingIdRef.current;
    if (!activeId) return;

    const currentOrder = draftOrderRef.current ?? visibleIds;
    const fromIndex    = currentOrder.indexOf(activeId);
    if (fromIndex < 0) return;

    const rowHeight = CARD_HEIGHT + CARD_GAP;
    const nextIndex = Math.max(
      0,
      Math.min(
        currentOrder.length - 1,
        dragStartIndex.current + Math.round(gesture.dy / rowHeight),
      ),
    );

    if (nextIndex !== fromIndex) {
      hapticSelection();
      const nextOrder       = moveItem(currentOrder, fromIndex, nextIndex);
      draftOrderRef.current = nextOrder;
      setDraftOrder(nextOrder);
    }
  };

  const endDrag = () => {
    if (draftOrderRef.current) setToolOrder(draftOrderRef.current);
    draftOrderRef.current = null;
    draggingIdRef.current = null;
    setDraggingId(null);
    setDraftOrder(null);
  };

  return (
    <Screen
      title="Tools"
      subtitle="Tap a tool to open it. Hold a tool to organise."
      refreshing={refreshing}
      onRefresh={onRefresh}
    >
      {/* Reorder mode banner — Law #25: edit mode with a clear exit */}
      {showDragHandles ? (
        <Pressable
          onPress={() => { hapticLight(); setShowDragHandles(false); }}
          accessibilityRole="button"
          accessibilityLabel="Done reordering tools"
          style={[styles.doneBar, { backgroundColor: t.colors.surface, borderColor: t.colors.primary + '33' }]}
        >
          <Ionicons name="reorder-three" size={18} color={t.colors.primary} />
          <Text style={[styles.doneBarText, { color: t.colors.textMuted }]}>Hold ≡ then drag to reorder</Text>
          <View style={[styles.doneChip, { backgroundColor: t.colors.primary }]}>
            <Text style={[styles.doneChipText, { color: t.colors.textOnDark }]}>Done</Text>
          </View>
        </Pressable>
      ) : null}

      {favouriteTools.length > 0 ? (
        <View style={[styles.section, styles.favouritesSection]}>
          <SectionHeader icon="star" label="Favourites" entryDelay={0} isFavourites />
          <View style={styles.list}>
            {favouriteTools.map((tool, i) => (
              <ToolCard
                key={tool.id}
                tool={tool}
                favourite={favs.includes(tool.id)}
                showDragHandle={showDragHandles}
                dragging={draggingId === tool.id}
                index={i}
                onOpen={() => open(tool)}
                onRevealDragHandles={() => setShowDragHandles(true)}
                onToggleStar={() => toggleFavourite(tool.id)}
                onDragStart={() => startDrag(tool.id)}
                onDragMove={moveDraggedTool}
                onDragEnd={endDrag}
              />
            ))}
          </View>
        </View>
      ) : null}

      {regularTools.length > 0 ? (
        <View style={styles.section}>
          {favouriteTools.length > 0 ? (
            <SectionHeader
              label="Tools"
              entryDelay={favouriteTools.length * anim.stagRow}
            />
          ) : null}
          <View style={styles.list}>
            {regularTools.map((tool, i) => (
              <ToolCard
                key={tool.id}
                tool={tool}
                favourite={favs.includes(tool.id)}
                showDragHandle={showDragHandles}
                dragging={draggingId === tool.id}
                index={favouriteTools.length + i}
                onOpen={() => open(tool)}
                onRevealDragHandles={() => setShowDragHandles(true)}
                onToggleStar={() => toggleFavourite(tool.id)}
                onDragStart={() => startDrag(tool.id)}
                onDragMove={moveDraggedTool}
                onDragEnd={endDrag}
              />
            ))}
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
    overflow: 'hidden'},
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
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    transform: [{ rotate: '18deg' }]},
  cardBody: {
    padding: spacing.md,
    gap: 4},
  cardContentRow: {
    minHeight: 62,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm},
  copy: {
    flex: 1,
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
  dragHandle: {
    borderRadius: 22},
  starButton: {
    borderRadius: 22},
  playButton: {
    width:          38,
    height:         38,
    borderRadius:   19,
    alignItems:     'center',
    justifyContent: 'center',
    shadowColor:    '#000',
    shadowOffset:   { width: 0, height: 2 },
    shadowOpacity:  0.18,
    shadowRadius:   3,
    elevation:      3},
  playIcon: {
    marginLeft: 2},
  // Golden halo — only visible (opacity > 0) when card is favourited
  starGlow: {
    position: 'absolute',
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#FFF0B3'},
  section: {
    gap: spacing.sm,
    marginBottom: spacing.lg},
  // Favourites section gets a warm golden tint strip — visually separates it
  favouritesSection: {
    backgroundColor: 'rgba(245, 180, 0, 0.06)',
    borderRadius: radii.card,
    padding: spacing.sm,
    marginHorizontal: -spacing.sm,
    paddingBottom: spacing.md},
  sectionHeader: {
    minHeight: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.xs},
  sectionTitle: {
    fontFamily: fonts.displayHeavy,
    fontSize: typography.caption,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  // Favourites section title uses the star gold — pops without being loud
  sectionTitleFavourites: {
    color: '#C68A00'},
  // Reorder mode banner — Law #25: clear edit-mode entry/exit
  doneBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,

    borderRadius: radii.button,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1.5},
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
