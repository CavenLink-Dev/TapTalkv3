/**
 * PressableTabButton — wraps each bottom nav tab with a spring press scale.
 * Used as the `tabBarButton` prop in the Tabs layout.
 */

import React, { useCallback, useRef } from 'react';
import { Animated, GestureResponderEvent, Pressable, StyleProp, ViewStyle } from 'react-native';

interface TabButtonProps {
  children?: React.ReactNode;
  onPress?: (e: GestureResponderEvent) => void;
  onLongPress?: (e: GestureResponderEvent) => void;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
  accessibilityRole?: 'button' | 'tab' | 'link' | 'menuitem' | 'none';
  accessibilityState?: { selected?: boolean; disabled?: boolean };
}

export function PressableTabButton({
  children,
  onPress,
  onLongPress,
  style,
  accessibilityLabel,
  accessibilityRole,
  accessibilityState,
}: TabButtonProps) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = useCallback(() => {
    Animated.spring(scale, {
      toValue: 0.82,
      speed: 60,
      bounciness: 0,
      useNativeDriver: true,
    }).start();
  }, [scale]);

  const handlePressOut = useCallback(() => {
    Animated.spring(scale, {
      toValue: 1,
      speed: 18,
      bounciness: 10,
      useNativeDriver: true,
    }).start();
  }, [scale]);

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole={accessibilityRole ?? 'button'}
      accessibilityState={accessibilityState}
      style={[style, { flex: 1, alignItems: 'center', justifyContent: 'center' }]}
    >
      <Animated.View style={{ transform: [{ scale }] }}>
        {children}
      </Animated.View>
    </Pressable>
  );
}
