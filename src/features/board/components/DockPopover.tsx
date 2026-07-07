import React, { useEffect, useRef, useState } from 'react';
import { Animated as RNAnimated, Pressable, Text, useWindowDimensions, View } from 'react-native';
import { Icon } from '../../../components/native/Icon';
import { useReduceMotion } from '../../../hooks/useReduceMotion';
import { colors, spacing } from '../../../theme/tokens';
import { useTheme } from '../../../theme/useTheme';
import { styles } from '../talk/styles';
import type { DockPopoverOption } from '../talk/types';

export function DockPopover({
  visible,
  anchorX,
  anchorWidth,
  a11yLabel,
  options,
}: {
  visible: boolean;
  /** Anchor button x/width relative to the dock row (same coord space). */
  anchorX: number;
  anchorWidth: number;
  a11yLabel: string;
  options: DockPopoverOption[];
}) {
  const t = useTheme();
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
        friction: 9,
        tension: 90,
        useNativeDriver: true,
      }).start();
    } else if (reduceMotion) {
      anim.setValue(0);
      setMounted(false);
    } else {
      RNAnimated.timing(anim, {
        toValue: 0,
        duration: 120,
        useNativeDriver: true,
      }).start(({ finished }) => { if (finished) setMounted(false); });
    }
  }, [anim, reduceMotion, visible]);

  if (!mounted) return null;

  // Sub-options visually match their parent control's width so they read
  // as connected to it (stacked squares above the button). A small floor
  // keeps multi-word labels legible when the anchor is narrow.
  const POP_WIDTH = Math.max(anchorWidth, 96);
  // Centre over the anchor, clamped to the screen with an 8pt margin.
  const left = Math.min(
    Math.max(anchorX + anchorWidth / 2 - POP_WIDTH / 2, spacing.sm),
    screenW - POP_WIDTH - spacing.sm,
  );

  return (
    <RNAnimated.View
      accessibilityRole="menu"
      accessibilityLabel={a11yLabel}
      style={[
        styles.dockPopover,
        {
          left,
          width: POP_WIDTH,
          backgroundColor: t.isDark ? t.colors.navBackground : '#FFFFFF',
          borderColor: t.colors.symbolOutline,
          opacity: anim,
          transform: [{
            translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }),
          }],
        },
      ]}
    >
      {options.map((opt, idx) => (
        <React.Fragment key={opt.key}>
          {idx > 0 && (
            <View style={[styles.dockPopoverDivider, { backgroundColor: t.colors.symbolOutline }]} />
          )}
          <Pressable
            accessibilityRole="menuitem"
            accessibilityLabel={opt.a11yLabel}
            accessibilityState={{ selected: Boolean(opt.selected) }}
            onPress={opt.onPress}
            style={({ pressed }) => [
              styles.dockPopoverItem,
              {
                backgroundColor: pressed
                  ? (t.isDark ? t.colors.input : colors.softBlue)
                  : 'transparent',
                opacity: pressed ? 0.85 : 1,
              },
            ]}
          >
            <Text
              style={[styles.dockPopoverItemLabel, { color: t.colors.text }]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.75}
              maxFontSizeMultiplier={1.4}
            >
              {opt.label}
            </Text>
            <View style={styles.dockPopoverCheck}>
              {opt.selected ? (
                <Icon name="checkmark" size={18} color={t.colors.primary} strokeWidth={2.5} />
              ) : null}
            </View>
          </Pressable>
        </React.Fragment>
      ))}
    </RNAnimated.View>
  );
}
