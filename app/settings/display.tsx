import React, { useCallback } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../../src/components/native/Card';
import { useAppContext } from '../../src/hooks/useAppContext';
import { useReduceMotion } from '../../src/hooks/useReduceMotion';
import { useTheme } from '../../src/theme/useTheme';
import { radii, spacing, typography } from '../../src/theme/tokens';
import { fonts } from '../../src/theme/fonts';
import { hapticSelection } from '../../src/utils/haptics';
import type { AppState } from '../../src/context/types';

type TextSize = AppState['accessibility']['textSize'];
type ButtonSize = AppState['accessibility']['buttonSize'];
type Theme = AppState['accessibility']['theme'];

const TEXT_SIZE_OPTIONS: { label: string; value: TextSize; preview: number }[] = [
  { label: 'Default', value: 'default', preview: 15 },
  { label: 'Large', value: 'large', preview: 18 },
  { label: 'Extra Large', value: 'xlarge', preview: 21 },
  { label: 'Maximum', value: 'maximum', preview: 24 },
];

const BUTTON_SIZE_OPTIONS: { label: string; value: ButtonSize; hint: string }[] = [
  { label: 'Standard', value: 'standard', hint: '44 pt minimum tap targets' },
  { label: 'Large', value: 'large', hint: 'Bigger buttons for easier tapping' },
];

const THEME_OPTIONS: { label: string; value: Theme; icon: React.ComponentProps<typeof Ionicons>['name'] }[] = [
  { label: 'Light', value: 'light', icon: 'sunny-outline' },
  { label: 'Dark', value: 'dark', icon: 'moon-outline' },
  { label: 'System', value: 'system', icon: 'phone-portrait-outline' },
];

