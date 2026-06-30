/**
 * TapTalk original AAC symbol library.
 *
 * Hand-drawn minimalist stick-figure pictograms, designed in code with
 * react-native-svg so they scale crisply at any size. All paths are
 * original work for TapTalk — no third-party symbol set is referenced.
 *
 * Style rules (for consistency across the set):
 *   • 64 × 64 viewBox
 *   • 2.6 stroke width, black, rounded caps
 *   • Head: circle r ≈ 6 at y ≈ 14
 *   • Body line: 32,20 → 32,42
 *   • Hips → feet at y = 56
 *   • Small accents (arrow, plus, etc) in TapTalk primary blue
 */

import React from 'react';
import Svg, { Circle, Line, Path, G, Polyline } from 'react-native-svg';
import { useTheme } from '../../theme/useTheme';

const STROKE       = '#0F0F0F';
const STROKE_WIDTH = 2.6;

type IconProps = { size?: number };

// ─── Shared body skeleton ─────────────────────────────────────────────────────
function Body({ leftArm, rightArm }: {
  leftArm:  { x: number; y: number };
  rightArm: { x: number; y: number };
}) {
  return (
    <G stroke={STROKE} strokeWidth={STROKE_WIDTH} strokeLinecap="round" fill="none">
      <Circle cx={32} cy={14} r={6} />
      <Line x1={32} y1={20} x2={32} y2={42} />
      <Line x1={32} y1={26} x2={leftArm.x}  y2={leftArm.y}  />
      <Line x1={32} y1={26} x2={rightArm.x} y2={rightArm.y} />
      <Line x1={32} y1={42} x2={22}         y2={56} />
      <Line x1={32} y1={42} x2={42}         y2={56} />
    </G>
  );
}

// ─── "I" — figure pointing at own chest ───────────────────────────────────────
export function SymbolI({ size = 64 }: IconProps) {
  const t = useTheme();
  const accent = t.colors.primaryDark;
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      <Body leftArm={{ x: 20, y: 36 }} rightArm={{ x: 30, y: 34 }} />
      {/* Index finger pointing at chest */}
      <Circle cx={30} cy={34} r={2.2} fill={accent} />
    </Svg>
  );
}

// ─── "you" — figure pointing forward (out of frame) ──────────────────────────
export function SymbolYou({ size = 64 }: IconProps) {
  const t = useTheme();
  const accent = t.colors.primaryDark;
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      <Body leftArm={{ x: 22, y: 36 }} rightArm={{ x: 54, y: 24 }} />
      {/* Pointer arrowhead at outstretched hand */}
      <G stroke={accent} strokeWidth={STROKE_WIDTH} strokeLinecap="round" fill="none">
        <Polyline points="50,20 56,24 50,28" />
      </G>
    </Svg>
  );
}

// ─── "want" — figure with both arms outstretched, palms up ────────────────────
export function SymbolWant({ size = 64 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      <Body leftArm={{ x: 16, y: 34 }} rightArm={{ x: 48, y: 34 }} />
      {/* Open palms — small horizontal lines */}
      <G stroke={STROKE} strokeWidth={STROKE_WIDTH} strokeLinecap="round" fill="none">
        <Line x1={12} y1={32} x2={20} y2={36} />
        <Line x1={44} y1={36} x2={52} y2={32} />
      </G>
    </Svg>
  );
}

// ─── "go" — figure mid-stride with a forward arrow ────────────────────────────
export function SymbolGo({ size = 64 }: IconProps) {
  const t = useTheme();
  const accent = t.colors.primaryDark;
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      <G stroke={STROKE} strokeWidth={STROKE_WIDTH} strokeLinecap="round" fill="none">
        <Circle cx={26} cy={14} r={6} />
        <Line x1={26} y1={20} x2={26} y2={40} />
        {/* Arm swung back */}
        <Line x1={26} y1={26} x2={16} y2={34} />
        {/* Arm reaching forward */}
        <Line x1={26} y1={26} x2={36} y2={22} />
        {/* Front leg forward */}
        <Line x1={26} y1={40} x2={38} y2={54} />
        {/* Back leg trailing */}
        <Line x1={26} y1={40} x2={16} y2={54} />
      </G>
      {/* Motion arrow */}
      <G stroke={accent} strokeWidth={STROKE_WIDTH} strokeLinecap="round" fill="none">
        <Line x1={42} y1={34} x2={56} y2={34} />
        <Polyline points="52,30 56,34 52,38" />
      </G>
    </Svg>
  );
}

// ─── "more" — figure plus a "+" sign next to it ───────────────────────────────
export function SymbolMore({ size = 64 }: IconProps) {
  const t = useTheme();
  const accent = t.colors.primaryDark;
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      <G stroke={STROKE} strokeWidth={STROKE_WIDTH} strokeLinecap="round" fill="none">
        <Circle cx={22} cy={16} r={5.5} />
        <Line x1={22} y1={21.5} x2={22} y2={40} />
        <Line x1={22} y1={28}   x2={14} y2={34} />
        <Line x1={22} y1={28}   x2={30} y2={34} />
        <Line x1={22} y1={40}   x2={14} y2={54} />
        <Line x1={22} y1={40}   x2={30} y2={54} />
      </G>
      {/* "+" sign */}
      <G stroke={accent} strokeWidth={STROKE_WIDTH + 0.6} strokeLinecap="round" fill="none">
        <Line x1={46} y1={24} x2={46} y2={42} />
        <Line x1={37} y1={33} x2={55} y2={33} />
      </G>
    </Svg>
  );
}

// ─── "help" — figure with both arms raised in SOS posture ─────────────────────
export function SymbolHelp({ size = 64 }: IconProps) {
  const t = useTheme();
  const accent = t.colors.primaryDark;
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      <Body leftArm={{ x: 18, y: 12 }} rightArm={{ x: 46, y: 12 }} />
      {/* Speech mark — small exclamation above head */}
      <G stroke={accent} strokeWidth={STROKE_WIDTH + 0.4} strokeLinecap="round" fill={accent}>
        <Line x1={32} y1={2} x2={32} y2={6} />
      </G>
    </Svg>
  );
}

// ─── "stop" — open palm + stop sign behind ────────────────────────────────────
export function SymbolStop({ size = 64 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      {/* Hexagonal stop sign */}
      <Path
        d="M22 8 L42 8 L54 20 L54 40 L42 52 L22 52 L10 40 L10 20 Z"
        fill="#E33B33"
        stroke={STROKE}
        strokeWidth={STROKE_WIDTH}
        strokeLinejoin="round"
      />
      {/* Hand inside */}
      <G stroke="#FFFFFF" strokeWidth={STROKE_WIDTH + 0.4} strokeLinecap="round" fill="none">
        <Path d="M26 38 L26 22 M30 38 L30 18 M34 38 L34 18 M38 38 L38 22 M22 32 Q22 42 32 44 Q42 42 42 32" />
      </G>
    </Svg>
  );
}

/** Master export — useful when you want to lookup by label. */
export const SYMBOL_LIBRARY = {
  i:    SymbolI,
  you:  SymbolYou,
  want: SymbolWant,
  go:   SymbolGo,
  more: SymbolMore,
  help: SymbolHelp,
  stop: SymbolStop,
} as const;

export type SymbolKey = keyof typeof SYMBOL_LIBRARY;
