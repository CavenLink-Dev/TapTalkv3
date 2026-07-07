import React from 'react';
import { Text, View } from 'react-native';
import { BackOutIcon, BoardHomeIcon } from '../../../components/icons/FigmaIcons';
import { colors } from '../../../theme/tokens';
import { useTheme } from '../../../theme/useTheme';
import { styles } from '../talk/styles';
import type { BoardTile } from '../talk/types';

export const BoardNavTile = React.memo(function BoardNavTile({ tile, size }: { tile: BoardTile; size: number }) {
  const t = useTheme();
  return (
    <View
      style={[
        styles.navTileShell,
        {
          width: size,
          height: size,
          backgroundColor: t.isDark ? t.colors.surface : '#F4F6F8',
          borderWidth: 1.6,
          borderColor: t.isDark ? t.colors.primary : colors.primary,
        },
      ]}
    >
      <View style={styles.navTileIconMount}>
        {tile.id === 'back' ? (
          <BackOutIcon size={40} color={t.colors.text} />
        ) : (
          <BoardHomeIcon size={40} />
        )}
      </View>
      <Text
        style={[styles.navTileLabel, { color: t.colors.primary }]}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {tile.label}
      </Text>
    </View>
  );
});
