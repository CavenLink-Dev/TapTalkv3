import * as React from 'react';

export interface CheckboxProps {
  checked?: boolean;
  onChange?: (next: boolean) => void;
  /** Optional inline label to the right of the box. */
  label?: string;
  disabled?: boolean;
  style?: React.CSSProperties;
}

/**
 * Rounded checkbox with an animated check. Use for consent rows and
 * completable task / list items.
 */
export function Checkbox(props: CheckboxProps): JSX.Element;
