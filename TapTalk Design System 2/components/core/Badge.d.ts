import * as React from 'react';

export interface BadgeProps {
  label?: string;
  children?: React.ReactNode;
  /** Colour tone. @default 'neutral' */
  tone?: 'neutral' | 'primary' | 'success' | 'warning' | 'danger';
  /** Solid fill (white text) instead of soft tint. */
  solid?: boolean;
  style?: React.CSSProperties;
}

/**
 * Compact status badge / tag. Use for streaks, counts, plan labels
 * ("Free forever", "PREMIUM"), and inline status.
 */
export function Badge(props: BadgeProps): JSX.Element;
