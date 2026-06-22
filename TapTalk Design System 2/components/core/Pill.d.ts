import * as React from 'react';

export interface PillProps {
  label?: string;
  children?: React.ReactNode;
  /** Selected state — primary fill, white label. */
  selected?: boolean;
  onClick?: () => void;
  style?: React.CSSProperties;
}

/**
 * Selectable pill / chip for categories and segmented choices.
 * Use a row of these for AAC board categories or filter sets.
 */
export function Pill(props: PillProps): JSX.Element;
