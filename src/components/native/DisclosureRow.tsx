/**
 * DisclosureRow — header row that reveals content below when tapped.
 *
 * Pure presentational primitive used by the Visual Timer (Sound,
 * Appearance, Accessibility, Preset Duration), and reusable anywhere we
 * need progressive disclosure (principles 1, 3, 6).
 *
 * The chevron rotates 0 → 180deg over 180ms when expanded. Body content
 * mounts only while expanded — keeps render cost down and screen reader
 * focus tidy. A subtle LayoutAnimation on iOS smooths the height change.
 */

import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  LayoutAnimation,
  Platform,
  Pressable,
  StyleSheet,
  UIManager,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { radii, spacing } from '../../theme/tokens';
import { useTheme } from '../../theme/useTheme';
import { hapticSelection } from '../../utils/haptics';
import { ThemedText } from './ThemedText';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface DisclosureRowProps {
  /** Eyebrow / header text. */
  title: string;
  /** Optional one-line subtitle under the title (collapsed-state hint). */
  subtitle?: string;
  /** Optional leading icon — visually anchors the row in a sectioned list. */
  icon?: React.ComponentProps<typeof Ionicons>['name'];
  /** Visible value summary on the right (e.g. "5 min", "Digital"). */
  summary?: string;
  /** Controlled expanded state. */
  expanded: boolean;
  /** Called on header tap. */
  onToggle: () => void;
  children?: React.ReactNode;
}

export function DisclosureRow({
  title,
  subtitle,
  icon,
  summary,
  expanded,
  onToggle,
  children,
}: DisclosureRowProps) {
  const t = useTheme();
  // Chevron rotation animation — gentle, spring-out for "give".
  const chevronAnim = useRef(new Animated.Value(expanded ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(chevronAnim, {
      toValue: expanded ? 1 : 0,
      duration: 180,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [expanded, chevronAnim]);

  const rotate = chevronAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  const handlePress = () => {
    hapticSelection();
    // Soft height animation when content mounts / unmounts.
    LayoutAnimation.configureNext({
      duration: 220,
      create:  { type: 'easeInEaseOut', property: 'opacity' },
      update:  { type: 'easeInEaseOut' },
      delete:  { type: 'easeInEaseOut', property: 'opacity' },
    });
    onToggle();
  };

  return (
    <View style={[styles.wrap, { backgroundColor: t.colors.surface }]}>
      <Pressable
        onPress={handlePress}
        accessibilityRole="button"
        accessibilityLabel={`${title}${summary ? ', ' + summary : ''}`}
        accessibilityState={{ expanded }}
        style={({ pressed }) => [
          styles.header,
          pressed && { backgroundColor: t.colors.background, opacity: 0.92 },
        ]}
      >
        {icon ? (
          <View style={[styles.iconChip, { backgroundColor: t.colors.selectionBg }]}>
            <Ionicons name={icon} size={20} color={t.colors.primary} />
          </View>
        ) : null}
        <View style={styles.copy}>
          <ThemedText variant="body" style={styles.title}>{title}</ThemedText>
          {subtitle ? (
            <ThemedText variant="caption" color={t.colors.textMuted}>{subtitle}</ThemedText>
          ) : null}
        </View>
        {summary ? (
          <ThemedText variant="callout" color={t.colors.textMuted} style={styles.summary}>{summary}</ThemedText>
        ) : null}
        <Animated.View style={{ transform: [{ rotate }] }}>
          <Ionicons name="chevron-down" size={20} color={t.colors.textTertiary} />
        </Animated.View>
      </Pressable>

      {expanded ? <View style={styles.body}>{children}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: radii.card,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    minHeight: 60,
  },
  iconChip: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: { flex: 1 },
  title: {
    fontWeight: '700',
    letterSpacing: -0.1,
  },
  summary: {
    fontWeight: '600',
  },
  body: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    paddingTop: 4,
    gap: spacing.md,
  },
});
