import React, { useMemo, useState } from 'react';
import {
  AccessibilityInfo,
  Dimensions,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppContext } from '../../src/hooks/useAppContext';
import { hapticSelection } from '../../src/utils/haptics';
import { useSpeech } from '../../src/hooks/useSpeech';

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
    [state.messageWords],
  );
  const hasWords = state.messageWords.length > 0;

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
    hapticSelection();
    dispatch({ type: 'REMOVE_LAST_WORD' });
    announce('Removed last word');
  };

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
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  errorText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },

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
  },
});
