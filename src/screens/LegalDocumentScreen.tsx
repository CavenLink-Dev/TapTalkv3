/**
 * LegalDocumentScreen — scrollable legal / policy content with back navigation.
 */

import React from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '../components/native/ThemedText';
import { spacing } from '../theme/tokens';
import { useTheme } from '../theme/useTheme';
import { hapticSelection } from '../utils/haptics';

interface LegalSectionProps {
  heading: string;
  children: React.ReactNode;
}

export function LegalSection({ heading, children }: LegalSectionProps) {
  const t = useTheme();

  return (
    <View style={styles.section}>
      <ThemedText variant="subheading" accessibilityRole="header">
        {heading}
      </ThemedText>
      <ThemedText variant="body" color={t.colors.textMuted} style={styles.sectionBody}>
        {children}
      </ThemedText>
    </View>
  );
}

interface LegalDocumentScreenProps {
  title: string;
  subtitle?: string;
  reviewNotice?: string;
  children: React.ReactNode;
}

export function LegalDocumentScreen({
  title,
  subtitle,
  reviewNotice,
  children,
}: LegalDocumentScreenProps) {
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
        >
          <Ionicons name="chevron-back" size={26} color={t.colors.primary} />
        </Pressable>
        <ThemedText variant="heading" style={styles.headerTitle} numberOfLines={1}>
          {title}
        </ThemedText>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.content}
        bounces
        alwaysBounceVertical
        overScrollMode="always"
        showsVerticalScrollIndicator={false}
      >
        {subtitle ? (
          <ThemedText variant="callout" color={t.colors.textMuted} style={styles.subtitle}>
            {subtitle}
          </ThemedText>
        ) : null}
        {children}
        {reviewNotice ? (
          <ThemedText variant="caption" color={t.colors.textTertiary} style={styles.reviewNotice}>
            {reviewNotice}
          </ThemedText>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    minHeight: 52,
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 44,
  },
  screen: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.lg,
  },
  subtitle: {
    marginBottom: spacing.xs,
  },
  section: {
    gap: spacing.sm,
  },
  sectionBody: {
    lineHeight: 22,
  },
  reviewNotice: {
    marginTop: spacing.md,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
});
