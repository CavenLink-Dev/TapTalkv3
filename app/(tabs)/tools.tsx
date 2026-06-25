/**
 * Tools — the bottom-nav tab that houses every tool surface in the app.
 *
 * Default layout: a single vertical list of tool cards (Calendar, Step by
 * Step, Visual Timer). Each card is a tappable destination plus a star to
 * pin it. When at least one card is pinned, a "Favourites" section appears
 * above the main "Tools" section; pinned cards are removed from the main
 * list while pinned. The user can swipe a card right-to-left to reveal the
 * star action as an alternative to tapping the small star on the card.
 *
 * Principles in play:
 *  • 1 simple-first / 5 deeper-when-needed — three primary tools on top,
 *    each tool's complexity lives behind its own route.
 *  • 4 stable nav — Tools sits in the same bottom slot every time.
 *  • 7 clear actions — tap card opens, tap star pins, swipe reveals same.
 *  • 11 context menus — swipe action only carries the actions for *that
 *    card* (today: just Favourite).
 *  • 13 visible feedback — star colour swap + haptic, swipe drawer slide.
 *  • 16 spring motion — Swipeable defaults; star tap a soft pop.
 *  • 20 forgiving touch targets — full-card tap + 44pt star, plus swipe.
 *  • 27 sections — Favourites / Tools headings.
 */

import React, { useCallback, useEffect, useRef } from 'react';
import {
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Swipeable } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { Href, useRouter } from 'expo-router';
import { Card } from '../../src/components/native/Card';
import { colors, radii, spacing, typography } from '../../src/theme/tokens';
import { hapticSelection } from '../../src/utils/haptics';
import {
  ToolId,
  isFavourite,
  toggleFavourite,
  useFavouriteTools,
} from '../../src/features/tools/favourites-store';

// ─── Tool metadata ──────────────────────────────────────────────────────────

type Tool = {
  id: ToolId;
  title: string;
  subtitle: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  accent: string;
  accentBg: string;
  route: Href;
};

const TOOLS: Tool[] = [
  {
    id: 'calendar',
    title: 'Calendar',
    subtitle: 'Plan your day, step by step',
    icon: 'calendar-outline',
    accent: colors.primary,
    accentBg: '#E6F4FD',
    route: '/calendar' as Href,
  },
  {
    id: 'step-by-step',
    title: 'Step by Step',
    subtitle: 'Show steps with pictures and timers',
    icon: 'git-compare-outline',
    accent: '#7B61FF',
    accentBg: '#EFEAFF',
    route: '/first-then' as Href,
  },
  {
    id: 'visual-timer',
    title: 'Visual Timer',
    subtitle: 'A calm countdown you can see',
    icon: 'time-outline',
    accent: '#34C759',
    accentBg: '#E6F8EB',
    route: '/visual-timer' as Href,
  },
];

// ─── Tool card ─────────────────────────────────────────────────────────────

function ToolCard({ tool, pinned, onOpen, onToggleStar }: {
  tool: Tool;
  pinned: boolean;
  onOpen: () => void;
  onToggleStar: () => void;
}) {
  // Tiny pop on star toggle — soft spring so it doesn't draw attention.
  const starScale = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.sequence([
      Animated.spring(starScale, {
        toValue: 1.18,
        useNativeDriver: true,
        speed: 28,
        bounciness: 12,
      }),
      Animated.spring(starScale, {
        toValue: 1,
        useNativeDriver: true,
        speed: 22,
        bounciness: 8,
      }),
    ]).start();
  }, [pinned, starScale]);

  // Swipe-left reveals a single Star action. Rubber-band overshoot comes
  // from gesture-handler defaults; we keep `overshootRight` enabled.
  const renderRightActions = useCallback(
    (
      _progress: Animated.AnimatedInterpolation<number>,
      drag: Animated.AnimatedInterpolation<number>,
    ) => {
      const translateX = drag.interpolate({
        inputRange: [-96, 0],
        outputRange: [0, 96],
        extrapolate: 'clamp',
      });
      return (
        <View style={styles.swipeAction}>
          <Animated.View style={{ transform: [{ translateX }] }}>
            <Pressable
              onPress={() => {
                hapticSelection();
                onToggleStar();
              }}
              accessibilityLabel={pinned ? `Unpin ${tool.title}` : `Pin ${tool.title}`}
              accessibilityRole="button"
              style={styles.swipeBtn}
            >
              <Ionicons
                name={pinned ? 'star' : 'star-outline'}
                size={28}
                color={pinned ? '#F5B400' : colors.surface}
              />
            </Pressable>
          </Animated.View>
        </View>
      );
    },
    [pinned, onToggleStar, tool.title],
  );

  return (
    <Swipeable
      renderRightActions={renderRightActions}
      overshootRight
      friction={1.6}
      rightThreshold={32}
    >
      <Pressable
        onPress={onOpen}
        accessibilityRole="button"
        accessibilityLabel={`Open ${tool.title}. ${tool.subtitle}`}
        style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      >
        <View style={[styles.iconChip, { backgroundColor: tool.accentBg }]}>
          <Ionicons name={tool.icon} size={26} color={tool.accent} />
        </View>
        <View style={styles.copy}>
          <Text style={styles.cardTitle}>{tool.title}</Text>
          <Text style={styles.cardSub}>{tool.subtitle}</Text>
        </View>
        <Pressable
          onPress={(e) => {
            e.stopPropagation();
            hapticSelection();
            onToggleStar();
          }}
          hitSlop={14}
          accessibilityLabel={pinned ? `Unpin ${tool.title}` : `Pin ${tool.title}`}
          accessibilityRole="button"
          accessibilityState={{ selected: pinned }}
          style={styles.starHit}
        >
          <Animated.View style={{ transform: [{ scale: starScale }] }}>
            <Ionicons
              name={pinned ? 'star' : 'star-outline'}
              size={24}
              color={pinned ? '#F5B400' : colors.textTertiary}
            />
          </Animated.View>
        </Pressable>
      </Pressable>
    </Swipeable>
  );
}

