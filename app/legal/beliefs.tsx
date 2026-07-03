/**
 * Our Beliefs — a calm "about us" page moved off the main Profile list so the
 * settings index stays clean (no paragraph clutter). Plain prose, tokens only,
 * native swipe-back header.
 */

import React from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/theme/useTheme';
import { spacing, typography } from '../../src/theme/tokens';
import { fonts } from '../../src/theme/fonts';
import { hapticSelection } from '../../src/utils/haptics';

const MASCOT = require('../../assets/mascot_library/png_mascot/mascot_happy_looking_up.png');

const BELIEFS: { title: string; body: string }[] = [
  {
    title: 'Communication is a right',
    body: 'Everyone deserves a way to be heard. TapTalk exists to give a calm, reliable voice to people who communicate with symbols.',
  },
  {
    title: 'Calm over clever',
    body: 'We choose quiet, predictable design over flashy features. No noise, no pressure, no surprises — just clear tools that work the same way every time.',
  },
  {
    title: 'Dignity first',
    body: 'TapTalk is built for people of every age. It is never childish or patronising, and it respects the person using it.',
  },
  {
    title: 'Your data stays yours',
    body: 'Your profile and boards live on your device. We ask only for what a profile needs, and you can export or delete your data at any time.',
  },
];

export default function BeliefsScreen() {
  const router = useRouter();
  const t = useTheme();

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: t.colors.background }]} edges={['top']}>
      <View style={[styles.header, { backgroundColor: t.colors.surface, borderBottomColor: t.colors.border }]}>
        <Pressable
          onPress={() => {
            hapticSelection();
            router.back();
          }}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          style={styles.backButton}
          hitSlop={8}
        >
          <Ionicons name="chevron-back" size={26} color={t.colors.primary} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: t.colors.text }]}>Our Beliefs</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        bounces
        alwaysBounceVertical
        overScrollMode="always"
      >
        <View style={styles.hero}>
          <Image
            source={MASCOT}
            style={styles.mascot}
            resizeMode="contain"
            accessibilityIgnoresInvertColors
            accessibilityElementsHidden
            importantForAccessibility="no"
          />
          <Text style={[styles.lead, { color: t.colors.textMuted }]}>
            TapTalk is an AAC app that helps everyone build and speak messages with symbols,
            routines, and calm tools — built with care in Adelaide, South Australia.
          </Text>
        </View>

        {BELIEFS.map((b) => (
          <View key={b.title} style={styles.belief}>
            <Text style={[styles.beliefTitle, { color: t.colors.text }]}>{b.title}</Text>
            <Text style={[styles.beliefBody, { color: t.colors.textMuted }]}>{b.body}</Text>
          </View>
        ))}

        <Text style={[styles.footer, { color: t.colors.textTertiary }]}>
          © 2026 TapTalk · Adelaide, South Australia
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
  },
  backButton: { width: 44, height: 44, alignItems: 'flex-start', justifyContent: 'center' },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontFamily: fonts.displayHeavy,
    fontSize: typography.body,
    letterSpacing: -0.2,
  },
  headerSpacer: { width: 44 },

  content: { padding: spacing.lg, paddingBottom: 40, gap: spacing.xl },
  hero: { alignItems: 'center', gap: spacing.md },
  mascot: { width: 96, height: 96 },
  lead: {
    fontFamily: fonts.body,
    fontSize: typography.callout,
    lineHeight: 22,
    textAlign: 'center',
  },
  belief: { gap: spacing.xs },
  beliefTitle: {
    fontFamily: fonts.displayHeavy,
    fontSize: typography.subheading,
    letterSpacing: -0.2,
  },
  beliefBody: {
    fontFamily: fonts.body,
    fontSize: typography.callout,
    lineHeight: 22,
  },
  footer: {
    fontFamily: fonts.body,
    fontSize: 10,
    lineHeight: 14,
    textAlign: 'center',
  },
});
