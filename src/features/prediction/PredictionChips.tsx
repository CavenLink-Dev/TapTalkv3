/**
 * Compact 4-chip suggestion row above the message strip.
 * Reads the last word in state.messageWords, calls predictNext, and lets the
 * caller decide what to do on tap (append + speak).
 */
import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { predictNext } from './corePredictor';
import { useTheme } from '../../theme/useTheme';
import { hapticSelection } from '../../utils/haptics';

type Props = {
  lastWord?: string;
  onPick: (word: string) => void;
  max?: number;
};

export function PredictionChips({ lastWord, onPick, max = 4 }: Props) {
  const t = useTheme();
  const suggestions = useMemo(() => predictNext(lastWord, max), [lastWord, max]);

  return (
    <View style={styles.row} accessibilityRole="tablist" accessibilityLabel="Word suggestions">
      {suggestions.map((word) => (
        <Pressable
          key={word}
          onPress={() => { hapticSelection(); onPick(word); }}
          accessibilityRole="button"
          accessibilityLabel={word}
          accessibilityHint={`Adds ${word} to your message`}
          style={({ pressed }) => [
            styles.chip,
            { backgroundColor: t.colors.surface, borderColor: t.colors.softBlue },
            pressed && { opacity: 0.7 },
          ]}
          hitSlop={8}
        >
          <Text style={[styles.chipText, { color: t.colors.text }]} numberOfLines={1}>
            {word}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row:       { flexDirection: 'row', gap: 8, paddingHorizontal: 12, paddingVertical: 6 },
  chip:      { minHeight: 44, paddingHorizontal: 14, borderRadius: 22, borderWidth: 1, alignItems: 'center', justifyContent: 'center', flexShrink: 1 },
  chipText:  { fontSize: 17, fontWeight: '600' },
});
