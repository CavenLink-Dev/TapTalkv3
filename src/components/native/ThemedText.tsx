/**
 * ThemedText — every text node should route through here.
 *
 * Ensures SF Compact Text / SF Compact Rounded (design-system stand-ins for
 * SF Pro / SF Pro Rounded), accessibility text-size scaling from settings,
 * and system Dynamic Type via allowFontScaling.
 */

import React from 'react';
import { StyleProp, Text, TextProps, TextStyle } from 'react-native';
import { typography } from '../../theme/tokens';
import { useTheme } from '../../theme/useTheme';

export type TextVariant =
  | 'display'
  | 'title'
  | 'heading'
  | 'subheading'
  | 'body'
  | 'callout'
  | 'caption'
  | 'eyebrow'
  | 'tab';

const DISPLAY_VARIANTS = new Set<TextVariant>([
  'display',
  'title',
  'heading',
  'subheading',
  'eyebrow',
  'tab',
]);

const WEIGHT_BY_VARIANT: Record<TextVariant, TextStyle['fontWeight']> = {
  display:    typography.weightDisplay,
  title:      typography.weightTitle,
  heading:    typography.weightHeading,
  subheading: typography.weightSubhead,
  body:       typography.weightBody,
  callout:    typography.weightBody,
  caption:    typography.weightCaption,
  eyebrow:    typography.weightEyebrow,
  tab:        typography.weightCaption,
};

const TRACK_BY_VARIANT: Partial<Record<TextVariant, number>> = {
  display:    typography.trackDisplay,
  title:      typography.trackTitle,
  heading:    typography.trackHeading,
  subheading: typography.trackSubhead,
  eyebrow:    typography.trackEyebrow,
};

export interface ThemedTextProps extends TextProps {
  variant?: TextVariant;
  color?: string;
  style?: StyleProp<TextStyle>;
  children: React.ReactNode;
}

export function ThemedText({
  variant = 'body',
  color,
  style,
  allowFontScaling = true,
  maxFontSizeMultiplier = 2,
  ...rest
}: ThemedTextProps) {
  const t = useTheme();
  const size = t.typography[variant];
  const fontFamily = DISPLAY_VARIANTS.has(variant)
    ? t.fonts.displayHeavy
    : t.fonts.body;

  return (
    <Text
      allowFontScaling={allowFontScaling}
      maxFontSizeMultiplier={maxFontSizeMultiplier}
      style={[
        {
          color: color ?? t.colors.text,
          fontFamily,
          fontSize: size,
          fontWeight: WEIGHT_BY_VARIANT[variant],
          letterSpacing: TRACK_BY_VARIANT[variant],
          lineHeight: Math.round(size * (variant === 'body' || variant === 'callout' ? 1.4 : 1.15)),
        },
        style,
      ]}
      {...rest}
    />
  );
}
