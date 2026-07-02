import React, { useCallback } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../../src/components/native/Card';
import { PrimaryButton } from '../../src/components/native/PrimaryButton';
import { useAppContext } from '../../src/hooks/useAppContext';
import { useSpeech } from '../../src/hooks/useSpeech';
import { useTheme } from '../../src/theme/useTheme';
import { radii, spacing, typography } from '../../src/theme/tokens';
import { fonts } from '../../src/theme/fonts';
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
  const { speak, stop } = useSpeech();
  const t = useTheme();
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
    stop();
    speak(SAMPLE_PHRASE, { rate: speechRate, pitch: speechPitch });
  }, [speak, speechRate, speechPitch, stop]);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: t.colors.background }]} edges={['top']}>
      <View style={[styles.header, { backgroundColor: t.colors.surface, borderBottomColor: t.colors.border }]}>
        <Pressable
          onPress={() => { hapticSelection(); router.back(); }}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          style={styles.backButton}
        >
          <Ionicons name="chevron-back" size={26} color={t.colors.primary} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: t.colors.text }]}>Voice and Speech</Text>
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
          <Text style={[styles.sectionTitle, { color: t.colors.textTertiary }]}>SPEECH RATE</Text>
          <Text style={[styles.sectionDesc, { color: t.colors.textMuted }]}>How fast TapTalk speaks your message.</Text>
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
                  style={[styles.option, { borderColor: t.colors.border, backgroundColor: t.colors.surface }, selected && { borderColor: t.colors.primary, backgroundColor: '#EAF6FE' }]}
                >
                  <View style={styles.optionLeft}>
                    <Text style={[styles.optionLabel, { color: t.colors.text }, selected && { color: t.colors.primary }]}>
                      {opt.label}
                    </Text>
                    <Text style={[styles.optionDesc, { color: t.colors.textMuted }]}>{opt.description}</Text>
                  </View>
                  {selected && (
                    <Ionicons name="checkmark-circle" size={22} color={t.colors.primary} />
                  )}
                </Pressable>
              );
            })}
          </View>
        </Card>

        <Card style={styles.section}>
          <Text style={[styles.sectionTitle, { color: t.colors.textTertiary }]}>PITCH</Text>
          <Text style={[styles.sectionDesc, { color: t.colors.textMuted }]}>The tone of the voice.</Text>
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
                  style={[styles.option, { borderColor: t.colors.border, backgroundColor: t.colors.surface }, selected && { borderColor: t.colors.primary, backgroundColor: '#EAF6FE' }]}
                >
                  <View style={styles.optionLeft}>
                    <Text style={[styles.optionLabel, { color: t.colors.text }, selected && { color: t.colors.primary }]}>
                      {opt.label}
                    </Text>
                    <Text style={[styles.optionDesc, { color: t.colors.textMuted }]}>{opt.description}</Text>
                  </View>
                  {selected && (
                    <Ionicons name="checkmark-circle" size={22} color={t.colors.primary} />
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
    flex: 1},
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1},
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'flex-start',
    justifyContent: 'center'},
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontFamily: fonts.displayHeavy,
    fontSize: typography.body,
    letterSpacing: -0.2},
  headerSpacer: {
    width: 44},
  content: {
    padding: spacing.lg,
    gap: spacing.lg,
    paddingBottom: 36},
  section: {
    gap: spacing.sm},
  sectionTitle: {
    fontFamily: fonts.bodyHeavy,
    fontSize: typography.caption,
    letterSpacing: 1.0},
  sectionDesc: {
    fontFamily: fonts.body,
    fontSize: typography.callout,
    marginBottom: spacing.sm},
  optionGroup: {
    gap: spacing.sm},
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radii.card,
    borderWidth: 2},
  optionLeft: {
    flex: 1},
  optionLabel: {
    fontFamily: fonts.displayBold,
    fontSize: typography.callout},
  optionDesc: {
    fontFamily: fonts.body,
    fontSize: typography.caption,
    marginTop: 2},
});
