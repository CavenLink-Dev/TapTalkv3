import React from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Href, useRouter } from 'expo-router';
import { Card } from '../../src/components/native/Card';
import { useAppContext } from '../../src/hooks/useAppContext';
import { colors, radii, spacing, typography } from '../../src/theme/tokens';
import { hapticSelection } from '../../src/utils/haptics';

// Preserved from the previous "tools" tab so the existing voice/display
// sub-routes remain reachable now that the bottom tab is the Daily Planner.
interface SettingRow {
  id: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  iconColor: string;
  iconBg: string;
  label: string;
  subtitle: string;
  premium?: boolean;
  route?: Href;
}

const APP_SETTINGS: SettingRow[] = [
  {
    id: 'voice',
    icon: 'volume-high-outline',
    iconColor: colors.primary,
    iconBg: '#E6F4FD',
    label: 'Voice and Speech',
    subtitle: 'Choose voice, speed, and pitch',
    route: '/settings/voice' as Href,
  },
  {
    id: 'display',
    icon: 'contrast-outline',
    iconColor: '#5CD65C',
    iconBg: '#E8FAE8',
    label: 'Display',
    subtitle: 'Text size, contrast, theme',
    route: '/settings/display' as Href,
  },
  {
    id: 'haptics',
    icon: 'radio-button-on-outline',
    iconColor: '#FF9500',
    iconBg: '#FFF4E0',
    label: 'Haptics',
    subtitle: 'Vibration feedback on symbol tap',
  },
  {
    id: 'notifications',
    icon: 'notifications-outline',
    iconColor: '#BD73FF',
    iconBg: '#F3EAFF',
    label: 'Notifications',
    subtitle: 'Reminders and daily check-ins',
  },
];

const PREMIUM_TOOLS: SettingRow[] = [
  {
    id: 'first-then',
    icon: 'git-compare-outline',
    iconColor: colors.primary,
    iconBg: '#E6F4FD',
    label: 'First & Then',
    subtitle: 'Visual step-by-step task guide',
    premium: true,
  },
  {
    id: 'daily-planner',
    icon: 'calendar-outline',
    iconColor: '#FF9500',
    iconBg: '#FFF4E0',
    label: 'Daily Planner',
    subtitle: 'Break the day into simple steps',
    premium: true,
  },
  {
    id: 'visual-timer',
    icon: 'timer-outline',
    iconColor: '#5CD65C',
    iconBg: '#E8FAE8',
    label: 'Visual Timers',
    subtitle: 'Animated countdown for transitions',
    premium: true,
  },
  {
    id: 'visual-cues',
    icon: 'eye-outline',
    iconColor: '#BD73FF',
    iconBg: '#F3EAFF',
    label: 'Visual Cues',
    subtitle: 'On-screen reminders and prompts',
    premium: true,
  },
];

function SettingItem({ row, onPress }: { row: SettingRow; onPress?: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={row.label}
      onPress={() => { hapticSelection(); onPress?.(); }}
      style={({ pressed }) => [styles.settingRow, pressed && styles.settingRowPressed]}
    >
      <View style={[styles.settingIcon, { backgroundColor: row.iconBg }]}>
        <Ionicons name={row.icon} size={22} color={row.iconColor} />
      </View>
      <View style={styles.settingCopy}>
        <Text style={styles.settingLabel}>{row.label}</Text>
        <Text style={styles.settingSubtitle}>{row.subtitle}</Text>
      </View>
      {row.premium ? (
        <View style={styles.premiumBadge}>
          <Ionicons
            name="lock-closed"
            size={12}
            color={colors.surface}
            accessibilityElementsHidden
            importantForAccessibility="no"
          />
          <Text style={styles.premiumText} maxFontSizeMultiplier={1.2} numberOfLines={1}>
            PRO
          </Text>
        </View>
      ) : (
        <Ionicons
          name="chevron-forward"
          size={18}
          color={colors.textTertiary}
          accessibilityElementsHidden
          importantForAccessibility="no"
        />
      )}
    </Pressable>
  );
}

export default function SettingsIndexScreen() {
  const { state } = useAppContext();
  const isPremium = state.subscriptionComplete;
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        bounces
        alwaysBounceVertical
        overScrollMode="always"
      >
        <Text style={styles.title}>SETTINGS</Text>

        <Text style={styles.sectionHeading}>APP</Text>
        <Card style={styles.section}>
          {APP_SETTINGS.map((row, i) => (
            <View key={row.id}>
              <SettingItem
                row={row}
                onPress={row.route ? () => router.push(row.route!) : undefined}
              />
              {i < APP_SETTINGS.length - 1 && <View style={styles.divider} />}
            </View>
          ))}
        </Card>

        <View style={styles.premiumHeader}>
          <Text style={styles.sectionHeading}>PREMIUM TOOLS</Text>
          {!isPremium && (
            <View style={styles.upgradePill}>
              <Ionicons
                name="star"
                size={11}
                color="#FFD700"
                accessibilityElementsHidden
                importantForAccessibility="no"
              />
              <Text style={styles.upgradeText} maxFontSizeMultiplier={1.2} numberOfLines={1}>
                Upgrade
              </Text>
            </View>
          )}
        </View>

        {!isPremium && (
          <Card style={styles.upgradeCard}>
            <Ionicons name="star-outline" size={28} color={colors.primary} />
            <Text style={styles.upgradeTitle}>Unlock All Tools</Text>
            <Text style={styles.upgradeDesc}>
              First &amp; Then, Daily Planner, Visual Timers, and more — designed with OT therapy principles for meaningful daily support.
            </Text>
          </Card>
        )}

        <Card style={styles.section}>
          {PREMIUM_TOOLS.map((row, i) => (
            <View key={row.id}>
              <SettingItem row={isPremium ? { ...row, premium: false } : row} />
              {i < PREMIUM_TOOLS.length - 1 && <View style={styles.divider} />}
            </View>
          ))}
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: 40, gap: spacing.lg },

  title: {
    fontSize: typography.title,
    fontWeight: '900',
    color: colors.text,
    letterSpacing: -0.5,
    marginBottom: spacing.xs,
  },

  sectionHeading: {
    fontSize: typography.caption,
    fontWeight: '800',
    color: colors.textTertiary,
    letterSpacing: 0.8,
    marginBottom: spacing.xs,
  },

  section: {
    padding: 0,
    overflow: 'hidden',
  },

  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
  },
  settingRowPressed: {
    backgroundColor: colors.background,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: radii.button,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingCopy: { flex: 1 },
  settingLabel: {
    fontSize: typography.callout,
    fontWeight: '700',
    color: colors.text,
  },
  settingSubtitle: {
    marginTop: 2,
    fontSize: typography.caption,
    color: colors.textMuted,
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: colors.primaryDark,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  premiumText: {
    fontSize: 10,
    fontWeight: '900',
    color: colors.surface,
    letterSpacing: 0.4,
  },

  divider: {
    height: 1,
    backgroundColor: '#EEF2F6',
    marginLeft: 56 + spacing.md,
  },

  premiumHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  upgradePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: colors.primary,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
  },
  upgradeText: {
    fontSize: typography.caption,
    fontWeight: '800',
    color: colors.surface,
  },

  upgradeCard: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xl,
    backgroundColor: '#F0F8FF',
  },
  upgradeTitle: {
    fontSize: typography.subheading,
    fontWeight: '900',
    color: colors.text,
  },
  upgradeDesc: {
    fontSize: typography.callout,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 22,
  },
});
