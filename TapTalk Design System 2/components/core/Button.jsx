import React from 'react';

/**
 * TapTalk primary action button.
 * Rounded (10px), bold rounded-display label, large 50px min tap target.
 * Variants: primary (blue), secondary (soft-blue), danger (red), ghost.
 */
export function Button({
  label,
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  full = false,
  onClick,
  style,
  ...rest
}) {
  const [pressed, setPressed] = React.useState(false);

  const sizes = {
    sm: { minHeight: 40, fontSize: 15, padding: '0 16px' },
    md: { minHeight: 50, fontSize: 17, padding: '0 18px' },
    lg: { minHeight: 56, fontSize: 19, padding: '0 24px' },
  };

  const palettes = {
    primary:   { bg: 'var(--tt-primary)',     fg: 'var(--tt-text-on-dark)', pressBg: 'var(--tt-primary-pressed)' },
    secondary: { bg: 'var(--tt-soft-blue)',   fg: 'var(--tt-primary-dark)', pressBg: '#C4D4DE' },
    danger:    { bg: 'var(--tt-danger)',      fg: 'var(--tt-text-on-dark)', pressBg: '#FF5A54' },
    ghost:     { bg: 'transparent',           fg: 'var(--tt-primary-dark)', pressBg: 'rgba(25,154,238,0.10)' },
  };

  const p = palettes[variant] || palettes.primary;
  const s = sizes[size] || sizes.md;
  const isDisabled = disabled || loading;

  const bg = isDisabled
    ? 'var(--tt-disabled)'
    : pressed
      ? p.pressBg
      : p.bg;

  return (
    <button
      type="button"
      disabled={isDisabled}
      onClick={onClick}
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        width: full ? '100%' : 'auto',
        minHeight: s.minHeight,
        padding: s.padding,
        fontSize: s.fontSize,
        fontFamily: 'var(--tt-button-font)',
        fontWeight: 'var(--tt-button-weight)',
        letterSpacing: '-0.3px',
        color: isDisabled ? 'var(--tt-text-tertiary)' : p.fg,
        background: bg,
        border: variant === 'ghost' && !pressed ? '1.5px solid transparent' : 'none',
        borderRadius: 'var(--tt-radius-button)',
        cursor: isDisabled ? 'not-allowed' : 'pointer',
        transform: pressed && !isDisabled ? 'scale(0.97)' : 'scale(1)',
        transition: 'transform 120ms ease, background 120ms ease',
        WebkitTapHighlightColor: 'transparent',
        ...style,
      }}
      {...rest}
    >
      {loading && <Spinner color={p.fg} />}
      {!loading && (label ?? children)}
    </button>
  );
}

function Spinner({ color }) {
  return (
    <span
      aria-label="Loading"
      style={{
        width: 18,
        height: 18,
        borderRadius: '50%',
        border: `2.5px solid ${color === 'var(--tt-text-on-dark)' ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.18)'}`,
        borderTopColor: color,
        display: 'inline-block',
        animation: 'tt-spin 0.7s linear infinite',
      }}
    />
  );
}
