import React from 'react';

/**
 * Checkbox with rounded box and animated check. Used for consent rows and
 * task completion. 28px box for an easy tap target.
 */
export function Checkbox({ checked = false, onChange, label, disabled = false, style, ...rest }) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => !disabled && onChange && onChange(!checked)}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 10,
        padding: 0,
        border: 'none',
        background: 'transparent',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        textAlign: 'left',
        ...style,
      }}
      {...rest}
    >
      <span
        style={{
          width: 28,
          height: 28,
          flex: 'none',
          borderRadius: 8,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: checked ? 'var(--tt-success)' : 'var(--tt-surface)',
          border: checked ? '2px solid var(--tt-success)' : '2px solid var(--tt-border)',
          transition: 'background 150ms ease, border-color 150ms ease',
        }}
      >
        {checked && (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M3 8.5L6.5 12L13 4.5" stroke="#fff" strokeWidth="2.5"
              strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </span>
      {label && (
        <span style={{
          fontFamily: 'var(--tt-font-base)',
          fontSize: 15,
          color: 'var(--tt-text-muted)',
        }}>{label}</span>
      )}
    </button>
  );
}
