import React from 'react';

/**
 * TapTalk text input. 48px min height, 1.5px border, soft-grey fill.
 * Supports label, helper/error text, and a shake-on-error state.
 */
export function TextField({
  label,
  helper,
  error,
  value,
  onChange,
  placeholder,
  type = 'text',
  white = false,
  disabled = false,
  style,
  ...rest
}) {
  const [focused, setFocused] = React.useState(false);
  const hasError = Boolean(error);

  const borderColor = hasError
    ? 'var(--tt-danger)'
    : focused
      ? 'var(--tt-primary)'
      : 'var(--tt-border)';

  return (
    <label style={{ display: 'block', fontFamily: 'var(--tt-font-base)', ...style }}>
      {label && (
        <span style={{
          display: 'block',
          fontFamily: 'var(--tt-font-display)',
          fontWeight: 700,
          fontSize: 13,
          letterSpacing: '0.2px',
          color: 'var(--tt-primary)',
          textTransform: 'uppercase',
          marginBottom: 6,
        }}>{label}</span>
      )}
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          width: '100%',
          boxSizing: 'border-box',
          minHeight: 48,
          padding: '10px 14px',
          fontSize: 17,
          fontFamily: 'var(--tt-font-base)',
          color: 'var(--tt-text)',
          background: white ? 'var(--tt-input-bg-white)' : 'var(--tt-input-bg)',
          border: `1.5px solid ${borderColor}`,
          borderRadius: 'var(--tt-radius-input)',
          outline: 'none',
          opacity: disabled ? 0.55 : 1,
          animation: hasError ? 'tt-shake 0.4s ease' : 'none',
          transition: 'border-color 150ms ease',
        }}
        {...rest}
      />
      {(helper || error) && (
        <span style={{
          display: 'block',
          marginTop: 5,
          fontSize: 13,
          color: hasError ? 'var(--tt-danger)' : 'var(--tt-text-tertiary)',
        }}>{error || helper}</span>
      )}
    </label>
  );
}
