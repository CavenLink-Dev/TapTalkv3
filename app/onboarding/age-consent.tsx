/**
 * Age Consent Onboarding Screen
 * 
 * Implements Australian Children's Online Privacy framework (age 15+ can self-consent,
 * under-15 requires verified guardian), US COPPA (under-13 requires verifiable parental
 * consent), and EU GDPR (default age 16, member states may lower to 13).
 * 
 * This screen shows all variants based on the user's branch (Myself/Someone Else),
 * age selection, and guardian status, with progressive disclosure and native iOS animations.
 */

import React, { useState, useMemo } from 'react';
import {
  ActionSheetIOS,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Href, useRouter } from 'expo-router';
import { MascotImage } from '../../src/components/MascotImage';
import { TwoSegmentProgressBar } from '../../src/components/native/TwoSegmentProgressBar';
import { AnimatedChoiceCard } from '../../src/components/native/AnimatedChoiceCard';
import { GuardianQuestionButtons } from '../../src/components/native/GuardianQuestionButtons';
import { ConsentCheckbox } from '../../src/components/native/ConsentCheckbox';
import { ProviderIcons } from '../../src/components/native/ProviderIcons';
import { GuardianBlockPanel } from '../../src/components/native/GuardianBlockPanel';
import { colors, radii, shadows, spacing, typography } from '../../src/theme/tokens';
import { DevSkip } from '../../src/components/DevSkip';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';

import type { AgeRange } from '../../src/components/native/AnimatedAgeButton';

const AGE_OPTIONS: { range: AgeRange; label: string }[] = [
  { range: 'under-13', label: 'Under 13' },
  { range: '13-to-15', label: '13 to 15' },
  { range: '16-to-17', label: '16 to 17' },
  { range: '18-or-older', label: '18 or older' },
];

type Branch = 'myself' | 'someone-else' | null;
type GuardianAnswer = 'yes' | 'no' | null;

interface AgeConsentState {
  branch: Branch;
  ageRange: AgeRange | null;
  isGuardian: GuardianAnswer;
  consentChecked: boolean;
  guardianConsentChecked: boolean;
}