// ─── Section header ────────────────────────────────────────────────────────

function SectionHeader({ icon, label }: { icon?: React.ComponentProps<typeof Ionicons>['name']; label: string }) {
  return (
    <View style={styles.sectionHead}>
      {icon ? <Ionicons name={icon} size={16} color="#F5B400" /> : null}
      <Text style={styles.sectionTitle}>{label}</Text>
    </View>
  );
}

// ─── Screen ────────────────────────────────────────────────────────────────

export default function ToolsScreen() {
  const router = useRouter();
  const favs = useFavouriteTools();

  const pinned = TOOLS.filter(t => favs.includes(t.id))
    // Match the order the user pinned them in (favs is most-recent first).
    .sort((a, b) => favs.indexOf(a.id) - favs.indexOf(b.id));
  const unpinned = TOOLS.filter(t => !favs.includes(t.id));

  const open = (tool: Tool) => {
    hapticSelection();
    router.push(tool.route);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        bounces
        alwaysBounceVertical
        overScrollMode="always"
      >
        <Text style={styles.pageTitle} accessibilityRole="header">Tools</Text>
        <Text style={styles.pageHint}>
          Tap a tool to open it. Tap the star or swipe left on a card to pin a favourite to the top.
        </Text>

        {pinned.length > 0 && (
          <View style={styles.section}>
            <SectionHeader icon="star" label="Favourites" />
            <View style={styles.list}>
              {pinned.map(tool => (
                <ToolCard
                  key={tool.id}
                  tool={tool}
                  pinned
                  onOpen={() => open(tool)}
                  onToggleStar={() => toggleFavourite(tool.id)}
                />
              ))}
            </View>
          </View>
        )}

        <View style={styles.section}>
          <SectionHeader label="Tools" />
          {unpinned.length === 0 ? (
            <Card style={styles.emptyCard}>
              <Text style={styles.emptyText}>
                Every tool is in Favourites right now. Unpin one to see it here.
              </Text>
            </Card>
          ) : (
            <View style={styles.list}>
              {unpinned.map(tool => (
                <ToolCard
                  key={tool.id}
                  tool={tool}
                  pinned={isFavourite(tool.id)}
                  onOpen={() => open(tool)}
                  onToggleStar={() => toggleFavourite(tool.id)}
                />
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: {
    padding: spacing.lg,
    paddingBottom: 40,
    gap: spacing.lg,
  },

  pageTitle: {
    fontSize: typography.title,
    fontWeight: '900',
    color: colors.text,
    letterSpacing: typography.trackTitle,
  },
  pageHint: {
    fontSize: typography.callout,
    color: colors.textMuted,
    lineHeight: 21,
    marginTop: -spacing.sm,
  },

  section: {
    gap: spacing.sm,
  },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.xs,
  },
  sectionTitle: {
    fontSize: typography.caption,
    fontWeight: '800',
    color: colors.textMuted,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
  },

  list: {
    gap: spacing.md,
  },

  // Card — flat surface, no shadow, generous tap target.
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    minHeight: 76,
  },
  cardPressed: {
    opacity: 0.94,
  },
  iconChip: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: { flex: 1, gap: 2 },
  cardTitle: {
    fontSize: typography.subheading,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: typography.trackSubhead,
  },
  cardSub: {
    fontSize: typography.caption,
    color: colors.textMuted,
  },
  starHit: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Swipe action drawer — sits behind the card on the right.
  swipeAction: {
    width: 96,
    backgroundColor: '#F5B400',
    alignItems: 'center',
    justifyContent: 'center',
    borderTopRightRadius: radii.card,
    borderBottomRightRadius: radii.card,
    marginLeft: -radii.card, // hide the seam under the card's rounded corner
    paddingLeft: radii.card,
  },
  swipeBtn: {
    width: 64,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
  },

  emptyCard: {
    paddingVertical: spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: typography.callout,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 22,
  },
});
