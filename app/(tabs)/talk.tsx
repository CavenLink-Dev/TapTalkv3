<<<<<<< HEAD
import React, { useMemo, useState } from 'react';
import {
  AccessibilityInfo,
  Dimensions,
  Image,
=======
import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import {
  AccessibilityInfo,
>>>>>>> 514eba5ddd02193247c70cf5a0bb1c6af498f74d
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
<<<<<<< HEAD
import { useSafeAreaInsets } from 'react-native-safe-area-context';
=======
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
>>>>>>> 514eba5ddd02193247c70cf5a0bb1c6af498f74d
import { useAppContext } from '../../src/hooks/useAppContext';
import { hapticSelection } from '../../src/utils/haptics';
import { useSpeech } from '../../src/hooks/useSpeech';
import { MascotImage, MascotKey } from '../../src/components/MascotImage';
import { colors, symbolColors, radii } from '../../src/theme/tokens';

<<<<<<< HEAD
// ─── Layout constants ────────────────────────────────────────────────────────
const SCREEN_WIDTH = Dimensions.get('window').width;
const H_PAD = 12;
const CARD_GAP = 6;
const COLS = 5;
const CARD_SIZE = Math.floor(
  (SCREEN_WIDTH - H_PAD * 2 - CARD_GAP * (COLS - 1)) / COLS,
);

// ─── Types ───────────────────────────────────────────────────────────────────
type CategoryId = 'main' | 'actions' | 'feelings' | 'food' | 'social';

interface WordCard {
  id: string;
  label: string;
  category: CategoryId | 'main';
  image: ReturnType<typeof require>;
}

// ─── Assets ──────────────────────────────────────────────────────────────────
const CAT_IMAGES: Record<CategoryId, ReturnType<typeof require>> = {
  main: require('../../assets/aac/cat_main.png'),
  actions: require('../../assets/aac/cat_actions.png'),
  feelings: require('../../assets/aac/cat_feelings.png'),
  food: require('../../assets/aac/cat_food.png'),
  social: require('../../assets/aac/cat_social.png'),
};

const CATEGORIES: { id: CategoryId; label: string }[] = [
  { id: 'main', label: 'Main' },
  { id: 'actions', label: 'Actions' },
  { id: 'feelings', label: 'Feelings' },
  { id: 'food', label: 'Food' },
  { id: 'social', label: 'Social' },
];

// "Main" tab shows all cards; other tabs filter to their category
const ALL_CARDS: WordCard[] = [
  {
    id: 'hello',
    label: 'Hello',
    category: 'main',
    image: require('../../assets/aac/card_hello.png'),
  },
  {
    id: 'car',
    label: 'Car',
    category: 'main',
    image: require('../../assets/aac/card_car.png'),
  },
  {
    id: 'him',
    label: 'Him',
    category: 'main',
    image: require('../../assets/aac/card_him.png'),
  },
  {
    id: 'run',
    label: 'Run',
    category: 'actions',
    image: require('../../assets/aac/card_run.png'),
  },
  {
    id: 'big',
    label: 'Big',
    category: 'main',
    image: require('../../assets/aac/card_big.png'),
  },
  {
    id: 'where',
    label: 'Where',
    category: 'main',
    image: require('../../assets/aac/card_where.png'),
  },
  {
    id: 'please',
    label: 'Please',
    category: 'main',
    image: require('../../assets/aac/card_please.png'),
  },
  {
    id: 'the',
    label: 'The',
    category: 'main',
    image: require('../../assets/aac/card_the.png'),
  },
  {
    id: 'ouch',
    label: 'Ouch',
    category: 'feelings',
    image: require('../../assets/aac/card_ouch.png'),
  },
  {
    id: 'places',
    label: 'Places',
    category: 'main',
    image: require('../../assets/aac/card_places.png'),
  },
  {
    id: 'sports',
    label: 'Sports',
    category: 'main',
    image: require('../../assets/aac/card_sports.png'),
  },
];

// ─── Screen component ────────────────────────────────────────────────────────
export default function BoardScreen() {
  const { state, dispatch } = useAppContext();
  const { speak, lastError: speechError, clearError: clearSpeechError } =
    useSpeech();
  const [category, setCategory] = useState<CategoryId>('main');
  const insets = useSafeAreaInsets();

  const wordsText = useMemo(
    () => state.messageWords.map((w) => w.label).join(' '),
=======
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
type Category = 'Main' | 'Actions' | 'Feelings' | 'Food' | 'Social';
type CellKind = 'word' | 'folder' | 'article' | 'question';

interface AACSymbol {
  id:     string;
  label:  string;
  symbol: string; // emoji placeholder until ARASAAC symbols are loaded
  bg:     string;
  kind:   CellKind;
}

// ─── Board data ───────────────────────────────────────────────────────────────
const BOARDS: Record<Category, AACSymbol[]> = {
  Main: [
    { id: 'hello',  label: 'Hello',  symbol: '👋', bg: WC.conjunction,  kind: 'word'     },
    { id: 'car',    label: 'Car',    symbol: '🚗', bg: WC.noun,         kind: 'word'     },
    { id: 'him',    label: 'Him',    symbol: '👦', bg: WC.pronoun,      kind: 'word'     },
    { id: 'run',    label: 'Run',    symbol: '🏃', bg: WC.verb,         kind: 'word'     },
    { id: 'big',    label: 'Big',    symbol: '📦', bg: WC.adjective,    kind: 'word'     },
    { id: 'where',  label: 'Where',  symbol: '?',  bg: WC.question,     kind: 'question' },
    { id: 'please', label: 'Please', symbol: '🙏', bg: WC.social,       kind: 'word'     },
    { id: 'the',    label: 'The',    symbol: '',   bg: WC.article,      kind: 'article'  },
    { id: 'ouch',   label: 'Ouch',   symbol: '😖', bg: WC.interjection, kind: 'word'     },
    { id: 'places', label: 'Places', symbol: '📍', bg: WC.noun,         kind: 'word'     },
    { id: 'sports', label: 'Sports', symbol: '⚽', bg: WC.noun,         kind: 'word'     },
  ],
  Actions: [
    { id: 'eat',   label: 'Eat',   symbol: '🍽️', bg: WC.verb,         kind: 'word' },
    { id: 'drink', label: 'Drink', symbol: '🥤',  bg: WC.verb,         kind: 'word' },
    { id: 'go',    label: 'Go',    symbol: '🚶',  bg: WC.verb,         kind: 'word' },
    { id: 'stop',  label: 'Stop',  symbol: '✋',  bg: WC.interjection, kind: 'word' },
    { id: 'help',  label: 'Help',  symbol: '🤝',  bg: WC.social,       kind: 'word' },
    { id: 'want',  label: 'Want',  symbol: '🙋',  bg: WC.verb,         kind: 'word' },
    { id: 'play',  label: 'Play',  symbol: '🎮',  bg: WC.noun,         kind: 'word' },
    { id: 'sleep', label: 'Sleep', symbol: '😴',  bg: WC.adjective,    kind: 'word' },
    { id: 'sit',   label: 'Sit',   symbol: '🪑',  bg: WC.verb,         kind: 'word' },
    { id: 'walk',  label: 'Walk',  symbol: '🚶',  bg: WC.verb,         kind: 'word' },
  ],
  Feelings: [
    { id: 'happy',   label: 'Happy',   symbol: '😊', bg: WC.adjective,    kind: 'word' },
    { id: 'sad',     label: 'Sad',     symbol: '😢', bg: WC.adjective,    kind: 'word' },
    { id: 'angry',   label: 'Angry',   symbol: '😠', bg: WC.interjection, kind: 'word' },
    { id: 'scared',  label: 'Scared',  symbol: '😨', bg: WC.question,     kind: 'word' },
    { id: 'tired',   label: 'Tired',   symbol: '😴', bg: WC.adjective,    kind: 'word' },
    { id: 'excited', label: 'Excited', symbol: '🤩', bg: WC.pronoun,      kind: 'word' },
    { id: 'love',    label: 'Love',    symbol: '❤️', bg: WC.conjunction,  kind: 'word' },
    { id: 'sick',    label: 'Sick',    symbol: '🤒', bg: WC.noun,         kind: 'word' },
    { id: 'pain',    label: 'Pain',    symbol: '🤕', bg: WC.interjection, kind: 'word' },
    { id: 'calm',    label: 'Calm',    symbol: '😌', bg: WC.adjective,    kind: 'word' },
  ],
  Food: [
    { id: 'apple',  label: 'Apple',  symbol: '🍎', bg: WC.noun, kind: 'word' },
    { id: 'banana', label: 'Banana', symbol: '🍌', bg: WC.noun, kind: 'word' },
    { id: 'pizza',  label: 'Pizza',  symbol: '🍕', bg: WC.noun, kind: 'word' },
    { id: 'water',  label: 'Water',  symbol: '💧', bg: WC.noun, kind: 'word' },
    { id: 'milk',   label: 'Milk',   symbol: '🥛', bg: WC.noun, kind: 'word' },
    { id: 'cookie', label: 'Cookie', symbol: '🍪', bg: WC.noun, kind: 'word' },
    { id: 'juice',  label: 'Juice',  symbol: '🍊', bg: WC.noun, kind: 'word' },
    { id: 'bread',  label: 'Bread',  symbol: '🍞', bg: WC.noun, kind: 'word' },
    { id: 'cheese', label: 'Cheese', symbol: '🧀', bg: WC.noun, kind: 'word' },
    { id: 'chips',  label: 'Chips',  symbol: '🍟', bg: WC.noun, kind: 'word' },
  ],
  Social: [
    { id: 'yes',      label: 'Yes',       symbol: '✅', bg: WC.verb,         kind: 'word' },
    { id: 'no',       label: 'No',        symbol: '❌', bg: WC.interjection, kind: 'word' },
    { id: 'thankyou', label: 'Thank You', symbol: '🙏', bg: WC.social,       kind: 'word' },
    { id: 'sorry',    label: 'Sorry',     symbol: '😔', bg: WC.conjunction,  kind: 'word' },
    { id: 'ok',       label: 'OK',        symbol: '👌', bg: WC.verb,         kind: 'word' },
    { id: 'bye',      label: 'Bye',       symbol: '👋', bg: WC.conjunction,  kind: 'word' },
    { id: 'hi',       label: 'Hi',        symbol: '😁', bg: WC.social,       kind: 'word' },
    { id: 'wait',     label: 'Wait',      symbol: '⏳', bg: WC.question,     kind: 'word' },
  ],
};

const CATEGORIES: Category[] = ['Main', 'Actions', 'Feelings', 'Food', 'Social'];

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
  const [activeCategory, setActiveCategory] = useState<Category>('Main');
  const [mascotEmotion, setMascotEmotion] = useState<MascotKey>('neutral_curious');
  const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const wordsText = useMemo(
    () => state.messageWords.map(w => w.label).join(' '),
>>>>>>> 514eba5ddd02193247c70cf5a0bb1c6af498f74d
    [state.messageWords],
  );
  const hasWords = state.messageWords.length > 0;

<<<<<<< HEAD
  const visibleCards = useMemo(
    () =>
      category === 'main'
        ? ALL_CARDS
        : ALL_CARDS.filter((c) => c.category === category),
    [category],
  );

  const announce = (msg: string) =>
    AccessibilityInfo.announceForAccessibility(msg);

  const addWord = (card: WordCard) => {
    hapticSelection();
    dispatch({
      type: 'APPEND_WORD',
      payload: {
        id: `${card.id}-${Date.now()}`,
        label: card.label,
        wordType: 'core',
        emoji: '',
      },
    });
    speak(card.label, { rate: 0.9 });
    const next = [
      ...state.messageWords.map((w) => w.label),
      card.label,
    ].join(' ');
    announce(`Added ${card.label}. Message: ${next}`);
  };

  const removeLastWord = () => {
    if (!hasWords) { announce('Message already empty'); return; }
=======
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
>>>>>>> 514eba5ddd02193247c70cf5a0bb1c6af498f74d
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

<<<<<<< HEAD
  const clearWords = () => {
    if (!hasWords) { announce('Message already empty'); return; }
    hapticSelection();
    dispatch({ type: 'CLEAR_WORDS' });
    announce('Cleared message');
  };

  const speakMessage = () => {
    if (!hasWords) { announce('Nothing to speak yet'); return; }
    hapticSelection();
    speak(wordsText, { rate: 0.9 });
    announce(`Speaking: ${wordsText}`);
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>

      {/* ── Input bar ─────────────────────────────────────────────────────── */}
      <View style={styles.inputRow}>
        {/* Message / speak area */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={
            hasWords ? `Speak: ${wordsText}` : 'Tap to speak'
          }
          accessibilityHint="Tap to hear your message aloud"
          onPress={speakMessage}
          style={styles.inputContainer}
        >
          <Text
            style={[styles.inputText, !hasWords && styles.inputPlaceholder]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {hasWords ? wordsText : 'Tap to speak....'}
          </Text>

          {/* Backspace – inside the input on the right */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Delete last word"
            accessibilityHint="Long press to clear the whole message"
            onPress={(e) => { e.stopPropagation(); removeLastWord(); }}
            onLongPress={(e) => { e.stopPropagation(); clearWords(); }}
            hitSlop={8}
            style={styles.backspaceBtn}
          >
            <Image
              source={require('../../assets/aac/backspace.png')}
              style={styles.backspaceIcon}
              resizeMode="contain"
              accessibilityLabel="Backspace"
            />
          </Pressable>
        </Pressable>

        {/* Delete + Save action buttons */}
        <View style={styles.actionCol}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Clear all words"
            onPress={clearWords}
            accessibilityState={{ disabled: !hasWords }}
            style={[styles.actionBtn, !hasWords && styles.dimmed]}
          >
            <Image
              source={require('../../assets/aac/btn_delete.png')}
              style={styles.actionBtnImg}
              resizeMode="cover"
            />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Save message"
            onPress={() => announce('Save coming soon')}
            style={styles.actionBtn}
          >
            <Image
              source={require('../../assets/aac/btn_save.png')}
              style={styles.actionBtnImg}
              resizeMode="cover"
            />
          </Pressable>
        </View>
      </View>

      {/* ── Speech error banner ───────────────────────────────────────────── */}
      {speechError ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Dismiss speech error"
          onPress={clearSpeechError}
          style={styles.errorBanner}
        >
          <Text style={styles.errorText}>
            Speech unavailable: {speechError.message}
          </Text>
        </Pressable>
      ) : null}

      {/* ── Category tabs ─────────────────────────────────────────────────── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.catScroll}
        contentContainerStyle={styles.catContent}
      >
        {CATEGORIES.map((cat) => {
          const isActive = category === cat.id;
          return (
            <Pressable
              key={cat.id}
              accessibilityRole="button"
              accessibilityLabel={`${cat.label} category${isActive ? ', selected' : ''}`}
              onPress={() => {
                hapticSelection();
                setCategory(cat.id);
                announce(`${cat.label} selected`);
              }}
              style={[styles.catPill, isActive && styles.catPillActive]}
            >
              <Image
                source={CAT_IMAGES[cat.id]}
                style={styles.catPillImg}
                resizeMode="contain"
              />
            </Pressable>
          );
        })}
      </ScrollView>

      {/* ── Word card grid ────────────────────────────────────────────────── */}
      <ScrollView
        contentContainerStyle={styles.cardGrid}
        showsVerticalScrollIndicator={false}
      >
        {visibleCards.map((card) => (
          <Pressable
            key={card.id}
            accessibilityRole="button"
            accessibilityLabel={`Say ${card.label}`}
            accessibilityHint="Adds this word to the message and speaks it"
            onPress={() => addWord(card)}
            style={({ pressed }) => [
              styles.cardWrapper,
              pressed && styles.cardPressed,
            ]}
          >
            <Image
              source={card.image}
              style={styles.cardImage}
              resizeMode="cover"
            />
          </Pressable>
        ))}
      </ScrollView>

    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const ACTION_BTN = 56;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#E8EDF2',
  },

  // Input row
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: H_PAD,
    paddingTop: 10,
    paddingBottom: 8,
    gap: CARD_GAP,
  },
  inputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    minHeight: ACTION_BTN * 2 + CARD_GAP,
    shadowColor: '#000',
    shadowOpacity: 0.07,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  inputText: {
    flex: 1,
    color: '#202020',
    fontSize: 17,
    fontWeight: '500',
  },
  inputPlaceholder: {
    color: '#AEBBCA',
    fontWeight: '400',
  },
  backspaceBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  backspaceIcon: {
    width: 30,
    height: 24,
  },

  // Action buttons (delete + save)
  actionCol: {
    gap: CARD_GAP,
  },
  actionBtn: {
    width: ACTION_BTN,
    height: ACTION_BTN,
    borderRadius: 16,
    overflow: 'hidden',
  },
  actionBtnImg: {
    width: ACTION_BTN,
    height: ACTION_BTN,
  },
  dimmed: {
    opacity: 0.4,
  },

  // Speech error
  errorBanner: {
    marginHorizontal: H_PAD,
    marginBottom: 6,
    borderRadius: 12,
    backgroundColor: '#EF4444',
=======
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

      {/* ── Category strip ──────────────────────────────────────────── */}
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
>>>>>>> 514eba5ddd02193247c70cf5a0bb1c6af498f74d
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  errorText: {
<<<<<<< HEAD
    color: '#FFFFFF',
    fontSize: 13,
=======
    color: '#fff',
    fontSize: 12,
>>>>>>> 514eba5ddd02193247c70cf5a0bb1c6af498f74d
    fontWeight: '700',
    textAlign: 'center',
  },

<<<<<<< HEAD
  // Category tabs
  catScroll: {
    flexGrow: 0,
    marginBottom: 8,
  },
  catContent: {
    paddingHorizontal: H_PAD,
    gap: 8,
    alignItems: 'center',
  },
  catPill: {
    opacity: 0.65,
  },
  catPillActive: {
    opacity: 1,
    transform: [{ scale: 1.04 }],
  },
  catPillImg: {
    height: 36,
    width: 92,
  },

  // Word card grid
  cardGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: H_PAD,
    gap: CARD_GAP,
    paddingBottom: 24,
  },
  cardWrapper: {
    width: CARD_SIZE,
    height: CARD_SIZE,
    borderRadius: 14,
    overflow: 'hidden',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  cardPressed: {
    transform: [{ scale: 0.95 }],
    opacity: 0.88,
=======
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
>>>>>>> 514eba5ddd02193247c70cf5a0bb1c6af498f74d
  },
});
