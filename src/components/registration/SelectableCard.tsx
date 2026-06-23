import React, { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, shadows, spacing, typography } from '../../theme/tokens';
import { hapticSelection } from '../../utils/haptics';

interface SelectableCardProps {
  label: string;
  description?: string;
  selected: boolean;
  onPress: () => void;
  accessibilityLabel?: string;
}

/**
 * Clean, adult selectable option card — white surface that adopts a blue
 * border, subtle tint and a check mark when selected. Used for single- and
 * multi-select choices across registration (role, guardian, consent).
 */
export function SelectableCard({
  label,
  description,
  selected,
  onPress,
  accessibilityLabel,
}: SelectableCardProps) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  useEffect(() => {
    scale.value = withTiming(1, { duration: 120 });
  }, [selected, scale]);

  const handlePress = () => {
    hapticSelection();
    onPress();
  };

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ selected }}
        accessibilityLabel={accessibilityLabel ?? label}
        onPressIn={() => {
          scale.value = withTiming(0.985, { duration: 90 });
        }}
        onPressOut={() => {
          scale.value = withTiming(1, { duration: 90 });
        }}
        onPress={handlePress}
        style={[styles.card, selected && styles.cardSelected]}
      >
        <View style={styles.textBlock}>
          <Text style={[styles.label, selected && styles.labelSelected]}>{label}</Text>
          {description ? <Text style={styles.description}>{description}</Text> : null}
        </View>
        <View style={[styles.checkRing, selected && styles.checkRingSelected]}>
          {selected ? <Ionicons name="checkmark" size={16} color={colors.surface} /> : null}
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    minHeight: 60,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.card,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  cardSelected: {
    borderColor: colors.primary,
    backgroundColor: '#EAF5FE',
    ...shadows.card,
  },
  textBlock: {
    flex: 1,
  },
  label: {
    fontSize: typography.body,
    fontWeight: '600',
    color: colors.text,
  },
  labelSelected: {
    color: colors.primaryDark,
  },
  description: {
    marginTop: 2,
    fontSize: typography.callout,
    color: colors.textMuted,
    lineHeight: 20,
  },
  checkRing: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkRingSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
});
