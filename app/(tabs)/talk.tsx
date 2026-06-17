import React, { useMemo, useState } from 'react';
import { AccessibilityInfo, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useAppContext } from '../../src/hooks/useAppContext';
import { hapticSelection } from '../../src/utils/haptics';
import { Screen } from '../../src/components/native/Screen';
import { Card } from '../../src/components/native/Card';
import { PrimaryButton } from '../../src/components/native/PrimaryButton';
import { colors, radii, spacing, typography } from '../../src/theme/tokens';
import { useSpeech } from '../../src/hooks/useSpeech';

type BoardName = 'main' | 'food';

interface BoardItem {
  id: string;
  label: string;
  symbol: string;
  kind: 'word' | 'folder';
  backgroundColor: string;
  borderColor: string;
  labelColor: string;
}

const mainBoard: BoardItem[] = [
  { id: 'i', label: 'I', symbol: '👤', kind: 'word', backgroundColor: '#EBF4FF', borderColor: '#93C5FD', labelColor: '#1D4ED8' },
  { id: 'want', label: 'want', symbol: '🙋', kind: 'word', backgroundColor: '#FFF7ED', borderColor: '#FCA97B', labelColor: '#C2410C' },
  { id: 'yes', label: 'yes', symbol: '✓', kind: 'word', backgroundColor: '#F0FDF4', borderColor: '#86EFAC', labelColor: '#15803D' },
  { id: 'please', label: 'please', symbol: '★', kind: 'word', backgroundColor: colors.softBlue, borderColor: '#B3DDEF', labelColor: colors.primary },
  { id: 'food', label: 'Food', symbol: '🍎', kind: 'folder', backgroundColor: '#FFFBEB', borderColor: '#F59E0B', labelColor: '#B45309' },
  { id: 'help', label: 'help', symbol: '🤝', kind: 'word', backgroundColor: '#F5F3FF', borderColor: '#C4B5FD', labelColor: '#6D28D9' },
];

const foodBoard: BoardItem[] = [
  { id: 'apple', label: 'apple', symbol: '🍎', kind: 'word', backgroundColor: '#FFFBEB', borderColor: '#FCD34D', labelColor: '#92400E' },
  { id: 'banana', label: 'banana', symbol: '🍌', kind: 'word', backgroundColor: '#FEFCE8', borderColor: '#FDE047', labelColor: '#854D0E' },
  { id: 'pizza', label: 'pizza', symbol: '🍕', kind: 'word', backgroundColor: '#FFF7ED', borderColor: '#FDBA74', labelColor: '#C2410C' },
  { id: 'water', label: 'water', symbol: '💧', kind: 'word', backgroundColor: '#EFF6FF', borderColor: '#93C5FD', labelColor: '#1D4ED8' },
  { id: 'milk', label: 'milk', symbol: '🥛', kind: 'word', backgroundColor: '#F8FAFC', borderColor: '#CBD5E1', labelColor: '#475569' },
];

