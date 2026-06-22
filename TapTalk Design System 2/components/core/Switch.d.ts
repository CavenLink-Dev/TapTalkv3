import * as React from 'react';

export interface SwitchProps {
  checked?: boolean;
  onChange?: (next: boolean) => void;
  disabled?: boolean;
  style?: React.CSSProperties;
}

/**
 * iOS-style on/off toggle. Use for settings like parental lock, sound,
 * and activity enable/disable.
 */
export function Switch(props: SwitchProps): JSX.Element;
