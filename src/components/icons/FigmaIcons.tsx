/**
 * Icons exported directly from the Figma file
 *   `https://www.figma.com/design/8MV1zloECN6SJiA5FeCNze` → node `86:271`
 * Path data is taken verbatim from the SVG exports so the icons are pixel-
 * identical to the source design. Each component preserves the original
 * Figma artboard dimensions and is sized via the `size` prop while keeping
 * the same aspect ratio.
 */

import React from 'react';
import Svg, { Path, Rect } from 'react-native-svg';
import { colors } from '../../theme/tokens';

// ─── Backspace (used inside the "Tap to speak" card) ─────────────────────────
// Figma node 86:293 — viewBox 45×30, fill error_colour_red (#F3312A).

export function BackspaceIcon({ size = 45, color = colors.danger }: { size?: number; color?: string }) {
  const w = size;
  const h = (size * 30) / 45;
  return (
    <Svg width={w} height={h} viewBox="0 0 45 30" fill="none">
      <Path
        d="M21.15 22.5L27 17.625L32.85 22.5L36 19.875L30.15 15L36 10.125L32.85 7.5L27 12.375L21.15 7.5L18 10.125L23.85 15L18 19.875L21.15 22.5ZM13.5 30L0 15L13.5 0H45V30H13.5ZM5.625 15L15.75 26.25H40.5V3.75H15.75L5.625 15Z"
        fill={color}
      />
    </Svg>
  );
}

// ─── Red filled trash button ─────────────────────────────────────────────────
// Figma node 86:295 — 39×39 rounded square, fill #D62124, white bin glyph.

export function TrashButtonIcon({ size = 39 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 39 39" fill="none">
      <Rect width={39} height={39} rx={5} fill="#D62124" />
      <Path
        d="M9.21429 30C9.21429 30.7956 9.57551 31.5587 10.2185 32.1213C10.8615 32.6839 11.7335 33 12.6429 33H26.3571C27.2665 33 28.1385 32.6839 28.7815 32.1213C29.4245 31.5587 29.7857 30.7956 29.7857 30V12H9.21429V30ZM12.6429 15H26.3571V30H12.6429V15ZM25.5 7.5L23.7857 6H15.2143L13.5 7.5H7.5V10.5H31.5V7.5H25.5Z"
        fill="#FFFFFF"
      />
    </Svg>
  );
}

// ─── Green filled save / download-into-folder button ─────────────────────────
// Figma node 86:297 — 40×40 rounded square, fill #18B318, white outline glyph.

export function SaveButtonIcon({ size = 40 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      <Rect width={40} height={40} rx={5} fill="#18B318" />
      <Path
        d="M14.4444 11.875H10.2778C9.54107 11.875 8.83453 12.2174 8.31359 12.8269C7.79266 13.4364 7.5 14.263 7.5 15.125V29.75C7.5 30.612 7.79266 31.4386 8.31359 32.0481C8.83453 32.6576 9.54107 33 10.2778 33H29.7222C30.4589 33 31.1655 32.6576 31.6864 32.0481C32.2073 31.4386 32.5 30.612 32.5 29.75V15.125C32.5 14.263 32.2073 13.4364 31.6864 12.8269C31.1655 12.2174 30.4589 11.875 29.7222 11.875H25.5556M15.8333 18.375L20 23.25L24.1667 18.375M20 23.25V7"
        stroke="#FFFFFF"
        strokeWidth={3}
        strokeLinecap="square"
        strokeLinejoin="round"
        fill="none"
      />
    </Svg>
  );
}