export default function TalkScreen() {
  const { state, dispatch } = useAppContext();
  const { speak, lastError: speechError, clearError: clearSpeechError } = useSpeech();
  const [board, setBoard] = useState<BoardName>('main');
  const [keyboardMode, setKeyboardMode] = useState(false);

  const wordsText = useMemo(
    () => state.messageWords.map((word) => word.label).join(' '),
    [state.messageWords],
  );
  const hasWords = state.messageWords.length > 0;
  const typedText = state.keyboardText.trim();
  const messageLabel = hasWords
    ? `Message strip: ${wordsText}`
    : 'Message strip empty. Tap a word to build a sentence.';

  const activeBoard = board === 'main' ? mainBoard : foodBoard;

  const announce = (message: string) => {
    AccessibilityInfo.announceForAccessibility(message);
  };

  const addWord = (item: BoardItem) => {
    if (item.kind === 'folder') {
      hapticSelection();
      setBoard('food');
      announce(`Opened ${item.label} folder`);
      return;
    }

    hapticSelection();
    dispatch({
      type: 'APPEND_WORD',
      payload: {
        id: `${item.id}-${Date.now()}`,
        label: item.label,
        wordType: 'core',
        emoji: item.symbol,
      },
    });
    speak(item.label, { rate: 0.9 });
    const nextMessage = [...state.messageWords.map((word) => word.label), item.label].join(' ');
    announce(`Added ${item.label}. Message strip: ${nextMessage}`);
  };

  const speakMessage = () => {
    const text = keyboardMode ? typedText : wordsText;
    if (text.trim()) {
      hapticSelection();
      speak(text, { rate: 0.9 });
      announce(`Speaking: ${text}`);
      return;
    }
    announce('No message to speak yet');
  };

  const removeLastWord = () => {
    if (!hasWords) {
      announce('Message strip is already empty');
      return;
    }
    hapticSelection();
    dispatch({ type: 'REMOVE_LAST_WORD' });
    announce('Removed last word');
  };

  const clearWords = () => {
    if (!hasWords) {
      announce('Message strip is already empty');
      return;
    }
    hapticSelection();
    dispatch({ type: 'CLEAR_WORDS' });
    announce('Cleared message strip');
  };

  const clearTypedMessage = () => {
    if (!typedText) {
      announce('Typed message is already empty');
      return;
    }
    hapticSelection();
    dispatch({ type: 'SET_KEYBOARD_TEXT', payload: '' });
    announce('Cleared typed message');
  };

  if (keyboardMode) {
    return (
      <Screen title="TalkBoard" subtitle="Type a message and hear it spoken aloud.">
        {speechError ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Dismiss speech error"
            onPress={clearSpeechError}
            style={styles.speechError}
          >
            <Text style={styles.speechErrorText}>Speech unavailable: {speechError.message}</Text>
          </Pressable>
        ) : null}
        <Card style={styles.messageCard}>
          <TextInput
            accessibilityLabel="Typed TalkBoard message"
            accessibilityHint="Type a message, then press Speak to hear it aloud"
            multiline
            placeholder="Tap to start..."
            placeholderTextColor={colors.textTertiary}
            value={state.keyboardText}
            onChangeText={(text) => dispatch({ type: 'SET_KEYBOARD_TEXT', payload: text })}
            style={styles.keyboardInput}
          />
          <View style={styles.keyboardActions}>
            <PrimaryButton
              accessibilityLabel="Speak typed message"
              label="Speak"
              disabled={!typedText}
              onPress={speakMessage}
              style={styles.smallAction}
            />
            <PrimaryButton
              accessibilityLabel="Clear typed message"
              label="Clear"
              disabled={!typedText}
              onPress={clearTypedMessage}
              variant="secondary"
              style={styles.smallAction}
            />
          </View>
        </Card>
        <PrimaryButton
          accessibilityLabel="Return to AAC board"
          label="Back to Board"
          onPress={() => {
            hapticSelection();
            setKeyboardMode(false);
          }}
          variant="secondary"
        />
      </Screen>
    );
  }

  return (
    <Screen title="Talk" subtitle="Tap symbols to build a sentence." scroll={false}>
      <Card
        style={styles.messageCard}
        accessibilityLabel={messageLabel}
        accessibilityLiveRegion="polite"
      >
        <View style={styles.messageRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Speak message"
            accessibilityHint="Speaks every word currently in the message strip"
            accessibilityState={{ disabled: !hasWords }}
            disabled={!hasWords}
            onPress={speakMessage}
            style={[styles.speakerButton, !hasWords && styles.disabledButton]}
          >
            <Text style={styles.speakerText}>🔊</Text>
          </Pressable>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
            {state.messageWords.length === 0 ? (
              <Text style={styles.placeholder}>Tap a word to build a sentence...</Text>
            ) : (
              state.messageWords.map((word, index) => (
                <View key={`${word.id}-${index}`} style={styles.wordChip}>
                  <Text style={styles.wordChipText}>{word.label}</Text>
                </View>
              ))
            )}
          </ScrollView>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Remove last word"
            accessibilityHint="Double tap to remove the last word. Long press to clear the whole message."
            accessibilityState={{ disabled: !hasWords }}
            disabled={!hasWords}
            onPress={removeLastWord}
            onLongPress={clearWords}
            style={[styles.clearButton, !hasWords && styles.disabledButton]}
          >
            <Text style={styles.clearText}>⌫</Text>
          </Pressable>
        </View>
      </Card>

      <View style={styles.subheader}>
        {board === 'food' ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Return to main AAC board"
            onPress={() => {
              hapticSelection();
              setBoard('main');
              announce('Returned to main board');
            }}
          >
            <Text style={styles.backLink}>‹ Main</Text>
          </Pressable>
        ) : null}
        <Text style={styles.boardTitle}>{board === 'main' ? 'Main Board' : 'Food'}</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open keyboard mode"
          accessibilityHint="Switches from symbol board to typed message mode"
          onPress={() => {
            hapticSelection();
            setKeyboardMode(true);
          }}
        >
          <Text style={styles.backLink}>Keys</Text>
        </Pressable>
      </View>

      {speechError ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Dismiss speech error"
          onPress={clearSpeechError}
          style={styles.speechError}
        >
          <Text style={styles.speechErrorText}>Speech unavailable: {speechError.message}</Text>
        </Pressable>
      ) : null}

      <ScrollView contentContainerStyle={styles.grid} showsVerticalScrollIndicator={false}>
        {activeBoard.map((item) => (
          <Pressable
            key={item.id}
            accessibilityRole="button"
            accessibilityLabel={`${item.kind === 'folder' ? 'Open folder' : 'Say'} ${item.label}`}
            accessibilityHint={
              item.kind === 'folder'
                ? `Opens the ${item.label} folder`
                : `Adds ${item.label} to the message strip and speaks it`
            }
            onPress={() => addWord(item)}
            style={({ pressed }) => [
              styles.aacCell,
              {
                backgroundColor: item.backgroundColor,
                borderColor: item.borderColor,
              },
              item.kind === 'folder' && styles.folderCell,
              pressed && styles.pressed,
            ]}
          >
            {item.kind === 'folder' ? <Text style={[styles.folderTag, { color: item.labelColor }]}>folder</Text> : null}
            <Text style={styles.symbol}>{item.symbol}</Text>
            <Text style={[styles.cellLabel, { color: item.labelColor }]}>{item.label}</Text>
          </Pressable>
        ))}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  aacCell: {
    width: '31%',
    minHeight: 104,
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: radii.card,
    borderWidth: 2.5,
    padding: spacing.md,
  },
  backLink: {
    color: colors.primary,
    fontSize: typography.callout,
    fontWeight: '700',
  },
  boardTitle: {
    color: colors.text,
    fontSize: typography.callout,
    fontWeight: '800',
  },
  cellLabel: {
    fontSize: 13,
    fontWeight: '800',
  },
  chipRow: {
    alignItems: 'center',
    gap: 6,
  },
  clearButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: colors.input,
  },
  clearText: {
    color: colors.textMuted,
    fontSize: 18,
    fontWeight: '800',
  },
  disabledButton: {
    opacity: 0.45,
  },
  folderCell: {
    width: '64%',
  },
  folderTag: {
    position: 'absolute',
    top: 8,
    right: 10,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    paddingBottom: 20,
  },
  keyboardActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  keyboardInput: {
    minHeight: 128,
    color: colors.text,
    fontSize: typography.body,
    lineHeight: 24,
    textAlignVertical: 'top',
  },
  messageCard: {
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  messageRow: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  placeholder: {
    color: colors.textTertiary,
    fontSize: typography.callout,
    fontStyle: 'italic',
  },
  pressed: {
    transform: [{ scale: 0.97 }],
  },
  smallAction: {
    flex: 1,
  },
  speakerButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: colors.primary,
  },
  speechError: {
    borderRadius: radii.button,
    backgroundColor: colors.danger,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  speechErrorText: {
    color: colors.surface,
    fontSize: typography.caption,
    fontWeight: '700',
    textAlign: 'center',
  },
  speakerText: {
    color: colors.surface,
    fontSize: 18,
  },
  subheader: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
    borderRadius: 14,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
  },
  symbol: {
    fontSize: 34,
  },
  wordChip: {
    borderWidth: 1.5,
    borderColor: '#B3DDEF',
    borderRadius: 12,
    backgroundColor: colors.softBlue,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  wordChipText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '800',
  },
});
