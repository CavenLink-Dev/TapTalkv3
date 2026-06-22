import * as React from 'react';

export interface ButtonProps {
  /** Button text. You may also pass children instead. */
  label?: string;
  children?: React.ReactNode;
  /** Visual style. @default 'primary' */
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  /** Size / tap target. @default 'md' */
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  /** Shows an inline spinner and blocks taps. */
  loading?: boolean;
  /** Stretch to full container width. */
  full?: boolean;
  onClick?: () => void;
  style?: React.CSSProperties;
}

/**
 * Primary action button — rounded, bold, large tap target. Use for the main
 * call-to-action on any screen (Continue, Create Account, Save).
 */
export function Button(props: ButtonProps): JSX.Element;
