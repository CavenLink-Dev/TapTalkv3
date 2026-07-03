import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { MulberrySymbol } from '../../components/symbols/MulberrySymbol';
import { useTheme } from '../../theme/useTheme';
import { fonts } from '../../theme/fonts';
import { parseAvatar } from './avatar';

const MASCOT = require('../../../assets/mascot_library/png_mascot/mascot_happy_looking_up.png');

interface AvatarViewProps {
  /** The stored `state.profilePhotoUri` value. */
  value: string | null | undefined;
  /** Diameter of the circle in points. */
  size: number;
  /** Uppercase initial shown when there is no symbol/colour/photo. */
  initial: string;
}

/**
 * Renders the user's avatar as a circle. Handles every encoding produced by
 * `parseAvatar` so the Me card and the Account page always look identical.
 * Purely presentational — no press handling here.
 */
export function AvatarView({ value, size, initial }: AvatarViewProps) {
  const t = useTheme();
  const avatar = parseAvatar(value);
  const radius = size / 2;
  const base = { width: size, height: size, borderRadius: radius };
  const symbolSize = Math.round(size * 0.62);
  const initialSize = Math.round(size * 0.42);

  if (avatar.kind === 'symbol') {
    return (
      <View style={[styles.circle, base, { backgroundColor: t.colors.iconTintBlueBg }]}>
        <MulberrySymbol symbolId={avatar.symbolId} size={symbolSize} />
      </View>
    );
  }

  if (avatar.kind === 'mascot') {
    return (
      <View style={[styles.circle, base, { backgroundColor: t.colors.iconTintBlueBg }]}>
        <Image
          source={MASCOT}
          style={{ width: symbolSize, height: symbolSize }}
          resizeMode="contain"
          accessibilityIgnoresInvertColors
        />
      </View>
    );
  }

  if (avatar.kind === 'photo') {
    return (
      <View style={[styles.circle, base, { backgroundColor: t.colors.input }]}>
        <Image source={{ uri: avatar.uri }} style={base} accessibilityIgnoresInvertColors />
      </View>
    );
  }

  const bg = avatar.kind === 'color' ? avatar.hex : t.colors.primary;
  return (
    <View style={[styles.circle, base, { backgroundColor: bg }]}>
      <Text
        style={[styles.initial, { color: '#FFFFFF', fontSize: initialSize }]}
        allowFontScaling={false}
        accessibilityElementsHidden
        importantForAccessibility="no"
      >
        {initial}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  initial: {
    fontFamily: fonts.displayBlack,
    letterSpacing: -0.5,
  },
});
