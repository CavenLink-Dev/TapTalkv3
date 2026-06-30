import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { radii, shadows, spacing, typography } from '../theme/tokens';
import { useTheme } from '../theme/useTheme';

interface SpeechBubbleProps {
  text: string;
  // Re-run the typing animation whenever this key changes.
  animationKey?: string | number;
  speed?: number;
  onDone?: () => void;
}

/**
 * A chat-style speech bubble with a downward pointer tail and a subtle
 * typewriter reveal, as if Clo is speaking the text aloud.
 */
export function SpeechBubble({ text, animationKey, speed = 38, onDone }: SpeechBubbleProps) {
  const t = useTheme();
  const [shown, setShown] = useState('');
  const popAnim = useRef(new Animated.Value(0)).current;
  const caretAnim = useRef(new Animated.Value(0)).current;
  const [typing, setTyping] = useState(true);

  useEffect(() => {
    setShown('');
    setTyping(true);
    popAnim.setValue(0);
    Animated.spring(popAnim, { toValue: 1, useNativeDriver: true, tension: 90, friction: 12 }).start();

    let index = 0;
    const timer = setInterval(() => {
      index += 1;
      setShown(text.slice(0, index));
      if (index >= text.length) {
        clearInterval(timer);
        setTyping(false);
        onDone?.();
      }
    }, speed);

    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [animationKey, text]);

  useEffect(() => {
    if (!typing) {
      caretAnim.stopAnimation();
      caretAnim.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(caretAnim, { toValue: 1, duration: 380, useNativeDriver: true }),
        Animated.timing(caretAnim, { toValue: 0, duration: 380, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [typing, caretAnim]);

  return (
    <Animated.View
      style={{
        opacity: popAnim,
        transform: [
          { scale: popAnim.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1] }) },
        ],
      }}
    >
      <View style={[styles.bubble, { backgroundColor: t.colors.surface }]}>
        <Text style={[styles.text, { color: t.colors.text }]}>
          {shown}
          {typing ? (
            <Animated.Text style={[styles.caret, { color: t.colors.primary, opacity: caretAnim }]}>
              |
            </Animated.Text>
          ) : null}
        </Text>
      </View>
      <View style={styles.tailOuter} />
      <View style={[styles.tailInner, { borderTopColor: t.colors.surface }]} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  bubble: {
    borderColor: 'rgba(17,17,17,0.05)',
    borderRadius: radii.button, // 10
    borderWidth: 1,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    ...shadows.card,
  },
  caret: {
    fontWeight: '900',
  },
  tailInner: {
    position: 'absolute',
    bottom: -8,
    left: 38,
    width: 0,
    height: 0,
    borderLeftWidth: 9,
    borderRightWidth: 9,
    borderTopWidth: 10,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
  tailOuter: {
    position: 'absolute',
    bottom: -11,
    left: 36,
    width: 0,
    height: 0,
    borderLeftWidth: 11,
    borderRightWidth: 11,
    borderTopWidth: 12,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: 'rgba(17,17,17,0.05)',
  },
  text: {
    fontSize: typography.body,
    fontWeight: '600',
    lineHeight: 26,
    textAlign: 'center',
  },
});
