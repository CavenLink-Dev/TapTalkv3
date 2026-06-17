import React from 'react';
import { Image, ImageStyle, StyleProp } from 'react-native';

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
  /** Accepted but currently unused — kept so callers don't have to change. */
  float?: boolean;
  blink?: boolean;
  lookAround?: boolean;
  style?: StyleProp<ImageStyle>;
}

/**
 * Renders the Clo mascot as a static PNG.
 *
 * The previous version tried to fake a blink by overlaying blue rectangles or
 * cross-fading to a closed-eye PNG. Both were unreliable: per-mascot eye
 * coordinates differ, and PNG swaps caused face-shape pops. Until we have
 * dedicated eye-only sprites/SVGs, the mascot stays still — which the user
 * specifically asked for over a buggy approximation.
 */
export function MascotImage({ mascot, size = 140, style }: MascotImageProps) {
  return (
    <Image
      accessible
      accessibilityLabel={`Clo mascot ${mascot.replace(/_/g, ' ')}`}
      source={MASCOT_IMAGES[mascot]}
      resizeMode="contain"
      style={[{ width: size, height: size }, style]}
    />
  );
}
