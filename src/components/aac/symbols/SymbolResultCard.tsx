import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { shadows } from '../../../theme/tokens';
import { useTheme } from '../../../theme/useTheme';
import { SearchResult } from '../../../features/symbol-brain/types';
import { ResolveTier } from '../../../features/symbol-brain/resolveSymbolForKeyword';
import { MulberrySymbol } from './MulberrySymbol';

type Props = {
  result: SearchResult;
  onPress?: (result: SearchResult) => void;
  compact?: boolean;
  /**
   * Optional fallback tier. When 'fuzzy', 'semantic', 'category' or 'unknown',
   * the card renders a subtle dashed border + "≈" prefix so the user knows
   * this is an approximate match — without making it look broken.
   */
  tier?: ResolveTier;
};

function isFallbackTier(tier?: ResolveTier): boolean {
  return tier === 'fuzzy' || tier === 'semantic' || tier === 'category' || tier === 'unknown';
}

function colourForConcept(result: SearchResult, symbolColors: ReturnType<typeof useTheme>['symbolColors']) {
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

export function SymbolResultCard({ result, onPress, compact, tier }: Props) {
  const t = useTheme();
  const bg = colourForConcept(result, t.symbolColors);
  const fallback = isFallbackTier(tier);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={
        fallback
          ? `${result.symbol.display_name}, approximate match, ${result.confidence} confidence`
          : `${result.symbol.display_name}, ${result.confidence} confidence`
      }
      accessibilityHint="Select this symbol suggestion"
      onPress={() => onPress?.(result)}
      style={[
        styles.card,
        compact && styles.cardCompact,
        { backgroundColor: bg, borderColor: t.colors.symbolOutline },
        shadows.card,
        fallback && [styles.cardFallback, { borderColor: t.colors.textMuted }],
      ]}
    >
      <View style={styles.symbolBox}>
        <MulberrySymbol symbolId={result.symbol.id} size={compact ? 42 : 56} />
      </View>
      <Text style={[styles.label, { color: t.colors.text }]} numberOfLines={1}>
        {fallback ? '≈ ' : ''}{result.symbol.display_name}
      </Text>
      {!compact ? (
        <Text style={[styles.meta, { color: t.colors.textMuted }]} numberOfLines={1}>
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
    padding: 8,
    alignItems: 'center',
  },
  cardCompact: {
    width: 82,
    minHeight: 88,
    padding: 6,
  },
  cardFallback: {
    // Dashed border + slight desaturation so the user can see this is an
    // approximate match without the card feeling "wrong" or low-quality.
    borderStyle: 'dashed',
    opacity: 0.92,
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
    textAlign: 'center',
  },
  meta: {
    marginTop: 3,
    fontSize: 9,
    textAlign: 'center',
  },
});
