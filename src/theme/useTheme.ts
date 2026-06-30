/**
 * Live theme hook — the single runtime resolver for accessibility settings.
 *
 * Every component that needs dynamic colors, scaled fonts, or button sizes
 * should call `useTheme()` and read values from the returned object rather
 * than importing static tokens directly. Static tokens remain the canonical
 * *design-time* source; this hook applies user-selected overrides at runtime.
 *
 * Responds to:
 *   • textSize   → scales all font sizes proportionally
 *   • buttonSize → scales min-height + icon size of interactive controls
 *   • theme      → switches between light / dark palettes
 *   • highContrast → bumps text-to-background contrast ratios
 */

import { useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { useAppContext } from '../hooks/useAppContext';
import type { ColorTokens } from './tokens';
import {
  colorsLight as lightColors,
  colorsDark,
  symbolColors,
  typography,
  spacing,
  radii,
  shadows,
  animation,
} from './tokens';
import { fonts } from './fonts';

type ScaledTypographyKey =
  | 'display'
  | 'title'
  | 'heading'
  | 'subheading'
  | 'body'
  | 'callout'
  | 'caption'
  | 'eyebrow'
  | 'tab';

type ScaledTypography = Omit<typeof typography, ScaledTypographyKey> & Record<ScaledTypographyKey, number>;

// ─── Text-size multipliers ──────────────────────────────────────────────────

const TEXT_SCALE: Record<string, number> = {
  default:  1,
  large:    1.18,
  xlarge:   1.35,
  maximum:  1.55,
};

// ─── Button-size multipliers ────────────────────────────────────────────────

const BUTTON_MIN_HEIGHT: Record<string, number> = {
  standard: 54,
  large:    68,
};

const BUTTON_ICON_SCALE: Record<string, number> = {
  standard: 1,
  large:    1.25,
};

// ─── High-contrast overrides ────────────────────────────────────────────────

const highContrastLight: Partial<ColorTokens> = {
  text:          '#000000',
  textMuted:     '#1C1C1E',
  textTertiary:  '#3C3C43',
  border:        '#000000',
  borderBlue:    '#000000',
  primary:       '#0055B3',
  primaryDark:   '#003E82',
};

const highContrastDark: Partial<ColorTokens> = {
  text:          '#FFFFFF',
  textMuted:     '#FFFFFF',
  textTertiary:  '#E6E6E6',
  border:        '#FFFFFF',
  borderBlue:    '#FFFFFF',
};

// ─── Return type ────────────────────────────────────────────────────────────

export interface ThemeValues {
  /** Effective colors (light/dark + high-contrast applied). */
  colors: ColorTokens;
  /** Scaled typography sizes. Font families and weights are unchanged. */
  typography: ScaledTypography;
  /** Text scale factor (1 = default). */
  textScale: number;
  /** Minimum height for primary action buttons. */
  buttonMinHeight: number;
  /** Multiplier for button icon sizes. */
  buttonIconScale: number;
  /** Whether the effective scheme is dark. */
  isDark: boolean;
  /** Whether high-contrast mode is on. */
  highContrast: boolean;
  /** Unchanged references for convenience. */
  spacing: typeof spacing;
  radii: typeof radii;
  shadows: typeof shadows;
  animation: typeof animation;
  fonts: typeof fonts;
  symbolColors: typeof symbolColors;
}

// ─── Hook ───────────────────────────────────────────────────────────────────

export function useTheme(): ThemeValues {
  const { state } = useAppContext();
  const systemScheme = useColorScheme();
  const { textSize, buttonSize, theme, highContrast } = state.accessibility;

  return useMemo(() => {
    // 1. Resolve effective colour scheme (explicit dark, or follow iOS when set to system)
    const isDark =
      theme === 'dark' || (theme === 'system' && systemScheme === 'dark');

    // 2. Compute colors
    let effectiveColors: ColorTokens = isDark
      ? { ...colorsDark }
      : { ...lightColors };

    if (highContrast) {
      const overrides = isDark ? highContrastDark : highContrastLight;
      effectiveColors = { ...effectiveColors, ...overrides };
    }

    // 3. Compute text scale
    const scale = TEXT_SCALE[textSize] ?? 1;

    // 4. Compute scaled typography
    const scaledTypography: ScaledTypography = {
      ...typography,
      display:    Math.round(typography.display * scale),
      title:      Math.round(typography.title * scale),
      heading:    Math.round(typography.heading * scale),
      subheading: Math.round(typography.subheading * scale),
      body:       Math.round(typography.body * scale),
      callout:    Math.round(typography.callout * scale),
      caption:    Math.round(typography.caption * scale),
      eyebrow:    Math.round(typography.eyebrow * scale),
      tab:        Math.round(typography.tab * scale),
    };

    // 5. Compute button sizing
    const buttonMinHeight = BUTTON_MIN_HEIGHT[buttonSize] ?? 54;
    const buttonIconScale = BUTTON_ICON_SCALE[buttonSize] ?? 1;

    return {
      colors: effectiveColors,
      typography: scaledTypography,
      textScale: scale,
      buttonMinHeight,
      buttonIconScale,
      isDark,
      highContrast,
      spacing,
      radii,
      shadows,
      animation,
      fonts,
      symbolColors,
    };
  }, [textSize, buttonSize, theme, highContrast, systemScheme]);

}