export default function DisplaySettingsScreen() {
  const router = useRouter();
  const reduceMotion = useReduceMotion();
  const { state, dispatch } = useAppContext();
  const t = useTheme();
  const { textSize, buttonSize, highContrast, theme } = state.accessibility;

  const setTextSize = useCallback((value: TextSize) => {
    hapticSelection();
    dispatch({ type: 'SET_ACCESSIBILITY', payload: { textSize: value } });
  }, [dispatch]);

  const setButtonSize = useCallback((value: ButtonSize) => {
    hapticSelection();
    dispatch({ type: 'SET_ACCESSIBILITY', payload: { buttonSize: value } });
  }, [dispatch]);

  const setTheme = useCallback((value: Theme) => {
    hapticSelection();
    dispatch({ type: 'SET_ACCESSIBILITY', payload: { theme: value } });
  }, [dispatch]);

  const toggleHighContrast = useCallback(() => {
    hapticSelection();
    dispatch({ type: 'SET_ACCESSIBILITY', payload: { highContrast: !highContrast } });
  }, [dispatch, highContrast]);

  const { hapticsEnabled, motorAccessMode, reduceSensoryLoad } = state.accessibility;
  const toggleHaptics = useCallback(() => {
    const next = !hapticsEnabled;
    if (next) hapticSelection();
    dispatch({ type: 'SET_ACCESSIBILITY', payload: { hapticsEnabled: next } });
  }, [dispatch, hapticsEnabled]);

  const toggleMotorAccess = useCallback(() => {
    hapticSelection();
    dispatch({ type: 'SET_ACCESSIBILITY', payload: { motorAccessMode: !motorAccessMode } });
  }, [dispatch, motorAccessMode]);

  const toggleReduceSensory = useCallback(() => {
    hapticSelection();
    dispatch({ type: 'SET_ACCESSIBILITY', payload: { reduceSensoryLoad: !reduceSensoryLoad } });
  }, [dispatch, reduceSensoryLoad]);

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
        <Text style={[styles.headerTitle, { color: t.colors.text }]}>Display</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        bounces
        alwaysBounceVertical
        overScrollMode="always"
      >
        <Text style={[styles.pageIntro, { color: t.colors.textMuted }]}>
          Adjust how TapTalk looks for AAC users, carers, and support workers. Changes apply
          across the app and are saved on this device.
        </Text>

        <Card style={styles.section}>
          <Text style={[styles.sectionTitle, { color: t.colors.textTertiary }]}>TEXT SIZE</Text>
          <Text style={[styles.sectionDesc, { color: t.colors.textMuted }]}>
            Makes labels and buttons easier to read. Does not change iOS system text size.
          </Text>
          <View style={styles.optionGroup}>
            {TEXT_SIZE_OPTIONS.map((opt) => {
              const selected = textSize === opt.value;
              return (
                <Pressable
                  key={opt.value}
                  onPress={() => setTextSize(opt.value)}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: selected }}
                  accessibilityLabel={`Text size ${opt.label}`}
                  style={[styles.option, { borderColor: t.colors.border, backgroundColor: t.colors.surface }, selected && { borderColor: t.colors.primary, backgroundColor: t.colors.selectionBg }]}
                >
                  <Text style={[styles.previewText, { fontSize: opt.preview, color: t.colors.text }, selected && { color: t.colors.primary }]}>
                    {opt.label}
                  </Text>
                  {selected && (
                    <Ionicons name="checkmark-circle" size={22} color={t.colors.primary} />
                  )}
                </Pressable>
              );
            })}
          </View>
        </Card>

        <Card style={styles.section}>
          <Text style={[styles.sectionTitle, { color: t.colors.textTertiary }]}>BUTTON SIZE</Text>
          <Text style={[styles.sectionDesc, { color: t.colors.textMuted }]}>
            Larger buttons are easier to tap on shared iPads and for users with motor needs.
          </Text>
          <View style={styles.optionGroup}>
            {BUTTON_SIZE_OPTIONS.map((opt) => {
              const selected = buttonSize === opt.value;
              return (
                <Pressable
                  key={opt.value}
                  onPress={() => setButtonSize(opt.value)}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: selected }}
                  accessibilityLabel={`Button size ${opt.label}. ${opt.hint}`}
                  style={[styles.option, { borderColor: t.colors.border, backgroundColor: t.colors.surface }, selected && { borderColor: t.colors.primary, backgroundColor: t.colors.selectionBg }]}
                >
                  <View style={styles.buttonSizeCopy}>
                    <Text style={[styles.previewText, { color: t.colors.text }, selected && { color: t.colors.primary }]}>
                      {opt.label}
                    </Text>
                    <Text style={[styles.optionHint, { color: t.colors.textMuted }]}>{opt.hint}</Text>
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
          <Text style={[styles.sectionTitle, { color: t.colors.textTertiary }]}>THEME</Text>
          <Text style={[styles.sectionDesc, { color: t.colors.textMuted }]}>
            Light, dark, or match your iPhone or iPad system setting.
          </Text>
          <View style={styles.themeRow}>
            {THEME_OPTIONS.map((opt) => {
              const selected = theme === opt.value;
              return (
                <Pressable
                  key={opt.value}
                  onPress={() => setTheme(opt.value)}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: selected }}
                  accessibilityLabel={`${opt.label} theme`}
                  style={[styles.themeOption, { borderColor: t.colors.border, backgroundColor: t.colors.surface }, selected && { borderColor: t.colors.primary, backgroundColor: t.colors.selectionBg }]}
                >
                  <Ionicons
                    name={opt.icon}
                    size={24}
                    color={selected ? t.colors.primary : t.colors.textMuted}
                  />
                  <Text style={[styles.themeLabel, { color: t.colors.textMuted }, selected && { color: t.colors.primary }]}>
                    {opt.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </Card>

        <Card style={styles.section}>
          <Text style={[styles.sectionTitle, { color: t.colors.textTertiary }]}>ACCESSIBILITY</Text>
          <View style={styles.toggleRow}>
            <View style={styles.toggleLeft}>
              <Text style={[styles.toggleTitle, { color: t.colors.text }]}>High Contrast</Text>
              <Text style={[styles.toggleDesc, { color: t.colors.textMuted }]}>
                Heavier borders and stronger text colour for clearer separation.
              </Text>
            </View>
            <Switch
              value={highContrast}
              onValueChange={toggleHighContrast}
              trackColor={{ false: t.colors.disabled, true: t.colors.primary }}
              thumbColor={t.colors.surface}
              ios_backgroundColor={t.colors.disabled}
              accessibilityLabel="High contrast mode"
            />
          </View>
          <View style={[styles.toggleRow, { marginTop: 12 }]}>
            <View style={styles.toggleLeft}>
              <Text style={[styles.toggleTitle, { color: t.colors.text }]}>Haptic Feedback</Text>
              <Text style={[styles.toggleDesc, { color: t.colors.textMuted }]}>
                A light vibration when you tap buttons and symbol tiles.
              </Text>
            </View>
            <Switch
              value={hapticsEnabled}
              onValueChange={toggleHaptics}
              trackColor={{ false: t.colors.disabled, true: t.colors.primary }}
              thumbColor={t.colors.surface}
              ios_backgroundColor={t.colors.disabled}
              accessibilityLabel="Haptic feedback"
            />
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Reduce Motion, ${reduceMotion ? 'on' : 'follows iOS'}`}
            accessibilityHint="Explains how TapTalk follows the iOS Reduce Motion setting"
            onPress={() =>
              Alert.alert(
                'Reduce Motion',
                'TapTalk follows the Reduce Motion setting in iOS Settings → Accessibility → Motion. When it is on, animations become gentle fades.',
                [{ text: 'OK', style: 'cancel' }],
              )
            }
            style={[styles.infoRow, { borderTopColor: t.colors.border }]}
          >
            <View style={styles.toggleLeft}>
              <Text style={[styles.toggleTitle, { color: t.colors.text }]}>Reduce Motion</Text>
              <Text style={[styles.toggleDesc, { color: t.colors.textMuted }]}>
                {reduceMotion ? 'On — animations are reduced' : 'Follows iOS — change in Settings → Accessibility → Motion'}
              </Text>
            </View>
            <Ionicons name="information-circle-outline" size={22} color={t.colors.textTertiary} />
          </Pressable>
          <View style={[styles.toggleRow, { borderTopColor: t.colors.border }]}>
            <View style={styles.toggleLeft}>
              <Text style={[styles.toggleTitle, { color: t.colors.text }]}>Motor Access Mode</Text>
              <Text style={[styles.toggleDesc, { color: t.colors.textMuted }]}>
                Tap-based editing — no drag or pinch needed to move and resize tiles.
              </Text>
            </View>
            <Switch
              value={motorAccessMode}
              onValueChange={toggleMotorAccess}
              trackColor={{ false: t.colors.disabled, true: t.colors.primary }}
              ios_backgroundColor={t.colors.disabled}
              accessibilityLabel="Motor Access Mode"
            />
          </View>
          <View style={[styles.toggleRow, { borderTopColor: t.colors.border }]}>
            <View style={styles.toggleLeft}>
              <Text style={[styles.toggleTitle, { color: t.colors.text }]}>Reduce Sensory Load</Text>
              <Text style={[styles.toggleDesc, { color: t.colors.textMuted }]}>
                Quiets shimmer, particles, sound effects, and non-essential animation.
              </Text>
            </View>
            <Switch
              value={reduceSensoryLoad}
              onValueChange={toggleReduceSensory}
              trackColor={{ false: t.colors.disabled, true: t.colors.primary }}
              ios_backgroundColor={t.colors.disabled}
              accessibilityLabel="Reduce Sensory Load"
            />
          </View>
          <View style={[styles.infoRow, { borderTopColor: t.colors.border }]}>
            <View style={styles.toggleLeft}>
              <Text style={[styles.toggleTitle, { color: t.colors.text }]}>VoiceOver</Text>
              <Text style={[styles.toggleDesc, { color: t.colors.textMuted }]}>
                Built in — every control has a label and hint for screen readers.
              </Text>
            </View>
            <Ionicons name="checkmark-circle" size={22} color={t.colors.success} accessibilityElementsHidden />
          </View>
        </Card>

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
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontFamily: fonts.displayHeavy,
    fontSize: typography.body,
    letterSpacing: -0.2,
  },
  headerSpacer: {
    width: 44,
  },
  content: {
    padding: spacing.lg,
    gap: spacing.lg,
    paddingBottom: 36,
  },
  pageIntro: {
    fontFamily: fonts.body,
    fontSize: typography.callout,
    lineHeight: 21,
  },
  section: {
    gap: spacing.sm,
  },
  sectionTitle: {
    fontFamily: fonts.bodyHeavy,
    fontSize: typography.caption,
    letterSpacing: 1.0,
  },
  sectionDesc: {
    fontFamily: fonts.body,
    fontSize: typography.callout,
    marginBottom: spacing.sm,
  },
  optionGroup: {
    gap: spacing.sm,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    borderRadius: radii.card,
    borderWidth: 2,
  },
  previewText: {
    fontFamily: fonts.displayBold,
  },
  buttonSizeCopy: {
    flex: 1,
    gap: 2,
  },
  optionHint: {
    fontFamily: fonts.body,
    fontSize: typography.caption,
  },
  themeRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  themeOption: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: radii.card,
    borderWidth: 2,
    gap: spacing.xs,
  },
  themeLabel: {
    fontFamily: fonts.displayBold,
    fontSize: typography.caption,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingTop: spacing.sm,
  },
  toggleLeft: {
    flex: 1,
  },
  toggleTitle: {
    fontFamily: fonts.displayHeavy,
    fontSize: typography.callout,
  },
  toggleDesc: {
    fontFamily: fonts.body,
    fontSize: typography.caption,
    marginTop: 2,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingTop: spacing.md,
    marginTop: spacing.sm,
    borderTopWidth: 1,
    minHeight: 44,
  },
});
