import React, { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  FadeInDown,
} from 'react-native-reanimated';
import { hapticSuccess, hapticWarning } from '../../utils/haptics';
import { radii, spacing, typography } from '../../theme/tokens';
import { useTheme } from '../../theme/useTheme';

interface GuardianBlockPanelProps {
  /**
   * Entrance delay for the whole component
   */
  entranceDelay?: number;
  /**
   * Callback when the copy link button is long-pressed
   */
  onCopyLink?: () => void;
}

/**
 * Red guardian-block panel shown when a user under 15 tries to self-setup.
 * Animates in with a fade + slide, and triggers a warning haptic.
 * Matches the fourth PNG design exactly.
 */
export function GuardianBlockPanel({
  entranceDelay = 0,
  onCopyLink,
}: GuardianBlockPanelProps) {
  const t = useTheme();

  // Trigger warning haptic when component mounts
  useEffect(() => {
    hapticWarning();
  }, []);

  const handleLongPress = () => {
    if (onCopyLink) {
      onCopyLink();
      // Success haptic on copy
      hapticSuccess();
    }
  };

  return (
    <Animated.View
      entering={FadeInDown.duration(350).delay(entranceDelay)}
      style={styles.container}
    >
      {/* Red warning message */}
      <View style={[styles.warningBox, { backgroundColor: t.colors.danger }]}>
        <Text style={[styles.warningText, { color: t.colors.surface }]}>
          THIS APP NEEDS A PARENT OR GUARDIAN TO FINISH SETUP FOR ANYONE UNDER 15. WE DO THIS TO KEEP YOUNGER USERS SAFE, FOLLOWING AUSTRALIAN PRIVACY RULES.
        </Text>
      </View>

      {/* What should I do now? section */}
      <View style={styles.actionSection}>
        <Text style={[styles.actionTitle, { color: t.colors.text }]}>What should I do now?</Text>
        <Text style={[styles.actionDescription, { color: t.colors.text }]}>
          Send the link below to a parent or guardian
        </Text>
        <Text style={[styles.actionSubtext, { color: t.colors.textMuted }]}>
          We'll email them a secure link so they can finish setting up TapTalk
        </Text>

        <Pressable
          onLongPress={handleLongPress}
          style={[styles.copyButton, { backgroundColor: t.colors.primary }]}
          accessibilityRole="button"
          accessibilityLabel="Press and hold to copy this link"
        >
          <Text style={[styles.copyButtonText, { color: t.colors.surface }]}>
            Press and hold to copy this link
          </Text>
        </Pressable>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    gap: spacing.lg,
  },
  warningBox: {
    borderRadius: radii.card,
    padding: spacing.lg,
  },
  warningText: {
    fontSize: typography.caption,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 16,
    letterSpacing: 0.5,
  },
  actionSection: {
    width: '100%',
  },
  actionTitle: {
    fontSize: typography.subheading,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  actionDescription: {
    fontSize: typography.callout,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  actionSubtext: {
    fontSize: typography.callout,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  copyButton: {
    borderRadius: radii.button,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
  },
  copyButtonText: {
    fontSize: typography.callout,
    fontWeight: '600',
  },
});
