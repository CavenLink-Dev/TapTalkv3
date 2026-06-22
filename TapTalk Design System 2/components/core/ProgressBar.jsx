import React from 'react';

/**
 * Progress bar. Single mode = one liquid pill fill (0–1 `value`).
 * Two-phase mode (`segments={2}`) mirrors the onboarding bar: parent setup
 * then child customisation, each its own pill.
 */
export function ProgressBar({ value = 0, segments = 1, height = 16, color = 'var(--tt-primary)', style }) {
  const clamp = (v) => Math.max(0, Math.min(1, v));

  if (segments === 2) {
    // value is overall 0–1; phase 1 = first 75%, phase 2 = last 25% (6 + 2 steps)
    const f1 = clamp(value / 0.75);
    const f2 = clamp((value - 0.75) / 0.25);
    return (
      <div style={{ display: 'flex', gap: 10, ...style }}>
        <Pill fraction={f1} height={height} color={color} />
        <Pill fraction={f2} height={height} color={color} />
      </div>
    );
  }
  return (
    <div style={style}>
      <Pill fraction={clamp(value)} height={height} color={color} />
    </div>
  );
}

function Pill({ fraction, height, color }) {
  return (
    <div style={{
      flex: 1,
      height,
      borderRadius: 'var(--tt-radius-pill)',
      background: 'var(--tt-soft-blue)',
      overflow: 'hidden',
    }}>
      <div style={{
        width: `${fraction * 100}%`,
        height: '100%',
        background: color,
        borderRadius: 'var(--tt-radius-pill)',
        transition: 'width 450ms cubic-bezier(0.34,1.3,0.64,1)',
      }} />
    </div>
  );
}
