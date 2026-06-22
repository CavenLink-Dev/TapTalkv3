import React from 'react';

/**
 * Small status badge / tag. Tones: neutral, primary, success, warning, danger.
 * Use for counts, streaks, "PREMIUM", "Free forever", status labels.
 */
export function Badge({ label, children, tone = 'neutral', solid = false, style, ...rest }) {
  const tones = {
    neutral: { fg: 'var(--tt-text-muted)',    bg: 'var(--tt-input-bg)',          solidBg: 'var(--tt-text-muted)' },
    primary: { fg: 'var(--tt-primary-dark)',  bg: 'rgba(25,154,238,0.14)',       solidBg: 'var(--tt-primary)' },
    success: { fg: '#1B7F3B',                 bg: 'rgba(48,209,88,0.16)',        solidBg: 'var(--tt-success)' },
    warning: { fg: '#9A5800',                 bg: 'rgba(255,149,0,0.16)',        solidBg: 'var(--tt-warning)' },
    danger:  { fg: '#B71E18',                 bg: 'rgba(243,49,42,0.14)',        solidBg: 'var(--tt-danger)' },
  };
  const t = tones[tone] || tones.neutral;
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        height: 24,
        padding: '0 10px',
        fontSize: 12,
        fontFamily: 'var(--tt-font-display)',
        fontWeight: 800,
        letterSpacing: '0.2px',
        color: solid ? '#fff' : t.fg,
        background: solid ? t.solidBg : t.bg,
        borderRadius: 'var(--tt-radius-pill)',
        ...style,
      }}
      {...rest}
    >
      {label ?? children}
    </span>
  );
}
