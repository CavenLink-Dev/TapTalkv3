import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { AnimatedChoiceCard } from './AnimatedChoiceCard';
import { spacing, typography } from '../../theme/tokens';
import { useTheme } from '../../theme/useTheme';

interface GuardianQuestionButtonsProps {
  selected: 'yes' | 'no' | null;
  onSelect: (value: 'yes' | 'no') => void;
  /**
   * Entrance delay for the whole component
   */
  entranceDelay?: number;
}

/**
 * Guardian question: "Are you their legal guardian?"
 * Shows Yes/No buttons with progressive disclosure animation.
 */
export function GuardianQuestionButtons({
  selected,
  onSelect,
  entranceDelay = 0,
}: GuardianQuestionButtonsProps) {
  const t = useTheme();

  return (
    <Animated.View
      entering={FadeInDown.duration(300).delay(entranceDelay)}
      style={styles.container}
    >
      <Text style={[styles.label, { color: t.colors.text }]}>Are you their legal guardian?</Text>
      <View style={styles.row}>
        <View style={styles.halfWidth}>
          <AnimatedChoiceCard
            label="Yes"
            selected={selected === 'yes'}
            onPress={() => onSelect('yes')}
            showChevron
          />
        </View>
        <View style={styles.halfWidth}>
          <AnimatedChoiceCard
            label="No"
            selected={selected === 'no'}
            onPress={() => onSelect('no')}
            showChevron
          />
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  label: {
    fontSize: typography.callout,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  halfWidth: {
    flex: 1,
  },
});
