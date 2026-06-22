import React from 'react';

/**
 * Selectable pill / chip. Used for categories, options, and segmented choices.
 * Selected = primary fill + white label; idle = surface + muted label.
 */
export function Pill({ label, children, selected = false, onClick, style, ...rest }) {
  const [pressed, setPressed] = React.useState(false);
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 34,
        padding: '0 16px',
        fontSize: 13,
        fontFamily: 'var(--tt-font-display)',
        fontWeight: 700,
        color: selected ? 'var(--tt-text-on-dark)' : 'var(--tt-text-muted)',
        background: selected ? 'var(--tt-primary)' : 'var(--tt-surface)',
        border: selected ? '1.5px solid var(--tt-primary)' : '1.5px solid var(--tt-border)',
        borderRadius: 'var(--tt-radius-pill)',
        cursor: 'pointer',
        transform: pressed ? 'scale(0.97)' : 'scale(1)',
        transition: 'transform 120ms ease, background 120ms ease',
        WebkitTapHighlightColor: 'transparent',
        ...style,
      }}
      {...rest}
    >
      {label ?? children}
    </button>
  );
}
