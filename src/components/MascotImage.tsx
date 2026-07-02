import React from 'react';
import { Image, ImageStyle, StyleProp } from 'react-native';

export const MASCOT_IMAGES = {
  angry: require('../../assets/mascot_library/png_mascot/mascot_angry.png'),
  big_happy_open_mouth: require('../../assets/mascot_library/png_mascot/mascot_big_happy_open_mouth.png'),
  closed_eye_smile: require('../../assets/mascot_library/png_mascot/mascot_closed_eye_smile.png'),
  confused_side_eye: require('../../assets/mascot_library/png_mascot/mascot_confused_side_eye.png'),
  content_closed_eyes: require('../../assets/mascot_library/png_mascot/mascot_content_closed_eyes.png'),
  crying: require('../../assets/mascot_library/png_mascot/mascot_crying.png'),
  excited_sparkle: require('../../assets/mascot_library/png_mascot/mascot_excited_sparkle.png'),
  excited_tongue: require('../../assets/mascot_library/png_mascot/mascot_excited_tongue.png'),
  excited_wave: require('../../assets/mascot_library/png_mascot/mascot_excited_wave.png'),
  happy_grin: require('../../assets/mascot_library/png_mascot/mascot_happy_grin.png'),
  happy_looking_up: require('../../assets/mascot_library/png_mascot/mascot_happy_looking_up.png'),
  happy_smile: require('../../assets/mascot_library/png_mascot/mascot_happy_smile.png'),
  happy_tongue: require('../../assets/mascot_library/png_mascot/mascot_happy_tongue.png'),
  heart_eyes: require('../../assets/mascot_library/png_mascot/mascot_heart_eyes.png'),
  nervous_sweat: require('../../assets/mascot_library/png_mascot/mascot_nervous_sweat.png'),
  neutral_curious: require('../../assets/mascot_library/png_mascot/mascot_neutral_curious.png'),
  sad_shy: require('../../assets/mascot_library/png_mascot/mascot_sad_shy.png'),
  sad_worried: require('../../assets/mascot_library/png_mascot/mascot_sad_worried.png'),
  shocked: require('../../assets/mascot_library/png_mascot/mascot_shocked.png'),
  sleeping: require('../../assets/mascot_library/png_mascot/mascot_sleeping.png'),
  sleepy: require('../../assets/mascot_library/png_mascot/mascot_sleepy.png'),
  surprised_open_mouth: require('../../assets/mascot_library/png_mascot/mascot_surprised_open_mouth.png'),
  thinking_puzzled: require('../../assets/mascot_library/png_mascot/mascot_thinking_puzzled.png'),
  tiny_happy: require('../../assets/mascot_library/png_mascot/mascot_tiny_happy.png'),
  tired_flat_eyes: require('../../assets/mascot_library/png_mascot/mascot_tired_flat_eyes.png'),
  uncertain_wavy_mouth: require('../../assets/mascot_library/png_mascot/mascot_uncertain_wavy_mouth.png'),
  unimpressed: require('../../assets/mascot_library/png_mascot/mascot_unimpressed.png'),
  winking_smile: require('../../assets/mascot_library/png_mascot/mascot_winking_smile.png'),
  worried_blush: require('../../assets/mascot_library/png_mascot/mascot_worried_blush.png'),
} as const;

export type MascotKey = keyof typeof MASCOT_IMAGES;

interface MascotImageProps {
  mascot: MascotKey;
  size?: number;
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
