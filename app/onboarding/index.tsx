import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Href, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card } from '../../src/components/native/Card';
import { PrimaryButton } from '../../src/components/native/PrimaryButton';
import { ProgressDots } from '../../src/components/native/ProgressDots';
import { TextField } from '../../src/components/native/TextField';
import { TapTalkMascot } from '../../src/components/TapTalkMascot';
import { useAppContext } from '../../src/hooks/useAppContext';
import { colors, radii, spacing, typography } from '../../src/theme/tokens';

const totalSteps = 5;
const areas = ['Communication', 'Daily routine', 'Activities', 'Goals', 'All of the above'];
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const payRoute = '/pay' as Href;

export default function Onboarding() {
  const router = useRouter();
  const { dispatch } = useAppContext();
  const [step, setStep] = useState(1);
  const [legalName, setLegalName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [parentEmail, setParentEmail] = useState('');
  const [timeoutHours, setTimeoutHours] = useState('');
  const [selectedAreas, setSelectedAreas] = useState<string[]>([]);

  const firstName = legalName.trim().split(/\s+/)[0] || 'friend';
  const currentValid = useMemo(() => {
    if (step === 1) return legalName.trim().length > 1 && displayName.trim().length > 1;
    if (step === 3) {
      return pin.length === 6 && pin === confirmPin && emailPattern.test(parentEmail.trim());
    }
    if (step === 4) return Number(timeoutHours) > 0;
    if (step === 5) return selectedAreas.length > 0;
    return true;
  }, [confirmPin, displayName, legalName, parentEmail, pin, selectedAreas.length, step, timeoutHours]);

  const next = () => {
    if (step < totalSteps) {
      setStep((value) => value + 1);
      return;
    }

    dispatch({
      type: 'SET_USER',
      payload: {
        legalName: legalName.trim(),
        displayName: displayName.trim(),
        name: legalName.trim(),
        nickname: displayName.trim(),
        role: 'guardian',
        useCases: selectedAreas,
      },
    });
    dispatch({
      type: 'SET_PARENT',
      payload: {
        lockEnabled: true,
        pin,
        email: parentEmail.trim(),
        timeoutHours: Number(timeoutHours),
      },
    });
    dispatch({ type: 'COMPLETE_ONBOARDING' });
    router.replace(payRoute);
  };

  const toggleArea = (area: string) => {
    setSelectedAreas((current) =>
      current.includes(area)
        ? current.filter((item) => item !== area)
        : [...current, area],
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        {step > 1 ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go back"
            onPress={() => setStep((value) => Math.max(1, value - 1))}
            style={styles.backButton}
          >
            <Text style={styles.backText}>‹ Back</Text>
          </Pressable>
        ) : (
          <View style={styles.backPlaceholder} />
        )}
        <ProgressDots current={step} total={totalSteps} />
      </View>

      <View style={styles.content}>
        {step === 1 ? (
          <View style={styles.step}>
            <TapTalkMascot variant="head" style={styles.bigMascot} />
            <Text style={styles.title}>Welcome to TapTalk</Text>
            <Text style={styles.speech}>Hello, my name is Clo. What should I call you?</Text>
            <TextField
              accessibilityLabel="Legal name"
              placeholder="Legal name"
              value={legalName}
              onChangeText={setLegalName}
              style={styles.field}
            />
            <TextField
              accessibilityLabel="Display name"
              placeholder="Display name"
              value={displayName}
              onChangeText={setDisplayName}
              style={styles.field}
            />
          </View>
        ) : null}

        {step === 2 ? (
          <View style={styles.step}>
            <TapTalkMascot variant="business" style={styles.bigMascot} />
            <Text style={styles.title}>Heads Up!</Text>
            <Text style={styles.body}>
              Nice to meet you, {displayName || firstName}. You will need a parent or guardian to help with the next step.
            </Text>
            <Card style={styles.noticeCard}>
              <Text style={styles.noticeTitle}>Parent/Guardian Notice</Text>
              <Text style={styles.noticeText}>
                TapTalk is simple and calm, but caregiver controls protect settings and keep the app consistent.
              </Text>
            </Card>
          </View>
        ) : null}

        {step === 3 ? (
          <View style={styles.step}>
            <Text style={styles.title}>Parent/Guardian Control</Text>
            <Text style={styles.body}>Create a 6-digit PIN and add a real email address for mock verification.</Text>
            <TextField
              accessibilityLabel="Six digit PIN"
              placeholder="6-digit PIN"
              keyboardType="number-pad"
              maxLength={6}
              secureTextEntry
              value={pin}
              onChangeText={setPin}
              style={styles.field}
            />
            <TextField
              accessibilityLabel="Confirm PIN"
              placeholder="Re-enter PIN"
              keyboardType="number-pad"
              maxLength={6}
              secureTextEntry
              value={confirmPin}
              onChangeText={setConfirmPin}
              style={styles.field}
            />
            <TextField
              accessibilityLabel="Parent email"
              placeholder="Parent email"
              keyboardType="email-address"
              autoCapitalize="none"
              value={parentEmail}
              onChangeText={setParentEmail}
              style={styles.field}
            />
          </View>
        ) : null}

        {step === 4 ? (
          <View style={styles.step}>
            <TapTalkMascot variant="astronaut" style={styles.bigMascot} />
            <Text style={styles.title}>Set Parental Timeout</Text>
            <Text style={styles.body}>Pick how many inactive hours pass before TapTalk locks itself.</Text>
            <TextField
              accessibilityLabel="Inactivity timeout hours"
              placeholder="Hours"
              keyboardType="number-pad"
              value={timeoutHours}
              onChangeText={setTimeoutHours}
              style={[styles.field, styles.centeredField]}
            />
          </View>
        ) : null}

        {step === 5 ? (
          <View style={styles.step}>
            <Text style={styles.title}>Choose your growth bubbles</Text>
            <Text style={styles.body}>Pick one or more areas. The continue button turns on once you choose.</Text>
            <View style={styles.bubbleWrap}>
              {areas.map((area, index) => {
                const selected = selectedAreas.includes(area);
                return (
                  <Pressable
                    key={area}
                    accessibilityRole="button"
                    accessibilityLabel={`Select ${area}`}
                    accessibilityState={{ selected }}
                    onPress={() => toggleArea(area)}
                    style={({ pressed }) => [
                      styles.bubble,
                      index % 2 === 0 && styles.bubbleLarge,
                      selected && styles.bubbleSelected,
                      pressed && styles.bubblePressed,
                    ]}
                  >
                    <Text style={[styles.bubbleText, selected && styles.bubbleTextSelected]}>{area}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ) : null}
      </View>

      <View style={styles.footer}>
        <PrimaryButton
          accessibilityLabel={step === totalSteps ? 'Finish onboarding' : 'Continue onboarding'}
          label={step === totalSteps ? "LET'S GO" : 'Continue'}
          disabled={!currentValid}
          onPress={next}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  backButton: {
    minWidth: 82,
  },
  backPlaceholder: {
    minWidth: 82,
  },
  backText: {
    color: colors.primary,
    fontSize: typography.callout,
    fontWeight: '800',
  },
  bigMascot: {
    width: 180,
    height: 180,
    marginBottom: spacing.lg,
  },
  body: {
    marginTop: spacing.sm,
    color: colors.text,
    fontSize: typography.body,
    lineHeight: 25,
    textAlign: 'center',
  },
  bubble: {
    minWidth: 132,
    minHeight: 76,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.borderBlue,
    borderRadius: 38,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
  },
  bubbleLarge: {
    minHeight: 92,
    borderRadius: 46,
  },
  bubblePressed: {
    transform: [{ scale: 0.94 }],
  },
  bubbleSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.softBlue,
  },
  bubbleText: {
    color: colors.text,
    fontSize: typography.callout,
    fontWeight: '800',
    textAlign: 'center',
  },
  bubbleTextSelected: {
    color: colors.primary,
  },
  bubbleWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.md,
    marginTop: spacing.xl,
  },
  centeredField: {
    textAlign: 'center',
    fontSize: 22,
    fontWeight: '800',
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.xl,
  },
  field: {
    width: '100%',
    marginTop: spacing.md,
  },
  footer: {
    padding: spacing.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  noticeCard: {
    marginTop: spacing.xl,
  },
  noticeText: {
    marginTop: 4,
    color: colors.textMuted,
    fontSize: typography.callout,
    lineHeight: 21,
    textAlign: 'center',
  },
  noticeTitle: {
    color: colors.primary,
    fontSize: typography.body,
    fontWeight: '900',
    textAlign: 'center',
  },
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  speech: {
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(60,60,67,0.18)',
    borderRadius: 18,
    backgroundColor: colors.surface,
    color: colors.text,
    fontSize: typography.callout,
    lineHeight: 22,
    padding: spacing.lg,
    textAlign: 'center',
  },
  step: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: colors.primary,
    fontSize: typography.title,
    fontWeight: '900',
    letterSpacing: -0.5,
    textAlign: 'center',
  },
});
