import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  FadeInDown,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { colors, spacing, typography } from '../../theme/tokens';

interface ConsentCheckboxProps {
  checked: boolean;
  onToggle: () => void;
  label: string;
  /**
   * Entrance delay for the whole component
   */
  entranceDelay?: number;
}

/**
 * Animated consent checkbox with green checkmark.
 * Checkmark scales in with a spring when toggled on, and haptic feedback is triggered.
 */
export function ConsentCheckbox({
  checked,
  onToggle,
  label,
  entranceDelay = 0,
}: ConsentCheckboxProps) {
  const checkScale = useSharedValue(checked ? 1 : 0);

  const handlePress = () => {
    const newChecked = !checked;
    checkScale.value = withSpring(newChecked ? 1 : 0, {
      damping: 12,
      stiffness: 300,
    });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
    onToggle();
  };

  const checkmarkStyle = useAnimatedStyle(() => ({
    transform: [{ scale: checkScale.value }],
  }));

  // Update the shared value when checked prop changes externally
  React.useEffect(() => {
    checkScale.value = withSpring(checked ? 1 : 0, {
      damping: 12,
      stiffness: 300,
    });
  }, [checked, checkScale]);

  return (
    <Animated.View
      entering={FadeInDown.duration(300).delay(entranceDelay)}
      style={styles.container}
    >
      <Pressable
        onPress={handlePress}
        style={styles.row}
        accessibilityRole="checkbox"
        accessibilityState={{ checked }}
        accessibilityLabel={label}
      >
        <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
          <Animated.View style={checkmarkStyle}>
            <Text style={styles.checkmark}>{'\u2713'}</Text>
          </Animated.View>
        </View>
        <Text style={styles.label}>{label}</Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  checkmark: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.surface,
  },
  label: {
    flex: 1,
    fontSize: typography.callout,
    fontWeight: '600',
    color: colors.text,
    lineHeight: 22,
  },
});
