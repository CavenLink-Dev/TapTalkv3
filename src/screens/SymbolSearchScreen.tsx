import React, { useMemo, useState } from 'react';
import { FlatList, StyleSheet, Text, TextInput, View } from 'react-native';
import { colors, radii, spacing, typography } from '../theme/tokens';
import { SearchResult } from '../features/symbol-brain/types';
import { SymbolSuggestionRow } from '../components/aac/symbols/SymbolSuggestionRow';
import { SymbolResultCard } from '../components/aac/symbols/SymbolResultCard';

type Props = {
  userId?: string;
  onSelectSymbol?: (result: SearchResult) => void;
};

export function SymbolSearchScreen({
  userId = 'local-user',
  onSelectSymbol,
}: Props) {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<SearchResult | null>(null);
  const data = useMemo(() => selected ? [selected] : [], [selected]);

  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Symbol Search</Text>
      <TextInput
        accessibilityLabel="Search Mulberry symbols"
        value={query}
        onChangeText={setQuery}
        placeholder="Type a word, phrase, or concept"
        placeholderTextColor={colors.textTertiary}
        style={styles.input}
      />
      <SymbolSuggestionRow
        query={query}
        userId={userId}
        onSelect={(result) => {
          setSelected(result);
          onSelectSymbol?.(result);
        }}
      />
      <FlatList
        data={data}
        keyExtractor={item => item.symbol.id}
        contentContainerStyle={styles.detailList}
        renderItem={({ item }) => (
          <View>
            <Text style={styles.sectionLabel}>Selected</Text>
            <SymbolResultCard result={item} onPress={onSelectSymbol} />
            <Text style={styles.reason}>
              {item.match_reasons.join(', ')}
            </Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.lg,
  },
  title: {
    fontSize: typography.heading,
    fontWeight: '900',
    color: colors.text,
    marginBottom: spacing.md,
  },
  input: {
    minHeight: 52,
    borderRadius: radii.input,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    fontSize: typography.body,
    color: colors.text,
    marginBottom: spacing.md,
  },
  detailList: {
    paddingTop: spacing.lg,
  },
  sectionLabel: {
    fontSize: typography.caption,
    color: colors.textMuted,
    fontWeight: '800',
    marginBottom: spacing.sm,
  },
  reason: {
    marginTop: spacing.sm,
    color: colors.textMuted,
    fontSize: typography.caption,
  },
});
