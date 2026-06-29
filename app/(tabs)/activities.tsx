import React from 'react';
import { ImageBackground, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { Href, useRouter } from 'expo-router';
import { Screen } from '../../src/components/native/Screen';
import { colors, radii, spacing, typography } from '../../src/theme/tokens';
import { hapticSelection } from '../../src/utils/haptics';

// ─── Save your generated images here ────────────────────────────────────────
//  asset/activities/shape-match.png
//  asset/activities/memory-match.png
//  asset/activities/picture-match.png
//  asset/activities/count-along.png

interface ActivityCard {
  id: string;
  route: Href;
  iconColor: string;
  iconBg: string;
  name: string;
  description: string;
  tag: string;
  image: number;
}

const ACTIVITY_LIST: ActivityCard[] = [
  {
    id: 'shape-match',
    route: '/activities/shape-match' as Href,
    iconColor: '#34C759',
    iconBg: '#E8FAE8',
    name: 'Shape Match',
    description: 'Match shapes to their outlines.',
    tag: 'Visual',
    image: require('../../assets/activities/shape-match.png'),
  },
  {
    id: 'memory-match',
    route: '/activities/memory-match' as Href,
    iconColor: colors.primary,
    iconBg: '#E6F4FD',
    name: 'Memory Match',
    description: 'A shape appears then hides. Pick what you saw.',
    tag: 'Memory',
    image: require('../../assets/activities/memory-match.png'),
  },
  {
    id: 'picture-match',
    route: '/activities/picture-match' as Href,
    iconColor: '#BD73FF',
    iconBg: '#F3EAFF',
    name: 'Picture Match',
    description: 'A word is shown. Find the matching card.',
    tag: 'Language',
    image: require('../../assets/activities/picture-match.png'),
  },
  {
    id: 'count-along',
    route: '/activities/count-along' as Href,
    iconColor: '#FF9500',
    iconBg: '#FFF4E0',
    name: 'Count Along',
    description: 'Count the dots and choose the right number.',
    tag: 'Numbers',
    image: require('../../assets/activities/count-along.png'),
  },
];

const CARD_GAP = spacing.sm;
const SIDE_PADDING = spacing.lg * 2;

export default function ActivitiesScreen() {
  const router = useRouter();
  const { width: screenWidth } = useWindowDimensions();
  const cardWidth = (screenWidth - SIDE_PADDING - CARD_GAP) / 2;

  return (
    <Screen title="Activities" subtitle="Practice focus, memory, language, and numbers.">
      <View style={styles.grid}>
        {ACTIVITY_LIST.map((activity) => (
          <Pressable
            key={activity.id}
            accessibilityRole="button"
            accessibilityLabel={`Start ${activity.name}`}
            onPress={() => { hapticSelection(); router.push(activity.route); }}
            style={({ pressed }) => [
              styles.card,
              { width: cardWidth },
              pressed && styles.cardPressed,
            ]}
          >
            {/* Hero — full-bleed illustration; accent colour shows while image loads */}
            <ImageBackground
              source={activity.image}
              style={[styles.cardHero, { backgroundColor: activity.iconBg }]}
              imageStyle={styles.cardHeroImage}
              resizeMode="cover"
            />

            {/* Text body */}
            <View style={styles.cardBody}>
              <View style={[styles.tag, { backgroundColor: activity.iconBg }]}>
                <Text style={[styles.tagText, { color: activity.iconColor }]}>
                  {activity.tag}
                </Text>
              </View>
              <Text style={styles.name}>{activity.name}</Text>
              <Text style={styles.description} numberOfLines={2}>
                {activity.description}
              </Text>
            </View>
          </Pressable>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: CARD_GAP,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    overflow: 'hidden',
  },
  cardPressed: {
    opacity: 0.88,
  },
  cardHero: {
    height: 120,
    width: '100%',
  },
  cardHeroImage: {
    borderTopLeftRadius: radii.card,
    borderTopRightRadius: radii.card,
  },
  cardBody: {
    padding: spacing.md,
    gap: 4,
  },
  tag: {
    alignSelf: 'flex-start',
    borderRadius: radii.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  tagText: {
    fontSize: typography.eyebrow,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  name: {
    fontSize: typography.body,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.2,
    marginTop: 2,
  },
  description: {
    fontSize: typography.caption,
    color: colors.textMuted,
    lineHeight: 17,
    marginTop: 2,
  },
});
