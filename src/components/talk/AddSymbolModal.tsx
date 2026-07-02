/**
 * AddSymbolModal — focused form-sheet modal (Rule 6) for searching the bundled
 * Mulberry symbol library and adding a new symbol tile to the current board.
 * Uses the existing `searchSymbols` service (no new data sources).
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MulberrySymbol } from '../symbols/MulberrySymbol';
import { searchSymbols } from '../../features/symbol-brain/symbolSearchService';
import { SearchResult } from '../../features/symbol-brain/types';
import { useTheme } from '../../theme/useTheme';
import { radii, spacing, typography } from '../../theme/tokens';
import { fonts } from '../../theme/fonts';
import { hapticSelection } from '../../utils/haptics';
import { useReduceMotion } from '../../hooks/useReduceMotion';

export interface AddSymbolResult {
  symbolId: string;
  label: string;
  color: string;
  wordType: string;
}

interface Props {
  visible: boolean;
  onDismiss: () => void;
  onAdd: (result: AddSymbolResult) => void;
}

const SYMBOL_COLORS = [
  '#FF3B30', '#FF9F0A', '#FFD60A', '#34C759', '#0A84FF', '#BF5AF2',
];

export function AddSymbolModal({ visible, onDismiss, onAdd }: Props) {
  const t = useTheme();
  const reduceMotion = useReduceMotion();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<SearchResult | null>(null);
  const [customLabel, setCustomLabel] = useState('');
  const inputRef = useRef<TextInput>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-focus the search input when modal appears
  useEffect(() => {
    if (visible) {
      setTimeout(() => inputRef.current?.focus(), 400);
    } else {
      setQuery('');
      setResults([]);
      setSelected(null);
      setCustomLabel('');
    }
  }, [visible]);

  // Debounced search
  useEffect(() => {
    if (!query.trim()) { setResults([]); setLoading(false); return; }
    setLoading(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await searchSymbols(query.trim());
        setResults(res);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query]);

  const handleSelect = useCallback((item: SearchResult) => {
    hapticSelection();
    setSelected(item);
    setCustomLabel(item.concept.canonical_label || item.symbol.display_name);
  }, []);

  const handleConfirm = useCallback(() => {
    if (!selected) return;
    hapticSelection();
    const label = customLabel.trim() || selected.symbol.display_name;
    const color = SYMBOL_COLORS[Math.floor(Math.random() * SYMBOL_COLORS.length)] ?? '#0A84FF';
    const wordType = selected.concept.part_of_speech ?? 'noun';
    onAdd({ symbolId: selected.symbol.id, label, color, wordType });
  }, [customLabel, onAdd, selected]);

  const renderItem = useCallback(({ item }: { item: SearchResult }) => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Select symbol ${item.symbol.display_name}`}
      onPress={() => handleSelect(item)}
      style={({ pressed }) => [
        styles.resultRow,
        { backgroundColor: pressed ? t.colors.inputBg : t.colors.surface },
        selected?.symbol.id === item.symbol.id && { backgroundColor: t.colors.selectionBg },
      ]}
    >
      <View style={styles.resultSymbol}>
        <MulberrySymbol symbolId={item.symbol.id} size={44} />
      </View>
      <View style={styles.resultText}>
        <Text style={[styles.resultLabel, { color: t.colors.text }]} numberOfLines={1}>
          {item.symbol.display_name}
        </Text>
        <Text style={[styles.resultMeta, { color: t.colors.textMuted }]} numberOfLines={1}>
          {item.concept.category} · {item.confidence}
        </Text>
      </View>
      {selected?.symbol.id === item.symbol.id && (
        <Ionicons name="checkmark-circle" size={24} color={t.colors.primary} />
      )}
    </Pressable>
  ), [handleSelect, selected, t]);

  return (
    <Modal
      visible={visible}
      animationType={reduceMotion ? 'fade' : 'slide'}
      presentationStyle="formSheet"
      onRequestClose={onDismiss}
    >
      <KeyboardAvoidingView behavior="padding" style={[styles.container, { backgroundColor: t.colors.background }]}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Cancel"
            onPress={onDismiss}
            hitSlop={12}
            style={styles.headerButton}
          >
            <Text style={[styles.headerButtonText, { color: t.colors.primary }]}>Cancel</Text>
          </Pressable>
          <Text style={[styles.headerTitle, { color: t.colors.text }]}>Add Symbol</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Add selected symbol"
            accessibilityState={{ disabled: !selected }}
            onPress={handleConfirm}
            disabled={!selected}
            hitSlop={12}
            style={styles.headerButton}
          >
            <Text style={[styles.headerButtonText, { color: selected ? t.colors.primary : t.colors.disabled }]}>
              Add
            </Text>
          </Pressable>
        </View>

        {/* Search input (Rule 28) */}
        <View style={[styles.searchWrap, { backgroundColor: t.colors.inputBg }]}>
          <Ionicons name="search" size={18} color={t.colors.textMuted} />
          <TextInput
            ref={inputRef}
            style={[styles.searchInput, { color: t.colors.text }]}
            placeholder="e.g. happy, toilet, school"
            placeholderTextColor={t.colors.textTertiary}
            value={query}
            onChangeText={setQuery}
            returnKeyType="search"
            autoCapitalize="none"
            autoCorrect={false}
            accessibilityLabel="Search symbols"
          />
          {query.length > 0 && (
            <Pressable onPress={() => setQuery('')} hitSlop={8} accessibilityLabel="Clear search">
              <Ionicons name="close-circle" size={18} color={t.colors.textMuted} />
            </Pressable>
          )}
        </View>

        {/* Custom label input (shows after selection) */}
        {selected && (
          <View style={styles.labelSection}>
            <Text style={[styles.labelEyebrow, { color: t.colors.textTertiary }]}>LABEL</Text>
            <TextInput
              style={[styles.labelInput, { color: t.colors.text, backgroundColor: t.colors.inputBg }]}
              value={customLabel}
              onChangeText={setCustomLabel}
              placeholder="e.g. Happy"
              placeholderTextColor={t.colors.textTertiary}
              accessibilityLabel="Tile label"
            />
          </View>
        )}

        {/* Results list */}
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator color={t.colors.primary} />
          </View>
        ) : results.length === 0 && query.length > 0 ? (
          <View style={styles.center}>
            <Text style={[styles.emptyText, { color: t.colors.textMuted }]}>
              No symbols found for "{query}"
            </Text>
          </View>
        ) : (
          <FlatList
            data={results}
            keyExtractor={item => item.symbol.id}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            keyboardShouldPersistTaps="handled"
          />
        )}

        {/* Empty state (Rule 24) */}
        {!query && results.length === 0 && !selected && (
          <View style={styles.center}>
            <Ionicons name="search-outline" size={48} color={t.colors.textTertiary} />
            <Text style={[styles.emptyText, { color: t.colors.textMuted, marginTop: spacing.md }]}>
              Search the Mulberry symbol library
            </Text>
          </View>
        )}
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  headerButton: {
    minWidth: 60,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerButtonText: {
    fontFamily: fonts.displayBold,
    fontSize: typography.body,
  },
  headerTitle: {
    fontFamily: fonts.displayHeavy,
    fontSize: typography.heading,
    letterSpacing: typography.trackHeading,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.lg,
    borderRadius: radii.button,
    paddingHorizontal: spacing.md,
    height: 44,
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: typography.body,
    fontFamily: fonts.body,
    height: 44,
  },
  labelSection: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  labelEyebrow: {
    fontFamily: fonts.bodyHeavy,
    fontSize: typography.eyebrow,
    letterSpacing: typography.trackEyebrow,
    marginBottom: spacing.xs,
  },
  labelInput: {
    height: 44,
    borderRadius: radii.button,
    paddingHorizontal: spacing.md,
    fontSize: typography.body,
    fontFamily: fonts.body,
  },
  listContent: {
    paddingTop: spacing.sm,
    paddingBottom: 40,
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    gap: spacing.md,
    minHeight: 60,
  },
  resultSymbol: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultText: { flex: 1 },
  resultLabel: {
    fontFamily: fonts.displayBold,
    fontSize: typography.callout,
  },
  resultMeta: {
    fontFamily: fonts.body,
    fontSize: typography.caption,
    marginTop: 2,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  emptyText: {
    fontFamily: fonts.body,
    fontSize: typography.callout,
    textAlign: 'center',
  },
});
