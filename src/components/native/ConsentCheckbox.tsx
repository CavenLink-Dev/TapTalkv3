import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  FadeInDown,
} from 'react-native-reanimated';
import { hapticLight } from '../../utils/haptics';
import { spacing, typography } from '../../theme/tokens';
import { useTheme } from '../../theme/useTheme';
import { useReduceMotion } from '../../hooks/useReduceMotion';

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
 * Checkmark scales in with a spring when toggled on, reduces to a short fade
 * when needed, and haptic feedback is triggered.
 */
export function ConsentCheckbox({
  checked,
  onToggle,
  label,
  entranceDelay = 0,
}: ConsentCheckboxProps) {
  const t = useTheme();
  const reduceMotion = useReduceMotion();
  const checkScale = useSharedValue(checked ? 1 : 0);

  const handlePress = () => {
    const newChecked = !checked;
    checkScale.value = reduceMotion
      ? withTiming(newChecked ? 1 : 0, { duration: 120 })
      : withSpring(newChecked ? 1 : 0, {
          damping: 12,
          stiffness: 300,
        });
    hapticLight();
    onToggle();
  };

  const checkmarkStyle = useAnimatedStyle(() => (
    reduceMotion
      ? { opacity: checkScale.value, transform: [{ scale: 1 }] }
      : { transform: [{ scale: checkScale.value }] }
  ));

  // Update the shared value when checked prop changes externally
  React.useEffect(() => {
    checkScale.value = reduceMotion
      ? withTiming(checked ? 1 : 0, { duration: 120 })
      : withSpring(checked ? 1 : 0, {
          damping: 12,
          stiffness: 300,
        });
  }, [checked, checkScale, reduceMotion]);

  const entering = reduceMotion
    ? FadeInDown.duration(180)
        .delay(Math.min(entranceDelay, 80))
        .withInitialValues({ transform: [{ translateY: 0 }] })
    : FadeInDown.duration(300).delay(entranceDelay);

  return (
    <Animated.View
      entering={entering}
      style={styles.container}
    >
      <Pressable
        onPress={handlePress}
        style={styles.row}
        accessibilityRole="checkbox"
        accessibilityState={{ checked }}
        accessibilityLabel={label}
      >
        <View
          style={[
            styles.checkbox,
            { borderColor: t.colors.border, backgroundColor: t.colors.surface },
            checked && { backgroundColor: t.colors.success, borderColor: t.colors.success },
          ]}
        >
          <Animated.View style={checkmarkStyle}>
            <Text style={[styles.checkmark, { color: t.colors.surface }]}>{'\u2713'}</Text>
          </Animated.View>
        </View>
        <Text style={[styles.label, { color: t.colors.text }]}>{label}</Text>
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
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
    marginTop: 2,
  },
  checkmark: {
    fontSize: 16,
    fontWeight: '700',
  },
  label: {
    flex: 1,
    fontSize: typography.callout,
    fontWeight: '600',
    lineHeight: 22,
  },
});
