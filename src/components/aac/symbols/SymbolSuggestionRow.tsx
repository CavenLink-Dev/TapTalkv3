import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, spacing } from '../../../theme/tokens';
import { searchSymbols } from '../../../features/symbol-brain/symbolSearchService';
import { SearchContext, SearchResult } from '../../../features/symbol-brain/types';
import { SymbolResultCard } from './SymbolResultCard';

type Props = {
  query: string;
  userId?: string;
  context?: Partial<SearchContext>;
  onSelect?: (result: SearchResult) => void;
};

export function SymbolSuggestionRow({
  query,
  userId = 'local-user',
  context,
  onSelect,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function runSearch() {
      const trimmed = query.trim();
      if (!trimmed) {
        setResults([]);
        setError(null);
        return;
      }
      setLoading(true);
      try {
        setError(null);
        const next = await searchSymbols(trimmed, userId, context);
        if (!cancelled) setResults(next.slice(0, 6));
      } catch (e: unknown) {
        if (!cancelled) {
          setResults([]);
          setError(e instanceof Error ? e.message : 'Symbol search unavailable');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    runSearch();
    return () => {
      cancelled = true;
    };
  }, [context, query, userId]);

  if (!query.trim()) return null;

  return (
    <View style={styles.wrap}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Symbol suggestions</Text>
        {loading ? <ActivityIndicator size="small" color={colors.primary} /> : null}
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {results.map(result => (
          <SymbolResultCard
            key={result.symbol.id}
            result={result}
            compact
            onPress={onSelect}
          />
        ))}
        {error ? (
          <Text style={styles.error}>Symbol search unavailable</Text>
        ) : null}
        {!loading && !error && results.length === 0 ? (
          <Text style={styles.empty}>No local symbol found</Text>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingVertical: spacing.sm,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.xs,
  },
  title: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.textMuted,
  },
  scroll: {
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  empty: {
    color: colors.textTertiary,
    fontSize: 13,
    paddingVertical: spacing.md,
  },
  error: {
    color: colors.danger,
    fontSize: 13,
    fontWeight: '700',
    paddingVertical: spacing.md,
  },
});
