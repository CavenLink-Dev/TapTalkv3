import React, { useCallback, useMemo } from 'react';
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BackspaceIcon } from '../../components/icons/FigmaIcons';
import { MulberrySymbol } from '../symbols/MulberrySymbol';
import { useAppContext } from '../../hooks/useAppContext';
import { useTheme } from '../../theme/useTheme';
import { boardSizes, CHROME_SEPARATOR_WIDTH, spacing, typography } from '../../theme/tokens';
import { hapticError, hapticSelection } from '../../utils/haptics';

const MESSAGE_HEIGHT = boardSizes.messageStripHeight;
const MESSAGE_CHIP_SIZE = 56;
const CHIP_SYMBOL_SIZE = 38;
const MESSAGE_SLOT_COUNT = 4;
// Base (unscaled) message-strip type sizes. Rendered sizes multiply by the
// user's selected text size (t.textScale) so the strip responds to the
// in-app accessibility setting like the rest of the app.
const CHIP_LABEL_BASE = 9;
const MESSAGE_TEXT_BASE = 24;

export type MessageStripTile = {
  id: string;
  label: string;
  kind: 'folder' | 'word' | 'action';
  color: string;
  background?: string;
  speech?: string;
  mulberrySymbolId?: string;
  mulberryName?: string;
};

function hexToRgba(hex: string, alpha: number): string {
  const match = hex.match(/^#([0-9a-fA-F]{6})$/);
  if (!match) return hex;
  const h = match[1] as string;
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

type TalkMessageStripProps = {
  messageSlotRefs: React.MutableRefObject<Array<View | null>>;
  chipTileLookup: Map<string, MessageStripTile>;
  ghostCount: number;
  onSpeak: (messageText: string, hasWords: boolean) => void;
  onBackspace: (hasWords: boolean) => void;
  onClearAll: () => void;
  onRemoveWord: (index: number, label: string) => void;
  hapticsEnabled: boolean;
  navVisible: boolean;
  onToggleNav: () => void;
};

function MessageChip({
  tile,
  label,
  onRemove,
}: {
  tile: MessageStripTile;
  label: string;
  onRemove?: () => void;
}) {
  const t = useTheme();
  const chipBg = hexToRgba(tile.color, 0.2);
  // Chip labels scale with the user's selected text size. The symbol gives
  // up a little room at larger scales so the label never clips.
  const chipLabelSize = Math.round(CHIP_LABEL_BASE * t.textScale);
  const symbolSize = Math.round(CHIP_SYMBOL_SIZE - (chipLabelSize - CHIP_LABEL_BASE));
  const inner = (
    <>
      <View style={[styles.messageChipBg, { backgroundColor: chipBg }]} />
      <MulberrySymbol
        symbolId={tile.mulberrySymbolId}
        name={tile.mulberryName ?? tile.label}
        size={symbolSize}
      />
      <Text
        style={[
          styles.messageChipLabel,
          {
            color: t.colors.text,
            fontSize: chipLabelSize,
            lineHeight: chipLabelSize + 2,
          },
        ]}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.8}
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

  return (
    <View
      style={styles.messageChip}
      accessibilityRole="text"
      accessibilityLabel={label}
    >
      {inner}
    </View>
  );
}

export const TalkMessageStrip = React.memo(function TalkMessageStrip({
  messageSlotRefs,
  chipTileLookup,
  ghostCount,
  onSpeak,
  onBackspace,
  onClearAll,
  onRemoveWord,
  hapticsEnabled,
  navVisible,
  onToggleNav,
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
          borderBottomWidth: CHROME_SEPARATOR_WIDTH,
        },
      ]}
    >
      {/*
        Hidden live-region node — iOS VoiceOver watches this view and
        announces its accessibilityLabel whenever the content changes.
        "polite" waits for any current speech to finish before announcing,
        which is correct for tile-tap feedback (user may still be tapping).
        The node is visually absent (1×1, clipped) so it never affects layout
        or sighted users; importantForAccessibility="no-hide-descendants"
        keeps VoiceOver from tabbing into it as a separate focus target.
      */}
      <View
        accessibilityLiveRegion="polite"
        accessibilityLabel={messageText ? `Message: ${messageText}` : ''}
        importantForAccessibility="no-hide-descendants"
        style={styles.liveRegion}
      />
      <View style={styles.messageContentRow}>
        <View style={styles.messageButtonSlot}>
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
                  {
                    color: t.colors.textTertiary,
                    fontSize: Math.round(MESSAGE_TEXT_BASE * t.textScale),
                    lineHeight: Math.round((MESSAGE_TEXT_BASE + 6) * t.textScale),
                  },
                ]}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.75}
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
                          }
                        }
                        onRemove={() => onRemoveWord(index, word.label)}
                      />
                    ) : null}
                  </View>
                );
              })}
            </View>
          </Pressable>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={hasWords ? 'Backspace' : 'Return to home board'}
          accessibilityHint={hasWords ? 'Hold to clear all words' : undefined}
          onPress={handleBackspace}
          onLongPress={handleBackspaceLongPress}
          delayLongPress={500}
          style={styles.backspace}
        >
          <BackspaceIcon size={40} />
        </Pressable>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={navVisible ? 'Hide board navigation' : 'Show board navigation'}
        accessibilityHint="Opens the TapTalk, Quick, Edit, and Clear controls"
        accessibilityState={{ expanded: navVisible }}
        onPress={onToggleNav}
        // Visual handle stays compact (62×14) but the effective touch area
        // is ≥50×50 (98×54 with this hitSlop) so it never demands precision.
        hitSlop={{ top: 18, bottom: 22, left: 18, right: 18 }}
        style={({ pressed }) => [
          styles.navDropdownHandle,
          {
            backgroundColor: t.colors.surface,
            borderColor: t.colors.border,
          },
          navVisible && [
            styles.navDropdownHandleOpen,
            {
              borderColor: t.colors.primary,
              backgroundColor: t.isDark ? t.colors.inputBgWhite : t.colors.surface,
            },
          ],
          pressed && styles.navDropdownHandlePressed,
        ]}
      >
        <Ionicons
          name={navVisible ? 'chevron-up' : 'chevron-down'}
          size={20}
          style={{ marginTop: -4 }}
          color={navVisible ? t.colors.primaryDark : t.colors.textMuted}
        />
      </Pressable>
    </View>
  );
});

