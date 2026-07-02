/**
 * Icon — Custom SVG icon wrapper.
 *
 * Replaces Ionicons with embedded SVG paths. Each SVG is inline so we
 * have full control over stroke, size, and color. Inherits text colour
 * from parent if no colour prop is given.
 */

import React from 'react';
import Svg, { Polyline, Line, Path } from 'react-native-svg';
import { BoardSettingIcon } from '../icons/FigmaIcons';

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
    /** Figma AAC BOARD gear — tinted raster, matches dock symbol colour. */
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
    default:
      console.warn(`Icon "${name}" not found in library`);
      return null;
  }
}
