import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { spacing } from '../../../theme/tokens';
import { useTheme } from '../../../theme/useTheme';
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
  const t = useTheme();
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
    <View style={[styles.wrap, { borderColor: t.colors.border, backgroundColor: t.colors.surface }]}>
      <View style={styles.headerRow}>
        <Text style={[styles.title, { color: t.colors.textMuted }]}>Symbol suggestions</Text>
        {loading ? <ActivityIndicator size="small" color={t.colors.primary} /> : null}
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
          <Text style={[styles.error, { color: t.colors.danger }]}>Symbol search unavailable</Text>
        ) : null}
        {!loading && !error && results.length === 0 ? (
          <Text style={[styles.empty, { color: t.colors.textTertiary }]}>No local symbol found</Text>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
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
  },
  scroll: {
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  empty: {
    fontSize: 13,
    paddingVertical: spacing.md,
  },
  error: {
    fontSize: 13,
    fontWeight: '700',
    paddingVertical: spacing.md,
  },
});