const styles = StyleSheet.create({
  messageArea: {
    height: MESSAGE_HEIGHT,
    paddingHorizontal: 16,
    justifyContent: 'center',
    paddingBottom: 15,
    position: 'relative',
    // borderBottomWidth is applied inline (conditional on navVisible)
  },
  messageContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: -2,
  },
  messageButtonSlot: {
    flex: 1,
    height: 66,
    position: 'relative',
  },
  messageButton: {
    height: '100%',
    justifyContent: 'center',
    position: 'relative',
  },
  // Sentence / placeholder text uses the shared font system; size and line
  // height are applied inline so they track the user's text-size setting.
  messageText: {
    fontFamily: typography.fontFamily,
    fontWeight: '700',
  },
  messagePlaceholder: {
    fontWeight: '400',
  },
  messageSlotRow: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  messageSlotRowHidden: {
    opacity: 0,
  },
  messageSlot: {
    width: MESSAGE_CHIP_SIZE,
    height: MESSAGE_CHIP_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  messageChip: {
    width: MESSAGE_CHIP_SIZE,
    height: MESSAGE_CHIP_SIZE,
    borderRadius: 10,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 1,
  },
  messageChipBg: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 10,
  },
  // Base chip label style — size/line-height applied inline from the
  // active text scale so chips respond to the accessibility text setting.
  messageChipLabel: {
    fontFamily: typography.fontFamily,
    fontWeight: '700',
    paddingHorizontal: 3,
    textAlign: 'center',
  },
  backspace: {
    width: 61,
    height: 66,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.sm,
  },
  navDropdownHandle: {
    position: 'absolute',
    alignSelf: 'center',
    bottom: -15,
    width: 62,
    height: 14,
    borderWidth: 1.5,
    borderTopWidth: 0,
    borderBottomLeftRadius: 5,
    borderBottomRightRadius: 5,
    alignItems: 'center',
    justifyContent: 'flex-start',
    zIndex: 5,
  },
  navDropdownHandleOpen: {
    borderWidth: 2,
    borderTopWidth: 0,
  },
  navDropdownHandlePressed: {
    opacity: 0.78,
  },
  // Hidden VoiceOver live-region node — visually absent, never interactive.
  liveRegion: {
    position: 'absolute',
    width: 1,
    height: 1,
    overflow: 'hidden',
    opacity: 0,
  },
});
