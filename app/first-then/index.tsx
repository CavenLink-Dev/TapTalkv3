/**
 * First / Then sequence — the main page.
 *
 * Single-purpose screen: shows the current sequence as a vertical chain
 * (First → Then → Then …) and exposes one obvious action — a large
 * "Add Step" button at the bottom. Designed for users with disabilities
 * so type sizes, tap targets, and spacing are all generous and a step
 * never wraps in a confusing way.
 */

import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Href, Stack, useRouter } from 'expo-router';
import { Card } from '../../src/components/native/Card';
import { colors, radii, spacing, typography } from '../../src/theme/tokens';
import { hapticSelection } from '../../src/utils/haptics';
import {
  clearFirstThen,
  removeFirstThen,
  useFirstThenItems,
} from '../../src/features/first-then/store';

const addStepRoute = '/first-then/add-step' as Href;

function hexAlpha(hex: string, a: number): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

export default function FirstThenScreen() {
  const router = useRouter();
  const items = useFirstThenItems();
  const isEmpty = items.length === 0;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={16}
          style={styles.headerIconBtn}
          accessibilityLabel="Go back"
          accessibilityRole="button"
        >
          <Ionicons name="chevron-back" size={28} color={colors.primary} />
        </Pressable>
        <Text style={styles.headerTitle} accessibilityRole="header">First / Then</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        bounces
        alwaysBounceVertical
        overScrollMode="always"
      >
        <Text style={styles.subtitle}>
          Build a step-by-step sequence. Tap the plus button to add what comes next.
        </Text>

        {isEmpty ? (
          <Card style={styles.emptyCard}>
            <View style={styles.emptyBadge}>
              <Ionicons name="git-compare-outline" size={44} color={colors.primary} />
            </View>
            <Text style={styles.emptyTitle}>No steps yet</Text>
            <Text style={styles.emptyBody}>
              Start with one step — like “First Shower”. You can keep adding more after that.
            </Text>
          </Card>
        ) : (
          <View style={styles.chain}>
            {items.map((item, i) => {
              const word = i === 0 ? 'First' : 'Then';
              return (
                <View key={item.id}>
                  <View style={styles.chainRow}>
                    <View style={styles.wordPill}>
                      <Text style={styles.wordPillText}>{word}</Text>
                    </View>
                    <View style={styles.stepCard}>
                      <View
                        style={[
                          styles.symbolChip,
                          { backgroundColor: hexAlpha(item.symbolColor, 0.18) },
                        ]}
                      >
                        <Ionicons
                          name={item.symbol as React.ComponentProps<typeof Ionicons>['name']}
                          size={38}
                          color={item.symbolColor}
                        />
                      </View>
                      <View style={styles.stepInfo}>
                        <Text style={styles.stepName} numberOfLines={2}>
                          {item.name}
                        </Text>
                        {item.minutes != null && (
                          <View style={styles.timerRow}>
                            <Ionicons
                              name="timer-outline"
                              size={16}
                              color={colors.primary}
                            />
                            <Text style={styles.timerText}>{item.minutes} min</Text>
                          </View>
                        )}
                      </View>
                      <Pressable
                        onPress={() => {
                          hapticSelection();
                          removeFirstThen(item.id);
                        }}
                        hitSlop={14}
                        style={styles.removeBtn}
                        accessibilityLabel={`Remove ${item.name}`}
                        accessibilityRole="button"
                      >
                        <Ionicons
                          name="close-circle"
                          size={30}
                          color={colors.textTertiary}
                        />
                      </Pressable>
                    </View>
                  </View>

                  {i < items.length - 1 && (
                    <View style={styles.connector} accessibilityElementsHidden>
                      <View style={styles.connectorLine} />
                      <Ionicons name="arrow-down" size={22} color={colors.primary} />
                      <View style={styles.connectorLine} />
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}

        <Pressable
          onPress={() => {
            hapticSelection();
            router.push(addStepRoute);
          }}
          style={({ pressed }) => [styles.addBtn, pressed && styles.btnPressed]}
          accessibilityLabel="Add a step"
          accessibilityRole="button"
        >
          <View style={styles.addBtnIcon}>
            <Ionicons name="add" size={28} color={colors.surface} />
          </View>
          <Text style={styles.addBtnText}>
            {isEmpty ? 'Add First Step' : 'Add Another Step'}
          </Text>
        </Pressable>

        {!isEmpty && (
          <Pressable
            onPress={() => {
              hapticSelection();
              clearFirstThen();
            }}
            style={({ pressed }) => [styles.clearBtn, pressed && { opacity: 0.6 }]}
            accessibilityLabel="Clear all steps"
            accessibilityRole="button"
          >
            <Text style={styles.clearBtnText}>Clear All Steps</Text>
          </Pressable>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  headerIconBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: typography.heading,
    fontWeight: '900',
    color: colors.text,
    letterSpacing: typography.trackHeading,
  },
  headerSpacer: { width: 44 },

  scroll: {
    padding: spacing.lg,
    paddingBottom: 60,
    gap: spacing.lg,
  },

  subtitle: {
    fontSize: typography.body,
    color: colors.textMuted,
    lineHeight: 24,
  },

  // Empty state
  emptyCard: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
    gap: spacing.md,
  },
  emptyBadge: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#E6F4FD',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: typography.subheading,
    fontWeight: '800',
    color: colors.text,
  },
  emptyBody: {
    fontSize: typography.body,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: spacing.lg,
  },

  // Chain
  chain: {
    gap: 0,
  },
  chainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  wordPill: {
    width: 72,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wordPillText: {
    color: colors.surface,
    fontSize: typography.callout,
    fontWeight: '900',
    letterSpacing: 0.4,
  },

  stepCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radii.card,
  },
  symbolChip: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepInfo: {
    flex: 1,
    gap: 6,
  },
  stepName: {
    fontSize: typography.subheading,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: typography.trackSubhead,
  },
  timerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E6F4FD',
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radii.pill,
  },
  timerText: {
    fontSize: typography.caption,
    fontWeight: '700',
    color: colors.primary,
  },
  removeBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Connector between steps
  connector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingLeft: 72 + spacing.md,
    paddingVertical: spacing.sm,
  },
  connectorLine: {
    height: 2,
    width: 18,
    backgroundColor: colors.primary,
    opacity: 0.35,
    borderRadius: 1,
  },

  // Buttons
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    paddingVertical: 18,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.pill,
    minHeight: 60,
    marginTop: spacing.sm,
  },
  btnPressed: { opacity: 0.85 },
  addBtnIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  addBtnText: {
    color: colors.surface,
    fontSize: typography.body,
    fontWeight: '800',
    letterSpacing: -0.2,
  },

  clearBtn: {
    alignSelf: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  clearBtnText: {
    color: colors.danger,
    fontSize: typography.callout,
    fontWeight: '700',
  },
});
