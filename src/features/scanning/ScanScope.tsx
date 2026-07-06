/**
 * ScanScope — wraps a region of the screen so that during an active scan
 * cycle, everything OUTSIDE the currently-scanned row is hidden from
 * VoiceOver (`accessibilityElementsHidden`).
 *
 * Why this matters: VoiceOver users who also use scanning (yes, that
 * population exists — low-vision + motor impairment is a common
 * co-occurrence) need the assistive-tech focus to follow the visual
 * scan highlight. Hiding non-scanned regions collapses the a11y tree
 * to just the active row, so a VoiceOver swipe or announce reads only
 * the tile that scanning is targeting.
 *
 * When scanning is off, or when this scope contains the active row,
 * accessibility is fully live.
 */

import React from 'react';
import { View, type ViewProps } from 'react-native';
import { useScanning } from './ScanningController';

export interface ScanScopeProps extends ViewProps {
  /**
   * The row index this scope contains. If null/undefined, the scope is
   * treated as "outside the grid" — hidden during any row/column phase.
   */
  rowIndex?: number | null;
  children: React.ReactNode;
}

export function ScanScope({
  rowIndex,
  children,
  ...rest
}: ScanScopeProps): React.ReactElement {
  const scan = useScanning();

  // Off / disabled — pass through unchanged so we don't perturb a11y for
  // users who don't use scanning at all.
  const hide =
    !!scan &&
    scan.enabled &&
    scan.running &&
    (scan.phase === 'row' || scan.phase === 'column') &&
    // Non-grid scopes always hide during scan; grid scopes hide only when
    // they aren't the active row.
    (rowIndex == null || scan.activeRow !== rowIndex);

  return (
    <View
      {...rest}
      accessibilityElementsHidden={hide}
      importantForAccessibility={hide ? 'no-hide-descendants' : 'auto'}
    >
      {children}
    </View>
  );
}
