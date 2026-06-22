import * as React from 'react';

export interface TextFieldProps {
  /** Uppercase field label shown above the input. */
  label?: string;
  /** Helper text below the field (tertiary colour). */
  helper?: string;
  /** Error message — turns the border red and triggers a shake. */
  error?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  type?: string;
  /** Use the white fill variant instead of the default grey. */
  white?: boolean;
  disabled?: boolean;
  style?: React.CSSProperties;
}

/**
 * Single-line text input with label, helper, and error/shake state.
 * Use for all form entry (name, email, PIN, verification codes).
 */
export function TextField(props: TextFieldProps): JSX.Element;
