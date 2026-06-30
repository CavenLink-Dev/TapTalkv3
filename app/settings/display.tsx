import React, { useCallback } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../../src/components/native/Card';
import { useAppContext } from '../../src/hooks/useAppContext';
import { useTheme } from '../../src/theme/useTheme';
import { colors, radii, spacing, typography } from '../../src/theme/tokens';
import { fonts } from '../../src/theme/fonts';
import { hapticSelection } from '../../src/utils/haptics';
import type { AppState } from '../../src/context/types';

type TextSize = AppState['accessibility']['textSize'];
type Theme = AppState['accessibility']['theme'];

const TEXT_SIZE_OPTIONS: { label: string; value: TextSize; preview: number }[] = [
  { label: 'Default', value: 'default', preview: 15 },
  { label: 'Large', value: 'large', preview: 18 },
  { label: 'Extra Large', value: 'xlarge', preview: 21 },
  { label: 'Maximum', value: 'maximum', preview: 24 },
];

const THEME_OPTIONS: { label: string; value: Theme; icon: React.ComponentProps<typeof Ionicons>['name'] }[] = [
  { label: 'Light', value: 'light', icon: 'sunny-outline' },
  { label: 'Dark', value: 'dark', icon: 'moon-outline' },
  { label: 'System', value: 'system', icon: 'phone-portrait-outline' },
];

export default function DisplaySettingsScreen() {
  const router = useRouter();
  const { state, dispatch } = useAppContext();
  const t = useTheme();
  const { textSize, highContrast, theme } = state.accessibility;

  const setTextSize = useCallback((value: TextSize) => {
    hapticSelection();
    dispatch({ type: 'SET_ACCESSIBILITY', payload: { textSize: value } });
  }, [dispatch]);

  const setTheme = useCallback((value: Theme) => {
    hapticSelection();
    dispatch({ type: 'SET_ACCESSIBILITY', payload: { theme: value } });
  }, [dispatch]);

  const toggleHighContrast = useCallback(() => {
    hapticSelection();
    dispatch({ type: 'SET_ACCESSIBILITY', payload: { highContrast: !highContrast } });
  }, [dispatch, highContrast]);

  const { hapticsEnabled } = state.accessibility;
  const toggleHaptics = useCallback(() => {
    const next = !hapticsEnabled;
    if (next) hapticSelection();
    dispatch({ type: 'SET_ACCESSIBILITY', payload: { hapticsEnabled: next } });
  }, [dispatch, hapticsEnabled]);

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

        <Card style={styles.section}>
          <Text style={[styles.sectionTitle, { color: t.colors.textTertiary }]}>TEXT SIZE</Text>
          <Text style={[styles.sectionDesc, { color: t.colors.textMuted }]}>Affects labels throughout the app.</Text>
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
                  style={[styles.option, { borderColor: t.colors.border, backgroundColor: t.colors.surface }, selected && { borderColor: t.colors.primary, backgroundColor: t.isDark ? '#1A3A5F' : '#EAF6FE' }]}
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
          <Text style={[styles.sectionTitle, { color: t.colors.textTertiary }]}>THEME</Text>
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
                  style={[styles.themeOption, { borderColor: t.colors.border, backgroundColor: t.colors.surface }, selected && { borderColor: t.colors.primary, backgroundColor: t.isDark ? '#1A3A5F' : '#EAF6FE' }]}
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
              <Text style={[styles.toggleDesc, { color: t.colors.textMuted }]}>Increases contrast for easier reading.</Text>
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
              <Text style={[styles.toggleDesc, { color: t.colors.textMuted }]}>Vibrate on button and tile taps.</Text>
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
        </Card>

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
    color: colors.text,
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
  section: {
    gap: spacing.sm,
  },
  sectionTitle: {
    fontFamily: fonts.bodyHeavy,
    fontSize: typography.caption,
    color: colors.textTertiary,
    letterSpacing: 1.0,
  },
  sectionDesc: {
    fontFamily: fonts.body,
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
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    borderRadius: radii.card,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  optionSelected: {
    borderColor: colors.primary,
    backgroundColor: '#EAF6FE',
  },
  previewText: {
    fontFamily: fonts.displayBold,
    color: colors.text,
  },
  previewSelected: {
    color: colors.primary,
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
    borderColor: colors.border,
    backgroundColor: colors.surface,
    gap: spacing.xs,
  },
  themeOptionSelected: {
    borderColor: colors.primary,
    backgroundColor: '#EAF6FE',
  },
  themeLabel: {
    fontFamily: fonts.displayBold,
    fontSize: typography.caption,
    color: colors.textMuted,
  },
  themeLabelSelected: {
    color: colors.primary,
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
    color: colors.text,
  },
  toggleDesc: {
    fontFamily: fonts.body,
    fontSize: typography.caption,
    color: colors.textMuted,
    marginTop: 2,
  },
});
