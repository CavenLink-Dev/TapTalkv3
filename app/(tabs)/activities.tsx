import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Href, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../../src/components/native/Card';
import { Screen } from '../../src/components/native/Screen';
import { colors, radii, spacing, typography } from '../../src/theme/tokens';

interface ActivityCard {
  id: string;
  route: Href;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  iconColor: string;
  iconBg: string;
  name: string;
  description: string;
  tag: string;
}

const ACTIVITY_LIST: ActivityCard[] = [
  {
    id: 'memory-match',
    route: '/activities/memory-match' as Href,
    icon: 'eye-outline',
    iconColor: colors.primary,
    iconBg: '#E6F4FD',
    name: 'Memory Match',
    description: 'A shape appears then hides. Pick the one you saw. Builds visual memory and focus.',
    tag: 'Visual',
  },
  {
    id: 'picture-match',
    route: '/activities/picture-match' as Href,
    icon: 'text-outline',
    iconColor: '#BD73FF',
    iconBg: '#F3EAFF',
    name: 'Picture Match',
    description: 'A word is shown. Find the matching card. Connects language with recognition.',
    tag: 'Language',
  },
  {
    id: 'count-along',
    route: '/activities/count-along' as Href,
    icon: 'calculator-outline',
    iconColor: '#FF9500',
    iconBg: '#FFF4E0',
    name: 'Count Along',
    description: 'Count the dots on screen then choose the right number. No pressure, no time limit.',
    tag: 'Numbers',
  },
  {
    id: 'shape-match',
    route: '/activities/shape-match' as Href,
    icon: 'shapes-outline',
    iconColor: '#34C759',
    iconBg: '#E8FAE8',
    name: 'Shape Match',
    description: 'Match each shape to its matching outline. Builds visual recognition and tap control.',
    tag: 'Visual',
  },
];

export default function ActivitiesScreen() {
  const router = useRouter();

  return (
    <Screen title="Activities" subtitle="Practice focus, memory, language, and numbers.">
      {ACTIVITY_LIST.map((activity) => (
        <Pressable
          key={activity.id}
          accessibilityRole="button"
          accessibilityLabel={`Start ${activity.name}`}
          onPress={() => router.push(activity.route)}
          style={({ pressed }) => pressed && styles.cardPressed}
        >
          <Card style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={[styles.iconBox, { backgroundColor: activity.iconBg }]}>
                <Ionicons name={activity.icon} size={26} color={activity.iconColor} />
              </View>
              <View style={styles.cardCopy}>
                <View style={styles.nameRow}>
                  <Text style={styles.name}>{activity.name}</Text>
                  <View style={[styles.tag, { backgroundColor: activity.iconBg }]}>
                    <Text style={[styles.tagText, { color: activity.iconColor }]}>{activity.tag}</Text>
                  </View>
                </View>
                <Text style={styles.description}>{activity.description}</Text>
              </View>
            </View>
            <View style={styles.cardFooter}>
              <Text style={styles.startLabel}>Start</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.primary} />
            </View>
          </Card>
        </Pressable>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  cardPressed: {
    opacity: 0.92,
  },
  card: {
    marginBottom: spacing.md,
    gap: spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  iconBox: {
    width: 52,
    height: 52,
    borderRadius: radii.card,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  cardCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  name: {
    fontSize: typography.body,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.2,
  },
  tag: {
    borderRadius: radii.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  tagText: {
    fontSize: typography.eyebrow,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  description: {
    fontSize: typography.callout,
    color: colors.textMuted,
    lineHeight: 20,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 2,
  },
  startLabel: {
    fontSize: typography.callout,
    fontWeight: '800',
    color: colors.primary,
  },
});
