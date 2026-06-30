/**
 * SymbolTile — the chrome around a TapTalk AAC symbol.
 *
 * Renders the Fitzgerald-coloured background, the 2 px outline matching
 * `colors.symbolOutline`, a glossy top highlight, the small label at the
 * top-left, and the (optional) pictogram in the centre. Pictograms are
 * supplied as a React component so the consumer can pass any SVG from
 * `StickFigures.tsx` or a future Mulberry import.
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { shadows } from '../../theme/tokens';
import { useTheme } from '../../theme/useTheme';

export type SymbolTileProps = {
  label:    string;
  /** Background colour for the tile (Fitzgerald key). */
  color:    string;
  /** Pictogram component — receives a `size` prop and renders an SVG. */
  Symbol?:  React.ComponentType<{ size?: number }>;
  /** Tile edge length in points. Default 70. */
  size?:    number;
  /** Hides the gloss highlight (e.g. for high-contrast accessibility mode). */
  noGloss?: boolean;
};

export function SymbolTile({
  label,
  color,
  Symbol,
  size = 70,
  noGloss,
}: SymbolTileProps) {
  const t = useTheme();

  return (
    <View
      style={[
        styles.tile,
        shadows.card,
        {
          width: size,
          height: size,
          backgroundColor: color,
          borderColor: t.colors.symbolOutline,
        },
      ]}
    >
      {!noGloss && <View pointerEvents="none" style={styles.gloss} />}

      <Text style={styles.label} numberOfLines={1}>{label}</Text>

      <View style={styles.symbolBox} pointerEvents="none">
        {Symbol ? <Symbol size={Math.round(size * 0.6)} /> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    borderRadius: 10,
    borderWidth: 2,
    overflow: 'hidden',
    position: 'relative',
  },
  gloss: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '45%',
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  label: {
    position: 'absolute',
    top: 4,
    left: 5,
    right: 5,
    fontSize: 11.5,
    fontWeight: '800',
    color: '#0D0D0D',
    letterSpacing: 0.15,
  },
  symbolBox: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 12,
  },
});
