import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, shadows, symbolColors } from '../../../theme/tokens';
import { SearchResult } from '../../../features/symbol-brain/types';
import { MulberrySymbol } from './MulberrySymbol';

type Props = {
  result: SearchResult;
  onPress?: (result: SearchResult) => void;
  compact?: boolean;
};

function colourForConcept(result: SearchResult) {
  switch (result.concept.concept_type) {
    case 'action': return symbolColors.verb;
    case 'person': return symbolColors.noun;
    case 'place': return symbolColors.noun;
    case 'emotion': return symbolColors.adjective;
    case 'social': return symbolColors.social;
    case 'phrase': return symbolColors.conjunction;
    case 'core': return symbolColors.pronoun;
    case 'fringe': return symbolColors.noun;
  }
}

export function SymbolResultCard({ result, onPress, compact }: Props) {
  const bg = colourForConcept(result);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${result.symbol.display_name}, ${result.confidence} confidence`}
      accessibilityHint="Select this symbol suggestion"
      onPress={() => onPress?.(result)}
      style={[
        styles.card,
        compact && styles.cardCompact,
        { backgroundColor: bg },
        shadows.card,
      ]}
    >
      <View style={styles.symbolBox}>
        <MulberrySymbol symbolId={result.symbol.id} size={compact ? 42 : 56} />
      </View>
      <Text style={styles.label} numberOfLines={1}>{result.symbol.display_name}</Text>
      {!compact ? (
        <Text style={styles.meta} numberOfLines={1}>
          {Math.round(result.score * 100)}% · {result.match_reasons[0] ?? 'candidate'}
        </Text>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 112,
    minHeight: 124,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.symbolOutline,
    padding: 8,
    alignItems: 'center',
  },
  cardCompact: {
    width: 82,
    minHeight: 88,
    padding: 6,
  },
  symbolBox: {
    width: '100%',
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
  },
  meta: {
    marginTop: 3,
    fontSize: 9,
    color: colors.textMuted,
    textAlign: 'center',
  },
});
