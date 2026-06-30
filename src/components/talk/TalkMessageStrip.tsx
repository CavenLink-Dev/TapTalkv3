import React, { useCallback, useMemo } from 'react';
import {
  Alert,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { BackspaceIcon } from '../../components/icons/FigmaIcons';
import { useAppContext } from '../../hooks/useAppContext';
import { useTheme } from '../../theme/useTheme';
import { spacing } from '../../theme/tokens';
import { hapticError, hapticSelection } from '../../utils/haptics';
import type { ImageSourcePropType } from 'react-native';

const MESSAGE_HEIGHT = 104;
const MESSAGE_CHIP_SIZE = 40;
const MESSAGE_SLOT_COUNT = 6;

export type MessageStripTile = {
  id: string;
  label: string;
  kind: 'folder' | 'word' | 'action';
  color: string;
  background?: string;
  speech?: string;
};

type TalkMessageStripProps = {
  messageSlotRefs: React.MutableRefObject<Array<View | null>>;
  chipTileLookup: Map<string, MessageStripTile>;
  ghostCount: number;
  wordBackgroundForTile: (tile: MessageStripTile) => ImageSourcePropType;
  onSpeak: (messageText: string, hasWords: boolean) => void;
  onBackspace: (hasWords: boolean) => void;
  onClearAll: () => void;
  onRemoveWord: (index: number, label: string) => void;
  hapticsEnabled: boolean;
};

function MessageChip({
  tile,
  label,
  onRemove,
  wordBackgroundForTile,
}: {
  tile: MessageStripTile;
  label: string;
  onRemove?: () => void;
  wordBackgroundForTile: (tile: MessageStripTile) => ImageSourcePropType;
}) {
  const t = useTheme();
  const inner = (
    <>
      <Image
        source={wordBackgroundForTile(tile)}
        resizeMode="stretch"
        style={styles.messageChipBackground}
      />
      <Text
        style={[styles.messageChipLabel, { color: t.colors.text }]}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {label}
      </Text>
    </>
  );

  if (onRemove) {
    return (
      <Pressable
        onPress={onRemove}
        accessibilityRole="button"
        accessibilityLabel={`Remove ${label}`}
        style={({ pressed }) => [styles.messageChip, pressed && { opacity: 0.7 }]}
      >
        {inner}
      </Pressable>
    );
  }

  return <View style={styles.messageChip}>{inner}</View>;
}

export const TalkMessageStrip = React.memo(function TalkMessageStrip({
  messageSlotRefs,
  chipTileLookup,
  ghostCount,
  wordBackgroundForTile,
  onSpeak,
  onBackspace,
  onClearAll,
  onRemoveWord,
  hapticsEnabled,
}: TalkMessageStripProps) {
  const t = useTheme();
  const { state } = useAppContext();
  const messageWords = state.messageWords;

  const messageText = useMemo(
    () => messageWords.map((word: { label: string }) => word.label).join(' '),
    [messageWords],
  );
  const hasWords = messageWords.length > 0;
  const visibleMessageWords = messageWords.slice(0, MESSAGE_SLOT_COUNT);

  const handleSpeak = useCallback(() => {
    onSpeak(messageText, hasWords);
  }, [hasWords, messageText, onSpeak]);

  const handleBackspace = useCallback(() => {
    onBackspace(hasWords);
  }, [hasWords, onBackspace]);

  const handleBackspaceLongPress = useCallback(() => {
    if (!hasWords) return;
    if (hapticsEnabled) hapticSelection();
    Alert.alert(
      'Clear message?',
      'All words will be removed.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => {
            if (hapticsEnabled) hapticError();
            onClearAll();
          },
        },
      ],
      { cancelable: true },
    );
  }, [hasWords, hapticsEnabled, onClearAll]);

  return (
    <View
      style={[
        styles.messageArea,
        {
          backgroundColor: t.colors.surface,
          borderBottomColor: t.colors.border,
        },
      ]}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={hasWords ? `Speak ${messageText}` : 'Tap symbols to build a sentence'}
        onPress={handleSpeak}
        style={styles.messageButton}
      >
        {!hasWords && ghostCount === 0 ? (
          <Text
            style={[
              styles.messageText,
              styles.messagePlaceholder,
              { color: t.colors.textTertiary },
            ]}
            numberOfLines={1}
          >
            Tap to speak....
          </Text>
        ) : null}
        <View
          style={[
            styles.messageSlotRow,
            !hasWords && ghostCount === 0 && styles.messageSlotRowHidden,
          ]}
        >
          {Array.from({ length: MESSAGE_SLOT_COUNT }).map((_, index) => {
            const word = visibleMessageWords[index];
            return (
              <View
                key={index}
                ref={ref => {
                  messageSlotRefs.current[index] = ref;
                }}
                style={styles.messageSlot}
              >
                {word ? (
                  <MessageChip
                    label={word.label}
                    tile={
                      chipTileLookup.get(word.label.toLowerCase()) ?? {
                        id: word.label,
                        label: word.label,
                        kind: 'word',
                        color: '#5CC9E8',
                        background: 'cyan',
                      }
                    }
                    onRemove={() => onRemoveWord(index, word.label)}
                    wordBackgroundForTile={wordBackgroundForTile}
                  />
                ) : null}
              </View>
            );
          })}
        </View>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={hasWords ? 'Backspace' : 'Return to home board'}
        accessibilityHint={hasWords ? 'Hold to clear all words' : undefined}
        onPress={handleBackspace}
        onLongPress={handleBackspaceLongPress}
        delayLongPress={500}
        style={styles.backspace}
      >
        <BackspaceIcon size={56} />
      </Pressable>
    </View>
  );
});

const styles = StyleSheet.create({
  messageArea: {
    height: MESSAGE_HEIGHT,
    paddingLeft: 21,
    paddingRight: 17,
    paddingTop: 20,
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingBottom: 18,
    borderBottomWidth: 1.4,
  },
  messageButton: {
    flex: 1,
    height: 48,
    justifyContent: 'center',
    position: 'relative',
  },
  messageText: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '700',
  },
  messagePlaceholder: {
    fontWeight: '400',
  },
  messageSlotRow: {
    position: 'absolute',
    left: 0,
    top: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  messageSlotRowHidden: {
    opacity: 0,
  },
  messageSlot: {
    width: MESSAGE_CHIP_SIZE,
    height: MESSAGE_CHIP_SIZE,
  },
  messageChip: {
    width: MESSAGE_CHIP_SIZE,
    height: MESSAGE_CHIP_SIZE,
    borderRadius: 8,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  messageChipBackground: {
    ...StyleSheet.absoluteFillObject,
  },
  messageChipLabel: {
    fontSize: 9,
    fontWeight: '800',
    paddingHorizontal: 2,
    textAlign: 'center',
  },
  backspace: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.sm,
  },
});
