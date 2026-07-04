/**
 * Icon — Custom SVG icon wrapper.
 *
 * Replaces Ionicons with embedded SVG paths. Each SVG is inline so we
 * have full control over stroke, size, and color. Inherits text colour
 * from parent if no colour prop is given.
 */

import React from 'react';
import Svg, { Polyline, Line, Path } from 'react-native-svg';
import { BackOutIcon, BoardIcon, BoardSettingIcon } from '../icons/FigmaIcons';

interface IconProps {
  name: string;
  size?: number;
  color?: string;
  /** Stroke width — default 2. Dock controls use 4 (2×). */
  strokeWidth?: number;
}

export function Icon({ name, size = 24, color, strokeWidth = 2 }: IconProps) {
  const strokeColor = color || '#000000';

  switch (name) {
    case 'chevron-right':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Polyline points="9,18 15,12 9,6" stroke={strokeColor} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );
    case 'chevron-left':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Polyline points="15,18 9,12 15,6" stroke={strokeColor} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );
    case 'chevron-up':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Polyline points="18,15 12,9 6,15" stroke={strokeColor} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );
    case 'chevron-down':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Polyline points="6,9 12,15 18,9" stroke={strokeColor} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );
    case 'chevron-back':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Polyline points="15,18 9,12 15,6" stroke={strokeColor} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );
    case 'chevron-back-double':
    case 'back-out':
      return <BackOutIcon size={size} color={strokeColor} />;
    case 'sort':
      // Sort control — artwork from src/assets/icons/sort.svg.
      return (
        <Svg width={size} height={size} viewBox="0 0 512 512" fill="none">
          <Path
            fill={strokeColor}
            fillRule="evenodd"
            d="M85.333 149.333c0-23.564 19.103-42.666 42.667-42.666s42.667 19.102 42.667 42.666S151.564 192 128 192s-42.667-19.103-42.667-42.667M128 64c-47.128 0-85.333 38.205-85.333 85.333S80.872 234.667 128 234.667s85.333-38.205 85.333-85.334C213.333 102.205 175.128 64 128 64m341.333 106.667H234.667V128h234.666zM234.667 341.333h234.666V384H234.667zM128 448c47.128 0 85.333-38.206 85.333-85.333c0-47.128-38.205-85.334-85.333-85.334s-85.333 38.206-85.333 85.334S80.872 448 128 448"
          />
        </Svg>
      );
    case 'add':
    case 'plus':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Line x1="12" y1="5" x2="12" y2="19" stroke={strokeColor} strokeWidth={strokeWidth} strokeLinecap="round" />
          <Line x1="5" y1="12" x2="19" y2="12" stroke={strokeColor} strokeWidth={strokeWidth} strokeLinecap="round" />
        </Svg>
      );
    case 'remove':
    case 'minus':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Line x1="5" y1="12" x2="19" y2="12" stroke={strokeColor} strokeWidth={strokeWidth} strokeLinecap="round" />
        </Svg>
      );
    case 'checkmark':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Polyline points="20,6 9,17 4,12" stroke={strokeColor} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );
    case 'close':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Line x1="18" y1="6" x2="6" y2="18" stroke={strokeColor} strokeWidth={strokeWidth} strokeLinecap="round" />
          <Line x1="6" y1="6" x2="18" y2="18" stroke={strokeColor} strokeWidth={strokeWidth} strokeLinecap="round" />
        </Svg>
      );
    /** Board dock gear — tinted raster, matches dock symbol colour. */
    case 'board':
      return <BoardIcon size={size} color={strokeColor} />;
    /** Settings gear — tinted raster (board settings screen, etc.). */
    case 'setting':
    case 'settings':
      return <BoardSettingIcon size={size} color={strokeColor} />;
    case 'refresh':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Polyline points="23,4 23,10 17,10" stroke={strokeColor} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
          <Polyline points="1,20 1,14 7,14" stroke={strokeColor} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
          <Path d="M3.51 9a9 9 0 0 1 14.85-3.36M20.49 15a9 9 0 0 1-14.85 3.36" stroke={strokeColor} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );
    case 'warning':
    case 'warning-outline':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3.04h16.94a2 2 0 0 0 1.71-3.04l-8.47-14.14a2 2 0 0 0-3.42 0z" stroke={strokeColor} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
          <Line x1="12" y1="9" x2="12" y2="13" stroke={strokeColor} strokeWidth={strokeWidth} strokeLinecap="round" />
          <Line x1="12" y1="17" x2="12.01" y2="17" stroke={strokeColor} strokeWidth={strokeWidth} strokeLinecap="round" />
        </Svg>
      );
    case 'edit':
    case 'pencil':
      // Calm pencil-in-square glyph — inherits `strokeColor` from dock tint
      // so it matches Add / Sort / Board / Hide in every state.
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path
            d="M20 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h5"
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path
            d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      );
    case 'move':
      // Four-way arrow — indicates "move selected items".
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Polyline points="5,9 2,12 5,15" stroke={strokeColor} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
          <Polyline points="9,5 12,2 15,5" stroke={strokeColor} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
          <Polyline points="15,19 12,22 9,19" stroke={strokeColor} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
          <Polyline points="19,9 22,12 19,15" stroke={strokeColor} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
          <Line x1="2" y1="12" x2="22" y2="12" stroke={strokeColor} strokeWidth={strokeWidth} strokeLinecap="round" />
          <Line x1="12" y1="2" x2="12" y2="22" stroke={strokeColor} strokeWidth={strokeWidth} strokeLinecap="round" />
        </Svg>
      );
    case 'resize':
      // Diagonal expand — indicates "resize handles active".
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Polyline points="15,3 21,3 21,9" stroke={strokeColor} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
          <Polyline points="9,21 3,21 3,15" stroke={strokeColor} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
          <Line x1="21" y1="3" x2="14" y2="10" stroke={strokeColor} strokeWidth={strokeWidth} strokeLinecap="round" />
          <Line x1="3" y1="21" x2="10" y2="14" stroke={strokeColor} strokeWidth={strokeWidth} strokeLinecap="round" />
        </Svg>
      );
    case 'select':
      // Circle + tick — matches the on-tile selection indicator.
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path d="M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z" stroke={strokeColor} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
          <Polyline points="8,12.5 11,15.5 16,9.5" stroke={strokeColor} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );
    default:
      console.warn(`Icon "${name}" not found in library`);
      return null;
  }
}
