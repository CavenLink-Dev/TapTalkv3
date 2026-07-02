/**
 * Icons exported directly from the Figma file
 *   `https://www.figma.com/design/8MV1zloECN6SJiA5FeCNze` → node `86:271`
 * Path data is taken verbatim from the SVG exports so the icons are pixel-
 * identical to the source design. Each component preserves the original
 * Figma artboard dimensions and is sized via the `size` prop while keeping
 * the same aspect ratio.
 */

import React from 'react';
import { Image } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';
import { useTheme } from '../../theme/useTheme';

const SETTING_BOARD_SOURCE = require('../../assets/icons/setting-board.png');

// ─── Backspace (used inside the "Tap to speak" card) ─────────────────────────
// Figma node 86:293 — viewBox 45×30, fill error_colour_red (#F3312A).

export function BackspaceIcon({ size = 45, color }: { size?: number; color?: string }) {
  const t = useTheme();
  const fill = color ?? t.colors.danger;
  const w = size;
  const h = (size * 30) / 45;
  return (
    <Svg width={w} height={h} viewBox="0 0 45 30" fill="none">
      <Path
        d="M21.15 22.5L27 17.625L32.85 22.5L36 19.875L30.15 15L36 10.125L32.85 7.5L27 12.375L21.15 7.5L18 10.125L23.85 15L18 19.875L21.15 22.5ZM13.5 30L0 15L13.5 0H45V30H13.5ZM5.625 15L15.75 26.25H40.5V3.75H15.75L5.625 15Z"
        fill={fill}
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

// ─── Board Back button (user-provided "Controls Previous" icon, greyed) ───────

export function BoardBackIcon({ size = 36 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        fill="#9AA3AB"
        d="M22.9998 20.8765c0.0001 0.1843 -0.0531 0.3647 -0.1532 0.5195 -0.0999 0.1548 -0.2425 0.2774 -0.4105 0.353 -0.1681 0.0757 -0.3544 0.1013 -0.5365 0.0736 -0.1822 -0.0277 -0.3526 -0.1074 -0.4905 -0.2297l-10.034 -8.8765c-0.1017 -0.0897 -0.1832 -0.2001 -0.2391 -0.3238 -0.0558 -0.1237 -0.0847 -0.2578 -0.0847 -0.3936 0 -0.1356 0.0289 -0.2698 0.0847 -0.3935 0.0559 -0.1237 0.1374 -0.2341 0.2391 -0.3239l10.034 -8.87647c0.1381 -0.12229 0.3086 -0.20204 0.4909 -0.22967 0.1824 -0.02762 0.3688 -0.00193 0.537 0.07398 0.168 0.07592 0.3106 0.19881 0.4105 0.35388 0.0999 0.15508 0.1528 0.33572 0.1523 0.52016V20.8765Z"
      />
      <Path
        fill="#9AA3AB"
        d="M5.78262 1h-3.8261C1.42825 1 1 1.42825 1 1.95652V22.0435c0 0.5283 0.42825 0.9565 0.95652 0.9565h3.8261c0.52826 0 0.95652 -0.4282 0.95652 -0.9565V1.95652C6.73914 1.42825 6.31088 1 5.78262 1Z"
      />
      <Path
        fill="#BDC4CA"
        d="M22.9997 3.12347V12H11.0528c-0.0011 -0.136 0.0275 -0.2706 0.0837 -0.3945 0.0561 -0.1239 0.1386 -0.2341 0.2415 -0.3229l10.0339 -8.87653c0.1381 -0.12132 0.3082 -0.20028 0.49 -0.22743 0.1819 -0.02714 0.3676 -0.00134 0.5351 0.07435 0.1676 0.07569 0.3097 0.19804 0.4095 0.35241 0.0998 0.15439 0.153 0.33424 0.1532 0.51807Z"
      />
      <Path
        fill="#BDC4CA"
        d="M6.73914 1.95652V12H1V1.95652c0 -0.25369 0.10078 -0.49698 0.28016 -0.67636C1.45954 1.10078 1.70283 1 1.95652 1h3.8261c0.25368 0 0.49698 0.10078 0.67636 0.28016 0.17938 0.17938 0.28016 0.42267 0.28016 0.67636Z"
      />
      <Path
        stroke="#5A6370"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M22.9998 20.8765c0.0001 0.1843 -0.0531 0.3647 -0.1532 0.5195 -0.0999 0.1548 -0.2425 0.2774 -0.4105 0.353 -0.1681 0.0757 -0.3544 0.1013 -0.5365 0.0736 -0.1822 -0.0277 -0.3526 -0.1074 -0.4905 -0.2297l-10.034 -8.8765c-0.1017 -0.0897 -0.1832 -0.2001 -0.2391 -0.3238 -0.0558 -0.1237 -0.0847 -0.2578 -0.0847 -0.3936 0 -0.1356 0.0289 -0.2698 0.0847 -0.3935 0.0559 -0.1237 0.1374 -0.2341 0.2391 -0.3239l10.034 -8.87647c0.1381 -0.12229 0.3086 -0.20204 0.4909 -0.22967 0.1824 -0.02762 0.3688 -0.00193 0.537 0.07398 0.168 0.07592 0.3106 0.19881 0.4105 0.35388 0.0999 0.15508 0.1528 0.33572 0.1523 0.52016V20.8765Z"
        strokeWidth={1}
      />
      <Path
        stroke="#5A6370"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M5.78262 1h-3.8261C1.42825 1 1 1.42825 1 1.95652V22.0435c0 0.5283 0.42825 0.9565 0.95652 0.9565h3.8261c0.52826 0 0.95652 -0.4282 0.95652 -0.9565V1.95652C6.73914 1.42825 6.31088 1 5.78262 1Z"
        strokeWidth={1}
      />
    </Svg>
  );
}

// ─── Board Settings button (Figma AAC BOARD gear, tinted to match dock) ───────

export function BoardSettingIcon({ size = 22, color }: { size?: number; color?: string }) {
  const t = useTheme();
  const tint = color ?? t.colors.text;
  // Slight optical bump so the filled gear matches stroke icon footprint at the same `size`.
  const renderSize = Math.round(size * 1.12);
  return (
    <Image
      source={SETTING_BOARD_SOURCE}
      style={{ width: renderSize, height: renderSize, tintColor: tint }}
      resizeMode="contain"
      accessibilityElementsHidden
      importantForAccessibility="no"
    />
  );
}

// ─── Board Home button (simple house outline, greyed) ─────────────────────────

export function BoardHomeIcon({ size = 36 }: { size?: number }) {
  // Viewbox tightened to the actual artwork bounds (3,3 → 21,21) so the
  // glyph fills the rendered box edge-to-edge — matches BoardBackIcon's
  // optical weight at the same `size` prop.
  return (
    <Svg width={size} height={size} viewBox="2 2 20 20" fill="none">
      <Path
        fill="#BDC4CA"
        d="M12 3L3 10.5V21h6v-6h6v6h6V10.5L12 3Z"
      />
      <Path
        stroke="#5A6370"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.3}
        d="M3 10.5L12 3l9 7.5V21h-6v-6H9v6H3V10.5Z"
      />
    </Svg>
  );
}
