import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, TextStyle, View, ViewStyle } from 'react-native';
import { colors, radii, shadows, spacing, typography } from '../../theme/tokens';

interface SpeechBubbleProps {
  children?: React.ReactNode;
  text?: string;
  tail?: 'bottom' | 'top' | 'none';
  /** Reveal text character-by-character like the mascot is typing */
  typewriter?: boolean;
  /** Characters per second when typewriter is enabled */
  speed?: number;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

/**
 * Clo's speech bubble — a rounded white card with a pointer tail, used to
 * present mascot dialogue in onboarding and other moments.
 * Supports optional typewriter text reveal, matching the design system's
 * SpeechBubble component (TapTalk Design System 2 / components/aac/SpeechBubble.jsx).
 */
export function SpeechBubble({
  children,
  text,
  tail = 'bottom',
  typewriter = false,
  speed = 38,
  style,
  textStyle,
}: SpeechBubbleProps) {
  const fullText = text ?? (typeof children === 'string' ? children : '');
  const [shown, setShown] = useState(typewriter ? '' : fullText);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!typewriter || !fullText) {
      setShown(fullText);
      return;
    }
    setShown('');
    let i = 0;
    intervalRef.current = setInterval(() => {
      i += 1;
      setShown(fullText.slice(0, i));
      if (i >= fullText.length && intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }, speed);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fullText, typewriter, speed]);

  return (
    <View>
      {tail === 'top' && (
        <View style={styles.tailTopRow}>
          <View style={styles.tailTopBorder} />
          <View style={styles.tailTopFill} />
        </View>
      )}

      <View style={[styles.bubble, style]}>
        {typewriter || text ? (
          <Text style={[styles.text, textStyle]}>{typewriter ? shown : text}</Text>
        ) : (
          children
        )}
      </View>

      {tail === 'bottom' && (
        <View style={styles.tailBottomRow}>
          <View style={styles.tailBottomBorder} />
          <View style={styles.tailBottomFill} />
        </View>
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  bubble: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    borderWidth: 1.5,
    borderColor: colors.border,
    padding: spacing.lg,
    ...shadows.card,
  },
  text: {
    fontSize: typography.body,
    fontWeight: '600',
    color: colors.text,
    lineHeight: 24,
  },

  // ── Bottom tail (bubble above mascot, tail points down) ───────────────────

  tailBottomRow: {
    paddingLeft: 28,
  },
  tailBottomBorder: {
    width: 0,
    height: 0,
    borderLeftWidth: 9,
    borderRightWidth: 9,
    borderTopWidth: 11,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: colors.border,
  },
  tailBottomFill: {
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderTopWidth: 9,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: colors.surface,
    marginTop: -11,
    marginLeft: 1,
  },

  // ── Top tail (bubble below mascot, tail points up) ────────────────────────

  tailTopRow: {
    paddingLeft: 28,
  },
  tailTopBorder: {
    width: 0,
    height: 0,
    borderLeftWidth: 9,
    borderRightWidth: 9,
    borderBottomWidth: 11,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: colors.border,
  },
  tailTopFill: {
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderBottomWidth: 9,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: colors.surface,
    marginTop: -9,
    marginLeft: 1,
  },
});
