import React, { useCallback } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Speech from 'expo-speech';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../../src/components/native/Card';
import { PrimaryButton } from '../../src/components/native/PrimaryButton';
import { useAppContext } from '../../src/hooks/useAppContext';
import { colors, radii, spacing, typography } from '../../src/theme/tokens';
import { hapticSelection } from '../../src/utils/haptics';

const RATE_OPTIONS: { label: string; value: number; description: string }[] = [
  { label: 'Slow', value: 0.7, description: 'Clear and relaxed pacing' },
  { label: 'Normal', value: 0.9, description: 'Standard speaking speed' },
  { label: 'Fast', value: 1.2, description: 'Quicker delivery' },
];

const PITCH_OPTIONS: { label: string; value: number; description: string }[] = [
  { label: 'Low', value: 0.8, description: 'Deeper voice tone' },
  { label: 'Normal', value: 1.0, description: 'Standard pitch' },
  { label: 'High', value: 1.3, description: 'Higher voice tone' },
];

const SAMPLE_PHRASE = 'Hello, I use TapTalk to communicate.';

export default function VoiceSettingsScreen() {
  const router = useRouter();
  const { state, dispatch } = useAppContext();
  const { speechRate, speechPitch } = state.accessibility;

  const setRate = useCallback((value: number) => {
    hapticSelection();
    dispatch({ type: 'SET_ACCESSIBILITY', payload: { speechRate: value } });
  }, [dispatch]);

  const setPitch = useCallback((value: number) => {
    hapticSelection();
    dispatch({ type: 'SET_ACCESSIBILITY', payload: { speechPitch: value } });
  }, [dispatch]);

  const testVoice = useCallback(() => {
    Speech.stop();
    Speech.speak(SAMPLE_PHRASE, { rate: speechRate, pitch: speechPitch });
  }, [speechRate, speechPitch]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          style={styles.backButton}
        >
          <Ionicons name="chevron-back" size={26} color={colors.primary} />
        </Pressable>
        <Text style={styles.headerTitle}>Voice and Speech</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        bounces
        alwaysBounceVertical
        overScrollMode="always"
      >

        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>SPEECH RATE</Text>
          <Text style={styles.sectionDesc}>How fast TapTalk speaks your message.</Text>
          <View style={styles.optionGroup}>
            {RATE_OPTIONS.map((opt) => {
              const selected = Math.abs(speechRate - opt.value) < 0.05;
              return (
                <Pressable
                  key={opt.label}
                  onPress={() => setRate(opt.value)}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: selected }}
                  accessibilityLabel={`${opt.label} rate. ${opt.description}`}
                  style={[styles.option, selected && styles.optionSelected]}
                >
                  <View style={styles.optionLeft}>
                    <Text style={[styles.optionLabel, selected && styles.optionLabelSelected]}>
                      {opt.label}
                    </Text>
                    <Text style={styles.optionDesc}>{opt.description}</Text>
                  </View>
                  {selected && (
                    <Ionicons name="checkmark-circle" size={22} color={colors.primary} />
                  )}
                </Pressable>
              );
            })}
          </View>
        </Card>

        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>PITCH</Text>
          <Text style={styles.sectionDesc}>The tone of the voice.</Text>
          <View style={styles.optionGroup}>
            {PITCH_OPTIONS.map((opt) => {
              const selected = Math.abs(speechPitch - opt.value) < 0.05;
              return (
                <Pressable
                  key={opt.label}
                  onPress={() => setPitch(opt.value)}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: selected }}
                  accessibilityLabel={`${opt.label} pitch. ${opt.description}`}
                  style={[styles.option, selected && styles.optionSelected]}
                >
                  <View style={styles.optionLeft}>
                    <Text style={[styles.optionLabel, selected && styles.optionLabelSelected]}>
                      {opt.label}
                    </Text>
                    <Text style={styles.optionDesc}>{opt.description}</Text>
                  </View>
                  {selected && (
                    <Ionicons name="checkmark-circle" size={22} color={colors.primary} />
                  )}
                </Pressable>
              );
            })}
          </View>
        </Card>

        <PrimaryButton
          accessibilityLabel="Test voice settings"
          label="Test Voice"
          onPress={testVoice}
        />

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: typography.body,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.2,
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    padding: spacing.lg,
    gap: spacing.lg,
    paddingBottom: 36,
  },
  section: {
    gap: spacing.sm,
  },
  sectionTitle: {
    fontSize: typography.caption,
    fontWeight: '800',
    color: colors.textTertiary,
    letterSpacing: 1.0,
  },
  sectionDesc: {
    fontSize: typography.callout,
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
  optionGroup: {
    gap: spacing.sm,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radii.card,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  optionSelected: {
    borderColor: colors.primary,
    backgroundColor: '#EAF6FE',
  },
  optionLeft: {
    flex: 1,
  },
  optionLabel: {
    fontSize: typography.callout,
    fontWeight: '700',
    color: colors.text,
  },
  optionLabelSelected: {
    color: colors.primary,
  },
  optionDesc: {
    fontSize: typography.caption,
    color: colors.textMuted,
    marginTop: 2,
  },
});
