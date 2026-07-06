/**
 * MessageStrip — the sentence-being-built buffer above the board.
 *
 * Extracted from app/(tabs)/talk.tsx (God-screen split). Renders the current
 * words and exposes speak / backspace / clear actions. The container is an
 * accessibility live region (Item 8) so VoiceOver announces the sentence as it
 * changes — describing the spoken output, not just decoration.
 */
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { messageStripA11yProps } from '../tileA11y';
import { MESSAGE_HEIGHT } from '../constants';

export type MessageStripProps = {
  words: string[];
  onSpeak: () => void;
  onBackspace: () => void;
  onClear: () => void;
};

export function MessageStrip({ words, onSpeak, onBackspace, onClear }: MessageStripProps) {
  const empty = words.length === 0;
  return (
    <View style={styles.container} {...messageStripA11yProps(words)}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Speak message"
        onPress={onSpeak}
        disabled={empty}
        style={styles.speakBtn}
      >
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.wordRow}
        >
          {empty ? (
            <Text style={styles.placeholder}>Tap tiles to build a message</Text>
          ) : (
            words.map((w, i) => (
              <View key={`${w}-${i}`} style={styles.chip}>
                <Text style={styles.chipText}>{w}</Text>
              </View>
            ))
          )}
        </ScrollView>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Delete last word"
        onPress={onBackspace}
        disabled={empty}
        style={styles.iconBtn}
      >
        <Ionicons name="backspace-outline" size={24} color={empty ? '#c7c7cc' : '#1c1c1e'} />
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Clear message"
        onPress={onClear}
        disabled={empty}
        style={styles.iconBtn}
      >
        <Ionicons name="close-circle-outline" size={24} color={empty ? '#c7c7cc' : '#1c1c1e'} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: MESSAGE_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    gap: 8,
  },
  speakBtn: { flex: 1, height: '100%', justifyContent: 'center' },
  wordRow: { alignItems: 'center', gap: 6, paddingHorizontal: 4 },
  placeholder: { fontSize: 15, color: '#8e8e93' },
  chip: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#f2f2f7',
  },
  chipText: { fontSize: 15, fontWeight: '600', color: '#1c1c1e' },
  iconBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
});
