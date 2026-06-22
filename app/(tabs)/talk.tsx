import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import {
  AccessibilityInfo,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  withRepeat,
  FadeIn,
  runOnJS,
} from 'react-native-reanimated';
import { useAppContext } from '../../src/hooks/useAppContext';
import { hapticSelection } from '../../src/utils/haptics';
import { useSpeech } from '../../src/hooks/useSpeech';
import { MascotImage, MascotKey } from '../../src/components/MascotImage';
import { colors, symbolColors, radii } from '../../src/theme/tokens';

// ─── Design tokens — sourced from tokens.ts (Figma Mode 1 variables) ─────────
const BG      = colors.background;   // main_background_colour
const SURFACE = colors.surface;      // secondary_main_background_white
const BORDER  = colors.border;       // outline_stroke_rarely_used

/** Word-type colour palette from symbolColors token */
const WC = symbolColors;

const PILL_ACTIVE   = colors.primaryDark;    // button_selected
const PILL_INACTIVE = colors.primary;        // button_main_and_progress_bar_filler
const PILL_W        = 60;
const PILL_H        = 33;
const PILL_GAP      = 15;
const CELL          = 64;
const CELL_GAP      = 6;
const CELL_RADIUS   = 5;
const CELL_BORDER   = colors.symbolOutline;  // outline_black_symbol_folder
// Horizontal padding so 5 columns fit exactly: (393 - (5×64 + 4×6)) / 2 ≈ 24
const GRID_PADDING  = 24;

// ─── Types ────────────────────────────────────────────────────────────────────
type Category = 'Home';
type CellKind = 'word' | 'folder' | 'article' | 'question';

interface AACSymbol {
  id:     string;
  label:  string;
  symbol: string;
  bg:     string;
  kind:   CellKind;
}

// ─── Board data — blank starter: one folder (first) + one symbol (last) ──────
const BOARDS: Record<Category, AACSymbol[]> = {
  Home: [
    { id: 'folder-1', label: 'Folder', symbol: '', bg: WC.folder, kind: 'folder' },
    { id: 'symbol-1', label: 'Symbol', symbol: '', bg: WC.noun,   kind: 'word'   },
  ],
};

const CATEGORIES: Category[] = ['Home'];

// ─── Mascot emotion logic ─────────────────────────────────────────────────────
function getMascotEmotion(wordCount: number): MascotKey {
  if (wordCount === 0) return 'neutral_curious';
  if (wordCount === 1) return 'happy_smile';
  if (wordCount === 2) return 'happy_grin';
  return 'excited_tongue';
}

