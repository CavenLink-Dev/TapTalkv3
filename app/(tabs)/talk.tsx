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

import React, { useCallback, useRef, useState, useMemo } from 'react';
import {
  AccessibilityInfo,
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
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
import { SymbolTile } from '../../src/components/symbols/SymbolTile';
import {
  MulberrySymbol,
  hasMulberrySymbol,
} from '../../src/components/symbols/MulberrySymbol';

// ─── Demo symbols — Mulberry pictograms on Fitzgerald-key tiles ─────────────
// Mulberry ships strong noun/verb illustrations; pronouns and function words
// (`you`, `yes`, `no`, `please`, `the`) get text-only tiles for now.
const DEMO_SYMBOLS: { label: string; color: string; mulberry?: string }[] = [
  { label: 'I',     color: symbolColors.pronoun,      mulberry: 'i'     },
  { label: 'you',   color: symbolColors.pronoun                          },
  { label: 'want',  color: symbolColors.verb,         mulberry: 'want'  },
  { label: 'go',    color: symbolColors.verb,         mulberry: 'go'    },
  { label: 'come',  color: symbolColors.verb,         mulberry: 'come'  },
  { label: 'help',  color: symbolColors.social,       mulberry: 'help'  },
  { label: 'more',  color: symbolColors.adjective,    mulberry: 'more'  },
  { label: 'food',  color: symbolColors.noun,         mulberry: 'food'  },
  { label: 'eat',   color: symbolColors.verb,         mulberry: 'eat'   },
  { label: 'drink', color: symbolColors.verb,         mulberry: 'drink' },
  { label: 'play',  color: symbolColors.verb,         mulberry: 'play'  },
  { label: 'look',  color: symbolColors.verb,         mulberry: 'look'  },
  { label: 'walk',  color: symbolColors.verb,         mulberry: 'walk'  },
  { label: 'good',  color: symbolColors.adjective,    mulberry: 'good'  },
  { label: 'bad',   color: symbolColors.adjective,    mulberry: 'bad'   },
  { label: 'hot',   color: symbolColors.adjective,    mulberry: 'hot'   },
  { label: 'little',color: symbolColors.adjective,    mulberry: 'little'},
  { label: 'happy', color: symbolColors.adjective,    mulberry: 'happy' },
  { label: 'sad',   color: symbolColors.adjective,    mulberry: 'sad'   },
  { label: 'mum',   color: symbolColors.noun,         mulberry: 'mum'   },
  { label: 'dad',   color: symbolColors.noun,         mulberry: 'dad'   },
  { label: 'milk',  color: symbolColors.noun,         mulberry: 'milk'  },
  { label: 'water', color: symbolColors.noun,         mulberry: 'water' },
  { label: 'hello', color: symbolColors.social,       mulberry: 'hello' },
  { label: 'what',  color: symbolColors.question,     mulberry: 'what'  },
  { label: 'where', color: symbolColors.question,     mulberry: 'where' },
  { label: 'who',   color: symbolColors.question,     mulberry: 'who'   },
  { label: 'why',   color: symbolColors.question,     mulberry: 'why'   },
  { label: 'how',   color: symbolColors.question,     mulberry: 'how'   },
  { label: 'yes',   color: symbolColors.social                          },
  { label: 'no',    color: symbolColors.negation                        },
  { label: 'please',color: symbolColors.social                          },
];

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

export default function TalkScreen() {
  const { state, dispatch } = useAppContext();
  const { speak, lastError, clearError } = useSpeech();
  const [activeCategory, setActiveCategory] = useState<CategoryId>('main');

  // Visual flash when "save phrase" is pressed
  const [savedFlash, setSavedFlash] = useState(false);
  const flashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const wordsText = useMemo(
    () => state.messageWords.map(w => w.label).join(' '),
    [state.messageWords],
  );
  const hasWords = state.messageWords.length > 0;
  const announce = (msg: string) => AccessibilityInfo.announceForAccessibility(msg);

  const handleSpeak = useCallback(() => {
    if (!wordsText.trim()) { announce('No message to speak'); return; }
    hapticSelection();
    speak(wordsText, { rate: 0.9 });
    announce(`Speaking: ${wordsText}`);
  }, [wordsText, speak]);

  const handleBackspace = useCallback(() => {
    if (!hasWords) return;
    hapticSelection();
    dispatch({ type: 'REMOVE_LAST_WORD' });
  }, [hasWords, dispatch]);

  const handleClear = useCallback(() => {
    if (!hasWords) return;
    hapticSelection();
    dispatch({ type: 'CLEAR_WORDS' });
  }, [hasWords, dispatch]);

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
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={
            hasWords ? `Speak: ${wordsText}` : 'Tap symbols to start a sentence'
          }
          onPress={handleSpeak}
          style={styles.messageCard}
        >
          <Text
            style={[styles.messageText, !hasWords && styles.messagePlaceholder]}
            numberOfLines={2}
          >
            {hasWords ? wordsText : 'Tap to speak....'}
          </Text>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Remove last word"
            accessibilityHint="Long press to clear all words"
            onPress={handleBackspace}
            onLongPress={handleClear}
            disabled={!hasWords}
            hitSlop={8}
            style={[styles.backspaceBtn, !hasWords && styles.dim]}
          >
            <BackspaceIcon size={45} />
          </Pressable>
        </Pressable>

        {/* Side panel — red trash + green save */}
        <View style={styles.sidePanel}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Clear all words"
            onPress={handleClear}
            disabled={!hasWords}
            style={[styles.sideIconBtn, !hasWords && styles.dim]}
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

      {/* ── Category strip (Figma node 86:275) ──────────────────────── */}
      <View style={styles.categoryStrip}>
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
        {DEMO_SYMBOLS.map(sym => {
          const SymbolGlyph =
            sym.mulberry && hasMulberrySymbol(sym.mulberry)
              ? ({ size }: { size?: number }) => (
                  <MulberrySymbol name={sym.mulberry!} size={size} />
                )
              : undefined;
          return (
            <SymbolTile
              key={sym.label}
              label={sym.label}
              color={sym.color}
              Symbol={SymbolGlyph}
              size={CELL_SIZE}
            />
          );
        })}
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
});
