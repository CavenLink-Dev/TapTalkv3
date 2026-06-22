import * as React from 'react';

export interface ProgressBarProps {
  /** Overall progress, 0–1. */
  value?: number;
  /** 1 = single pill; 2 = onboarding two-phase bar. @default 1 */
  segments?: 1 | 2;
  /** Pill height in px. @default 16 */
  height?: number;
  /** Fill colour (use a status colour for password strength). */
  color?: string;
  style?: React.CSSProperties;
}

/**
 * Pill-shaped progress bar with a spring fill. Single mode for loading /
 * password strength; two-phase mode for the registration flow.
 */
export function ProgressBar(props: ProgressBarProps): JSX.Element;