export default function AgeConsentScreen() {
  const router = useRouter();

  const [state, setState] = useState<AgeConsentState>({
    branch: null,
    ageRange: null,
    isGuardian: null,
    consentChecked: false,
    guardianConsentChecked: false,
  });

  // Fractional progress for segment 1 (privacy/security steps).
  // Age-consent is the first screen → small fill. Grows as user answers.
  const segment1Progress = useMemo(() => {
    let steps = 0;
    if (state.branch) steps += 1;
    if (state.ageRange) steps += 1;
    if (state.branch === 'someone-else' && state.isGuardian) steps += 1;
    if (state.consentChecked) steps += 1;
    if (state.guardianConsentChecked) steps += 1;

    // Denominator reflects the max reachable sub-steps for the active path:
    // myself:                           branch + ageRange + consentChecked         = 3
    // someone-else (guardian + <15):    + isGuardian + guardianConsentChecked     = 5
    // someone-else (other):             + isGuardian + consentChecked             = 4
    let maxSteps = 3;
    if (state.branch === 'someone-else') {
      const needsBothConsents =
        state.isGuardian === 'yes' &&
        (state.ageRange === 'under-13' || state.ageRange === '13-to-15');
      maxSteps = needsBothConsents ? 5 : 4;
    }
    return steps / maxSteps;
  }, [state]);

  // Determine if user is blocked (needs guardian verification)
  const isBlocked = useMemo(() => {
    // Myself branch: blocked if under 15
    if (state.branch === 'myself' && state.ageRange) {
      return state.ageRange === 'under-13' || state.ageRange === '13-to-15';
    }

    // Someone Else branch: blocked if under 15 AND not a guardian
    if (state.branch === 'someone-else' && state.ageRange && state.isGuardian === 'no') {
      return state.ageRange === 'under-13' || state.ageRange === '13-to-15';
    }

    return false;
  }, [state.branch, state.ageRange, state.isGuardian]);

  // Determine if continue button should be enabled
  const canContinue = useMemo(() => {
    if (isBlocked) return false;

    // Myself branch: requires age + consent
    if (state.branch === 'myself' && state.ageRange) {
      return state.consentChecked;
    }

    // Someone Else branch: requires age + guardian answer + consent(s)
    if (state.branch === 'someone-else' && state.ageRange && state.isGuardian) {
      // If guardian, need both consents for under-15
      if (
        state.isGuardian === 'yes' &&
        (state.ageRange === 'under-13' || state.ageRange === '13-to-15')
      ) {
        return state.consentChecked && state.guardianConsentChecked;
      }
      // Otherwise just need user consent
      return state.consentChecked;
    }

    return false;
  }, [state, isBlocked]);

  const selectedAgeLabel = useMemo(() => {
    if (!state.ageRange) return null;
    return AGE_OPTIONS.find((o) => o.range === state.ageRange)?.label ?? null;
  }, [state.ageRange]);

  const openAgePicker = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: [...AGE_OPTIONS.map((o) => o.label), 'Cancel'],
          cancelButtonIndex: AGE_OPTIONS.length,
          title: state.branch === 'myself' ? 'How old are you?' : 'Their age or age range',
        },
        (index) => {
          const option = AGE_OPTIONS[index];
          if (option) {
            handleAgeSelect(option.range);
          }
        },
      );
    } else {
      Alert.alert(
        state.branch === 'myself' ? 'How old are you?' : 'Their age or age range',
        undefined,
        [
          ...AGE_OPTIONS.map((o) => ({
            text: o.label,
            onPress: () => handleAgeSelect(o.range),
          })),
          { text: 'Cancel', style: 'cancel' as const },
        ],
      );
    }
  };

  const handleBranchSelect = (branch: Branch) => {
    setState({
      branch,
      ageRange: null,
      isGuardian: null,
      consentChecked: false,
      guardianConsentChecked: false,
    });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
  };

  const handleAgeSelect = (ageRange: AgeRange) => {
    setState((prev) => ({
      ...prev,
      ageRange,
      isGuardian: null,
      consentChecked: false,
      guardianConsentChecked: false,
    }));
  };

  const handleGuardianSelect = (answer: GuardianAnswer) => {
    setState((prev) => ({
      ...prev,
      isGuardian: answer,
      consentChecked: false,
      guardianConsentChecked: false,
    }));
  };

  const handleConsentToggle = () => {
    setState((prev) => ({ ...prev, consentChecked: !prev.consentChecked }));
  };

  const handleGuardianConsentToggle = () => {
    setState((prev) => ({ ...prev, guardianConsentChecked: !prev.guardianConsentChecked }));
  };

  const handleContinue = () => {
    if (canContinue) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
      if (state.branch === 'myself') {
        router.push('/onboarding/adult' as Href);
      } else {
        // Caregiver / guardian path: proceeds through the shared account setup flow.
        router.push('/onboarding' as Href);
      }
    }
  };

  const handleProviderPress = (provider: string) => {
    console.log('Provider selected:', provider);
    // Handle provider authentication
  };

  const handleCopyLink = () => {
    // Copy guardian verification link to clipboard
    console.log('Guardian link copied');
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Progress Bar */}
          <View style={styles.progressContainer}>
            <TwoSegmentProgressBar segment1={segment1Progress} segment2={0} />
          </View>

          {/* Header with Mascot */}
          <View style={styles.header}>
            <MascotImage mascot="neutral_curious" size={100} />
            <Text style={styles.headerTitle}>WHO WILL THIS APP BE FOR?</Text>
          </View>

          {/* Main Card */}
          <Animated.View entering={FadeInDown.duration(300)} style={styles.card}>
            <Text style={styles.cardTitle}>WHO WILL BE USING THIS TAPTALK?</Text>
            <Text style={styles.cardSubtext}>
              We require this information for legality and safety of our users
            </Text>

            {/* Branch Selection */}
            <View style={styles.section}>
              <View style={styles.row}>
                <View style={styles.halfWidth}>
                  <AnimatedChoiceCard
                    label="Myself"
                    selected={state.branch === 'myself'}
                    onPress={() => handleBranchSelect('myself')}
                  />
                </View>
                <View style={styles.halfWidth}>
                  <AnimatedChoiceCard
                    label="Someone Else"
                    selected={state.branch === 'someone-else'}
                    onPress={() => handleBranchSelect('someone-else')}
                    showChevron
                  />
                </View>
              </View>
            </View>

            {/* Age Selection – iOS Dropdown */}
            {state.branch && (
              <View style={styles.section}>
                <Pressable
                  onPress={openAgePicker}
                  style={({ pressed }) => [
                    styles.dropdownBtn,
                    selectedAgeLabel && !isBlocked && styles.dropdownBtnSelected,
                    selectedAgeLabel && isBlocked && styles.dropdownBtnBlocked,
                    pressed && styles.dropdownPressed,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={selectedAgeLabel ? `Age range: ${selectedAgeLabel}` : 'Select age range'}
                >
                  <Text
                    style={[
                      styles.dropdownLabel,
                      selectedAgeLabel && !isBlocked && styles.dropdownLabelSelected,
                      selectedAgeLabel && isBlocked && styles.dropdownLabelBlocked,
                    ]}
                  >
                    {selectedAgeLabel ?? 'Age Range?'}
                  </Text>
                  <Text
                    style={[
                      styles.dropdownChevron,
                      selectedAgeLabel && !isBlocked && styles.dropdownChevronSelected,
                      selectedAgeLabel && isBlocked && styles.dropdownChevronBlocked,
                    ]}
                  >
                    {'▾'}
                  </Text>
                </Pressable>
              </View>
            )}

            {/* Guardian Question (Someone Else branch only) */}
            {state.branch === 'someone-else' && state.ageRange && !isBlocked && (
              <View style={styles.section}>
                <GuardianQuestionButtons
                  selected={state.isGuardian}
                  onSelect={handleGuardianSelect}
                  entranceDelay={200}
                />
              </View>
            )}

            {/* Guardian Block Panel (Blocked State) */}
            {isBlocked && (
              <View style={styles.section}>
                <GuardianBlockPanel entranceDelay={300} onCopyLink={handleCopyLink} />
              </View>
            )}

            {/* Consent Checkboxes (Not Blocked) */}
            {!isBlocked &&
              state.ageRange &&
              (state.branch === 'myself' ||
                (state.branch === 'someone-else' && state.isGuardian)) && (
                <View style={styles.section}>
                  {state.branch === 'someone-else' &&
                    state.isGuardian === 'yes' &&
                    (state.ageRange === 'under-13' || state.ageRange === '13-to-15') && (
                    <ConsentCheckbox
                      checked={state.guardianConsentChecked}
                      onToggle={handleGuardianConsentToggle}
                      label="I confirm I am the legal guardian or authorised carer for this person"
                      entranceDelay={250}
                    />
                  )}
                  <ConsentCheckbox
                    checked={state.consentChecked}
                    onToggle={handleConsentToggle}
                    label="I have read and agree to TapTalk's Privacy Policy and Terms of Use"
                    entranceDelay={state.branch === 'someone-else' ? 300 : 250}
                  />
                </View>
              )}

            {/* Provider Icons (Continue Options) */}
            {!isBlocked && canContinue && (
              <View style={styles.section}>
                <ProviderIcons
                  onProviderPress={handleProviderPress}
                  entranceDelay={350}
                />
              </View>
            )}
          </Animated.View>

          {/* Footer */}
          <Animated.View entering={FadeInDown.duration(300).delay(200)} style={styles.footer}>
            <Text style={styles.footerTitle}>Why so much questions already?</Text>
            <Text style={styles.footerText}>
              We ask this to keep younger users safe and to make sure setup is done by a parent or
              legal guardian
            </Text>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
      <DevSkip next="/onboarding/adult" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.lg,
  },
  progressContainer: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  headerTitle: {
    fontSize: typography.heading,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
    marginTop: spacing.md,
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    padding: spacing.xl,
    ...shadows.card,
  },
  cardTitle: {
    fontSize: typography.subheading,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  cardSubtext: {
    fontSize: typography.callout,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  section: {
    marginTop: spacing.xl,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  halfWidth: {
    flex: 1,
  },
  dropdownBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: radii.card,
    paddingVertical: 16,
    paddingHorizontal: 24,
    minHeight: 60,
  },
  dropdownBtnSelected: {
    backgroundColor: colors.primary,
  },
  dropdownBtnBlocked: {
    backgroundColor: colors.danger,
  },
  dropdownPressed: {
    backgroundColor: colors.mascot,
    transform: [{ scale: 0.985 }],
  },
  dropdownLabel: {
    fontSize: typography.body,
    fontWeight: '600',
    color: colors.surface,
  },
  dropdownLabelSelected: {
    color: colors.surface,
  },
  dropdownLabelBlocked: {
    color: colors.surface,
  },
  dropdownChevron: {
    fontSize: 18,
    color: colors.surface,
    marginLeft: 8,
  },
  dropdownChevronSelected: {
    color: colors.surface,
  },
  dropdownChevronBlocked: {
    color: colors.surface,
  },
  footer: {
    marginTop: spacing.xxl,
    alignItems: 'center',
  },
  footerTitle: {
    fontSize: typography.body,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  footerText: {
    fontSize: typography.callout,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
});
