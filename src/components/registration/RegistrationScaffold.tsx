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
import { colors, spacing, typography } from '../../theme/tokens';
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
}: RegistrationScaffoldProps) {
  const router = useRouter();
  const canGoBack = step > 1;

  const handleBack = () => {
    hapticSelection();
    router.back();
  };

  const body = (
    <Animated.View style={styles.body} entering={FadeInDown.duration(320)}>
      <Text style={styles.title} accessibilityRole="header">
        {title}
      </Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      <View style={styles.content}>{children}</View>
    </Animated.View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
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
              hitSlop={10}
              style={({ pressed }) => [styles.backBtn, pressed && styles.backBtnPressed]}
            >
              <Ionicons name="chevron-back" size={24} color={colors.text} />
            </Pressable>
          ) : null}
          <SegmentedProgressBar currentStep={step} totalSteps={REGISTRATION_TOTAL_STEPS} />
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

        <Animated.View style={styles.footer} entering={FadeIn.duration(320).delay(120)}>
          {footer}
        </Animated.View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
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
    width: 32,
    height: 32,
    marginLeft: -6,
    marginRight: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
  },
  backBtnPressed: {
    backgroundColor: colors.inputBg,
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
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.5,
    lineHeight: 34,
  },
  subtitle: {
    marginTop: spacing.sm,
    fontSize: typography.body,
    color: colors.textMuted,
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
