/**
 * Talk screen — layout mirrors the Figma frame
 *   File:  https://www.figma.com/design/8MV1zloECN6SJiA5FeCNze
 *   Frame: BlankAACLayout (node 86:271)
 *
 * Specs (in container coordinates, container = 393 × 852):
 *   • Message card    295 × 120 at (19.15, 68),  white, border #BBC0C7, r=10
 *   • Side panel       54 × 120 at (320.15, 68), white, border #BBC0C7, r=10
 *   • Trash button     39 × 39  at (328.15, 81)  inside side panel
 *   • Save button      40 × 40  at (328.15, 136) inside side panel
 *   • "Tap to speak"   left-aligned text inside the card (x≈8)
 *   • Backspace icon   45 × 30 right-aligned inside the card
 *   • Category strip  393 × 57 at y≈239, white, top+bottom #BBC0C7 hairlines
 *     • 5 pills 60×33, gap 15, centred (total inner 360×34)
 *     • Active (Main): #006DD3,  others: #199AEE,  white SF Compact Semibold 13pt
 *
 * No symbol grid, no folder cells — only the background, message bar,
 * category strip and tab bar are visible in the source frame.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppContext } from '../../src/hooks/useAppContext';
import { hapticSelection } from '../../src/utils/haptics';
import { useSpeech } from '../../src/hooks/useSpeech';
import { colors, radii, spacing, symbolColors, typography } from '../../src/theme/tokens';
import {
  BackspaceIcon,
  SaveButtonIcon,
  TrashButtonIcon,
} from '../../src/components/icons/FigmaIcons';
import { SymbolSuggestionRow } from '../../src/components/aac/symbols/SymbolSuggestionRow';
import { SymbolTile } from '../../src/components/symbols/SymbolTile';
import { MulberrySymbol } from '../../src/components/symbols/MulberrySymbol';
import { searchSymbols } from '../../src/features/symbol-brain/symbolSearchService';
import { SearchResult } from '../../src/features/symbol-brain/types';

// Grid sizing — 6 cols, 2 px gap, 4 px side padding inside the safe area.
const GRID_SIDE_PAD = 4;
const GRID_GAP      = 2;
const GRID_COLS     = 6;
const SCREEN_W      = Dimensions.get('window').width;
const CELL_SIZE     = Math.floor(
  (SCREEN_W - GRID_SIDE_PAD * 2 - GRID_GAP * (GRID_COLS - 1)) / GRID_COLS,
);

// ─── Categories (Figma node 86:275 — category_strip) ─────────────────────────
const CATEGORIES = [
  { id: 'main',     label: 'Main' },
  { id: 'actions',  label: 'Actions' },
  { id: 'feelings', label: 'Feelings' },
  { id: 'food',     label: 'Food' },
  { id: 'social',   label: 'Social' },
] as const;

type CategoryId = (typeof CATEGORIES)[number]['id'];

type StableBoardWord = {
  id: string;
  category: CategoryId;
  label: string;
  searchTerm: string;
  color: string;
};

const STABLE_BOARD_WORDS: StableBoardWord[] = [
  { id: 'main-i', category: 'main', label: 'I', searchTerm: 'I', color: symbolColors.pronoun },
  { id: 'main-you', category: 'main', label: 'you', searchTerm: 'you', color: symbolColors.pronoun },
  { id: 'main-want', category: 'main', label: 'want', searchTerm: 'want', color: symbolColors.verb },
  { id: 'main-go', category: 'main', label: 'go', searchTerm: 'go', color: symbolColors.verb },
  { id: 'main-more', category: 'main', label: 'more', searchTerm: 'more', color: symbolColors.adjective },
  { id: 'main-help', category: 'main', label: 'help', searchTerm: 'help', color: symbolColors.social },
  { id: 'main-yes', category: 'main', label: 'yes', searchTerm: 'yes', color: symbolColors.social },
  { id: 'main-no', category: 'main', label: 'no', searchTerm: 'no', color: symbolColors.negation },
  { id: 'main-what', category: 'main', label: 'what', searchTerm: 'what', color: symbolColors.question },
  { id: 'main-where', category: 'main', label: 'where', searchTerm: 'where', color: symbolColors.question },
  { id: 'actions-eat', category: 'actions', label: 'eat', searchTerm: 'eat', color: symbolColors.verb },
  { id: 'actions-drink', category: 'actions', label: 'drink', searchTerm: 'drink', color: symbolColors.verb },
  { id: 'actions-play', category: 'actions', label: 'play', searchTerm: 'play', color: symbolColors.verb },
  { id: 'actions-look', category: 'actions', label: 'look', searchTerm: 'look', color: symbolColors.verb },
  { id: 'actions-walk', category: 'actions', label: 'walk', searchTerm: 'walk', color: symbolColors.verb },
  { id: 'actions-come', category: 'actions', label: 'come', searchTerm: 'come', color: symbolColors.verb },
  { id: 'feelings-happy', category: 'feelings', label: 'happy', searchTerm: 'happy', color: symbolColors.adjective },
  { id: 'feelings-sad', category: 'feelings', label: 'sad', searchTerm: 'sad', color: symbolColors.adjective },
  { id: 'feelings-good', category: 'feelings', label: 'good', searchTerm: 'good', color: symbolColors.adjective },
  { id: 'feelings-bad', category: 'feelings', label: 'bad', searchTerm: 'bad', color: symbolColors.adjective },
  { id: 'feelings-hot', category: 'feelings', label: 'hot', searchTerm: 'hot', color: symbolColors.adjective },
  { id: 'feelings-little', category: 'feelings', label: 'little', searchTerm: 'little', color: symbolColors.adjective },
  { id: 'food-food', category: 'food', label: 'food', searchTerm: 'food', color: symbolColors.noun },
  { id: 'food-water', category: 'food', label: 'water', searchTerm: 'water', color: symbolColors.noun },
  { id: 'food-milk', category: 'food', label: 'milk', searchTerm: 'milk', color: symbolColors.noun },
  { id: 'food-eat', category: 'food', label: 'eat', searchTerm: 'eat', color: symbolColors.verb },
  { id: 'social-hello', category: 'social', label: 'hello', searchTerm: 'hello', color: symbolColors.social },
  { id: 'social-please', category: 'social', label: 'please', searchTerm: 'please', color: symbolColors.social },
  { id: 'social-mum', category: 'social', label: 'mum', searchTerm: 'mum', color: symbolColors.noun },
  { id: 'social-dad', category: 'social', label: 'dad', searchTerm: 'dad', color: symbolColors.noun },
  { id: 'social-who', category: 'social', label: 'who', searchTerm: 'who', color: symbolColors.question },
  { id: 'social-how', category: 'social', label: 'how', searchTerm: 'how', color: symbolColors.question },
];

function StableBoardTile({
  item,
  result,
  onPress,
}: {
  item: StableBoardWord;
  result?: SearchResult | null;
  onPress: () => void;
}) {
  const SymbolGlyph = result
    ? ({ size }: { size?: number }) => (
        <MulberrySymbol symbolId={result.symbol.id} size={size} />
      )
    : undefined;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Say ${item.label}`}
      onPress={onPress}
    >
      <SymbolTile
        label={item.label}
        color={item.color}
        Symbol={SymbolGlyph}
        size={CELL_SIZE}
      />
    </Pressable>
  );
}

export default function TalkScreen() {
  const { state, dispatch } = useAppContext();
  const { speak, lastError, clearError } = useSpeech();
  const [activeCategory, setActiveCategory] = useState<CategoryId>('main');
  const [typedInput, setTypedInput] = useState('');
  const [boardResults, setBoardResults] = useState<Record<string, SearchResult | null>>({});
  const [boardLoading, setBoardLoading] = useState(false);

  // Visual flash when "save phrase" is pressed
  const [savedFlash, setSavedFlash] = useState(false);
  const flashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const wordsText = useMemo(
    () => state.messageWords.map(w => w.label).join(' '),
    [state.messageWords],
  );
  const hasWords = state.messageWords.length > 0;
  const suggestionQuery = hasWords ? '' : typedInput.trim();
  const hasTypedInput = typedInput.length > 0;
  const canBackspace = hasWords || hasTypedInput;
  const currentBoardWords = useMemo(
    () => STABLE_BOARD_WORDS.filter(word => word.category === activeCategory),
    [activeCategory],
  );
  const announce = (msg: string) => AccessibilityInfo.announceForAccessibility(msg);

  useEffect(() => {
    let cancelled = false;
    async function resolveBoard() {
      setBoardLoading(true);
      const unresolved = currentBoardWords.filter(word => boardResults[word.id] === undefined);
      try {
        const entries = await Promise.all(unresolved.map(async (word) => {
          const results = await searchSymbols(word.searchTerm);
          return [word.id, results[0] ?? null] as const;
        }));
        if (!cancelled && entries.length > 0) {
          setBoardResults(prev => ({
            ...prev,
            ...Object.fromEntries(entries),
          }));
        }
      } finally {
        if (!cancelled) setBoardLoading(false);
      }
    }
    resolveBoard();
    return () => {
      cancelled = true;
    };
  }, [currentBoardWords, boardResults]);

  const appendResult = useCallback((result: SearchResult, source: 'board' | 'suggestion') => {
    hapticSelection();
    dispatch({
      type: 'APPEND_WORD',
      payload: {
        id: `${source}-${result.symbol.id}-${Date.now()}`,
        label: result.symbol.display_name,
        wordType: 'core',
        conceptId: result.concept.concept_id,
        symbolId: result.symbol.id,
        source,
      },
    });
    setTypedInput('');
    speak(result.symbol.display_name, { rate: 0.9 });
    announce(`Added ${result.symbol.display_name}`);
  }, [dispatch, speak]);

  const appendBoardWord = useCallback((item: StableBoardWord) => {
    const result = boardResults[item.id];
    hapticSelection();
    dispatch({
      type: 'APPEND_WORD',
      payload: {
        id: `board-${item.id}-${Date.now()}`,
        label: item.label,
        wordType: 'core',
        conceptId: result?.concept.concept_id,
        symbolId: result?.symbol.id,
        source: 'board',
      },
    });
    speak(item.label, { rate: 0.9 });
    announce(`Added ${item.label}`);
  }, [announce, boardResults, dispatch, speak]);

  const handleSpeak = useCallback(() => {
    if (!wordsText.trim()) { announce('No message to speak'); return; }
    hapticSelection();
    speak(wordsText, { rate: 0.9 });
    announce(`Speaking: ${wordsText}`);
  }, [wordsText, speak]);

  const handleBackspace = useCallback(() => {
    if (!canBackspace) return;
    hapticSelection();
    if (hasWords) {
      dispatch({ type: 'REMOVE_LAST_WORD' });
      return;
    }
    setTypedInput(prev => prev.slice(0, -1));
  }, [canBackspace, hasWords, dispatch]);

  const handleClear = useCallback(() => {
    if (!hasWords && !hasTypedInput) return;
    hapticSelection();
    if (hasWords) {
      dispatch({ type: 'CLEAR_WORDS' });
      return;
    }
    setTypedInput('');
  }, [hasWords, hasTypedInput, dispatch]);

  const handleSavePhrase = useCallback(() => {
    if (!hasWords) return;
    hapticSelection();
    setSavedFlash(true);
    if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
    flashTimerRef.current = setTimeout(() => setSavedFlash(false), 1100);
    announce(`Saved phrase: ${wordsText}`);
  }, [hasWords, wordsText]);

  const handleCategoryPress = useCallback((id: CategoryId) => {
    if (id === activeCategory) return;
    hapticSelection();
    setActiveCategory(id);
  }, [activeCategory]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Error banner (only when expo-speech fails) */}
      {lastError ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Dismiss speech error"
          onPress={clearError}
          style={styles.errorBanner}
        >
          <Text style={styles.errorText}>Speech unavailable — {lastError.message}</Text>
        </Pressable>
      ) : null}

      {/* ── Message bar row (card + side panel) ────────────────────── */}
      <View style={styles.messageRow}>
        {/* Message card — "Tap to speak" */}
        <View
          accessibilityLabel={
            hasWords ? `Speak: ${wordsText}` : 'Tap symbols to start a sentence'
          }
          style={styles.messageCard}
        >
          {hasWords ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Speak: ${wordsText}`}
              onPress={handleSpeak}
              style={styles.messageTextWrap}
            >
              <Text style={styles.messageText} numberOfLines={2}>
                {wordsText}
              </Text>
            </Pressable>
          ) : (
            <TextInput
              accessibilityLabel="Type to search local Mulberry symbols"
              value={typedInput}
              onChangeText={setTypedInput}
              placeholder="Tap to speak...."
              placeholderTextColor={colors.textTertiary}
              autoCapitalize="none"
              autoCorrect
              returnKeyType="search"
              style={[styles.messageText, styles.messageInput]}
            />
          )}

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Remove last word"
            accessibilityHint="Long press to clear all words"
            onPress={handleBackspace}
            onLongPress={handleClear}
            disabled={!canBackspace}
            hitSlop={8}
            style={[styles.backspaceBtn, !canBackspace && styles.dim]}
          >
            <BackspaceIcon size={45} />
          </Pressable>
        </View>

        {/* Side panel — red trash + green save */}
        <View style={styles.sidePanel}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Clear all words"
            onPress={handleClear}
            disabled={!hasWords && !hasTypedInput}
            style={[styles.sideIconBtn, !hasWords && !hasTypedInput && styles.dim]}
          >
            <TrashButtonIcon size={39} />
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={savedFlash ? 'Phrase saved' : 'Save phrase'}
            onPress={handleSavePhrase}
            disabled={!hasWords}
            style={[
              styles.sideIconBtn,
              !hasWords && styles.dim,
              savedFlash && styles.savedFlash,
            ]}
          >
            <SaveButtonIcon size={40} />
          </Pressable>
        </View>
      </View>

      <SymbolSuggestionRow
        query={suggestionQuery}
        onSelect={(result) => appendResult(result, 'suggestion')}
      />

      {/* ── Category strip (Figma node 86:275) ──────────────────────── */}
      <View style={[styles.categoryStrip, suggestionQuery ? styles.categoryStripWithSuggestions : null]}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.pillRow}
        >
          {CATEGORIES.map(cat => {
            const active = cat.id === activeCategory;
            return (
              <Pressable
                key={cat.id}
                accessibilityRole="button"
                accessibilityLabel={`${cat.label} board`}
                accessibilityState={{ selected: active }}
                onPress={() => handleCategoryPress(cat.id)}
                style={[
                  styles.pill,
                  { backgroundColor: active ? colors.primaryDark : colors.primary },
                ]}
              >
                <Text style={styles.pillLabel}>{cat.label}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Dense symbol grid — 6 cols, 2 px gaps, edge-to-edge in safe area */}
      <ScrollView
        contentContainerStyle={styles.symbolGrid}
        showsVerticalScrollIndicator={false}
      >
        {currentBoardWords.map(word => (
          <StableBoardTile
            key={word.id}
            item={word}
            result={boardResults[word.id]}
            onPress={() => appendBoardWord(word)}
          />
        ))}
        {boardLoading ? (
          <Text style={styles.boardLoadingText}>Loading local symbols...</Text>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },

  errorBanner: {
    backgroundColor: colors.danger,
    marginHorizontal: spacing.lg,
    marginTop: spacing.sm,
    borderRadius: radii.button,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  errorText: {
    color: '#FFFFFF',
    fontSize: typography.caption,
    fontWeight: '700',
    textAlign: 'center',
  },

  // ── Message row (card 295×120 + side panel 54×120, gap 11)
  messageRow: {
    flexDirection: 'row',
    height: 120,
    marginTop: 9,          // 68 (Figma) − ~59 (iPhone 16 safe area)
    marginLeft: 19,
    marginRight: 19,
    gap: 6,                 // 320.15 − (19.15 + 295) = 6
  },

  // ── Message card
  messageCard: {
    width: 295,
    height: 120,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 10,
    paddingLeft: 8,         // 27.15 − 19.15
    paddingRight: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  messageText: {
    flex: 1,
    fontSize: 17,
    fontWeight: '500',
    color: colors.text,
    lineHeight: 22,
  },
  messageTextWrap: {
    flex: 1,
  },
  messageInput: {
    minHeight: 80,
    padding: 0,
  },
  messagePlaceholder: {
    color: colors.textTertiary,
    fontWeight: '400',
  },
  backspaceBtn: {
    width: 45,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 4,
  },

  // ── Side panel (54×120 white box with 2 icons)
  sidePanel: {
    width: 54,
    height: 120,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 10,
    alignItems: 'center',
    paddingTop: 12,         // 81 − 68 ≈ 13, rounded
    paddingBottom: 12,
    justifyContent: 'space-between',
  },
  sideIconBtn: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  savedFlash: {
    opacity: 0.7,
  },
  dim: { opacity: 0.4 },

  // ── Category strip (393×57 full-width white bar with hairlines)
  categoryStrip: {
    marginTop: 51,          // 239 − (68 + 120) = 51
    height: 57,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
  },
  categoryStripWithSuggestions: {
    marginTop: 8,
  },
  pillRow: {
    paddingHorizontal: 15,
    gap: 15,
    alignItems: 'center',
  },
  pill: {
    width: 60,
    height: 33,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: 0.1,
  },

  symbolGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: GRID_SIDE_PAD,
    paddingTop: 6,
    paddingBottom: 8,
    gap: GRID_GAP,
  },
  boardLoadingText: {
    width: '100%',
    padding: spacing.md,
    color: colors.textMuted,
    fontSize: typography.caption,
  },
});
