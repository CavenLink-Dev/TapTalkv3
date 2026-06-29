import React, { useCallback } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../../src/components/native/Card';
import { useAppContext } from '../../src/hooks/useAppContext';
import { colors, radii, spacing, typography } from '../../src/theme/tokens';
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
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Pressable
          onPress={() => { hapticSelection(); router.back(); }}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          style={styles.backButton}
        >
          <Ionicons name="chevron-back" size={26} color={colors.primary} />
        </Pressable>
        <Text style={styles.headerTitle}>Display</Text>
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
          <Text style={styles.sectionTitle}>TEXT SIZE</Text>
          <Text style={styles.sectionDesc}>Affects labels throughout the app.</Text>
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
                  style={[styles.option, selected && styles.optionSelected]}
                >
                  <Text style={[styles.previewText, { fontSize: opt.preview }, selected && styles.previewSelected]}>
                    {opt.label}
                  </Text>
                  {selected && (
                    <Ionicons name="checkmark-circle" size={22} color={colors.primary} />
                  )}
                </Pressable>
              );
            })}
          </View>
        </Card>

        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>THEME</Text>
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
                  style={[styles.themeOption, selected && styles.themeOptionSelected]}
                >
                  <Ionicons
                    name={opt.icon}
                    size={24}
                    color={selected ? colors.primary : colors.textMuted}
                  />
                  <Text style={[styles.themeLabel, selected && styles.themeLabelSelected]}>
                    {opt.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </Card>

        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>ACCESSIBILITY</Text>
          <Pressable
            onPress={toggleHighContrast}
            accessibilityRole="switch"
            accessibilityLabel="High contrast mode"
            accessibilityState={{ checked: highContrast }}
            style={styles.toggleRow}
          >
            <View style={styles.toggleLeft}>
              <Text style={styles.toggleTitle}>High Contrast</Text>
              <Text style={styles.toggleDesc}>Increases contrast for easier reading.</Text>
            </View>
            <View style={[styles.track, highContrast && styles.trackOn]}>
              <View style={[styles.thumb, highContrast && styles.thumbOn]} />
            </View>
          </Pressable>
          <Pressable
            onPress={toggleHaptics}
            accessibilityRole="switch"
            accessibilityLabel="Haptic feedback"
            accessibilityState={{ checked: hapticsEnabled }}
            style={[styles.toggleRow, { marginTop: 12 }]}
          >
            <View style={styles.toggleLeft}>
              <Text style={styles.toggleTitle}>Haptic Feedback</Text>
              <Text style={styles.toggleDesc}>Vibrate on button and tile taps.</Text>
            </View>
            <View style={[styles.track, hapticsEnabled && styles.trackOn]}>
              <View style={[styles.thumb, hapticsEnabled && styles.thumbOn]} />
            </View>
          </Pressable>
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
    fontWeight: '700',
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
    fontSize: typography.caption,
    fontWeight: '700',
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
    fontSize: typography.callout,
    fontWeight: '800',
    color: colors.text,
  },
  toggleDesc: {
    fontSize: typography.caption,
    color: colors.textMuted,
    marginTop: 2,
  },
  track: {
    width: 48,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.disabled,
    paddingHorizontal: 3,
    justifyContent: 'center',
  },
  trackOn: {
    backgroundColor: colors.success,
  },
  thumb: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.surface,
    alignSelf: 'flex-start',
  },
  thumbOn: {
    alignSelf: 'flex-end',
  },
});
