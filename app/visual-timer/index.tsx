/**
 * Visual Timer — placeholder.
 *
 * The full timer (h/m/s wheel pickers, Sound disclosure, Lock toggle,
 * analog + digital faces, focus mode) is built in the dedicated Visual
 * Timer step. This stub exists so the tap target on the Tools list
 * resolves to a real route from day one.
 */

import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import { Card } from '../../src/components/native/Card';
import { colors, spacing, typography } from '../../src/theme/tokens';

export default function VisualTimerStub() {
  const router = useRouter();
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={16}
          style={styles.headerBack}
          accessibilityLabel="Back"
          accessibilityRole="button"
        >
          <Ionicons name="chevron-back" size={28} color={colors.primary} />
        </Pressable>
        <Text style={styles.title} accessibilityRole="header">Visual Timer</Text>
        <View style={styles.spacer} />
      </View>

      <View style={styles.body}>
        <Card style={styles.card}>
          <Ionicons name="time-outline" size={48} color={colors.primary} />
          <Text style={styles.cardTitle}>Coming soon</Text>
          <Text style={styles.cardBody}>
            A calm visual countdown with analog and digital faces. Pick your
            duration, optional start delay, and chime — then start.
          </Text>
        </Card>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  headerBack: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
    textAlign: 'center',
    fontSize: typography.heading,
    fontWeight: '900',
    color: colors.text,
    letterSpacing: typography.trackHeading,
  },
  spacer: { width: 44 },

  body: {
    flex: 1,
    padding: spacing.lg,
  },
  card: {
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.xxl,
  },
  cardTitle: {
    fontSize: typography.subheading,
    fontWeight: '800',
    color: colors.text,
  },
  cardBody: {
    fontSize: typography.body,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: spacing.lg,
  },
});
