import React from 'react';
import { StyleSheet, Text, TextProps } from 'react-native';
import { spacing, typography } from '../../theme/tokens';
import { useTheme } from '../../theme/useTheme';

interface HelperCaptionProps extends TextProps {
  children: React.ReactNode;
}

/**
 * Quiet legal/helper caption: 13 pt, Regular weight, textTertiary, centred.
 * Maps to Figma `dark_third_text` role. Place at the bottom of sections.
 */
export function HelperCaption({ children, style, ...rest }: HelperCaptionProps) {
  const t = useTheme();

  return (
    <Text
      allowFontScaling
      maxFontSizeMultiplier={2}
      accessibilityRole="text"
      style={[styles.base, { color: t.colors.textTertiary, fontFamily: t.fonts.body }, style]}
      {...rest}
    >
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  base: {
    fontSize: typography.caption,
    fontWeight: '400',
    letterSpacing: -0.5,
    textAlign: 'center',
    marginTop: spacing.xs,
    paddingHorizontal: spacing.md,
  },
});
