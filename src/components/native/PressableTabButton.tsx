/**
 * PressableTabButton — wraps each bottom nav tab with a spring press scale.
 * Used as the `tabBarButton` prop in the Tabs layout.
 */

import React, { useCallback, useRef } from 'react';
import { Animated, GestureResponderEvent, Pressable, StyleProp, ViewStyle } from 'react-native';
import { hapticSelection } from '../../utils/haptics';
import { useReduceMotion } from '../../hooks/useReduceMotion';

interface TabButtonProps {
  children?: React.ReactNode;
  onPress?: (e: GestureResponderEvent) => void;
  onLongPress?: (e: GestureResponderEvent) => void;
  style?: StyleProp<ViewStyle>;
  accessibilityHint?: string;
  accessibilityLabel?: string;
  accessibilityRole?: 'button' | 'tab' | 'link' | 'menuitem' | 'none';
  accessibilityState?: { selected?: boolean; disabled?: boolean };
}

export function PressableTabButton({
  children,
  onPress,
  onLongPress,
  style,
  accessibilityHint,
  accessibilityLabel,
  accessibilityRole,
  accessibilityState,
}: TabButtonProps) {
  const scale = useRef(new Animated.Value(1)).current;
  const reduceMotion = useReduceMotion();

  const handlePressIn = useCallback(() => {
    hapticSelection();
    if (reduceMotion) return;
    Animated.spring(scale, {
      toValue: 0.82,
      speed: 60,
      bounciness: 0,
      useNativeDriver: true,
    }).start();
  }, [reduceMotion, scale]);

  const handlePressOut = useCallback(() => {
    if (reduceMotion) {
      scale.setValue(1);
      return;
    }
    Animated.spring(scale, {
      toValue: 1,
      speed: 18,
      bounciness: 10,
      useNativeDriver: true,
    }).start();
  }, [reduceMotion, scale]);

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      accessibilityHint={accessibilityHint}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole={accessibilityRole ?? 'button'}
      accessibilityState={accessibilityState}
      style={[style, styles.hitTarget]}
    >
      <Animated.View style={{ transform: [{ scale }] }}>
        {children}
      </Animated.View>
    </Pressable>
  );
}

const styles = {
  hitTarget: {
    flex: 1,
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  } satisfies ViewStyle,
};
