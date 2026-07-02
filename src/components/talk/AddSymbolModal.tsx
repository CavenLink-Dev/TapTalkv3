/**
 * AddSymbolModal — focused form-sheet modal (Rule 6) for searching the bundled
 * Mulberry symbol library and adding a new symbol tile to the current board.
 * Uses the existing `searchSymbols` service (no new data sources).
 *
 * Two-step flow (Rule 1 / Rule 5 — simple first, deeper detail on selection):
 *   Step 1 "find"      — search, category browse chips, recently added row,
 *                        data-driven category filters over results.
 *   Step 2 "customise" — live tile preview, label, word type → Fitzgerald
 *                        colour (Rule 9 picker, Rule 23 never colour alone).
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  LayoutAnimation,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { MulberrySymbol } from '../symbols/MulberrySymbol';
import { searchSymbols } from '../../features/symbol-brain/symbolSearchService';
import { SearchResult } from '../../features/symbol-brain/types';
import { ThemedText } from '../native/ThemedText';
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

// ── Fitzgerald word-type → colour mapping (Rule 9 — picker sets both) ──
// Symbol/category colours are intentionally literal hex (repo convention).
type WordTypeOption = {
  key: string;
  label: string;
  color: string;
  colorName: string;
};

const WORD_TYPES: WordTypeOption[] = [
  { key: 'person',    label: 'Person',    color: '#FFD60A', colorName: 'yellow' },
  { key: 'verb',      label: 'Action',    color: '#34C759', colorName: 'green'  },
  { key: 'noun',      label: 'Thing',     color: '#FF9F0A', colorName: 'orange' },
  { key: 'emotion',   label: 'Feeling',   color: '#FF3B30', colorName: 'red'    },
  { key: 'adjective', label: 'Describe',  color: '#0A84FF', colorName: 'blue'   },
  { key: 'social',    label: 'Social',    color: '#BF5AF2', colorName: 'purple' },
];

const SWATCHES: { color: string; name: string }[] = [
  { color: '#FF3B30', name: 'red' },
  { color: '#FF9F0A', name: 'orange' },
  { color: '#FFD60A', name: 'yellow' },
  { color: '#34C759', name: 'green' },
  { color: '#0A84FF', name: 'blue' },
  { color: '#BF5AF2', name: 'purple' },
  { color: '#FF2D55', name: 'pink' },
  { color: '#64D2FF', name: 'sky' },
  { color: '#00C7BE', name: 'teal' },
  { color: '#5E5CE6', name: 'indigo' },
  { color: '#A2845E', name: 'brown' },
  { color: '#8E8E93', name: 'grey' },
];

// Browse chips shown before any query is typed (Rule 28 — suggestions).
const BROWSE_CATEGORIES: { label: string; query: string }[] = [
  { label: 'Feelings', query: 'feelings' },
  { label: 'Food',     query: 'food' },
  { label: 'Places',   query: 'places' },
  { label: 'People',   query: 'people' },
  { label: 'Actions',  query: 'actions' },
  { label: 'Animals',  query: 'animals' },
];

// Recently added symbols persisted so repeat adds are one tap (Rule 28).
const RECENTS_KEY = 'taptalk.addSymbol.recents';
const RECENTS_MAX = 8;

type RecentSymbol = { symbolId: string; label: string };

function wordTypeFor(partOfSpeech: string | undefined): WordTypeOption {
  const match = WORD_TYPES.find(w => w.key === partOfSpeech);
  return match ?? WORD_TYPES[2]!; // default: Thing / noun
}

export function AddSymbolModal({ visible, onDismiss, onAdd }: Props) {
  const t = useTheme();
  const reduceMotion = useReduceMotion();
  const [step, setStep] = useState<'find' | 'customise'>('find');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<SearchResult | null>(null);
  const [customLabel, setCustomLabel] = useState('');
  const [wordType, setWordType] = useState<WordTypeOption>(WORD_TYPES[2]!);
  const [color, setColor] = useState<string>(WORD_TYPES[2]!.color);
  const [recents, setRecents] = useState<RecentSymbol[]>([]);
  // Data-driven category filter over the current results (Rule 28). null = All.
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const inputRef = useRef<TextInput>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const animateStep = useCallback(() => {
    if (!reduceMotion) {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    }
  }, [reduceMotion]);

  // Reset + load recents when the modal opens; clear on close.
  useEffect(() => {
    if (visible) {
      setTimeout(() => inputRef.current?.focus(), 400);
      AsyncStorage.getItem(RECENTS_KEY)
        .then(raw => { if (raw) setRecents(JSON.parse(raw) as RecentSymbol[]); })
        .catch(() => {});
    } else {
      setStep('find');
      setQuery('');
      setResults([]);
      setSelected(null);
      setCustomLabel('');
      setWordType(WORD_TYPES[2]!);
      setColor(WORD_TYPES[2]!.color);
      setCategoryFilter(null);
    }
  }, [visible]);

  // Debounced search
  useEffect(() => {
    setCategoryFilter(null); // a new query clears any category narrowing
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

  // ── Step transitions ─────────────────────────────────────────────────
  const goToCustomise = useCallback((item: SearchResult) => {
    hapticSelection();
    const wt = wordTypeFor(item.concept.part_of_speech);
    if (!reduceMotion) {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    }
    setSelected(item);
    setCustomLabel(item.concept.canonical_label || item.symbol.display_name);
    setWordType(wt);
    setColor(wt.color);
    setStep('customise');
  }, [reduceMotion]);

  const goBackToFind = useCallback(() => {
    hapticSelection();
    animateStep();
    setStep('find');
    setSelected(null);
  }, [animateStep]);

  const handleSelectWordType = useCallback((wt: WordTypeOption) => {
    hapticSelection();
    setWordType(wt);
    setColor(wt.color); // word type drives colour; swatches can override after
  }, []);

  const handleSelectColor = useCallback((c: string) => {
    hapticSelection();
    setColor(c);
  }, []);

  const handleConfirm = useCallback(() => {
    if (!selected) return;
    hapticSelection();
    const label = customLabel.trim() || selected.symbol.display_name;
    // Remember for the "Recently added" quick row next time.
    const next: RecentSymbol[] = [
      { symbolId: selected.symbol.id, label },
      ...recents.filter(r => r.symbolId !== selected.symbol.id),
    ].slice(0, RECENTS_MAX);
    AsyncStorage.setItem(RECENTS_KEY, JSON.stringify(next)).catch(() => {});
    onAdd({ symbolId: selected.symbol.id, label, color, wordType: wordType.key });
  }, [color, customLabel, onAdd, recents, selected, wordType]);

  // A recent symbol is re-added via search so we get fresh concept data.
  const handleRecentTap = useCallback(async (recent: RecentSymbol) => {
    hapticSelection();
    setLoading(true);
    try {
      const res = await searchSymbols(recent.label);
      const match = res.find(r => r.symbol.id === recent.symbolId) ?? res[0];
      if (match) { goToCustomise(match); return; }
      setQuery(recent.label); // fall back to a plain search
    } catch {
      setQuery(recent.label);
    } finally {
      setLoading(false);
    }
  }, [goToCustomise]);

  const handleCategoryTap = useCallback((q: string) => {
    hapticSelection();
    setQuery(q);
  }, []);

  // ── Rows ─────────────────────────────────────────────────────────────
  const renderItem = useCallback(({ item }: { item: SearchResult }) => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Select symbol ${item.symbol.display_name}, category ${item.concept.category}`}
      onPress={() => goToCustomise(item)}
      style={({ pressed }) => [
        styles.resultRow,
        { backgroundColor: pressed ? t.colors.inputBg : t.colors.surface },
      ]}
    >
      <View style={styles.resultSymbol}>
        <MulberrySymbol symbolId={item.symbol.id} size={44} />
      </View>
      <View style={styles.resultText}>
        <ThemedText variant="callout" style={styles.resultLabel} color={t.colors.text} numberOfLines={1}>
          {item.symbol.display_name}
        </ThemedText>
        <ThemedText variant="caption" color={t.colors.textMuted} numberOfLines={1}>
          {item.concept.category}
        </ThemedText>
      </View>
      <Ionicons name="chevron-forward" size={18} color={t.colors.textTertiary} />
    </Pressable>
  ), [goToCustomise, t]);

  // Distinct categories present in the current results, and the narrowed list.
  const resultCategories = Array.from(new Set(results.map(r => r.concept.category))).sort();
  const filteredResults = categoryFilter
    ? results.filter(r => r.concept.category === categoryFilter)
    : results;

  // ── Find step body ───────────────────────────────────────────────────
  const findBody = (
    <>
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
          <Pressable
            onPress={() => setQuery('')}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Clear search"
          >
            <Ionicons name="close-circle" size={18} color={t.colors.textMuted} />
          </Pressable>
        )}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={t.colors.primary} />
        </View>
      ) : query.length > 0 ? (
        results.length === 0 ? (
          <View style={styles.center}>
            <ThemedText variant="callout" color={t.colors.textMuted} style={styles.emptyText}>
              No symbols found for "{query}"
            </ThemedText>
          </View>
        ) : (
          <>
            {/* Category filter — chips narrow the results; All clears */}
            {resultCategories.length > 1 && (
              <View style={styles.filterRow}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Show all categories"
                  accessibilityState={{ selected: categoryFilter === null }}
                  onPress={() => { hapticSelection(); setCategoryFilter(null); }}
                  style={[
                    styles.filterChip,
                    { backgroundColor: categoryFilter === null ? t.colors.selectionBg : t.colors.inputBg },
                  ]}
                >
                  <ThemedText variant="caption" color={t.colors.text}>All</ThemedText>
                </Pressable>
                {resultCategories.map(cat => {
                  const isOn = categoryFilter === cat;
                  return (
                    <Pressable
                      key={cat}
                      accessibilityRole="button"
                      accessibilityLabel={`Only show ${cat} symbols`}
                      accessibilityState={{ selected: isOn }}
                      onPress={() => { hapticSelection(); setCategoryFilter(isOn ? null : cat); }}
                      style={[
                        styles.filterChip,
                        { backgroundColor: isOn ? t.colors.selectionBg : t.colors.inputBg },
                      ]}
                    >
                      <ThemedText variant="caption" color={t.colors.text}>{cat}</ThemedText>
                      {isOn && <Ionicons name="checkmark" size={12} color={t.colors.primary} />}
                    </Pressable>
                  );
                })}
              </View>
            )}
            <FlatList
              data={filteredResults}
              keyExtractor={item => item.symbol.id}
              renderItem={renderItem}
              contentContainerStyle={styles.listContent}
              keyboardShouldPersistTaps="handled"
            />
          </>
        )
      ) : (
        // Empty state → browse + recents instead of a bare icon (Rule 24/28)
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.browseContent}
          alwaysBounceVertical
        >
          {recents.length > 0 && (
            <>
              <ThemedText variant="eyebrow" color={t.colors.textTertiary} style={styles.sectionEyebrow}>
                RECENTLY ADDED
              </ThemedText>
              <View style={styles.recentsRow}>
                {recents.map(r => (
                  <Pressable
                    key={r.symbolId}
                    accessibilityRole="button"
                    accessibilityLabel={`Add ${r.label} again`}
                    onPress={() => handleRecentTap(r)}
                    style={({ pressed }) => [
                      styles.recentCell,
                      { backgroundColor: pressed ? t.colors.inputBg : t.colors.surface },
                    ]}
                  >
                    <MulberrySymbol symbolId={r.symbolId} size={40} />
                    <ThemedText variant="caption" color={t.colors.text} numberOfLines={1} style={styles.recentLabel}>
                      {r.label}
                    </ThemedText>
                  </Pressable>
                ))}
              </View>
            </>
          )}

          <ThemedText variant="eyebrow" color={t.colors.textTertiary} style={styles.sectionEyebrow}>
            BROWSE
          </ThemedText>
          <View style={styles.chipsWrap}>
            {BROWSE_CATEGORIES.map(cat => (
              <Pressable
                key={cat.label}
                accessibilityRole="button"
                accessibilityLabel={`Browse ${cat.label} symbols`}
                onPress={() => handleCategoryTap(cat.query)}
                style={({ pressed }) => [
                  styles.chip,
                  { backgroundColor: pressed ? t.colors.selectionBg : t.colors.inputBg },
                ]}
              >
                <ThemedText variant="callout" color={t.colors.text}>{cat.label}</ThemedText>
              </Pressable>
            ))}
          </View>
        </ScrollView>
      )}
    </>
  );

  // ── Customise step body ──────────────────────────────────────────────
  const customiseBody = selected && (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={styles.customiseContent}
      alwaysBounceVertical
    >
      {/* Live tile preview (what will land on the board) */}
      <View
        style={styles.previewWrap}
        accessible
        accessibilityLabel={`Tile preview: ${customLabel.trim() || selected.symbol.display_name}, ${wordType.label}, ${SWATCHES.find(s => s.color === color)?.name ?? 'custom'} tile`}
      >
        <View style={[styles.previewTile, { backgroundColor: color }]}>
          <MulberrySymbol symbolId={selected.symbol.id} size={52} />
          <ThemedText variant="callout" color="#FFFFFF" numberOfLines={1} style={styles.previewLabel}>
            {customLabel.trim() || selected.symbol.display_name}
          </ThemedText>
        </View>
      </View>

      {/* Label */}
      <View style={styles.fieldSection}>
        <ThemedText variant="eyebrow" color={t.colors.textTertiary} style={styles.sectionEyebrow}>
          LABEL
        </ThemedText>
        <TextInput
          style={[styles.labelInput, { color: t.colors.text, backgroundColor: t.colors.inputBg }]}
          value={customLabel}
          onChangeText={setCustomLabel}
          placeholder="e.g. Happy"
          placeholderTextColor={t.colors.textTertiary}
          returnKeyType="done"
          onSubmitEditing={handleConfirm}
          accessibilityLabel="Tile label"
        />
      </View>

      {/* Word type → sets Fitzgerald colour (Rule 9, Rule 23) */}
      <View style={styles.fieldSection}>
        <ThemedText variant="eyebrow" color={t.colors.textTertiary} style={styles.sectionEyebrow}>
          WORD TYPE
        </ThemedText>
        <View style={styles.chipsWrap}>
          {WORD_TYPES.map(wt => {
            const isOn = wordType.key === wt.key;
            return (
              <Pressable
                key={wt.key}
                accessibilityRole="button"
                accessibilityLabel={`Word type ${wt.label}, ${wt.colorName} tile`}
                accessibilityState={{ selected: isOn }}
                onPress={() => handleSelectWordType(wt)}
                style={({ pressed }) => [
                  styles.chip,
                  { backgroundColor: pressed || isOn ? t.colors.selectionBg : t.colors.inputBg },
                ]}
              >
                <View style={[styles.chipDot, { backgroundColor: wt.color }]} />
                <ThemedText variant="callout" color={t.colors.text}>{wt.label}</ThemedText>
                {isOn && <Ionicons name="checkmark" size={16} color={t.colors.primary} />}
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Colour override swatches */}
      <View style={styles.fieldSection}>
        <ThemedText variant="eyebrow" color={t.colors.textTertiary} style={styles.sectionEyebrow}>
          TILE COLOUR
        </ThemedText>
        <View style={styles.swatchRow}>
          {SWATCHES.map(s => {
            const isOn = color === s.color;
            return (
              <Pressable
                key={s.color}
                accessibilityRole="button"
                accessibilityLabel={`Tile colour ${s.name}`}
                accessibilityState={{ selected: isOn }}
                onPress={() => handleSelectColor(s.color)}
                hitSlop={6}
                style={styles.swatchHit}
              >
                <View style={[styles.swatch, { backgroundColor: s.color }]}>
                  {isOn && <Ionicons name="checkmark" size={20} color="#FFFFFF" />}
                </View>
              </Pressable>
            );
          })}
        </View>
      </View>
    </ScrollView>
  );

  return (
    <Modal
      visible={visible}
      animationType={reduceMotion ? 'fade' : 'slide'}
      presentationStyle="formSheet"
      onRequestClose={step === 'customise' ? goBackToFind : onDismiss}
    >
      <KeyboardAvoidingView behavior="padding" style={[styles.container, { backgroundColor: t.colors.background }]}>
        {/* Header */}
        <View style={styles.header}>
          {step === 'find' ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Cancel"
              onPress={onDismiss}
              hitSlop={12}
              style={styles.headerButton}
            >
              <ThemedText variant="body" color={t.colors.primary} style={styles.headerButtonText}>Cancel</ThemedText>
            </Pressable>
          ) : (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Back to search"
              onPress={goBackToFind}
              hitSlop={12}
              style={[styles.headerButton, styles.headerBack]}
            >
              <Ionicons name="chevron-back" size={20} color={t.colors.primary} />
              <ThemedText variant="body" color={t.colors.primary} style={styles.headerButtonText}>Search</ThemedText>
            </Pressable>
          )}
          <ThemedText variant="heading" color={t.colors.text}>
            {step === 'find' ? 'Add Symbol' : 'Customise Tile'}
          </ThemedText>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Add tile to board"
            accessibilityState={{ disabled: step !== 'customise' || !selected }}
            onPress={handleConfirm}
            disabled={step !== 'customise' || !selected}
            hitSlop={12}
            style={styles.headerButton}
          >
            <ThemedText
              variant="body"
              color={step === 'customise' && selected ? t.colors.primary : t.colors.disabled}
              style={styles.headerButtonText}
            >
              Add
            </ThemedText>
          </Pressable>
        </View>

        {step === 'find' ? findBody : customiseBody}
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
  headerBack: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButtonText: {
    fontFamily: fonts.displayBold,
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
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  emptyText: {
    textAlign: 'center',
  },
  browseContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: 40,
  },
  sectionEyebrow: {
    marginBottom: spacing.sm,
  },
  recentsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  recentCell: {
    width: 72,
    minHeight: 72,
    borderRadius: radii.card,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xs,
    gap: 2,
  },
  recentLabel: {
    maxWidth: 64,
    textAlign: 'center',
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    minHeight: 44,
    paddingHorizontal: spacing.md,
    borderRadius: radii.button,
  },
  chipDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minHeight: 44,
    paddingHorizontal: spacing.md,
    borderRadius: radii.button,
  },
  customiseContent: {
    paddingBottom: 40,
  },
  previewWrap: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  previewTile: {
    width: 120,
    height: 120,
    borderRadius: radii.card,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    padding: spacing.sm,
  },
  previewLabel: {
    fontFamily: fonts.displayBold,
    maxWidth: 104,
    textAlign: 'center',
  },
  fieldSection: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  labelInput: {
    height: 44,
    borderRadius: radii.button,
    paddingHorizontal: spacing.md,
    fontSize: typography.body,
    fontFamily: fonts.body,
  },
  swatchRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  swatchHit: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  swatch: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
