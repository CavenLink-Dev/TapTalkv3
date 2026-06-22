import React from 'react';

/**
 * iOS-style toggle switch. On = primary fill; off = soft-blue track.
 * 44px wide track meets the minimum touch target with surrounding padding.
 */
export function Switch({ checked = false, onChange, disabled = false, style, ...rest }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => !disabled && onChange && onChange(!checked)}
      style={{
        position: 'relative',
        width: 51,
        height: 31,
        flex: 'none',
        padding: 0,
        border: 'none',
        borderRadius: 999,
        background: checked ? 'var(--tt-primary)' : 'var(--tt-soft-blue)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        transition: 'background 200ms ease',
        WebkitTapHighlightColor: 'transparent',
        ...style,
      }}
      {...rest}
    >
      <span
        style={{
          position: 'absolute',
          top: 2,
          left: checked ? 22 : 2,
          width: 27,
          height: 27,
          borderRadius: '50%',
          background: '#fff',
          boxShadow: '0 1px 3px rgba(0,0,0,0.25)',
          transition: 'left 200ms cubic-bezier(0.34,1.3,0.64,1)',
        }}
      />
    </button>
  );
}
