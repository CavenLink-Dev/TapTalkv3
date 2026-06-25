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
  Text,
  UIManager,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, spacing, typography } from '../../theme/tokens';
import { hapticSelection } from '../../utils/haptics';

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
    <View style={styles.wrap}>
      <Pressable
        onPress={handlePress}
        accessibilityRole="button"
        accessibilityLabel={`${title}${summary ? ', ' + summary : ''}`}
        accessibilityState={{ expanded }}
        style={({ pressed }) => [styles.header, pressed && styles.headerPressed]}
      >
        {icon ? (
          <View style={styles.iconChip}>
            <Ionicons name={icon} size={20} color={colors.primary} />
          </View>
        ) : null}
        <View style={styles.copy}>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
        {summary ? <Text style={styles.summary}>{summary}</Text> : null}
        <Animated.View style={{ transform: [{ rotate }] }}>
          <Ionicons name="chevron-down" size={20} color={colors.textTertiary} />
        </Animated.View>
      </Pressable>

      {expanded ? <View style={styles.body}>{children}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.surface,
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
  headerPressed: {
    backgroundColor: '#F5F7FA',
  },
  iconChip: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E6F4FD',
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: { flex: 1 },
  title: {
    fontSize: typography.body,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.1,
  },
  subtitle: {
    fontSize: typography.caption,
    color: colors.textMuted,
    marginTop: 2,
  },
  summary: {
    fontSize: typography.callout,
    color: colors.textMuted,
    fontWeight: '600',
  },
  body: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    paddingTop: 4,
    gap: spacing.md,
  },
});
