import * as React from 'react';

export interface CardProps {
  children?: React.ReactNode;
  /** Corner radius preset. @default 'card' */
  radius?: 'card' | 'bg' | 'sheet';
  /** Interior padding in px. @default 16 */
  padding?: number;
  /** Show the hairline border. @default true */
  border?: boolean;
  style?: React.CSSProperties;
}

/**
 * White content surface with soft rounding and a subtle shadow.
 * The default container for grouped content (forms, settings rows, stats).
 */
export function Card(props: CardProps): JSX.Element;