// ─── Animated symbol cell ─────────────────────────────────────────────────────
function SymbolCell({
  item,
  onPress,
}: {
  item: AACSymbol;
  onPress: () => void;
}) {
  const pressScale = useSharedValue(1);

  const cellAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pressScale.value }],
  }));

  return (
    <Animated.View style={[styles.cellWrapper, cellAnimStyle]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={
          item.kind === 'folder' ? `Open ${item.label} folder` : `Say ${item.label}`
        }
        onPressIn={() => {
          pressScale.value = withSpring(0.87, { damping: 12, stiffness: 450 });
        }}
        onPressOut={() => {
          pressScale.value = withSpring(1.0, { damping: 8, stiffness: 300 });
        }}
        onPress={onPress}
        style={[styles.cell, { backgroundColor: item.bg }]}
      >
        {/* Folder: dark flap banner at top with label, emoji at bottom */}
        {item.kind === 'folder' && (
          <>
            <View style={styles.folderFlap}>
              <Text style={styles.folderFlapLabel}>{item.label}</Text>
            </View>
            <View style={styles.folderIconArea}>
              <Text style={styles.cellEmoji}>{item.symbol}</Text>
            </View>
          </>
        )}

        {/* Article (The): large white bold centred text */}
        {item.kind === 'article' && (
          <View style={styles.centreBox}>
            <Text style={styles.articleText}>{item.label}</Text>
          </View>
        )}

        {/* Question (Where): small label top + large "?" below */}
        {item.kind === 'question' && (
          <>
            <Text style={styles.cellLabel}>{item.label}</Text>
            <Text style={styles.questionMark}>{item.symbol}</Text>
          </>
        )}

        {/* Standard word: small label top + emoji below */}
        {item.kind === 'word' && (
          <>
            <Text style={styles.cellLabel}>{item.label}</Text>
            <Text style={styles.cellEmoji}>{item.symbol}</Text>
          </>
        )}
      </Pressable>
    </Animated.View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function TalkScreen() {
  const { state, dispatch } = useAppContext();
  const { speak, lastError, clearError } = useSpeech();
  const [activeCategory, setActiveCategory] = useState<Category>('Home');
  const [mascotEmotion, setMascotEmotion] = useState<MascotKey>('neutral_curious');
  const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const wordsText = useMemo(
    () => state.messageWords.map(w => w.label).join(' '),
    [state.messageWords],
  );
  const hasWords = state.messageWords.length > 0;

  const announce = (msg: string) => AccessibilityInfo.announceForAccessibility(msg);

  // ── Mascot animation shared values
  const mascotFloatY  = useSharedValue(0);
  const mascotBounceY = useSharedValue(0);
  const mascotScale   = useSharedValue(1);
  const mascotRotate  = useSharedValue(0);
  const mascotOpacity = useSharedValue(1);

  const mascotAnimStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: mascotFloatY.value + mascotBounceY.value },
      { scale:      mascotScale.value },
      { rotate:     `${mascotRotate.value}rad` },
    ],
    opacity: mascotOpacity.value,
  }));

  // Gentle idle float — starts on mount, interrupted by any reaction
  useEffect(() => {
    mascotFloatY.value = withRepeat(
      withSequence(
        withTiming(-5, { duration: 1400 }),
        withTiming(0,  { duration: 1400 }),
      ),
      -1,
      false,
    );
    return () => {
      if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Schedule a return to neutral after a reaction
  const scheduleNeutral = useCallback((delay = 1500) => {
    if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
    resetTimerRef.current = setTimeout(() => {
      setMascotEmotion('neutral_curious');
      resetTimerRef.current = null;
    }, delay);
  }, []);

  // Change mascot emotion with crossfade + physical animation
  const changeMascot = useCallback(
    (emotion: MascotKey, anim: 'bounce' | 'shake' | 'jump' | 'spin') => {
      // Crossfade: dip opacity → swap image → restore opacity
      mascotOpacity.value = withTiming(0, { duration: 100 }, (done) => {
        if (done) {
          runOnJS(setMascotEmotion)(emotion);
          mascotOpacity.value = withTiming(1, { duration: 150 });
        }
      });

      // Physical reaction
      switch (anim) {
        case 'bounce':
          // Happy bounce up and back
          mascotBounceY.value = withSequence(
            withSpring(-14, { damping: 5,  stiffness: 320 }),
            withSpring(0,   { damping: 7,  stiffness: 250 }),
          );
          mascotScale.value = withSequence(
            withSpring(1.2, { damping: 5,  stiffness: 320 }),
            withSpring(1.0, { damping: 7 }),
          );
          break;

        case 'shake':
          // Sad/surprised wiggle
          mascotRotate.value = withSequence(
            withTiming(-0.25, { duration: 65 }),
            withTiming( 0.25, { duration: 65 }),
            withTiming(-0.18, { duration: 65 }),
            withTiming( 0.12, { duration: 65 }),
            withTiming(0,     { duration: 65 }),
          );
          break;

        case 'jump':
          // Excited big leap (speak)
          mascotBounceY.value = withSequence(
            withSpring(-22, { damping: 4, stiffness: 350 }),
            withSpring(0,   { damping: 5, stiffness: 250 }),
          );
          mascotScale.value = withSequence(
            withSpring(1.3, { damping: 4, stiffness: 350 }),
            withSpring(1.0, { damping: 6 }),
          );
          break;

        case 'spin':
          // Curious head-tilt (folder / category switch)
          mascotRotate.value = withSequence(
            withTiming(-0.3, { duration: 100 }),
            withTiming( 0.3, { duration: 100 }),
            withTiming(0,    { duration: 100 }),
          );
          mascotScale.value = withSequence(
            withSpring(1.15, { damping: 6, stiffness: 300 }),
            withSpring(1.0,  { damping: 7 }),
          );
          break;
      }
    },
    [mascotOpacity, mascotBounceY, mascotScale, mascotRotate],
  );

  // ── Interaction handlers ──────────────────────────────────────────────────
  const handleSymbolPress = useCallback((item: AACSymbol) => {
    hapticSelection();
    if (item.kind === 'folder') {
      changeMascot('thinking_puzzled', 'spin');
      scheduleNeutral(1200);
      announce(`Opened ${item.label} folder`);
      return;
    }
    dispatch({
      type: 'APPEND_WORD',
      payload: {
        id:       `${item.id}-${Date.now()}`,
        label:    item.label,
        wordType: 'core',
        emoji:    item.symbol,
      },
    });
    speak(item.label, { rate: 0.9 });
    const nextCount = state.messageWords.length + 1;
    changeMascot(getMascotEmotion(nextCount), 'bounce');
    announce(`Added ${item.label}`);
  }, [dispatch, speak, state.messageWords.length, changeMascot, scheduleNeutral]);

  const handleSpeak = useCallback(() => {
    if (!wordsText.trim()) { announce('No message to speak'); return; }
    hapticSelection();
    speak(wordsText, { rate: 0.9 });
    changeMascot('excited_sparkle', 'jump');
    scheduleNeutral(2500);
    announce(`Speaking: ${wordsText}`);
  }, [wordsText, speak, changeMascot, scheduleNeutral]);

  const handleBackspace = useCallback(() => {
    if (!hasWords) return;
    hapticSelection();
    dispatch({ type: 'REMOVE_LAST_WORD' });
    const nextCount = Math.max(0, state.messageWords.length - 1);
    changeMascot(
      nextCount === 0 ? 'sad_worried' : getMascotEmotion(nextCount),
      'shake',
    );
    scheduleNeutral();
    announce('Removed last word');
  }, [hasWords, dispatch, state.messageWords.length, changeMascot, scheduleNeutral]);

  const handleClear = useCallback(() => {
    if (!hasWords) return;
    hapticSelection();
    dispatch({ type: 'CLEAR_WORDS' });
    changeMascot('shocked', 'shake');
    scheduleNeutral();
    announce('Cleared message');
  }, [hasWords, dispatch, changeMascot, scheduleNeutral]);

  const handleCategorySwitch = useCallback((cat: Category) => {
    hapticSelection();
    setActiveCategory(cat);
    changeMascot('thinking_puzzled', 'spin');
    scheduleNeutral(1000);
  }, [changeMascot, scheduleNeutral]);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>

      {/* ── Speech error banner ─────────────────────────────────────── */}
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

      {/* ── Message strip ───────────────────────────────────────────── */}
      <View style={styles.messageRow}>
        {/* Main card — tap anywhere to speak */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={
            hasWords
              ? `Speak: ${wordsText}`
              : 'Message strip empty. Tap a symbol to build a sentence.'
          }
          onPress={handleSpeak}
          style={styles.messageCard}
        >
          {/* Top: mascot + message text */}
          <View style={styles.messageContent}>
            <Animated.View style={mascotAnimStyle}>
              <MascotImage mascot={mascotEmotion} size={52} />
            </Animated.View>
            <Text
              style={[styles.messageText, !hasWords && styles.messagePlaceholder]}
              numberOfLines={3}
            >
              {hasWords ? wordsText : 'Tap to speak....'}
            </Text>
          </View>

          {/* Bottom-right: backspace (long press = clear all) */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Remove last word"
            accessibilityHint="Long press to clear all words"
            onPress={handleBackspace}
            onLongPress={handleClear}
            disabled={!hasWords}
            style={[styles.backspaceBtn, !hasWords && styles.dim]}
          >
            <Ionicons name="backspace-outline" size={22} color={colors.danger} />
          </Pressable>
        </Pressable>

        {/* Side panel: trash + speak */}
        <View style={styles.sidePanel}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Clear all words"
            onPress={handleClear}
            disabled={!hasWords}
            style={[styles.sideBtn, styles.sideBtnRed, !hasWords && styles.dim]}
          >
            <Ionicons name="trash-outline" size={20} color="#fff" />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Speak full message"
            onPress={handleSpeak}
            disabled={!hasWords}
            style={[styles.sideBtn, styles.sideBtnGreen, !hasWords && styles.dim]}
          >
            <Ionicons name="volume-high-outline" size={20} color="#fff" />
          </Pressable>
        </View>
      </View>

      {/* ── Category strip — hidden when only one category ─────────── */}
      {CATEGORIES.length > 1 && (
        <View style={styles.categoryBar}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryScroll}
          >
            {CATEGORIES.map(cat => (
              <Pressable
                key={cat}
                accessibilityRole="button"
                accessibilityLabel={`${cat} board`}
                accessibilityState={{ selected: activeCategory === cat }}
                onPress={() => handleCategorySwitch(cat)}
                style={[styles.pill, activeCategory === cat && styles.pillActive]}
              >
                <Text style={styles.pillLabel}>{cat}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      )}

      {/* ── Symbol grid — key remount triggers FadeIn on every category switch ── */}
      <Animated.View
        key={activeCategory}
        entering={FadeIn.duration(220)}
        style={styles.gridWrapper}
      >
        <ScrollView
          contentContainerStyle={styles.grid}
          showsVerticalScrollIndicator={false}
        >
          {BOARDS[activeCategory].map(item => (
            <SymbolCell
              key={item.id}
              item={item}
              onPress={() => handleSymbolPress(item)}
            />
          ))}
        </ScrollView>
      </Animated.View>

    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: BG,
  },

  // ── Error banner
  errorBanner: {
    backgroundColor: colors.danger,
    marginHorizontal: 19,
    marginTop: 8,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  errorText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },

  // ── Message strip
  messageRow: {
    flexDirection: 'row',
    marginHorizontal: 19,
    marginTop: 16,
    gap: 6,
    height: 120,
  },
  messageCard: {
    flex: 1,
    backgroundColor: SURFACE,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 10,
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  messageContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  messageText: {
    flex: 1,
    fontSize: 17,
    fontWeight: '500',
    color: '#202020',
  },
  messagePlaceholder: {
    color: BORDER,
    fontStyle: 'italic',
  },
  backspaceBtn: {
    alignSelf: 'flex-end',
    width: 36,
    height: 36,
    borderRadius: radii.button,
    backgroundColor: '#ffeaea',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Side panel
  sidePanel: {
    width: 54,
    backgroundColor: SURFACE,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: 'center',
    justifyContent: 'space-evenly',
    paddingVertical: 10,
  },
  sideBtn: {
    width: 38,
    height: 38,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sideBtnRed:   { backgroundColor: colors.danger },
  sideBtnGreen: { backgroundColor: colors.success },
  dim: { opacity: 0.35 },

  // ── Category strip
  categoryBar: {
    backgroundColor: SURFACE,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: BORDER,
    height: 57,
    marginTop: 14,
    justifyContent: 'center',
  },
  categoryScroll: {
    paddingHorizontal: 16,
    gap: PILL_GAP,
    alignItems: 'center',
  },
  pill: {
    width: PILL_W,
    height: PILL_H,
    borderRadius: radii.pill,  // pill_shaped_corner_radius = 22
    backgroundColor: PILL_INACTIVE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillActive: {
    backgroundColor: PILL_ACTIVE,
  },
  pillLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#ffffff',
  },

  // ── Symbol grid
  gridWrapper: {
    flex: 1,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: CELL_GAP,
    paddingHorizontal: GRID_PADDING,
    paddingTop: 12,
    paddingBottom: 32,
  },

  // ── Cells
  cellWrapper: {
    // Animated.View wrapper — same footprint as the cell
    width: CELL,
    height: CELL,
  },
  cell: {
    width: CELL,
    height: CELL,
    borderRadius: CELL_RADIUS,
    borderWidth: 0.5,
    borderColor: CELL_BORDER,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 4,
    paddingBottom: 4,
    paddingHorizontal: 2,
  },
  cellLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#000000',
    textAlign: 'center',
  },
  cellEmoji: {
    fontSize: 26,
    textAlign: 'center',
  },

  // article — "The" (large white bold centred)
  centreBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  articleText: {
    fontSize: 24,
    fontWeight: '800',
    color: '#ffffff',
    textAlign: 'center',
  },

  // question — "Where ?"
  questionMark: {
    fontSize: 30,
    fontWeight: '900',
    color: '#ffffff',
    textAlign: 'center',
    lineHeight: 32,
  },

  // folder — dark flap + label + emoji below
  folderFlap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 26,
    backgroundColor: colors.folderFlap,  // folder_flap_fill_white = rgba(255,255,255,0.81)
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  folderFlapLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#000000',
    textAlign: 'center',
  },
  folderIconArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 4,
    paddingTop: 26,
  },
});
