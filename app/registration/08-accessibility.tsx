import React, { useEffect, useState } from 'react';
import {
  AccessibilityInfo,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { Href, useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { PrimaryButton } from '../../src/components/native/PrimaryButton';
import { Pill } from '../../src/components/native/Pill';
import { RegistrationScaffold } from '../../src/components/registration/RegistrationScaffold';
import { useRegistration } from '../../src/context/RegistrationContext';
import { useAppContext } from '../../src/hooks/useAppContext';
import { colors, radii, spacing, typography } from '../../src/theme/tokens';
import { useTheme } from '../../src/theme/useTheme';
import { fonts } from '../../src/theme/fonts';
import { hapticSelection } from '../../src/utils/haptics';

const nextRoute = '/registration/09-profile' as Href;

const TEXT_SIZES = [
  { id: 'default' as const, label: 'Default',  scale: 1.0 },
  { id: 'large'   as const, label: 'Large',    scale: 1.2 },
  { id: 'xlarge'  as const, label: 'X-Large',  scale: 1.4 },
  { id: 'maximum' as const, label: 'Maximum',  scale: 1.6 },
];

const BUTTON_SIZES = [
  { id: 'standard' as const, label: 'Standard', height: 56 },
  { id: 'large'    as const, label: 'Large',    height: 72 },
];

const THEMES = [
  { id: 'light'  as const, label: 'Light' },
  { id: 'dark'   as const, label: 'Dark' },
  { id: 'system' as const, label: 'System' },
];

// Sample colour pairs for a "noun" symbol tile under each scheme.
const SCHEME_PREVIEW = {
  fitzgerald: { bg: '#FFE9C4', border: '#F0AD3F', label: 'Apple' },
  cvd_safe:   { bg: '#FFE38C', border: '#1FA882', label: 'Apple' },
} as const;

export default function RegStep8Accessibility() {
  const router = useRouter();
  const t = useTheme();
  const { data, updateAccessibility } = useRegistration();
  const { dispatch } = useAppContext();
  const a11y = data.accessibility;

  const [voiceOverOn, setVoiceOverOn] = useState(false);

  // ── VoiceOver detection ──
  useEffect(() => {
    let cancelled = false;
    AccessibilityInfo.isScreenReaderEnabled().then((enabled) => {
      if (!cancelled) setVoiceOverOn(enabled);
    });
    const sub = AccessibilityInfo.addEventListener('screenReaderChanged', (enabled) => {
      setVoiceOverOn(enabled);
    });
    return () => {
      cancelled = true;
      sub.remove();
    };
  }, []);

  // Persist every change immediately to app-wide storage.
  useEffect(() => {
    dispatch({ type: 'SET_ACCESSIBILITY', payload: a11y });
  }, [a11y, dispatch]);

  const textScale = TEXT_SIZES.find((s) => s.id === a11y.textSize)?.scale ?? 1;
  const buttonHeight = BUTTON_SIZES.find((b) => b.id === a11y.buttonSize)?.height ?? 56;
  const isDark =
    a11y.theme === 'dark' || (a11y.theme === 'system' && false /* live system check would go here */);
  const preview = SCHEME_PREVIEW[a11y.colorScheme];

  const previewSurface = isDark ? '#1A1F26' : colors.surface;
  const previewBorder = a11y.highContrast ? '#000000' : preview.border;
  const previewBorderWidth = a11y.highContrast ? 3 : 1.5;
  const previewTextColor = isDark ? colors.surface : colors.text;

  const skip = () => router.replace(nextRoute);

  return (
    <RegistrationScaffold
      step={8}
      title="Make it yours"
      subtitle="Set text, buttons, and colour for AAC use. You can change these any time in Profile → Accessibility → Display."
      scroll
      footer={
        <>
          <PrimaryButton
            accessibilityLabel="Continue with these accessibility settings"
            label="Continue"
            onPress={() => router.push(nextRoute)}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Skip accessibility setup for now"
            onPress={skip}
            hitSlop={16}
            style={styles.skipBtn}
          >
            <Text style={[styles.skipLabel, { color: t.colors.textMuted }]}>Skip for now</Text>
          </Pressable>
        </>
      }
    >
      <View style={styles.list}>
        {/* ── Live preview ── */}
        <View style={[styles.previewCard, { backgroundColor: isDark ? '#0B1117' : '#F1F5F9' }]}>
          <Text style={[styles.previewLabel, { color: isDark ? '#94A3B8' : colors.textTertiary }]}>
            Preview
          </Text>

          <View style={styles.previewBody}>
            <View
              style={[
                styles.previewTile,
                {
                  backgroundColor: preview.bg,
                  borderColor: previewBorder,
                  borderWidth: previewBorderWidth,
                },
              ]}
              accessibilityElementsHidden
            >
              <Ionicons name="nutrition-outline" size={40} color={previewTextColor} style={styles.previewEmoji} />
              <Text
                style={[
                  styles.previewWord,
                  { fontSize: typography.callout * textScale, color: previewTextColor },
                ]}
              >
                {preview.label}
              </Text>
            </View>

            <View
              style={[
                styles.previewBtn,
                {
                  height: buttonHeight,
                  backgroundColor: a11y.highContrast ? '#000000' : colors.primary,
                },
              ]}
            >
              <Text
                style={[
                  styles.previewBtnLabel,
                  { fontSize: typography.body * textScale },
                ]}
              >
                Speak
              </Text>
            </View>
          </View>
        </View>

        {/* ── VoiceOver banner ── */}
        {voiceOverOn ? (
          <Animated.View entering={FadeInDown.duration(220)} style={styles.banner}>
            <Ionicons name="ear" size={22} color={t.colors.primaryDark} />
            <Text style={[styles.bannerText, { color: t.colors.text }]}>
              VoiceOver is on. TapTalk labels every button and tile for screen readers.
            </Text>
          </Animated.View>
        ) : null}

        {/* ── Text size ── */}
        <Section label="Text size">
          <View style={styles.pillRow}>
            {TEXT_SIZES.map((s) => (
              <Pill
                key={s.id}
                label={s.label}
                selected={a11y.textSize === s.id}
                onPress={() => {
                  hapticSelection();
                  updateAccessibility({ textSize: s.id });
                }}
                accessibilityLabel={`${s.label} text size`}
              />
            ))}
          </View>
        </Section>

        {/* ── Button size ── */}
        <Section label="Button size">
          <View style={styles.pillRow}>
            {BUTTON_SIZES.map((b) => (
              <Pill
                key={b.id}
                label={b.label}
                selected={a11y.buttonSize === b.id}
                onPress={() => {
                  hapticSelection();
                  updateAccessibility({ buttonSize: b.id });
                }}
                accessibilityLabel={`${b.label} button size`}
              />
            ))}
          </View>
        </Section>

        {/* ── Theme ── */}
        <StaticSection label="Theme">
          <View style={styles.pillRow}>
            {THEMES.map((theme) => (
              <Pill
                key={theme.id}
                label={theme.label}
                selected={a11y.theme === theme.id}
                onPress={() => {
                  hapticSelection();
                  updateAccessibility({ theme: theme.id });
                }}
                accessibilityLabel={`${theme.label} theme`}
              />
            ))}
          </View>
        </StaticSection>

        {/* ── High contrast ── */}
        <View
          style={[
            styles.toggleRow,
            { backgroundColor: t.colors.surface, borderColor: t.colors.border },
          ]}
        >
          <View style={styles.flex}>
            <Text style={[styles.toggleTitle, { color: t.colors.text }]}>High contrast</Text>
            <Text style={[styles.toggleBody, { color: t.colors.textMuted }]}>
              Heavier borders and stronger text colour — helpful on shared iPads and in bright light.
            </Text>
          </View>
          <Switch
            value={a11y.highContrast}
            onValueChange={(v) => {
              hapticSelection();
              updateAccessibility({ highContrast: v });
            }}
            trackColor={{ false: t.colors.progressTrack, true: t.colors.primary }}
            thumbColor={t.colors.surface}
            accessibilityLabel="High contrast mode"
          />
        </View>

        {/* ── Colour scheme ── */}
        <StaticSection label="Symbol colour scheme">
          <View style={styles.schemeRow}>
            <Pill
              label="Fitzgerald Key"
              selected={a11y.colorScheme === 'fitzgerald'}
              onPress={() => {
                hapticSelection();
                updateAccessibility({ colorScheme: 'fitzgerald' });
              }}
              accessibilityLabel="Standard Fitzgerald Key colours"
            />
            <Pill
              label="CVD-safe"
              selected={a11y.colorScheme === 'cvd_safe'}
              onPress={() => {
                hapticSelection();
                updateAccessibility({ colorScheme: 'cvd_safe' });
              }}
              accessibilityLabel="Colour-vision-deficiency safe scheme"
            />
          </View>
          <Text style={[styles.schemeNote, { color: colors.textTertiary }]}>
            CVD-safe remaps the categories for protanopia, deuteranopia, and
            tritanopia.
          </Text>
        </StaticSection>
      </View>
    </RegistrationScaffold>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  const t = useTheme();

  return (
    <View style={styles.section}>
      <Text style={[styles.sectionLabel, { color: t.colors.text }]}>{label}</Text>
      {children}
    </View>
  );
}

function StaticSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionLabel, { color: colors.text }]}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: spacing.xl },
  flex: { flex: 1 },

  previewCard: {
    borderRadius: radii.card,
    padding: spacing.lg,
  },
  previewLabel: {
    fontFamily: fonts.bodyHeavy,
    fontSize: typography.eyebrow,
    letterSpacing: typography.trackEyebrow,
    textTransform: 'uppercase',
    marginBottom: spacing.md,
  },
  previewBody: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  previewTile: {
    width: 96,
    height: 96,
    borderRadius: radii.card,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  previewEmoji: { marginBottom: 4 },
  previewWord: { fontFamily: fonts.displayHeavy },
  previewBtn: {
    flex: 1,
    borderRadius: radii.button,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  previewBtnLabel: {
    fontFamily: fonts.displayHeavy,
    color: colors.surface,
    letterSpacing: typography.trackButton,
  },

  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: 14,
    backgroundColor: '#EAF5FE',
  },
  bannerText: {
    flex: 1,
    fontFamily: fonts.body,
    fontSize: typography.callout,
    lineHeight: 20,
  },

  section: { gap: spacing.sm },
  sectionLabel: {
    fontFamily: fonts.displayBold,
    fontSize: typography.subheading,
    letterSpacing: typography.trackSubhead,
  },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  schemeRow: { flexDirection: 'row', gap: spacing.sm },
  schemeNote: {
    fontFamily: fonts.body,
    fontSize: typography.caption,
    lineHeight: 18,
    marginTop: 4,
  },

  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radii.card,
    borderWidth: 1,
  },
  toggleTitle: {
    fontFamily: fonts.displayHeavy,
    fontSize: typography.body,
  },
  toggleBody: {
    marginTop: 2,
    fontFamily: fonts.body,
    fontSize: typography.caption,
    lineHeight: 18,
  },

  skipBtn: {
    alignSelf: 'center',
    minHeight: 44,
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  skipLabel: {
    fontFamily: fonts.displayBold,
    fontSize: typography.callout,
  },
});
