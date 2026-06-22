import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { colors, radii, spacing, typography } from '../../theme/tokens';
import { SearchResult } from '../symbol-brain/types';
import { searchSymbols } from '../symbol-brain/symbolSearchService';
import { userPreferenceService } from '../symbol-brain/userPreferenceService';
import { SymbolResultCard } from '../../components/aac/symbols/SymbolResultCard';

type Props = {
  userId?: string;
  conceptId: string;
  onSaved?: (result: SearchResult) => void;
};

export function GuardianSymbolOverrideScreen({
  userId = 'local-user',
  conceptId,
  onSaved,
}: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [savingId, setSavingId] = useState<string | null>(null);

  async function runSearch() {
    setResults(await searchSymbols(query, userId));
  }

  async function savePreference(result: SearchResult) {
    setSavingId(result.symbol.id);
    await userPreferenceService.save({
      userId,
      conceptId,
      preferredSymbolId: result.symbol.id,
      selectedBy: 'guardian',
    });
    setSavingId(null);
    onSaved?.(result);
  }

  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Guardian Symbol Override</Text>
      <Text style={styles.copy}>
        Search local Mulberry symbols, then save the selected symbol as this user's preferred symbol.
      </Text>
      <View style={styles.searchRow}>
        <TextInput
          accessibilityLabel="Search replacement symbol"
          value={query}
          onChangeText={setQuery}
          placeholder="Search replacement"
          placeholderTextColor={colors.textTertiary}
          style={styles.input}
          onSubmitEditing={runSearch}
        />
        <Pressable style={styles.button} onPress={runSearch}>
          <Text style={styles.buttonText}>Search</Text>
        </Pressable>
      </View>
      <View style={styles.grid}>
        {results.map(result => (
          <View key={result.symbol.id} style={styles.resultWrap}>
            <SymbolResultCard result={result} onPress={savePreference} />
            {savingId === result.symbol.id ? (
              <Text style={styles.saving}>Saving...</Text>
            ) : null}
          </View>
        ))}
      </View>
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
  },
  copy: {
    marginTop: spacing.sm,
    color: colors.textMuted,
    fontSize: typography.callout,
  },
  searchRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  input: {
    flex: 1,
    minHeight: 52,
    borderRadius: radii.input,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    color: colors.text,
  },
  button: {
    minWidth: 88,
    borderRadius: radii.button,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: colors.textOnDark,
    fontWeight: '800',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  resultWrap: {
    alignItems: 'center',
  },
  saving: {
    marginTop: spacing.xs,
    color: colors.textMuted,
    fontSize: typography.caption,
  },
});
