/**
 * TileWithBadge — Learn-mode tile (Item 18).
 *
 * Wraps a TileCell with a word-type badge and a short spring "celebration"
 * bounce when tapped, to reinforce the word choice for a learner. The
 * celebration is gated by Reduce Motion (Rule 18): when reduced, the tile just
 * fires without the bounce.
 */
import React, { useCallback } from 'react';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
} from 'react-native-reanimated';
import { TileCell, type TileCellProps } from './TileCell';
import { useReduceMotion } from '../../../hooks/useReduceMotion';

export type TileWithBadgeProps = Omit<TileCellProps, 'showBadge'>;

export function TileWithBadge(props: TileWithBadgeProps) {
  const { onPress } = props;
  const scale = useSharedValue(1);
  const reduceMotion = useReduceMotion();

  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const handlePress = useCallback(
    (tileId: string) => {
      if (!reduceMotion) {
        scale.value = withSequence(
          withSpring(1.12, { damping: 6, stiffness: 260 }),
          withSpring(1, { damping: 10, stiffness: 220 }),
        );
      }
      onPress(tileId);
    },
    [onPress, reduceMotion, scale],
  );

  return (
    <Animated.View style={animatedStyle}>
      <TileCell {...props} onPress={handlePress} showBadge />
    </Animated.View>
  );
}
