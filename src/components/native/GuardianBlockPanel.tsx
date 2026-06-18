import React, { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  FadeInDown,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { colors, radii, spacing, typography } from '../../theme/tokens';

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
  // Trigger warning haptic when component mounts
  useEffect(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => undefined);
  }, []);

  const handleLongPress = () => {
    if (onCopyLink) {
      onCopyLink();
      // Success haptic on copy
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
    }
  };

  return (
    <Animated.View
      entering={FadeInDown.duration(350).delay(entranceDelay)}
      style={styles.container}
    >
      {/* Red warning message */}
      <View style={styles.warningBox}>
        <Text style={styles.warningText}>
          THIS APP NEEDS A PARENT OR GUARDIAN TO FINISH SETUP FOR ANYONE UNDER 15. WE DO THIS TO KEEP YOUNGER USERS SAFE, FOLLOWING AUSTRALIAN PRIVACY RULES.
        </Text>
      </View>

      {/* What should I do now? section */}
      <View style={styles.actionSection}>
        <Text style={styles.actionTitle}>What should I do now?</Text>
        <Text style={styles.actionDescription}>Send the link below to a parent or guardian</Text>
        <Text style={styles.actionSubtext}>
          We'll email them a secure link so they can finish setting up TapTalk
        </Text>

        <Pressable
          onLongPress={handleLongPress}
          style={styles.copyButton}
          accessibilityRole="button"
          accessibilityLabel="Press and hold to copy this link"
        >
          <Text style={styles.copyButtonText}>Press and hold to copy this link</Text>
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
    backgroundColor: colors.danger,
    borderRadius: radii.card,
    padding: spacing.lg,
  },
  warningText: {
    fontSize: typography.caption,
    fontWeight: '700',
    color: colors.surface,
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
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  actionDescription: {
    fontSize: typography.callout,
    fontWeight: '500',
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  actionSubtext: {
    fontSize: typography.callout,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  copyButton: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: radii.button,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
  },
  copyButtonText: {
    fontSize: typography.callout,
    fontWeight: '600',
    color: colors.primary,
  },
});
