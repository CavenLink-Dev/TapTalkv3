import React, { useEffect, useRef, useState } from 'react';
import { Animated as RNAnimated, useWindowDimensions, View } from 'react-native';
import { useReduceMotion } from '../../../hooks/useReduceMotion';
import { spacing } from '../../../theme/tokens';
import { DOCK_ACTION_SIZE } from '../talk/constants';
import { styles } from '../talk/styles';
import type { DockSubControlSpec } from '../talk/types';
import { BoardDockAction } from './BoardDockAction';

export function DockSubControls({
  visible,
  anchorX,
  anchorWidth,
  controls,
  a11yLabel,
}: {
  visible: boolean;
  anchorX: number;
  anchorWidth: number;
  controls: DockSubControlSpec[];
  a11yLabel: string;
}) {
  const reduceMotion = useReduceMotion();
  const { width: screenW } = useWindowDimensions();
  const anim = useRef(new RNAnimated.Value(0)).current;
  const [mounted, setMounted] = useState(visible);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      if (reduceMotion) { anim.setValue(1); return; }
      anim.setValue(0);
      RNAnimated.spring(anim, {
        toValue: 1,
        friction: 8,
        tension: 110,
        useNativeDriver: true,
      }).start();
    } else if (reduceMotion) {
      anim.setValue(0);
      setMounted(false);
    } else {
      RNAnimated.timing(anim, {
        toValue: 0,
        duration: 130,
        useNativeDriver: true,
      }).start(({ finished }) => { if (finished) setMounted(false); });
    }
  }, [anim, reduceMotion, visible]);

  if (!mounted || controls.length === 0) return null;

  // Match the anchor button's width so the sub-controls read as a stack
  // sitting directly above their parent. Floor at DOCK_ACTION_SIZE so a
  // narrow anchor doesn't crush the sub-control below its touch target.
  const width = Math.max(anchorWidth, DOCK_ACTION_SIZE);
  const left = Math.min(
    Math.max(anchorX + anchorWidth / 2 - width / 2, spacing.sm),
    screenW - width - spacing.sm,
  );

  return (
    <RNAnimated.View
      accessibilityRole="menu"
      accessibilityLabel={a11yLabel}
      pointerEvents="box-none"
      style={[
        styles.dockSubControls,
        {
          left,
          width,
          opacity: anim,
          transform: [{
            translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }),
          }],
        },
      ]}
    >
      {controls.map(c => (
        <View key={c.key} style={styles.dockSubControlSlot}>
          <BoardDockAction
            icon={c.icon}
            label={c.label}
            a11yLabel={c.a11yLabel}
            a11yHint={c.a11yHint}
            onPress={c.onPress}
            kind={c.kind ?? 'neutral'}
            tint={c.tint}
            disabled={c.disabled}
          />
        </View>
      ))}
    </RNAnimated.View>
  );
}
