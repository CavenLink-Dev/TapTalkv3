import React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { SegmentedProgressBar } from '../native/SegmentedProgressBar';
import { REGISTRATION_TOTAL_STEPS } from '../../context/RegistrationContext';
import { spacing, typography } from '../../theme/tokens';
import { fonts } from '../../theme/fonts';
import { useTheme } from '../../theme/useTheme';
import { useReduceMotion } from '../../hooks/useReduceMotion';
import { hapticSelection } from '../../utils/haptics';

interface RegistrationScaffoldProps {
  /** 1-based step number for the progress bar. */
  step: number;
  title: string;
  subtitle?: string;
  /** The CTA(s) pinned to the bottom of the screen. */
  footer: React.ReactNode;
  children: React.ReactNode;
  /** Wrap content in a ScrollView (use for field-heavy steps). Defaults to false. */
  scroll?: boolean;
  /** Hide the progress bar entirely (used by the final "Verified" screen). */
  hideProgress?: boolean;
}

/**
 * Shared layout for every registration step.
 *
 * Header: a "<" back button (hidden on step 1) sitting just left of the
 * segmented progress bar with a small gap, exactly as specified.
 * Body: title + optional subtitle + step content.
 * Footer: sticky CTA above the home indicator. Keyboard-aware and adult/clean.
 */
export function RegistrationScaffold({
  step,
  title,
  subtitle,
  footer,
  children,
  scroll = false,
  hideProgress = false,
}: RegistrationScaffoldProps) {
  const router = useRouter();
  const t = useTheme();
  const reduceMotion = useReduceMotion();
  const canGoBack = step > 1;
  const bodyEntering = reduceMotion
    ? FadeIn.duration(180)
    : FadeInDown.duration(320);
  const footerEntering = reduceMotion
    ? FadeIn.duration(180)
    : FadeIn.duration(320).delay(120);

  const handleBack = () => {
    hapticSelection();
    router.back();
  };

  const body = (
    <Animated.View style={styles.body} entering={bodyEntering}>
      <Text style={[styles.title, { color: t.colors.text }]} accessibilityRole="header">
        {title}
      </Text>
      {subtitle ? (
        <Text style={[styles.subtitle, { color: t.colors.textMuted }]}>{subtitle}</Text>
      ) : null}
      <View style={styles.content}>{children}</View>
    </Animated.View>
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: t.colors.background }]}
      edges={['top', 'bottom']}
    >
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          {canGoBack ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Go back to the previous step"
              onPress={handleBack}
              style={({ pressed }) => [
                styles.backBtn,
                pressed && { backgroundColor: t.colors.inputBg },
              ]}
            >
              <Ionicons name="chevron-back" size={24} color={t.colors.text} />
            </Pressable>
          ) : null}
          {hideProgress ? <View style={styles.progressSpacer} /> : (
            <SegmentedProgressBar currentStep={step} totalSteps={REGISTRATION_TOTAL_STEPS} />
          )}
        </View>

        {scroll ? (
          <ScrollView
            style={styles.flex}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {body}
          </ScrollView>
        ) : (
          body
        )}

        <Animated.View style={styles.footer} entering={footerEntering}>
          {footer}
        </Animated.View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
  },
  backBtn: {
    width: 44,
    height: 44,
    marginLeft: -10,
    marginRight: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
  },
  progressSpacer: {
    flex: 1,
  },
  body: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
  },
  scrollContent: {
    flexGrow: 1,
  },
  title: {
    fontFamily: fonts.displayHeavy,
    fontSize: typography.title,
    letterSpacing: typography.trackTitle,
    lineHeight: 34,
  },
  subtitle: {
    marginTop: spacing.sm,
    fontFamily: fonts.body,
    fontSize: typography.body,
    lineHeight: 23,
  },
  content: {
    marginTop: spacing.xl,
    flex: 1,
  },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    gap: spacing.sm,
  },
});
