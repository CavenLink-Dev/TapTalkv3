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
 *   • theme      → switches between light / dark / system palettes
 *   • highContrast → bumps text-to-background contrast ratios
 */

import { useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { useAppContext } from '../hooks/useAppContext';
import {
  colors as lightColors,
  symbolColors,
  typography,
  spacing,
  radii,
  shadows,
  animation,
} from './tokens';
import { fonts } from './fonts';

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

// ─── Dark palette ───────────────────────────────────────────────────────────

const darkColors: typeof lightColors = {
  ...lightColors,

  // UI foundation
  background:      '#000000',
  surface:         '#1C1C1E',
  navBackground:   '#1C1C1E',

  // Brand / interactive (keep brand hue, lighten for dark bg)
  primary:         '#4DB8FF',
  primaryDark:     '#66BFFF',
  primaryPressed:  '#2E9AEE',
  softBlue:        '#1E3A5F',

  // Text
  text:            '#F5F5F7',
  textMuted:       '#A1A1A6',
  textTertiary:    '#8E8E93',
  textOnDark:      '#FFFFFF',

  // Inputs / surfaces
  inputBg:         '#2C2C2E',
  inputBgWhite:    '#2C2C2E',
  input:           '#2C2C2E',

  // Progress
  progressFill:    '#4DB8FF',
  progressTrack:   '#2C3E50',

  // Borders
  border:          '#48484A',
  symbolOutline:   '#A1A1A6',
  borderBlue:      '#48484A',

  // Status
  danger:          '#FF6961',
  success:         '#32D74B',
  warning:         '#FFD60A',
  disabled:        '#3A3A3C',

  // Folders
  folderBg:        '#B8A830',
  folderFlap:      'rgba(255,255,255,0.12)',
  folderFlapSecondary: '#3A3820',
};

// ─── High-contrast overrides ────────────────────────────────────────────────

const highContrastLight: Partial<typeof lightColors> = {
  text:          '#000000',
  textMuted:     '#1C1C1E',
  textTertiary:  '#3C3C43',
  border:        '#000000',
  borderBlue:    '#000000',
  primary:       '#0055B3',
  primaryDark:   '#003E82',
};

const highContrastDark: Partial<typeof lightColors> = {
  text:          '#FFFFFF',
  textMuted:     '#E5E5EA',
  textTertiary:  '#D1D1D6',
  border:        '#D1D1D6',
  borderBlue:    '#D1D1D6',
  primary:       '#64D2FF',
  primaryDark:   '#99E6FF',
};

// ─── Return type ────────────────────────────────────────────────────────────

export interface ThemeValues {
  /** Effective colors (light/dark + high-contrast applied). */
  colors: typeof lightColors;
  /** Scaled typography sizes. Font families and weights are unchanged. */
  typography: typeof typography;
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
    // 1. Resolve effective colour scheme
    const effectiveScheme =
      theme === 'system' ? (systemScheme ?? 'light') : theme;
    const isDark = effectiveScheme === 'dark';

    // 2. Compute colors
    let effectiveColors: typeof lightColors = isDark
      ? { ...darkColors }
      : { ...lightColors };

    if (highContrast) {
      const overrides = isDark ? highContrastDark : highContrastLight;
      effectiveColors = { ...effectiveColors, ...overrides };
    }

    // 3. Compute text scale
    const scale = TEXT_SCALE[textSize] ?? 1;

    // 4. Compute scaled typography
    const scaledTypography = {
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
