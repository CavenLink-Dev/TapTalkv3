import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, StyleSheet, ViewStyle } from 'react-native';

export const MASCOT_IMAGES = {
  angry: require('../../asset/mascot_angry.png'),
  big_happy_open_mouth: require('../../asset/mascot_big_happy_open_mouth.png'),
  closed_eye_smile: require('../../asset/mascot_closed_eye_smile.png'),
  confused_side_eye: require('../../asset/mascot_confused_side_eye.png'),
  content_closed_eyes: require('../../asset/mascot_content_closed_eyes.png'),
  crying: require('../../asset/mascot_crying.png'),
  excited_sparkle: require('../../asset/mascot_excited_sparkle.png'),
  excited_tongue: require('../../asset/mascot_excited_tongue.png'),
  excited_wave: require('../../asset/mascot_excited_wave.png'),
  happy_grin: require('../../asset/mascot_happy_grin.png'),
  happy_looking_up: require('../../asset/mascot_happy_looking_up.png'),
  happy_smile: require('../../asset/mascot_happy_smile.png'),
  happy_tongue: require('../../asset/mascot_happy_tongue.png'),
  heart_eyes: require('../../asset/mascot_heart_eyes.png'),
  nervous_sweat: require('../../asset/mascot_nervous_sweat.png'),
  neutral_curious: require('../../asset/mascot_neutral_curious.png'),
  sad_shy: require('../../asset/mascot_sad_shy.png'),
  sad_worried: require('../../asset/mascot_sad_worried.png'),
  shocked: require('../../asset/mascot_shocked.png'),
  sleeping: require('../../asset/mascot_sleeping.png'),
  sleepy: require('../../asset/mascot_sleepy.png'),
  surprised_open_mouth: require('../../asset/mascot_surprised_open_mouth.png'),
  thinking_puzzled: require('../../asset/mascot_thinking_puzzled.png'),
  tiny_happy: require('../../asset/mascot_tiny_happy.png'),
  tired_flat_eyes: require('../../asset/mascot_tired_flat_eyes.png'),
  uncertain_wavy_mouth: require('../../asset/mascot_uncertain_wavy_mouth.png'),
  unimpressed: require('../../asset/mascot_unimpressed.png'),
  winking_smile: require('../../asset/mascot_winking_smile.png'),
  worried_blush: require('../../asset/mascot_worried_blush.png'),
} as const;

export type MascotKey = keyof typeof MASCOT_IMAGES;

interface MascotImageProps {
  mascot: MascotKey;
  size?: number;
  /** Kept for caller compatibility. Mascots now stay still; only the eyes animate. */
  float?: boolean;
  /** Smooth eye-only blink every few seconds. */
  blink?: boolean;
  /** Kept for caller compatibility. */
  lookAround?: boolean;
  style?: ViewStyle;
}

export function MascotImage({
  mascot,
  size = 140,
  float = false,
  blink = false,
  lookAround = false,
  style,
}: MascotImageProps) {
  void float;
  void lookAround;

  const blinkAmount = useRef(new Animated.Value(0)).current;
  const eyeStyle = useMemo(
    () => ({
      width: size * 0.17,
      height: size * 0.19,
      borderRadius: size * 0.085,
    }),
    [size],
  );

  useEffect(() => {
    if (!blink) return;
    let cancelled = false;
    let pending: ReturnType<typeof setTimeout>;

    function schedule() {
      if (cancelled) return;
      pending = setTimeout(doOne, 2200 + Math.random() * 3200);
    }

    function doOne() {
      if (cancelled) return;
      Animated.sequence([
        Animated.timing(blinkAmount, { toValue: 1, duration: 90, useNativeDriver: true }),
        Animated.delay(55),
        Animated.timing(blinkAmount, { toValue: 0, duration: 120, useNativeDriver: true }),
      ]).start(() => {
        if (cancelled) return;
        if (Math.random() < 0.2) {
          pending = setTimeout(() => {
            if (cancelled) return;
            Animated.sequence([
              Animated.timing(blinkAmount, { toValue: 1, duration: 80, useNativeDriver: true }),
              Animated.delay(45),
              Animated.timing(blinkAmount, { toValue: 0, duration: 100, useNativeDriver: true }),
            ]).start(() => !cancelled && schedule());
          }, 160);
        } else {
          schedule();
        }
      });
    }

    schedule();
    return () => {
      cancelled = true;
      clearTimeout(pending);
    };
  }, [blink, blinkAmount]);

  const eyelidScale = blinkAmount.interpolate({
    inputRange: [0, 1],
    outputRange: [0.04, 1],
  });
  const lidOpacity = blinkAmount.interpolate({
    inputRange: [0, 0.15, 1],
    outputRange: [0, 1, 1],
  });

  return (
    <Animated.View
      accessible
      accessibilityLabel={`Clo mascot ${mascot.replace(/_/g, ' ')}`}
      style={[
        { width: size, height: size },
        style,
      ]}
    >
      <Animated.Image
        source={MASCOT_IMAGES[mascot]}
        style={{ width: size, height: size }}
        resizeMode="contain"
      />
      {blink ? (
        <>
          <Animated.View
            pointerEvents="none"
            style={[
              styles.eyelid,
              eyeStyle,
              {
                left: size * 0.31,
                top: size * 0.36,
                opacity: lidOpacity,
                transform: [{ scaleY: eyelidScale }],
              },
            ]}
          />
          <Animated.View
            pointerEvents="none"
            style={[
              styles.eyelid,
              eyeStyle,
              {
                right: size * 0.31,
                top: size * 0.36,
                opacity: lidOpacity,
                transform: [{ scaleY: eyelidScale }],
              },
            ]}
          />
        </>
      ) : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  eyelid: {
    position: 'absolute',
    backgroundColor: '#76baee',
    borderBottomColor: '#111111',
    borderBottomWidth: 3,
  },
});
